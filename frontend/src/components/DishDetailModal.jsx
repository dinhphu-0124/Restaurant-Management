import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Star,
  CheckCircle2,
  Soup,
  Flame,
  Clock,
  FileText,
  ShieldCheck,
  Truck,
  Leaf,
  Tag,
  Sparkles,
  Wine,
} from "lucide-react";

export default function DishDetailModal({
  selectedDish,
  setSelectedDish,
  selectedImage,
  setSelectedImage,
  quantity,
  setQuantity,
  activeTab = "description",
  setActiveTab,
  isLoadingReviews,
  dishReviews = [],
  isLoggedIn,
  setShowLoginModal,
  addToCart,
  navigate,
  modalScrollRef,
  previewImages = [],
  setSelectedImageIndex,
  fetchDishReviews,
  setIsImagePreviewOpen,
  dishes = [],
}) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // Active price options from database
  const activeOptions = useMemo(() => {
    if (!selectedDish?.priceOptions) return [];
    return selectedDish.priceOptions
      .filter((o) => o.isActive !== false && o.is_active !== 0)
      .sort(
        (a, b) =>
          Number(a.displayOrder || 1) - Number(b.displayOrder || 1) ||
          Number(a.id || 0) - Number(b.id || 0),
      );
  }, [selectedDish]);

  const [selectedOptionId, setSelectedOptionId] = useState(null);

  useEffect(() => {
    if (activeOptions.length > 0) {
      setSelectedOptionId(activeOptions[0].id);
    } else {
      setSelectedOptionId(null);
    }
  }, [selectedDish?.id, selectedDish?.dbId, activeOptions]);

  // Gallery of thumbnail images strictly from database / Admin
  const allImages = useMemo(() => {
    if (!selectedDish) return [];
    let list = [];
    if (Array.isArray(selectedDish.images) && selectedDish.images.length > 0) {
      list = selectedDish.images.filter(Boolean);
    } else if (selectedDish.image) {
      list = [selectedDish.image];
    }
    return list.length > 0 ? list : ["/src/assets/images/Menu/default-food.png"];
  }, [selectedDish]);

  // Helper to parse option title, subtitle (e.g. Size 700k | (2-3 người))
  const formatOptionDetails = (opt) => {
    if (!opt) return { title: selectedDish?.name || "", subtitle: "" };
    const rawNote = String(opt.note || "").trim();
    if (rawNote.includes("(") && rawNote.includes(")")) {
      const parts = rawNote.split("(");
      return {
        title: parts[0].trim(),
        subtitle: `(${parts[1].replace(")", "").trim()})`,
      };
    }
    if (
      rawNote.toLowerCase().startsWith("size") ||
      rawNote.toLowerCase().startsWith("set")
    ) {
      return {
        title: rawNote,
        subtitle: selectedDish?.portion
          ? `(${selectedDish.portion})`
          : "(tiêu chuẩn)",
      };
    }
    return {
      title: rawNote || selectedDish?.name || "",
      subtitle: selectedDish?.portion ? `(${selectedDish.portion})` : "",
    };
  };

  const currentOption = useMemo(() => {
    return (
      activeOptions.find((o) => o.id === selectedOptionId) ||
      activeOptions[0] ||
      null
    );
  }, [activeOptions, selectedOptionId]);

  // Dynamic Title matching Mockup Image 2
  const dynamicTitle = useMemo(() => {
    if (!selectedDish) return "";
    if (activeOptions.length > 1 && currentOption) {
      const { title } = formatOptionDetails(currentOption);
      if (
        title.toLowerCase().startsWith("size") &&
        !selectedDish.name.toLowerCase().includes("size")
      ) {
        return `${selectedDish.name} ${title.toLowerCase()}`;
      }
    }
    return selectedDish.name;
  }, [selectedDish, currentOption, activeOptions]);

  // Dynamic Subtitle strictly from DB / Admin
  const dynamicSubtitle = useMemo(() => {
    if (!selectedDish) return "";
    if (selectedDish.shortDescription && String(selectedDish.shortDescription).trim()) {
      return String(selectedDish.shortDescription).trim();
    }
    if (selectedDish.description && String(selectedDish.description).trim()) {
      return String(selectedDish.description).trim();
    }
    return "";
  }, [selectedDish]);

  // Ingredients list strictly from database / Admin
  const ingredientsList = useMemo(() => {
    if (!selectedDish?.ingredients) return [];
    const raw = String(selectedDish.ingredients).trim();
    if (!raw) return [];
    const separator = raw.includes("\n") ? "\n" : ",";
    return raw
      .split(separator)
      .map((i) => i.trim().replace(/^[-•*✔✓]\s*/, ""))
      .filter(Boolean);
  }, [selectedDish?.ingredients]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedDish(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedDish]);

  if (!selectedDish) return null;

  // Next / Previous image slider
  const handlePrevImage = () => {
    setCurrentImgIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };
  const handleNextImage = () => {
    setCurrentImgIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  const displayedImage =
    allImages[currentImgIdx] || selectedDish.image || "/images/placeholder.jpg";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden text-left pb-[max(env(safe-area-inset-bottom),14px)] pt-[max(env(safe-area-inset-top),10px)]"
      onClick={() => setSelectedDish(null)}
    >
      <div
        className="bg-white rounded-[26px] sm:rounded-[32px] max-w-5xl w-full h-[86dvh] sm:h-[90vh] max-h-[850px] shadow-2xl relative text-sm overflow-hidden border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          aria-label="Đóng chi tiết"
          onClick={() => setSelectedDish(null)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md flex items-center justify-center transition-all cursor-pointer border border-slate-200 active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SCROLLABLE BODY */}
        <div
          ref={modalScrollRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 md:p-7 space-y-4 sm:space-y-6"
        >
          {/* TOP SECTION: 2 COLUMNS (50% - 50% BALANCED ON DESKTOP, STACKED ON MOBILE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-7 items-start">
            {/* LEFT: HERO IMAGE WITH SLIDER & THUMBNAILS */}
            <div className="space-y-2">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/10] sm:aspect-[16/11] bg-slate-100 border border-slate-200/80 shadow-xs group">
                <img
                  src={displayedImage || "/images/placeholder.jpg"}
                  alt={selectedDish.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/placeholder.jpg";
                  }}
                  className="w-full h-full object-cover select-none"
                />

                {/* Dynamic Badge on Top-Left of Hero Image */}
                {selectedDish.badge && String(selectedDish.badge).trim() !== "" && (
                  <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-md">
                    <Flame size={12} className="fill-white text-white shrink-0" />
                    <span>{selectedDish.badge}</span>
                  </div>
                )}

                {/* Status Badge if paused */}
                {selectedDish.status === "paused" && (
                  <div className="absolute top-2.5 right-13 z-20 px-2.5 py-1 rounded-full bg-slate-900/90 text-white text-[10px] sm:text-[11px] font-black tracking-wider uppercase backdrop-blur-xs shadow-md">
                    Tạm hết món
                  </div>
                )}

                {/* Slider Pagination Pill (Bottom-Left: < 1/3 >) */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-2.5 left-2.5 z-20 bg-black/65 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="hover:text-amber-400 transition cursor-pointer p-0.5"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-[11px] font-semibold tracking-wider px-0.5">
                      {currentImgIdx + 1} / {allImages.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="hover:text-amber-400 transition cursor-pointer p-0.5"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails Strip - ONLY render when dish has multiple real images */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImgIdx(idx)}
                      className={`aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        currentImgIdx === idx
                          ? "border-[#15803d] ring-2 ring-[#15803d]/20 shadow-xs scale-105"
                          : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img || "/images/placeholder.jpg"}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/placeholder.jpg";
                        }}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: TITLE, INFO BADGES, PRICE OPTIONS */}
            <div className="flex flex-col space-y-3">
              <div>
                {/* Title */}
                <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {dynamicTitle}
                </h1>

                {/* Star Rating Row */}
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={13}
                        className={
                          star <= Math.round(Number(selectedDish.rating || 5))
                            ? "fill-amber-500 text-amber-500"
                            : "text-slate-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="font-extrabold text-slate-800 text-xs">
                    {Number(selectedDish.rating || 5.0).toFixed(1)}
                  </span>
                  <span className="text-slate-400 font-medium text-[11px]">
                    ({selectedDish.reviews || 1} đánh giá)
                  </span>
                </div>

                {/* Subtitle / Short Description */}
                {dynamicSubtitle && (
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed line-clamp-3 sm:line-clamp-none">
                    {dynamicSubtitle}
                  </p>
                )}

                {/* Quick Info Badges (Khẩu phần, Chế biến, Thời gian) */}
                {(() => {
                  const isDrink =
                    ["bia", "nước ngọt", "rượu", "đồ uống"].some((c) =>
                      (
                        selectedDish.parentCategory ||
                        selectedDish.category ||
                        ""
                      )
                        .toLowerCase()
                        .includes(c),
                    ) ||
                    [
                      "bia",
                      "coca",
                      "pepsi",
                      "7 up",
                      "bò húc",
                      "lavie",
                      "trà đá",
                      "nước cam",
                      "rượu",
                    ].some((k) =>
                      (selectedDish.name || "").toLowerCase().includes(k),
                    );

                  const badges = [];
                  if (selectedDish.portion && String(selectedDish.portion).trim()) {
                    badges.push({
                      label: isDrink ? "Quy cách" : "Khẩu phần",
                      val: String(selectedDish.portion).trim(),
                      Icon: isDrink ? Wine : Soup,
                    });
                  }
                  if (selectedDish.cooking && String(selectedDish.cooking).trim()) {
                    badges.push({
                      label: isDrink ? "Phục vụ" : "Chế biến",
                      val: String(selectedDish.cooking).trim(),
                      Icon: isDrink ? Sparkles : Flame,
                    });
                  }
                  if (selectedDish.time && String(selectedDish.time).trim()) {
                    badges.push({
                      label: "Thời gian",
                      val: String(selectedDish.time).trim(),
                      Icon: Clock,
                    });
                  }

                  if (badges.length === 0) return null;

                  return (
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-2.5 sm:mt-3">
                      {badges.map((b, bIdx) => {
                        const BIcon = b.Icon;
                        return (
                          <div
                            key={bIdx}
                            className="bg-slate-50/90 border border-slate-100 rounded-xl p-2 sm:p-2.5 flex flex-col justify-center"
                          >
                            {/* Hàng 1: Icon + Tên nhãn */}
                            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                              <BIcon size={14} className="text-[#15803d] shrink-0" />
                              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
                                {b.label}
                              </span>
                            </div>
                            {/* Hàng 2: Giá trị chi tiết */}
                            <p
                              className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight break-words"
                              title={b.val}
                            >
                              {b.val}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* PRICE SECTION: MULTI-PRICE OPTIONS SELECTOR VS DIRECT SINGLE PRICE */}
                {activeOptions.length > 1 ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#15803d]">
                      <Tag size={13} className="text-[#15803d]" />
                      <span>Chọn mức giá</span>
                    </div>

                    {/* Compact 2-column Options Grid (vừa vặn, ngắn gọn) */}
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {activeOptions.map((opt) => {
                        const isSelected = selectedOptionId === opt.id;
                        const { title, subtitle } = formatOptionDetails(opt);

                        return (
                          <div
                            key={opt.id}
                            onClick={() => setSelectedOptionId(opt.id)}
                            className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-1.5 ${
                              isSelected
                                ? "bg-emerald-50/50 border-2 border-[#15803d] shadow-2xs"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {/* Left: Radio + Title & Subtitle */}
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <div className="shrink-0">
                                {isSelected ? (
                                  <CheckCircle2
                                    size={15}
                                    className="text-[#15803d] fill-[#15803d] text-white"
                                  />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                                  {title}
                                </h4>
                                {subtitle && (
                                  <p className="text-[9.5px] sm:text-[10px] text-slate-500 truncate leading-none mt-0.5">
                                    {subtitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Price */}
                            <div className="shrink-0 text-right">
                              <span className="text-[11px] sm:text-xs font-black text-[#b45309]">
                                {Number(opt.price || 0).toLocaleString("vi-VN")}đ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5">
                    <span className="text-xl sm:text-3xl font-extrabold text-[#b45309] tracking-tight">
                      {Number(
                        currentOption?.price ||
                          selectedDish.priceNumber ||
                          (typeof selectedDish.price === "number"
                            ? selectedDish.price
                            : Number(String(selectedDish.price || 0).replace(/\D/g, ""))) ||
                          0,
                      ).toLocaleString("vi-VN")}
                      đ
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: 2 COLUMNS (TABS + REVIEWS) - OPTIMIZED FOR TABLETS & PHONES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 items-stretch pt-1">
            {/* BOTTOM LEFT: 3 TABS CARD (Mô tả / Thành phần / Hương vị) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs flex flex-col min-h-[160px] md:h-[220px]">
              {/* Tab Navigation Pill Bar */}
              <div className="grid grid-cols-3 text-center bg-slate-50 border-b border-slate-100 p-1 gap-1 shrink-0">
                {[
                  { key: "description", label: "Mô tả", icon: FileText },
                  { key: "ingredients", label: "Thành phần", icon: Soup },
                  { key: "taste", label: "Hương vị", icon: Flame },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = (activeTab || "description") === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveTab(t.key)}
                      className={`py-1.5 px-1 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer rounded-xl ${
                        isActive
                          ? "bg-emerald-50 text-[#15803d] border border-emerald-100 font-black shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        size={12}
                        className={isActive ? "text-[#15803d]" : "text-slate-400"}
                      />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Box */}
              <div className="p-3 sm:p-3.5 text-xs text-slate-700 leading-relaxed flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                {(activeTab || "description") === "description" && (
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Mô tả món ăn
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {selectedDish.description || selectedDish.shortDescription || (
                        <span className="text-slate-400 italic">Chưa có mô tả chi tiết cho món ăn này.</span>
                      )}
                    </p>
                  </div>
                )}

                {activeTab === "ingredients" && (
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Thành phần chính
                    </h3>
                    {ingredientsList.length > 0 ? (
                      <ul className="space-y-1">
                        {ingredientsList.map((ing, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-1.5 text-xs text-slate-700"
                          >
                            <CheckCircle2
                              size={12}
                              className="text-[#15803d] shrink-0"
                            />
                            <span>{ing}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Chưa có thông tin thành phần cho món này.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "taste" && (
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Hương vị đặc trưng
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedDish.flavor || (
                        <span className="text-slate-400 italic">Chưa có thông tin hương vị cho món ăn này.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM RIGHT: ĐÁNH GIÁ MÓN ĂN CARD */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-2xs flex flex-col justify-start min-h-[160px] md:h-[220px] overflow-hidden">
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-5.5 h-5.5 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Đánh giá món ăn
                  </h3>
                </div>

                <div className="flex items-center gap-1 text-xs bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 shrink-0">
                  <div className="flex items-center text-amber-500">
                    <Star size={10} className="fill-amber-500 text-amber-500" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-[11px]">
                    {Number(selectedDish.rating || 5.0).toFixed(1)}
                  </span>
                  <span className="text-slate-400 font-medium text-[10px]">
                    ({selectedDish.reviews || dishReviews.length || 0})
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
                {isLoadingReviews ? (
                  <div className="flex flex-col items-center justify-center py-4 text-slate-400 text-xs text-center flex-1">
                    <p>Đang tải đánh giá...</p>
                  </div>
                ) : dishReviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-slate-400 text-xs text-center flex-1">
                    <Star size={18} className="text-amber-200 mb-1 opacity-80" />
                    <span className="text-[11px]">Chưa có đánh giá cho món này.</span>
                  </div>
                ) : (
                  dishReviews.map((rev, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5 transition hover:bg-slate-100/70"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px]">
                          {rev.user_name || rev.userName || "Khách hàng"}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, sIdx) => (
                            <Star
                              key={sIdx}
                              size={8}
                              className={
                                sIdx < (rev.rating || 5)
                                  ? "fill-amber-500 text-amber-500"
                                  : "text-slate-200"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {rev.comment}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ELEVATED STICKY BOTTOM ACTION BAR (SAFE FROM MOBILE NAVIGATION & URL BARS) */}
        <div className="border-t border-slate-200 bg-white px-3.5 pt-2.5 pb-[max(env(safe-area-inset-bottom),12px)] sm:px-6 sm:py-3.5 shrink-0 flex items-center justify-between gap-3 shadow-[0_-8px_24px_rgba(0,0,0,0.1)] z-30">
          {/* Quantity Stepper (Rộng rãi, cân đối và dễ bấm hơn) */}
          <div className="h-11 sm:h-12 rounded-2xl border border-slate-200/90 flex items-center justify-between px-2 bg-slate-50 w-32 sm:w-36 md:w-40 shrink-0 shadow-2xs">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:text-slate-950 hover:border-slate-300 font-black text-lg flex items-center justify-center cursor-pointer shadow-2xs transition active:scale-90"
            >
              -
            </button>
            <span className="font-black text-sm sm:text-base text-slate-900 min-w-[28px] text-center select-none">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:text-slate-950 hover:border-slate-300 font-black text-lg flex items-center justify-center cursor-pointer shadow-2xs transition active:scale-90"
            >
              +
            </button>
          </div>

          {/* Primary Add To Cart Button */}
          <button
            type="button"
            disabled={selectedDish.status === "paused"}
            onClick={(e) => {
              const chosenOption =
                currentOption || activeOptions[0] || null;
              addToCart(selectedDish, quantity, e, chosenOption);
              setSelectedDish(null);
            }}
            className="flex-1 h-11 sm:h-12 px-4 sm:px-6 rounded-2xl bg-[#15803d] hover:bg-[#166534] active:scale-[0.98] text-white text-xs sm:text-sm md:text-base font-black flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <ShoppingCart size={17} className="shrink-0" />
            <span className="truncate">
              Thêm vào giỏ •{" "}
              {Number(
                (currentOption?.price ||
                  selectedDish.priceNumber ||
                  (typeof selectedDish.price === "number"
                    ? selectedDish.price
                    : Number(String(selectedDish.price || 0).replace(/\D/g, ""))) ||
                  0) * quantity,
              ).toLocaleString("vi-VN")}
              đ
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
