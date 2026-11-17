import { checkLogin } from "../utils/auth";
import { useEffect, useRef, useState, useMemo } from "react";
import GlobalPagination from "../components/admin/GlobalPagination";
import { useNavigate, useSearchParams } from "react-router-dom";
import RatingStars from "../components/RatingStars";
import { removeVietnameseTones, calculateSearchScore } from "../utils/string";
import { flyToCartAnimation } from "../utils/cartAnimation";
import SEO from "../components/common/SEO";

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
  Check,
  ShieldCheck,
  Truck,
  ShoppingCart,
  Utensils,
  UtensilsCrossed,
  RefreshCw,
  RotateCw,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

import goatIcon from "../assets/images/Icon_De.png";
import bannermenu from "../assets/images/Menu/banner-menu.jpg";
import { API_BASE_URL } from "../config/api";
const API_URL = `${API_BASE_URL}/menu-items`;

const SORT_OPTIONS = [
  { value: "category", label: "Theo danh mục" },
  { value: "newest", label: "Món mới nhất" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
  { value: "name-asc", label: "Tên A-Z" },
  { value: "name-desc", label: "Tên Z-A" },
];

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
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);
  const searchCardRef = useRef(null);
  const mobileCategoryBarRef = useRef(null);
  const mobileCategoryScrollRef = useRef(null);
  const mobileSubCategoryScrollRef = useRef(null);
  const dishesGridRef = useRef(null);
  const modalScrollRef = useRef(null);
  const dishesContainerRef = useRef(null);

  // Đảm bảo luôn bắt đầu ở đỉnh trang khi người dùng truy cập từ trang khác
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, []);

  // Đóng dropdown sắp xếp khi click ra ngoài hoặc khi người dùng lướt/cuộn màn hình
  useEffect(() => {
    if (!isSortOpen) return;

    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };

    const handleScrollOrSwipe = (event) => {
      // Nếu lướt màn hình ở bên ngoài menu dropdown -> tự động đóng ngay lập tức
      if (!sortRef.current || !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    window.addEventListener("scroll", handleScrollOrSwipe, { passive: true, capture: true });
    window.addEventListener("touchmove", handleScrollOrSwipe, { passive: true });
    window.addEventListener("wheel", handleScrollOrSwipe, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrSwipe, { capture: true });
      window.removeEventListener("touchmove", handleScrollOrSwipe);
      window.removeEventListener("wheel", handleScrollOrSwipe);
    };
  }, [isSortOpen]);

  // Cuộn trang mượt mà đưa danh sách món về món đầu tiên ngay dưới thanh danh mục (ảnh 3)
  const scrollToCategoryContent = () => {
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
      if (!dishesGridRef.current || !mobileCategoryBarRef.current) return;

      const headerHeight = 64;
      const categoryBarHeight = mobileCategoryBarRef.current.offsetHeight || 52;
      const idealGridTop = headerHeight + categoryBarHeight + 8;

      const currentGridRect = dishesGridRef.current.getBoundingClientRect();
      const categoryBarRect = mobileCategoryBarRef.current.getBoundingClientRect();

      // Case 1: Nếu người dùng đang ở đỉnh trang (thanh danh mục chưa chạm header)
      // Giữ nguyên vị trí ở đầu trang để người dùng thoải mái nhìn khung tìm kiếm & banner
      if (categoryBarRect.top > headerHeight + 10) {
        return;
      }

      // Case 2: Nếu thanh danh mục đã dính sticky ở header và danh sách món ĐÃ ở ngay trên cùng
      // Thì KHÔNG cuộn dọc nữa để tránh giật nhảy màn hình khi bấm chuyển danh mục liên tục
      const currentGap = currentGridRect.top - idealGridTop;
      if (Math.abs(currentGap) < 25) {
        return;
      }

      // Case 3: Nếu người dùng đã cuộn xuống sâu bên dưới các món ăn, cuộn nhẹ nhàng đưa món đầu tiên về ngay dưới thanh danh mục
      const targetScrollY = window.pageYOffset + currentGridRect.top - idealGridTop;
      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: "smooth",
      });
      return;
    }

    // Trên Desktop (>= 1024px):
    if (searchCardRef.current) {
      const headerHeight = 80;
      const targetY = searchCardRef.current.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      if (window.scrollY > targetY + 60) {
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: "smooth",
        });
      }
    }
  };

  // Hàm cuộn ngang mượt mà có gia tốc êm ái (easeInOutCubic), bắt đầu êm dịu không bị giật, hãm đà nhẹ nhàng
  const smoothScrollHorizontal = (containerEl, targetLeft, duration = 750) => {
    if (!containerEl) return;
    const startLeft = containerEl.scrollLeft;
    const distance = targetLeft - startLeft;
    if (Math.abs(distance) < 1) return;

    if (containerEl._scrollAnimId) {
      cancelAnimationFrame(containerEl._scrollAnimId);
    }

    const startTime = performance.now();
    // Đường cong easeInOutCubic: bắt đầu êm ái (v=0), lướt mượt ở giữa, dừng nhẹ nhàng về đích
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      containerEl.scrollLeft = startLeft + distance * easedProgress;

      if (progress < 1) {
        containerEl._scrollAnimId = requestAnimationFrame(step);
      } else {
        containerEl._scrollAnimId = null;
      }
    };

    containerEl._scrollAnimId = requestAnimationFrame(step);
  };

  const centerButtonInContainer = (containerEl, targetBtn, delay = 0) => {
    if (!containerEl) return;

    if (containerEl._centerTimer) {
      clearTimeout(containerEl._centerTimer);
      containerEl._centerTimer = null;
    }

    const performCenter = () => {
      const btn = targetBtn || containerEl.querySelector('[data-selected="true"]');
      if (!btn) return;

      const containerRect = containerEl.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const targetLeft =
        containerEl.scrollLeft +
        (btnRect.left - containerRect.left) -
        containerEl.clientWidth / 2 +
        btnRect.width / 2;

      smoothScrollHorizontal(containerEl, Math.max(0, targetLeft), 750);
    };

    if (delay > 0) {
      containerEl._centerTimer = setTimeout(performCenter, delay);
    } else {
      performCenter();
    }
  };

  const handleSelectCategory = (categoryName, hasChildren, event) => {
    // Bước 1: Màu sắc chuyển qua nút chọn mới hoàn toàn
    setSelectedCategory(categoryName);
    if (hasChildren) {
      setOpenCategory((prev) => (prev === categoryName ? "" : categoryName));
    } else {
      setOpenCategory("");
    }
    setCurrentPage(1);

    // Bước 2: Để màu sắc hoàn tất hoàn toàn (320ms), sau đó mới di chuyển thanh ngang về giữa kéo dài 750ms
    const targetBtn = event?.currentTarget;
    if (mobileCategoryScrollRef.current) {
      centerButtonInContainer(mobileCategoryScrollRef.current, targetBtn, 320);
    }

    requestAnimationFrame(() => {
      scrollToCategoryContent();
    });
  };

  const handleSelectSubCategory = (subCategoryName, event) => {
    // Bước 1: Màu sắc chuyển qua nút con chọn mới hoàn toàn
    setSelectedCategory(subCategoryName);
    setCurrentPage(1);

    // Bước 2: Để màu sắc hoàn tất hoàn toàn (320ms), sau đó mới di chuyển thanh ngang về giữa kéo dài 750ms
    const targetBtn = event?.currentTarget;
    if (mobileSubCategoryScrollRef.current) {
      centerButtonInContainer(mobileSubCategoryScrollRef.current, targetBtn, 320);
    }

    requestAnimationFrame(() => {
      scrollToCategoryContent();
    });
  };

  // Tự động căn giữa mục đang chọn khi thay đổi danh mục từ bên ngoài (desktop, URL...)
  useEffect(() => {
    centerButtonInContainer(mobileCategoryScrollRef.current, null, 320);
    centerButtonInContainer(mobileSubCategoryScrollRef.current, null, 320);
  }, [selectedCategory, openCategory]);

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
        const friendlyMessage =
          result.message && !result.message.toLowerCase().includes("lỗi server")
            ? result.message
            : "Hệ thống đang gặp gián đoạn tạm thời khi kết nối thực đơn. Quý khách vui lòng thử tải lại.";
        setMenuError(friendlyMessage);
        setDishes([]);
        return;
      }

      setDishes(result.data || []);
    } catch (error) {
      console.error("Lỗi tải menu:", error);
      setMenuError("Không thể kết nối đến máy chủ. Quý khách vui lòng kiểm tra kết nối mạng và thử lại.");
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

    // Hàm cập nhật giỏ hàng và hiển thị thông báo
    const commitAddToCart = () => {
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

    // Hiệu ứng bay vào giỏ hàng: chỉ khi icon chạm vào giỏ hàng thì mới tăng số lượng và hiện thông báo
    flyToCartAnimation(event, dish.image, commitAddToCart);
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



      {/* SEO Metadata */}
      <SEO
        title="Thực Đơn Dê Núi Hương Sơn | Đặc Sản Tươi Ngon Tại Hà Nội"
        description="Khám phá thực đơn đặc sản dê núi Hương Sơn tại Hà Nội: Dê nướng tảng, Lẩu dê, Dê hấp tía tô, Dê xào lăn tươi ngon mỗi ngày. Đặt món online nhanh chóng."
        canonical="/menu"
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
              name: "Thực đơn",
              item: "https://dehuongson.vercel.app/menu",
            },
          ],
        }}
      />

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
          {/* DESKTOP SIDEBAR (CỐ ĐỊNH ĐỨNG YÊN KHI CUỘN XUỐNG DƯỚI) */}
          <aside className="hidden lg:flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sticky top-20 self-start w-full max-h-[calc(100vh-100px)]">
            <h2 className="font-extrabold text-base tracking-tight mb-3 text-slate-900 px-2 flex items-center gap-2 shrink-0">
              <Utensils className="w-4 h-4 text-emerald-800" />
              Danh mục món
            </h2>

            <div className="space-y-1 overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-0">
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
                      data-selected={isSelected}
                      onClick={() => handleSelectCategory(category.name, hasChildren)}
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
                              data-selected={isChildSelected}
                              onClick={() => handleSelectSubCategory(child.name)}
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

            {/* TOP BAR: Header, Search & Sort (Tối ưu gọn gàng trên mobile & tablet, neo đỉnh chuẩn xác khi chọn danh mục) */}
            <div
              ref={searchCardRef}
              className="scroll-mt-[70px] md:scroll-mt-[80px] bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-2xs p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 md:mb-6"
            >
              <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:gap-4 md:items-center md:justify-between">
                <div>
                  <h2 className="text-base sm:text-lg md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
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
                  <p className="text-slate-500 mt-0.5 text-[11px] sm:text-xs md:text-sm">
                    Chọn món yêu thích và thêm vào giỏ hàng.
                  </p>
                </div>

                {/* Search & Sort gộp thành 1 hàng trên Mobile & Tablet */}
                <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                  {/* Search Bar */}
                  <div className="flex-1 min-w-0 h-9 sm:h-10 md:h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 flex items-center gap-2 focus-within:border-emerald-800 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-800/10 transition">
                    <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm món ăn..."
                      className="bg-transparent outline-none text-xs sm:text-sm w-full min-w-0 text-slate-800 placeholder:text-slate-400 font-medium"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        aria-label="Xóa tìm kiếm"
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Custom Sort Dropdown (Neo cố định góc phải absolute right-0, đảm bảo không bao giờ bị tràn màn hình) */}
                  <div ref={sortRef} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSortOpen((prev) => !prev)}
                      aria-label="Sắp xếp món ăn"
                      aria-expanded={isSortOpen}
                      className="h-9 sm:h-10 md:h-11 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl px-2.5 sm:px-3 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="max-w-[105px] sm:max-w-none truncate">
                        {SORT_OPTIONS.find((o) => o.value === sortType)?.label || "Sắp xếp"}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isSortOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu (Luôn mở vào phía trong màn hình nhờ right-0) */}
                    {isSortOpen && (
                      <div className="absolute right-0 top-full mt-1.5 z-50 w-44 sm:w-48 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 animate-[scaleIn_0.15s_ease-out]">
                        <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                            Sắp xếp món ăn
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {SORT_OPTIONS.map((opt) => {
                            const isSelected = sortType === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setSortType(opt.value);
                                  setIsSortOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-left transition cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-50 text-emerald-800 font-black"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <span>{opt.label}</span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE / TABLET CATEGORY SCROLLER (STICKY TOP-16 TỰ ĐỘNG NEO CỐ ĐỊNH KHI CUỘN) */}
            <div
              ref={mobileCategoryBarRef}
              className="sticky top-16 z-30 lg:hidden -mx-4 px-4 sm:-mx-6 sm:px-6 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 mb-3.5 sm:mb-5 space-y-2 shadow-xs transition-shadow"
            >
              <div ref={mobileCategoryScrollRef} className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                {categories.map((category) => {
                  const isSelected = selectedCategory === category.name;
                  const hasChildren = category.children && category.children.length > 0;
                  const isParentOfSelected =
                    hasChildren && category.children.some((c) => c.name === selectedCategory);
                  const Icon = ICON_MAP[category.icon] || UtensilsCrossed;

                  return (
                    <button
                      key={category.name}
                      type="button"
                      data-selected={isSelected}
                      onClick={(e) => handleSelectCategory(category.name, hasChildren, e)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ease-out flex items-center gap-1.5 active:scale-95 cursor-pointer select-none border ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30"
                          : isParentOfSelected
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 transition-opacity duration-300 ease-out ${isSelected ? "opacity-100" : "opacity-75"}`} />
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
                <div ref={mobileSubCategoryScrollRef} className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-slate-50/90 p-1.5 rounded-xl border border-slate-200/70">
                  {categories
                    .find((item) => item.name === openCategory)
                    ?.children.map((child) => {
                      const isChildSelected = selectedCategory === child.name;
                      const ChildIcon = ICON_MAP[child.icon] || UtensilsCrossed;

                      return (
                        <button
                          key={child.id}
                          type="button"
                          data-selected={isChildSelected}
                          onClick={(e) => handleSelectSubCategory(child.name, e)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-300 ease-out active:scale-95 cursor-pointer select-none border ${
                            isChildSelected
                              ? "bg-emerald-700 text-white border-emerald-700 shadow-xs font-bold"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <ChildIcon className={`w-3 h-3 shrink-0 transition-opacity duration-300 ease-out ${isChildSelected ? "opacity-100" : "opacity-75"}`} />
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
              <div className="min-h-[440px] bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center p-8 md:p-14 transition-all duration-300">
                {/* Hình minh họa đĩa vỡ, dao nĩa và huy hiệu cảnh báo */}
                <MenuErrorIllustration />

                {/* Huy hiệu LỖI KẾT NỐI */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold text-[#b91c1c] bg-[#feeceb] border border-[#fca5a5]/50 mb-3.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse" />
                  <span>LỖI KẾT NỐI</span>
                </div>

                {/* Tiêu đề lỗi */}
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
                  Không thể tải danh sách thực đơn
                </h3>

                {/* Phần chữ thông báo tối ưu cho người dùng đọc là biết ngay */}
                <p className="text-slate-600 text-sm sm:text-base mt-2.5 max-w-md font-medium leading-relaxed">
                  Lỗi kết nối đến server. Vui lòng kiểm tra mạng hoặc thử lại.
                </p>

                {/* 1 nút duy nhất: Thử lại ngay */}
                <div className="flex justify-center mt-7">
                  <button
                    type="button"
                    onClick={fetchMenuItems}
                    disabled={isLoadingMenu}
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#D9381E] hover:bg-[#C22E17] text-white text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                  >
                    <RotateCw
                      className={`w-4 h-4 ${
                        isLoadingMenu ? "animate-spin" : ""
                      }`}
                    />
                    <span>{isLoadingMenu ? "Đang kết nối lại..." : "Thử lại ngay"}</span>
                  </button>
                </div>
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
                <div
                  key={`dishes-${selectedCategory}-${currentPage}`}
                  ref={dishesGridRef}
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4 animate-[fadeIn_0.25s_ease-out]"
                >
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
          onLogin={() => navigate("/login", { state: { from: "/menu" } })}
        />
      )}
    </div>
  );
}

export default MenuPage;

function MenuErrorIllustration() {
  return (
    <div className="relative mb-6 flex items-center justify-center select-none">
      <svg
        viewBox="0 0 428 436"
        className="w-40 h-40 sm:w-52 sm:h-52 drop-shadow-sm select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Nền tròn cam đào mềm mại */}
        <circle cx="217.5" cy="219" r="178.5" fill="#FFCEBC" />

        {/* Toàn bộ đĩa nứt, tam giác cảnh báo và dao nĩa màu cam đất */}
        <g fill="#BF3715" stroke="#BF3715">
          {/* Vành đĩa ngoài phía trên nối liền với vết nứt ziczac */}
          <path
            d="M 263 125 A 104 104 0 0 0 166 122 L 140 140 L 158 162 L 158 178 L 174 196"
            strokeWidth="9.5"
            strokeLinecap="round"
            strokeLinejoin="miter"
            fill="none"
          />

          {/* Vành đĩa ngoài phía dưới bên trái */}
          <path
            d="M 130 156 A 104 104 0 0 0 252 316"
            strokeWidth="9.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Vành đĩa trong phía trên */}
          <path
            d="M 244 154 A 69 69 0 0 0 166 166"
            strokeWidth="8.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Vành đĩa trong phía dưới */}
          <path
            d="M 152 192 A 69 69 0 0 0 250 278"
            strokeWidth="8.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Tam giác cảnh báo giữa lòng đĩa với góc bo tròn mượt mà */}
          <path
            d="M 205 170 C 208 164 216 164 219 170 L 253 243 C 256 249 252 255 245 255 L 179 255 C 172 255 168 249 171 243 Z"
            fill="#BF3715"
            stroke="none"
          />

          {/* Dấu chấm than khoét rỗng trong tam giác cảnh báo */}
          <line
            x1="212"
            y1="186"
            x2="212"
            y2="218"
            stroke="#FFCEBC"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx="212" cy="234" r="4.8" fill="#FFCEBC" stroke="none" />

          {/* Con dao ăn với lưỡi cong thanh thoát */}
          <path
            d="M 276 138 C 276 130 270 126 265 128 C 255 137 251 154 251 176 C 251 200 258 217 262 227 C 263 229 262 232 262 236 L 260 306 C 260 314 265 319 270 319 C 274 319 276 314 276 306 Z"
            fill="#BF3715"
            stroke="none"
          />

          {/* Chiếc nĩa 3 chấu với các đường nét chuẩn xác */}
          <path
            d="M 293 144 C 293 140 295 138 297.5 138 C 300 138 302 140 302 144 L 302 176 C 302 178.5 304 180 306.5 180 C 309 180 311 178.5 311 176 L 311 144 C 311 140 313 138 315.5 138 C 318 138 320 140 320 144 L 320 176 C 320 178.5 322 180 324.5 180 C 327 180 329 178.5 329 176 L 329 144 C 329 140 331 138 333.5 138 C 336 138 338 140 338 144 L 338 198 C 338 206 331 213 322 218 L 322 312 C 322 317 317 320 312 320 C 307 320 304 317 304 312 L 304 218 C 295 213 293 206 293 198 Z"
            fill="#BF3715"
            stroke="none"
          />
        </g>

        {/* Huy hiệu đỏ cảnh báo góc dưới bên phải với viền trắng nổi bật */}
        <g className="animate-bounce-subtle">
          <circle
            cx="343"
            cy="346"
            r="51"
            fill="#98181A"
            stroke="#FFFFFF"
            strokeWidth="12"
          />
          <line
            x1="343"
            y1="318"
            x2="343"
            y2="351"
            stroke="#FFFFFF"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <circle cx="343" cy="368" r="6" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}
