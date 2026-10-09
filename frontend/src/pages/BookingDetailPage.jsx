import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import { showAdminToast } from "../components/admin/AdminToast";

import goatIcon from "../assets/images/Icon_De.png";
import AppBadge from "../components/ui/AppBadge";
import AppButton from "../components/ui/AppButton";
import AppEmptyState from "../components/ui/AppEmptyState";
import AppSkeleton from "../components/ui/AppSkeleton";

import {
  CalendarDays,
  Clock3,
  Users,
  MapPin,
  UtensilsCrossed,
  ClipboardList,
  ArrowLeft,
  ReceiptText,
  StickyNote,
  Headphones,
  Info,
  Star,
  X,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

const API_URL = "http://localhost:5001";

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

function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewedIds, setReviewedIds] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadBookingDetail = async () => {
      const token = getAuthToken();

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/api/bookings/me/${id}`, {
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
          setBooking(null);
          setErrorMessage(
            data.message || "Bạn không có quyền xem đặt bàn này."
          );
          return;
        }

        if (res.status === 404) {
          setBooking(null);
          setErrorMessage(data.message || "Không tìm thấy đặt bàn.");
          return;
        }

        if (!res.ok || !data.success) {
          setBooking(null);
          setErrorMessage(data.message || "Không thể tải chi tiết đặt bàn.");
          return;
        }

        setBooking(data.booking);

        if (data.booking) {
          const items = data.booking.cartItems || data.booking.items || [];
          const bCode = data.booking.bookingCode || `DB${data.booking.id}`;
          const reviewed = [];
          for (const item of items) {
            const itemCode = item.id || item.code || item.name;
            try {
              const revRes = await fetch(
                `${API_URL}/api/menu-items/${itemCode}/reviews`
              );
              const revData = await revRes.json();
              if (revData.success && Array.isArray(revData.data)) {
                const hasReviewed = revData.data.some(
                  (r) => String(r.order_id) === String(bCode)
                );
                if (hasReviewed) {
                  reviewed.push(itemCode);
                }
              }
            } catch (e) {
              console.error(e);
            }
          }
          setReviewedIds(reviewed);
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết đặt bàn:", error);
        setBooking(null);
        setErrorMessage("Không thể kết nối backend. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetail();

    const handleBookingUpdate = (updatedBooking) => {
      if (
        !updatedBooking ||
        String(updatedBooking.id) === String(id) ||
        String(updatedBooking.booking_code) === String(id)
      ) {
        loadBookingDetail();
      }
    };

    socket.on("booking_updated", handleBookingUpdate);

    return () => {
      socket.off("booking_updated", handleBookingUpdate);
    };
  }, [id, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("vi-VN");
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "Vừa xong";
    const now = new Date();
    const created = new Date(dateString);
    const diff = Math.floor((now - created) / 1000);

    if (diff < 60) return "Vừa xong";
    const diffMinutes = Math.floor(diff / 60);
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "confirmed":
      case "Đã xác nhận":
        return "confirmed";
      case "serving":
      case "Đang phục vụ":
        return "serving";
      case "completed":
      case "Hoàn thành":
        return "completed";
      case "cancelled":
      case "canceled":
      case "Đã hủy":
        return "cancelled";
      default:
        return "pending";
    }
  };

  const getStatusDesc = (status) => {
    switch (status) {
      case "confirmed":
      case "Đã xác nhận":
        return "Nhà hàng đã xác nhận và giữ bàn";
      case "serving":
      case "Đang phục vụ":
        return "Bàn của bạn đang được phục vụ tại nhà hàng";
      case "completed":
      case "Hoàn thành":
        return "Bữa ăn và đặt bàn đã hoàn tất";
      case "cancelled":
      case "canceled":
      case "Đã hủy":
        return "Lịch đặt bàn đã được hủy";
      default:
        return "Đang chờ nhân viên nhà hàng xác nhận";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
      case "Đã xác nhận":
        return "Đã xác nhận";
      case "serving":
      case "Đang phục vụ":
        return "Đang phục vụ";
      case "completed":
      case "Hoàn thành":
        return "Hoàn thành";
      case "cancelled":
      case "canceled":
      case "Đã hủy":
        return "Đã hủy";
      default:
        return "Chờ xác nhận";
    }
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
  };

  const submitFoodReview = async () => {
    if (!reviewItem) return;
    const token = getAuthToken();
    if (!token) return;
    const bCode = booking.bookingCode || `DB${booking.id}`;
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
            orderId: bCode,
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50/60 py-16 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-5 w-full flex justify-center">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-sm max-w-md w-full">
            <AppEmptyState
              icon={CalendarDays}
              title="Không tìm thấy thông tin đặt bàn"
              description={
                errorMessage ||
                "Mã đặt bàn không tồn tại hoặc bạn không có quyền xem thông tin này."
              }
              actionText="Quay lại danh sách đặt bàn"
              onAction={() =>
                navigate("/profile", { state: { activeTab: "bookings" } })
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const cartItems = booking.cartItems || booking.items || [];
  const totalFood = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50/60 py-6 md:py-8 text-slate-800">
      <div className="max-w-7xl mx-auto px-5 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/profile", { state: { activeTab: "bookings" } })
            }
            className="inline-flex items-center gap-2 text-slate-600 hover:text-[#145C30] font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Quay lại danh sách đặt bàn</span>
          </button>
        </div>

        {/* Hero Header Card */}
        <div className="bg-gradient-to-r from-[#145C30] via-[#104e28] to-[#0c391d] rounded-3xl text-white p-6 md:p-8 shadow-sm border border-emerald-800/30 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
              <CalendarDays className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-200/90 font-bold">
                Mã phiếu đặt bàn
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {booking.bookingCode || `DB${booking.id}`}
              </h1>
              <p className="text-xs text-emerald-100/80 mt-1 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Ngày hẹn: {formatDate(booking.date)} • Giờ: {booking.time || "Chưa có"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
            <div className="flex items-center md:justify-end gap-2">
              <AppBadge
                status={getStatusBadgeVariant(booking.status)}
                size="md"
                dot
                className="font-extrabold shadow-2xs"
              >
                {getStatusText(booking.status)}
              </AppBadge>
            </div>

            <p className="text-xs text-emerald-100 font-medium">
              {getStatusDesc(booking.status)}
            </p>
            <p className="text-[11px] text-emerald-200/70">
              Cập nhật lần cuối: {getTimeAgo(booking.updatedAt || booking.createdAt)}
            </p>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT: Booking Details, Customer Info, Ordered Dishes (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Table & Schedule Details */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs text-left">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145C30] flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Chi tiết thời gian & Bàn ăn
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <DetailBox
                  icon={<CalendarDays className="w-4 h-4" />}
                  label="Ngày đặt bàn"
                  value={formatDate(booking.date)}
                />

                <DetailBox
                  icon={<Clock3 className="w-4 h-4" />}
                  label="Giờ hẹn đến"
                  value={booking.time || "Chưa có"}
                />

                <DetailBox
                  icon={<Users className="w-4 h-4" />}
                  label="Số lượng khách"
                  value={booking.guests ? `${booking.guests} người` : "Chưa có"}
                />

                <DetailBox
                  icon={<UtensilsCrossed className="w-4 h-4" />}
                  label="Khu vực"
                  value={
                    booking.selectedAreaTitle ||
                    booking.area ||
                    "Khu vực chung"
                  }
                />

                <DetailBox
                  icon={<MapPin className="w-4 h-4" />}
                  label="Bàn số"
                  value={
                    booking.selectedTable || booking.table || "Nhà hàng sắp xếp"
                  }
                />

                <DetailBox
                  icon={<StickyNote className="w-4 h-4" />}
                  label="Ghi chú"
                  value={booking.note || "Không có"}
                />
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs text-left">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145C30] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Thông tin người đặt bàn
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Họ và tên
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">
                    {booking.customerName || booking.name || "Chưa có"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Số điện thoại
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">
                    {booking.phone || "Chưa có"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email liên hệ
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1 truncate">
                    {booking.email || "Chưa có"}
                  </p>
                </div>
              </div>
            </div>

            {/* Preordered Dishes if any */}
            {cartItems.length > 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs text-left">
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145C30] flex items-center justify-center">
                      <ReceiptText className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                      Món ăn đã đặt trước ({cartItems.length} món)
                    </h2>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {cartItems.map((item, index) => {
                    const qty = Number(item.qty || 1);
                    const price = Number(item.price || 0);
                    const lineTotal = price * qty;
                    const itemKey = item.id || item.code || item.name;
                    const hasReviewed = reviewedIds.includes(itemKey);

                    return (
                      <div
                        key={itemKey || index}
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
                            {(item.priceOptionNote || item.price_option_note) && (
                              <div className="text-[11px] font-bold text-amber-700 mt-0.5">
                                Quy cách: {item.priceOptionNote || item.price_option_note}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs font-semibold text-slate-500">
                                Đơn giá:{" "}
                                <strong className="text-slate-800">
                                  {formatPrice(price)}
                                </strong>
                              </span>

                              {/* Food review button if booking completed */}
                              {booking.status === "completed" && (
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

                <div className="mt-5 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex justify-between items-center text-left">
                  <span className="font-bold text-xs sm:text-sm text-emerald-700">
                    Tổng tiền món ăn đặt trước:
                  </span>
                  <span className="font-black text-base sm:text-lg text-emerald-700">
                    {formatPrice(
                      booking.total || booking.subtotal || totalFood
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs text-center text-xs text-slate-500 font-medium">
                <Info className="w-4 h-4 inline mr-1.5 opacity-70 text-slate-400" />
                Phiếu đặt bàn này không kèm món ăn đặt trước. Quý khách có thể gọi món trực tiếp khi đến nhà hàng.
              </div>
            )}
          </div>

          {/* RIGHT: Summary & Support Sidebar (1 Col) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Summary Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs text-left space-y-4">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145C30] flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Tóm tắt đặt bàn
                </h2>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Trạng thái:</span>
                  <AppBadge
                    status={getStatusBadgeVariant(booking.status)}
                    size="sm"
                    dot
                    className="font-bold"
                  >
                    {getStatusText(booking.status)}
                  </AppBadge>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Thời gian:</span>
                  <span className="font-bold text-slate-900">
                    {booking.time || "Chưa có"} • {formatDate(booking.date)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Số lượng khách:</span>
                  <span className="font-bold text-slate-900">
                    {booking.guests || 1} người
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Khu vực / Bàn:</span>
                  <span className="font-bold text-slate-900">
                    {booking.selectedAreaTitle || booking.area || "Chung"} (
                    {booking.selectedTable || booking.table || "Chưa xếp"})
                  </span>
                </div>

                {cartItems.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">
                      Tạm tính món ăn:
                    </span>
                    <span className="font-black text-lg text-[#145C30]">
                      {formatPrice(
                        booking.total || booking.subtotal || totalFood
                      )}
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
                Cần hỗ trợ đặt bàn?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Nếu có nhu cầu thay đổi giờ đến, số lượng người hoặc hủy đặt bàn, quý khách vui lòng liên hệ ngay với nhà hàng.
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
                  placeholder="Món ăn vừa miệng, phục vụ nhanh không..."
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

function DetailBox({ icon, label, value }) {
  return (
    <div className="border border-slate-200/70 rounded-2xl p-3.5 bg-slate-50/80">
      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 block">
        {label}
      </span>
      <div className="flex items-center gap-2 mt-1 min-w-0">
        <span className="text-[#145C30] shrink-0">{icon}</span>
        <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

export default BookingDetailPage;
