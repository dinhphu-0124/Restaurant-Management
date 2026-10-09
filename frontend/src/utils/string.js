export const removeVietnameseTones = (str = "") => {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

/**
 * Kiểm tra xem chuỗi sub có phải là chuỗi con thứ tự (subsequence) của str không
 * Ví dụ: sub "ld" là subsequence của "lau de", "laud" là subsequence của "lau de"
 */
const isSubsequence = (sub, str) => {
  if (!sub || !str) return false;
  let i = 0, j = 0;
  while (i < sub.length && j < str.length) {
    if (sub[i] === str[j]) i++;
    j++;
  }
  return i === sub.length;
};

/**
 * Tính khoảng cách Levenshtein giữa 2 từ ngắn để xử lý lỗi gõ sai chính tả
 */
const levenshteinDistance = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

/**
 * Tính điểm độ phù hợp (Relevance Score) của một item tìm kiếm
 * Trả về 0 nếu không khớp, > 0 thể hiện độ ưu tiên từ cao xuống thấp
 */
export const calculateSearchScore = (item, rawKeyword) => {
  if (!rawKeyword || !String(rawKeyword).trim()) return 1;

  const keyword = removeVietnameseTones(rawKeyword);
  if (!keyword) return 1;

  const keywordWords = keyword.split(/\s+/).filter(Boolean);
  const keywordNoSpace = keyword.replace(/\s+/g, "");

  // Trích xuất các trường tìm kiếm
  const nameRaw =
    item?.name ||
    item?.fullName ||
    item?.foodName ||
    item?.customerName ||
    item?.label ||
    item?.title ||
    (typeof item === "string" ? item : "");
  const nameClean = removeVietnameseTones(nameRaw);
  const nameNoSpace = nameClean.replace(/\s+/g, "");
  const nameWords = nameClean.split(/\s+/).filter(Boolean);

  const codeRaw = item?.code || item?.orderCode || item?.tableCode || item?.id || "";
  const codeClean = removeVietnameseTones(String(codeRaw));

  const phoneRaw = item?.phone || item?.customerPhone || "";
  const phoneClean = removeVietnameseTones(String(phoneRaw));

  const emailRaw = item?.email || "";
  const emailClean = removeVietnameseTones(String(emailRaw));

  const categoryRaw =
    item?.category ||
    item?.parentCategory ||
    item?.subCategory ||
    item?.categoryName ||
    item?.area ||
    item?.selectedAreaTitle ||
    item?.tableName ||
    "";
  const categoryClean = removeVietnameseTones(categoryRaw);

  const descRaw =
    item?.shortDescription ||
    item?.description ||
    item?.detailDescription ||
    item?.notes ||
    "";
  const descClean = removeVietnameseTones(descRaw);

  // ─── 1. TÊN CHÍNH XÁC HOÀN TOÀN ───
  if (nameClean === keyword) return 10000;

  // ─── 2. TÊN BẮT ĐẦU BẰNG TỪ KHÓA (Ví dụ gõ "L" -> "Lẩu...", gõ "lau" -> "Lẩu...") ───
  if (nameClean.startsWith(keyword)) return 8500;

  // ─── 3. CÓ TỪ TRONG TÊN BẮT ĐẦU BẰNG TỪ KHÓA (Ví dụ gõ "de" -> "Thịt dê", "lau" -> "Set lẩu...") ───
  const wordPrefixMatch = nameWords.some((w) => w.startsWith(keyword));
  if (wordPrefixMatch) return 7500;

  // ─── 4. VIẾT TẮT CHỮ CÁI ĐẦU (Acronym - Ví dụ "ld" -> "lẩu dê", "nx" -> "nướng xèo") ───
  const nameAcronym = nameWords.map((w) => w[0]).join("");
  if (
    keyword.length >= 2 &&
    (nameAcronym.startsWith(keyword) || nameAcronym.includes(keyword))
  ) {
    return 7000;
  }

  // ─── 5. TÊN MÓN CHỨA TOÀN BỘ CỤM TỪ KHÓA ───
  if (nameClean.includes(keyword)) return 6000;

  // ─── 6. TÊN MÓN KHÔNG DẤU LIỀN NHAU CHỨA TỪ KHÓA (Ví dụ "laude" -> "lau de") ───
  if (nameNoSpace.includes(keywordNoSpace)) return 5500;

  // ─── 7. TÊN MÓN CHỨA TẤT CẢ CÁC TỪ TRONG KEYWORD ───
  if (keywordWords.length > 1 && keywordWords.every((kw) => nameClean.includes(kw))) {
    return 5000;
  }

  // ─── 8. CHUỖI CON THỨ TỰ (Subsequence matching trong tên - gõ tắt hoặc thiếu chữ) ───
  if (keyword.length >= 2 && isSubsequence(keywordNoSpace, nameNoSpace)) {
    return 4500;
  }

  // ─── 9. TÊN MÓN CHỨA MỘT PHẦN CÁC TỪ TRONG TỪ KHÓA ───
  const matchedWordsInName = keywordWords.filter((kw) =>
    nameWords.some((nw) => nw.startsWith(kw) || nw.includes(kw))
  ).length;
  if (matchedWordsInName > 0) {
    return 3000 + (matchedWordsInName / keywordWords.length) * 1500;
  }

  // ─── 10. LỖI CHÍNH TẢ NHẸ (Typo tolerance - khoảng cách Levenshtein <= 1 cho từ >= 3 ký tự) ───
  if (keywordWords.some((kw) => kw.length >= 3 && nameWords.some((nw) => nw.length >= 3 && levenshteinDistance(kw, nw) <= 1))) {
    return 2500;
  }

  // ─── 11. KHỚP MÃ (Mã món, Mã bàn, Mã đơn, ID, SĐT, Email) ───
  if (codeClean && (codeClean === keyword || codeClean.includes(keyword))) return 2000;
  if (phoneClean && (phoneClean === keyword || phoneClean.includes(keyword))) return 2000;
  if (emailClean && (emailClean === keyword || emailClean.includes(keyword))) return 1800;

  // ─── 12. KHỚP DANH MỤC / KHU VỰC / BÀN ───
  if (categoryClean && categoryClean.includes(keyword)) return 1000;
  if (categoryClean && keywordWords.some((kw) => categoryClean.includes(kw))) return 800;

  // ─── 13. KHỚP NỘI DUNG MÔ TẢ (Chỉ cho 50 - 100 điểm để không vượt mặt món trùng tên) ───
  if (descClean && descClean.includes(keyword)) return 100;
  if (descClean && keywordWords.some((kw) => descClean.includes(kw))) return 50;

  return 0; // Không khớp
};

/**
 * Hàm lọc và tự động xếp hạng danh sách theo độ liên quan tìm kiếm
 */
export const fuzzyFilterAndRank = (items = [], rawKeyword = "", extractItem = (i) => i) => {
  if (!rawKeyword || !String(rawKeyword).trim()) return items;

  const scored = [];
  for (const item of items) {
    const target = extractItem(item);
    const score = calculateSearchScore(target, rawKeyword);
    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
};

