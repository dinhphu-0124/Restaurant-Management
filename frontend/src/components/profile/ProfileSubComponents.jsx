import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GlobalPagination from "../admin/GlobalPagination";
import { showAdminToast } from "../admin/AdminToast";
import { removeVietnameseTones, calculateSearchScore } from "../../utils/string";
import {
  CalendarDays,
  ShoppingCart,
  ReceiptText,
  CreditCard,
  Clock,
  MapPin,
  User,
  Star,
  ChevronRight,
  ArrowRight,
  Utensils,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Store,
  Eye,
  MessageSquarePlus,
  X,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Trash2,
  Minus,
  Plus,
} from "lucide-react";
import { AppBadge, AppButton, AppEmptyState, AppSkeleton } from "../ui";

const API_URL = "http://localhost:5001";

const getAuthToken = () => {
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
};

const handleAuthApiError = (data, navigate) => {
  if (
    data?.code === "ACCOUNT_LOCKED" ||
    data?.code === "ACCOUNT_INACTIVE" ||
    data?.message === "Bạn chưa đăng nhập."
  ) {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("currentUser");
    navigate("/login");
    return true;
  }
  return false;
};

/* ==========================================================================
   ORDER HISTORY CONTENT
   ========================================================================== */
export function OrderHistoryContent() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [savedOrders, setSavedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, statusFilter, timeFilter, searchTerm]);

  const loadMyOrders = async () => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/orders/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (handleAuthApiError(data, navigate)) {
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể tải lịch sử đơn hàng.");
      }

      setSavedOrders(data.orders || []);
    } catch (err) {
      console.error("Lỗi tải lịch sử đơn hàng:", err);
      setError(err.message || "Không thể tải lịch sử đơn hàng.");
      setSavedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyOrders();
    window.addEventListener("ordersUpdated", loadMyOrders);
    return () => {
      window.removeEventListener("ordersUpdated", loadMyOrders);
    };
  }, []);

  const parseDate = (dateString) => {
    if (!dateString) return new Date(0);
    if (String(dateString).includes("/")) {
      const [day, month, year] = dateString.split("/");
      return new Date(`${year}-${month}-${day}`);
    }
    return new Date(dateString);
  };

  const now = new Date();

  // Counts for tabs
  const deliveryCount = useMemo(
    () => savedOrders.filter((o) => (o.serviceType || o.type) === "delivery").length,
    [savedOrders]
  );
  const pickupCount = useMemo(
    () => savedOrders.filter((o) => (o.serviceType || o.type) === "pickup").length,
    [savedOrders]
  );

  const filteredOrders = useMemo(() => {
    const rawKeyword = String(searchTerm || "").trim();
    return savedOrders.filter((order) => {
      // 1. Service type filter
      if (activeFilter !== "all") {
        const type = order.serviceType || order.type;
        if (type !== activeFilter) return false;
      }

      // 2. Status filter
      if (statusFilter !== "all") {
        const st = order.status || "pending";
        if (statusFilter === "in_progress") {
          if (!["pending", "confirmed", "preparing", "delivering"].includes(st)) return false;
        } else if (statusFilter === "completed") {
          if (st !== "completed") return false;
        } else if (statusFilter === "cancelled") {
          if (st !== "cancelled" && st !== "canceled") return false;
        }
      }

      // 3. Time filter
      if (timeFilter !== "all") {
        const orderDate = parseDate(order.createdAt || order.date);
        if (timeFilter === "month") {
          if (
            orderDate.getMonth() !== now.getMonth() ||
            orderDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (timeFilter === "week") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (orderDate < sevenDaysAgo || orderDate > now) {
            return false;
          }
        }
      }

      // 4. Search query
      if (rawKeyword) {
        const foodNames = Array.isArray(order.cartItems)
          ? order.cartItems.map((item) => item.name || "").join(" ")
          : "";
        const score = calculateSearchScore({
          code: String(order.id || ""),
          id: order.id,
          phone: order.phone || "",
          address: order.address || "",
          notes: foodNames
        }, rawKeyword);

        if (score === 0) return false;
      }

      return true;
    });
  }, [savedOrders, activeFilter, statusFilter, timeFilter, searchTerm]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    activeFilter !== "all" ||
    statusFilter !== "all" ||
    timeFilter !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setActiveFilter("all");
    setStatusFilter("all");
    setTimeFilter("all");
  };

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 md:p-7 text-left space-y-5">
      {/* Header & Filter Bar */}
      <div className="space-y-3 pb-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#145c30] tracking-tight">
              Lịch sử đơn hàng
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Theo dõi và quản lý các đơn đặt món của bạn
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            Tổng số: <strong className="text-slate-900">{savedOrders.length}</strong> đơn hàng
          </span>
        </div>

        {/* Unified Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đơn (#123), tên món, địa chỉ..."
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-emerald-700 outline-none transition placeholder:text-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-emerald-700 outline-none transition cursor-pointer flex-1 md:flex-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="in_progress">Đang xử lý / giao</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            {/* Time Select */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-emerald-700 outline-none transition cursor-pointer flex-1 md:flex-none"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="month">Tháng này</option>
              <option value="week">Tuần này</option>
            </select>
          </div>
        </div>

        {/* Service Type Pills & Reset */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { key: "all", label: "Tất cả", count: savedOrders.length },
              { key: "delivery", label: "Giao tận nơi", count: deliveryCount },
              { key: "pickup", label: "Đến lấy", count: pickupCount },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === tab.key
                    ? "bg-[#15803d] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    activeFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer shrink-0"
            >
              <RotateCcw size={11} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="space-y-3 pt-1">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3"
            >
              <div className="flex justify-between items-center">
                <AppSkeleton type="title" className="w-32 h-4" />
                <AppSkeleton type="badge" className="w-20 h-5" />
              </div>
              <div className="flex gap-3 items-center">
                <AppSkeleton type="avatar" className="w-12 h-12 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <AppSkeleton type="text" className="w-1/2" />
                  <AppSkeleton type="text" className="w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <AppEmptyState
          icon={ReceiptText}
          title={
            hasActiveFilters
              ? "Không tìm thấy đơn hàng phù hợp"
              : "Bạn chưa có đơn đặt món nào"
          }
          description={
            hasActiveFilters
              ? "Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc."
              : "Khám phá các món ăn hấp dẫn và đặt món ngay hôm nay!"
          }
          actionText={hasActiveFilters ? "Xóa bộ lọc tìm kiếm" : "Khám phá thực đơn"}
          onAction={hasActiveFilters ? handleResetFilters : () => navigate("/menu")}
          className="py-10"
        />
      )}

      {/* Order Cards List */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {paginatedOrders.map((order, index) => (
            <OrderCard key={`${order.id}-${index}`} order={order} />
          ))}

          {filteredOrders.length > pageSize && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <GlobalPagination
                total={filteredOrders.length}
                page={currentPage}
                limit={pageSize}
                onPageChange={setCurrentPage}
                onLimitChange={setPageSize}
                limitOptions={[5, 10, 20]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   SINGLE ORDER CARD COMPONENT
   ========================================================================== */
export function OrderCard({ order }) {
  const navigate = useNavigate();
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewedIds, setReviewedIds] = useState([]);
  const [isReviewListOpen, setIsReviewListOpen] = useState(false);

  const serviceLabel = {
    dinein: "Ăn tại quán",
    delivery: "Giao tận nơi",
    pickup: "Đến lấy tại quán",
  };

  const paymentLabel = {
    cash: "Tiền mặt",
    bank: "VietQR",
    momo: "MoMo",
    pay_after_meal: "Thanh toán sau",
  };

  const getPaymentMethodText = (o) => {
    const method =
      o.paymentMethod ||
      o.payment_type ||
      o.paymentType ||
      o.payment ||
      "";
    if (paymentLabel[method]) return paymentLabel[method];
    if (method) return method;
    if (o.paymentContent) return "VietQR";
    if (o.paymentStatus === "unpaid") return "Tiền mặt";
    return "Tiền mặt";
  };

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (value) => {
    if (!value) return "Chưa có ngày";
    if (String(value).includes("/")) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN");
  };

  const statusLabel = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    preparing: "Đang chuẩn bị",
    delivering: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
  };

  const statusKey = order.status || "pending";
  const orderStatusText =
    statusLabel[statusKey] ||
    (order.status === "Chờ chọn phương thức thanh toán"
      ? "Chờ xác nhận"
      : order.status || "Chờ xác nhận");

  const paymentStatus = order.paymentStatus || "unpaid";
  const isPaid = paymentStatus === "paid" || paymentStatus === "paid_pending_confirm";

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
  };

  const items = Array.isArray(order.cartItems) ? order.cartItems : [];
  const totalQty =
    items.reduce((sum, item) => sum + Number(item.qty || 1), 0) ||
    order.qty ||
    0;

  const reviewItems = items;
  const currentUser =
    JSON.parse(localStorage.getItem("currentUser")) ||
    JSON.parse(sessionStorage.getItem("currentUser")) ||
    {};

  const canReviewOrder = statusKey === "completed";

  const submitFoodReview = async () => {
    if (!reviewItem) return;
    try {
      const res = await fetch(
        `http://localhost:5001/api/menu-items/${reviewItem.id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            userEmail: currentUser.email,
            userName: currentUser.name,
            rating: reviewRating,
            comment: reviewComment,
          }),
        }
      );
      const result = await res.json();

      if (!result.success) {
        showAdminToast({
          title: "Đánh giá thất bại",
          message: result.message || "Không thể gửi đánh giá.",
          type: "error",
        });
        return;
      }

      showAdminToast({
        title: "Thành công",
        message: "Đánh giá món ăn thành công!",
        type: "success",
      });
      setReviewedIds((prev) => [...prev, reviewItem.id]);
      setReviewItem(null);
      setReviewRating(5);
      setReviewComment("");
    } catch (err) {
      console.error("Lỗi gửi đánh giá:", err);
      showAdminToast({
        title: "Lỗi kết nối",
        message: "Không thể kết nối máy chủ",
        type: "error",
      });
    }
  };

  // Preview names
  const itemNamesSummary = items.length > 0
    ? items.map((i) => {
        const opt = i.priceOptionNote || i.price_option_note ? ` - ${i.priceOptionNote || i.price_option_note}` : "";
        return `${i.name}${opt} (x${i.qty || 1})`;
      }).join(", ")
    : `Đơn đặt món (${totalQty} món)`;

  return (
    <div className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-white hover:border-emerald-300 hover:shadow-sm transition-all text-left space-y-3.5">
      {/* 1. Top Meta Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-[#145c30] text-sm sm:text-base">
            #{order.id}
          </span>
          <span className="text-slate-300">•</span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-[#15803d]">
            {serviceLabel[order.serviceType] || "Đơn hàng"}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500 font-medium">
            {formatDate(order.createdAt)}
            {formatTime(order.createdAt) && `, ${formatTime(order.createdAt)}`}
          </span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <AppBadge status={isPaid ? "paid" : "unpaid"} size="sm" dot>
            {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
          </AppBadge>
          <AppBadge status={statusKey} size="sm" dot>
            {orderStatusText}
          </AppBadge>
        </div>
      </div>

      {/* 2. Middle Content: Compact Dish Preview & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Thumbnail & Dish names summary */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Dish Thumbnails */}
          <div className="flex -space-x-2 shrink-0">
            {items.slice(0, 3).map((item, idx) => (
              <img
                key={idx}
                src={item.image || "/images/placeholder.jpg"}
                alt={item.name}
                className="w-10 h-10 rounded-xl object-cover border-2 border-white bg-slate-100 shadow-2xs"
              />
            ))}
            {items.length === 0 && (
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center border-2 border-white">
                <Utensils size={16} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1" title={itemNamesSummary}>
              {itemNamesSummary}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
              {order.serviceType === "delivery" && order.address && (
                <span className="inline-flex items-center gap-1 truncate max-w-[220px]" title={order.address}>
                  <MapPin size={11} className="text-[#15803d] shrink-0" />
                  <span className="truncate">{order.address}</span>
                </span>
              )}
              {order.serviceType === "dinein" && (
                <span className="inline-flex items-center gap-1">
                  <Store size={11} className="text-[#15803d] shrink-0" />
                  <span>Bàn: {order.table || "Nhà hàng xếp bàn"}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CreditCard size={11} className="text-slate-400 shrink-0" />
                <span>{getPaymentMethodText(order)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Total Price & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Tổng tiền</span>
            <span className="text-sm sm:text-base font-black text-[#145c30]">
              {formatPrice(order.total || order.totalPrice)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {canReviewOrder && reviewItems.length > 0 && (
              <button
                type="button"
                onClick={() => setIsReviewListOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 hover:bg-amber-100 transition cursor-pointer"
              >
                <MessageSquarePlus size={13} />
                <span>Đánh giá</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(`/profile/order-detail/${order.id}`)}
              className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] text-white hover:bg-[#145c30] shadow-2xs hover:shadow transition cursor-pointer"
            >
              <span>Chi tiết</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Review Dishes Selector Modal */}
      {isReviewListOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsReviewListOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Chọn món ăn để đánh giá
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Đơn hàng #{order.id}
                </p>
              </div>
              <button
                onClick={() => setIsReviewListOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {reviewItems.map((item, index) => {
                const itemId = item.id || item.code || item.name;
                const reviewed = reviewedIds.includes(itemId);

                return (
                  <div
                    key={`${itemId}-${index}`}
                    className="rounded-2xl border border-slate-200/80 p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                      />
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Số lượng: {item.qty || 1}
                        </p>
                      </div>
                    </div>

                    <AppButton
                      variant={reviewed ? "outline" : "primary"}
                      size="sm"
                      disabled={reviewed}
                      onClick={() => {
                        setReviewItem({
                          id: item.id || item.code,
                          name: item.name,
                          image: item.image,
                        });
                        setReviewRating(5);
                        setReviewComment("");
                        setIsReviewListOpen(false);
                      }}
                    >
                      {reviewed ? "Đã đánh giá" : "Đánh giá ngay"}
                    </AppButton>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Comment Form Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 text-left animate-scale-in">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={reviewItem.image}
                  alt={reviewItem.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Đánh giá món ăn
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
                    {reviewItem.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div>
                <span className="block text-xs font-bold text-slate-700 mb-2">
                  Đánh giá của bạn
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        size={28}
                        className={
                          star <= reviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-100 text-slate-300"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-700">
                    {reviewRating === 5
                      ? "Tuyệt vời"
                      : reviewRating === 4
                      ? "Rất ngon"
                      : reviewRating === 3
                      ? "Bình thường"
                      : reviewRating === 2
                      ? "Chưa hài lòng"
                      : "Không hài lòng"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nhận xét chi tiết
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Món ăn có hợp khẩu vị của bạn không? Chia sẻ cảm nhận để quán phục vụ tốt hơn..."
                  className="w-full h-24 rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <AppButton
                variant="ghost"
                size="sm"
                onClick={() => setReviewItem(null)}
              >
                Hủy
              </AppButton>
              <AppButton
                variant="primary"
                size="sm"
                onClick={submitFoodReview}
              >
                Gửi đánh giá
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   BOOKING HISTORY CONTENT
   ========================================================================== */
export function BookingHistoryContent() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, timeFilter]);

  const loadMyBookings = async () => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/bookings/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (handleAuthApiError(data, navigate)) {
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể tải lịch đặt bàn.");
      }

      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Lỗi tải lịch đặt bàn:", err);
      setError(err.message || "Không thể tải lịch đặt bàn.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyBookings();
    window.addEventListener("bookingsUpdated", loadMyBookings);
    return () => {
      window.removeEventListener("bookingsUpdated", loadMyBookings);
    };
  }, []);

  const formatBookingDate = (value) => {
    if (!value) return "Chưa có ngày";
    if (String(value).includes("/") && String(value).split("/")[0].length === 2) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatBookingTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBookingStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Đã xác nhận";
      case "serving":
        return "Đang phục vụ";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
      case "canceled":
        return "Đã hủy";
      default:
        return "Chờ xác nhận";
    }
  };

  const parseBookingDate = (dateString) => {
    if (!dateString) return new Date(0);
    if (String(dateString).includes("/")) {
      const [day, month, year] = dateString.split("/");
      return new Date(`${year}-${month}-${day}`);
    }
    return new Date(dateString);
  };

  const now = new Date();

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // 1. Status Filter
      if (statusFilter !== "all") {
        const st = booking.status || "pending";
        if (statusFilter === "in_progress") {
          if (!["pending", "confirmed", "serving"].includes(st)) return false;
        } else if (statusFilter === "completed") {
          if (st !== "completed") return false;
        } else if (statusFilter === "cancelled") {
          if (st !== "cancelled" && st !== "canceled") return false;
        }
      }

      // 2. Time Filter
      if (timeFilter !== "all") {
        const bDate = parseBookingDate(booking.date || booking.createdAt);
        if (timeFilter === "month") {
          if (
            bDate.getMonth() !== now.getMonth() ||
            bDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (timeFilter === "week") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (bDate < sevenDaysAgo || bDate > now) {
            return false;
          }
        }
      }

      // 3. Search query
      const rawKeyword = String(searchTerm || "").trim();
      if (rawKeyword) {
        const score = calculateSearchScore({
          code: String(booking.id || ""),
          id: booking.id,
          tableName: booking.selectedTable || "",
          area: booking.selectedAreaTitle || "",
          notes: `${booking.notes || ""} ${booking.guests || booking.people || ""}`
        }, rawKeyword);

        if (score === 0) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, timeFilter, searchTerm]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    timeFilter !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTimeFilter("all");
  };

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 md:p-7 text-left space-y-5">
      {/* Header & Filter Bar */}
      <div className="space-y-3 pb-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#145c30] tracking-tight">
              Lịch đặt bàn của tôi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Theo dõi bàn đã đặt, thời gian hẹn và thông tin tiếp đón
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              Tổng số: <strong className="text-slate-900">{bookings.length}</strong> lượt đặt
            </span>
            <button
              type="button"
              onClick={() => navigate("/booking")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#15803d] text-white hover:bg-[#145c30] shadow-2xs hover:shadow transition cursor-pointer"
            >
              <CalendarDays size={14} />
              <span>Đặt bàn mới</span>
            </button>
          </div>
        </div>

        {/* Unified Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đặt bàn (#123), số bàn, khu vực..."
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-emerald-700 outline-none transition placeholder:text-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-emerald-700 outline-none transition cursor-pointer flex-1 md:flex-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="in_progress">Chờ / Đang phục vụ</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            {/* Time Select */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-emerald-700 outline-none transition cursor-pointer flex-1 md:flex-none"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="month">Tháng này</option>
              <option value="week">Tuần này</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer shrink-0 pl-1"
              >
                <RotateCcw size={12} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 pt-1">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex justify-between items-center"
            >
              <div className="space-y-1.5 flex-1">
                <AppSkeleton type="title" className="w-48 h-4" />
                <AppSkeleton type="text" className="w-1/3" />
              </div>
              <AppSkeleton type="badge" className="w-20 h-5" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredBookings.length === 0 && (
        <AppEmptyState
          icon={CalendarDays}
          title={
            hasActiveFilters
              ? "Không tìm thấy lịch đặt bàn phù hợp"
              : "Chưa có lịch đặt bàn nào"
          }
          description={
            hasActiveFilters
              ? "Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc."
              : "Hãy đặt bàn trước để được giữ chỗ đẹp và phục vụ chu đáo nhất."
          }
          actionText={hasActiveFilters ? "Xóa bộ lọc tìm kiếm" : "Đặt bàn trực tuyến ngay"}
          onAction={hasActiveFilters ? handleResetFilters : () => navigate("/booking")}
          className="py-10"
        />
      )}

      {/* Bookings List */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="space-y-3">
          {paginatedBookings.map((booking) => {
            const statusKey = booking.status || "pending";

            return (
              <div
                key={booking.id}
                className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-white hover:border-emerald-300 hover:shadow-sm transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#15803d] border border-emerald-100 flex items-center justify-center shrink-0">
                    <CalendarDays size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-[#145c30] text-sm sm:text-base">
                        #{booking.id}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        Bàn: {booking.selectedTable || "Tự động xếp"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600">
                        {booking.selectedAreaTitle || "Khu vực chung"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span>
                          {formatBookingDate(booking.date)} {booking.time && `lúc ${formatBookingTime(booking.time)}`}
                        </span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1">
                        <User size={12} className="text-slate-400 shrink-0" />
                        <span>{booking.guests || booking.people || 2} khách</span>
                      </span>
                      {booking.notes && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 italic truncate max-w-[200px]" title={booking.notes}>
                            Ghi chú: {booking.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <AppBadge status={statusKey} size="sm" dot>
                    {getBookingStatusText(statusKey)}
                  </AppBadge>

                  <button
                    type="button"
                    onClick={() => navigate(`/profile/booking-detail/${booking.id}`)}
                    className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] text-white hover:bg-[#145c30] shadow-2xs hover:shadow transition cursor-pointer"
                  >
                    <span>Chi tiết</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredBookings.length > pageSize && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <GlobalPagination
                total={filteredBookings.length}
                page={currentPage}
                limit={pageSize}
                onPageChange={setCurrentPage}
                onLimitChange={setPageSize}
                limitOptions={[5, 10, 20]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   CART CONTENT
   ========================================================================== */
export function CartContent() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("cartItems");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const syncCart = () => {
    try {
      const saved = localStorage.getItem("cartItems");
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch {
      setCartItems([]);
    }
  };

  useEffect(() => {
    syncCart();
    window.addEventListener("cartUpdated", syncCart);
    return () => {
      window.removeEventListener("cartUpdated", syncCart);
    };
  }, []);

  const updateQty = (id, delta) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const nextQty = (item.qty || 1) + delta;
          return nextQty > 0 ? { ...item, qty: nextQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    localStorage.setItem("cartItems", JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (id) => {
    const updated = cartItems.filter((item) => item.id !== id);
    localStorage.setItem("cartItems", JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const clearAll = () => {
    localStorage.removeItem("cartItems");
    setCartItems([]);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const totalQty = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 1),
    0
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 md:p-7 text-left space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#145c30] tracking-tight">
            Giỏ hàng của tôi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Bạn đang có <strong className="text-slate-800 font-bold">{totalQty} món</strong> trong giỏ hàng
          </p>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer self-start sm:self-auto"
          >
            <Trash2 size={13} />
            <span>Xóa tất cả</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {cartItems.length === 0 ? (
        <AppEmptyState
          icon={ShoppingCart}
          title="Giỏ hàng của bạn đang trống"
          description="Hãy khám phá các món ngon đặc sản núi rừng Hương Sơn và thêm vào giỏ hàng ngay nhé."
          actionText="Khám phá thực đơn ngay"
          onAction={() => navigate("/menu")}
          className="py-10"
        />
      ) : (
        <div className="space-y-3">
          {/* Cart Items List */}
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:border-emerald-300 hover:shadow-2xs transition text-left"
            >
              {/* Item Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={item.image || "/images/placeholder.jpg"}
                  alt={item.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Đơn giá: <strong className="text-slate-700">{item.price?.toLocaleString("vi-VN")}đ</strong>
                  </p>
                </div>
              </div>

              {/* Quantity Stepper & Price & Delete */}
              <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                {/* Stepper */}
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-2xs cursor-pointer transition"
                    title="Giảm số lượng"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-7 text-center font-black text-xs text-slate-800">
                    {item.qty || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-2xs cursor-pointer transition"
                    title="Tăng số lượng"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[90px]">
                  <span className="font-black text-xs sm:text-sm text-[#145c30]">
                    {((item.price || 0) * (item.qty || 1)).toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Xóa món này"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {/* Unified Bottom Action Row */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-between sm:items-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/menu")}
              className="text-xs font-bold text-[#15803d] hover:text-[#145c30] hover:underline cursor-pointer self-start sm:self-auto"
            >
              + Chọn thêm món khác từ thực đơn
            </button>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Tạm tính</span>
                <span className="text-base sm:text-lg font-black text-[#145c30]">
                  {totalPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] text-white hover:bg-[#145c30] shadow-sm hover:shadow transition cursor-pointer"
              >
                <span>Xem giỏ & Thanh toán</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

