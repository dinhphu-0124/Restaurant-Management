import React from "react";

/**
 * AppBadge - Thẻ hiển thị trạng thái chuẩn hóa toàn hệ thống
 */
export default function AppBadge({
  children,
  status,
  variant,
  size = "md",
  dot = false,
  className = "",
}) {
  // Bản đồ màu sắc theo trạng thái thực tế của hệ thống
  const statusStyles = {
    // Trạng thái đơn hàng & Đặt bàn
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
    preparing: "bg-indigo-50 text-indigo-700 border-indigo-200",
    delivering: "bg-sky-50 text-sky-700 border-sky-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    serving: "bg-purple-50 text-purple-700 border-purple-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",

    // Trạng thái thanh toán
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    partially_paid: "bg-orange-50 text-orange-700 border-orange-200",
    unpaid: "bg-slate-100 text-slate-600 border-slate-200",

    // Trạng thái tài khoản & Món ăn & Bàn
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    selling: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
    stop: "bg-rose-50 text-rose-700 border-rose-200",
    locked: "bg-rose-50 text-rose-700 border-rose-200",
    available: "bg-emerald-50 text-emerald-700 border-emerald-200",
    maintenance: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const variantStyles = {
    primary: "bg-emerald-50 text-emerald-800 border-emerald-200",
    gold: "bg-amber-50 text-amber-800 border-amber-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const dotColors = {
    pending: "bg-amber-500",
    processing: "bg-indigo-500",
    preparing: "bg-indigo-500",
    delivering: "bg-sky-500",
    confirmed: "bg-blue-500",
    serving: "bg-purple-500",
    completed: "bg-emerald-500",
    cancelled: "bg-rose-500",
    paid: "bg-emerald-500",
    partially_paid: "bg-orange-500",
    unpaid: "bg-slate-400",
    active: "bg-emerald-500",
    selling: "bg-emerald-500",
    inactive: "bg-slate-400",
    stop: "bg-rose-500",
    locked: "bg-rose-500",
    available: "bg-emerald-500",
    maintenance: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3.5 py-1.5 gap-2",
  };

  const key = (status || "").toLowerCase();
  const appliedStyle =
    statusStyles[key] || variantStyles[variant] || variantStyles.neutral;
  const appliedDot = dotColors[key] || "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size] || sizeStyles.md} ${appliedStyle} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${appliedDot}`} />}
      {children}
    </span>
  );
}
