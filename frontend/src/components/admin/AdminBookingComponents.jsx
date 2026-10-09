import React from "react";
import { X, Users, CalendarDays, Utensils, Check } from "lucide-react";

export function DetailBlock({ icon, title, children }) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <h4 className="font-black text-green-800 mb-3 flex items-center gap-2">
        <span className="text-green-700">{icon}</span>
        {title}
      </h4>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
      <span className="text-gray-500 font-semibold">{label}</span>
      <span className="text-gray-800 font-bold">{value}</span>
    </div>
  );
}

export function BookingStatCard({ icon, title, value, bg, color, note = "", valueColor, className = "" }) {
  const textColor = valueColor || color;
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-2xs p-3 sm:p-3.5 flex items-center justify-between gap-2 hover:bg-emerald-50/20 hover:border-emerald-100 hover:shadow-xs transition text-left min-w-0 ${className}`}>
      {/* Text column */}
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate leading-tight">
          {title}
        </p>
        <h3 className={`text-lg sm:text-xl xl:text-2xl font-black ${textColor} mt-1 leading-none`}>
          {value}
        </h3>
        {note && note !== "-" ? (
          <div className="mt-1 flex items-center min-w-0 h-4">
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-bold shrink-0">
              {note}
            </span>
          </div>
        ) : null}
      </div>
      {/* Icon right */}
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
        {React.cloneElement(icon, { size: 16 })}
      </div>
    </div>
  );
}

export function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 sm:h-13 px-2.5 sm:px-4 lg:px-5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shrink-0 ${
        active
          ? "border-emerald-700 text-emerald-800 bg-emerald-50/50"
          : "border-transparent text-gray-500 hover:text-emerald-700 hover:bg-emerald-50/20"
      }`}
    >
      {children}
    </button>
  );
}

export function SelectBox({ label, value, onChange, children, compact = false }) {
  const isFiltered = value && value !== "all";
  return (
    <label
      className={`h-9 sm:h-10 rounded-xl border flex flex-col justify-center px-2 sm:px-3 shadow-2xs min-w-0 w-full transition-all cursor-pointer ${
        isFiltered
          ? "border-emerald-300 bg-emerald-50/40 text-emerald-900"
          : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300"
      } focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600/20 ${compact ? "lg:w-[130px]" : ""}`}
    >
      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 truncate leading-none mb-0.5 uppercase tracking-tight">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="outline-none bg-transparent text-[11px] sm:text-xs font-semibold text-slate-700 min-w-0 truncate cursor-pointer leading-tight"
      >
        {children}
      </select>
    </label>
  );
}

export function BookingDetailPanel({
  booking,
  formatDate,
  formatDateTime,
  formatPrice,
  getStatusText,
  getStatusStyle,
  getTypeText,
  onClose,
  onConfirm,
  onComplete,
  onCancel,
}) {
  if (!booking) {
    return (
      <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-400 font-bold">
        Chọn một lịch đặt bàn để xem chi tiết
      </aside>
    );
  }

  const foods = booking.cartItems || booking.items || [];

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 xl:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto xl:static xl:z-auto xl:w-auto xl:max-w-none xl:rounded-2xl xl:border xl:border-gray-100 xl:shadow-sm xl:overflow-hidden xl:sticky xl:top-4 text-left">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h3 className="text-lg sm:text-xl font-black text-green-955">Chi tiết đặt bàn</h3>

          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition font-bold text-sm">
            <X size={18} />
          </button>
        </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-black text-gray-400">Mã đặt bàn</p>

            <span
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap ${getStatusStyle(
                booking.status,
              )}`}
            >
              {getStatusText(booking.status)}
            </span>
          </div>

          <h2 className="text-2xl font-black text-green-955 mt-1 break-all leading-tight">
            {booking.bookingCode || `DB${booking.id}`}
          </h2>

          <p className="text-xs text-gray-500 font-semibold mt-2">
            Tạo lúc: {formatDateTime(booking.createdAt)}
          </p>

          <p className="text-xs text-gray-400 font-semibold mt-1">
            Cập nhật: {formatDateTime(booking.updatedAt || booking.createdAt)}
          </p>
        </div>

        <DetailBlock icon={<Users />} title="Thông tin khách hàng">
          <DetailRow
            label="Họ tên"
            value={booking.customerName || booking.name || "Chưa có"}
          />
          <DetailRow label="SĐT" value={booking.phone || "Chưa có"} />
          <DetailRow label="Email" value={booking.email || "Chưa có"} />
        </DetailBlock>

        <DetailBlock icon={<CalendarDays />} title="Thông tin đặt bàn">
          <DetailRow label="Ngày" value={formatDate(booking.date)} />
          <DetailRow label="Giờ" value={booking.time || "Chưa có"} />
          <DetailRow label="Số khách" value={`${booking.guests || 0} người`} />
          <DetailRow
            label="Khu vực"
            value={
              booking.selectedAreaTitle || booking.area || "Nhà hàng sắp xếp"
            }
          />
          <DetailRow
            label="Bàn"
            value={booking.selectedTable || "Đang sắp xếp"}
          />
          <DetailRow label="Loại đặt" value={getTypeText(booking)} />
          <DetailRow label="Ghi chú" value={booking.note || "Không có"} />
        </DetailBlock>

        <DetailBlock icon={<Utensils />} title="Thông tin món ăn">
          {foods.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_46px_90px_90px] gap-2 text-xs font-black text-gray-500">
                <span>Món ăn</span>
                <span>SL</span>
                <span>Đơn giá</span>
                <span className="text-right">Thành tiền</span>
              </div>

              {foods.map((food, index) => (
                <div
                  key={food.id || index}
                  className="grid grid-cols-[1fr_46px_90px_90px] gap-2 text-xs font-semibold text-gray-700"
                >
                  <span>{food.name}</span>
                  <span>{food.qty || 1}</span>
                  <span>{formatPrice(food.price)}</span>
                  <span className="text-right">
                    {formatPrice(
                      Number(food.price || 0) * Number(food.qty || 1),
                    )}
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-gray-100 flex justify-between font-black text-green-800">
                <span>Tổng tiền</span>
                <span>{formatPrice(booking.total)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 font-bold">
              Khách chỉ đặt bàn, chưa chọn món.
            </p>
          )}
        </DetailBlock>

        {booking.status === "pending" && (
          <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
            <button
              onClick={onConfirm}
              className="
        h-11 rounded-xl
        bg-blue-50 text-blue-700
        border border-blue-100
        text-sm font-black
        hover:bg-blue-100
        flex items-center justify-center gap-1
        transition
      "
            >
              <Check size={16} />
              Xác nhận
            </button>

            <button
              onClick={onCancel}
              className="
        h-11 rounded-xl
        bg-red-50 text-red-600
        border border-red-100
        text-sm font-black
        hover:bg-red-100
        transition
      "
            >
              Hủy bàn
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
