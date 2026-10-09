import { clearAuthSession, getCurrentUser } from "../../utils/auth";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Search,
  ShieldCheck,
  ChevronDown,
  Menu,
} from "lucide-react";
import AppButton from "../ui/AppButton";

function AdminHeader({
  title = "Trang quản trị",
  subtitle = "Quản lý hệ thống",
  action = null,
  globalSearch = "",
  setGlobalSearch,
  dateRange = {
    startDate: "",
    endDate: "",
  },
  setDateRange,
  dateMode = "range",
  setDateMode,
  dateLabel = "",
  setDateLabel,
  hideDatePicker = false,
  middleAction = null,
  notifications = [],
  onToggleMobileSidebar = () => {},
}) {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const popupRef = useRef(null);
  const notificationsPopupRef = useRef(null);

  const formatDateInput = (date) => {
    return date.toISOString().split("T")[0];
  };

  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const ROLE_TEXT = {
    admin: "Quản trị viên",
    manager: "Quản lý",
    staff: "Nhân viên",
    user: "Khách hàng",
  };

  const setWeekByDate = (value) => {
    if (!value) return;

    const selected = new Date(value);
    const day = selected.getDay() || 7;

    const start = new Date(selected);
    start.setDate(selected.getDate() - day + 1);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    setDateRange?.({
      startDate: formatDateInput(start),
      endDate: formatDateInput(end),
    });

    setDateLabel?.(
      `${formatDateDisplay(formatDateInput(start))} - ${formatDateDisplay(
        formatDateInput(end),
      )}`,
    );
  };

  const setMonthByValue = (value) => {
    if (!value) return;

    const [year, month] = value.split("-").map(Number);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    setDateRange?.({
      startDate: formatDateInput(start),
      endDate: formatDateInput(end),
    });

    setDateLabel?.(`Tháng ${month}/${year}`);
  };

  const setYearByValue = (value) => {
    if (!value) return;

    const year = Number(value);

    setDateRange?.({
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    });

    setDateLabel?.(`Năm ${year}`);
  };

  const formatDateDisplay = (value) => {
    if (!value) return "";

    const [year, month, day] = value.split("-");

    return `${day}/${month}/${year}`;
  };

  const displayDate =
    dateLabel ||
    (dateRange.startDate && dateRange.endDate
      ? `${formatDateDisplay(dateRange.startDate)} - ${formatDateDisplay(
          dateRange.endDate,
        )}`
      : "Chọn thời gian");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsDateOpen(false);
      }
      if (notificationsPopupRef.current && !notificationsPopupRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDateOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="h-16 lg:h-[70px] bg-surface-card border-b border-slate-200/80 px-4 lg:px-6 flex items-center justify-between gap-3 shrink-0 z-20 shadow-xs">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Mở menu điều hướng"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 truncate tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block truncate mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Global Search, Date Picker, Actions, Notifications, User Badge, Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Search Input */}
        <div className="hidden xl:flex h-10 w-[200px] 2xl:w-[260px] items-center gap-2 rounded-xl border border-slate-200 bg-surface-0 px-3 transition-all focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            value={globalSearch}
            onChange={(e) => setGlobalSearch?.(e.target.value)}
            placeholder="Tìm kiếm..."
            aria-label="Tìm kiếm trong hệ thống"
            className="w-full outline-none text-xs font-medium bg-transparent text-slate-800 placeholder-slate-400"
          />
        </div>

        {middleAction}

        {/* Date Filter Dropdown */}
        {!hideDatePicker && (
          <div ref={popupRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setIsDateOpen(!isDateOpen)}
              aria-expanded={isDateOpen}
              aria-haspopup="dialog"
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-surface-card shadow-xs text-xs font-bold text-slate-700 flex items-center justify-between gap-2.5 hover:bg-slate-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CalendarDays size={16} className="text-emerald-700 shrink-0" />
                <span className="truncate">{displayDate}</span>
              </div>
              <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform ${isDateOpen ? "rotate-180" : ""}`} />
            </button>

            {isDateOpen && (
              <div className="absolute right-0 top-12 z-50 w-[340px] rounded-2xl border border-slate-200 bg-surface-card shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150">
                {/* Segmented controls */}
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl mb-4">
                  {[
                    { id: "range", label: "Ngày" },
                    { id: "week", label: "Tuần" },
                    { id: "month", label: "Tháng" },
                    { id: "year", label: "Năm" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setDateMode?.(mode.id);
                        if (mode.id === "range") setDateLabel?.("");
                      }}
                      className={`h-8 rounded-lg text-xs font-bold transition ${
                        dateMode === mode.id
                          ? "bg-surface-card text-emerald-800 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {dateMode === "range" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="space-y-1 block text-left">
                      <span className="text-[11px] font-bold text-slate-500">Từ ngày</span>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => {
                          setDateRange?.((prev) => ({ ...prev, startDate: e.target.value }));
                          setDateLabel?.("");
                        }}
                        className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </label>

                    <label className="space-y-1 block text-left">
                      <span className="text-[11px] font-bold text-slate-500">Đến ngày</span>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => {
                          setDateRange?.((prev) => ({ ...prev, endDate: e.target.value }));
                          setDateLabel?.("");
                        }}
                        className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </label>
                  </div>
                )}

                {dateMode === "week" && (
                  <label className="space-y-1 block text-left">
                    <span className="text-[11px] font-bold text-slate-500">Chọn một ngày trong tuần</span>
                    <input
                      type="date"
                      onChange={(e) => setWeekByDate(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Hệ thống tự động tính từ Thứ 2 đến Chủ nhật của tuần.
                    </p>
                  </label>
                )}

                {dateMode === "month" && (
                  <label className="space-y-1 block text-left">
                    <span className="text-[11px] font-bold text-slate-500">Chọn tháng</span>
                    <input
                      type="month"
                      onChange={(e) => setMonthByValue(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </label>
                )}

                {dateMode === "year" && (
                  <label className="space-y-1 block text-left">
                    <span className="text-[11px] font-bold text-slate-500">Chọn năm</span>
                    <input
                      type="number"
                      min="2020"
                      max="2100"
                      placeholder="VD: 2026"
                      onChange={(e) => setYearByValue(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </label>
                )}

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                  <AppButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange?.({ startDate: "", endDate: "" });
                      setDateLabel?.("");
                    }}
                  >
                    Xóa
                  </AppButton>
                  <AppButton
                    variant="primary"
                    size="sm"
                    onClick={() => setIsDateOpen(false)}
                  >
                    Áp dụng
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        )}

        {action}

        {/* Notifications Popover */}
        <div ref={notificationsPopupRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label="Thông báo hệ thống"
            title="Thông báo hệ thống"
            aria-expanded={isNotificationsOpen}
            className="relative w-10 h-10 rounded-xl bg-surface-card border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:text-emerald-800 hover:bg-slate-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                {notifications.length}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-[300px] sm:w-[350px] rounded-2xl border border-slate-200 bg-surface-card shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Thông báo mới</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                    {notifications.length} cần xử lý
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">
                  Không có thông báo mới
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((n) => {
                    const isOrder = n.type === "order";
                    const d = n.details || {};
                    const infoLine = isOrder
                      ? `#${d.orderCode} · ${d.customerName} · ${Number(d.total || 0).toLocaleString("vi-VN")}đ`
                      : `${d.bookingCode} · ${d.customerName} · ${d.time}${d.date ? ", " + d.date : ""}`;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          navigate(n.link);
                          setIsNotificationsOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 hover:bg-slate-50 transition text-left border-l-[3px] block ${
                          isOrder
                            ? "border-l-amber-500 bg-amber-50/30"
                            : "border-l-blue-500 bg-blue-50/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOrder
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isOrder ? "🛒" : "📅"} {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p
                          className={`text-xs font-semibold truncate ${
                            isOrder ? "text-amber-950" : "text-blue-950"
                          }`}
                        >
                          {infoLine}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Role Badge */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 text-emerald-700 px-3.5 h-10 rounded-xl text-xs font-bold shadow-2xs">
          <ShieldCheck size={16} className="text-emerald-700" />
          <span className="truncate">{currentUser?.name || "Admin"}</span>
          <span className="text-[10px] text-emerald-700 font-black hidden lg:inline">
            ({ROLE_TEXT[currentUser?.role] || "Nhân viên"})
          </span>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
