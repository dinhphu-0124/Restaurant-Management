import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  Utensils,
  Tag,
  DollarSign,
  FileText,
  Soup,
  Flame,
  Sparkles,
  Layers,
  Wine,
  Trash2,
  CheckCircle2,
  Crown,
  Heart,
  Clock,
  Minus,
  Check,
  ChevronDown,
  ChevronUp,
  PauseCircle,
  Ban,
  Award,
  Zap,
  SlidersHorizontal,
  Thermometer,
  ChefHat,
  Fish,
  Settings,
  BookmarkCheck,
  History,
  BookOpen,
  PlusCircle,
  Image as ImageIcon,
} from "lucide-react";

const STATUS_OPTIONS = [
  {
    value: "selling",
    label: "Đang bán",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    value: "paused",
    label: "Tạm ngưng",
    icon: PauseCircle,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    value: "stopped",
    label: "Ngừng bán",
    icon: Ban,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
];

const BADGE_OPTIONS = [
  {
    value: "",
    label: "Không có",
    icon: Minus,
    color: "text-slate-400",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
  {
    value: "Đặc sản",
    label: "Đặc sản",
    icon: Sparkles,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    value: "Bán chạy",
    label: "Bán chạy",
    icon: Flame,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  {
    value: "Món mới",
    label: "Món mới",
    icon: Zap,
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    value: "Món ăn đặc sắc",
    label: "Món ăn đặc sắc",
    icon: Crown,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    value: "Món ăn tâm huyết",
    label: "Món ăn tâm huyết",
    icon: Heart,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  {
    value: "Sắp hết",
    label: "Sắp hết",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
];

export function getCategorySpecsPresets(category = "", subCategory = "", name = "") {
  const text = `${category} ${subCategory} ${name}`.toLowerCase();

  // 1. BIA
  if (text.includes("bia")) {
    return {
      groupName: "Bia & Đồ uống có cồn",
      portionLabel: "Quy cách / Thể tích",
      portionIcon: Wine,
      portionPlaceholder: "VD: 1 lon (330ml), Chai 500ml, Tháp 3L...",
      portionPresets: ["1 lon (330ml)", "1 chai (330ml)", "1 chai (500ml)", "1 két (24 lon)", "1 tháp (3 lít)", "1 ly"],
      cookingLabel: "Phục vụ / Nhiệt độ",
      cookingIcon: Thermometer,
      cookingPlaceholder: "VD: Ướp lạnh kèm đá, Bia tươi...",
      cookingPresets: ["Ướp lạnh kèm đá", "Ướp lạnh (không đá)", "Uống kèm đá bi", "Nhiệt độ phòng"],
      timeLabel: "Thời gian phục vụ",
      timeIcon: Clock,
      timePlaceholder: "VD: Phục vụ ngay, 1 - 3 phút...",
      timePresets: ["Phục vụ ngay", "1 - 3 phút", "3 - 5 phút"],
    };
  }

  // 2. RƯỢU
  if (text.includes("rượu") || text.includes("ngọc dương") || text.includes("vodka") || text.includes("whisky")) {
    return {
      groupName: "Rượu & Đặc sản ngâm",
      portionLabel: "Quy cách / Thể tích",
      portionIcon: Wine,
      portionPlaceholder: "VD: Chai 500ml, Bình 1L, Hũ sành...",
      portionPresets: ["Chai 500ml", "Chai 750ml", "Bình 1 lít", "1 xị (250ml)", "Hũ sành 500ml", "Chén / Ly nhỏ"],
      cookingLabel: "Cách dùng / Phục vụ",
      cookingIcon: Thermometer,
      cookingPlaceholder: "VD: Dùng trực tiếp, Hâm nóng, Ướp lạnh...",
      cookingPresets: ["Dùng trực tiếp", "Hâm nóng", "Ướp lạnh", "Uống kèm đá", "Dùng kèm đồ nhắm"],
      timeLabel: "Thời gian phục vụ",
      timeIcon: Clock,
      timePlaceholder: "VD: Phục vụ ngay, 1 - 3 phút...",
      timePresets: ["Phục vụ ngay", "1 - 3 phút", "3 - 5 phút"],
    };
  }

  // 3. NƯỚC NGỌT / ĐỒ UỐNG / NƯỚC SUỐI / TRÀ
  if (
    text.includes("nước ngọt") ||
    text.includes("đồ uống") ||
    text.includes("coca") ||
    text.includes("pepsi") ||
    text.includes("7 up") ||
    text.includes("bò húc") ||
    text.includes("lavie") ||
    text.includes("trà đá") ||
    text.includes("nước cam") ||
    text.includes("nước suối") ||
    text.includes("tráng miệng")
  ) {
    return {
      groupName: "Đồ uống giải khát",
      portionLabel: "Quy cách / Thể tích",
      portionIcon: Wine,
      portionPlaceholder: "VD: 1 lon (330ml), Chai 500ml, 1 ly...",
      portionPresets: ["1 lon (330ml)", "Chai 500ml", "1 ly (350ml)", "Ca 2 lít", "Bình 500ml", "Lon 250ml"],
      cookingLabel: "Phục vụ / Nhiệt độ",
      cookingIcon: Thermometer,
      cookingPlaceholder: "VD: Mát lạnh kèm đá, Ướp lạnh...",
      cookingPresets: ["Mát lạnh kèm đá", "Ướp lạnh (không đá)", "Dùng đá riêng", "Nhiệt độ phòng", "Uống nóng"],
      timeLabel: "Thời gian phục vụ",
      timeIcon: Clock,
      timePlaceholder: "VD: Phục vụ ngay, 1 - 3 phút...",
      timePresets: ["Phục vụ ngay", "1 - 3 phút", "3 - 5 phút"],
    };
  }

  // 4. MÓN LẨU / NHÂN LẨU
  if (text.includes("lẩu") || text.includes("nhân lẩu")) {
    return {
      groupName: "Món lẩu & Nước dùng",
      portionLabel: "Khẩu phần / Quy cách lẩu",
      portionIcon: Soup,
      portionPlaceholder: "VD: Nồi nhỏ (2 - 3 người), Nồi lớn...",
      portionPresets: ["Nồi nhỏ (2 - 3 người)", "Nồi lớn (4 - 6 người)", "Nồi đặc biệt (6 - 8 người)", "1 đĩa thêm", "1 phần lẩu"],
      cookingLabel: "Quy cách nấu & Nước dùng",
      cookingIcon: Flame,
      cookingPlaceholder: "VD: Lẩu thuốc bắc, Lẩu sa tế cay nồng...",
      cookingPresets: ["Lẩu thuốc bắc gia truyền", "Lẩu nhúng mẻ thanh ngọt", "Lẩu sa tế cay nồng", "Nấu lẩu kèm rau nấm", "Lẩu riêu cua đồng"],
      timeLabel: "Thời gian chuẩn bị",
      timeIcon: Clock,
      timePlaceholder: "VD: 10 - 15 phút, 15 - 20 phút...",
      timePresets: ["10 - 15 phút", "15 - 20 phút", "20 - 25 phút"],
    };
  }

  // 5. MÓN NƯỚNG / SƯỜN DÊ / NẦM DÊ
  if (text.includes("nướng") || text.includes("sườn") || text.includes("nầm")) {
    return {
      groupName: "Món nướng",
      portionLabel: "Khẩu phần / Khối lượng",
      portionIcon: Utensils,
      portionPlaceholder: "VD: Đĩa 2 - 3 người, Theo kg...",
      portionPresets: ["Đĩa 2 - 3 người", "Đĩa 4 - 6 người", "1 đĩa tiêu chuẩn", "Theo kg (0.5kg)", "Theo kg (1kg)"],
      cookingLabel: "Quy cách nướng",
      cookingIcon: Flame,
      cookingPlaceholder: "VD: Nướng than hoa, Nướng muối ớt...",
      cookingPresets: ["Nướng than hoa", "Nướng muối ớt", "Nướng sa tế cay", "Nướng ngũ vị", "Nướng chao thơm", "Nướng tảng than hồng"],
      timeLabel: "Thời gian nướng",
      timeIcon: Clock,
      timePlaceholder: "VD: 15 - 20 phút, 20 - 25 phút...",
      timePresets: ["15 - 20 phút", "20 - 25 phút", "25 - 30 phút"],
    };
  }

  // 6. DÊ HẤP / TÁI
  if (text.includes("hấp") || text.includes("tái")) {
    return {
      groupName: "Món hấp & Tái",
      portionLabel: "Khẩu phần / Trọng lượng",
      portionIcon: Utensils,
      portionPlaceholder: "VD: Đĩa 2 - 3 người, Đĩa 4 - 6 người...",
      portionPresets: ["Đĩa 2 - 3 người", "Đĩa 4 - 6 người", "1 đĩa tiêu chuẩn", "Theo kg (0.5kg)", "Theo kg (1kg)"],
      cookingLabel: "Quy cách chế biến",
      cookingIcon: ChefHat,
      cookingPlaceholder: "VD: Hấp tía tô nóng hổi, Tái chanh...",
      cookingPresets: ["Hấp tía tô nóng hổi", "Hấp sả gừng", "Tái chanh tươi", "Tái mè vừng", "Cuộn bánh tráng rau rừng"],
      timeLabel: "Thời gian chế biến",
      timeIcon: Clock,
      timePlaceholder: "VD: 10 - 15 phút, 12 - 18 phút...",
      timePresets: ["10 - 15 phút", "12 - 18 phút", "15 - 20 phút"],
    };
  }

  // 7. DÊ XÀO / CHIÊN / DỒI DÊ / LÒNG DÊ
  if (text.includes("xào") || text.includes("chiên") || text.includes("dồi") || text.includes("lòng")) {
    return {
      groupName: "Món xào & Chiên",
      portionLabel: "Khẩu phần",
      portionIcon: Utensils,
      portionPlaceholder: "VD: Đĩa 2 - 3 người, 1 đĩa...",
      portionPresets: ["Đĩa 2 - 3 người", "Đĩa 4 - 6 người", "1 đĩa tiêu chuẩn", "Phần 1 người"],
      cookingLabel: "Quy cách chế biến",
      cookingIcon: Flame,
      cookingPlaceholder: "VD: Xào sả ớt, Xào lăn nước cốt dừa...",
      cookingPresets: ["Xào sả ớt cay nồng", "Xào lăn nước cốt dừa", "Xào sa tế", "Chiên giòn rụm", "Chao tỏi giòn thơm"],
      timeLabel: "Thời gian chế biến",
      timeIcon: Clock,
      timePlaceholder: "VD: 8 - 12 phút, 10 - 15 phút...",
      timePresets: ["8 - 12 phút", "10 - 15 phút", "15 - 20 phút"],
    };
  }

  // 8. MÓN HẦM / TIỀM / NGỌC DƯƠNG / SÚP
  if (text.includes("hầm") || text.includes("tiềm") || text.includes("súp")) {
    return {
      groupName: "Món hầm & Tiềm bổ dưỡng",
      portionLabel: "Khẩu phần / Quy cách thố",
      portionIcon: Soup,
      portionPlaceholder: "VD: Thố 2 - 3 người, 1 bát...",
      portionPresets: ["Thố 2 - 3 người", "Thố 4 - 6 người", "1 bát / phần", "1 thố tiềm", "Nồi hầm nguyên bộ"],
      cookingLabel: "Phương pháp hầm / tiềm",
      cookingIcon: ChefHat,
      cookingPlaceholder: "VD: Hầm thuốc bắc, Tiềm thảo mộc...",
      cookingPresets: ["Hầm thuốc bắc gia truyền", "Tiềm thảo mộc bổ dưỡng", "Hầm ngải cứu", "Hầm đậu đen cốt dừa", "Nấu súp bổ dưỡng"],
      timeLabel: "Thời gian hầm & ninh",
      timeIcon: Clock,
      timePlaceholder: "VD: 15 - 20 phút, 20 - 25 phút...",
      timePresets: ["15 - 20 phút", "20 - 25 phút", "25 - 30 phút"],
    };
  }

  // 9. HẢI SẢN (CÁ / MỰC / TÔM)
  if (text.includes("hải sản") || text.includes("cá") || text.includes("mực") || text.includes("tôm")) {
    return {
      groupName: "Hải sản tươi sống",
      portionLabel: "Khẩu phần / Trọng lượng",
      portionIcon: Fish,
      portionPlaceholder: "VD: Đĩa 2 - 3 người, Theo kg...",
      portionPresets: ["Đĩa 2 - 3 người", "Đĩa 4 - 6 người", "Theo kg (0.5kg)", "Theo kg (1kg)", "1 con (tiêu chuẩn)"],
      cookingLabel: "Quy cách chế biến hải sản",
      cookingIcon: Flame,
      cookingPlaceholder: "VD: Hấp gừng hành, Nướng muối ớt...",
      cookingPresets: ["Hấp gừng hành", "Nướng muối ớt", "Chiên giòn mắm tỏi", "Sốt me chua ngọt", "Nấu lẩu hải sản"],
      timeLabel: "Thời gian chế biến",
      timeIcon: Clock,
      timePlaceholder: "VD: 10 - 15 phút, 15 - 20 phút...",
      timePresets: ["10 - 15 phút", "15 - 20 phút", "20 - 25 phút"],
    };
  }

  // 10. COMBO / SET MENU
  if (text.includes("combo") || text.includes("set")) {
    return {
      groupName: "Combo / Set tiệc",
      portionLabel: "Khẩu phần set",
      portionIcon: Layers,
      portionPlaceholder: "VD: Set 2 - 3 người, Set tiệc...",
      portionPresets: ["Set 2 - 3 người", "Set 4 - 6 người", "Set 6 - 8 người", "Set tiệc 10 người"],
      cookingLabel: "Hình thức phục vụ",
      cookingIcon: ChefHat,
      cookingPlaceholder: "VD: Phục vụ theo set đầy đủ...",
      cookingPresets: ["Phục vụ theo set đầy đủ", "Combo lẩu & nướng", "Món khai vị đến món chính", "Kèm tráng miệng"],
      timeLabel: "Thời gian chuẩn bị set",
      timeIcon: Clock,
      timePlaceholder: "VD: 15 - 20 phút, 20 - 25 phút...",
      timePresets: ["15 - 20 phút", "20 - 25 phút", "25 - 30 phút"],
    };
  }

  // 11. KHAI VỊ / RAU / ĂN NO / GỎI / CƠM
  if (
    text.includes("khai vị") ||
    text.includes("rau") ||
    text.includes("ăn no") ||
    text.includes("cơm") ||
    text.includes("mì") ||
    text.includes("cháo") ||
    text.includes("gỏi")
  ) {
    return {
      groupName: "Khai vị, Rau & Cơm mì",
      portionLabel: "Khẩu phần",
      portionIcon: Utensils,
      portionPlaceholder: "VD: 1 đĩa tiêu chuẩn, Đĩa 2 - 3 người...",
      portionPresets: ["1 đĩa tiêu chuẩn", "Đĩa 2 - 3 người", "Đĩa 4 - 6 người", "1 thố / tô", "1 phần"],
      cookingLabel: "Cách thức chế biến",
      cookingIcon: ChefHat,
      cookingPlaceholder: "VD: Trộn gỏi chua ngọt, Xào tỏi...",
      cookingPresets: ["Trộn gỏi chua ngọt", "Luộc chấm kho quẹt", "Xào tỏi thơm lừng", "Chiên giòn", "Nấu cháo ninh nhừ"],
      timeLabel: "Thời gian chế biến",
      timeIcon: Clock,
      timePlaceholder: "VD: 5 - 8 phút, 8 - 12 phút...",
      timePresets: ["5 - 8 phút", "8 - 12 phút", "10 - 15 phút"],
    };
  }

  // DEFAULT DÊ / MÓN CHÍNH
  return {
    groupName: "Món chính đặc sản",
    portionLabel: "Khẩu phần",
    portionIcon: Utensils,
    portionPlaceholder: "VD: 2 - 3 người, Đĩa 4 - 6 người...",
    portionPresets: ["2 - 3 người", "4 - 6 người", "1 đĩa tiêu chuẩn", "Nồi lẩu", "1 bát / phần"],
    cookingLabel: "Quy cách chế biến",
    cookingIcon: ChefHat,
    cookingPlaceholder: "VD: Nóng hổi, Nướng than hoa...",
    cookingPresets: ["Nóng hổi", "Nướng than hoa", "Hấp tía tô", "Tái chanh tươi", "Chiên giòn", "Hầm thảo mộc"],
    timeLabel: "Thời gian phục vụ",
    timeIcon: Clock,
    timePlaceholder: "VD: 10 - 15 phút, 15 - 20 phút...",
    timePresets: ["Phục vụ ngay", "5 - 10 phút", "10 - 15 phút", "15 - 20 phút", "20 - 25 phút"],
  };
}

const SPECS_MEMORY_KEY = "restaurant_category_specs_memory_v3";
const CUSTOM_TAGS_KEY = "restaurant_custom_specs_tags_v3";

export function getSpecsMemoryKey(category = "", subCategory = "") {
  return `${String(category || "").trim()}__${String(subCategory || "").trim()}`.toLowerCase();
}

export function getRememberedSpecs(category = "", subCategory = "") {
  try {
    const raw = localStorage.getItem(SPECS_MEMORY_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const key = getSpecsMemoryKey(category, subCategory);
    return data[key] || data[String(category || "").toLowerCase()] || null;
  } catch {
    return null;
  }
}

export function saveCategorySpecs(category = "", subCategory = "", specs = {}) {
  try {
    if (!category) return;
    const raw = localStorage.getItem(SPECS_MEMORY_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const key = getSpecsMemoryKey(category, subCategory);
    data[key] = {
      ...(data[key] || {}),
      ...specs,
      updatedAt: Date.now(),
    };
    data[String(category).toLowerCase()] = {
      ...(data[String(category).toLowerCase()] || {}),
      ...specs,
      updatedAt: Date.now(),
    };
    localStorage.setItem(SPECS_MEMORY_KEY, JSON.stringify(data));
  } catch {}
}

export function getCustomTags() {
  try {
    const raw = localStorage.getItem(CUSTOM_TAGS_KEY);
    return raw ? JSON.parse(raw) : { portion: [], cooking: [], time: [] };
  } catch {
    return { portion: [], cooking: [], time: [] };
  }
}

export function saveCustomTag(type, tag) {
  try {
    const current = getCustomTags();
    const cleanTag = String(tag || "").trim();
    if (!cleanTag) return current;
    const list = current[type] || [];
    if (!list.includes(cleanTag)) {
      current[type] = [...list, cleanTag];
      localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(current));
    }
    return current;
  } catch {
    return { portion: [], cooking: [], time: [] };
  }
}

export function deleteCustomTag(type, tag) {
  try {
    const current = getCustomTags();
    current[type] = (current[type] || []).filter((t) => t !== tag);
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(current));
    return current;
  } catch {
    return { portion: [], cooking: [], time: [] };
  }
}

export const ALL_SPECS_REPOSITORY = {
  portions: [
    "1 lon (330ml)", "Chai 500ml", "1 ly (350ml)", "Ca 2 lít", "Bình 1 lít",
    "1 chai (330ml)", "1 két (24 lon)", "1 tháp (3 lít)", "1 xị (250ml)", "Hũ sành 500ml",
    "1 đĩa tiêu chuẩn", "2 - 3 người", "4 - 6 người", "Nồi nhỏ (2 - 3 người)", "Nồi lớn (4 - 6 người)",
    "Theo kg (0.5kg)", "Theo kg (1kg)", "Set 2 - 3 người", "Set 4 - 6 người", "1 thố / bát", "Phần 1 người"
  ],
  cookings: [
    "Ướp lạnh kèm đá", "Ướp lạnh (không đá)", "Mát lạnh kèm đá", "Dùng trực tiếp", "Hâm nóng",
    "Hấp tía tô nóng hổi", "Hấp sả gừng", "Tái chanh tươi", "Tái mè vừng", "Cuộn bánh tráng",
    "Nướng than hoa", "Nướng muối ớt", "Nướng sa tế cay", "Nướng ngũ vị", "Nướng chao thơm", "Nướng tảng",
    "Xào sả ớt cay nồng", "Xào lăn nước cốt dừa", "Xào sa tế", "Chiên giòn rụm", "Chao tỏi giòn",
    "Hầm thuốc bắc gia truyền", "Tiềm thảo mộc", "Hầm ngải cứu", "Hấp gừng hành", "Trộn gỏi chua ngọt",
    "Phục vụ theo set đầy đủ"
  ],
  times: [
    "Phục vụ ngay", "1 - 3 phút", "3 - 5 phút", "5 - 8 phút", "8 - 12 phút",
    "10 - 15 phút", "15 - 20 phút", "20 - 25 phút", "25 - 30 phút"
  ]
};

function LuxurySelect({ label, value, onChange, options, placeholder = "Chọn" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt =
    options.find((opt) => opt.value === value) ||
    (value
      ? {
          value,
          label: value,
          icon: Award,
          color: "text-emerald-700",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
        }
      : options[0]);

  const SelectedIcon = selectedOpt?.icon || Minus;

  return (
    <div className="space-y-1 text-left relative" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-11 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none hover:border-primary/50 focus:border-primary bg-white shadow-2xs flex items-center justify-between transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
              selectedOpt?.bg || "bg-slate-100"
            } ${selectedOpt?.color || "text-slate-500"}`}
          >
            <SelectedIcon size={13} strokeWidth={2.2} />
          </span>
          <span className="truncate">{selectedOpt?.label || placeholder}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((opt) => {
            const isSelected = (value || "") === (opt.value || "");
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors text-left cursor-pointer ${
                  isSelected
                    ? "bg-slate-50 text-slate-900 font-black"
                    : "text-slate-700 hover:bg-slate-50/80 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      opt.bg || "bg-slate-100"
                    } ${opt.color || "text-slate-500"}`}
                  >
                    <Icon size={13} strokeWidth={2.2} />
                  </span>
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check size={14} className="text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminFoodFormModal({
  isAddFoodOpen,
  setIsAddFoodOpen,
  editingFood,
  setEditingFood,
  editForm,
  setEditForm,
  emptyFoodForm,
  categoryOptions,
  showOtherCategories,
  setShowOtherCategories,
  addFormTab,
  setAddFormTab,
  handleFoodImagesChange,
  moveImage,
  saveAddFood,
  isLoading,
  onOpenCategoryModal,
}) {
  if (!isAddFoodOpen) return null;

  const [customTags, setCustomTags] = useState(() => getCustomTags());
  const [showAllLibrary, setShowAllLibrary] = useState(false);
  const [addingTagType, setAddingTagType] = useState(null);
  const [newTagText, setNewTagText] = useState("");
  const [localCategories, setLocalCategories] = useState([]);

  // Listen to category updates and automatically select newly created category
  useEffect(() => {
    const handleCategoryUpdate = (event) => {
      const detail = event?.detail;
      if (detail?.newCategory?.name) {
        const newCatName = detail.newCategory.name;
        handleCategoryChange(newCatName);
        setLocalCategories((prev) => {
          if (!prev.some((c) => c.value === newCatName)) {
            return [...prev, { label: newCatName, value: newCatName }];
          }
          return prev;
        });
      }
    };
    window.addEventListener("categoriesUpdated", handleCategoryUpdate);
    return () => {
      window.removeEventListener("categoriesUpdated", handleCategoryUpdate);
    };
  }, []);

  const mergedCategoryOptions = useMemo(() => {
    const options = [...(categoryOptions || [])];
    localCategories.forEach((localCat) => {
      if (!options.some((o) => o.value === localCat.value)) {
        options.push(localCat);
      }
    });
    if (editForm.category && !options.some((o) => o.value === editForm.category)) {
      options.push({ label: editForm.category, value: editForm.category });
    }
    return options;
  }, [categoryOptions, localCategories, editForm.category]);

  const rememberedSpecs = useMemo(
    () => getRememberedSpecs(editForm.category, editForm.subCategory),
    [editForm.category, editForm.subCategory]
  );

  const specsConfig = useMemo(
    () =>
      getCategorySpecsPresets(
        editForm.category,
        editForm.subCategory,
        editForm.name
      ),
    [editForm.category, editForm.subCategory, editForm.name]
  );

  const PortionIcon = specsConfig.portionIcon;
  const CookingIcon = specsConfig.cookingIcon;
  const TimeIcon = specsConfig.timeIcon;

  const handleUpdateSpec = (field, value) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value };
      saveCategorySpecs(updated.category, updated.subCategory, {
        [field]: value,
      });
      return updated;
    });
  };

  const handleAddCustomTag = (type) => {
    if (!newTagText.trim()) {
      setAddingTagType(null);
      return;
    }
    const updated = saveCustomTag(type, newTagText.trim());
    setCustomTags(updated);
    handleUpdateSpec(type, newTagText.trim());
    setNewTagText("");
    setAddingTagType(null);
  };

  const handleDeleteCustomTag = (type, tag) => {
    const updated = deleteCustomTag(type, tag);
    setCustomTags(updated);
  };

  const handleCategoryChange = (newCat) => {
    const isOther = newCat === "Món khác";
    const newSubCat = isOther ? editForm.subCategory : "";
    const remembered = getRememberedSpecs(newCat, newSubCat);
    const calculated = getCategorySpecsPresets(newCat, newSubCat, editForm.name);

    const finalPortion =
      remembered?.portion || calculated.portionPresets[0] || "";
    const finalCooking =
      remembered?.cooking || calculated.cookingPresets[0] || "";
    const finalTime = remembered?.time || calculated.timePresets[0] || "";

    setEditForm((prev) => ({
      ...prev,
      category: newCat,
      subCategory: newSubCat,
      portion: finalPortion,
      cooking: finalCooking,
      time: finalTime,
    }));
    setShowOtherCategories(isOther);
    saveCategorySpecs(newCat, newSubCat, {
      portion: finalPortion,
      cooking: finalCooking,
      time: finalTime,
    });
  };

  const handleSubCategoryChange = (child) => {
    const remembered = getRememberedSpecs(editForm.category, child);
    const calculated = getCategorySpecsPresets(
      editForm.category,
      child,
      editForm.name
    );

    const finalPortion =
      remembered?.portion || calculated.portionPresets[0] || "";
    const finalCooking =
      remembered?.cooking || calculated.cookingPresets[0] || "";
    const finalTime = remembered?.time || calculated.timePresets[0] || "";

    setEditForm((prev) => ({
      ...prev,
      subCategory: child,
      portion: finalPortion,
      cooking: finalCooking,
      time: finalTime,
    }));
    saveCategorySpecs(editForm.category, child, {
      portion: finalPortion,
      cooking: finalCooking,
      time: finalTime,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={() => {
        setIsAddFoodOpen(false);
        setEditForm(emptyFoodForm);
        setEditingFood(null);
      }}
    >
      <div
        className="w-full max-w-6xl h-[92vh] max-h-[860px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <Utensils size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                  {editingFood ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
                </h3>
                {editingFood?.id && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-black tracking-wider uppercase">
                    {editingFood.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Thiết lập thông tin hiển thị, mức giá và thực đơn nhà hàng
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Đóng"
            onClick={() => {
              setIsAddFoodOpen(false);
              setEditForm(emptyFoodForm);
              setEditingFood(null);
            }}
            className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition cursor-pointer border border-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY (2 BALANCED COLUMNS: LEFT 5/12, RIGHT 7/12) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6">
          {isLoading && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary">
              Đang đồng bộ dữ liệu món ăn...
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI (5/12 COLS): HÌNH ẢNH & THÔNG TIN PHỤC VỤ */}
            <div className="lg:col-span-5 space-y-5">
              {/* KHỐI 1: QUẢN LÝ HÌNH ẢNH */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-primary" />
                    <span>Hình ảnh món ăn</span>
                    <span className="text-slate-400 font-medium">
                      ({editForm.images?.length || (editForm.image ? 1 : 0)})
                    </span>
                  </span>

                  <label className="text-xs font-bold text-primary hover:text-emerald-800 cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition">
                    <Plus size={13} />
                    <span>Tải ảnh mới</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFoodImagesChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Hero Main Image Display */}
                <label className="relative block rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary bg-white overflow-hidden aspect-[16/11] cursor-pointer group shadow-2xs transition">
                  {editForm.image ? (
                    <>
                      <img
                        src={editForm.image}
                        alt={editForm.name || "Ảnh món ăn"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-2xs">
                        <Plus size={18} />
                        <span>Thay đổi ảnh</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center text-2xl shadow-xs mb-2">
                        +
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Chọn ảnh đại diện món ăn
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, WebP tối đa 5MB
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFoodImagesChange}
                    className="hidden"
                  />
                </label>

                {/* Gallery Thumbnails List */}
                {editForm.images?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      Danh sách ảnh phụ (bấm để chọn ảnh chính):
                    </span>
                    <div className="grid grid-cols-5 gap-2">
                      {editForm.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({ ...prev, image: img }))
                            }
                            className={`h-14 w-full rounded-xl overflow-hidden border-2 relative block cursor-pointer transition ${
                              editForm.image === img || index === 0
                                ? "border-primary ring-2 ring-primary/20 shadow-xs"
                                : "border-slate-200 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover"
                            />

                            {(editForm.image === img || index === 0) && (
                              <div className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-primary text-white text-[9px] font-black leading-tight">
                                Chính
                              </div>
                            )}
                          </button>

                          {/* Reorder and Delete Controls */}
                          <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImage(index, -1);
                              }}
                              className="w-5 h-5 rounded-md bg-white/95 shadow text-[10px] font-black text-slate-700 disabled:opacity-30 flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              title="Chuyển sang trái"
                            >
                              <ArrowLeft size={11} />
                            </button>

                            <button
                              type="button"
                              disabled={index === editForm.images.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImage(index, 1);
                              }}
                              className="w-5 h-5 rounded-md bg-white/95 shadow text-[10px] font-black text-slate-700 disabled:opacity-30 flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              title="Chuyển sang phải"
                            >
                              <ArrowRight size={11} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => {
                                const newImages = prev.images.filter(
                                  (_, i) => i !== index
                                );
                                return {
                                  ...prev,
                                  images: newImages,
                                  image:
                                    prev.image === img
                                      ? newImages[0] || ""
                                      : prev.image,
                                };
                              })
                            }
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black opacity-0 group-hover:opacity-100 transition flex items-center justify-center shadow-sm cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 2: THÔNG TIN PHỤC VỤ & CHẾ BIẾN (TỰ ĐỘNG THÍCH ỨNG & GHI NHỚ THEO DANH MỤC) */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <SlidersHorizontal size={13} />
                    </div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider whitespace-nowrap">
                      Thông số phục vụ & chế biến
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    {rememberedSpecs ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 whitespace-nowrap shadow-2xs">
                        <BookmarkCheck size={11} className="text-emerald-600 shrink-0" />
                        <span>Đã nhớ</span>
                      </span>
                    ) : (
                      <span
                        className="px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1 whitespace-nowrap max-w-[130px]"
                        title={specsConfig.groupName}
                      >
                        <History size={10} className="shrink-0" />
                        <span className="truncate">{specsConfig.groupName}</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowAllLibrary((prev) => !prev)}
                      className={`h-6 px-2.5 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                        showAllLibrary
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                      }`}
                      title="Xem toàn bộ kho gợi ý tất cả danh mục"
                    >
                      <BookOpen size={11} className="shrink-0" />
                      <span>{showAllLibrary ? "Thu gọn" : "Kho gợi ý"}</span>
                    </button>
                  </div>
                </div>

                {/* 1. Khẩu phần / Quy cách */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <PortionIcon size={13} className="text-primary" />
                      <span>{specsConfig.portionLabel}</span>
                    </span>

                    {addingTagType !== "portion" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingTagType("portion");
                          setNewTagText("");
                        }}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <PlusCircle size={11} />
                        <span>Thêm tag</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomTag("portion");
                            }
                            if (e.key === "Escape") setAddingTagType(null);
                          }}
                          placeholder="Nhập tag mới..."
                          className="h-5 px-1.5 text-[10px] rounded border border-primary outline-none bg-white w-24"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomTag("portion")}
                          className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px] font-black cursor-pointer"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingTagType(null)}
                          className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={editForm.portion || ""}
                    onChange={(e) => handleUpdateSpec("portion", e.target.value)}
                    placeholder={specsConfig.portionPlaceholder}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-primary bg-white shadow-2xs"
                  />

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      ...specsConfig.portionPresets,
                      ...(customTags.portion || []).filter(
                        (t) => !specsConfig.portionPresets.includes(t)
                      ),
                    ].map((p) => {
                      const isCustom = (customTags.portion || []).includes(p);
                      const isSelected = editForm.portion === p;
                      return (
                        <div
                          key={p}
                          className={`inline-flex items-center rounded-md border text-[10px] font-semibold transition ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateSpec("portion", p)}
                            className="px-2 py-0.5 cursor-pointer whitespace-nowrap"
                          >
                            {p}
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomTag("portion", p);
                              }}
                              className="pr-1 text-slate-400 hover:text-rose-500 cursor-pointer text-[10px]"
                              title="Xóa tag này"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Chế biến / Phục vụ */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CookingIcon size={13} className="text-primary" />
                      <span>{specsConfig.cookingLabel}</span>
                    </span>

                    {addingTagType !== "cooking" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingTagType("cooking");
                          setNewTagText("");
                        }}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <PlusCircle size={11} />
                        <span>Thêm tag</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomTag("cooking");
                            }
                            if (e.key === "Escape") setAddingTagType(null);
                          }}
                          placeholder="Nhập tag mới..."
                          className="h-5 px-1.5 text-[10px] rounded border border-primary outline-none bg-white w-24"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomTag("cooking")}
                          className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px] font-black cursor-pointer"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingTagType(null)}
                          className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={editForm.cooking || ""}
                    onChange={(e) => handleUpdateSpec("cooking", e.target.value)}
                    placeholder={specsConfig.cookingPlaceholder}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-primary bg-white shadow-2xs"
                  />

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      ...specsConfig.cookingPresets,
                      ...(customTags.cooking || []).filter(
                        (t) => !specsConfig.cookingPresets.includes(t)
                      ),
                    ].map((c) => {
                      const isCustom = (customTags.cooking || []).includes(c);
                      const isSelected = editForm.cooking === c;
                      return (
                        <div
                          key={c}
                          className={`inline-flex items-center rounded-md border text-[10px] font-semibold transition ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateSpec("cooking", c)}
                            className="px-2 py-0.5 cursor-pointer whitespace-nowrap"
                          >
                            {c}
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomTag("cooking", c);
                              }}
                              className="pr-1 text-slate-400 hover:text-rose-500 cursor-pointer text-[10px]"
                              title="Xóa tag này"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Thời gian */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <TimeIcon size={13} className="text-primary" />
                      <span>{specsConfig.timeLabel}</span>
                    </span>

                    {addingTagType !== "time" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingTagType("time");
                          setNewTagText("");
                        }}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <PlusCircle size={11} />
                        <span>Thêm tag</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomTag("time");
                            }
                            if (e.key === "Escape") setAddingTagType(null);
                          }}
                          placeholder="Nhập tag mới..."
                          className="h-5 px-1.5 text-[10px] rounded border border-primary outline-none bg-white w-24"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomTag("time")}
                          className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px] font-black cursor-pointer"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingTagType(null)}
                          className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={editForm.time || ""}
                    onChange={(e) => handleUpdateSpec("time", e.target.value)}
                    placeholder={specsConfig.timePlaceholder}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-primary bg-white shadow-2xs"
                  />

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      ...specsConfig.timePresets,
                      ...(customTags.time || []).filter(
                        (t) => !specsConfig.timePresets.includes(t)
                      ),
                    ].map((t) => {
                      const isCustom = (customTags.time || []).includes(t);
                      const isSelected = editForm.time === t;
                      return (
                        <div
                          key={t}
                          className={`inline-flex items-center rounded-md border text-[10px] font-semibold transition ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateSpec("time", t)}
                            className="px-2 py-0.5 cursor-pointer whitespace-nowrap"
                          >
                            {t}
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomTag("time", t);
                              }}
                              className="pr-1 text-slate-400 hover:text-rose-500 cursor-pointer text-[10px]"
                              title="Xóa tag này"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* KHO GỢI Ý MỞ RỘNG (HIỂN THỊ TẤT CẢ DỮ LIỆU KHI CẦN) */}
                {showAllLibrary && (
                  <div className="pt-3 border-t border-slate-200/80 space-y-2.5 animate-in fade-in duration-200">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-600" />
                      <span>Kho gợi ý toàn hệ thống (Bấm để gán nhanh):</span>
                    </span>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">
                          Khẩu phần / Thể tích:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {ALL_SPECS_REPOSITORY.portions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleUpdateSpec("portion", item)}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                                editForm.portion === item
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">
                          Chế biến / Phục vụ:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {ALL_SPECS_REPOSITORY.cookings.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleUpdateSpec("cooking", item)}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                                editForm.cooking === item
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">
                          Thời gian phục vụ:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {ALL_SPECS_REPOSITORY.times.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleUpdateSpec("time", item)}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                                editForm.time === item
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI (7/12 COLS): THÔNG TIN CHÍNH, BẢNG MỨC GIÁ & NỘI DUNG */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. TÊN MÓN ĂN */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Tên món ăn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="VD: Lẩu dê Tứ Xuyên cay, Dê nướng tảng..."
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 text-base font-bold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white shadow-xs transition"
                />
              </div>

              {/* 2. PHÂN LOẠI, TRẠNG THÁI & HUY HIỆU (GRID 3 CỘT GỌN GÀNG) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Danh mục */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      Danh mục
                    </label>
                    {onOpenCategoryModal && (
                      <button
                        type="button"
                        onClick={onOpenCategoryModal}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        title="Mở bảng quản lý thêm, sửa, xóa danh mục"
                      >
                        <Settings size={11} />
                        <span>Quản lý</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={editForm.category || (mergedCategoryOptions[0]?.value || "Dê hấp")}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-primary bg-white shadow-2xs cursor-pointer"
                  >
                    {mergedCategoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {editForm.category === "Món khác" && (
                    <div className="mt-2 p-2.5 rounded-xl border border-primary/20 bg-primary/5">
                      <span className="text-[11px] font-black text-primary block mb-1.5">
                        Mục con:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          "Hải sản",
                          "Bò",
                          "Heo",
                          "Gà",
                          "Vịt",
                          "Ếch",
                          "Cá",
                          "Món chay",
                        ].map((child) => (
                          <button
                            type="button"
                            key={child}
                            onClick={() => handleSubCategoryChange(child)}
                            className={`h-7 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              editForm.subCategory === child
                                ? "bg-primary text-white border-primary shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {child}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Trạng thái kinh doanh */}
                <LuxurySelect
                  label="Trạng thái"
                  value={editForm.status || "selling"}
                  onChange={(val) =>
                    setEditForm((prev) => ({
                      ...prev,
                      status: val,
                    }))
                  }
                  options={STATUS_OPTIONS}
                />

                {/* Huy hiệu (Badge) */}
                <LuxurySelect
                  label="Huy hiệu (Badge)"
                  value={editForm.badge || ""}
                  onChange={(val) =>
                    setEditForm((prev) => ({
                      ...prev,
                      badge: val,
                    }))
                  }
                  options={BADGE_OPTIONS}
                  placeholder="Không có"
                />
              </div>

              {/* 3. MỨC GIÁ / QUY CÁCH PHỤC VỤ */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={14} className="text-primary" />
                      <span>Mức giá / Quy cách phục vụ</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                      {(editForm.priceOptions || []).length} mức giá
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditForm((prev) => ({
                        ...prev,
                        priceOptions: [
                          ...(prev.priceOptions || []),
                          {
                            price: "",
                            costPrice: "",
                            note: "",
                            displayOrder: (prev.priceOptions || []).length + 1,
                            isActive: true,
                          },
                        ],
                      }));
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary hover:bg-emerald-800 text-white text-xs font-black transition cursor-pointer shadow-xs"
                  >
                    <Plus size={13} />
                    <span>Thêm mức giá</span>
                  </button>
                </div>

                {/* Price Options List */}
                <div className="space-y-2.5">
                  {(editForm.priceOptions && editForm.priceOptions.length > 0
                    ? editForm.priceOptions
                    : [
                        {
                          price: editForm.price || "",
                          costPrice: editForm.costPrice || "",
                          note: editForm.portion || "Tiêu chuẩn",
                          displayOrder: 1,
                          isActive: true,
                        },
                      ]
                  ).map((opt, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1.4fr_65px_90px_32px] gap-2.5 items-center text-xs font-semibold"
                    >
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                          Giá bán (VNĐ) *
                        </span>
                        <input
                          type="text"
                          value={
                            opt.price
                              ? Number(
                                  String(opt.price).replace(/\D/g, "")
                                ).toLocaleString("vi-VN")
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setEditForm((prev) => {
                              const next = [...(prev.priceOptions || [])];
                              next[idx] = { ...next[idx], price: val };
                              return { ...prev, priceOptions: next };
                            });
                          }}
                          placeholder="250.000"
                          className="w-full h-9 rounded-lg border border-slate-200 px-2 text-sm font-black text-[#b45309] outline-none focus:border-primary bg-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                          Giá vốn (VNĐ)
                        </span>
                        <input
                          type="text"
                          value={
                            opt.costPrice
                              ? Number(
                                  String(opt.costPrice).replace(/\D/g, "")
                                ).toLocaleString("vi-VN")
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setEditForm((prev) => {
                              const next = [...(prev.priceOptions || [])];
                              next[idx] = { ...next[idx], costPrice: val };
                              return { ...prev, priceOptions: next };
                            });
                          }}
                          placeholder="150.000"
                          className="w-full h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-600 outline-none focus:border-primary bg-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                          Quy cách / Ghi chú
                        </span>
                        <input
                          type="text"
                          value={opt.note || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm((prev) => {
                              const next = [...(prev.priceOptions || [])];
                              next[idx] = { ...next[idx], note: val };
                              return { ...prev, priceOptions: next };
                            });
                          }}
                          placeholder="VD: 1/2 kg, Nồi lớn, 1 lon..."
                          className="w-full h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 outline-none focus:border-primary bg-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5 text-center">
                          Thứ tự
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={opt.displayOrder || idx + 1}
                          onChange={(e) => {
                            const val = Number(e.target.value || 1);
                            setEditForm((prev) => {
                              const next = [...(prev.priceOptions || [])];
                              next[idx] = { ...next[idx], displayOrder: val };
                              return { ...prev, priceOptions: next };
                            });
                          }}
                          className="w-full h-9 rounded-lg border border-slate-200 px-1 text-center text-xs font-bold text-slate-700 outline-none focus:border-primary bg-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5 text-center">
                          Trạng thái
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm((prev) => {
                              const next = [...(prev.priceOptions || [])];
                              next[idx] = {
                                ...next[idx],
                                isActive:
                                  next[idx].isActive === false ? true : false,
                              };
                              return { ...prev, priceOptions: next };
                            });
                          }}
                          className={`w-full h-9 rounded-lg text-[11px] font-black transition flex items-center justify-center cursor-pointer ${
                            opt.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {opt.isActive !== false ? "Đang bán" : "Tạm ẩn"}
                        </button>
                      </div>

                      <div className="flex justify-center pt-3">
                        <button
                          type="button"
                          disabled={(editForm.priceOptions || []).length <= 1}
                          onClick={() => {
                            setEditForm((prev) => ({
                              ...prev,
                              priceOptions: prev.priceOptions.filter(
                                (_, i) => i !== idx
                              ),
                            }));
                          }}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 flex items-center justify-center transition cursor-pointer"
                          title="Xóa mức giá này"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. MÔ TẢ NGẮN */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Mô tả ngắn (Hiển thị ở thẻ món ăn thực đơn)
                </label>
                <textarea
                  value={editForm.shortDescription || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                  placeholder="Tóm tắt ngắn gọn đặc trưng của món ăn (1 - 2 câu)..."
                  className="w-full h-16 rounded-xl border border-slate-200 p-3 text-xs text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white resize-none shadow-2xs leading-relaxed"
                />
              </div>

              {/* 5. NỘI DUNG CHI TIẾT (3 TABS: MÔ TẢ, THÀNH PHẦN, HƯƠNG VỊ) */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs bg-white">
                {/* Tabs Navigation Header */}
                <div className="grid grid-cols-3 border-b border-slate-100 text-xs font-black bg-slate-50/70 p-1 gap-1">
                  {[
                    { key: "description", label: "Mô tả", icon: FileText },
                    { key: "ingredients", label: "Thành phần", icon: Soup },
                    { key: "flavor", label: "Hương vị", icon: Flame },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = addFormTab === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setAddFormTab(t.key)}
                        className={`py-2 px-1 text-center font-bold flex items-center justify-center gap-1.5 transition cursor-pointer rounded-xl ${
                          isActive
                            ? "bg-white text-primary border border-slate-200 shadow-xs font-black"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          size={13}
                          className={isActive ? "text-primary" : "text-slate-400"}
                        />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Textarea Content */}
                <div className="p-4 min-h-[160px]">
                  {addFormTab === "description" && (
                    <textarea
                      value={editForm.description || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Mô tả chi tiết nguồn gốc, phong cách chế biến của món ăn..."
                      className="w-full min-h-[120px] bg-transparent outline-none resize-none text-xs sm:text-sm text-slate-700 leading-relaxed placeholder:text-slate-400"
                    />
                  )}

                  {addFormTab === "ingredients" && (
                    <textarea
                      value={editForm.ingredients || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          ingredients: e.target.value,
                        }))
                      }
                      placeholder="Mỗi dòng là một thành phần chính (VD: Thịt dê tươi Hương Sơn, Rau thơm, Nước chấm đặc chế...)"
                      className="w-full min-h-[120px] bg-transparent outline-none resize-none text-xs sm:text-sm text-slate-700 leading-relaxed placeholder:text-slate-400"
                    />
                  )}

                  {addFormTab === "flavor" && (
                    <textarea
                      value={editForm.flavor || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          flavor: e.target.value,
                        }))
                      }
                      placeholder="Mô tả hương vị đặc trưng (VD: Đậm đà thơm thảo mộc tự nhiên, thịt mềm ngọt không tanh...)"
                      className="w-full min-h-[120px] bg-transparent outline-none resize-none text-xs sm:text-sm text-slate-700 leading-relaxed placeholder:text-slate-400"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsAddFoodOpen(false);
              setEditForm(emptyFoodForm);
              setEditingFood(null);
            }}
            className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={saveAddFood}
            className="h-11 px-7 rounded-xl bg-primary hover:bg-emerald-800 text-white font-black text-sm transition cursor-pointer shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
          >
            <span>{editingFood ? "Lưu thay đổi" : "Thêm món ăn"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
