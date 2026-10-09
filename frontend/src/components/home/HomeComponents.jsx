import React from "react";

export function SpaceItem({ image, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl overflow-hidden border border-[#eadfcd] bg-[#fffaf0] text-left hover:-translate-y-1 hover:shadow-xl transition"
    >
      <div className="h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
      </div>

      <div className="p-4">
        <h3 className="font-black text-green-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{desc}</p>
      </div>
    </button>
  );
}

export function Feature({ icon, title, text }) {
  return (
    <div className="p-2.5 sm:p-4 md:p-5 flex items-start sm:items-center sm:flex-col sm:justify-center gap-2.5 sm:gap-2 text-left sm:text-center transition-all duration-300 hover:bg-[#fffdfa]">
      <div className="text-emerald-800 shrink-0 mt-0.5 sm:mt-0 sm:mb-1">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-black text-emerald-950 text-[11.5px] sm:text-xs md:text-sm leading-tight mb-0.5 sm:mb-1">
          {title}
        </h3>

        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug">
          {text}
        </p>
      </div>
    </div>
  );
}

export function Info({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center text-center group p-1.5 sm:p-2 cursor-pointer transition-all duration-300">
      <div className="text-emerald-800 group-hover:text-emerald-600 mb-2 sm:mb-2.5 flex items-center justify-center transition-all duration-300 transform group-hover:scale-115 group-hover:-translate-y-1">
        {icon}
      </div>
      <h3 className="font-bold text-emerald-950 group-hover:text-emerald-800 text-xs sm:text-sm md:text-base leading-snug transition-colors">
        {title}
      </h3>
      <p className="text-[10.5px] sm:text-xs text-gray-500 mt-0.5 leading-snug">
        {text || "Chuẩn vị đặc trưng"}
      </p>
    </div>
  );
}

export function Why({ icon, title, text }) {
  return (
    <div className="px-1 md:px-3">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-green-800 flex items-center justify-center mx-auto mb-2 md:mb-3 text-green-800">
        {icon}
      </div>

      <h3 className="font-bold mb-1 text-[13px] md:text-sm leading-snug">
        {title}
      </h3>

      <p className="text-[11px] md:text-xs text-gray-600 leading-snug">
        {text}
      </p>
    </div>
  );
}

export function calculatePromoTimeInfo(startDateStr, endDateStr, overrideDaysLeft) {
  if (overrideDaysLeft) {
    return {
      status: "ongoing",
      timeText: overrideDaysLeft,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let start = null;
  let end = null;

  if (startDateStr) {
    const s = new Date(startDateStr);
    if (!Number.isNaN(s.getTime())) {
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    }
  }

  if (endDateStr) {
    const e = new Date(endDateStr);
    if (!Number.isNaN(e.getTime())) {
      end = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59);
    }
  }

  // 1. Sắp diễn ra (chưa bắt đầu)
  if (start && today < start) {
    const diffMs = start.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      status: "upcoming",
      timeText: daysUntil === 1 ? "Sắp diễn ra ngày mai" : `Sắp diễn ra sau ${daysUntil} ngày`,
    };
  }

  // 2. Đã kết thúc
  if (end && now > end) {
    return {
      status: "expired",
      timeText: "Đã kết thúc",
    };
  }

  // 3. Đang diễn ra
  if (end) {
    const diffMs = end.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      status: "ongoing",
      timeText: daysLeft === 0 ? "Hết hạn hôm nay" : `Còn ${daysLeft} ngày`,
    };
  }

  return {
    status: "ongoing",
    timeText: "Đang diễn ra",
  };
}

export function Promo({
  title,
  discount,
  image,
  desc,
  tag,
  startDate,
  endDate,
  daysLeft,
  buttonVariant = "outline",
  onClick,
}) {
  const formatDayMonth = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const formatDateYear = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  let dateRangeText = "";
  if (startDate && endDate) {
    dateRangeText = `Từ ${formatDayMonth(startDate)} – ${formatDateYear(endDate)}`;
  } else if (endDate) {
    dateRangeText = `Đến ${formatDateYear(endDate)}`;
  } else if (startDate) {
    dateRangeText = `Từ ${formatDateYear(startDate)}`;
  } else {
    dateRangeText = "Áp dụng quanh năm";
  }

  const timeInfo = calculatePromoTimeInfo(startDate, endDate, daysLeft);
  const timeDisplayText = timeInfo.timeText;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick && onClick()}
      className="bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-3.5 border border-[#e2ece5] shadow-xs hover:shadow-md transition-all duration-300 flex flex-row gap-2 sm:gap-3 relative group cursor-pointer"
    >
      {/* Left Food Image */}
      <div className="w-[32%] sm:w-[33%] md:w-[35%] min-w-[90px] sm:min-w-[108px] max-w-[125px] sm:max-w-[140px] h-32 sm:h-36 md:h-38 rounded-xl sm:rounded-2xl overflow-hidden relative shrink-0 bg-amber-50">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Discount Badge on top-left of image */}
        {discount && (
          <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#0d6b38] text-white font-black text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-lg shadow-sm">
            {discount}
          </span>
        )}
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          {/* Top Row: Title + Decorative leaf */}
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-black text-emerald-950 group-hover:text-emerald-800 transition-colors text-xs sm:text-sm md:text-base leading-snug line-clamp-1">
              {title}
            </h3>
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700/70 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>

          {/* Description */}
          <p className="text-[10px] sm:text-[11px] md:text-xs text-gray-500 line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 leading-snug">
            {desc}
          </p>
        </div>

        <div className="mt-1 sm:mt-1.5">
          {/* Time & Countdown: Stacked vertically with whitespace-nowrap to prevent awkward line breaks */}
          <div className="space-y-1 mb-1.5 sm:mb-2 text-[10px] sm:text-[11px] md:text-xs">
            <div className="flex items-center gap-1.5 font-medium text-gray-700 min-w-0">
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-700 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span className="whitespace-nowrap truncate">{dateRangeText}</span>
            </div>
            {timeDisplayText && (
              <div className="flex items-center gap-1.5 font-medium text-emerald-900 min-w-0">
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-700 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="whitespace-nowrap truncate">{timeDisplayText}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div
            className={`w-full py-1 sm:py-1.5 px-3 rounded-full font-bold text-[11px] sm:text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all duration-300 ${
              buttonVariant === "solid"
                ? "bg-[#0d6b38] group-hover:bg-[#09522b] text-white shadow-xs"
                : "border border-[#0d6b38] text-[#0d6b38] group-hover:bg-[#0d6b38] group-hover:text-white"
            }`}
          >
            <span>Xem chi tiết</span>
            <span className="leading-none">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PromoBanner({ onClick }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick && onClick()}
      className="bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-100/70 border border-emerald-200/60 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs cursor-pointer group hover:shadow-sm transition"
    >
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white shadow-xs border border-emerald-200/70 flex items-center justify-center shrink-0 text-emerald-800">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </div>
        <div className="min-w-0">
          <h4 className="font-black text-emerald-950 text-xs sm:text-sm truncate">
            Khám phá thêm nhiều ưu đãi khác
          </h4>
          <p className="text-[10px] sm:text-xs text-emerald-800/80 truncate">
            Món ngon – Giá tốt – Trải nghiệm tuyệt vời
          </p>
        </div>
      </div>

      <div className="bg-[#0d6b38] group-hover:bg-[#09522b] text-white text-[10.5px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap shrink-0 flex items-center gap-1 transition shadow-xs">
        <span>Xem tất cả</span>
        <span className="leading-none">→</span>
      </div>
    </div>
  );
}

export function Review({ name, text }) {
  return (
    <div className="bg-white rounded-2xl p-3 md:p-4 mb-3 md:mb-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="font-bold text-green-900 text-sm">{name}</p>
        <div className="text-yellow-500 text-xs md:text-sm">★★★★★</div>
      </div>

      <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}

export function Service({ icon, title, text }) {
  return (
    <div className="p-3.5 sm:p-5 flex items-center gap-2.5 sm:gap-4 border-b sm:border-b-0 border-r border-gray-100 last:border-r-0 [&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r">
      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-green-50 text-green-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-xs sm:text-sm leading-snug">{title}</h3>
        <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">{text}</p>
      </div>
    </div>
  );
}
