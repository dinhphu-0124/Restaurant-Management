export const formatPriceDashboard = (price) => {
  return Number(price || 0).toLocaleString("vi-VN") + "đ";
};

export const formatDateTimeDashboard = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatDateDashboard = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getOrderStatusStyle = (status) => {
  switch (status) {
    case "pending": return "bg-orange-50 text-orange-600";
    case "preparing": return "bg-blue-50 text-blue-600";
    case "delivering": return "bg-indigo-50 text-indigo-600";
    case "completed": return "bg-green-50 text-green-700";
    case "cancelled": return "bg-red-50 text-red-600";
    default: return "bg-gray-100 text-gray-600";
  }
};

export const getOrderStatusText = (status) => {
  switch (status) {
    case "pending": return "Chờ duyệt";
    case "preparing": return "Đang nấu";
    case "delivering": return "Đang giao";
    case "completed": return "Hoàn tất";
    case "cancelled": return "Đã hủy";
    default: return status;
  }
};

export const getBookingStatusStyle = (status) => {
  switch (status) {
    case "pending": return "bg-orange-50 text-orange-600";
    case "confirmed": return "bg-blue-50 text-blue-600";
    case "completed": return "bg-green-50 text-green-700";
    case "cancelled": return "bg-red-50 text-red-600";
    default: return "bg-gray-100 text-gray-600";
  }
};

export const getBookingStatusText = (status) => {
  switch (status) {
    case "pending": return "Chờ duyệt";
    case "confirmed": return "Đã xác nhận";
    case "completed": return "Hoàn tất";
    case "cancelled": return "Đã hủy";
    default: return status;
  }
};
