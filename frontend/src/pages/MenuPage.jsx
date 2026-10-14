import { checkLogin } from "../utils/auth";
import { useEffect, useRef, useState, useMemo } from "react";
import GlobalPagination from "../components/admin/GlobalPagination";
import { useNavigate, useSearchParams } from "react-router-dom";
import RatingStars from "../components/RatingStars";
import { removeVietnameseTones, calculateSearchScore } from "../utils/string";

import { ICON_MAP } from "../data/menuCategories";
import DishCard from "../components/DishCard";
import LoginRequiredModal from "../components/LoginRequiredModal";
import DishDetailModal from "../components/DishDetailModal";
import AppSkeleton from "../components/ui/AppSkeleton";
import AppEmptyState from "../components/ui/AppEmptyState";
import AppBadge from "../components/ui/AppBadge";

import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Leaf,
  X,
  ShieldCheck,
  Truck,
  ShoppingCart,
  Utensils,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

import goatIcon from "../assets/images/Icon_De.png";
import bannermenu from "../assets/images/menu/banner-menu.jpg";
import { API_BASE_URL } from "../config/api";
const API_URL = `${API_BASE_URL}/menu-items`;

function MenuPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const [qrTableCode, setQrTableCode] = useState(() => localStorage.getItem("qrTableCode") || "");

  useEffect(() => {
    if (tableParam) {
      localStorage.setItem("qrTableCode", tableParam);
      setQrTableCode(tableParam);
      // Force serviceType = dinein
      const savedForm = JSON.parse(localStorage.getItem("checkoutForm")) || {};
      localStorage.setItem("checkoutForm", JSON.stringify({ ...savedForm, serviceType: "dinein" }));
    }
  }, [tableParam]);

  const [selectedCategory, setSelectedCategory] = useState("Tất cả món");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("category");
  const [dishes, setDishes] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openCategory, setOpenCategory] = useState("");
  const [selectedDish, setSelectedDish] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImage, setSelectedImage] = useState("");
  const modalScrollRef = useRef(null);
  const dishesContainerRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (dishesContainerRef.current) {
      const elementPosition = dishesContainerRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 100;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }, [selectedCategory]);

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [dishReviews, setDishReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, sortType]);

  const previewImages =
    selectedDish?.images?.length > 0
      ? selectedDish.images
      : [selectedDish?.image];
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Hàm lấy món từ backend
  const fetchMenuItems = async () => {
    try {
      setIsLoadingMenu(true);
      setMenuError("");

      const res = await fetch(API_URL);
      const result = await res.json();

      if (!result.success) {
        setMenuError(result.message || "Không thể tải danh sách món ăn.");
        setDishes([]);
        return;
      }

      setDishes(result.data || []);
    } catch (error) {
      console.error("Lỗi tải menu:", error);
      setMenuError("Không thể kết nối backend.");
      setDishes([]);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (selectedDish) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedDish]);

  // Kiểm tra đăng nhập
  useEffect(() => {
    setIsLoggedIn(checkLogin());
  }, []);

  // Hàm chuyển giá từ string sang number để tính tổng tiền
  const parsePrice = (price) => {
    if (typeof price === "number") return price;
    return Number(String(price || "").replace(/[^\d]/g, ""));
  };

  // Toast thông báo thêm món
  const showToast = (dishName) => {
    setToast({ dishName });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const totalCartQty = cartItems.reduce((sum, item) => sum + item.qty, 0);

  // Hàm thêm món vào giỏ hàng
  const addToCart = (dish, qty = 1, event = null, chosenOption = null) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const priceOption = chosenOption || dish.priceOptions?.[0] || null;
    const finalPrice = priceOption
      ? Number(priceOption.price)
      : typeof dish.price === "number"
        ? dish.price
        : parsePrice(dish.price);
    const priceOptionId = priceOption?.id || null;
    const priceOptionNote = priceOption?.note || "";

    const cartDish = {
      id: dish.id,
      name: dish.name,
      desc: dish.description || dish.shortDescription || "",
      price: finalPrice,
      priceOptionId: priceOptionId,
      priceOptionNote: priceOptionNote,
      qty: qty,
      image: dish.image,
      tag: dish.status === "low" ? "Đặc trưng" : "",
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

    showToast(dish.name + (priceOptionNote ? ` (${priceOptionNote})` : ""));
  };

  // Map mỗi danh mục cha tới danh sách tên danh mục con của nó
  const parentCategoryMap = useMemo(() => {
    const map = {};
    (categories || []).forEach((root) => {
      const childNames = (root.children || []).map((ch) => ch.name);
      map[root.name] = [root.name, ...childNames];
    });
    return map;
  }, [categories]);

  // Tự động mở danh mục cha nếu đang chọn danh mục con
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const parentCat = categories.find((cat) =>
        cat.children?.some((c) => c.name === selectedCategory)
      );
      if (parentCat) {
        setOpenCategory(parentCat.name);
      }
    }
  }, [selectedCategory, categories]);

  const rawKeyword = String(searchTerm || "").trim();

  const filteredDishes = dishes
    .map((dish) => {
      let matchCategory = selectedCategory === "Tất cả món";
      if (!matchCategory) {
        const allowedCategories = parentCategoryMap[selectedCategory] || [selectedCategory];
        matchCategory =
          allowedCategories.includes(dish.category) ||
          allowedCategories.includes(dish.parentCategory) ||
          allowedCategories.includes(dish.subCategory) ||
          dish.category === selectedCategory ||
          dish.parentCategory === selectedCategory ||
          dish.subCategory === selectedCategory;
      }

      const searchScore = rawKeyword ? calculateSearchScore(dish, rawKeyword) : 1;

      return { dish, matchCategory, searchScore };
    })
    .filter(({ matchCategory, searchScore }) => matchCategory && searchScore > 0);

  // Danh sách khi sắp xếp (Ưu tiên điểm tìm kiếm nếu đang gõ từ khóa)
  const displayedDishes = filteredDishes
    .sort((a, b) => {
      // 1. Nếu có từ khóa tìm kiếm: Món có độ trùng khớp tên cao hơn sẽ luôn đứng trước
      if (rawKeyword && a.searchScore !== b.searchScore) {
        return b.searchScore - a.searchScore;
      }

      const dishA = a.dish;
      const dishB = b.dish;

      const priceA = dishA.priceNumber || parsePrice(dishA.price);
      const priceB = dishB.priceNumber || parsePrice(dishB.price);

      const idA = Number(String(dishA.id || "").replace(/\D/g, "")) || 0;
      const idB = Number(String(dishB.id || "").replace(/\D/g, "")) || 0;

      if (sortType === "category") {
        const parentOrderA = dishA.parentDisplayOrder ?? 999;
        const parentOrderB = dishB.parentDisplayOrder ?? 999;
        if (parentOrderA !== parentOrderB) return parentOrderA - parentOrderB;

        const catOrderA = dishA.categoryDisplayOrder ?? 999;
        const catOrderB = dishB.categoryDisplayOrder ?? 999;
        if (catOrderA !== catOrderB) return catOrderA - catOrderB;

        return (dishA.dbId || idA) - (dishB.dbId || idB);
      }

      if (sortType === "newest") {
        return idB - idA;
      }

      if (sortType === "price-asc") {
        return priceA - priceB;
      }

      if (sortType === "price-desc") {
        return priceB - priceA;
      }

      if (sortType === "name-asc") {
        return String(dishA.name || "").localeCompare(String(dishB.name || ""), "vi");
      }

      if (sortType === "name-desc") {
        return String(dishB.name || "").localeCompare(String(dishA.name || ""), "vi");
      }

      return 0;
    })
    .map((item) => item.dish);

  const paginatedDishes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedDishes.slice(start, start + pageSize);
  }, [displayedDishes, currentPage, pageSize]);

  // Hàm lấy review
  const fetchDishReviews = async (dishCode) => {
    try {
      setIsLoadingReviews(true);

      const res = await fetch(`${API_URL}/${dishCode}/reviews`);
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

  // Mở chi tiết món ăn
  const handleOpenDishDetail = (dish) => {
    setSelectedDish(dish);
    setSelectedImage(dish.image);
    setQuantity(1);
    setSelectedImageIndex(0);
    setActiveTab("description");
    fetchDishReviews(dish.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Toast thông báo */}
      {toast && (
        <div className="fixed top-20 right-5 z-[9999]">
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3 w-[340px] max-w-[calc(100vw-32px)] animate-[slideIn_.25s_ease-out]">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-800">
              <ShoppingCart className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm">
                Đã thêm vào giỏ hàng
              </p>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                <span className="font-bold text-amber-700">
                  "{toast.dishName}"
                </span>{" "}
                đã được thêm vào giỏ.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BANNER */}
      <section
        className="relative py-8 md:py-12 overflow-hidden bg-center bg-no-repeat bg-cover xl:bg-[length:100%_auto] after:absolute after:bottom-0 after:left-0 after:w-full after:h-20 after:bg-gradient-to-b after:from-transparent after:to-slate-50 after:pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(
              to right,
              rgba(248,250,252,0.92) 0%,
              rgba(248,250,252,0.30) 25%,
              rgba(0,0,0,0) 45%,
              rgba(0,0,0,0) 55%,
              rgba(248,250,252,0.30) 75%,
              rgba(248,250,252,0.92) 100%
            ),
            url(${bannermenu})
          `,
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center md:text-left max-w-3xl">
            <p
              className="text-4xl md:text-5xl text-amber-600 mb-1"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              Menu
            </p>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#145c30] leading-tight tracking-tight font-extrabold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Thực đơn đặc sắc
            </h1>

            <p
              className="mt-1 text-lg sm:text-xl md:text-2xl lg:text-3xl text-amber-700 opacity-90 max-w-5xl leading-snug tracking-wide"
              style={{ fontFamily: "'Allura', cursive" }}
            >
              Tinh hoa ẩm thực từ dê núi Hương Sơn
            </p>

            <p className="mt-2 text-slate-700 max-w-lg text-xs md:text-sm leading-relaxed">
              Những món ăn được chế biến từ dê núi tươi ngon mỗi ngày,
              đậm đà hương vị truyền thống đặc trưng của vùng đất Hà Tĩnh.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="w-full max-w-[1800px] mx-auto px-4 md:px-6 2xl:px-10 py-6 md:py-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:block bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sticky top-24 self-start w-full">
            <h2 className="font-extrabold text-base tracking-tight mb-3 text-slate-900 px-2 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-800" />
              Danh mục món
            </h2>

            <div className="space-y-1 max-h-[calc(100vh-190px)] overflow-y-auto pr-1 custom-scrollbar">
              {categories.map((category) => {
                const isSelected = selectedCategory === category.name;
                const hasChildren = category.children && category.children.length > 0;
                const isParentOfSelected = hasChildren && category.children.some((c) => c.name === selectedCategory);
                const isOpen = openCategory === category.name;
                const Icon = ICON_MAP[category.icon] || Utensils;

                return (
                  <div key={category.name}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.name);
                        if (hasChildren) {
                          setOpenCategory(category.name);
                        }
                        setCurrentPage(1);
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition text-sm ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : isParentOfSelected
                          ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/70"
                          : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0 opacity-80" />
                        <span className="truncate">{category.name}</span>
                      </div>

                      {hasChildren && (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCategory(isOpen ? "" : category.name);
                          }}
                          className="p-1 rounded-lg hover:bg-black/10 transition"
                          title={isOpen ? "Thu gọn" : "Mở rộng"}
                        >
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 opacity-75 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 opacity-75 shrink-0" />
                          )}
                        </div>
                      )}
                    </button>

                    {/* Submenu */}
                    {hasChildren && isOpen && (
                      <div className="ml-5 my-1 space-y-1 border-l-2 border-emerald-200 pl-3">
                        {category.children.map((child) => {
                          const isChildSelected = selectedCategory === child.name;
                          const ChildIcon = ICON_MAP[child.icon] || Utensils;

                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(child.name);
                                setCurrentPage(1);
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition text-left ${
                                isChildSelected
                                  ? "text-emerald-900 font-bold bg-emerald-100/80 shadow-xs border border-emerald-200"
                                  : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50 font-medium"
                              }`}
                            >
                              <ChildIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              <span className="truncate">{child.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* MAIN COLUMN */}
          <main ref={dishesContainerRef} className="w-full min-w-0">
            {/* Table Serving Banner */}
            {qrTableCode && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 md:px-5 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 mb-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="font-semibold text-xs sm:text-sm">
                    Đang xem thực đơn & gọi món tại Bàn:{" "}
                    <span className="text-emerald-700 font-extrabold text-sm sm:text-base">
                      {qrTableCode}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("qrTableCode");
                    setQrTableCode("");
                    const savedForm = JSON.parse(localStorage.getItem("checkoutForm")) || {};
                    delete savedForm.serviceType;
                    localStorage.setItem("checkoutForm", JSON.stringify(savedForm));
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 bg-white rounded-xl border border-rose-200 shadow-sm"
                >
                  Thoát chế độ bàn
                </button>
              </div>
            )}

            {/* TOP BAR: Header, Search & Sort */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-sm p-4 md:p-5 mb-6">
              <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {(() => {
                      const parentCat = categories.find((item) =>
                        item.children?.some((c) => c.name === selectedCategory)
                      );
                      if (parentCat) {
                        return `${parentCat.name} › ${selectedCategory}`;
                      }
                      return selectedCategory;
                    })()}
                  </h2>
                  <p className="text-slate-500 mt-0.5 text-xs sm:text-sm">
                    Chọn món yêu thích và thêm vào giỏ hàng.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  {/* Search Bar */}
                  <div className="h-10 sm:h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 flex items-center gap-2.5 focus-within:border-emerald-800 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-800/10 transition">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm món ăn..."
                      className="bg-transparent outline-none text-xs sm:text-sm w-full text-slate-800 placeholder:text-slate-400 font-medium"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        aria-label="Xóa tìm kiếm"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="h-10 sm:h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={sortType}
                      onChange={(e) => setSortType(e.target.value)}
                      aria-label="Sắp xếp món ăn"
                      className="bg-transparent outline-none cursor-pointer text-slate-800 font-medium pr-2"
                    >
                      <option value="category">Theo danh mục</option>
                      <option value="newest">Món mới nhất</option>
                      <option value="price-asc">Giá tăng dần</option>
                      <option value="price-desc">Giá giảm dần</option>
                      <option value="name-asc">Tên A-Z</option>
                      <option value="name-desc">Tên Z-A</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE CATEGORY SCROLLER */}
            <div className="lg:hidden mb-5 space-y-2.5">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((category) => {
                  const isSelected = selectedCategory === category.name;
                  const hasChildren = category.children && category.children.length > 0;
                  const isParentOfSelected = hasChildren && category.children.some((c) => c.name === selectedCategory);
                  const Icon = ICON_MAP[category.icon] || UtensilsCrossed;

                  return (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.name);
                        if (hasChildren) {
                          setOpenCategory(openCategory === category.name ? "" : category.name);
                        } else {
                          setOpenCategory("");
                        }
                        setCurrentPage(1);
                      }}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : isParentOfSelected
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold"
                          : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span>{category.name}</span>
                      {hasChildren && (
                        openCategory === category.name ? (
                          <ChevronUp className="w-3 h-3 opacity-70" />
                        ) : (
                          <ChevronDown className="w-3 h-3 opacity-70" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Subcategory for open parent */}
              {openCategory && categories.find((c) => c.name === openCategory)?.children?.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-slate-50/80 p-1.5 rounded-xl border border-slate-200/60">
                  {categories
                    .find((item) => item.name === openCategory)
                    ?.children.map((child) => {
                      const isChildSelected = selectedCategory === child.name;
                      const ChildIcon = ICON_MAP[child.icon] || UtensilsCrossed;

                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(child.name);
                            setCurrentPage(1);
                          }}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                            isChildSelected
                              ? "bg-emerald-700 text-white shadow-sm font-bold"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <ChildIcon className="w-3 h-3 shrink-0 opacity-80" />
                          <span>{child.name}</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* DISH GRID */}
            {isLoadingMenu ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
                    <AppSkeleton height={140} rounded="xl" />
                    <AppSkeleton height={18} width="75%" />
                    <AppSkeleton height={14} width="95%" />
                    <div className="flex items-center justify-between pt-2">
                      <AppSkeleton height={20} width="40%" />
                      <AppSkeleton height={36} width={36} rounded="xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : menuError ? (
              <div className="min-h-[380px] bg-white rounded-3xl border border-rose-200 shadow-sm flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-rose-700">
                  Không thể tải thực đơn
                </h3>
                <p className="text-slate-500 text-sm mt-1 max-w-md">{menuError}</p>
                <button
                  type="button"
                  onClick={fetchMenuItems}
                  className="mt-5 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
                >
                  Thử lại
                </button>
              </div>
            ) : displayedDishes.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 md:p-12">
                <AppEmptyState
                  title={
                    searchTerm
                      ? "Không tìm thấy món ăn"
                      : "Chưa có món trong danh mục này"
                  }
                  description={
                    searchTerm
                      ? `Không có kết quả nào phù hợp với từ khóa "${searchTerm}". Vui lòng thử từ khóa khác.`
                      : `Hiện tại nhà hàng chưa cập nhật món ăn cho mục "${selectedCategory}".`
                  }
                  icon={Utensils}
                  actionText="Xem tất cả món"
                  onAction={() => {
                    setSearchTerm("");
                    setSelectedCategory("Tất cả món");
                  }}
                />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
                  {paginatedDishes.map((dish) => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      onOpenDetail={handleOpenDishDetail}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 pt-5 border-t border-slate-200">
                  <GlobalPagination
                    total={displayedDishes.length}
                    page={currentPage}
                    limit={pageSize}
                    onPageChange={setCurrentPage}
                    onLimitChange={setPageSize}
                    limitOptions={[50, 100, 150, 200]}
                    activeColor="emerald"
                  />
                </div>
              </div>
            )}

            {/* CTA ĐẶT BÀN */}
            <div className="hidden md:flex mt-10 bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-3xl p-6 md:p-8 flex-col md:flex-row gap-5 items-center justify-between text-center md:text-left overflow-hidden shadow-md">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-amber-400 uppercase tracking-tight">
                  Đặt bàn ngay hôm nay
                </h2>
                <p className="text-slate-100 text-sm mt-1 font-medium">
                  Thưởng thức những món ngon từ dê núi Hương Sơn cùng gia đình & bạn bè.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    setShowLoginModal(true);
                    return;
                  }
                  navigate("/booking");
                }}
                className="shrink-0 px-7 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold rounded-2xl shadow hover:shadow-lg transition-all text-sm uppercase tracking-wide hover:scale-105 active:scale-95"
              >
                Đặt bàn ngay
              </button>
            </div>
          </main>
        </div>
      </section>

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
        addToCart={addToCart}
        navigate={navigate}
        modalScrollRef={modalScrollRef}
        previewImages={previewImages}
        setSelectedImageIndex={setSelectedImageIndex}
        fetchDishReviews={fetchDishReviews}
        setIsImagePreviewOpen={setIsImagePreviewOpen}
        dishes={dishes}
      />

      {/* Image Preview Overlay */}
      {isImagePreviewOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center">
          <button
            type="button"
            aria-label="Đóng xem ảnh"
            onClick={() => setIsImagePreviewOpen(false)}
            className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={() => {
              const newIndex =
                selectedImageIndex === 0
                  ? previewImages.length - 1
                  : selectedImageIndex - 1;
              setSelectedImageIndex(newIndex);
              setSelectedImage(previewImages[newIndex]);
            }}
            className="absolute left-4 md:left-8 z-20 w-11 h-11 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center text-lg transition"
          >
            ❮
          </button>

          <img
            src={selectedImage}
            alt=""
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl"
          />

          <button
            type="button"
            aria-label="Ảnh kế tiếp"
            onClick={() => {
              const newIndex =
                selectedImageIndex === previewImages.length - 1
                  ? 0
                  : selectedImageIndex + 1;
              setSelectedImageIndex(newIndex);
              setSelectedImage(previewImages[newIndex]);
            }}
            className="absolute right-4 md:right-8 z-20 w-11 h-11 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center text-lg transition"
          >
            ❯
          </button>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/login")}
        />
      )}
    </div>
  );
}

export default MenuPage;
