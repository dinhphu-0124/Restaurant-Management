import React from "react";

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-surface-card rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md hover:border-emerald-200 transition-all duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500 truncate">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1.5 truncate tracking-tight">{value}</h3>
        </div>

        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
