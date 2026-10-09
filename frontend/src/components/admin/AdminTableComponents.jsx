import React from "react";
import {
  X
} from "lucide-react";
import { canUseAction } from "../../utils/permissions";

export const TABLE_STATUS = {
  available: "Trống",
  holding: "Đang giữ",
  booked: "Đã đặt",
  serving: "Đang phục vụ",
  maintenance: "Bảo trì",
  disabled: "Ngừng sử dụng",
};

export const STATUS_STYLE = {
  available: "bg-green-50 text-green-700 border-green-100",
  holding: "bg-orange-50 text-orange-600 border-orange-100",
  booked: "bg-red-50 text-red-600 border-red-100",
  serving: "bg-blue-50 text-blue-600 border-blue-100",
  maintenance: "bg-gray-100 text-gray-600 border-gray-200",
  disabled: "bg-gray-50 text-gray-400 border-gray-100",
};

export const STATUS_DOT = {
  available: "bg-green-600",
  holding: "bg-orange-500",
  booked: "bg-red-500",
  serving: "bg-blue-500",
  maintenance: "bg-gray-500",
  disabled: "bg-gray-300",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black border ${STATUS_STYLE[status]}`}
    >
      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`}></span>
      {TABLE_STATUS[status]}
    </span>
  );
}

export function StatCard({ icon, title, value, bg, color, note = "" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-start gap-2.5 hover:bg-green-50/40 hover:border-green-100 hover:-translate-y-0.5 hover:shadow-md transition text-left min-w-0">
      {/* Icon ở trước (bên trái) */}
      <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
        {React.cloneElement(icon, { size: 16 })}
      </div>

      {/* 3 hàng bắt đầu bằng nhau ở bên phải */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Row 1: Tên danh mục */}
        <p className="text-[11px] sm:text-xs font-black text-gray-500 truncate leading-tight">
          {title}
        </p>

        {/* Row 2: Số tiền, thông số */}
        <h3 className="text-[20px] sm:text-[22px] font-black text-green-955 mt-1 leading-none truncate">
          {value}
        </h3>

        {/* Row 3: Tỉ lệ % / Ghi chú */}
        <div className="mt-1 flex items-center min-w-0 h-5">
          <span className="px-1.5 py-0.5 rounded-lg bg-green-50 text-green-700 text-[9px] sm:text-[10px] font-black shrink-0">
            {note || "-"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-14 px-3 border-b-2 font-black whitespace-nowrap transition ${active
          ? "border-green-700 text-green-700 bg-green-50/40"
          : "border-transparent text-gray-500 hover:text-green-700 hover:bg-green-50/40"
        }`}
    >
      {children}
    </button>
  );
}

export function SelectBox({ label, value, onChange, children }) {
  return (
    <label className="h-11 sm:h-12 rounded-xl border border-gray-100 bg-white px-3 flex flex-col justify-center shadow-sm min-w-0">
      <span className="text-[10px] sm:text-[11px] font-black text-gray-400">
        {label}
      </span>

      <select
        value={value}
        onChange={onChange}
        className="outline-none bg-transparent text-xs sm:text-sm font-bold text-gray-700 min-w-0"
      >
        {children}
      </select>
    </label>
  );
}

export function SelectField({ label, value, onChange, children, error }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 w-full h-12 rounded-xl border px-4 font-bold outline-none shadow-sm transition-all duration-200 ${
          error
            ? "border-red-500 ring-2 ring-red-100 bg-red-50/10"
            : "border-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`}
      >
        {children}
      </select>
      {error && typeof error === "string" && (
        <span className="text-xs text-red-500 font-bold mt-1.5 block select-none">
          {error}
        </span>
      )}
    </label>
  );
}

export function InputField({ label, value, onChange, type = "text", error }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 w-full h-12 rounded-xl border px-4 font-bold outline-none shadow-sm transition-all duration-200 ${
          error
            ? "border-red-500 ring-2 ring-red-100 bg-red-50/10 placeholder-red-300"
            : "border-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`}
      />
      {error && typeof error === "string" && (
        <span className="text-xs text-red-500 font-bold mt-1.5 block select-none">
          {error}
        </span>
      )}
    </label>
  );
}

export function ActionButton({ icon, color, onClick, disabled = false, title = "" }) {
  const colors = {
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
    primary: "bg-green-50 text-green-700 hover:bg-green-100",
    secondary: "bg-gray-50 text-gray-600 hover:bg-gray-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
        disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50" : (colors[color] || colors.primary)
      }`}
    >
      {icon}
    </button>
  );
}

export function Legend({ color, text, compact = false }) {
  return (
    <div
      title={text}
      className={`group h-8 min-[1700px]:h-9 rounded-xl border border-gray-100 bg-white flex items-center text-[11px] min-[1700px]:text-xs font-black text-gray-600 whitespace-nowrap shrink-0 transition-all duration-200 ${compact
          ? "xl:max-[1699px]:w-8 xl:max-[1699px]:px-0 xl:max-[1699px]:justify-center xl:max-[1699px]:overflow-hidden xl:max-[1699px]:hover:w-auto xl:max-[1699px]:hover:px-2.5 gap-1.5 min-[1700px]:gap-2 px-2.5 min-[1700px]:px-3"
          : "px-2.5 min-[1700px]:px-3 gap-1.5 min-[1700px]:gap-2"
        }`}
    >
      <span
        className={`w-2 h-2 min-[1700px]:w-2.5 min-[1700px]:h-2.5 rounded-full shrink-0 ${color}`}
      />

      <span
        className={
          compact
            ? "inline xl:max-[1699px]:hidden xl:max-[1699px]:group-hover:inline"
            : "inline"
        }
      >
        {text}
      </span>
    </div>
  );
}

export function DetailBlock({ title, children }) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <h4 className="font-black text-primary mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
      <span className="text-gray-500 font-semibold">{label}</span>
      <span className="text-gray-800 font-bold break-words">{value}</span>
    </div>
  );
}

export function TableButton({ table, active, onClick }) {
  const statusStyles = {
    available: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100/50",
    holding: "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100/50",
    booked: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100/50",
    serving: "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100/50",
    maintenance: "border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200/50",
    disabled: "border-gray-200 bg-gray-50 text-gray-400",
  };

  const statusDots = {
    available: "bg-green-600",
    holding: "bg-orange-500",
    booked: "bg-red-500",
    serving: "bg-blue-500",
    maintenance: "bg-gray-500",
    disabled: "bg-gray-300",
  };

  const activeRing = active ? "ring-2 ring-primary ring-offset-2 scale-[1.02]" : "";

  return (
    <button
      onClick={onClick}
      disabled={table.status === "disabled"}
      className={`relative h-[110px] rounded-2xl border p-3 flex flex-col justify-between text-left transition duration-200 ${statusStyles[table.status]} ${activeRing}`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-lg font-black">{table.code}</span>
        <span className={`w-2.5 h-2.5 rounded-full ${statusDots[table.status]}`} />
      </div>

      <div className="space-y-0.5">
        {table.status === "serving" && table.pinCode && (
          <p className="text-[11px] font-black text-blue-700 tracking-widest bg-blue-100 rounded-md px-1.5 py-0.5 inline-block">
            PIN: {table.pinCode}
          </p>
        )}
        <p className="text-[10px] font-semibold text-gray-400 truncate">
          {table.description || "Bàn ăn tiêu chuẩn"}
        </p>
        <p className="text-xs font-bold">
          Sức chứa: <span className="font-black">{table.capacity} khách</span>
        </p>
      </div>
    </button>
  );
}

export function TableDetailPanel({
  table,
  booking,
  formatDate,
  formatDateTime,
  onClose,
  onEdit,
  onStatusChange,
  onCancelBooking,
  onConfirmBooking,
  onCompleteBooking,
  onStartServing,
  onOpenAddItems,
  onOpenBilling,
  currentUser,
}) {
  const canEdit = canUseAction(currentUser, "tables:update");

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 xl:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto xl:static xl:z-auto xl:w-auto xl:max-w-none xl:rounded-2xl xl:border xl:border-gray-100 xl:shadow-sm xl:overflow-hidden xl:sticky xl:top-4 xl:self-start xl:h-fit xl:max-h-none text-left">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h3 className="text-lg sm:text-xl font-black text-green-950">
            Chi tiết bàn {table.code}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition font-bold text-sm">
            <X size={18} />
          </button>
        </div>

      <div className="p-4 space-y-4">
        <div className="h-28 rounded-2xl border border-gray-100 bg-[#fbfcfb] flex items-center justify-center">
          <div className="w-20 h-20 rounded-xl border-2 border-gray-200 bg-white flex items-center justify-center text-2xl font-black text-green-955 shadow-sm">
            {table.code}
          </div>
        </div>

        <StatusBadge status={table.status} />

        {table.status === "serving" && table.pinCode && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500 font-bold mb-1">🔑 MÃ PIN KHÁCH GỌI MÓN THÊM</p>
              <p className="text-2xl font-black tracking-[0.3em] text-blue-800">{table.pinCode}</p>
            </div>
            <p className="text-[10px] text-blue-400 text-right max-w-[80px] leading-tight">Cung cấp cho khách khi họ muốn gọi thêm món</p>
          </div>
        )}

        {!booking && (
          <DetailBlock title="Thông tin bàn">
            <DetailRow label="Mã bàn" value={table.code} />
            <DetailRow label="Khu vực" value={table.areaName} />
            <DetailRow label="Sức chứa" value={`${table.capacity} người`} />
            <DetailRow label="Mô tả" value={table.description} />
            <DetailRow label="Cập nhật" value={formatDateTime(table.updatedAt)} />
          </DetailBlock>
        )}

        {booking ? (
          <>
            <DetailBlock title="Thông tin đặt bàn hiện tại">
              <DetailRow
                label="Mã đặt bàn"
                value={`DB${booking.id || "Chưa có"}`}
              />
              <DetailRow
                label="Khách hàng"
                value={
                  booking.customerName ||
                  booking.fullName ||
                  booking.name ||
                  "Chưa có"
                }
              />
              <DetailRow
                label="Số điện thoại"
                value={booking.phone || "Chưa có"}
              />
              <DetailRow label="Email" value={booking.email || "Chưa có"} />
              <DetailRow label="Ngày đặt" value={formatDate(booking.date)} />
              <DetailRow label="Giờ đặt" value={booking.time || "Chưa có"} />
              <DetailRow
                label="Số khách"
                value={`${booking.guests || booking.people || 0} người`}
              />
              <DetailRow
                label="Loại đặt"
                value={
                  booking.type === "table_with_order"
                    ? "Đặt bàn kèm đơn món"
                    : booking.type === "table_with_food"
                      ? "Đặt bàn kèm món"
                      : "Chỉ đặt bàn"
                }
              />
              <DetailRow
                label="Tổng tiền"
                value={`${Number(booking.total || 0).toLocaleString("vi-VN")}đ`}
              />
              <DetailRow label="Ghi chú" value={booking.note || "Không có"} />
              <DetailRow
                label="Tạo lúc"
                value={formatDateTime(booking.createdAt)}
              />
              <DetailRow
                label="Xếp bàn lúc"
                value={formatDateTime(booking.assignedAt)}
              />
              <DetailRow
                label="Xếp bởi"
                value={booking.assignedBy || "Chưa có"}
              />
            </DetailBlock>

            <DetailBlock title="Món ăn đã đặt">
              {booking.cartItems && booking.cartItems.length > 0 ? (
                <div className="space-y-3 mt-2">
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {booking.cartItems.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-white shrink-0 border border-gray-100"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-xs text-green-955 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-extrabold mt-0.5">
                            {Number(item.price || 0).toLocaleString("vi-VN")}đ x {item.qty}
                          </p>
                        </div>
                        <span className="font-black text-xs text-gray-700">
                          {Number((item.price || 0) * (item.qty || 0)).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between font-bold text-gray-500">
                      <span>Tổng số lượng:</span>
                      <span>{booking.totalQty || booking.cartItems.reduce((acc, i) => acc + Number(i.qty || 0), 0)} món</span>
                    </div>
                    <div className="flex justify-between font-black text-green-955 text-sm">
                      <span>Tạm tính:</span>
                      <span>{Number(booking.subtotal || booking.total || 0).toLocaleString("vi-VN")}đ</span>
                    </div>
                    {booking.paymentStatus && (
                      <div className="flex justify-between font-bold mt-1">
                        <span>Thanh toán:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-bold py-2 text-center">Khách chưa gọi món</p>
              )}
            </DetailBlock>
          </>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5 text-center">
            <p className="font-black text-gray-500">
              Bàn này chưa có lịch đặt hiện tại
            </p>
            <p className="text-sm text-gray-400 font-semibold mt-1">
              Khi khách đặt đúng mã bàn này, thông tin sẽ tự hiển thị ở đây.
            </p>
          </div>
        )}

        {booking?.status === "pending" && booking?.selectedTable && (
          <button
            onClick={onConfirmBooking}
            className="w-full h-12 rounded-xl bg-green-700 text-white border border-green-700 font-black hover:bg-green-800 transition mb-2"
          >
            Xác nhận đặt bàn
          </button>
        )}

        {booking?.status === "confirmed" && booking?.selectedTable && table.status !== "serving" && (
          <button
            onClick={() => onStartServing(booking, table)}
            className="w-full h-12 rounded-xl bg-blue-600 text-white border border-blue-600 font-black hover:bg-blue-700 transition mb-2"
          >
            Nhận bàn / Bắt đầu phục vụ
          </button>
        )}

        {table.status === "serving" && booking && (
          <div className="space-y-2">
            {booking.paymentStatus !== "paid" ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenAddItems(booking)}
                  className="h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 font-black hover:bg-blue-100 transition text-xs"
                >
                  Thêm món
                </button>
                <button
                  onClick={() => onOpenBilling(booking)}
                  className="h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-black hover:bg-emerald-100 transition text-xs"
                >
                  Thanh toán
                </button>
              </div>
            ) : (
              <div className="p-3 bg-green-50 rounded-2xl border border-green-100 text-center">
                <p className="text-xs font-black text-green-700">Đã thanh toán hóa đơn thành công</p>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">Vui lòng bấm Hoàn thành phục vụ để dọn bàn.</p>
              </div>
            )}
            <button
              onClick={onCompleteBooking}
              className="w-full h-12 rounded-xl bg-green-700 text-white border border-green-700 font-black hover:bg-green-800 transition"
            >
              Hoàn thành phục vụ
            </button>
          </div>
        )}

        {booking && table.status !== "serving" && (
          <button
            onClick={onCancelBooking}
            className="w-full h-12 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black hover:bg-red-100 transition mt-2"
          >
            Hủy đặt bàn
          </button>
        )}

        {canEdit && (
          <div className="border-t border-gray-100 pt-4 mt-2">
            <button
              onClick={onEdit}
              className="w-full h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 font-black hover:bg-blue-100 transition"
            >
              Chi tiết & Quản lý bàn
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
