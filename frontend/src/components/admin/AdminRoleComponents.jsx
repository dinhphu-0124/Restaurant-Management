import React, { useState } from "react";
import GlobalPagination from "./GlobalPagination";
import {
  Crown,
  ShieldCheck,
  BriefcaseBusiness,
  UserCog,
  Lock,
  ArrowRight,
  Eye,
  X,
  Phone,
  Mail,
  CalendarDays,
  UserRound,
  Clock3,
} from "lucide-react";
import { translateAction, renderColoredMessage } from "../../utils/actionTranslator.jsx";

const ROLE_TEXT = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  user: "Khách hàng",
};

const ROLE_BADGE = {
  admin: "bg-red-100 text-red-700 border border-red-200",
  manager: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  staff: "bg-blue-100 text-blue-700 border border-blue-200",
  user: "bg-gray-100 text-gray-700 border border-gray-200",
};

const STATUS_TEXT = {
  active: "Đang hoạt động",
  locked: "Bị khóa",
  inactive: "Chưa kích hoạt",
};

const STATUS_BADGE = {
  active: "bg-green-50 text-green-700 border border-green-200",
  locked: "bg-red-50 text-red-600 border border-red-200",
  inactive: "bg-gray-50 text-gray-500 border border-gray-200",
};

export function TopStatCard({ icon, title, value, note, bg, color, hover }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 hover:shadow-md transition-all text-left min-w-0 flex items-start gap-2.5 ${hover}`}>
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
          {note ? (
            <span className="px-1.5 py-0.5 rounded-lg bg-green-50 text-green-700 text-[9px] sm:text-[10px] font-black shrink-0 max-w-full truncate">
              {note}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-lg bg-green-50 text-green-700 text-[9px] sm:text-[10px] font-black shrink-0 max-w-full opacity-0 pointer-events-none">
              -
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function RolePermissionCard({ role, count }) {
  const meta = {
    admin: {
      title: ROLE_TEXT.admin,
      desc: "Toàn quyền quản trị hệ thống.",
      color: "from-red-500 to-rose-600 shadow-red-100",
    },
    manager: {
      title: ROLE_TEXT.manager,
      desc: "Quản lý hóa đơn, đặt bàn, thực đơn.",
      color: "from-amber-500 to-yellow-600 shadow-amber-100",
    },
    staff: {
      title: ROLE_TEXT.staff,
      desc: "Xử lý đặt bàn, gọi món trực tiếp.",
      color: "from-blue-500 to-indigo-600 shadow-blue-100",
    },
    user: {
      title: ROLE_TEXT.user,
      desc: "Khách hàng đăng ký tài khoản.",
      color: "from-gray-500 to-slate-600 shadow-gray-100",
    },
  }[role];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition text-left">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-black text-gray-900 text-lg">{meta.title}</h4>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {meta.desc}
          </p>
        </div>

        <span className="shrink-0 px-3.5 py-1.5 rounded-xl bg-gray-50 text-gray-700 font-black text-sm border border-gray-100">
          {count} tài khoản
        </span>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400">
          Vai trò hệ thống
        </span>

        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.color} text-white flex items-center justify-center shadow-lg`}>
          {role === "admin" && <Crown size={16} />}
          {role === "manager" && <ShieldCheck size={16} />}
          {role === "staff" && <BriefcaseBusiness size={16} />}
          {role === "user" && <UserCog size={16} />}
        </div>
      </div>
    </div>
  );
}

export function AdminTipsCard() {
  return (
    <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-3xl shadow-xl p-6 text-white text-left relative overflow-hidden select-none">
      <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
        <Lock size={180} />
      </div>

      <h4 className="text-lg font-black flex items-center gap-2">
        <span>🛡️</span> Bảo mật & Phân quyền
      </h4>

      <p className="text-xs text-green-100 mt-2 leading-relaxed">
        Vai trò quyết định quyền hạn truy cập của tài khoản vào trang quản trị
        Admin. Chỉ cấp vai trò Quản trị viên/Quản lý cho các nhân viên có trách
        nhiệm.
      </p>

      <ul className="mt-5 space-y-3">
        {[
          "Quyền hạn áp dụng ngay sau khi cập nhật vai trò",
          "Mọi hoạt động phân quyền đều được ghi lại nhật ký",
          "Không thể tự thay đổi vai trò của chính mình",
        ].map((tip, idx) => (
          <li key={idx} className="flex gap-2.5 items-start text-xs text-green-50 font-bold leading-normal">
            <span className="text-green-300">✦</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoleBadgeText({ role }) {
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${ROLE_BADGE[role] || ROLE_BADGE.user}`}>
      {ROLE_TEXT[role] || role}
    </span>
  );
}

export function StatusBadgeText({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${STATUS_BADGE[status] || STATUS_BADGE.inactive}`}>
      {STATUS_TEXT[status] || status}
    </span>
  );
}

export function ActivityMessage({ activity }) {
  // Chuẩn hóa và chuẩn bị câu thông báo chi tiết
  let detailText = activity.message;
  if (activity.action === "role_changed" || activity.action === "CHANGE_ROLE") {
    detailText = activity.message ? activity.message.charAt(0).toLowerCase() + activity.message.slice(1) : "";
  } else if (activity.action === "status_changed" || activity.action === "LOCK_USER" || activity.action === "UNLOCK_USER") {
    if (activity.message === "Tài khoản bị khóa" || activity.action === "LOCK_USER") {
      detailText = "khóa tài khoản";
    } else if (activity.message === "Tài khoản được mở khóa" || activity.action === "UNLOCK_USER") {
      detailText = "mở khóa tài khoản";
    } else {
      detailText = activity.message ? activity.message.charAt(0).toLowerCase() + activity.message.slice(1) : "";
    }
  }

  const actorName = activity.performedByEmail || activity.actorName || "Hệ thống";
  const targetName = activity.targetUserEmail || activity.targetEmail || activity.targetName || "tài khoản";

  let sentence = "";
  if (detailText) {
    sentence = `đã ${detailText} cho tài khoản ${targetName}`;
  } else {
    sentence = `đã thực hiện ${translateAction(activity.action)} cho tài khoản ${targetName}`;
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-800 font-semibold leading-relaxed">
        <strong className="text-gray-900 font-black">
          {actorName}
        </strong>{" "}
        {renderColoredMessage(sentence)}
      </p>

      {activity.details && (
        <p className="text-xs text-gray-400 font-medium mt-1 select-all break-all leading-normal bg-gray-50 border border-gray-100 rounded-lg p-2">
          Chi tiết: {activity.details}
        </p>
      )}
    </div>
  );
}

export function RecentActivityPanel({ activities, loading, formatDateTime }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const startIndex = (currentPage - 1) * pageSize;
  const currentActivities = activities.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-left">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h4 className="text-lg font-black text-gray-900">
            Nhật ký hoạt động
          </h4>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Ghi nhận các hoạt động thay đổi phân quyền gần đây
          </p>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-20 text-center text-gray-400 font-bold">
            Đang tải nhật ký...
          </div>
        ) : activities.length === 0 ? (
          <div className="py-20 text-center text-gray-400 font-bold">
            Chưa có hoạt động phân quyền nào được ghi nhận.
          </div>
        ) : (
          <div className="max-h-[580px] overflow-y-auto pr-2">
            <div className="relative border-l border-gray-100 ml-3 pl-6 space-y-8 py-2">
              {currentActivities.map((act) => (
                <div key={act.id} className="relative">
                  <span className={`absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ring-gray-100 ${act.action === "LOCK_USER" ? "bg-red-500 ring-red-50" : act.action === "CHANGE_ROLE" ? "bg-amber-500 ring-amber-50" : "bg-green-500 ring-green-50"}`} />
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <ActivityMessage activity={act} />
                    <span className="shrink-0 text-xs font-semibold text-gray-400 whitespace-nowrap pt-0.5 sm:text-right">
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {!loading && activities.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <GlobalPagination
            total={activities.length}
            page={currentPage}
            limit={pageSize}
            onPageChange={setCurrentPage}
            onLimitChange={setPageSize}
            limitOptions={[10, 20, 50]}
          />
        </div>
      )}
    </div>
  );
}

export function DetailBox({ icon, title, children }) {
  return (
    <div className="border-t border-gray-100 pt-5 text-left">
      <h4 className="font-black text-green-900 mb-4 flex items-center gap-2">
        <span className="text-green-700">{icon}</span>
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function DetailLine({ icon, label, value }) {
  return (
    <div className="grid grid-cols-[125px_1fr] gap-3 text-sm text-left">
      <span className="text-gray-500 font-semibold flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-gray-800 font-bold">{value}</span>
    </div>
  );
}

export function PermissionLine({ type, text, colorClass = "text-green-600" }) {
  return (
    <div className="flex items-center gap-3 text-sm text-left">
      <span className={`w-2.5 h-2.5 rounded-full ${type === "allow" ? "bg-green-600" : type === "deny" ? "bg-red-500" : "bg-blue-500"}`} />
      <span className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${type === "allow" ? "bg-green-50 text-green-700" : type === "deny" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
        {type === "allow" ? "CHO PHÉP" : type === "deny" ? "TỪ CHỐI" : "QUẢN TRỊ"}
      </span>
      <span className={`font-bold ${colorClass}`}>{text}</span>
    </div>
  );
}

export function TimelineLine({ date, time, text, subText }) {
  return (
    <div className="relative text-left pl-6">
      <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/10 border border-white" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-800">{text}</p>
          {subText && (
            <p className="text-xs text-gray-400 font-semibold mt-1 select-all break-all bg-gray-50 border border-gray-100 rounded p-1.5 leading-normal">
              {subText}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-black text-gray-500">{date}</p>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
            {time}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Avatar({ user, size = "normal" }) {
  const getAvatarText = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (
      parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const isLarge = size === "large";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`rounded-2xl object-cover shrink-0 ${isLarge ? "w-16 h-16" : "w-11 h-11"}`}
      />
    );
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br from-green-800 to-green-950 text-white font-black flex items-center justify-center shrink-0 shadow-inner select-none ${isLarge ? "w-16 h-16 text-xl" : "w-11 h-11 text-sm"}`}>
      {getAvatarText(user?.name || user?.email || "User")}
    </div>
  );
}

export function AccountDetailPanel({
  user,
  loading,
  activities,
  onClose,
  onChangeRole,
  onToggleStatus,
  formatDate,
  formatTime,
}) {
  if (!user) {
    return (
      <aside className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center text-gray-400 font-bold">
        Chọn một tài khoản để xem chi tiết
      </aside>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  const isMe = currentUser.id === user.id;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 xl:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto xl:static xl:z-auto xl:w-auto xl:max-w-none xl:rounded-3xl xl:border xl:border-gray-100 xl:shadow-sm xl:overflow-hidden xl:sticky xl:top-4 text-left">
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

      <div className="p-5 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar user={user} size="large" />

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-gray-900 truncate">
              {user.name || "Chưa cập nhật"}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <RoleBadgeText role={user.role} />
              <StatusBadgeText status={user.status} />
            </div>
          </div>
        </div>

        <DetailBox icon={<UserRound size={18} />} title="Thông tin cơ bản">
          <DetailLine icon={<Mail size={16} />} label="Email" value={user.email} />
          <DetailLine icon={<Phone size={16} />} label="SĐT" value={user.phone || "Chưa cập nhật"} />
          <DetailLine icon={<CalendarDays size={16} />} label="Ngày tham gia" value={formatDate(user.createdAt)} />
        </DetailBox>

        <DetailBox icon={<ShieldCheck size={18} />} title="Quyền truy cập">
          {user.role === "admin" && (
            <PermissionLine type="admin" text="Quyền tối cao hệ thống" />
          )}

          {user.role === "manager" && (
            <>
              <PermissionLine type="allow" text="Quản lý món ăn & Thực đơn" />
              <PermissionLine type="allow" text="Quản lý đặt bàn & Hóa đơn" />
              <PermissionLine type="allow" text="Quản lý chương trình khuyến mãi" />
              <PermissionLine type="deny" text="Thay đổi phân quyền tài khoản" />
            </>
          )}

          {user.role === "staff" && (
            <>
              <PermissionLine type="allow" text="Tạo đặt bàn & gọi món trực tiếp" />
              <PermissionLine type="allow" text="Cập nhật trạng thái bàn ăn" />
              <PermissionLine type="deny" text="Thay đổi giá món, tạo code giảm giá" />
              <PermissionLine type="deny" text="Truy cập báo cáo doanh thu" />
            </>
          )}

          {user.role === "user" && (
            <>
              <PermissionLine type="allow" text="Đặt bàn trực tuyến, xem lịch sử cá nhân" />
              <PermissionLine type="deny" text="Truy cập bảng điều khiển Admin" />
            </>
          )}
        </DetailBox>

        <DetailBox icon={<Clock3 size={18} />} title="Nhật ký tài khoản">
          {loading ? (
            <p className="text-xs font-bold text-gray-400 py-2">
              Đang tải nhật ký...
            </p>
          ) : activities.length === 0 ? (
            <p className="text-xs font-bold text-gray-400 py-2">
              Chưa có nhật ký hoạt động nào.
            </p>
          ) : (
            <div className="relative border-l border-gray-100 pl-4 ml-1 space-y-4 max-h-[190px] overflow-y-auto pr-2 py-1">
              {activities.map((act) => (
                <TimelineLine
                  key={act.id}
                  date={formatDate(act.createdAt)}
                  time={formatTime(act.createdAt)}
                  text={act.message || act.details || translateAction(act.action)}
                />
              ))}
            </div>
          )}
        </DetailBox>

        {!isMe && (
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <div>
              <label className="text-xs font-black text-gray-400 block mb-2">
                🔄 THAY ĐỔI VAI TRÒ
              </label>

              <select
                value={user.role}
                onChange={(e) => onChangeRole(user, e.target.value)}
                className="w-full h-11 border border-gray-200 bg-white rounded-xl px-3 text-sm font-bold text-gray-800 outline-none shadow-sm"
              >
                <option value="admin">Quản trị viên</option>
                <option value="manager">Quản lý</option>
                <option value="staff">Nhân viên</option>
                <option value="user">Khách hàng</option>
              </select>
            </div>

            <button
              onClick={() => onToggleStatus(user)}
              className={`w-full h-11 rounded-xl font-black text-sm border shadow-sm transition flex items-center justify-center gap-2 ${user.status === "locked" ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"}`}
            >
              {user.status === "locked" ? "🔓 Mở khóa tài khoản" : "🔒 Khóa tài khoản"}
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
