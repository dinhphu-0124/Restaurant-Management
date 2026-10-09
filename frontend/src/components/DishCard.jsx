import React from "react";
import { Plus, Sparkles, Flame, Crown, Heart, Clock, Zap, Award } from "lucide-react";
import RatingStars from "./RatingStars";
import AppBadge from "./ui/AppBadge";

function getBadgeIcon(badge) {
  const b = String(badge || "").toLowerCase();
  if (b.includes("đặc sản")) return Sparkles;
  if (b.includes("bán chạy")) return Flame;
  if (b.includes("mới")) return Zap;
  if (b.includes("đặc sắc")) return Crown;
  if (b.includes("tâm huyết")) return Heart;
  if (b.includes("sắp hết")) return Clock;
  return Award;
}

function DishCard({ dish, onOpenDetail, onAddToCart }) {
  const hasReviews = Number(dish.reviews || 0) > 0;
  const isPaused = dish.status === "paused";
  const isLow = dish.status === "low";
  const BadgeIcon = dish.badge ? getBadgeIcon(dish.badge) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail?.(dish)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail?.(dish);
        }
      }}
      className={`group relative w-full min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden flex flex-col cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-800 ${
        isPaused ? "opacity-75 grayscale-[0.25]" : ""
      }`}
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
        {isPaused && (
          <AppBadge variant="danger" size="sm" pill className="shadow-sm font-black text-[10px] sm:text-xs">
            TẠM HẾT
          </AppBadge>
        )}
        {isLow && (
          <AppBadge variant="warning" size="sm" pill className="shadow-sm font-black text-[10px] sm:text-xs">
            SẮP HẾT
          </AppBadge>
        )}
        {dish.badge && String(dish.badge).trim() !== "" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm tracking-wide">
            {BadgeIcon && <BadgeIcon size={10} className="text-amber-200" />}
            <span>{dish.badge}</span>
          </span>
        )}
      </div>

      {/* Dish Thumbnail (Ở trên cùng) */}
      <div className="w-full aspect-[4/3] overflow-hidden bg-slate-100 relative shrink-0">
        <img
          src={dish.image || "/images/placeholder.jpg"}
          alt={dish.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/placeholder.jpg";
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Content (Thông tin hiển thị ở dưới ảnh) */}
      <div className="p-2.5 sm:p-3.5 min-w-0 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {dish.name}
          </h3>

          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-relaxed line-clamp-2 overflow-hidden break-words">
            {dish.shortDescription ||
              dish.description ||
              "Món ăn đặc trưng của nhà hàng"}
          </p>

          {/* Rating */}
          <div className="mt-1 sm:mt-1.5 flex items-center gap-1 flex-wrap">
            <RatingStars rating={dish.rating} size={11} />
            {hasReviews ? (
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
                {Number(dish.rating || 0).toFixed(1)}
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                Chưa có
              </span>
            )}
          </div>
        </div>

        {/* Footer: Price & CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1 sm:mt-2">
          <p className="font-extrabold text-amber-700 text-xs sm:text-sm md:text-base tracking-tight truncate pr-1">
            {dish.price}
          </p>

          <button
            type="button"
            aria-label={`Thêm ${dish.name} vào giỏ hàng`}
            onClick={(e) => {
              e.stopPropagation();
              if (dish.hasMultiplePrices || (dish.priceOptions && dish.priceOptions.length > 1)) {
                onOpenDetail?.(dish);
              } else {
                onAddToCart?.(dish, 1, e);
              }
            }}
            disabled={isPaused}
            className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              isPaused
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20 active:scale-90"
            }`}
          >
            <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DishCard;
