import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown, ChevronRight } from "lucide-react";

export function AnimatedNumber({ value, isCurrency = false, isDecimal = false, duration = 2000 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const endVal = Number(value) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = isDecimal ? (progress * endVal) : Math.floor(progress * endVal);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  if (isCurrency) {
    return <span>{displayValue.toLocaleString("vi-VN")}đ</span>;
  }

  if (isDecimal) {
    return <span>{displayValue.toFixed(1)}</span>;
  }

  return <span>{displayValue.toLocaleString("vi-VN")}</span>;
}

export function DashboardCard({ icon, title, value, percent, bg, color, to, isCurrency = false }) {
  const percentStr = String(percent || "0.0%");
  const isUp = !percentStr.includes("-");
  const displayPercent = percentStr.replace(/[+-]/g, "");

  return (
    <Link
      to={to}
      className="bg-surface-card rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-200 group select-none text-left min-w-0"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0 shadow-2xs`}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
        <div className="flex items-center">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 shrink-0 ${
              isUp ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-rose-50 text-rose-600 border border-rose-200/60"
            }`}
          >
            {isUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {displayPercent}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500 truncate leading-tight">
          {title}
        </p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 leading-tight truncate tracking-tight">
          <AnimatedNumber value={value} isCurrency={isCurrency} />
        </h3>
      </div>
    </Link>
  );
}

export function CategoryLine({ color, name, value, chartProgress }) {
  return (
    <div className="space-y-1.5 text-left">
      <div className="flex justify-between items-center text-xs font-bold">
        <span className="text-slate-600 flex items-center gap-2 truncate">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
          <span className="truncate">{name}</span>
        </span>

        <span className="text-slate-900 font-black shrink-0 ml-2">{value}</span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          style={{ width: `${chartProgress * 100}%` }}
          className={`h-full rounded-full ${color} transition-all duration-700`}
        />
      </div>
    </div>
  );
}

export function StatusLine({ icon, title, value, bg, color, total = 100, chartProgress, to }) {
  const percent = total > 0 ? Math.min((value / total) * 100, 100) : 0;

  return (
    <Link to={to} className="block space-y-2 group select-none text-left p-2 -mx-2 rounded-xl hover:bg-slate-50 transition">
      <div className="flex justify-between items-center text-xs font-bold">
        <span className="text-slate-700 flex items-center gap-2.5 min-w-0">
          <span className={`w-7 h-7 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
            {React.cloneElement(icon, { size: 15 })}
          </span>
          <span className="truncate">{title}</span>
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-900 text-xs font-black">
            {value} <span className="text-[10px] text-slate-400 font-medium">/ {total}</span>
          </span>
          <ChevronRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          style={{ width: `${percent * chartProgress}%` }}
          className={`h-full rounded-full ${color.replace('text-', 'bg-')} transition-all duration-700`}
        />
      </div>
    </Link>
  );
}

export function PanelHeader({ title, to }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-100 text-left">
      <h3 className="text-sm font-black text-slate-900 tracking-tight">{title}</h3>

      {to && (
        <Link
          to={to}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition select-none"
        >
          <span>Xem tất cả</span>
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

export function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-slate-400 font-medium text-xs">
        {text}
      </td>
    </tr>
  );
}

export function SmallStat({ icon, title, value, change, orange = false }) {
  return (
    <div className="bg-surface-card rounded-2xl p-4 border border-slate-200/80 shadow-xs text-left hover:shadow-md hover:border-emerald-200 transition-all duration-200">
      <p className="text-xs font-bold text-slate-500 flex items-center gap-2 truncate">
        <span className={orange ? "text-amber-500" : "text-emerald-700"}>{icon}</span>
        <span className="truncate">{title}</span>
      </p>

      <div className="flex justify-between items-baseline gap-2 mt-2">
        <h4 className="text-xl font-black text-slate-900 tracking-tight">{value}</h4>
        {change && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              change.startsWith("+")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
