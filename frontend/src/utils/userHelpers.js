export const ROLE_TEXT = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  user: "Khách hàng",
};

export const formatPriceUser = (price) =>
  Number(price || 0).toLocaleString("vi-VN") + "đ";

export const formatDateUser = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatShortMoneyUser = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}tr`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return amount.toString();
};

export const formatDateTimeUser = (value) => {
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

export const getUserOrders = (user) => user.orders || [];
export const getUserBookings = (user) => user.bookings || [];
export const getUserTotalSpent = (user) => Number(user.totalSpent || 0);
export const getUserStatus = (user) => user.status || "active";
export const getUserGroup = (user) => user.group || "new";

export const getGroupTextUser = (group) => {
  if (group === "vip") return "VIP";
  if (group === "regular") return "Thân thiết";
  return "Khách mới";
};

export const getStatusTextUser = (status) => {
  if (status === "locked") return "Đã khóa";
  return "Hoạt động";
};

export const getStatusStyleUser = (status) => {
  if (status === "locked") return "bg-red-50 text-red-600";
  return "bg-green-50 text-green-700";
};
