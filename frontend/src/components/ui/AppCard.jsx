import React from "react";

/**
 * AppCard - Khung thẻ chuẩn hóa viền, đổ bóng và khoảng đệm
 */
export default function AppCard({
  children,
  className = "",
  header,
  footer,
  hoverable = false,
  padding = "md",
  onClick,
  ...props
}) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-5 md:p-6",
    lg: "p-6 md:p-8",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]
        ${hoverable ? "transition-all duration-200 hover:shadow-[0_10px_25px_-5px_rgb(0_0_0/0.08)] hover:-translate-y-0.5 cursor-pointer" : ""}
        ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          {header}
        </div>
      )}

      <div className={paddingStyles[padding] || paddingStyles.md}>{children}</div>

      {footer && (
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
}
