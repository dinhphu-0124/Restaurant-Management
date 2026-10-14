import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { socket } from "../utils/socket";
import { showAdminToast } from "../components/admin/AdminToast";
import {
  ArrowLeft,
  ReceiptText,
  CreditCard,
  Truck,
  Store,
  Utensils,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Star,
  MessageSquarePlus,
  X,
  Headphones,
  Info,
  CalendarDays,
  CircleDollarSign,
} from "lucide-react";
import AppBadge from "../components/ui/AppBadge";
import AppButton from "../components/ui/AppButton";
import AppEmptyState from "../components/ui/AppEmptyState";
import AppSkeleton from "../components/ui/AppSkeleton";
import goatIcon from "../assets/images/Icon_De.png";
import { BACKEND_URL } from "../config/api";

const API_URL = BACKEND_URL;

const getAuthToken = () => {
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
};

const clearUserSession = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("avatar");

  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("currentUser");
  sessionStorage.removeItem("avatar");

  window.dispatchEvent(new Event("authChanged"));
  window.dispatchEvent(new Event("loginStatusChanged"));
  window.dispatchEvent(new Event("avatarUpdated"));
};

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Review states for completed orders
  const [reviewedIds, setReviewedIds] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadOrderDetail = async () => {
      const token = getAuthToken();

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const res = await fetch(`${API_URL}/api/orders/me/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (
          data.code === "ACCOUNT_LOCKED" ||
          data.code === "ACCOUNT_INACTIVE"
        ) {
          clearUserSession();
          navigate("/login");
          return;
        }

        if (res.status === 401) {
          clearUserSession();
          navigate("/login");
          return;
        }

        if (res.status === 403) {
          setOrder(null);
          setErrorMessage(
            data.message || "Bạn không có quyền xem đơn hàng này."
          );
          return;
        }

        if (res.status === 404) {
          setOrder(null);
          setErrorMessage(data.message || "Không tìm thấy đơn hàng.");
          return;
        }

        if (!res.ok || !data.success) {
          setOrder(null);
          setErrorMessage(data.message || "Không thể tải chi tiết đơn hàng.");
          return;
        }

        setOrder(data.order);
      } catch (error) {
        console.error("Lỗi tải chi tiết đơn hàng:", error);
        setOrder(null);
        setErrorMessage("Không thể kết nối backend. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetail();

    // Lắng nghe cập nhật realtime từ socket
    const handleOrderUpdate = (updatedOrder) => {
      if (
        !updatedOrder ||
        String(updatedOrder.id) === String(id) ||
        String(updatedOrder.order_code) === String(id)
      ) {
        loadOrderDetail();
      }
    };

    socket.on("order_updated", handleOrderUpdate);

    return () => {
      socket.off("order_updated", handleOrderUpdate);
    };
  }, [id, navigate]);

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
  };

  const formatDate = (value) => {
    if (!value) return "Chưa có";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN");
  };

  const formatDateTime = (value) => {
    if (!value) return "Chưa có";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa có";
    return `${date.toLocaleDateString("vi-VN")} - ${date.toLocaleTimeString(
      "vi-VN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    )}`;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "Vừa xong";
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "Vừa xong";
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const serviceLabel = {
    dinein: "Ăn tại quán",
    delivery: "Giao tận nơi",
    pickup: "Đến lấy tại quán",
  };

  const paymentLabel = {
    cash: "Tiền mặt",
    bank: "Chuyển khoản QR",
    momo: "Ví MoMo",
    pay_after_meal: "Thanh toán sau bữa ăn",
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
    if (o.paymentContent) return "Chuyển khoản QR";
    if (o.paymentStatus === "unpaid") return "Tiền mặt";
    return "Chưa xác định";
  };

  const paymentStatusLabel = {
    pending_payment: "Chờ chọn thanh toán",
    unpaid: "Chưa thanh toán",
    pending: "Chờ thanh toán",
    paid_pending_confirm: "Đã thanh toán (Chờ duyệt)",
    paid: "Đã thanh toán",
    partial: "Thanh toán một phần",
  };

  const getPaymentStatusText = (o) => {
    return (
      paymentStatusLabel[o.paymentStatus] ||
      o.paymentStatus ||
      (o.paymentMethod === "cash" ? "Chưa thanh toán" : "Chờ xác nhận")
    );
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "preparing":
        return "Đang chuẩn bị món";
      case "delivering":
        return "Đang giao hàng";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
      case "canceled":
        return "Đã hủy";
      default:
        return status || "Chờ xác nhận";
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "pending":
        return "pending";
      case "confirmed":
        return "confirmed";
      case "preparing":
        return "preparing";
      case "delivering":
        return "delivering";
      case "completed":
        return "completed";
      case "cancelled":
      case "canceled":
        return "cancelled";
      default:
        return "neutral";
    }
  };

  const getPaymentBadgeVariant = (status) => {
    switch (status) {
      case "paid":
        return "paid";
      case "partial":
      case "partially_paid":
        return "partially_paid";
      default:
        return "unpaid";
    }
  };

  const submitFoodReview = async () => {
    if (!reviewItem) return;
    const token = getAuthToken();
    if (!token) return;
    const orderCode = `DH${order.id}`;
    const currentUser =
      JSON.parse(localStorage.getItem("currentUser")) ||
      JSON.parse(sessionStorage.getItem("currentUser")) ||
      {};

    try {
      setSubmittingReview(true);
      const res = await fetch(
        `${API_URL}/api/menu-items/${reviewItem.id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: orderCode,
            userEmail: currentUser.email,
            userName: currentUser.name || "Khách hàng",
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
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 py-8">
        <div className="max-w-7xl mx-auto px-5 space-y-6">
          <AppSkeleton type="button" className="w-48 h-8 rounded-xl" />
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
            <AppSkeleton type="title" className="h-8 w-1/3" />
            <AppSkeleton type="text" className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <AppSkeleton type="card" className="h-40" />
                <AppSkeleton type="card" className="h-40" />
              </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <AppSkeleton type="card" className="h-60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50/60 py-16 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-5 w-full flex justify-center">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-sm max-w-md w-full">
            <AppEmptyState
              icon={ReceiptText}
              title="Không tìm thấy đơn hàng"
              description={
                errorMessage ||
                "Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này."
              }
              actionText="Quay lại lịch sử đơn hàng"
              onAction={() =>
                navigate("/profile", { state: { activeTab: "history" } })
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const cartItems = order.cartItems || [];
  const subtotal =
    order.subtotal ||
    cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
      0
    );
  const paymentStatusText = getPaymentStatusText(order);

  return (
    <div className="min-h-screen bg-slate-50/60 py-6 md:py-8 text-slate-800">
      <div className="max-w-7xl mx-auto px-5 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/profile", { state: { activeTab: "history" } })
            }
            className="inline-flex items-center gap-2 text-slate-600 hover:text-[#145C30] font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Quay lại lịch sử đơn hàng</span>
          </button>
        </div>

        {/* Hero Header Card */}
        <div className="bg-gradient-to-r from-[#145C30] via-[#104e28] to-[#0c391d] rounded-3xl text-white p-6 md:p-8 shadow-sm border border-emerald-800/30 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
              <ReceiptText className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-200/90 font-bold">
                Mã đơn hàng
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                #{order.id}
              </h1>
              <p className="text-xs text-emerald-100/80 mt-1 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Đặt lúc: {formatDateTime(order.createdAt)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
            <div className="flex flex-wrap items-center md:justify-end gap-2">
              <AppBadge
                status={getStatusBadgeVariant(order.status)}
                size="md"
                dot
                className="font-extrabold shadow-2xs"
              >
                {getStatusText(order.status)}
              </AppBadge>

              <AppBadge
                status={getPaymentBadgeVariant(order.paymentStatus)}
                size="md"
                className="font-bold shadow-2xs"
              >
                {paymentStatusText}
              </AppBadge>
            </div>

            <p className="text-[11px] text-emerald-200/70">
              Cập nhật lần cuối: {getTimeAgo(order.updatedAt || order.createdAt)}
            </p>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT: Dishes List & Service Info (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dishes in Order */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs text-left">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145C30] flex items-center justify-center">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                      Món ăn trong đơn ({cartItems.length} món)
                    </h2>
                  </div>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <AppEmptyState
                  icon={Utensils}
                  title="Không có dữ liệu món ăn"
                  description="Đơn hàng chưa có thông tin món ăn chi tiết."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {cartItems.map((item, index) => {
                    const qty = Number(item.qty || 1);
                    const price = Number(item.price || 0);
                    const lineTotal = price * qty;
                    const itemKey = item.id || item.code || item.name;
                    const hasReviewed = reviewedIds.includes(itemKey);

                    return (
                      <div
                        key={item.id || index}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <img
                            src={item.image || "/images/placeholder.jpg"}
                            alt={item.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                              {item.name}
                            </h3>
                            {item.priceOptionNote && (
                              <div className="mt-0.5">
                                <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[11px] font-bold border border-emerald-200/60">
                                  Quy cách: {item.priceOptionNote}
                                </span>
                              </div>
                            )}
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {item.desc || "Món đặc sản Hương Sơn"}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs font-semibold text-slate-500">
                                Đơn giá:{" "}
                                <strong className="text-slate-800">
                                  {formatPrice(price)}
                                </strong>
                              </span>

                              {/* Review button if completed */}
                              {order.status === "completed" && (
                                <button
                                  type="button"
                                  disabled={hasReviewed}
                                  onClick={() => {
                                    setReviewItem({
                                      id: itemKey,
                                      name: item.name,
                                      image: item.image,
                                    });
                                    setReviewRating(5);
                                    setReviewComment("");
                                  }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                    hasReviewed
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  }`}
                                >
                                  <Star size={11} className="fill-amber-500 text-amber-500" />
                                  <span>{hasReviewed ? "Đã đánh giá" : "Đánh giá"}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <span className="inline-flex items-center justify-center min-w-8 h-7 px-2.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                            x{qty}
                          </span>

                          <div className="text-right min-w-[90px]">
                            <span className="font-black text-sm sm:text-base text-[#145C30]">
                              {formatPrice(lineTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Service & Delivery Information */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs text-left">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145C30] flex items-center justify-center">
                  {order.serviceType === "delivery" ? (
                    <Truck className="w-4 h-4" />
                  ) : order.serviceType === "pickup" ? (
                    <Store className="w-4 h-4" />
                  ) : (
                    <Utensils className="w-4 h-4" />
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {order.serviceType === "delivery"
                    ? "Thông tin giao hàng"
                    : order.serviceType === "pickup"
                    ? "Thông tin lấy hàng"
                    : "Thông tin phục vụ tại bàn"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Hình thức phục vụ
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">
                    {serviceLabel[order.serviceType] || "Chưa xác định"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Thời gian hẹn
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">
                    {formatDate(order.date || order.createdAt)}
                    {order.time ? ` (${order.time})` : ""}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Người nhận
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">
                    {order.customerName ||
                      order.fullName ||
                      order.name ||
                      "Chưa có"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.phone || "Chưa có SĐT"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Địa chỉ / Vị trí
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">
                    {order.address ||
                      (order.tableId ? `Bàn ${order.tableId}` : "Tại nhà hàng")}
                  </p>
                  {order.email && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {order.email}
                    </p>
                  )}
                </div>
              </div>

              {order.note && (
                <div className="mt-3.5 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs">
                  <span className="font-bold text-amber-900 block mb-0.5">
                    Ghi chú của khách:
                  </span>
                  <p className="text-amber-800">{order.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Payment Summary & Support Sidebar (1 Col) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Summary */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs text-left">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145C30] flex items-center justify-center">
                  <CircleDollarSign className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Chi tiết thanh toán
                </h2>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tạm tính</span>
                  <span className="font-bold text-slate-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {Number(order.discountTotal || 0) > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Ưu đãi giảm giá</span>
                    <span className="font-bold">
                      - {formatPrice(order.discountTotal)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-600">
                  <span>Phí giao hàng</span>
                  <span className="font-bold text-slate-900">
                    {Number(order.shippingFee || 0) === 0
                      ? "Miễn phí"
                      : formatPrice(order.shippingFee)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-baseline">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                      Tổng thanh toán
                    </span>
                    <span className="font-black text-xl sm:text-2xl text-[#145C30]">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Đã bao gồm thuế và phí dịch vụ
                  </p>
                </div>

                {/* Remaining / Paid split if any */}
                {order.remainingAmount > 0 && order.totalPaid > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-emerald-700">
                        Đã thanh toán:
                      </span>
                      <span className="font-bold text-emerald-800">
                        {formatPrice(order.totalPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-rose-600">
                        Còn lại cần thanh toán:
                      </span>
                      <span className="font-black text-rose-600">
                        {formatPrice(order.remainingAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {order.remainingAmount > 0 && order.totalPaid === 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs">
                    <span className="font-bold text-rose-600">
                      Cần thanh toán:
                    </span>
                    <span className="font-black text-rose-600">
                      {formatPrice(order.remainingAmount || order.total)}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Method Details */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Phương thức:</span>
                  <span className="font-bold text-slate-800">
                    {getPaymentMethodText(order)}
                  </span>
                </div>

                {order.paymentContent && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Nội dung chuyển khoản:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {order.paymentContent}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Helpline / Support Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white flex items-center justify-center mb-3.5 shadow-2xs border border-slate-100">
                <img
                  src={goatIcon}
                  alt="Dê Hương Sơn"
                  className="w-10 h-10 object-contain opacity-85"
                />
              </div>

              <h3 className="text-base font-extrabold text-slate-900">
                Cần hỗ trợ về đơn hàng?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Đội ngũ Dê Hương Sơn luôn sẵn sàng giải đáp thắc mắc hoặc hỗ trợ thay đổi thông tin đơn hàng của quý khách.
              </p>

              <AppButton
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<Headphones className="w-4 h-4" />}
                onClick={() => navigate("/contact")}
                className="mt-4 font-bold text-xs"
              >
                Liên hệ hỗ trợ
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 sm:p-6 text-left border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={reviewItem.image || "/images/placeholder.jpg"}
                  alt={reviewItem.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-base truncate">
                    Đánh giá món ăn
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {reviewItem.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <p className="font-bold text-xs text-slate-700 mb-2">
                  Chất lượng món ăn:
                </p>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 cursor-pointer ${
                        star <= reviewRating
                          ? "text-amber-500"
                          : "text-slate-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="font-bold text-xs text-slate-700 block mb-1.5">
                  Nhận xét của bạn
                </span>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Món ăn thơm ngon, độ tươi ngon và hương vị..."
                  className="w-full h-24 rounded-xl border border-slate-200 p-3 text-xs outline-none resize-none focus:border-[#145C30] focus:ring-2 focus:ring-[#145C30]/10 transition"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
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
                isLoading={submittingReview}
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

export default OrderDetailPage;
