import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Save,
  LogOut,
  CalendarDays,
  ShoppingCart,
  MapPin,
  Camera,
  ClipboardList,
  CheckCircle2,
  Clock,
  Pencil,
  X,
  Sparkles,
} from "lucide-react";

import { clearAuthSession } from "../utils/auth";
import { getMe, updateMe } from "../services/userService";
import {
  OrderHistoryContent,
  BookingHistoryContent,
  CartContent,
} from "../components/profile/ProfileSubComponents";
import { AppButton } from "../components/ui";
import { showAdminToast } from "../components/admin/AdminToast";

const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [errors, setErrors] = useState({});
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || null);
  const [showResetAvatar, setShowResetAvatar] = useState(false);

  const [tempAvatar, setTempAvatar] = useState(null);
  const [avatarChanged, setAvatarChanged] = useState(false);

  const [activePage, setActivePage] = useState(
    location.state?.activeTab || "profile"
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (location.state?.activeTab) {
      setActivePage(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    const loadProfile = async () => {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        const data = await getMe();
        const currentUser = data.user;

        setUser(currentUser);
        setForm({
          name: currentUser.name || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          address: currentUser.address || "",
        });

        setAvatar(currentUser.avatar || null);
        setTempAvatar(null);
        setAvatarChanged(false);

        if (localStorage.getItem("currentUser")) {
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
        } else {
          sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
        }

        if (currentUser.avatar) {
          localStorage.setItem("avatar", currentUser.avatar);
        } else {
          localStorage.removeItem("avatar");
        }

        window.dispatchEvent(new Event("loginStatusChanged"));
        window.dispatchEvent(new Event("avatarUpdated"));
      } catch (error) {
        console.error("Lỗi tải thông tin cá nhân:", error);
        clearAuthSession();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const val =
      e.target.name === "phone"
        ? e.target.value.replace(/\D/g, "")
        : e.target.value;
    setForm({ ...form, [e.target.name]: val });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      setTempAvatar(null);
      setAvatarChanged(false);
      setErrors({});
    }
    setIsEditing(false);
  };

  // Upload + Crop vuông 400x400
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAdminToast({
        title: "Kích thước quá lớn",
        message: "Ảnh đại diện không được vượt quá 2MB.",
        type: "warning",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);

        canvas.width = 400;
        canvas.height = 400;

        const ctx = canvas.getContext("2d");
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);

        const croppedImage = canvas.toDataURL("image/jpeg", 0.85);
        setTempAvatar(croppedImage);
        setAvatarChanged(true);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Vui lòng nhập họ và tên";
    }

    if (!form.email.trim()) {
      newErrors.email = "Vui lòng nhập địa chỉ email";
    }

    if (form.phone && !phoneRegex.test(form.phone)) {
      newErrors.phone =
        "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      if (avatarChanged) {
        payload.avatar = tempAvatar || null;
      }

      const data = await updateMe(payload);
      const updatedUser = data.user;

      if (localStorage.getItem("currentUser")) {
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }

      if (updatedUser.avatar) {
        localStorage.setItem("avatar", updatedUser.avatar);
      } else {
        localStorage.removeItem("avatar");
      }

      setUser(updatedUser);
      setAvatar(updatedUser.avatar || null);
      setTempAvatar(null);
      setAvatarChanged(false);
      setErrors({});
      setIsEditing(false);

      setToast(true);
      window.dispatchEvent(new Event("loginStatusChanged"));
      window.dispatchEvent(new Event("avatarUpdated"));

      setTimeout(() => setToast(false), 3500);
    } catch (error) {
      console.error(error);
      showAdminToast({
        title: "Lỗi cập nhật",
        message: error.message || "Không thể cập nhật thông tin.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <main className="max-w-7xl mx-auto px-5 py-8 space-y-6">
          <div className="h-14 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
        </main>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "profile", label: "Hồ sơ cá nhân", icon: User },
    { id: "history", label: "Lịch sử đơn hàng", icon: ClipboardList },
    { id: "bookings", label: "Đặt bàn của tôi", icon: CalendarDays },
    { id: "cart", label: "Giỏ hàng của tôi", icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-5 z-[9999] bg-white border border-emerald-200 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3 w-[340px] animate-slide-up">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#15803d] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-extrabold text-[#145c30] text-sm">
              Cập nhật thành công
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Thông tin tài khoản đã được lưu vào hệ thống.
            </p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3.5 sm:px-5 py-6 md:py-8 space-y-6">
        {/* =================================================================
            1. TOP BAR & TAB NAVIGATION
            ================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#145c30] tracking-tight">
              Tài khoản của tôi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Quản lý hồ sơ cá nhân, lịch sử đơn hàng và đặt bàn
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/booking")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] text-white hover:bg-[#145c30] shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <CalendarDays size={15} />
              <span>Đặt bàn ngay</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-600 bg-rose-50/80 border border-rose-200/80 hover:bg-rose-100 hover:text-rose-700 transition-all cursor-pointer"
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePage === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActivePage(tab.id);
                  if (isEditing) handleCancelEdit();
                }}
                className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#15803d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================================
            2. TAB CONTENT PANELS
            ================================================================= */}
        <div>
          {/* TAB 1: HỒ SƠ CÁ NHÂN */}
          {activePage === "profile" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 sm:p-8 text-left">
              <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
                
                {/* Left: Avatar & User Badge Card */}
                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 space-y-4">
                  {/* Avatar Container */}
                  <div
                    className="relative w-32 h-32 rounded-full group shrink-0"
                    onMouseEnter={() => {
                      if (isEditing) setShowResetAvatar(true);
                    }}
                    onMouseLeave={() => {
                      if (isEditing) setShowResetAvatar(false);
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-emerald-100 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
                      {tempAvatar || avatar ? (
                        <img
                          src={tempAvatar || avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-16 h-16 text-emerald-800" />
                      )}
                    </div>

                    {/* Edit Controls (Only available in Edit Mode) */}
                    {isEditing && (
                      <>
                        {/* Reset Avatar Button (When hovering on custom avatar in Edit Mode) */}
                        {avatar && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatar(null);
                              setTempAvatar(null);
                              setAvatarChanged(true);
                            }}
                            className={`absolute inset-0 rounded-full bg-black/60 text-white flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                              showResetAvatar
                                ? "opacity-100"
                                : "opacity-0 pointer-events-none"
                            }`}
                          >
                            Đặt về mặc định
                          </button>
                        )}

                        {/* Camera Upload Button */}
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <label
                          htmlFor="avatar-upload"
                          className="absolute right-0 bottom-1 w-9 h-9 rounded-full bg-[#15803d] text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-[#145c30] hover:scale-105 active:scale-95 transition-all"
                          title="Thay đổi ảnh đại diện"
                          aria-label="Thay đổi ảnh đại diện"
                        >
                          <Camera size={16} />
                        </label>
                      </>
                    )}
                  </div>

                  {/* Name & Role */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                      {user.name}
                    </h3>
                    <div className="mt-1.5 flex items-center justify-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#15803d] border border-emerald-200">
                        <Sparkles size={12} />
                        {user.role === "admin" ? "Quản trị viên" : "Khách hàng thân thiết"}
                      </span>
                    </div>
                  </div>

                  {/* Join Date */}
                  <div className="w-full pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <p className="flex items-center justify-center gap-1.5 text-slate-600 font-medium">
                      <Clock size={13} className="text-slate-400" />
                      <span>
                        Tham gia:{" "}
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "Gần đây"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right: Personal Information (VIEW MODE vs EDIT MODE) */}
                {!isEditing ? (
                  /* ===================== VIEW MODE ===================== */
                  <div className="space-y-6">
                    {/* Header with Title and Prominent Edit Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          Thông tin tài khoản
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          Thông tin liên hệ và địa chỉ nhận hàng của bạn
                        </p>
                      </div>

                      {/* Prominent Edit Button */}
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] text-white hover:bg-[#145c30] shadow-sm hover:shadow active:scale-98 transition-all cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <Pencil size={15} />
                        <span>Chỉnh sửa thông tin</span>
                      </button>
                    </div>

                    {/* Information Cards Grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Họ và tên */}
                      <div className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#15803d] border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#15803d] group-hover:text-white transition-all duration-200 shadow-2xs">
                          <User size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            Họ và tên
                          </span>
                          <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            {user.name || (
                              <span className="text-slate-400 font-normal italic">
                                Chưa cập nhật
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Số điện thoại */}
                      <div className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#15803d] border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#15803d] group-hover:text-white transition-all duration-200 shadow-2xs">
                          <Phone size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            Số điện thoại
                          </span>
                          <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            {user.phone || (
                              <span className="text-slate-400 font-normal italic">
                                Chưa thiết lập số điện thoại
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#15803d] border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#15803d] group-hover:text-white transition-all duration-200 shadow-2xs">
                          <Mail size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            Địa chỉ Email
                          </span>
                          <p className="text-sm sm:text-base font-bold text-slate-900 truncate" title={user.email}>
                            {user.email || (
                              <span className="text-slate-400 font-normal italic">
                                Chưa cập nhật
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Địa chỉ giao hàng mặc định */}
                      <div className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#15803d] border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#15803d] group-hover:text-white transition-all duration-200 shadow-2xs">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            Địa chỉ giao hàng mặc định
                          </span>
                          <p className="text-sm sm:text-base font-medium text-slate-900 line-clamp-2" title={user.address}>
                            {user.address || (
                              <span className="text-slate-400 font-normal italic">
                                Chưa thiết lập địa chỉ mặc định
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                      <CheckCircle2 size={16} className="text-[#15803d] shrink-0" />
                      <span>Thông tin này được sử dụng để tự động điền khi bạn đặt món và đặt bàn.</span>
                    </div>
                  </div>
                ) : (
                  /* ===================== EDIT MODE ===================== */
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          Cập nhật thông tin cá nhân
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Nhập thông tin mới và nhấn "Lưu thay đổi" để cập nhật
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        title="Hủy chỉnh sửa"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      {/* Họ và tên */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="profile-name"
                          className="block text-xs font-bold text-slate-700"
                        >
                          Họ và tên <span className="text-rose-500">*</span>
                        </label>
                        <div className="h-11 rounded-xl px-3.5 flex items-center gap-2.5 bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/10 transition">
                          <User size={16} className="text-slate-400 shrink-0" />
                          <input
                            id="profile-name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Nguyễn Văn A"
                            className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none border-none focus:outline-none focus:ring-0"
                          />
                        </div>
                        {errors.name && (
                          <p className="text-rose-600 text-[11px] font-semibold">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Số điện thoại */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="profile-phone"
                          className="block text-xs font-bold text-slate-700"
                        >
                          Số điện thoại
                        </label>
                        <div className="h-11 rounded-xl px-3.5 flex items-center gap-2.5 bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/10 transition">
                          <Phone size={16} className="text-slate-400 shrink-0" />
                          <input
                            id="profile-phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="0901234567"
                            className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none border-none focus:outline-none focus:ring-0"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-rose-600 text-[11px] font-semibold">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="profile-email"
                          className="block text-xs font-bold text-slate-700"
                        >
                          Email <span className="text-rose-500">*</span>
                        </label>
                        <div className="h-11 rounded-xl px-3.5 flex items-center gap-2.5 bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/10 transition">
                          <Mail size={16} className="text-slate-400 shrink-0" />
                          <input
                            id="profile-email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none border-none focus:outline-none focus:ring-0"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-rose-600 text-[11px] font-semibold">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Địa chỉ */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="profile-address"
                          className="block text-xs font-bold text-slate-700"
                        >
                          Địa chỉ giao hàng mặc định
                        </label>
                        <div className="h-11 rounded-xl px-3.5 flex items-center gap-2.5 bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/10 transition">
                          <MapPin size={16} className="text-slate-400 shrink-0" />
                          <input
                            id="profile-address"
                            name="address"
                            type="text"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Số nhà, tên đường, phường/xã..."
                            className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none border-none focus:outline-none focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Hủy vs Lưu thay đổi */}
                    <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">
                        Lưu ý: Mọi thay đổi sẽ áp dụng ngay cho các lần đặt món tiếp theo.
                      </p>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                        >
                          Hủy
                        </button>

                        <button
                          type="submit"
                          disabled={saving}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] text-white hover:bg-[#145c30] shadow-sm hover:shadow disabled:opacity-50 transition-all cursor-pointer"
                        >
                          <Save size={16} />
                          <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

              </div>
            </div>
          )}

          {/* TAB 2: LỊCH SỬ ĐƠN HÀNG */}
          {activePage === "history" && <OrderHistoryContent />}

          {/* TAB 3: ĐẶT BÀN CỦA TÔI */}
          {activePage === "bookings" && <BookingHistoryContent />}

          {/* TAB 4: GIỎ HÀNG CỦA TÔI */}
          {activePage === "cart" && <CartContent />}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;

