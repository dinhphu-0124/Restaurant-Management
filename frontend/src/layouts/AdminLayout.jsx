import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import { Download, Plus } from "lucide-react";
import AppButton from "../components/ui/AppButton";
import { getCurrentUser, getAuthToken } from "../utils/auth";
import { canUseAction } from "../utils/permissions";
import { socket } from "../utils/socket";
import { API_BASE_URL } from "../config/api";

function AdminLayout() {
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [exportExcelHandler, setExportExcelHandler] = useState(null);
  const [headerAction, setHeaderAction] = useState(null);
  // tìm kiếm
  const [globalSearch, setGlobalSearch] = useState("");

  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const [dateMode, setDateMode] = useState("range");
  const [dateLabel, setDateLabel] = useState("");
  
  // Thông báo
  const [notifications, setNotifications] = useState([]);
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Desktop sidebar collapsed state (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch (e) {
        console.error("Lỗi lưu trạng thái sidebar:", e);
      }
      return next;
    });
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/admin/dashboard/notifications`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds

    // Nghe sự kiện cập nhật để fetch ngay lập tức
    const handleUpdate = () => fetchNotifications();
    window.addEventListener("bookingsUpdated", handleUpdate);
    window.addEventListener("ordersUpdated", handleUpdate);

    // Nghe socket realtime: đơn hàng mới và đặt bàn mới
    socket.on("new_order", handleUpdate);
    socket.on("table_updated", handleUpdate);
    socket.on("order_updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("bookingsUpdated", handleUpdate);
      window.removeEventListener("ordersUpdated", handleUpdate);
      socket.off("new_order", handleUpdate);
      socket.off("table_updated", handleUpdate);
      socket.off("order_updated", handleUpdate);
    };
  }, []);

  const pageInfo = {
    "/admin/dashboard": {
      title: "Tổng quan",
      subtitle: "Thống kê hoạt động nhà hàng",
    },
    "/admin/orders": {
      title: "Quản lý đơn hàng",
      subtitle: "Theo dõi và xử lý đơn hàng",
    },
    "/admin/bookings": {
      title: "Quản lý đặt bàn",
      subtitle: "Quản lý lịch đặt bàn",
    },
    "/admin/menu": {
      title: "Quản lý thực đơn",
      subtitle: "Thêm, sửa và cập nhật món ăn",
    },
    "/admin/tables": {
      title: "Quản lý bàn",
      subtitle: "Quản lý sơ đồ bàn và thêm bàn",
    },
    "/admin/spaces": {
      title: "Không gian & Khu vực",
      subtitle: "Quản lý không gian nhà hàng và khu vực",
    },
    "/admin/users": {
      title: "Khách hàng",
      subtitle: "Thông tin khách hàng",
    },
    "/admin/deals": {
      title: "Khuyến mãi",
      subtitle: "Quản lý ưu đãi và mã giảm giá",
    },
    "/admin/revenue": {
      title: "Doanh thu",
      subtitle: "Theo dõi doanh thu nhà hàng",
    },
    "/admin/reports": {
      title: "Báo cáo chi tiết",
      subtitle: "Phân tích dữ liệu hoạt động",
    },
    "/admin/settings": {
      title: "Cài đặt",
      subtitle: "Cấu hình hệ thống",
    },
    "/admin/roles": {
      title: "Vai trò",
      subtitle: "Phân quyền quản trị",
    },
    "/admin/logs": {
      title: "Nhật ký hoạt động",
      subtitle: "Lịch sử thao tác hệ thống",
    },
  };

  const currentPage = pageInfo[location.pathname] || {
    title: "Trang quản trị",
    subtitle: "Quản lý hệ thống",
  };

  const isOrdersPage = location.pathname === "/admin/orders";
  const isMenuPage = location.pathname === "/admin/menu";
  const isBookingsPage = location.pathname === "/admin/bookings";
  const isTablesPage = location.pathname === "/admin/tables";
  const isSpacesPage = location.pathname === "/admin/spaces";
  const isDealsPage = location.pathname === "/admin/deals";
  const isRevenuePage = location.pathname === "/admin/revenue";
  const isReportsPage = location.pathname === "/admin/reports";

  const pageAction = (isOrdersPage || isRevenuePage || isReportsPage) && canUseAction(currentUser, "reports:export") ? (
    <AppButton
      variant="primary"
      size="md"
      leftIcon={<Download size={16} className="shrink-0" />}
      onClick={() => exportExcelHandler && exportExcelHandler()}
      disabled={!exportExcelHandler}
      className="shadow-sm whitespace-nowrap shrink-0 text-xs sm:text-sm px-2.5 sm:px-4 h-9 sm:h-10"
    >
      <span className="hidden sm:inline">Xuất Excel</span>
      <span className="sm:hidden">Excel</span>
    </AppButton>
  ) : (isMenuPage || isSpacesPage) && headerAction ? (
    <AppButton
      variant="primary"
      size="md"
      leftIcon={<Plus size={16} className="shrink-0" />}
      onClick={headerAction.onClick}
      className="shadow-sm whitespace-nowrap shrink-0 text-xs sm:text-sm px-2.5 sm:px-4 h-9 sm:h-10"
    >
      <span className="hidden sm:inline">{headerAction.label}</span>
      <span className="sm:hidden">{headerAction.label.replace("Thêm ", "+ ")}</span>
    </AppButton>
  ) : (isBookingsPage || isTablesPage) && canUseAction(currentUser, "bookings:create") ? (
    <AppButton
      variant="primary"
      size="md"
      leftIcon={<Plus size={16} className="shrink-0" />}
      onClick={() => window.dispatchEvent(new Event("openAddBookingModal"))}
      className="shadow-sm whitespace-nowrap shrink-0 text-xs sm:text-sm px-2.5 sm:px-4 h-9 sm:h-10"
    >
      <span className="hidden sm:inline">Thêm đặt bàn</span>
      <span className="sm:hidden">Đặt bàn</span>
    </AppButton>
  ) : isDealsPage && canUseAction(currentUser, "promotions:create") ? (
    <AppButton
      variant="primary"
      size="md"
      leftIcon={<Plus size={16} className="shrink-0" />}
      onClick={() => window.dispatchEvent(new Event("openAddDealModal"))}
      className="shadow-sm whitespace-nowrap shrink-0 text-xs sm:text-sm px-2.5 sm:px-4 h-9 sm:h-10"
    >
      <span className="hidden sm:inline">Thêm khuyến mãi</span>
      <span className="sm:hidden">Thêm KM</span>
    </AppButton>
  ) : null;

  return (
    <div className="h-screen bg-surface-0 flex overflow-hidden font-sans">
      <AdminSidebar
        notifications={notifications}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <AdminHeader
          title={currentPage.title}
          subtitle={currentPage.subtitle}
          action={pageAction}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          dateRange={dateRange}
          setDateRange={setDateRange}
          dateMode={dateMode}
          setDateMode={setDateMode}
          dateLabel={dateLabel}
          setDateLabel={setDateLabel}
          hideDatePicker={isMenuPage || isRevenuePage}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          middleAction={
            isMenuPage ? (
              <AppButton
                variant="outline"
                size="md"
                onClick={() => window.dispatchEvent(new Event("openCategoryManagementModal"))}
                className="whitespace-nowrap shrink-0 bg-white text-xs sm:text-sm px-2.5 sm:px-4 h-9 sm:h-10 hidden md:inline-flex"
              >
                Quản lý danh mục
              </AppButton>
            ) : null
          }
          notifications={notifications}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 bg-surface-0">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet
              context={{
                setExportExcelHandler,
                setHeaderAction,
                globalSearch,
                dateRange,
                dateMode,
                dateLabel,
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
