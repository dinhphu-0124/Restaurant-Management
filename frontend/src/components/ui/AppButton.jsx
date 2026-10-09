import React from "react";
import { Loader2 } from "lucide-react";

/**
 * AppButton - Nút bấm chuẩn hóa dùng chung cho Client & Admin
 * @param {('primary'|'secondary'|'outline'|'danger'|'ghost')} variant
 * @param {('sm'|'md'|'lg')} size
 * @param {boolean} isLoading
 * @param {React.ReactNode} leadingIcon
 * @param {React.ReactNode} trailingIcon
 */
export default function AppButton({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  leadingIcon = null,
  trailingIcon = null,
  leftIcon = null,
  rightIcon = null,
  icon = null,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const actualLeading = leadingIcon || leftIcon || icon;
  const actualTrailing = trailingIcon || rightIcon;

  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#15803d] focus-visible:ring-offset-2 active:scale-[0.98]";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2.5 rounded-xl gap-2",
    lg: "text-base px-6 py-3 rounded-xl gap-2.5 font-semibold",
  };

  const variantStyles = {
    primary:
      "bg-[#15803d] text-white hover:bg-[#145c30] shadow-sm hover:shadow-md border border-[#145c30]/30",
    secondary:
      "bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-sm hover:shadow-md font-semibold",
    outline:
      "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow-md border border-rose-700/30",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : (
        actualLeading
      )}
      <span>{children}</span>
      {actualTrailing}
    </button>
  );
}
