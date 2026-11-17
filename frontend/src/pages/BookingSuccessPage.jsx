import { Link } from "react-router-dom";
import {
  Check,
  CalendarDays,
  Clock3,
  Users,
  UtensilsCrossed,
  Home,
  ClipboardList,
  Phone,
  Sparkles,
} from "lucide-react";
import AppButton from "../components/ui/AppButton";
import AppBadge from "../components/ui/AppBadge";
import SEO from "../components/common/SEO";

import XacNhanDatBan from "../assets/images/Booking/xac-nhan-dat-ban.png";

function BookingSuccessPage() {
  const booking = JSON.parse(localStorage.getItem("currentBooking")) || {};

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Chưa có";
    const parts = String(timeString).split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  return (
    <div
      className="min-h-[calc(100vh-80px)] sm:min-h-screen relative flex items-center justify-center px-3.5 sm:px-4 py-8 sm:py-12 bg-cover bg-center bg-no-repeat text-slate-900"
      style={{
        backgroundImage: `url(${XacNhanDatBan})`,
      }}
    >
      <SEO title="Đặt Bàn Thành Công" noindex={true} />
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" />

      <div className="relative z-20 max-w-2xl w-full">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl p-5 sm:p-10 text-center">
          {/* Success Check Icon */}
          <div className="flex justify-center -mt-12 sm:-mt-16 mb-4 sm:mb-5">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-xl border-4 border-white animate-bounce-short">
              <Check className="w-8 h-8 sm:w-12 sm:h-12 stroke-[3]" />
            </div>
          </div>

          {/* Heading */}
          <AppBadge variant="success" size="sm" pill className="font-extrabold uppercase tracking-wider mb-2">
            Đã tiếp nhận yêu cầu
          </AppBadge>

          <h1
            className="text-[22px] sm:text-4xl font-extrabold text-[#145c30] tracking-tight leading-snug"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Đặt bàn thành công!
          </h1>

          <p className="mt-1.5 sm:mt-2 text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Cảm ơn quý khách đã tin tưởng lựa chọn Nhà hàng Dê Hương Sơn. Đội ngũ chúng tôi rất hân hạnh được phục vụ quý khách.
          </p>

          {/* Booking Summary Box */}
          <div className="mt-5 sm:mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 text-left space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <span>Thông tin đặt chỗ</span>
              {booking.id && (
                <span className="text-emerald-700 font-extrabold">
                  Mã: DB{booking.id}
                </span>
              )}
            </div>

            <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <InfoRow
                icon={<CalendarDays className="w-4 h-4 text-emerald-700" />}
                label="Ngày dùng bữa"
                value={formatDate(booking.date)}
              />

              <InfoRow
                icon={<Clock3 className="w-4 h-4 text-emerald-700" />}
                label="Giờ đến"
                value={formatTime(booking.time)}
              />

              <InfoRow
                icon={<Users className="w-4 h-4 text-emerald-700" />}
                label="Số lượng khách"
                value={
                  booking.guests || booking.people
                    ? `${booking.guests || booking.people} người`
                    : "Chưa có"
                }
              />

              <InfoRow
                icon={<UtensilsCrossed className="w-4 h-4 text-emerald-700" />}
                label="Không gian & Bàn"
                value={
                  booking.selectedAreaTitle && booking.selectedTable
                    ? `${booking.selectedAreaTitle} • Bàn ${booking.selectedTable}`
                    : booking.area
                    ? booking.area
                    : "Nhà hàng sắp xếp"
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2.5 sm:gap-3 mt-5 sm:mt-6">
            <Link to={`/profile/booking-detail/${booking.id}`} className="w-full block">
              <AppButton
                variant="primary"
                size="lg"
                className="w-full justify-center font-bold text-xs sm:text-sm py-3 sm:py-3.5 shadow-sm active:scale-[0.98]"
                leftIcon={<ClipboardList className="w-4 h-4" />}
              >
                Xem chi tiết đặt bàn
              </AppButton>
            </Link>

            <Link to="/home" className="w-full block">
              <AppButton
                variant="secondary"
                size="lg"
                className="w-full justify-center font-bold text-xs sm:text-sm py-3 sm:py-3.5 shadow-sm active:scale-[0.98]"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Về trang chủ
              </AppButton>
            </Link>
          </div>

          {/* Support Helpline */}
          <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 flex justify-center">
            <a
              href="tel:0387136878"
              className="inline-flex items-center justify-center flex-wrap gap-x-1.5 gap-y-1 text-xs text-slate-500 hover:text-emerald-700 font-medium transition active:scale-95 text-center px-2 py-0.5 rounded-lg hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Cần hỗ trợ gấp?</span>
              </span>
              <span className="whitespace-nowrap">
                Gọi hotline: <strong className="text-slate-800 font-bold">038 713 6878</strong>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
      <div className="flex items-center gap-2 text-slate-600 min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}:</span>
      </div>
      <span className="font-extrabold text-slate-900 text-right shrink-0">{value}</span>
    </div>
  );
}

export default BookingSuccessPage;
