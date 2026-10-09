import { checkLogin, clearAuthSession } from "../utils/auth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import goatIcon from "../assets/images/Icon_De.png";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  UserRound,
  ClipboardList,
  CalendarCheck,
  LogOut,
  Home,
  Utensils,
  Calendar,
  Tag,
  Info,
  Phone,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const ROLE_TEXT = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  user: "Khách hàng",
};

function Header({ currentPage = "home" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => checkLogin());
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const user =
      JSON.parse(localStorage.getItem("currentUser")) ||
      JSON.parse(sessionStorage.getItem("currentUser"));

    return user || null;
  });
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const desktopProfileRef = useRef(null);
  const mobileProfileRef = useRef(null);
  const closeMenuTimeout = useRef(null);
  const navRef = useRef(null);

  const [indicatorStyle, setIndicatorStyle] = useState({
    x: 0,
    width: 0,
  });

  const totalCartQty = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const menus = [
    { name: "Trang chủ", path: "/home", key: "home", icon: Home },
    { name: "Thực đơn", path: "/menu", key: "menu", icon: Utensils },
    { name: "Đặt bàn", path: "/booking", key: "booking", icon: Calendar },
    { name: "Khuyến mãi", path: "/deals", key: "deals", icon: Tag },
    { name: "Giới thiệu", path: "/about", key: "about", icon: Info },
    { name: "Liên hệ", path: "/contact", key: "contact", icon: Phone },
  ];

  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const updateAvatar = () => {
      setAvatar(localStorage.getItem("avatar") || null);
    };

    window.addEventListener("avatarUpdated", updateAvatar);
    window.addEventListener("storage", updateAvatar);

    const updateLoginStatus = () => {
      setIsLoggedIn(checkLogin());

      const user =
        JSON.parse(localStorage.getItem("currentUser")) ||
        JSON.parse(sessionStorage.getItem("currentUser"));

      setCurrentUser(user || null);
    };

    updateLoginStatus();

    const updateCart = () => {
      const savedCart = localStorage.getItem("cartItems");
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
    };

    window.addEventListener("cartUpdated", () => setTimeout(updateCart, 0));
    window.addEventListener("storage", () => setTimeout(updateCart, 0));

    window.addEventListener("loginStatusChanged", updateLoginStatus);

    return () => {
      window.removeEventListener("cartUpdated", updateCart);
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("loginStatusChanged", updateLoginStatus);
      window.removeEventListener("avatarUpdated", updateAvatar);
      window.removeEventListener("storage", updateAvatar);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const outsideDesktop =
        desktopProfileRef.current &&
        !desktopProfileRef.current.contains(event.target);

      const outsideMobile =
        mobileProfileRef.current &&
        !mobileProfileRef.current.contains(event.target);

      if (outsideDesktop && outsideMobile) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const activeItem = navRef.current?.querySelector(`[data-active="true"]`);

    if (activeItem) {
      setIndicatorStyle({
        x: activeItem.offsetLeft,
        width: activeItem.offsetWidth,
      });
    }
  }, [currentPage]);

  const handleLogout = () => {
    clearAuthSession();

    setIsLoggedIn(false);
    setCurrentUser(null);
    setAvatar(null);
    setIsProfileOpen(false);
    setIsMenuOpen(false);

    navigate("/home");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-5 flex items-center justify-between">
        <Link
          to="/home"
          onClick={scrollToTop}
          className="flex items-center gap-2.5 shrink-0"
        >
          <img
            src={goatIcon}
            alt="Dê Hương Sơn"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
          />
          <div>
            <h1 className="font-extrabold text-green-900 leading-tight text-sm sm:text-base">Dê Hương Sơn</h1>
            <p className="text-[10px] sm:text-xs text-green-700 font-bold tracking-wider">HÀ TĨNH</p>
          </div>
        </Link>

        <nav
          ref={navRef}
          className="hidden lg:flex gap-8 text-sm font-semibold relative items-center pb-1"
        >
          <div
            className="absolute bottom-0 left-0 h-[3px] bg-green-800 rounded-full transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
            style={{
              width: `${indicatorStyle.width}px`,
              transform: indicatorStyle.x ? `translateX(${indicatorStyle.x}px)` : "none",
            }}
          />
          {menus.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              data-active={currentPage === item.key}
              className={`pb-3 transition-all duration-300 ${
                currentPage === item.key
                  ? "text-green-800"
                  : "text-green-950 hover:text-green-800"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {isLoggedIn ? (
            <div
              ref={desktopProfileRef}
              className="relative flex items-center gap-4"
              onMouseEnter={() => {
                if (closeMenuTimeout.current) {
                  clearTimeout(closeMenuTimeout.current);
                }
              }}
              onMouseLeave={() => {
                closeMenuTimeout.current = setTimeout(() => {
                  setIsProfileOpen(false);
                }, 1000);
              }}
            >
              <Link to="/cart" className="relative text-green-900 mr-2 p-2 hover:bg-slate-100 rounded-xl transition">
                <ShoppingCart className="w-5 h-5" />

                {totalCartQty > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-red-600 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center border-2 border-white shadow-xs">
                    {totalCartQty}
                  </span>
                )}
              </Link>

              {currentUser && (
                <div className="hidden xl:flex flex-col leading-tight max-w-[150px]">
                  <span className="text-[11px] text-gray-500 font-semibold">
                    Xin chào
                  </span>

                  <span className="text-sm font-black text-green-900 truncate">
                    {currentUser.fullName ||
                      currentUser.name ||
                      currentUser.username ||
                      "Người dùng"}
                  </span>
                </div>
              )}

              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full bg-green-50 text-green-800 flex items-center justify-center border border-green-700 hover:bg-green-100 transition cursor-pointer"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              {isProfileOpen && (
                <ProfileMenu
                  onLogout={handleLogout}
                  onMouseEnter={() => {
                    if (closeMenuTimeout.current) {
                      clearTimeout(closeMenuTimeout.current);
                    }
                  }}
                  onMouseLeave={() => {
                    closeMenuTimeout.current = setTimeout(() => {
                      setIsProfileOpen(false);
                    }, 2000);
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {!isLoginPage && (
                <Link
                  to="/login"
                  className="border-2 border-primary text-primary px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-primary/5 transition-colors"
                >
                  Đăng nhập
                </Link>
              )}

              {!isRegisterPage && (
                <Link
                  to="/register"
                  className="bg-primary text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs hover:bg-primary-light transition-all"
                >
                  Đăng ký
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <Link
            to="/cart"
            aria-label="Giỏ hàng"
            className="w-10 h-10 rounded-xl text-green-900 flex items-center justify-center hover:bg-slate-100 transition relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalCartQty > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center border-2 border-white shadow-xs">
                {totalCartQty}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Mở menu"
            className="w-10 h-10 rounded-xl border border-green-800 text-green-800 flex items-center justify-center hover:bg-green-50 transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isMenuOpen && createPortal(
        <div className="fixed inset-0 z-[99999] lg:hidden animate-in fade-in duration-200">
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          <div className="fixed right-0 top-0 bottom-0 w-[86vw] max-w-[340px] bg-white h-[100dvh] max-h-[100dvh] flex flex-col justify-between shadow-2xl z-10 border-l border-slate-100 animate-in slide-in-from-right duration-250">
            {/* Top Header */}
            <div className="p-4 border-b border-emerald-950/20 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-emerald-800 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 p-1 flex items-center justify-center backdrop-blur-xs">
                  <img
                    src={goatIcon}
                    alt="Logo"
                    className="w-full h-full object-contain brightness-0 invert"
                  />
                </div>
                <div>
                  <h2 className="font-black text-white text-sm leading-tight">Dê Hương Sơn</h2>
                  <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Hà Tĩnh</p>
                </div>
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                aria-label="Đóng menu"
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col custom-scrollbar">
              {/* Profile / Auth Card */}
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
                {isLoggedIn && currentUser ? (
                  <div className="p-3 rounded-2xl bg-white border border-emerald-100 shadow-2xs flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-emerald-800" />
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">Xin chào</span>
                        {currentUser?.role && currentUser.role !== "user" && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                            {ROLE_TEXT[currentUser.role] || "Nhân viên"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-slate-900 truncate mt-0.5">
                        {currentUser.fullName || currentUser.name || currentUser.username || "Người dùng"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                    <p className="text-xs font-bold text-slate-700 leading-snug">
                      Đăng nhập để nhận ưu đãi thành viên & quản lý đơn hàng
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="h-9 rounded-xl border-2 border-emerald-800 text-emerald-800 font-bold text-xs flex items-center justify-center hover:bg-emerald-50 active:bg-emerald-100 transition"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="h-9 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shadow-xs hover:bg-emerald-900 active:bg-emerald-950 transition"
                      >
                        Đăng ký
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <nav className="p-3 space-y-1 flex-1">
                {menus.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.key;
                  return (
                    <Link
                      key={item.key}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`min-h-[44px] px-3.5 rounded-xl flex items-center justify-between text-sm font-bold transition-all ${
                        isActive
                          ? "bg-emerald-700 text-white font-extrabold shadow-sm"
                          : "text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900 active:bg-emerald-100/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {Icon && (
                          <Icon
                            className={`w-4 h-4 ${
                              isActive ? "text-white" : "text-slate-400"
                            }`}
                          />
                        )}
                        <span>{item.name}</span>
                      </div>
                      {isActive && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                    </Link>
                  );
                })}

                {/* Account Section */}
                {isLoggedIn && (
                  <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
                    <p className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                      Tài khoản của bạn
                    </p>
                    <Link
                      to="/profile"
                      state={{ activeTab: "profile" }}
                      onClick={() => setIsMenuOpen(false)}
                      className="min-h-[42px] px-3.5 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <UserRound className="w-4 h-4 text-emerald-700" />
                        <span>Hồ sơ cá nhân</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </Link>
                    <Link
                      to="/profile"
                      state={{ activeTab: "history" }}
                      onClick={() => setIsMenuOpen(false)}
                      className="min-h-[42px] px-3.5 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList className="w-4 h-4 text-emerald-700" />
                        <span>Lịch sử đơn hàng</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </Link>
                    <Link
                      to="/profile"
                      state={{ activeTab: "bookings" }}
                      onClick={() => setIsMenuOpen(false)}
                      className="min-h-[42px] px-3.5 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <CalendarCheck className="w-4 h-4 text-emerald-700" />
                        <span>Đặt bàn của tôi</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </Link>

                    {currentUser?.role && currentUser.role !== "user" && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="min-h-[42px] px-3.5 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 transition mt-1"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>Trang quản trị</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                      </Link>
                    )}
                  </div>
                )}
              </nav>
            </div>

            {/* Bottom Footer Action (Always pinned & safe from home indicator / virtual navbar) */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/90 shrink-0 pb-[calc(1.25rem+env(safe-area-inset-bottom,16px))]">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 border border-rose-200/80 transition cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              ) : (
                <div className="text-center text-[11px] text-slate-500 font-semibold py-1">
                  Hotline đặt bàn:{" "}
                  <a href="tel:0387136878" className="font-extrabold text-emerald-800">
                    038 713 6878
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}


function ProfileMenu({ onLogout, mobile = false, onMouseEnter, onMouseLeave }) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={
        mobile
          ? "w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md"
          : "absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[999]"
      }
    >
      <Link
        to="/profile"
        state={{ activeTab: "profile" }}
        className="flex items-center gap-3.5 px-5 py-3.5 text-slate-800 text-sm font-bold hover:bg-slate-50 hover:text-[#145c30] transition"
      >
        <UserRound className="w-4 h-4 text-[#15803d]" />
        Hồ sơ cá nhân
      </Link>

      <Link
        to="/profile"
        state={{ activeTab: "history" }}
        className="flex items-center gap-3.5 px-5 py-3.5 text-slate-800 text-sm font-bold hover:bg-slate-50 hover:text-[#145c30] transition border-t border-slate-100"
      >
        <ClipboardList className="w-4 h-4 text-[#15803d]" />
        Lịch sử đơn hàng
      </Link>

      <Link
        to="/profile"
        state={{ activeTab: "bookings" }}
        className="flex items-center gap-3.5 px-5 py-3.5 text-slate-800 text-sm font-bold hover:bg-slate-50 hover:text-[#145c30] transition border-t border-slate-100"
      >
        <CalendarCheck className="w-4 h-4 text-[#15803d]" />
        Đặt bàn của tôi
      </Link>

      <Link
        to="/profile"
        state={{ activeTab: "cart" }}
        className="flex items-center gap-3.5 px-5 py-3.5 text-slate-800 text-sm font-bold hover:bg-slate-50 hover:text-[#145c30] transition border-t border-slate-100"
      >
        <ShoppingCart className="w-4 h-4 text-[#15803d]" />
        Giỏ hàng của tôi
      </Link>

      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3.5 px-5 py-3.5 bg-rose-50/50 hover:bg-rose-50 text-rose-600 text-sm font-bold border-t border-slate-100 transition cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất
      </button>
    </div>
  );
}

export default Header;
