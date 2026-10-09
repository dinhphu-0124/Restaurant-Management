import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { Gift, CalendarDays, Star, CheckCircle, Utensils } from "lucide-react";

import goatIcon from "../assets/images/Icon_De.png";
import comboCardImg from "../assets/images/Deals/combo-card.png";
import restaurantSpace from "../assets/images/Deals/restaurant-space.png";
import goatFood from "../assets/images/Deals/goat-food.png";

function DealsPage() {
  const navigate = useNavigate();

  const [currentBanner, setCurrentBanner] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [adminDeals, setAdminDeals] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/api/deals")
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

  const getDealConditions = (deal) => {
    const serviceTypes = Array.isArray(deal.serviceTypes)
      ? deal.serviceTypes
      : [];

    const serviceConditionItems = deal.serviceConditionItems || {};

    const serviceConditions = serviceTypes.flatMap(
      (type) => serviceConditionItems[type] || [],
    );

    return [
      deal.condition
        ? `Áp dụng hóa đơn từ ${Number(deal.condition).toLocaleString(
            "vi-VN",
          )}đ`
        : "",
      ...(Array.isArray(deal.conditionItems) ? deal.conditionItems : []),
      ...serviceConditions,
    ].filter((item, index, array) => item && array.indexOf(item) === index);
  };

  const activeAdminDeals = adminDeals.filter(
    (deal) => deal.status === "active",
  );

  const upcomingAdminDeals = adminDeals.filter(
    (deal) => deal.status === "upcoming",
  );

  const heroDeals = activeAdminDeals
    .filter((deal) => deal.bannerImage || deal.detailImage || deal.cardImage)
    .map((deal) => ({
      id: deal.slug || deal.code || deal.id,
      image: deal.bannerImage || deal.detailImage || deal.cardImage,
      label: deal.subtitle || deal.type || "Khuyến mãi",
      scriptTitle: deal.name,
      title: String(deal.discount || "").includes("%") ? "Giảm" : "Ưu đãi",
      discount: deal.discount || "",
      desc: deal.desc || deal.subtitle || "Chương trình khuyến mãi hấp dẫn.",
      conditions: getDealConditions(deal).slice(0, 4),
    }));

  const banner =
    heroDeals.length > 0 ? heroDeals[currentBanner % heroDeals.length] : null;

  useEffect(() => {
    setCurrentBanner(0);
  }, [heroDeals.length]);

  useEffect(() => {
    if (heroDeals.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(false);

      setTimeout(() => {
        setCurrentBanner((prev) => (prev + 1) % heroDeals.length);

        setTimeout(() => {
          setIsAnimating(true);
        }, 50);
      }, 350);
    }, 6000);

    return () => clearInterval(interval);
  }, [heroDeals.length]);

  const handlePrevBanner = () => {
    if (heroDeals.length === 0) return;

    setCurrentBanner((prev) => (prev === 0 ? heroDeals.length - 1 : prev - 1));
  };

  const handleNextBanner = () => {
    if (heroDeals.length === 0) return;

    setCurrentBanner((prev) => (prev + 1) % heroDeals.length);
  };

  return (
    <div className="min-h-screen bg-[#fbf7ec] text-green-950">
      <main className="max-w-[1500px] mx-auto px-4 md:px-6 py-10">
        {/* HERO PROMO */}
        {banner ? (
          <section
            className={`relative h-[315px] sm:h-[380px] md:h-[500px] overflow-hidden rounded-[22px] md:rounded-[30px] shadow-xl transition-all duration-1000 ease-in-out ${
              isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
            }`}
          >
            <img
              src={banner.image}
              alt={banner.scriptTitle}
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div
              className="absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0) 75%)",
              }}
            ></div>

            <div
              key={banner.id}
              className="relative z-20 h-full w-full px-5 sm:px-8 md:px-14 lg:px-20 flex items-center"
            >
              {/* Lớp phủ mờ: đậm bên trái, mờ dần ra giữa */}
              <div
                className="absolute inset-y-0 left-0 w-[72%] z-[-1]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.52) 38%, rgba(0,0,0,0.22) 68%, rgba(0,0,0,0) 100%)",
                }}
              />

              <div className="w-full max-w-[760px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
                <span className="w-fit inline-flex items-center gap-2 border border-[#d6a84f] text-[#f6d47a] px-4 py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wide">
                  <Star className="w-4 h-4" />
                  {banner.label}
                </span>

                <p
                  className="mt-3 text-3xl sm:text-5xl md:text-6xl text-white leading-none"
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                >
                  {banner.scriptTitle}
                </p>

                <h1 className="mt-2 text-4xl sm:text-6xl md:text-7xl font-black uppercase leading-none text-white">
                  {banner.title}{" "}
                  <span className="text-[#f6d47a]">{banner.discount}</span>
                </h1>

                <p className="mt-5 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed max-w-[680px]">
                  {banner.desc}
                </p>

                {banner.conditions.length > 0 && (
                  <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 max-w-[720px]">
                    {banner.conditions.slice(0, 4).map((text, index) => (
                      <div
                        key={text}
                        className="min-h-[72px] rounded-2xl border border-white/15 bg-white/10 px-3 py-3 flex items-start gap-2 text-white/90"
                      >
                        {index === 0 && (
                          <CalendarDays className="w-4 h-4 text-[#f6d47a] shrink-0 mt-0.5" />
                        )}

                        {index === 1 && (
                          <Utensils className="w-4 h-4 text-[#f6d47a] shrink-0 mt-0.5" />
                        )}

                        {index >= 2 && (
                          <Gift className="w-4 h-4 text-[#f6d47a] shrink-0 mt-0.5" />
                        )}

                        <span className="text-xs md:text-[13px] leading-snug line-clamp-3">
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => navigate(`/deals/${banner.id}`)}
                  className="mt-5 w-[190px] sm:w-[230px] md:w-[250px] h-11 sm:h-12 bg-[#f6c441] text-green-950 rounded-xl text-xs sm:text-sm md:text-base font-black hover:bg-[#d6a84f] hover:scale-105 transition"
                >
                  Xem chi tiết ưu đãi →
                </button>
              </div>
            </div>

            {heroDeals.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevBanner}
                  className="hidden sm:flex absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/35 text-white items-center justify-center text-3xl font-bold hover:bg-black/55 transition"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={handleNextBanner}
                  className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/35 text-white flex items-center justify-center text-3xl font-bold hover:bg-black/55 transition"
                >
                  ›
                </button>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {heroDeals.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentBanner(index)}
                      className={`h-2 rounded-full transition-all ${
                        currentBanner === index
                          ? "w-8 bg-[#f6c441]"
                          : "w-2 bg-white/50"
                      }`}
                    ></button>
                  ))}
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="relative h-[260px] sm:h-[320px] md:h-[420px] rounded-[22px] md:rounded-[30px] shadow-xl bg-white border border-[#eadfcd] flex items-center justify-center text-center px-6">
            <div>
              <p className="text-2xl md:text-4xl font-black text-[#145c30]">
                Chưa có khuyến mãi nổi bật
              </p>

              <p className="text-sm md:text-base text-gray-500 mt-3">
                Các chương trình khuyến mãi sẽ được cập nhật sau.
              </p>
            </div>
          </section>
        )}

        <SectionTitle
          title="Ưu đãi đang diễn ra"
          subtitle="Nhiều chương trình hấp dẫn dành riêng cho bạn"
        />

        <section className="mb-10">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            loop={activeAdminDeals.length > 4}
            loopAdditionalSlides={activeAdminDeals.length}
            grabCursor={true}
            allowTouchMove={true}
            speed={1000}
            autoplay={
              activeAdminDeals.length > 4
                ? {
                    delay: 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                    stopOnLastSlide: false,
                  }
                : false
            }
            breakpoints={{
              0: {
                slidesPerView: 1.1,
                spaceBetween: 14,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
            }}
            className="deal-swiper pb-10"
          >
            {activeAdminDeals.length > 0 ? (
              activeAdminDeals.map((item, index) => (
                <SwiperSlide key={`${item.id || item.code}-${index}`}>
                  <div className="relative h-[360px] sm:h-[460px] lg:h-[520px] rounded-3xl border border-[#eadfcd] shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-md transition group cursor-grab active:cursor-grabbing">
                    <img
                      src={item.cardImage || item.detailImage || comboCardImg}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    />

                    <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-transparent"></div>

                    <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/20 backdrop-blur text-[#f6d47a] flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5" />
                        </div>

                        <h3 className="font-black text-base text-white drop-shadow">
                          {item.name}
                        </h3>
                      </div>

                      <div className="h-[70px] sm:h-[90px] flex items-center">
                        <h2 className="font-black uppercase leading-tight text-3xl sm:text-4xl text-green-700">
                          {String(item.discount || "").includes("%") ? (
                            <>
                              Giảm{" "}
                              <span className="text-4xl sm:text-5xl text-[#f6d47a]">
                                {item.discount}
                              </span>
                            </>
                          ) : (
                            <span className="text-2xl sm:text-3xl text-green-700">
                              {item.discount}
                            </span>
                          )}
                        </h2>
                      </div>

                      <div className="w-8 h-[2px] bg-[#f6d47a] mt-0 mb-1"></div>

                      <p className="text-xs sm:text-sm text-white/90 leading-relaxed line-clamp-2">
                        {item.desc || item.subtitle}
                      </p>

                      {Number(item.condition || 0) > 0 && (
                        <p className="mt-2 text-xs sm:text-sm text-[#f6d47a] font-bold">
                          HĐ từ{" "}
                          {Number(item.condition || 0).toLocaleString("vi-VN")}đ
                        </p>
                      )}

                      <div className="mt-auto pt-6">
                        <button
                          onClick={() => navigate(getDealUrl(item))}
                          className="w-full h-10 sm:h-12 bg-black/25 border border-white/30 text-white px-4 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#f6c441] hover:text-green-950 hover:border-[#f6c441] transition"
                        >
                          Xem chi tiết →
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))
            ) : (
              <SwiperSlide>
                <div className="h-[260px] rounded-3xl border border-[#eadfcd] bg-white flex items-center justify-center text-center p-6">
                  <div>
                    <p className="text-xl font-black text-green-900">
                      Chưa có khuyến mãi đang diễn ra
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Các chương trình khuyến mãi sẽ được cập nhật sau.
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            )}
          </Swiper>
        </section>

        <SectionTitle title="Điều kiện áp dụng" />

        <section className="bg-white border border-[#eadfcd] rounded-3xl shadow-sm p-4 sm:p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {activeAdminDeals.length > 0 ? (
            activeAdminDeals.slice(0, 4).map((deal) => {
              const conditions = getDealConditions(deal);

              return (
                <div key={deal.id || deal.code} className="flex gap-4">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-green-50 text-green-900 flex items-center justify-center shrink-0">
                    <Gift />
                  </div>

                  <div>
                    <h3 className="font-black text-green-900 mb-3">
                      {deal.name}
                    </h3>

                    <div className="space-y-2">
                      {(conditions.length > 0
                        ? conditions
                        : ["Không có điều kiện bổ sung"]
                      ).map((text) => (
                        <p
                          key={text}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="w-4 h-4 text-[#d6a84f] shrink-0 mt-0.5" />
                          {text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="lg:col-span-4 py-10 text-center text-gray-400 font-bold">
              Chưa có điều kiện áp dụng từ chương trình khuyến mãi.
            </div>
          )}
        </section>

        <SectionTitle title="Ưu đãi sắp diễn ra" />

        <section className="relative mb-10">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation={upcomingAdminDeals.length > 1}
            pagination={{ clickable: true }}
            loop={upcomingAdminDeals.length > 4}
            loopAdditionalSlides={upcomingAdminDeals.length}
            grabCursor={true}
            allowTouchMove={true}
            speed={1000}
            autoplay={
              upcomingAdminDeals.length > 4
                ? {
                    delay: 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
                : false
            }
            breakpoints={{
              0: {
                slidesPerView: 1.1,
                spaceBetween: 14,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
            }}
            className="deal-swiper pb-10"
          >
            {upcomingAdminDeals.length > 0 ? (
              upcomingAdminDeals.map((item) => (
                <SwiperSlide key={item.id || item.code}>
                  <button
                    type="button"
                    onClick={() => navigate(getDealUrl(item))}
                    className="w-full h-[150px] text-left bg-white border border-[#eadfcd] rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md hover:border-[#d6a84f] transition group"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#fbf0dc] text-green-900 flex items-center justify-center shrink-0 group-hover:bg-green-900 group-hover:text-[#f6d47a] transition">
                      <CalendarDays />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-black text-green-900 group-hover:text-[#b88935] transition line-clamp-1">
                        {item.name}
                      </h3>

                      <p className="text-sm font-bold text-gray-600 mt-1">
                        {item.startDate ? new Date(item.startDate).toLocaleDateString("vi-VN") : "Chưa có"} -{" "}
                        {item.endDate ? new Date(item.endDate).toLocaleDateString("vi-VN") : "Chưa có"}
                      </p>

                      <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
                        {item.desc || item.subtitle || "Ưu đãi sắp diễn ra."}
                      </p>

                      <p className="text-xs font-black text-green-900 mt-3 opacity-0 group-hover:opacity-100 transition">
                        Xem chi tiết →
                      </p>
                    </div>
                  </button>
                </SwiperSlide>
              ))
            ) : (
              <SwiperSlide>
                <div className="h-[150px] bg-white border border-[#eadfcd] rounded-2xl p-5 flex items-center justify-center text-center text-gray-400 font-bold">
                  Chưa có ưu đãi sắp diễn ra
                </div>
              </SwiperSlide>
            )}
          </Swiper>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div
            className="relative overflow-hidden rounded-3xl min-h-[230px] md:min-h-[300px] p-6 md:p-10 flex flex-col justify-center"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0,50,25,.95) 0%, rgba(0,50,25,.82) 45%, rgba(0,50,25,.35) 100%), url(${restaurantSpace})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[#f6c441] flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-[#f6c441]" />
              </div>

              <h2 className="text-2xl md:text-4xl font-black text-white">
                Đặt bàn ngay
              </h2>
            </div>

            <div className="w-16 h-1 bg-[#f6c441] rounded-full mt-4 mb-5" />

            <p className="text-white/85 max-w-md leading-relaxed">
              Giữ chỗ nhanh chóng cho gia đình, bạn bè và các buổi tiệc sinh
              nhật, liên hoan tại Dê Hương Sơn.
            </p>

            <button
              onClick={() => navigate("/booking")}
              className="mt-7 w-fit bg-[#f6c441] hover:bg-[#ffd35a] hover:scale-105 transition-all duration-300 px-7 py-3 rounded-xl font-bold text-green-950 shadow-lg"
            >
              Đặt bàn ngay →
            </button>
          </div>

          <div
            className="relative overflow-hidden rounded-3xl min-h-[300px] p-8 md:p-10 flex flex-col justify-center"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0,50,25,.95) 0%, rgba(0,50,25,.82) 45%, rgba(0,50,25,.35) 100%), url(${goatFood})`,
              backgroundSize: "cover",
              backgroundPosition: "right center",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[#f6c441] flex items-center justify-center">
                <Utensils className="w-6 h-6 text-[#f6c441]" />
              </div>

              <h2 className="text-2xl md:text-4xl font-black text-white">
                Đặt món ngay
              </h2>
            </div>

            <div className="w-16 h-1 bg-[#f6c441] rounded-full mt-4 mb-5" />

            <p className="text-white/85 max-w-md leading-relaxed">
              Khám phá thực đơn đặc sản dê Hương Sơn với những món ăn đậm vị núi
              rừng Hà Tĩnh.
            </p>

            <button
              onClick={() => navigate("/menu")}
              className="mt-7 w-fit bg-white hover:bg-[#fff7dc] hover:scale-105 transition-all duration-300 px-7 py-3 rounded-xl font-bold text-green-900 shadow-lg"
            >
              Xem thực đơn →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <section className="text-center my-8">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#145c30] uppercase leading-tight">
        {title}
      </h2>

      {subtitle && <p className="text-gray-500 text-sm mt-2">{subtitle}</p>}

      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="w-20 sm:w-28 h-px bg-[#d6a84f]"></div>

        <img
          src={goatIcon}
          alt="Dê Hương Sơn"
          className="w-8 h-8 object-contain"
        />

        <div className="w-20 sm:w-28 h-px bg-[#d6a84f]"></div>
      </div>
    </section>
  );
}

export default DealsPage;
