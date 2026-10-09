import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarCheck,
  Utensils,
  Gift,
  Users,
  BarChart3,
  Store,
  Settings,
  ShieldCheck,
  ClipboardList,
  LogOut,
  Image,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { clearAuthSession, getCurrentUser } from "../../utils/auth";
import { canAccessAdminRoute } from "../../utils/permissions";
import goatIcon from "../../assets/images/Icon_De.png";

const ROLE_TEXT = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  user: "Khách hàng",
};

function AdminSidebar({
  notifications = [],
  isOpen = false,
  onClose = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {},
}) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const currentRole = currentUser?.role || "staff";

  const handleLogout = () => {
    clearAuthSession();
    navigate("/admin/login");
  };

  const menus = [
    {
      group: "",
      items: [
        {
          name: "Tổng quan",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
          roles: ["admin", "manager", "staff"],
        },
      ],
    },
    {
      group: "QUẢN LÝ",
      items: [
        {
          name: "Đơn hàng",
          path: "/admin/orders",
          icon: ShoppingCart,
          roles: ["admin", "manager", "staff"],
        },
        {
          name: "Đặt bàn",
          path: "/admin/bookings",
          icon: CalendarCheck,
          roles: ["admin", "manager", "staff"],
        },
        {
          name: "Thực đơn",
          path: "/admin/menu",
          icon: Utensils,
          roles: ["admin", "manager", "staff"],
        },
        {
          name: "Quản lý bàn",
          path: "/admin/tables",
          icon: Store,
          roles: ["admin", "manager", "staff"],
        },
        {
          name: "Không gian & Khu vực",
          path: "/admin/spaces",
          icon: Image,
          roles: ["admin", "manager"],
        },
        {
          name: "Khách hàng",
          path: "/admin/users",
          icon: Users,
          roles: ["admin", "manager"],
        },
        {
          name: "Khuyến mãi",
          path: "/admin/deals",
          icon: Gift,
          roles: ["admin", "manager"],
        },
      ],
    },
    {
      group: "BÁO CÁO",
      items: [
        {
          name: "Doanh thu",
          path: "/admin/revenue",
          icon: BarChart3,
          roles: ["admin", "manager"],
        },
        {
          name: "Báo cáo chi tiết",
          path: "/admin/reports",
          icon: ClipboardList,
          roles: ["admin", "manager"],
        },
      ],
    },
    {
      group: "HỆ THỐNG",
      items: [
        {
          name: "Cài đặt",
          path: "/admin/settings",
          icon: Settings,
          roles: ["admin"],
        },
        {
          name: "Vai trò",
          path: "/admin/roles",
          icon: ShieldCheck,
          roles: ["admin"],
        },
        {
          name: "Nhật ký",
          path: "/admin/logs",
          icon: ClipboardList,
          roles: ["admin"],
        },
      ],
    },
  ];

  const visibleMenus = menus
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessAdminRoute(currentUser, item.path)),
    }))
    .filter((group) => group.items.length > 0);

  const displayName = currentUser?.name || currentUser?.fullName || "Admin";
  const displayRole = ROLE_TEXT[currentRole] || "Nhân viên";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const renderSidebarContent = (isMini = false, isMobile = false) => (
    <div className="flex flex-col h-full bg-[#145c30] text-white select-none">
      {/* Brand Header */}
      <div
        className={`border-b border-white/10 flex items-center transition-all duration-300 ${
          isMini
            ? "px-3 py-4 flex-col gap-2.5 justify-center"
            : "px-4 py-4 justify-between"
        }`}
      >
        <div
          className={`flex items-center gap-3 min-w-0 ${
            isMini ? "justify-center" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
            <img
              src={goatIcon}
              alt="Logo Dê Hương Sơn"
              className="w-full h-full object-contain brightness-0 invert"
            />
          </div>
          {!isMini && (
            <div className="min-w-0">
              <h2 className="text-base font-black tracking-tight leading-none text-white truncate">
                Dê Hương Sơn
              </h2>
              <p className="text-[11px] font-semibold text-emerald-100/80 mt-1 truncate">
                Quản trị nhà hàng
              </p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle Button */}
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isMini ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            aria-label={isMini ? "Mở rộng menu" : "Thu gọn menu"}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition flex items-center justify-center shrink-0"
          >
            {isMini ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {/* Mobile close button */}
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thanh điều hướng"
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav
        aria-label="Thanh điều hướng chính"
        className={`flex-1 overflow-y-auto custom-scrollbar py-4 space-y-5 ${
          isMini ? "px-2" : "px-3"
        }`}
      >
        {visibleMenus.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            {group.group ? (
              !isMini ? (
                <p className="px-3 mb-1.5 text-[10px] font-black tracking-wider text-emerald-200/70 uppercase">
                  {group.group}
                </p>
              ) : (
                <div className="my-2 mx-2 h-px bg-white/10" />
              )
            ) : null}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const count =
                  item.path === "/admin/orders"
                    ? notifications.filter((n) => n.type === "order").length
                    : item.path === "/admin/bookings"
                    ? notifications.filter((n) => n.type === "booking").length
                    : item.path === "/admin/tables"
                    ? notifications.filter((n) => n.type === "unassigned_booking").length
                    : 0;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={isMobile ? onClose : undefined}
                    title={isMini ? item.name : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center rounded-xl text-xs font-bold transition-all duration-150 ${
                        isMini
                          ? "justify-center h-10 w-10 mx-auto"
                          : "gap-3 px-3.5 py-2.5"
                      } ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-md shadow-black/20 font-black ring-1 ring-white/20"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={18} className="shrink-0 opacity-95" />

                    {!isMini && <span className="flex-1 truncate">{item.name}</span>}

                    {count > 0 && (
                      <span
                        className={`rounded-full bg-rose-600 text-white font-black flex items-center justify-center shrink-0 shadow-sm animate-pulse ${
                          isMini
                            ? "absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[9px]"
                            : "min-w-[20px] h-5 px-1.5 text-[10px]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile & Logout footer (Premium UI Redesign) */}
      <div className={`border-t border-white/10 bg-black/25 backdrop-blur-md ${isMini ? "p-2" : "p-3"}`}>
        {isMini ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative shrink-0"
              title={`${displayName} (${displayRole})`}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-400 text-white border border-white/20 flex items-center justify-center font-black text-sm shadow-md">
                {avatarLetter}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 ring-2 ring-[#145c30] rounded-full" />
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
              aria-label="Đăng xuất"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-rose-600 text-emerald-100 hover:text-white transition-all duration-200 flex items-center justify-center shrink-0 shadow-sm hover:shadow-rose-600/30 group"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] transition-all duration-200 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-400 text-white border border-white/20 flex items-center justify-center font-black text-sm shadow-md">
                  {avatarLetter}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 ring-2 ring-[#145c30] rounded-full" />
              </div>

              <div className="min-w-0">
                <p className="font-black text-xs text-white leading-tight truncate tracking-tight">
                  {displayName}
                </p>
                <p className="text-[10px] font-semibold text-emerald-200/90 leading-tight mt-0.5 truncate">
                  {displayRole}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
              aria-label="Đăng xuất"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-600 text-emerald-100 hover:text-white transition-all duration-200 flex items-center justify-center shrink-0 shadow-sm hover:shadow-rose-600/30 group"
            >
              <LogOut size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 h-screen flex-col border-r border-white/10 shadow-xl z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {renderSidebarContent(isCollapsed, false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Drawer (Always full view) */}
      <aside
        aria-label="Thanh điều hướng di động"
        className={`fixed top-0 bottom-0 left-0 w-[280px] max-w-[85vw] z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent(false, true)}
      </aside>
    </>
  );
}

export default AdminSidebar;
