import { checkLogin } from "../utils/auth";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import LoginRequiredModal from "../components/LoginRequiredModal";
import DishDetailModal from "../components/DishDetailModal";
import AppEmptyState from "../components/ui/AppEmptyState";
import AppButton from "../components/ui/AppButton";
import AppBadge from "../components/ui/AppBadge";
import AppModal from "../components/ui/AppModal";
import { API_BASE_URL } from "../config/api";

import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Gift,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowRight,
  X,
} from "lucide-react";

import goatIcon from "../assets/images/Icon_De.png";

function CartPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showEmptyCartAlert, setShowEmptyCartAlert] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [dishReviews, setDishReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const modalScrollRef = useRef(null);

  const toastTimerRef = useRef(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Mã giảm giá
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [adminCoupons, setAdminCoupons] = useState([]);

  const [isExpanded, setIsExpanded] = useState(false);

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [allMenuItems, setAllMenuItems] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/menu-items`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAllMenuItems(data.data.filter((item) => item.status === "selling"));
        }
      })
      .catch((err) => console.error("Lỗi lấy món ăn gợi ý:", err));
  }, []);

  const filteredSuggestions = (() => {
    let baseItems = allMenuItems.filter(
      (dish) => !cartItems.some((item) => item.id === dish.id),
    );
    let recommended = [];

    let selectedCategory = null;
    if (selectedDish) {
      const fullItem = allMenuItems.find((i) => i.id === selectedDish.id);
      if (fullItem) selectedCategory = fullItem.category;
    }

    if (selectedCategory) {
      recommended = baseItems.filter((item) => item.category === selectedCategory);
    } else if (cartItems.length > 0) {
      const cartCategories = [
        ...new Set(
          cartItems
            .map((cartItem) => {
              const fullItem = allMenuItems.find((i) => i.id === cartItem.id);
              return fullItem ? fullItem.category : null;
            })
            .filter(Boolean),
        ),
      ];
      if (cartCategories.length > 0) {
        recommended = baseItems.filter((item) =>
          cartCategories.includes(item.category),
        );
      }
    }

    if (recommended.length === 0) {
      recommended = baseItems;
    }

    return recommended.slice(0, 4);
  })();

  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
    dishName: "",
    type: "delete",
  });

  useEffect(() => {
    setIsLoggedIn(checkLogin());
  }, []);

  useEffect(() => {
    const savedCoupon = JSON.parse(localStorage.getItem("appliedCoupon"));
    if (!savedCoupon) return;

    const latestCoupon = adminCoupons.find(
      (item) =>
        String(item.code || "").toUpperCase() ===
        String(savedCoupon.code || "").toUpperCase(),
    );

    if (!latestCoupon || latestCoupon.status !== "active") {
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponMessage("Mã ưu đãi hiện không còn hiệu lực.");
      localStorage.removeItem("appliedCoupon");
      localStorage.removeItem("checkoutSummary");
      return;
    }

    setAppliedCoupon(latestCoupon);
    setCouponCode(latestCoupon.code);
  }, [adminCoupons]);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartUpdated"));
  }, [cartItems]);

  function parseMoneyFromText(value) {
    const number = String(value || "").replace(/[^\d]/g, "");
    return Number(number || 0);
  }

  const convertDealToCoupon = (deal) => {
    const discountText = String(deal.discount || "").trim();
    const isPercent = discountText.includes("%");

    return {
      id: deal.id,
      code: deal.code,
      title: deal.name,
      discountType: isPercent ? "percent" : "fixed",
      percent: isPercent ? Number(discountText.replace(/[^\d]/g, "")) : 0,
      amount: isPercent ? 0 : parseMoneyFromText(discountText),
      minOrder: parseMoneyFromText(deal.condition),
      status: deal.status || "active",
      usageLimit: Number(deal.usageLimit || 0),
      used: Number(deal.used || 0),
      serviceTypes:
        deal.serviceTypes && deal.serviceTypes.length > 0
          ? deal.serviceTypes
          : ["delivery", "pickup", "dinein"],
    };
  };

  const loadCoupons = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/deals`);
      const data = await res.json();
      const coupons = (data.deals || []).map(convertDealToCoupon);
      setAdminCoupons(coupons);
      return coupons;
    } catch (error) {
      console.error("Lỗi tải mã ưu đãi:", error);
      setAdminCoupons([]);
      return [];
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const formatPrice = (price) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    const latestCoupons = await loadCoupons();

    const coupon = latestCoupons.find(
      (item) => String(item.code || "").toUpperCase() === code,
    );

    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage("Vui lòng nhập mã ưu đãi.");
      localStorage.removeItem("appliedCoupon");
      return;
    }

    if (!coupon) {
      setAppliedCoupon(null);
      setCouponMessage("Mã ưu đãi không tồn tại hoặc không đúng.");
      localStorage.removeItem("appliedCoupon");
      return;
    }

    if (coupon.status !== "active") {
      setAppliedCoupon(null);
      setCouponMessage("Mã ưu đãi hiện không còn hiệu lực.");
      localStorage.removeItem("appliedCoupon");
      return;
    }

    if (subtotal < coupon.minOrder) {
      setAppliedCoupon(null);
      setCouponMessage(
        `Đơn hàng cần tối thiểu ${formatPrice(coupon.minOrder)} để dùng mã ${coupon.code}.`,
      );
      localStorage.removeItem("appliedCoupon");
      return;
    }

    if (
      coupon.usageLimit &&
      Number(coupon.used || 0) >= Number(coupon.usageLimit)
    ) {
      setAppliedCoupon(null);
      setCouponMessage("Mã ưu đãi đã hết lượt sử dụng.");
      localStorage.removeItem("appliedCoupon");
      return;
    }

    setAppliedCoupon(coupon);
    localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
    setCouponMessage(
      coupon.discountType === "fixed"
        ? `Đã áp dụng mã ${coupon.code} — giảm ${formatPrice(coupon.amount)}.`
        : `Đã áp dụng mã ${coupon.code} — giảm ${coupon.percent}%.`,
    );
  };

  const showToast = (title, message, type = "delete", dishName = "") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({
      show: true,
      title,
      message,
      type,
      dishName,
    });

    toastTimerRef.current = setTimeout(() => {
      setToast({
        show: false,
        title: "",
        message: "",
        type: "delete",
      });
    }, 4000);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  const autoDiscountRule = {
    title: "Hóa đơn trên 2.000.000đ",
    percent: 5,
    minOrder: 2000000,
    serviceTypes: ["dinein"],
  };

  const autoDiscountTotal =
    !appliedCoupon && subtotal >= autoDiscountRule.minOrder
      ? (subtotal * autoDiscountRule.percent) / 100
      : 0;

  const rawCouponDiscountTotal = appliedCoupon
    ? appliedCoupon.discountType === "fixed"
      ? appliedCoupon.amount
      : (subtotal * appliedCoupon.percent) / 100
    : 0;

  const couponDiscountTotal = Math.min(rawCouponDiscountTotal, subtotal);
  const discountTotal = appliedCoupon ? couponDiscountTotal : autoDiscountTotal;
  const total = subtotal - discountTotal;
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const changeQty = (id, type, priceOptionId = null) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && (item.priceOptionId || null) === (priceOptionId || null)
          ? {
              ...item,
              qty:
                type === "increase" ? item.qty + 1 : Math.max(1, item.qty - 1),
            }
          : item,
      ),
    );
  };

  const removeItem = (id, priceOptionId = null) => {
    const removedItem = cartItems.find(
      (item) => item.id === id && (item.priceOptionId || null) === (priceOptionId || null),
    );
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.id === id && (item.priceOptionId || null) === (priceOptionId || null)),
      ),
    );
    showToast(
      "Đã xóa món ăn",
      `Đã xóa "${removedItem?.name || 'món ăn'}" khỏi giỏ hàng`,
      "delete",
    );
  };

  const parsePrice = parseMoneyFromText;

  const previewImages =
    selectedDish?.images?.length > 0
      ? selectedDish.images
      : [selectedDish?.image || ""];

  const fetchDishReviews = async (dishCode) => {
    try {
      setIsLoadingReviews(true);
      const res = await fetch(`${API_BASE_URL}/menu-items/${dishCode}/reviews`);
      const result = await res.json();
      if (result.success) {
        setDishReviews(result.data || []);
      } else {
        setDishReviews([]);
      }
    } catch (error) {
      console.error("Lỗi lấy đánh giá món:", error);
      setDishReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleOpenDishDetail = (item) => {
    const fullDish = allMenuItems.find((d) => d.id === item.id) || item;
    setSelectedDish(fullDish);
    setSelectedImage(fullDish.images?.[0] || fullDish.image || item.image || "");
    setSelectedImageIndex(0);
    setQuantity(item.qty || 1);
    setActiveTab("description");
    fetchDishReviews(fullDish.id || item.id);
  };

  const handleAddToCartFromModal = (dish, qty = 1, event = null, chosenOption = null) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const priceOption = chosenOption || dish.priceOptions?.[0] || null;
    const priceNum = priceOption
      ? Number(priceOption.price)
      : typeof dish.price === "number"
        ? dish.price
        : parseMoneyFromText(dish.price);
    const priceOptionId = priceOption?.id || null;
    const priceOptionNote = priceOption?.note || "";

    const cartDish = {
      id: dish.id,
      name: dish.name,
      desc:
        dish.description ||
        dish.shortDescription ||
        dish.desc ||
        "Món ăn đặc trưng của nhà hàng",
      price: priceNum,
      priceOptionId: priceOptionId,
      priceOptionNote: priceOptionNote,
      qty: qty,
      image: dish.image,
      tag: dish.status === "low" ? "Đặc trưng" : (dish.tag || ""),
    };

    setCartItems((prev) => {
      const existed = prev.find(
        (item) =>
          item.id === cartDish.id &&
          (item.priceOptionId || null) === (cartDish.priceOptionId || null),
      );
      let updatedCart;
      if (existed) {
        updatedCart = prev.map((item) =>
          item.id === cartDish.id &&
          (item.priceOptionId || null) === (cartDish.priceOptionId || null)
            ? { ...item, qty: item.qty + qty }
            : item,
        );
      } else {
        updatedCart = [...prev, cartDish];
      }
      localStorage.setItem("cartItems", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
      return updatedCart;
    });

    showToast(
      "Đã cập nhật giỏ hàng",
      `Đã thêm "${dish.name}${priceOptionNote ? ` (${priceOptionNote})` : ""}" vào giỏ hàng`,
      "success",
      dish.name,
    );
  };

  useEffect(() => {
    if (selectedDish || isImagePreviewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedDish, isImagePreviewOpen]);

  const addSuggestion = (dish) => {
    const priceOption = dish.priceOptions?.[0] || null;
    const priceNum = priceOption
      ? Number(priceOption.price)
      : dish.priceNumber || parsePrice(dish.price);
    const priceOptionId = priceOption?.id || null;
    const priceOptionNote = priceOption?.note || "";

    const cartDish = {
      id: dish.id,
      name: dish.name,
      price: priceNum,
      priceOptionId: priceOptionId,
      priceOptionNote: priceOptionNote,
      image: dish.image,
      qty: 1,
      desc: dish.description || "Món ăn gợi ý dùng kèm trong bữa chính.",
    };

    setCartItems((prev) => {
      const existed = prev.find(
        (item) =>
          item.id === cartDish.id &&
          (item.priceOptionId || null) === (cartDish.priceOptionId || null),
      );
      if (existed) {
        return prev.map((item) =>
          item.id === cartDish.id &&
          (item.priceOptionId || null) === (cartDish.priceOptionId || null)
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }
      return [...prev, cartDish];
    });

    showToast(
      "Đã thêm vào giỏ hàng",
      "đã được thêm vào giỏ hàng",
      "success",
      dish.name,
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-7xl mx-auto px-3.5 sm:px-5 py-6 md:py-8">
        {/* Header & Breadcrumb */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#145c30] tracking-tight">
            Giỏ hàng của bạn
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
            <Link to="/home" className="hover:text-[#145c30] transition">
              Trang chủ
            </Link>
            <span>›</span>
            <span className="text-[#145c30] font-bold">Giỏ hàng ({totalQty} món)</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-6 items-start min-w-0">
          {/* LEFT: CART ITEMS LIST */}
          <section className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-sm p-3.5 sm:p-6 min-w-0 overflow-hidden">
            {/* Table Header (Desktop) */}
            <div className="hidden md:grid grid-cols-[1.8fr_100px_120px_110px_40px] xl:grid-cols-[1.8fr_120px_140px_130px_44px] gap-3 xl:gap-4 pb-3.5 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <span>Món ăn</span>
              <span className="text-right">Đơn giá</span>
              <span className="text-center">Số lượng</span>
              <span className="text-right">Thành tiền</span>
              <span></span>
            </div>

            <div className="divide-y divide-slate-100">
              {cartItems.length === 0 ? (
                <div className="py-12">
                  <AppEmptyState
                    icon={ShoppingCart}
                    title="Chưa có món ăn trong giỏ hàng"
                    description="Hãy khám phá thực đơn đa dạng với các món dê núi tươi ngon từ Hương Sơn để bắt đầu đặt món."
                    actionText="Xem thực đơn ngay"
                    onAction={() => navigate("/menu")}
                  />
                </div>
              ) : (
                <>
                  {(isExpanded ? cartItems : cartItems.slice(0, 5)).map((item) => (
                    <div
                      key={`${item.id}_${item.priceOptionId || 0}`}
                      className="py-4 md:py-5 grid grid-cols-1 md:grid-cols-[1.8fr_100px_120px_110px_40px] xl:grid-cols-[1.8fr_120px_140px_130px_44px] gap-3 xl:gap-4 items-center"
                    >
                      {/* Item Info */}
                      <div className="flex gap-3.5 items-center min-w-0">
                        <button
                          type="button"
                          onClick={() => handleOpenDishDetail(item)}
                          className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                          title={`Xem chi tiết ${item.name}`}
                        >
                          <img
                            src={item.image || "/images/placeholder.jpg"}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/images/placeholder.jpg";
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenDishDetail(item)}
                              className="text-left font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 hover:text-emerald-700 hover:underline transition cursor-pointer focus:outline-none"
                              title={`Xem chi tiết ${item.name}`}
                            >
                              {item.name}
                            </button>
                            {item.tag && (
                              <AppBadge variant="warning" size="sm" pill>
                                {item.tag}
                              </AppBadge>
                            )}
                          </div>

                          {item.priceOptionNote && (
                            <div className="mt-1">
                              <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[11px] font-bold border border-emerald-200/60">
                                Quy cách: {item.priceOptionNote}
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {item.desc || "Món ăn đặc trưng của nhà hàng"}
                          </p>

                          {/* Mobile Price info */}
                          <div className="md:hidden flex items-center justify-between mt-2">
                            <span className="font-extrabold text-amber-700 text-sm">
                              {formatPrice(item.price * item.qty)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatPrice(item.price)} / phần
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Unit Price (Desktop) */}
                      <div className="hidden md:block text-right font-semibold text-slate-700 text-sm">
                        {formatPrice(item.price)}
                      </div>

                      {/* Quantity Control */}
                      <div className="flex items-center justify-between md:justify-center">
                        <div className="h-9 rounded-xl border border-slate-200 flex items-center justify-between px-2 bg-slate-50 w-28">
                          <button
                            type="button"
                            aria-label="Giảm số lượng"
                            onClick={() => changeQty(item.id, "decrease", item.priceOptionId)}
                            className="w-6 h-6 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            aria-label="Số lượng"
                            value={item.qty}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setCartItems((prev) =>
                                prev.map((cartItem) =>
                                  cartItem.id === item.id &&
                                  (cartItem.priceOptionId || null) === (item.priceOptionId || null)
                                    ? {
                                        ...cartItem,
                                        qty: value < 1 ? 1 : value,
                                      }
                                    : cartItem,
                                ),
                              );
                            }}
                            className="w-8 bg-transparent text-center font-bold text-xs sm:text-sm text-slate-900 outline-none"
                          />

                          <button
                            type="button"
                            aria-label="Tăng số lượng"
                            onClick={() => changeQty(item.id, "increase", item.priceOptionId)}
                            className="w-6 h-6 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Mobile Delete Button */}
                        <button
                          type="button"
                          aria-label="Xóa món khỏi giỏ"
                          onClick={() => removeItem(item.id, item.priceOptionId)}
                          className="md:hidden text-slate-400 hover:text-rose-600 p-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Line Total (Desktop) */}
                      <div className="hidden md:block text-right font-extrabold text-amber-700 text-sm sm:text-base">
                        {formatPrice(item.price * item.qty)}
                      </div>

                      {/* Delete Button (Desktop) */}
                      <div className="hidden md:flex justify-end">
                        <button
                          type="button"
                          aria-label="Xóa món khỏi giỏ"
                          onClick={() => removeItem(item.id, item.priceOptionId)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Toggle button to expand/collapse if more than 5 items */}
                  {cartItems.length > 5 && (
                    <div className="pt-4 pb-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100/90 text-[#145c30] text-xs sm:text-sm font-bold border border-emerald-200/80 transition-all duration-200 shadow-xs hover:shadow-sm active:scale-95 group cursor-pointer"
                        aria-expanded={isExpanded}
                      >
                        <span>
                          {isExpanded
                            ? "Thu gọn danh sách món"
                            : `Xem thêm ${cartItems.length - 5} món khác trong giỏ hàng`}
                        </span>
                        <span
                          className={`w-5 h-5 rounded-full bg-emerald-200/70 flex items-center justify-center transition-transform duration-300 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-emerald-900" />
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="flex items-center justify-between pt-5 border-t border-slate-100 mt-2">
                <Link
                  to="/menu"
                  className="text-xs sm:text-sm font-bold text-emerald-700 hover:underline inline-flex items-center gap-1.5"
                >
                  ← Tiếp tục chọn món
                </Link>

                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa tất cả món
                </button>
              </div>
            )}
          </section>

          {/* RIGHT: ORDER SUMMARY */}
          <aside className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 md:p-6 sticky top-24 space-y-5">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide pb-3 border-b border-slate-100">
              Tóm tắt đơn hàng
            </h2>

            {/* Coupon Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                Mã giảm giá / Ưu đãi
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Nhập mã ưu đãi..."
                  className="flex-1 h-10 rounded-xl border border-slate-200 px-3 outline-none text-xs font-semibold bg-white uppercase placeholder:normal-case placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 transition"
                />

                <AppButton
                  variant="primary"
                  size="sm"
                  onClick={applyCoupon}
                  className="font-bold text-xs shrink-0"
                >
                  Áp dụng
                </AppButton>
              </div>

              {couponMessage && (
                <p
                  className={`text-[11px] font-semibold ${
                    appliedCoupon ? "text-emerald-800" : "text-rose-600"
                  }`}
                >
                  {couponMessage}
                </p>
              )}

              {appliedCoupon && (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                    setCouponMessage("");
                    localStorage.removeItem("appliedCoupon");
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-bold"
                >
                  Gỡ mã ưu đãi
                </button>
              )}
            </div>

            {/* Calculation Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Tạm tính ({totalQty} món):</span>
                <strong className="text-slate-900">{formatPrice(subtotal)}</strong>
              </div>

              <div>
                <div className="flex justify-between">
                  <span>Giảm giá:</span>
                  <strong className="text-emerald-800">
                    - {formatPrice(discountTotal)}
                  </strong>
                </div>

                <div className="mt-1.5 space-y-1 pl-2.5 border-l-2 border-slate-200 text-[11px]">
                  {appliedCoupon ? (
                    <div className="flex justify-between text-emerald-800">
                      <span>
                        Mã {appliedCoupon.code} ({appliedCoupon.title})
                      </span>
                      <span>- {formatPrice(couponDiscountTotal)}</span>
                    </div>
                  ) : (
                    subtotal >= 2000000 && (
                      <div className="flex justify-between text-emerald-800">
                        <span>Ăn tại quán (&gt;2.000.000đ giảm 5%)</span>
                        <span>- {formatPrice(autoDiscountTotal)}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Total Standout */}
            <div className="border-t border-slate-200 pt-4 flex items-baseline justify-between">
              <span className="font-extrabold text-sm sm:text-base text-slate-900">
                Tổng thanh toán:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
                {formatPrice(total)}
              </span>
            </div>

            <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              Giá hiển thị đã bao gồm thuế VAT
            </p>

            {/* Checkout CTA */}
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={async () => {
                if (cartItems.length === 0) {
                  setShowEmptyCartAlert(true);
                  return;
                }

                if (!isLoggedIn) {
                  setShowLoginModal(true);
                  return;
                }

                if (appliedCoupon) {
                  const latestCoupons = await loadCoupons();
                  const latestCoupon = latestCoupons.find(
                    (item) =>
                      String(item.code || "").toUpperCase() ===
                      String(appliedCoupon.code || "").toUpperCase(),
                  );

                  if (!latestCoupon || latestCoupon.status !== "active") {
                    setAppliedCoupon(null);
                    setCouponCode("");
                    setCouponMessage("Mã ưu đãi hiện không còn hiệu lực.");
                    localStorage.removeItem("appliedCoupon");
                    localStorage.removeItem("checkoutSummary");
                    return;
                  }

                  if (
                    latestCoupon.usageLimit &&
                    Number(latestCoupon.used || 0) >=
                      Number(latestCoupon.usageLimit)
                  ) {
                    setAppliedCoupon(null);
                    setCouponCode("");
                    setCouponMessage("Mã ưu đãi đã hết lượt sử dụng.");
                    localStorage.removeItem("appliedCoupon");
                    localStorage.removeItem("checkoutSummary");
                    return;
                  }

                  localStorage.setItem(
                    "appliedCoupon",
                    JSON.stringify(latestCoupon),
                  );
                }

                localStorage.setItem(
                  "checkoutSummary",
                  JSON.stringify({
                    subtotal,
                    autoDiscountRule,
                    autoDiscountTotal,
                    couponDiscountTotal,
                    discountTotal,
                    total,
                    appliedCoupon,
                    couponStatus: appliedCoupon?.status,
                  }),
                );

                navigate("/checkout");
              }}
              className={`w-full h-13 py-3.5 rounded-2xl font-extrabold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                cartItems.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 active:scale-95"
              }`}
            >
              Tiến hành thanh toán
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Auto Discount Progress Box */}
            {!appliedCoupon && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs">
                <div className="flex gap-2.5 items-start">
                  <Gift className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-bold text-amber-950">
                      Ưu đãi hóa đơn lớn
                    </h3>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Hóa đơn từ <strong>2.000.000đ</strong> khi ăn tại quán sẽ được giảm <strong>5%</strong>.
                    </p>

                    <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-emerald-800 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((subtotal / 2000000) * 100, 100)}%`,
                        }}
                      />
                    </div>

                    {subtotal >= 2000000 ? (
                      <p className="text-[11px] text-emerald-800 font-bold mt-1">
                        ✓ Đơn hàng của bạn đã đủ điều kiện nhận ưu đãi 5%
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-800 font-medium mt-1">
                        Cần thêm <strong>{formatPrice(2000000 - subtotal)}</strong> để nhận ưu đãi
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* SUGGESTION ITEMS */}
        {filteredSuggestions.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                Gợi ý món ăn kèm hấp dẫn
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredSuggestions.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm hover:shadow transition"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenDishDetail(dish)}
                    className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 cursor-pointer group"
                    title={`Xem chi tiết ${dish.name}`}
                  >
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleOpenDishDetail(dish)}
                      className="text-left font-bold text-slate-900 text-xs truncate block w-full hover:text-emerald-700 hover:underline transition cursor-pointer"
                      title={`Xem chi tiết ${dish.name}`}
                    >
                      {dish.name}
                    </button>
                    <p className="font-extrabold text-amber-700 text-xs mt-0.5">
                      {formatPrice(dish.priceNumber || parsePrice(dish.price))}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Thêm ${dish.name}`}
                    onClick={() =>
                      addSuggestion({
                        id: dish.id,
                        name: dish.name,
                        price: dish.priceNumber || parsePrice(dish.price),
                        image: dish.image,
                      })
                    }
                    className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <AppModal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          title="Xác nhận xóa giỏ hàng"
          size="sm"
        >
          <p className="text-slate-600 text-xs sm:text-sm">
            Bạn có chắc chắn muốn xóa toàn bộ món ăn đang có trong giỏ hàng không?
          </p>
          <div className="flex justify-end gap-2.5 mt-5">
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
            >
              Hủy
            </AppButton>
            <AppButton
              variant="danger"
              size="sm"
              onClick={() => {
                setCartItems([]);
                setShowClearConfirm(false);
                showToast("Đã xóa toàn bộ giỏ hàng", "", "delete");
              }}
            >
              Xóa tất cả
            </AppButton>
          </div>
        </AppModal>
      )}

      {/* Modals & Login Required */}
      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/login")}
        />
      )}

      {/* QUICK VIEW MODAL */}
      <DishDetailModal
        selectedDish={selectedDish}
        setSelectedDish={setSelectedDish}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        quantity={quantity}
        setQuantity={setQuantity}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoadingReviews={isLoadingReviews}
        dishReviews={dishReviews}
        isLoggedIn={isLoggedIn}
        setShowLoginModal={setShowLoginModal}
        addToCart={handleAddToCartFromModal}
        navigate={navigate}
        modalScrollRef={modalScrollRef}
        previewImages={previewImages}
        setSelectedImageIndex={setSelectedImageIndex}
        fetchDishReviews={fetchDishReviews}
        setIsImagePreviewOpen={setIsImagePreviewOpen}
        dishes={allMenuItems}
      />

      {/* Image Preview Overlay */}
      {isImagePreviewOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng ảnh xem trước"
            onClick={() => setIsImagePreviewOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 z-10 cursor-pointer"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage || selectedDish?.image}
            alt="Preview"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

export default CartPage;
