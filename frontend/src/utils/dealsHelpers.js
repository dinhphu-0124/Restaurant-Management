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

export const getStatusTextDeal = (status) => {
  if (status === "active") return "Đang áp dụng";
  if (status === "upcoming") return "Sắp diễn ra";
  if (status === "paused") return "Tạm dừng";
  return "Đã kết thúc";
};

export const getStatusStyleDeal = (status) => {
  if (status === "active") return "bg-green-50 text-green-700";
  if (status === "upcoming") return "bg-orange-50 text-orange-600";
  if (status === "paused") return "bg-gray-100 text-gray-600";
  return "bg-slate-100 text-slate-500";
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
