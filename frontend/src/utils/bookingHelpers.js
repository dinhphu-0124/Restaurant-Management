/**
 * Utility functions và helpers cho AdminBookingsPage
 */

export const normalizeTableStatus = (status) => {
  if (!status) return "available";
  if (status === "empty" || status === "free") return "available";
  return status;
};

export const getStatusText = (status) => {
  switch (status) {
    case "pending": return "Chờ xác nhận";
    case "confirmed": return "Đã xác nhận";
    case "serving": return "Đang phục vụ";
    case "completed": return "Hoàn thành";
    case "cancelled":
    case "canceled": return "Đã hủy";
    default: return status || "Chờ xác nhận";
  }
};

export const getStatusStyle = (status) => {
  const text = getStatusText(status);
  if (text === "Hoàn thành") return "bg-green-50 text-green-700";
  if (text === "Đang phục vụ") return "bg-indigo-50 text-indigo-700";
  if (text === "Đã hủy") return "bg-red-50 text-red-600";
  if (text === "Đã xác nhận") return "bg-blue-50 text-blue-600";
  return "bg-orange-50 text-orange-600";
};

export const getTypeText = (booking) => {
  if (booking.type === "table_with_order") {
    if (booking.selectedTable) return "Gọi thêm món";
    return "Từ Checkout";
  }
  if (booking.type === "table_with_food") return "Kèm món";
  return "Chỉ đặt bàn";
};

export const getTypeStyle = (booking) => {
  if (booking.type === "table_with_order") {
    if (booking.selectedTable) return "bg-orange-50 text-orange-600 border border-orange-200";
    return "bg-purple-50 text-purple-600";
  }
  if (booking.type === "table_with_food") return "bg-green-50 text-green-700";
  return "bg-blue-50 text-blue-600";
};

export const formatPrice = (price) =>
  Number(price || 0).toLocaleString("vi-VN") + "đ";

export const formatDateBooking = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTimeBooking = (value) => {
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

export const isActiveBooking = (booking) => {
  return ["pending", "confirmed", "serving", "Chờ xác nhận", "Đã xác nhận", "Đang phục vụ"].includes(booking.status);
};
