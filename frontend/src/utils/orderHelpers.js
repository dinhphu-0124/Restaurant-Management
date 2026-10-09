/**
 * Utility functions cho AdminOrdersPage
 */

export const getStatusTextOrder = (status) => {
  switch (status) {
    case "pending": return "Chờ xác nhận";
    case "confirmed": return "Đã xác nhận";
    case "preparing": return "Đang chuẩn bị";
    case "delivering": return "Đang giao";
    case "completed": return "Hoàn thành";
    case "cancelled":
    case "canceled": return "Đã hủy";
    default: return status || "Chờ xác nhận";
  }
};

export const getStatusStyleOrder = (status) => {
  const text = getStatusTextOrder(status);
  if (text.includes("Hoàn thành")) return "bg-green-50 text-green-700";
  if (text.includes("hủy")) return "bg-red-50 text-red-600";
  if (text.includes("giao")) return "bg-orange-50 text-orange-600";
  if (text.includes("chuẩn bị")) return "bg-purple-50 text-purple-600";
  if (text.includes("xác nhận") && text.includes("Đã")) return "bg-blue-50 text-blue-600";
  return "bg-yellow-50 text-yellow-700";
};

export const getServiceText = (type) => {
  switch (type) {
    case "delivery": return "Giao tận nơi";
    case "pickup": return "Đến lấy tại quán";
    case "dinein": return "Ăn tại quán";
    default: return "Chưa xác định";
  }
};

export const getPaymentText = (method) => {
  switch (method) {
    case "cash": return "Tiền mặt";
    case "bank": return "Chuyển khoản";
    case "momo": return "Ví MoMo";
    case "vnpay": return "VNPay";
    case "pay_after_meal": return "Sau bữa ăn";
    default: return "Chưa chọn";
  }
};

export const getPaymentStatusText = (status) => {
  switch (status) {
    case "paid": return "Thành công";
    case "partial": return "Một phần";
    case "pending": return "Chờ thanh toán";
    case "failed": return "Thất bại";
    case "refunded": return "Đã hoàn tiền";
    default: return status || "Chưa xác định";
  }
};

export const formatPriceOrder = (price) =>
  Number(price || 0).toLocaleString("vi-VN") + "đ";

export const formatDateTimeOrder = (value) => {
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

export const hasVietnameseTone = (str = "") =>
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(str);
