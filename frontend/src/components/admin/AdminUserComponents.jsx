import React from "react";
import {
  Users as UsersIcon,
  Phone,
  Mail,
  CalendarDays,
  MapPin,
  Lock,
  Unlock,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

const ROLE_TEXT = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  user: "Khách hàng",
};

export function UserStatCard({ icon, title, value, bg, color, note = "", valueColor }) {
  const textColor = valueColor || color;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-start gap-2.5 hover:shadow-md transition text-left min-w-0">
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
        <h3 className={`text-[20px] sm:text-[22px] font-black ${textColor} mt-1 leading-none truncate`}>
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

export function SelectBox({ label, value, onChange, children }) {
  return (
    <label className="h-11 rounded-xl border border-gray-100 bg-white px-3 flex flex-col justify-center shadow-sm text-left">
      <span className="text-[10px] font-black text-gray-400">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="outline-none bg-transparent text-xs font-bold text-gray-700 min-w-0"
      >
        {children}
      </select>
    </label>
  );
}

export function IconButton({ icon, color, onClick, disabled = false, title = "" }) {
  const colors = {
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
        disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50" : `${colors[color]} hover:scale-105`
      }`}
    >
      {icon}
    </button>
  );
}

export function DetailBlock({ title, children }) {
  return (
    <div className="border-t border-gray-100 pt-4 text-left">
      <h4 className="font-black text-green-800 mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function DetailRow({ icon, label, value }) {
  return (
    <div className="grid grid-cols-[105px_1fr] gap-3 text-sm text-left">
      <span className="text-gray-500 font-semibold flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-gray-800 font-bold break-all">{value}</span>
    </div>
  );
}

export function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 p-2 text-center">
      <p className="text-green-800 font-black text-sm">{value}</p>
      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{label}</p>
    </div>
  );
}

export function HistoryRow({ code, date, amount }) {
  return (
    <div className="flex justify-between items-center text-xs font-semibold py-1 border-b border-gray-50 text-left">
      <div>
        <span className="text-gray-800 font-bold">{code}</span>
        <span className="text-gray-400 ml-2">{date}</span>
      </div>
      <span className="text-green-700 font-bold">{amount}</span>
    </div>
  );
}

export function EmptyText({ text }) {
  return <p className="text-xs text-gray-400 font-bold py-1 text-left">{text}</p>;
}

export function UserDetailPanel({
  user,
  onClose,
  onToggleLock,
  onOpenRoleModal,
  formatPrice,
  formatDate,
}) {
  if (!user) {
    return (
      <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-400 font-bold">
        Chọn một khách hàng để xem chi tiết
      </aside>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  const isMe = currentUser.id === user.id;

  const orders = user.orders || [];
  const bookings = user.bookings || [];

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 xl:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto xl:static xl:z-auto xl:w-auto xl:max-w-none xl:rounded-2xl xl:border xl:border-gray-100 xl:shadow-sm xl:overflow-hidden xl:sticky xl:top-4 text-left">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h3 className="text-lg sm:text-xl font-black text-green-955">
            Thông tin chi tiết
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition font-bold text-sm"
          >
            ✕
          </button>
        </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-1">
            <h2 className="text-2xl font-black text-green-955 truncate flex-1">
              {user.name}
            </h2>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-black border ${
                user.role === "admin"
                  ? "bg-red-50 text-red-600 border-red-100"
                  : user.role === "manager"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : user.role === "staff"
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-gray-50 text-gray-600 border-gray-100"
              }`}
            >
              {ROLE_TEXT[user.role] || user.role}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                user.status === "locked"
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {user.status === "locked" ? "🔒 BỊ KHÓA" : "🟢 ĐANG HOẠT ĐỘNG"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Đơn hàng" value={orders.length} />
          <MiniStat label="Đặt bàn" value={bookings.length} />
          <MiniStat
            label="Chi tiêu"
            value={formatPrice(
              orders.reduce((sum, item) => sum + Number(item.total || 0), 0),
            )}
          />
        </div>

        <DetailBlock title="Thông tin liên hệ">
          <DetailRow icon={<Mail size={15} />} label="Email" value={user.email} />
          <DetailRow
            icon={<Phone size={15} />}
            label="SĐT"
            value={user.phone || "Chưa cập nhật"}
          />
          <DetailRow
            icon={<MapPin size={15} />}
            label="Địa chỉ"
            value={user.address || "Chưa cập nhật"}
          />
          <DetailRow
            icon={<CalendarDays size={15} />}
            label="Ngày tham gia"
            value={formatDate(user.createdAt)}
          />
        </DetailBlock>

        <DetailBlock title="Lịch sử đơn hàng gần đây">
          {orders.length > 0 ? (
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {orders.slice(0, 5).map((order) => (
                <HistoryRow
                  key={order.id}
                  code={`#${order.id}`}
                  date={formatDate(order.createdAt)}
                  amount={formatPrice(order.total)}
                />
              ))}
            </div>
          ) : (
            <EmptyText text="Chưa mua đơn hàng nào." />
          )}
        </DetailBlock>

        <DetailBlock title="Lịch sử đặt bàn gần đây">
          {bookings.length > 0 ? (
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {bookings.slice(0, 5).map((b) => (
                <HistoryRow
                  key={b.id}
                  code={`Bàn ${b.selectedTable || "Chờ xếp"}`}
                  date={formatDate(b.date)}
                  amount={`${b.guests || b.people || 0} khách`}
                />
              ))}
            </div>
          ) : (
            <EmptyText text="Chưa đặt lịch bàn nào." />
          )}
        </DetailBlock>

        {!isMe && (
          <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
            <button
              onClick={() => onOpenRoleModal(user)}
              className="h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-xs font-black hover:bg-blue-100 transition"
            >
              🔄 Đổi vai trò
            </button>

            <button
              onClick={() => onToggleLock(user)}
              className={`h-11 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1 ${
                user.status === "locked"
                  ? "bg-green-50 border-green-100 text-green-700 hover:bg-green-100"
                  : "bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
              }`}
            >
              {user.status === "locked" ? (
                <>
                  <Unlock size={14} /> Mở khóa
                </>
              ) : (
                <>
                  <Lock size={14} /> Khóa TK
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}

export function GrantRoleModal({ user, onClose, onSave }) {
  const [selectedRole, setSelectedRole] = React.useState(user?.role || "user");

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-left">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full space-y-4">
        <div>
          <h4 className="font-black text-gray-900 text-base">
            Thay đổi vai trò người dùng
          </h4>
          <p className="text-xs text-gray-500 mt-1 select-all">
            Đang thay đổi cho: <b>{user.email}</b>
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-black text-gray-400 block mb-2">
            CHỌN VAI TRÒ MỚI
          </span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full h-11 border border-gray-200 bg-white rounded-xl px-3 text-sm font-bold text-gray-800 outline-none shadow-sm"
          >
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="manager">Quản lý (Manager)</option>
            <option value="staff">Nhân viên (Staff)</option>
            <option value="user">Khách hàng (User)</option>
          </select>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => onSave(user, selectedRole)}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold transition shadow-sm hover:bg-primary-light"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
