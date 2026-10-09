import React from "react";
import { Inbox } from "lucide-react";
import AppButton from "./AppButton.jsx";

/**
 * AppEmptyState - Trạng thái trống trực quan với Icon, Tiêu đề, Mô tả và Nút thao tác
 */
export default function AppEmptyState({
  icon: Icon = null,
  title = "Không có dữ liệu",
  description = "Hiện tại chưa có bản ghi nào để hiển thị.",
  action = null,
  actionText = "",
  onAction = null,
  className = "",
}) {
  const renderIcon = () => {
    if (!Icon) return <Inbox className="h-7 w-7" />;
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === "function" || (typeof Icon === "object" && Icon !== null)) {
      const DynamicIcon = Icon;
      return <DynamicIcon className="h-7 w-7" />;
    }
    return Icon;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto ${className}`}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-4 shadow-inner">
        {renderIcon()}
      </div>

      <h4 className="text-base font-bold text-slate-800 mb-1">{title}</h4>

      {description && (
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {action ? (
        <div className="mt-1">{action}</div>
      ) : actionText && onAction ? (
        <div className="mt-1">
          <AppButton variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}
