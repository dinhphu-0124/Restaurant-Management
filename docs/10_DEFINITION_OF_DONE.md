# 10. DEFINITION OF DONE (DoD)

---

Một tính năng, bản sửa lỗi (bugfix) hoặc đợt tái cấu trúc (refactoring) chỉ được xem là **HOÀN THÀNH (DONE)** khi thỏa mãn 100% các tiêu chí sau:

1. **Mã nguồn Sạch & Đúng Chuẩn**:
   * Tuân thủ các quy tắc trong `00_PROJECT_RULES.md` đến `09_AI_CODING_RULES.md`.
   * Không còn chú thích `TODO` hoặc placeholder chưa hoàn thiện.
2. **Build & Syntax Vượt Qua**:
   * Frontend: `npm run build` thành công, không có lỗi import hay cú pháp.
   * Backend: Khởi động không có exception, không có runtime crash.
3. **Bảo Mật Được Đảm Bảo**:
   * Không lộ API keys, database credentials hay `error.message` raw ra ngoài client.
   * Phân quyền (Authorization) và Rate limiting được áp dụng đúng chuẩn.
4. **Hiệu Năng & Truy Vấn Tối Ưu**:
   * Không còn câu lệnh truy vấn toàn bộ bảng vào RAM để lọc bằng Javascript.
   * Tất cả các danh sách đều có phân trang (`limit` & `offset`).
5. **Kiểm Thử & Xác Thực**:
   * Các ca kiểm thử tự động (Unit / Integration Tests) chạy thành công 100%.
   * Không xuất hiện lỗi hồi quy (No regressions) trên các tính năng hiện hữu.
6. **Tài Liệu Đồng Bộ**:
   * Tài liệu trong thư mục `/docs` được cập nhật khớp chính xác với source code hiện tại.
