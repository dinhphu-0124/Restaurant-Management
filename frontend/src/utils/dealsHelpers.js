export const DEFAULT_DEAL_TYPES = [
  {
    name: "Combo",
    description: "Áp dụng cho các gói combo/set món ăn định sẵn, giúp khách tiết kiệm chi phí so với gọi món lẻ.",
  },
  {
    name: "Sinh nhật",
    description: "Dành riêng cho khách hàng tổ chức tiệc sinh nhật hoặc có ngày sinh trong tuần/tháng áp dụng.",
  },
  {
    name: "Đặt món",
    description: "Áp dụng khi khách đặt món trực tuyến hoặc gọi món giao tận nơi/mang về.",
  },
  {
    name: "Đặt bàn",
    description: "Áp dụng khi khách hàng đặt giữ chỗ trước qua website hoặc ứng dụng.",
  },
  {
    name: "Ngày lễ",
    description: "Chương trình ưu đãi vào các dịp lễ lớn (Tết, Giáng sinh, 8/3, 20/10, Valentine...).",
  },
  {
    name: "Đặc biệt",
    description: "Các chương trình khuyến mãi độc quyền, flash sale, tri ân khách hàng hoặc sự kiện đặc biệt.",
  },
  {
    name: "Thành viên",
    description: "Ưu đãi dành riêng cho khách hàng thân thiết có hạng thành viên (Bạc, Vàng, Kim Cương).",
  },
];

export const getStoredDealTypes = () => {
  try {
    const raw = localStorage.getItem("app_deal_types_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("Lỗi đọc danh sách loại khuyến mãi:", err);
  }
  return DEFAULT_DEAL_TYPES;
};

export const saveStoredDealTypes = (types) => {
  try {
    localStorage.setItem("app_deal_types_v2", JSON.stringify(types));
    window.dispatchEvent(new Event("deal_types_updated"));
  } catch (err) {
    console.error("Lỗi lưu danh sách loại khuyến mãi:", err);
  }
};

export const EMPTY_DEAL_FORM = {
  code: "", name: "", subtitle: "", type: "Combo", discount: "", condition: "",
  conditionItems: [], serviceConditionItems: { dinein: [], delivery: [], pickup: [] },
  startDate: "", endDate: "", status: "active", usageLimit: "", used: 0,
  totalDiscount: 0, usageHistory: [], desc: "", cardImage: "", detailImage: "",
  bannerImage: "", serviceTypes: ["dinein", "delivery", "pickup"],
};

export const formatMoneyDeal = (value) => Number(value || 0).toLocaleString("vi-VN") + "đ";

export const formatNumberDeal = (value) => Number(value || 0).toLocaleString("vi-VN");

export const formatDateDeal = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const parseVNBoundaryDates = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return { start: null, end: null, isValid: false };
  const sMatch = String(startDateStr).slice(0, 10);
  const eMatch = String(endDateStr).slice(0, 10);
  const start = new Date(`${sMatch}T00:00:00+07:00`);
  const end = new Date(`${eMatch}T23:59:59.999+07:00`);
  const isValid = !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
  return { start, end, isValid, sMatch, eMatch };
};

export const getDealLifecycle = (deal = {}, now = new Date()) => {
  if (!deal) {
    return {
      key: "invalid",
      label: "Dữ liệu không hợp lệ",
      badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
      isUsable: false,
      canPause: false,
      canClone: true,
      warningText: null,
    };
  }

  // 1. Kiểm tra ngày hợp lệ (Ưu tiên số 1: Dữ liệu không hợp lệ)
  const { start, end, isValid } = parseVNBoundaryDates(deal.startDate || deal.start_date, deal.endDate || deal.end_date);
  if (!isValid) {
    return {
      key: "invalid",
      label: "Dữ liệu không hợp lệ",
      badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
      isUsable: false,
      canPause: false,
      canClone: true,
      warningText: "Ngày kết thúc trước ngày bắt đầu",
    };
  }

  // 2. Đã hủy
  if (deal.status === "cancelled") {
    return {
      key: "cancelled",
      label: "Đã hủy",
      badgeClass: "bg-red-50 text-red-600 border border-red-200",
      isUsable: false,
      canPause: false,
      canClone: true,
      warningText: null,
    };
  }

  // 3. Tạm dừng chủ động
  if (deal.status === "paused") {
    const isPast = now > end;
    return {
      key: "paused",
      label: "Tạm dừng",
      badgeClass: "bg-orange-50 text-orange-700 border border-orange-200",
      isUsable: false,
      canPause: true,
      canClone: true,
      warningText: isPast ? "Đã qua ngày kết thúc" : null,
    };
  }

  // 4. Chưa bắt đầu (Sắp diễn ra)
  if (now < start) {
    return {
      key: "upcoming",
      label: "Sắp diễn ra",
      badgeClass: "bg-sky-50 text-sky-700 border border-sky-200",
      isUsable: false,
      canPause: true,
      canClone: true,
      warningText: null,
    };
  }

  // 5. Đã hết hạn
  if (now > end || deal.status === "ended" || deal.status === "expired") {
    return {
      key: "expired",
      label: "Đã hết hạn",
      badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
      isUsable: false,
      canPause: false,
      canClone: true,
      warningText: null,
    };
  }

  // 6. Sắp hết hạn (<= 24 giờ trước thời điểm kết thúc 23:59:59 của endDate)
  const remainingMs = end.getTime() - now.getTime();
  if (remainingMs <= 24 * 3600 * 1000 && remainingMs > 0) {
    const remainingHours = Math.max(1, Math.ceil(remainingMs / (3600 * 1000)));
    return {
      key: "expiring_soon",
      label: "Sắp hết hạn",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      isUsable: true,
      canPause: true,
      canClone: true,
      remainingHours,
      warningText: `Còn ${remainingHours} giờ`,
    };
  }

  // 7. Đang áp dụng hợp lệ
  return {
    key: "active",
    label: "Đang áp dụng",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    isUsable: true,
    canPause: true,
    canClone: true,
    warningText: null,
  };
};

export const getStatusTextDeal = (param) => {
  if (param && typeof param === "object") {
    return getDealLifecycle(param).label;
  }
  if (param === "active") return "Đang áp dụng";
  if (param === "upcoming") return "Sắp diễn ra";
  if (param === "expiring_soon") return "Sắp hết hạn";
  if (param === "paused") return "Tạm dừng";
  if (param === "cancelled") return "Đã hủy";
  if (param === "invalid") return "Dữ liệu không hợp lệ";
  return "Đã kết thúc";
};

export const getStatusStyleDeal = (param) => {
  if (param && typeof param === "object") {
    return getDealLifecycle(param).badgeClass;
  }
  if (param === "active") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (param === "upcoming") return "bg-sky-50 text-sky-700 border border-sky-200";
  if (param === "expiring_soon") return "bg-amber-50 text-amber-700 border border-amber-200";
  if (param === "paused") return "bg-orange-50 text-orange-700 border border-orange-200";
  if (param === "cancelled") return "bg-red-50 text-red-600 border border-red-200";
  if (param === "invalid") return "bg-rose-50 text-rose-700 border border-rose-200";
  return "bg-slate-100 text-slate-600 border border-slate-200";
};

export const getTypeStyleDeal = (type) => {
  if (type === "Combo") return "bg-green-50 text-green-700";
  if (type === "Sinh nhật") return "bg-red-50 text-red-500";
  if (type === "Đặt món") return "bg-blue-50 text-blue-600";
  if (type === "Đặt bàn") return "bg-orange-50 text-orange-600";
  if (type === "Ngày lễ") return "bg-rose-50 text-rose-700 font-bold";
  if (type === "Thành viên") return "bg-cyan-50 text-cyan-700";
  return "bg-purple-50 text-purple-600";
};

export const getServiceTypeTextDeal = (type) => {
  if (type === "dinein") return "Tại bàn";
  if (type === "delivery") return "Giao hàng";
  if (type === "pickup") return "Mang đi";
  return type;
};
