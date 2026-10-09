import React from "react";

/**
 * AppSkeleton - Placeholder tải động cho Text, Card, Bảng và KPI
 * @param {('text'|'card'|'image'|'kpi'|'avatar')} type
 */
export default function AppSkeleton({
  type = "text",
  className = "",
  count = 1,
}) {
  const renderItem = (key) => {
    switch (type) {
      case "card":
        return (
          <div
            key={key}
            className={`bg-white rounded-2xl border border-slate-100 p-4 animate-pulse ${className}`}
          >
            <div className="w-full aspect-4/3 bg-slate-200 rounded-xl mb-4" />
            <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2" />
            <div className="h-3 bg-slate-200 rounded-md w-1/2 mb-4" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 bg-slate-200 rounded-md w-20" />
              <div className="h-8 bg-slate-200 rounded-lg w-20" />
            </div>
          </div>
        );

      case "kpi":
        return (
          <div
            key={key}
            className={`bg-white rounded-2xl border border-slate-100 p-5 animate-pulse flex items-center justify-between ${className}`}
          >
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded-md w-24" />
              <div className="h-7 bg-slate-200 rounded-md w-32" />
              <div className="h-3 bg-slate-200 rounded-md w-16" />
            </div>
            <div className="h-12 w-12 bg-slate-200 rounded-xl" />
          </div>
        );

      case "image":
        return (
          <div
            key={key}
            className={`bg-slate-200 rounded-xl animate-pulse ${className}`}
          />
        );

      case "avatar":
        return (
          <div
            key={key}
            className={`h-10 w-10 bg-slate-200 rounded-full animate-pulse ${className}`}
          />
        );

      case "text":
      default:
        return (
          <div
            key={key}
            className={`h-4 bg-slate-200 rounded-md animate-pulse ${className}`}
          />
        );
    }
  };

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, idx) => renderItem(idx))}
      </div>
    );
  }

  return renderItem(0);
}
