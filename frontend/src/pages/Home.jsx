import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { spaceService } from "../services/spaceService";

import LoginRequiredModal from "../components/LoginRequiredModal";
import SpacePreviewModal from "../components/home/SpacePreviewModal";
import {
  SpaceItem,
  Info,
  Promo,
  PromoBanner,
  Review,
  Service,
  calculatePromoTimeInfo,
} from "../components/home/HomeComponents";

import goatIcon from "../assets/images/Icon_De.png";
import hero1 from "../assets/images/Home/hero-1.png";
import hero2 from "../assets/images/Home/hero-2.png";
import hero3 from "../assets/images/Home/hero-3.png";
import hero4 from "../assets/images/Home/hero-4.png";
import homeSpace from "../assets/images/Home/home-space.png";

import deNuongTang from "../assets/images/menu/de-nuong-tang.jpg";
import lauDe from "../assets/images/menu/lau-de.jpg";
import deXaoLan from "../assets/images/menu/de-xao-lan.jpg";
import deHapTiaTo from "../assets/images/menu/de-hap-tia-to.jpg";

import comboCardImg from "../assets/images/Deals/combo-card.png";
import onlineCardImg from "../assets/images/Deals/online-card.png";

import tangTret from "../assets/images/About/tang-tret.png";
import tangTret1 from "../assets/images/About/tang-tret-1.png";
import tangTret2 from "../assets/images/About/tang-tret-2.png";
import tangTret3 from "../assets/images/About/tang-tret-3.png";
import tangTret4 from "../assets/images/About/tang-tret-4.png";
import tangTret5 from "../assets/images/About/tang-tret-5.png";

import tangHai from "../assets/images/About/tang-hai.png";
import tangHai1 from "../assets/images/About/tang-hai-1.png";
import tangHai2 from "../assets/images/About/tang-hai-2.png";
import tangHai3 from "../assets/images/About/tang-hai-3.png";
import tangHai4 from "../assets/images/About/tang-hai-4.png";
import tangHai5 from "../assets/images/About/tang-hai-5.png";

import phongVip from "../assets/images/About/phong-vip.png";
import phongVip1 from "../assets/images/About/phong-vip-1.png";
import phongVip2 from "../assets/images/About/phong-vip-2.png";
import phongVip3 from "../assets/images/About/phong-vip-3.png";
import phongVip4 from "../assets/images/About/phong-vip-4.png";
import phongVip5 from "../assets/images/About/phong-vip-5.png";

import { socket } from "../utils/socket";

import {
  Leaf,
  ShoppingCart,
  CalendarDays,
  ChefHat,
  Heart,
  Phone,
  Clock,
  Mountain,
  CookingPot,
  X,
  Users,
  Award,
  Truck,
  ImageIcon,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Flame,
} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const heroImages = [hero1, hero2, hero3, hero4];

  const [currentHero, setCurrentHero] = useState(0);

  const location = useLocation();
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [toast, setToast] = useState(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSpaceModal, setShowSpaceModal] = useState(false);

  const [activeSpaceTab, setActiveSpaceTab] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const parsePrice = (price) => {
    if (typeof price === "number") return price;
    return Number(String(price || "").replace(/[^\d]/g, ""));
  };

  const addToCart = (dish) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    const cartDish = {
      id: dish.id,
      name: dish.name,
      desc: dish.description,
      price: parsePrice(dish.price),
      qty: 1,
      image: dish.image,
      tag: dish.tag || dish.badge || "",
    };

    const existed = cartItems.find((item) => item.id === cartDish.id);

    const newCart = existed
      ? cartItems.map((item) =>
        item.id === cartDish.id ? { ...item, qty: item.qty + 1 } : item,
      )
      : [...cartItems, cartDish];

    setCartItems(newCart);
    localStorage.setItem("cartItems", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));

    setToast({ dishName: dish.name });

    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const [dishSlide, setDishSlide] = useState(0);

  useEffect(() => {
    if (location.state?.openSpace) {
      setActiveSpaceTab(location.state.openSpace);
      setShowSpaceModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    const loginStatus =
      localStorage.getItem("isLoggedIn") === "true" ||
      sessionStorage.getItem("isLoggedIn") === "true";

    setIsLoggedIn(loginStatus);
  }, [location.pathname]);

  useEffect(() => {
    if (location.state?.loginSuccess) {
      setShowLoginToast(true);

      setTimeout(() => {
        setShowLoginToast(false);
      }, 3000);
    }
  }, [location]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateCartQty = () => {
      const savedCart = localStorage.getItem("cartItems");
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
    };

    window.addEventListener("storage", updateCartQty);
    window.addEventListener("cartUpdated", updateCartQty);
    updateCartQty();
    return () => {
      window.removeEventListener("storage", updateCartQty);
      window.removeEventListener("cartUpdated", updateCartQty);
    };
  }, []);

  const [spaceTabsData, setSpaceTabsData] = useState([]);

  const fetchActiveSpaces = async () => {
    try {
      const data = await spaceService.getActiveSpaces();
      if (Array.isArray(data)) {
        setSpaceTabsData(data);
        setActiveSpaceTab((prev) => {
          if (prev && data.some((s) => s.key === prev)) return prev;
          return data[0]?.key || "";
        });
      }
    } catch (error) {
      console.error("Lỗi khi fetch active spaces:", error);
    }
  };

  useEffect(() => {
    fetchActiveSpaces();

    const handleUpdate = () => {
      fetchActiveSpaces();
    };
    window.addEventListener("spacesUpdated", handleUpdate);
    window.addEventListener("spaceImagesUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    socket.on("spaces_updated", handleUpdate);
    socket.on("areas_updated", handleUpdate);

    return () => {
      window.removeEventListener("spacesUpdated", handleUpdate);
      window.removeEventListener("spaceImagesUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      socket.off("spaces_updated", handleUpdate);
      socket.off("areas_updated", handleUpdate);
    };
  }, []);

  const activeSpace =
    spaceTabsData.find((item) => item.key === activeSpaceTab) || spaceTabsData[0] || null;

  const getImgUrl = (img) => {
    if (!img) return "";
    const url = typeof img === "string" ? img : img.url || img.image || "";
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    if (url.startsWith("/uploads/")) {
      return `http://localhost:5001${url}`;
    }
    return url;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (previewImage) {
          setPreviewImage(null);
          return;
        }

        if (showSpaceModal) {
          setShowSpaceModal(false);
        }
      }

      if (!previewImage) return;

      if (e.key === "ArrowLeft") {
        const newIndex =
          previewIndex === 0 ? activeSpace.images.length - 1 : previewIndex - 1;

        setPreviewIndex(newIndex);
        setPreviewImage(getImgUrl(activeSpace.images[newIndex]));
      }

      if (e.key === "ArrowRight") {
        const newIndex =
          previewIndex === activeSpace.images.length - 1 ? 0 : previewIndex + 1;

        setPreviewIndex(newIndex);
        setPreviewImage(getImgUrl(activeSpace.images[newIndex]));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewImage, previewIndex, activeSpace, showSpaceModal]);
  const fallbackDishes = [
    { id: "fb-1", name: "Dê Nướng Tảng", price: 280000, image: deNuongTang, badge: "Đặc sản" },
    { id: "fb-2", name: "Lẩu Dê Hương Sơn", price: 350000, image: lauDe, badge: "Đặc sản" },
    { id: "fb-3", name: "Dê Xào Lăn", price: 220000, image: deXaoLan, badge: "Đặc sản" },
    { id: "fb-4", name: "Dê Hấp Tía Tô", price: 240000, image: deHapTiaTo, badge: "Đặc sản" },
  ];

  const [dishes, setDishes] = useState(fallbackDishes);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/menu-items");
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          // CHỈ lấy những món được gán tab/badge là "Đặc sản"
          const specialtyDishes = result.data.filter(
            (d) =>
              (d.badge && d.badge.trim().toLowerCase() === "đặc sản") ||
              (d.tag && d.tag.trim().toLowerCase() === "đặc sản")
          );

          if (specialtyDishes.length > 0) {
            setDishes(specialtyDishes);
          } else {
            setDishes(fallbackDishes);
          }
        } else {
          setDishes(fallbackDishes);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách món ăn trang chủ:", err);
        setDishes(fallbackDishes);
      }
    };
    fetchDishes();

    const handleMenuUpdate = () => {
      fetchDishes();
    };
    window.addEventListener("menuUpdated", handleMenuUpdate);
    window.addEventListener("storage", handleMenuUpdate);

    return () => {
      window.removeEventListener("menuUpdated", handleMenuUpdate);
      window.removeEventListener("storage", handleMenuUpdate);
    };
  }, []);

  //danh sách món
  const dishesPerSlide = 4;
  const totalDishSlides = Math.ceil(dishes.length / dishesPerSlide);

  const visibleDishes = dishes.slice(
    dishSlide * dishesPerSlide,
    dishSlide * dishesPerSlide + dishesPerSlide,
  );

  // khuyến mãi
  const [promoTab, setPromoTab] = useState("all"); // "all" | "ongoing" | "upcoming"
  const [promos, setPromos] = useState([
    {
      id: "xmas25",
      title: "Giáng sinh ấm áp",
      discount: "-25%",
      tag: "Giáng sinh",
      image: comboCardImg,
      desc: "Mừng lễ Giáng Sinh, ưu đãi đặc biệt cho thực khách.",
      startDate: "2026-12-15",
      endDate: "2026-12-27",
    },
    {
      id: "online15",
      title: "Ưu đãi đặt bàn",
      discount: "-15%",
      tag: "",
      image: onlineCardImg,
      desc: "Đặt bàn trước qua website, nhận ngay ưu đãi đặc biệt.",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    },
    {
      id: "family20",
      title: "Combo gia đình ấm cúng",
      discount: "-20%",
      tag: "Combo",
      image: comboCardImg,
      desc: "Thưởng thức trọn vẹn đặc sản dê nướng và lẩu dê cùng người thân.",
      startDate: "2026-10-05",
      endDate: "2026-11-20",
    },
  ]);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/deals");
        const result = await res.json();
        if (result.success && Array.isArray(result.deals)) {
          const activeDeals = result.deals
            .filter((d) => d.status === "active")
            .slice(0, 10)
            .map((d) => ({
              id: d.slug || d.code || String(d.id),
              title: d.name,
              discount: d.discount
                ? String(d.discount).startsWith("-")
                  ? d.discount
                  : `-${d.discount}`
                : "-20%",
              tag: d.tag || (d.type === "Giáng sinh" ? "Giáng sinh" : (d.type === "Combo" ? "Combo" : "")),
              image:
                d.card_image ||
                d.detail_image ||
                d.cardImage ||
                d.detailImage ||
                (d.type === "Sinh nhật" ? comboCardImg : onlineCardImg),
              desc: d.subtitle || d.description || d.desc || "",
              startDate: d.startDate || d.start_date,
              endDate: d.endDate || d.end_date,
            }));
          if (activeDeals.length > 0) {
            setPromos(activeDeals);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách khuyến mãi trang chủ:", err);
      }
    };
    fetchPromos();
  }, []);

  const filteredPromos = promos.filter((p) => {
    if (promoTab === "all") return true;
    const timeInfo = calculatePromoTimeInfo(p.startDate, p.endDate);
    return timeInfo.status === promoTab;
  });

  return (
    <div className="min-h-screen bg-[#fbf7ec] text-green-950">
      {/* SƯƠNG MỜ */}
      <div className="fog fog-1"></div>
      <div className="fog fog-2"></div>
      <div className="leaf-float">
        <span>🍂</span>
        <span>🍁</span>
        <span>🍂</span>
        <span>🍁</span>
        <span>🍂</span>
        <span>🍁</span>
        <span>🍂</span>
        <span>🍁</span>
      </div>
      {showLoginToast && (
        <div className="fixed top-24 right-5 z-[999] bg-green-700 text-white px-5 py-3 rounded-xl shadow-2xl animate-bounce">
          Đăng nhập thành công!
        </div>
      )}

      {/* // Toast thông báo thêm món vào giỏ hàng */}
      {toast && (
        <div className="fixed top-20 right-5 z-[9999]">
          <div className="bg-white border border-[#eadfcd] shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3 w-[330px] max-w-[calc(100vw-32px)] animate-[slideIn_.25s_ease-out]">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-green-50">
              <ShoppingCart className="w-5 h-5 text-green-700" />
            </div>

            <div>
              <p className="font-black text-green-900 tracking-wide">
                Đã thêm vào giỏ hàng
              </p>

              <p className="text-sm text-gray-600">
                <span className="font-black text-[#b88935]">
                  "{toast.dishName}"
                </span>{" "}
                đã được thêm vào giỏ hàng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative w-full aspect-[16/9] overflow-hidden bg-[#fbf7ec] select-none">
        {/* BACKGROUND SLIDER */}
        {heroImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt="Dê Hương Sơn"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms] ease-in-out ${index === currentHero
                ? "opacity-100 scale-100"
                : "opacity-0 scale-100"
              }`}
          />
        ))}

        {/* OVERLAY SÁNG NHẸ */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#fbf7ec]/15 via-transparent to-[#fbf7ec]/25 pointer-events-none"></div>

        {/* LỚP CHUYỂN MÀU MỀM MẠI Ở CHÂN ĐÁY BANNER (GỌN GÀNG, KHÔNG CHE NÚT) */}
        <div
          className="absolute -bottom-1 left-0 right-0 h-[22%] pointer-events-none z-20"
          style={{
            background:
              "linear-gradient(to top, #fbf7ec 0%, #fbf7ec 15%, rgba(251, 247, 236, 0.75) 50%, rgba(251, 247, 236, 0.2) 80%, transparent 100%)",
          }}
        ></div>
        {/* PHỦ KÍN MÉP RÃNH SUB-PIXEL */}
        <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] bg-[#fbf7ec] pointer-events-none z-20"></div>

        {/* KHỐI NỘI DUNG NẰM CHÍNH GIỮA NỬA BÊN TRÁI VỚI CỠ CHỮ CO GIÃN TỰ ĐỘNG THEO MÀN HÌNH */}
        <div className="absolute left-0 top-0 bottom-0 w-[54%] sm:w-[50%] lg:w-[48%] flex items-center justify-center pl-2 sm:pl-6 lg:pl-12 pr-1 sm:pr-4 z-10">
          {/* Lớp tỏa sáng mềm mại tự nhiên trực tiếp sau chữ (không tạo viền/hình chữ nhật) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[75%] rounded-full bg-white/45 lg:bg-white/55 blur-xl sm:blur-2xl lg:blur-3xl pointer-events-none"></div>

          {/* Nội dung chữ co giãn mượt mà theo mọi kích thước màn hình */}
          <div className="relative z-10 text-center max-w-full w-full">
            <p
              className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl text-[#15803d] mb-0 leading-none drop-shadow-xs sm:drop-shadow-sm"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              Đặc sản
            </p>

            <h2 className="text-sm sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl font-black text-[#145c30] uppercase leading-tight mt-0.5 sm:mt-1 drop-shadow-2xs">
              Dê Hương Sơn
            </h2>

            <h3 className="text-[10.5px] sm:text-sm md:text-lg lg:text-2xl xl:text-3xl font-bold text-[#145c30] tracking-[0.1em] sm:tracking-[0.2em] lg:tracking-[0.25em] mt-0.5">
              Hà Tĩnh
            </h3>

            <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 lg:gap-4 my-1 sm:my-2 lg:my-3.5">
              <div className="w-5 sm:w-12 md:w-18 lg:w-24 h-px bg-green-700/80"></div>
              <img
                src={goatIcon}
                alt="Dê Hương Sơn"
                className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 lg:w-10 lg:h-10 object-contain"
              />
              <div className="w-5 sm:w-12 md:w-18 lg:w-24 h-px bg-green-700/80"></div>
            </div>

            <p className="text-[9.5px] sm:text-xs md:text-sm lg:text-base text-gray-800 max-w-xs md:max-w-md mx-auto mb-1.5 sm:mb-2.5 lg:mb-5 leading-tight sm:leading-relaxed font-medium px-0.5">
              Thưởng thức hương vị dê núi Hương Sơn
              <br />
              đậm đà bản sắc – tươi ngon, bổ dưỡng.
            </p>

            <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 lg:gap-3.5 mt-1 sm:mt-2 lg:mt-3">
              <button
                onClick={() => navigate("/about")}
                className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 sm:px-4 md:px-6 lg:px-7 py-1 sm:py-1.5 md:py-2 lg:py-2.5 rounded-full font-bold text-[9px] sm:text-xs md:text-sm lg:text-base shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
              >
                <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-5 lg:h-5 inline" />
                <span>Khám phá ngay</span>
              </button>

              <div className="booking-wrapper shrink-0">
                <button
                  onClick={() => navigate("/booking")}
                  className="bg-[#c99a45] hover:bg-[#b0802c] text-white px-3 sm:px-4 md:px-6 lg:px-7 py-1 sm:py-1.5 md:py-2 lg:py-2.5 rounded-full font-bold text-[9px] sm:text-xs md:text-sm lg:text-base shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
                >
                  <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-5 lg:h-5 inline" />
                  <span>Đặt bàn ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DISHES */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-5 pt-4 sm:pt-8 md:pt-12 pb-6 sm:pb-12 lg:pb-16 relative z-20">
        {/* HEADER */}
        <div className="mb-4 sm:mb-8">
          <p
            className="text-xl sm:text-3xl md:text-4xl text-[#c99a45] leading-none mb-0.5"
            style={{ fontFamily: "'Great Vibes', cursive" }}
          >
            Món ngon
          </p>

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-2xl md:text-3xl font-black uppercase text-[#145c30] tracking-tight">
              Món ngon nổi bật
            </h2>

            <Link
              to="/menu"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-2 rounded-full border border-emerald-800 text-emerald-800 font-bold hover:bg-emerald-800 hover:text-white transition duration-300 shadow-2xs hover:shadow-xs text-[11px] sm:text-sm md:text-base group shrink-0"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <p className="text-[11px] sm:text-sm md:text-base text-gray-600 mt-1">
            Những món ăn được yêu thích nhất tại Dê Hương Sơn
          </p>
        </div>

        {/* LIST */}
        <div
          key={dishSlide}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 animate-[fadeIn_.35s_ease-out]"
        >
          {visibleDishes.map((dish) => (
            <div
              key={dish.id}
              className="dish-card bg-white rounded-xl sm:rounded-2xl shadow-xs sm:shadow-md overflow-hidden hover:-translate-y-1 hover:shadow-xl transition duration-300 flex flex-col border border-stone-200/80 group"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {(dish.tag || dish.badge) && (
                  <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 bg-emerald-800/95 backdrop-blur-xs text-white text-[9px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase shadow-xs">
                    {dish.tag || dish.badge}
                  </span>
                )}

                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>

              <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2">
                <div>
                  <h3
                    className="font-bold text-gray-900 text-xs sm:text-base md:text-lg line-clamp-1 group-hover:text-emerald-800 transition-colors"
                    title={dish.name}
                  >
                    {dish.name}
                  </h3>

                  <p className="text-emerald-800 font-black mt-0.5 text-xs sm:text-base md:text-xl">
                    {typeof dish.price === "number" ? `${dish.price.toLocaleString("vi-VN")}đ` : dish.price}
                  </p>
                </div>

                <button
                  onClick={() => addToCart(dish)}
                  className="w-full bg-emerald-50 text-emerald-800 rounded-lg sm:rounded-xl py-1.5 sm:py-2.5 text-[11px] sm:text-sm md:text-base font-bold hover:bg-emerald-700 hover:text-white transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-1 sm:gap-2 border border-emerald-100 hover:border-emerald-700"
                >
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Đặt món</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* SLIDE INDICATOR DOTS */}
        {totalDishSlides > 1 && (
          <div className="flex justify-center gap-2 mt-5 sm:mt-6">
            {Array.from({ length: totalDishSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setDishSlide(index)}
                aria-label={`Slide ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${dishSlide === index
                    ? "w-7 sm:w-8 bg-emerald-800"
                    : "w-2 bg-gray-300 hover:bg-emerald-300"
                  }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ABOUT */}
      <section className="max-w-7xl mx-auto px-4 md:px-5 pb-10 sm:pb-14">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
          <div className="h-60 sm:h-80 lg:h-auto lg:min-h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md">
            <img
              src={homeSpace}
              alt="Không gian nhà hàng Dê Hương Sơn"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-[#fffaf0] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-md border border-[#eadfcd]/60 flex flex-col justify-between">
            <div>
              <p
                className="text-3xl sm:text-5xl md:text-6xl text-green-700 text-center mb-1 sm:mb-2 leading-none"
                style={{ fontFamily: "'Allura', cursive" }}
              >
                Về chúng tôi
              </p>

              <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-[#145c30] text-center mt-1 mb-2 sm:mb-4 uppercase tracking-tight">
                Dê Hương Sơn Hà Tĩnh
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed mb-6 sm:mb-8 text-center max-w-xl mx-auto">
                Chúng tôi tự hào mang đến đặc sản dê núi Hương Sơn với hương vị
                đậm đà, thơm ngon và bổ dưỡng. Từ khâu tuyển chọn nguyên liệu tươi sạch mỗi ngày
                đến bí quyết chế biến gia truyền, mỗi món ăn đều được chăm chút trọn vẹn bằng cả tâm huyết.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                <Info
                  icon={<Mountain className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />}
                  title="Đặc sản dê núi"
                  text="Dê thả tự nhiên"
                />
                <Info
                  icon={<Leaf className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />}
                  title="Nguyên liệu tươi"
                  text="Tuyển chọn mỗi ngày"
                />
                <Info
                  icon={<CookingPot className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />}
                  title="Chế biến truyền thống"
                  text="Gia truyền chuẩn vị"
                />
                <Info
                  icon={<Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />}
                  title="Không gian ấm cúng"
                  text="Tận tâm phục vụ"
                />
              </div>
            </div>

            <div className="text-center mt-6 sm:mt-8">
              <Link
                to="/about"
                className="group inline-flex items-center justify-center bg-green-800 hover:bg-green-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm md:text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 shadow-md"
              >
                <span>Tìm hiểu thêm về chúng tôi</span>
                <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* PROMO + SPACE + REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-5 pb-10 sm:pb-12">
        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
          <div className="flex flex-col gap-3 sm:gap-3.5">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-800 fill-emerald-800/20 shrink-0" />
                <h2 className="text-base sm:text-lg md:text-xl font-black uppercase text-emerald-950 tracking-tight">
                  Ưu đãi đặc biệt
                </h2>
              </div>
              <Link
                to="/deals"
                className="hidden lg:inline-flex text-emerald-800 hover:text-emerald-950 font-bold text-xs sm:text-sm items-center gap-1 transition shrink-0"
              >
                <span>Xem tất cả</span>
                <span className="leading-none">→</span>
              </Link>
            </div>

            {/* Filter Tabs: Tất cả | Đang diễn ra | Sắp diễn ra */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setPromoTab("all")}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  promoTab === "all"
                    ? "bg-[#0d6b38] text-white shadow-xs"
                    : "bg-white/80 hover:bg-emerald-50 text-emerald-950 border border-[#eadfcd]"
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setPromoTab("ongoing")}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  promoTab === "ongoing"
                    ? "bg-[#0d6b38] text-white shadow-xs"
                    : "bg-white/80 hover:bg-emerald-50 text-emerald-950 border border-[#eadfcd]"
                }`}
              >
                Đang diễn ra
              </button>
              <button
                type="button"
                onClick={() => setPromoTab("upcoming")}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  promoTab === "upcoming"
                    ? "bg-[#0d6b38] text-white shadow-xs"
                    : "bg-white/80 hover:bg-emerald-50 text-emerald-950 border border-[#eadfcd]"
                }`}
              >
                Sắp diễn ra
              </button>
            </div>

            {/* Promo Cards */}
            {filteredPromos.length === 0 ? (
              <div className="py-8 px-4 text-center bg-white/70 rounded-2xl border border-dashed border-[#eadfcd] text-gray-500 text-xs sm:text-sm">
                Hiện chưa có ưu đãi{" "}
                {promoTab === "upcoming"
                  ? "sắp diễn ra"
                  : promoTab === "ongoing"
                    ? "đang diễn ra"
                    : "nào"}
                .
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-3.5">
                {filteredPromos.slice(0, 2).map((promo) => (
                  <Promo
                    key={promo.id}
                    {...promo}
                    buttonVariant="outline"
                    onClick={() => navigate(`/deals/${promo.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Bottom Discover Banner: Only on Mobile / Tablet */}
            <div className="block lg:hidden mt-1">
              <PromoBanner onClick={() => navigate("/deals")} />
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between border border-[#eadfcd]/50">
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="text-lg sm:text-xl font-black uppercase text-[#145c30]">
                  Không gian nhà hàng
                </h2>
              </div>

              {spaceTabsData.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-medium text-sm">
                  Đang cập nhật không gian nhà hàng...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Space 1: Large feature */}
                  {spaceTabsData[0] && (
                    <button
                      onClick={() => {
                        setActiveSpaceTab(spaceTabsData[0].key);
                        setShowSpaceModal(true);
                      }}
                      className="relative h-36 sm:h-40 rounded-xl sm:rounded-2xl overflow-hidden col-span-2 group text-left"
                    >
                      <img
                        src={getImgUrl(spaceTabsData[0].coverImage || spaceTabsData[0].images?.[0]) || tangTret}
                        alt={spaceTabsData[0].label}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <p className="font-black text-sm sm:text-base leading-tight">{spaceTabsData[0].label}</p>
                        <p className="text-[11px] sm:text-xs text-white/80 line-clamp-1 mt-0.5">{spaceTabsData[0].description || "Không gian thoáng mát, ấm cúng"}</p>
                      </div>
                    </button>
                  )}

                  {/* Space 2 */}
                  {spaceTabsData[1] && (
                    <button
                      onClick={() => {
                        setActiveSpaceTab(spaceTabsData[1].key);
                        setShowSpaceModal(true);
                      }}
                      className={`relative h-24 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden group text-left ${!spaceTabsData[2] ? "col-span-2" : ""
                        }`}
                    >
                      <img
                        src={getImgUrl(spaceTabsData[1].coverImage || spaceTabsData[1].images?.[0]) || tangHai}
                        alt={spaceTabsData[1].label}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                        <p className="text-xs sm:text-sm font-black truncate">{spaceTabsData[1].label}</p>
                      </div>
                    </button>
                  )}

                  {/* Space 3 */}
                  {spaceTabsData[2] && (
                    <button
                      onClick={() => {
                        setActiveSpaceTab(spaceTabsData[2].key);
                        setShowSpaceModal(true);
                      }}
                      className="relative h-24 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden group text-left"
                    >
                      <img
                        src={getImgUrl(spaceTabsData[2].coverImage || spaceTabsData[2].images?.[0]) || phongVip}
                        alt={spaceTabsData[2].label}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                        <p className="text-xs sm:text-sm font-black truncate">{spaceTabsData[2].label}</p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (spaceTabsData.length > 0 && !activeSpaceTab) {
                  setActiveSpaceTab(spaceTabsData[0].key);
                }
                setShowSpaceModal(true);
              }}
              className="mt-4 sm:mt-5 w-full border border-green-800 text-green-800 py-2.5 rounded-xl font-bold hover:bg-green-800 hover:text-white transition text-xs sm:text-sm active:scale-95"
            >
              Xem tất cả không gian & hình ảnh →
            </button>
          </div>

          <div className="bg-[#fffaf0] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md border border-[#eadfcd]/50">
            <h2 className="text-lg sm:text-xl font-black uppercase mb-3 sm:mb-5 text-[#145c30]">
              Khách hàng nói về chúng tôi
            </h2>

            <Review
              name="Anh Minh"
              text="Món dê ở đây rất ngon, thịt mềm ngọt, không bị hôi."
            />
            <Review
              name="Chị Trang"
              text="Không gian ấm cúng, nhân viên nhiệt tình."
            />
            <Review
              name="Anh Quốc"
              text="Đặt bàn online tiện lợi, lên món nhanh."
            />
          </div>
        </div>
      </section>
      {/* SERVICE BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-5 pb-10">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md grid grid-cols-2 lg:grid-cols-4 overflow-hidden border border-[#eadfcd]/50">
          <Service
            icon={<ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />}
            title="100% dê núi Hương Sơn"
            text="Nguồn gốc rõ ràng"
          />
          <Service
            icon={<Award className="w-5 h-5 sm:w-6 sm:h-6" />}
            title="Cam kết chất lượng"
            text="Tươi ngon mỗi ngày"
          />
          <Service
            icon={<Truck className="w-5 h-5 sm:w-6 sm:h-6" />}
            title="Giao hàng nhanh"
            text="Trong nội thành"
          />
          <Service
            icon={<Phone className="w-5 h-5 sm:w-6 sm:h-6" />}
            title="Hotline đặt bàn"
            text="038 713 6878"
          />
        </div>
      </section>

      {/*xem không gian*/}
      <SpacePreviewModal
        showSpaceModal={showSpaceModal}
        setShowSpaceModal={setShowSpaceModal}
        goatIcon={goatIcon}
        spaceTabsData={spaceTabsData}
        activeSpaceTab={activeSpaceTab}
        setActiveSpaceTab={setActiveSpaceTab}
        activeSpace={activeSpace}
        getImgUrl={getImgUrl}
        setPreviewImage={setPreviewImage}
        setPreviewIndex={setPreviewIndex}
        previewImage={previewImage}
        previewIndex={previewIndex}
      />

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/login")}
        />
      )}
    </div>
  );
}

export default Home;
