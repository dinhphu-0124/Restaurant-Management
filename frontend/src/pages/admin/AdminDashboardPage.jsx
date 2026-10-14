import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuthToken, getCurrentUser } from "../../utils/auth";
import {
  DashboardCard,
  StatusLine,
  PanelHeader,
  EmptyRow,
  SmallStat,
  CategoryLine,
} from "../../components/admin/AdminDashboardComponents";
import AppButton from "../../components/ui/AppButton";
import AppSkeleton from "../../components/ui/AppSkeleton";
import {
  ShoppingBag,
  CalendarCheck,
  Users,
  Wallet,
  Clock3,
  CheckCircle,
  XCircle,
  Truck,
  Utensils,
  Crown,
  Star,
  RefreshCw,
} from "lucide-react";
import {
  formatPriceDashboard,
  formatDateTimeDashboard,
  formatDateDashboard,
  getOrderStatusStyle,
  getOrderStatusText,
  getBookingStatusStyle,
  getBookingStatusText,
} from "../../utils/dashboardHelpers";
import { API_BASE_URL } from "../../config/api";

const API_URL = `${API_BASE_URL}/admin/dashboard/stats`;

function AdminDashboardPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isStaff = currentUser?.role === "staff";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueRange, setRevenueRange] = useState("7");
  const [categoryRange, setCategoryRange] = useState("week");
  const [chartProgress, setChartProgress] = useState(0);
  const animFrameRef = useRef(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const fetchStats = async (revRange = revenueRange, catRange = categoryRange) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_URL}?revenueRange=${revRange}&categoryRange=${catRange}`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || "Không thể tải dữ liệu thống kê.");
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(revenueRange, categoryRange);
  }, [revenueRange, categoryRange]);

  useEffect(() => {
    if (!loading && stats) {
      const DURATION = 1500;
      const startTime = performance.now();
      const tick = (now) => {
        const elapsed = now - startTime;
        const raw = Math.min(elapsed / DURATION, 1);
        const eased = 1 - Math.pow(1 - raw, 3);
        setChartProgress(eased);
        if (raw < 1) animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [loading, stats]);

  const {
    totalUsers = 0,
    totalOrders = 0,
    totalBookings = 0,
    totalRevenue = 0,
    totalProfit = 0,
    totalBookingGuests = 0,
    activeMenuItems = 0,
    orderStatusBreakdown = {},
    latestOrders = [],
    latestBookings = [],
    bestFoods = [],
    categoryRevenue = [],
    dailyLabels = [],
    dailyRevenues = [],
    dailyProfits = [],
    growths = {},
  } = stats || {};

  const orderStatusPending = orderStatusBreakdown.pending || 0;
  const orderStatusPreparing = orderStatusBreakdown.preparing || 0;
  const orderStatusDelivering = orderStatusBreakdown.delivering || 0;
  const orderStatusCompleted = orderStatusBreakdown.completed || 0;
  const orderStatusCancelled = orderStatusBreakdown.cancelled || 0;

  // Skeleton Loading State to prevent layout jump
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Đang tải dữ liệu dashboard">
        {/* KPI Skeleton Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[...Array(isStaff ? 3 : 5)].map((_, i) => (
            <div key={i} className="bg-surface-card rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <AppSkeleton variant="circle" width="36px" height="36px" />
                <AppSkeleton variant="rounded" width="48px" height="18px" />
              </div>
              <AppSkeleton variant="text" width="60%" height="12px" />
              <AppSkeleton variant="text" width="85%" height="24px" />
            </div>
          ))}
        </div>

        {/* Charts & Status Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-surface-card rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <AppSkeleton variant="text" width="40%" height="20px" />
            <AppSkeleton variant="rounded" width="100%" height="180px" />
          </div>
          <div className="bg-surface-card rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <AppSkeleton variant="text" width="40%" height="20px" />
            <AppSkeleton variant="rounded" width="100%" height="180px" />
          </div>
          <div className="bg-surface-card rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <AppSkeleton variant="text" width="40%" height="20px" />
            <AppSkeleton variant="rounded" width="100%" height="180px" />
          </div>
        </div>

        {/* Tables Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface-card rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <AppSkeleton variant="text" width="50%" height="18px" />
              <div className="space-y-2 pt-2">
                {[...Array(4)].map((_, j) => (
                  <AppSkeleton key={j} variant="rounded" width="100%" height="36px" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-8 bg-rose-50/50 border border-rose-200/80 rounded-2xl text-center space-y-3 max-w-md mx-auto my-16 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle size={24} />
        </div>
        <h3 className="font-bold text-rose-900 text-base">Đã xảy ra lỗi</h3>
        <p className="text-xs text-rose-700 font-medium">{error}</p>
        <div className="pt-2">
          <AppButton
            variant="danger"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => fetchStats()}
          >
            Thử lại
          </AppButton>
        </div>
      </div>
    );
  }

  const maxDailyValue = Math.max(...dailyRevenues, 1000000);
  const totalOrdersRevenue = categoryRevenue.reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0
  );
  const centerPrice =
    hoveredCategory !== null
      ? categoryRevenue[hoveredCategory]?.revenue || 0
      : totalRevenue;
  const centerTitle =
    hoveredCategory !== null
      ? categoryRevenue[hoveredCategory]?.name
      : "Tổng doanh thu";

  const renderOrderStatusSection = () => (
    <section className="bg-surface-card rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-emerald-200 transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-900 tracking-tight">Trạng thái đơn hàng</h3>
        <Link
          to="/admin/orders"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          Xem tất cả →
        </Link>
      </div>
      <div className="space-y-1 divide-y divide-slate-50">
        <StatusLine
          icon={<Clock3 />}
          title="Chờ xác nhận"
          value={orderStatusPending}
          bg="bg-amber-50"
          color="text-amber-600"
          total={totalOrders}
          chartProgress={chartProgress}
          to="/admin/orders?status=pending"
        />
        <StatusLine
          icon={<ShoppingBag />}
          title="Đang chuẩn bị"
          value={orderStatusPreparing}
          bg="bg-blue-50"
          color="text-blue-600"
          total={totalOrders}
          chartProgress={chartProgress}
          to="/admin/orders?status=preparing"
        />
        <StatusLine
          icon={<Truck />}
          title="Đang giao"
          value={orderStatusDelivering}
          bg="bg-emerald-50"
          color="text-emerald-600"
          total={totalOrders}
          chartProgress={chartProgress}
          to="/admin/orders?status=delivering"
        />
        <StatusLine
          icon={<CheckCircle />}
          title="Hoàn thành"
          value={orderStatusCompleted}
          bg="bg-teal-50"
          color="text-teal-600"
          total={totalOrders}
          chartProgress={chartProgress}
          to="/admin/orders?status=completed"
        />
        <StatusLine
          icon={<XCircle />}
          title="Đã hủy"
          value={orderStatusCancelled}
          bg="bg-rose-50"
          color="text-rose-500"
          total={totalOrders}
          chartProgress={chartProgress}
          to="/admin/orders?status=cancelled"
        />
      </div>
    </section>
  );

  const renderBestFoodsSection = () => (
    <section className="bg-surface-card rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hover:border-emerald-200 transition-all duration-200">
      <PanelHeader title="Món ăn bán chạy" to="/admin/menu" />
      <div className="p-3.5 space-y-2 max-h-[340px] overflow-y-auto">
        {bestFoods.length > 0 ? (
          bestFoods.map((food, index) => (
            <Link
              key={food.name}
              to={`/admin/menu?view=${food.id}`}
              className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors block text-left"
            >
              <img
                src={food.image}
                alt={food.name}
                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/60 shadow-2xs"
              />
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500 shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-xs truncate leading-tight">
                  {food.name}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Đã bán: <span className="font-bold text-slate-700">{food.qty}</span>
                </p>
              </div>
              <p className="font-black text-emerald-800 text-xs shrink-0">
                {formatPriceDashboard(food.price)}
              </p>
            </Link>
          ))
        ) : (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            Chưa có dữ liệu món bán chạy
          </div>
        )}
      </div>
    </section>
  );

  const renderLatestOrdersSection = (forStaff = false) => (
    <section className="bg-surface-card rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hover:border-emerald-200 transition-all duration-200">
      <PanelHeader title="Đơn hàng gần đây" to="/admin/orders" />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-400 font-bold bg-slate-50/80 uppercase text-[10px] border-b border-slate-100">
            <tr>
              <th className="pl-5 pr-2 py-2.5">Mã đơn</th>
              <th className="px-3 py-2.5">Khách hàng</th>
              {!forStaff && <th className="px-3 py-2.5">Tổng tiền</th>}
              <th className="px-3 py-2.5">Trạng thái</th>
              <th className="pl-2 pr-5 py-2.5">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {latestOrders.length > 0 ? (
              latestOrders.map((order, index) => (
                <tr
                  key={order.id || index}
                  onClick={() =>
                    navigate(
                      `/admin/orders?search=${order.orderCode || order.id}&view=${order.id}`
                    )
                  }
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="pl-5 pr-2 py-3 font-bold text-emerald-800 whitespace-nowrap">
                    #{order.id}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-bold text-slate-800 truncate max-w-[110px]">
                      {order.customerName || order.fullName || order.name || "Khách hàng"}
                    </p>
                  </td>
                  {!forStaff && (
                    <td className="px-3 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {formatPriceDashboard(order.total || order.totalPrice)}
                    </td>
                  )}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${getOrderStatusStyle(
                        order.status
                      )}`}
                    >
                      {getOrderStatusText(order.status)}
                    </span>
                  </td>
                  <td className="pl-2 pr-5 py-3 text-slate-500 font-medium whitespace-nowrap text-[11px]">
                    {forStaff
                      ? formatDateTimeDashboard(order.createdAt)
                      : order.createdAt
                      ? order.createdAt.slice(11, 16)
                      : "--:--"}
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={forStaff ? "4" : "5"} text="Chưa có đơn hàng mới" />
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderLatestBookingsSection = (forStaff = false) => (
    <section className="bg-surface-card rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hover:border-emerald-200 transition-all duration-200">
      <PanelHeader title="Lịch đặt bàn gần đây" to="/admin/bookings" />
      <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
        {latestBookings.length > 0 ? (
          latestBookings.map((booking, index) => (
            <Link
              key={booking.id || index}
              to={`/admin/bookings?search=${
                booking.bookingCode || booking.phone || booking.id
              }&view=${booking.id}`}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors block text-left"
            >
              {forStaff ? (
                <>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {booking.customerName || booking.name || "Khách đặt bàn"}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        ({booking.guests || 0} khách)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Ngày: {formatDateDashboard(booking.date)} | Giờ: {booking.time}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${getBookingStatusStyle(
                      booking.status
                    )}`}
                  >
                    {getBookingStatusText(booking.status)}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex flex-col items-center justify-center font-bold text-[10px] p-1 shrink-0">
                      <span className="text-[8px] uppercase tracking-wider text-emerald-600 font-black">
                        Hôm nay
                      </span>
                      <span>{booking.time ? booking.time.slice(0, 5) : "--:--"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {booking.customerName || booking.fullName || booking.name || "Khách hàng"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {booking.phone || "Chưa có SĐT"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                        {booking.selectedAreaTitle || booking.area || "Nhà hàng xếp"} - Bàn{" "}
                        {booking.selectedTable || "Đang xếp"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${getBookingStatusStyle(
                      booking.status
                    )}`}
                  >
                    {getBookingStatusText(booking.status)}
                  </span>
                </>
              )}
            </Link>
          ))
        ) : (
          <div className="px-5 py-12 text-center text-slate-400 font-medium text-xs">
            Chưa có lịch đặt bàn
          </div>
        )}
      </div>
    </section>
  );

  // Staff view
  if (isStaff) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <DashboardCard
            icon={<ShoppingBag />}
            title="Đơn hàng"
            value={totalOrders}
            percent={growths.orders || "0.0%"}
            bg="bg-blue-50"
            color="text-blue-600"
            to="/admin/orders"
          />
          <DashboardCard
            icon={<CalendarCheck />}
            title="Đặt bàn"
            value={totalBookings}
            percent={growths.bookings || "0.0%"}
            bg="bg-purple-50"
            color="text-purple-600"
            to="/admin/bookings"
          />
          <DashboardCard
            icon={<Users />}
            title="Khách hàng mới"
            value={totalUsers}
            percent={growths.users || "0.0%"}
            bg="bg-amber-50"
            color="text-amber-600"
            to="/admin/users"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderOrderStatusSection()}
          {renderBestFoodsSection()}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderLatestOrdersSection(true)}
          {renderLatestBookingsSection(true)}
        </div>
      </div>
    );
  }

  // Admin / Manager view
  return (
    <div className="space-y-4">
      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <DashboardCard
          icon={<Wallet />}
          title="Tổng doanh thu"
          value={totalRevenue}
          isCurrency={true}
          percent={growths.revenue || "0.0%"}
          bg="bg-emerald-50"
          color="text-emerald-700"
          to="/admin/revenue"
        />
        <DashboardCard
          icon={<ShoppingBag />}
          title="Đơn hàng"
          value={totalOrders}
          percent={growths.orders || "0.0%"}
          bg="bg-blue-50"
          color="text-blue-600"
          to="/admin/orders"
        />
        <DashboardCard
          icon={<CalendarCheck />}
          title="Đặt bàn"
          value={totalBookings}
          percent={growths.bookings || "0.0%"}
          bg="bg-purple-50"
          color="text-purple-600"
          to="/admin/bookings"
        />
        <DashboardCard
          icon={<Users />}
          title="Khách hàng mới"
          value={totalUsers}
          percent={growths.users || "0.0%"}
          bg="bg-amber-50"
          color="text-amber-600"
          to="/admin/users"
        />
        <DashboardCard
          icon={<Wallet />}
          title="Lợi nhuận"
          value={totalProfit}
          isCurrency={true}
          percent={growths.profit || "0.0%"}
          bg="bg-teal-50"
          color="text-teal-700"
          to="/admin/revenue"
        />
      </div>

      {/* Charts + Order Status 3-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] xl:grid-cols-[1.35fr_1.05fr_.8fr] gap-4">
        {/* Revenue Bar Chart */}
        <section className="bg-surface-card rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-emerald-200 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Doanh thu</h3>
              <select
                value={revenueRange}
                onChange={(e) => setRevenueRange(e.target.value)}
                className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 outline-none bg-surface-card cursor-pointer focus:border-emerald-600"
              >
                <option value="7">7 ngày qua</option>
                <option value="30">30 ngày qua</option>
                <option value="month">Tháng này</option>
                <option value="year">Năm nay</option>
              </select>
            </div>

            <div className="flex items-center gap-5 mb-4 text-xs font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
                <span>Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Lợi nhuận</span>
              </div>
            </div>
          </div>

          <div>
            <div className="h-[200px] flex items-end gap-3 sm:gap-4 border-b border-l border-slate-100 px-3 pt-4">
              {dailyRevenues.map((rev, index) => {
                const revPercent = (((rev / maxDailyValue) * 85) * chartProgress).toFixed(0);
                const profitPercent = (
                  ((dailyProfits[index] / maxDailyValue) * 85) *
                  chartProgress
                ).toFixed(0);
                return (
                  <div key={index} className="flex-1 flex items-end gap-1 sm:gap-1.5 h-full">
                    {/* Revenue Bar */}
                    <div
                      className="w-full rounded-t-md bg-emerald-800 hover:bg-emerald-700 cursor-pointer relative group transition-all"
                      style={{ height: `${revPercent}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md font-bold pointer-events-none transition duration-150 whitespace-nowrap z-50 shadow-md">
                        Doanh thu: {formatPriceDashboard(rev)}
                      </div>
                    </div>
                    {/* Profit Bar */}
                    <div
                      className="w-full rounded-t-md bg-amber-500 hover:bg-amber-600 cursor-pointer relative group transition-all"
                      style={{ height: `${profitPercent}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md font-bold pointer-events-none transition duration-150 whitespace-nowrap z-50 shadow-md">
                        Lợi nhuận: {formatPriceDashboard(dailyProfits[index])}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] text-slate-400 font-bold mt-2">
              {dailyLabels.map((day) => (
                <span key={day} className="truncate">
                  {day}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Category Breakdown Donut Chart */}
        <section className="bg-surface-card rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-emerald-200 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Doanh thu theo danh mục
              </h3>
              <select
                value={categoryRange}
                onChange={(e) => setCategoryRange(e.target.value)}
                className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 outline-none bg-surface-card cursor-pointer focus:border-emerald-600"
              >
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="year">Năm nay</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-[180px_1fr] gap-4 items-center my-auto">
            {(() => {
              const hexColors = ["#16a34a", "#f59e0b", "#3b82f6", "#8b5cf6", "#9ca3af"];
              const slices = categoryRevenue.slice(0, 5).map((cat, idx) => ({
                color: hexColors[idx % hexColors.length],
                pct:
                  totalOrdersRevenue > 0
                    ? (cat.revenue / totalOrdersRevenue) * 100
                    : 0,
              }));
              const totalPct = slices.reduce((s, x) => s + x.pct, 0);
              let cursor = 0;
              const stops = [];
              slices.forEach(({ color, pct }) => {
                const start = cursor * chartProgress;
                const end = (cursor + pct) * chartProgress;
                stops.push(`${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
                cursor += pct;
              });
              const grayEnd = totalPct * chartProgress;
              stops.push(`#f1f5f9 ${grayEnd.toFixed(2)}% 100%`);
              const gradient =
                slices.length > 0
                  ? `conic-gradient(${stops.join(", ")})`
                  : "conic-gradient(#f1f5f9 0 100%)";
              return (
                <div
                  className="relative w-[170px] h-[170px] rounded-full mx-auto shadow-inner"
                  style={{ background: gradient }}
                >
                  <div className="absolute inset-7 bg-surface-card rounded-full flex flex-col items-center justify-center text-center select-none pointer-events-none shadow-xs">
                    <div className="w-[100px] overflow-hidden truncate font-black text-emerald-800 text-sm leading-tight">
                      {formatPriceDashboard(centerPrice)}
                    </div>
                    <div className="w-[100px] overflow-hidden truncate text-[9px] text-slate-400 font-bold mt-0.5">
                      {centerTitle}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3">
              {categoryRevenue.length > 0 ? (
                categoryRevenue.slice(0, 5).map((cat, idx) => {
                  const colors = [
                    "bg-green-600",
                    "bg-amber-500",
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-slate-400",
                  ];
                  const pct =
                    totalOrdersRevenue > 0
                      ? ((cat.revenue / totalOrdersRevenue) * 100).toFixed(1) + "%"
                      : "0%";
                  return (
                    <div
                      key={`${cat.name}-${idx}`}
                      onMouseEnter={() => setHoveredCategory(idx)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className="cursor-pointer"
                    >
                      <CategoryLine
                        color={colors[idx % colors.length]}
                        name={cat.name}
                        value={pct}
                        chartProgress={chartProgress}
                      />
                    </div>
                  );
                })
              ) : (
                <>
                  <CategoryLine
                    color="bg-green-600"
                    name="Dê tươi"
                    value="0%"
                    chartProgress={chartProgress}
                  />
                  <CategoryLine
                    color="bg-amber-500"
                    name="Lẩu"
                    value="0%"
                    chartProgress={chartProgress}
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {/* Order Status Section */}
        {renderOrderStatusSection()}
      </div>

      {/* 3 Column Data Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {renderLatestOrdersSection(false)}
        {renderLatestBookingsSection(false)}
        {renderBestFoodsSection()}
      </div>

      {/* 5 Bottom Small Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <SmallStat
          icon={<Users size={16} />}
          title="Tổng khách hàng"
          value={totalUsers}
          change="8.2%"
        />
        <SmallStat
          icon={<Crown size={16} />}
          title="Khách thân thiết"
          value={Math.round(totalUsers * 0.2)}
          change="6.1%"
          orange
        />
        <SmallStat
          icon={<Utensils size={16} />}
          title="Tổng khách đặt bàn"
          value={totalBookingGuests}
          change="+3"
        />
        <SmallStat
          icon={<Users size={16} />}
          title="Nhân viên"
          value="24"
          change="+2"
        />
        <SmallStat
          icon={<Star size={16} />}
          title="Đánh giá TB"
          value="4.8/5"
        />
      </div>
    </div>
  );
}

export default AdminDashboardPage;
