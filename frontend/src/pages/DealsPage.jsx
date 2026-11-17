import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Gift, Clock, CalendarDays, Utensils } from "lucide-react";
import SEO from "../components/common/SEO";

import heroIllustration from "../assets/images/Deals/deals-hero-illustration.png";
import cardMeatDish from "../assets/images/Deals/card-meat-dish.png";
import comboCardImg from "../assets/images/Deals/combo-card.png";
import bookingCardImg from "../assets/images/Deals/booking-card.png";
import birthdayCardImg from "../assets/images/Deals/birthday-card.png";
import onlineCardImg from "../assets/images/Deals/online-card.png";
import ctaLeaves from "../assets/images/Deals/cta-leaves.png";
import { API_BASE_URL } from "../config/api";
import { getDealLifecycle } from "../utils/dealsHelpers";

function DealsPage() {
  const navigate = useNavigate();
  const [adminDeals, setAdminDeals] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetch(`${API_BASE_URL}/deals`)
      .then((res) => res.json())
      .then((data) => {
        setAdminDeals(data.deals || []);
      })
      .catch((error) => {
        console.error("Lỗi tải ưu đãi:", error);
        setAdminDeals([]);
      });
  }, []);

  const getDealUrl = (deal) => {
    return `/deals/${deal.slug || deal.code || deal.id}`;
  };

  const isDealExpired = (deal) => {
    const lifecycle = getDealLifecycle(deal);
    return (
      lifecycle.key === "expired" ||
      lifecycle.key === "invalid" ||
      lifecycle.key === "paused" ||
      lifecycle.key === "cancelled"
    );
  };

  const isDealUpcoming = (deal) => {
    const lifecycle = getDealLifecycle(deal);
    return lifecycle.key === "upcoming";
  };

  const getDealCardImage = (deal) => {
    // 1. Ưu tiên tuyệt đối ảnh do admin đã tải lên
    if (
      deal.cardImage &&
      typeof deal.cardImage === "string" &&
      deal.cardImage.trim() !== "" &&
      !deal.cardImage.includes("undefined")
    ) {
      return deal.cardImage;
    }

    // 2. Fallback dự phòng chỉ dùng khi admin chưa tải ảnh lên
    const code = (deal.code || "").toUpperCase();
    const type = (deal.type || "").toLowerCase();
    const name = (deal.name || "").toLowerCase();

    if (type.includes("đặt bàn") || name.includes("đặt bàn")) {
      return bookingCardImg;
    }
    if (type.includes("sinh nhật") || name.includes("sinh nhật")) {
      return birthdayCardImg;
    }
    if (
      type.includes("online") ||
      type.includes("đặt món") ||
      name.includes("online")
    ) {
      return onlineCardImg;
    }
    if (
      code.includes("GIANGSINH") ||
      type.includes("món") ||
      name.includes("nướng") ||
      name.includes("dê")
    ) {
      return cardMeatDish;
    }
    return comboCardImg;
  };

  const getDealBadge = (deal) => {
    return deal.type || "Ưu đãi";
  };

  const formatDiscount = (discount) => {
    if (!discount) return "";
    const str = String(discount).trim();
    if (str.toLowerCase().startsWith("giảm")) return str;
    return `Giảm ${str}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Chỉ lấy danh sách ưu đãi thực từ Admin (loại bỏ ưu đãi đã hết hạn / qua thời gian)
  const validDeals = useMemo(() => {
    return adminDeals.filter((deal) => !isDealExpired(deal));
  }, [adminDeals]);

  const filterCategories = [
    { id: "all", label: "Tất cả" },
    { id: "upcoming", label: "Sắp diễn ra" },
    { id: "food", label: "Giảm giá món ăn" },
    { id: "booking", label: "Ưu đãi đặt bàn" },
    { id: "event", label: "Sự kiện đặc biệt" },
  ];

  const matchCategory = (deal, catId) => {
    if (catId === "all") return true;
    if (catId === "upcoming") return isDealUpcoming(deal);

    const type = (deal.type || "").toLowerCase();
    const name = (deal.name || "").toLowerCase();
    const code = (deal.code || "").toUpperCase();

    if (catId === "booking") {
      return (
        type.includes("đặt bàn") ||
        name.includes("đặt bàn") ||
        code.includes("BOOKING")
      );
    }
    if (catId === "food") {
      return (
        type.includes("combo") ||
        type.includes("món") ||
        name.includes("combo") ||
        type.includes("đặt món") ||
        code.includes("ONLINE") ||
        code.includes("FAMILY")
      );
    }
    if (catId === "event") {
      return (
        type.includes("sinh nhật") ||
        type.includes("ngày lễ") ||
        type.includes("sự kiện") ||
        type.includes("đặc biệt") ||
        type.includes("thành viên") ||
        name.includes("sinh nhật") ||
        name.includes("lễ") ||
        name.includes("giáng sinh") ||
        code.includes("BIRTHDAY") ||
        code.includes("GIANGSINH") ||
        code.includes("PHUNU")
      );
    }
    return true;
  };

  const categoryCounts = useMemo(() => {
    const counts = {
      all: validDeals.length,
      upcoming: 0,
      food: 0,
      booking: 0,
      event: 0,
    };
    validDeals.forEach((d) => {
      if (isDealUpcoming(d)) counts.upcoming++;
      if (matchCategory(d, "food")) counts.food++;
      if (matchCategory(d, "booking")) counts.booking++;
      if (matchCategory(d, "event")) counts.event++;
    });
    return counts;
  }, [validDeals]);

  const filteredDeals = useMemo(() => {
    return validDeals.filter((deal) => matchCategory(deal, activeTab));
  }, [validDeals, activeTab]);

  return (
    <div className="min-h-screen bg-[#fafbfa] text-slate-800">
      <SEO
        title="Chương Trình Khuyến Mãi & Ưu Đãi | Nhà Hàng Dê Hương Sơn"
        description="Tổng hợp các chương trình ưu đãi, giảm giá tiệc sinh nhật, combo gia đình hấp dẫn tại Nhà Hàng Dê Hương Sơn - Thanh Trì, Hà Nội. Đặt bàn nhận ưu đãi ngay!"
        canonical="/deals"
        schema={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Trang chủ",
              item: "https://dehuongson.vercel.app/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Khuyến mãi",
              item: "https://dehuongson.vercel.app/deals",
            },
          ],
        }}
      />
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#f6f8ee] border border-emerald-900/10 p-5 sm:p-8 lg:p-10 shadow-xs">
          {/* Họa tiết lá thanh nhã trang trí góc */}
          <div className="absolute top-0 right-0 pointer-events-none opacity-40 translate-x-4 -translate-y-4 select-none">
            <svg width="240" height="240" viewBox="0 0 200 200" fill="none">
              <path
                d="M180 20 C140 40 120 80 130 130 C90 120 50 140 20 180 C40 140 80 120 130 130 C120 90 140 50 180 20 Z"
                fill="#145c30"
                opacity="0.10"
              />
              <path
                d="M190 70 C160 85 140 115 150 150 C120 140 90 160 70 190"
                stroke="#145c30"
                strokeWidth="2.5"
                opacity="0.15"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Cột trái: Thông tin ưu đãi */}
            <div className="lg:col-span-7">
              {/* Badge ƯU ĐÃI ĐẶC BIỆT */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e3ece4] text-[#145c30] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-3.5 border border-emerald-200/50 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#145c30] fill-[#145c30]" />
                <span>ƯU ĐÃI ĐẶC BIỆT</span>
              </div>

              {/* Tiêu đề chính */}
              <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-[#0f381e] tracking-tight leading-[1.18]">
                Khuyến mãi hấp dẫn <br />
                Tại Dê Hương Sơn
              </h1>

              {/* Đoạn mô tả */}
              <p className="mt-2.5 sm:mt-3 text-slate-600 text-xs sm:text-sm md:text-[15px] max-w-lg leading-relaxed">
                Thưởng thức món ngon – Nhận ngay ưu đãi hấp dẫn với nhiều chương
                trình khuyến mãi trong tháng!
              </p>

              {/* 3 Lợi ích nổi bật */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-5 sm:pt-6 mt-4 sm:mt-5 border-t border-emerald-900/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#145c30] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    %
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      Giảm giá hấp dẫn
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      lên đến 25%
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-6 bg-slate-300/70" />

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#145c30] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      Ưu đãi đa dạng
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      cho mọi dịp
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-6 bg-slate-300/70" />

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#145c30] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      Cập nhật liên tục
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      hàng tháng
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Hình minh họa đĩa món ngon với chữ nghệ thuật hòa trộn liền mạch */}
            <div className="lg:col-span-5 relative flex items-center justify-center select-none pt-2 sm:pt-0">
              <img
                src={heroIllustration}
                alt="Món ngon Hương vị thật! - Dê Hương Sơn"
                className="w-full max-w-[460px] lg:max-w-[500px] object-contain select-none hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
            </div>
          </div>
        </section>

        {/* ================= FILTER TABS ================= */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 my-6 sm:my-8 scrollbar-none">
          {filterCategories.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-[#145c30] text-white shadow-sm"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.label} ({categoryCounts[cat.id] || 0})
              </button>
            );
          })}
        </div>

        {/* ================= 2-COLUMN DEALS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-8 sm:mb-10">
          {filteredDeals.length > 0 ? (
            filteredDeals.map((deal) => {
              const badge = getDealBadge(deal);
              const image = getDealCardImage(deal);
              const discountText = formatDiscount(deal.discount);

              return (
                <div
                  key={deal.id || deal.code}
                  className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3.5 sm:gap-4.5 group"
                >
                  {/* Cột trái: Ảnh món ăn + Nhãn giảm giá cam */}
                  <div className="relative w-full sm:w-[175px] md:w-[195px] lg:w-[205px] h-[175px] sm:h-auto min-h-[160px] rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                    {discountText && (
                      <div className="absolute top-3 left-3 z-10 bg-[#ff6e1d] text-white font-bold text-xs sm:text-[13px] px-3.5 py-1 rounded-full shadow-sm">
                        {discountText}
                      </div>
                    )}
                    <img
                      src={image}
                      alt={deal.name}
                      className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                    />
                  </div>

                  {/* Cột phải: Thông tin chi tiết */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      {/* Nhãn hình thức & Trạng thái */}
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf4ea] text-[#1e6b37] w-fit">
                          {badge}
                        </span>
                        {isDealUpcoming(deal) && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 w-fit">
                            Sắp diễn ra
                          </span>
                        )}
                      </div>

                      {/* Tiêu đề ưu đãi */}
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#145c30] transition-colors leading-snug line-clamp-2">
                        {deal.name}
                      </h3>

                      {/* Mô tả ưu đãi */}
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {deal.subtitle ||
                          deal.desc ||
                          "Ưu đãi hấp dẫn dành cho quý khách hàng tại Dê Hương Sơn."}
                      </p>

                      {/* Thời hạn áp dụng */}
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium mt-2.5">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Áp dụng: {formatDate(deal.startDate)}
                          {deal.endDate ? ` - ${formatDate(deal.endDate)}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Nút Xem chi tiết */}
                    <div className="pt-3 mt-auto">
                      <button
                        type="button"
                        onClick={() => navigate(getDealUrl(deal))}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#145c30] hover:bg-[#0f4423] text-white font-bold text-xs transition active:scale-95 shadow-2xs w-fit cursor-pointer"
                      >
                        <span>Xem chi tiết</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="md:col-span-2 py-12 text-center bg-white rounded-2xl border border-slate-200/60 p-6">
              <p className="text-slate-600 font-bold text-sm">
                Chưa có chương trình ưu đãi trong danh mục này.
              </p>
            </div>
          )}
        </div>

        {/* ================= BOTTOM CTA BANNER ================= */}
        <section className="bg-[#f2f6ea] border border-emerald-900/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-2xs">
          {/* Họa tiết lá chân thực góc phải dưới */}
          <img
            src={ctaLeaves}
            alt=""
            aria-hidden="true"
            className="absolute right-0 bottom-0 max-h-[85px] sm:max-h-[95px] object-contain pointer-events-none select-none opacity-80"
          />

          <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 text-center sm:text-left">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#145c30] text-white flex items-center justify-center shrink-0 shadow-xs mx-auto sm:mx-0">
              <Utensils className="w-5 h-5 text-white" />
            </div>

            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                Đặt bàn ngay – Nhận ưu đãi tức thì!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Nhanh tay đặt bàn để không bỏ lỡ những chương trình hấp dẫn.
              </p>
            </div>
          </div>

          <div className="relative z-10 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/booking")}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#145c30] hover:bg-[#0f4423] text-white font-bold text-xs sm:text-sm transition active:scale-95 shadow-xs whitespace-nowrap cursor-pointer text-center"
            >
              Đặt bàn ngay →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DealsPage;
