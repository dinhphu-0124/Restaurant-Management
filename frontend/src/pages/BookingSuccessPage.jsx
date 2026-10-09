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

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 py-12 bg-cover bg-center bg-no-repeat text-slate-900"
      style={{
        backgroundImage: `url(${XacNhanDatBan})`,
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" />

      <div className="relative z-20 max-w-2xl w-full">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-10 text-center">
          {/* Success Check Icon */}
          <div className="flex justify-center -mt-14 sm:-mt-16 mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-xl border-4 border-white animate-bounce-short">
              <Check className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3]" />
            </div>
          </div>

          {/* Heading */}
          <AppBadge variant="success" size="sm" pill className="font-extrabold uppercase tracking-wider mb-2">
            Đã tiếp nhận yêu cầu
          </AppBadge>

          <h1
            className="text-2xl sm:text-4xl font-extrabold text-[#145c30] tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Đặt bàn thành công!
          </h1>

          <p className="mt-2 text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Cảm ơn quý khách đã tin tưởng lựa chọn Nhà hàng Dê Hương Sơn. Đội ngũ chúng tôi rất hân hạnh được phục vụ quý khách.
          </p>

          {/* Booking Summary Box */}
          <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-left space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <span>Thông tin đặt chỗ</span>
              {booking.id && (
                <span className="text-emerald-700 font-extrabold">
                  Mã: DB{booking.id}
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <InfoRow
                icon={<CalendarDays className="w-4 h-4 text-emerald-700" />}
                label="Ngày dùng bữa"
                value={formatDate(booking.date)}
              />

              <InfoRow
                icon={<Clock3 className="w-4 h-4 text-emerald-700" />}
                label="Giờ đến"
                value={booking.time || "Chưa có"}
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
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <Link to={`/profile/booking-detail/${booking.id}`}>
              <AppButton
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<ClipboardList className="w-4 h-4" />}
                className="font-bold text-xs sm:text-sm"
              >
                Xem chi tiết đặt bàn
              </AppButton>
            </Link>

            <Link to="/home">
              <AppButton
                variant="secondary"
                size="lg"
                fullWidth
                leftIcon={<Home className="w-4 h-4" />}
                className="font-bold text-xs sm:text-sm"
              >
                Về trang chủ
              </AppButton>
            </Link>
          </div>

          {/* Support Helpline */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <a
              href="tel:0387136878"
              className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-700 font-medium transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              Cần hỗ trợ gấp? Gọi hotline: <strong className="text-slate-800">038 713 6878</strong>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-600">
        {icon}
        <span>{label}:</span>
      </div>
      <span className="font-extrabold text-slate-900 text-right">{value}</span>
    </div>
  );
}

export default BookingSuccessPage;
