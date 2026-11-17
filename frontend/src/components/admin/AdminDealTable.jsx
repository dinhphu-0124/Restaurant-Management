import React from "react";
import { IconButton } from "./AdminDealsComponents";
import { Pencil, PlayCircle, PauseCircle, Trash2, TicketPercent, Copy } from "lucide-react";
import { getDealLifecycle } from "../../utils/dealsHelpers";

export default function AdminDealTable({
  paginatedDeals,
  selectedDealIds,
  selectedDeal,
  setSelectedDeal,
  toggleSelectAll,
  handleSelectDeal,
  getTypeStyle,
  formatDate,
  getStatusStyle,
  getStatusText,
  currentUser,
  canUseAction,
  openEditModal,
  togglePauseDeal,
  deleteDeal,
  cloneDeal,
}) {
  return (
    <div>
      {/* Mobile Deal Cards (lg:hidden) */}
      <div className="block lg:hidden divide-y divide-gray-100">
        {paginatedDeals.length > 0 ? (
          paginatedDeals.map((deal) => {
            const isSelected = selectedDeal?.id === deal.id;
            const isChecked = selectedDealIds.includes(String(deal.id));
            const lifecycle = getDealLifecycle(deal);

            return (
              <div
                key={deal.id}
                onClick={() => setSelectedDeal(deal)}
                className={`p-3.5 space-y-2.5 transition-colors cursor-pointer text-left ${
                  isSelected ? "bg-emerald-50/70" : "hover:bg-slate-50"
                }`}
              >
                {/* Header: Checkbox, Code, Status, Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      aria-label={`Chọn khuyến mãi ${deal.code}`}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleSelectDeal(deal.id)}
                      className="w-4 h-4 accent-green-700 rounded shrink-0 cursor-pointer"
                    />
                    <span className="font-black text-sm text-emerald-800 shrink-0">
                      {deal.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black truncate border ${lifecycle.badgeClass}`}
                    >
                      {lifecycle.label}
                    </span>
                    {lifecycle.warningText && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        ⚡ {lifecycle.warningText}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton
                      icon={<Pencil size={14} />}
                      color="emerald"
                      disabled={!canUseAction(currentUser, "promotions:update")}
                      title="Chỉnh sửa khuyến mãi"
                      aria-label="Chỉnh sửa khuyến mãi"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(deal);
                      }}
                    />
                    {lifecycle.key === "expired" || lifecycle.key === "invalid" ? (
                      <IconButton
                        icon={<Copy size={14} />}
                        color="blue"
                        disabled={!canUseAction(currentUser, "promotions:create")}
                        title="Nhân bản khuyến mãi này"
                        aria-label="Nhân bản khuyến mãi này"
                        onClick={(e) => {
                          e.stopPropagation();
                          cloneDeal && cloneDeal(deal);
                        }}
                      />
                    ) : (
                      <IconButton
                        icon={deal.status === "paused" ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                        color="orange"
                        disabled={!canUseAction(currentUser, "promotions:update")}
                        title={deal.status === "paused" ? "Kích hoạt lại" : "Tạm dừng"}
                        aria-label={deal.status === "paused" ? "Kích hoạt lại" : "Tạm dừng"}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePauseDeal(deal);
                        }}
                      />
                    )}
                    <IconButton
                      icon={<Trash2 size={14} />}
                      color="red"
                      disabled={!canUseAction(currentUser, "promotions:delete")}
                      title="Xóa khuyến mãi"
                      aria-label="Xóa khuyến mãi"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDeal(deal);
                      }}
                    />
                  </div>
                </div>

                {/* Deal Image, Title & Discount */}
                <div className="flex items-start gap-3 text-xs">
                  {/* Thumbnail ảnh đại diện */}
                  <div className="w-14 h-14 rounded-xl border border-slate-200/80 bg-slate-50 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                    {deal.cardImage || deal.detailImage || deal.bannerImage ? (
                      <img
                        src={deal.cardImage || deal.detailImage || deal.bannerImage}
                        alt={deal.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-emerald-700">
                        <TicketPercent size={18} />
                        <span className="text-[9px] font-bold mt-0.5">Chưa có</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm line-clamp-2">
                      {deal.name}
                    </p>
                    {deal.subtitle && (
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {deal.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-emerald-700">
                      {deal.discount}
                    </p>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 ${getTypeStyle(deal.type)}`}>
                      {deal.type}
                    </span>
                  </div>
                </div>

                {/* Date & Condition Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
                  <span>HSD: {formatDate(deal.endDate)}</span>
                  <span>Đã dùng: <strong className="text-slate-800">{Number(deal.used || 0).toLocaleString("vi-VN")}</strong></span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-5 py-12 text-center text-gray-400 font-bold text-xs">
            Không có khuyến mãi phù hợp
          </div>
        )}
      </div>

      {/* Desktop Table (hidden on mobile, visible on lg+) */}
      <div className="overflow-x-auto hidden lg:block">
        <table className="min-w-[1300px] w-full text-left text-sm">
        <thead className="bg-[#fbfcfb] text-gray-600 font-black text-xs uppercase">
          <tr>
            <th className="w-[50px] px-4 py-3">
              <input
                type="checkbox"
                checked={
                  paginatedDeals.length > 0 &&
                  paginatedDeals.every((deal) => selectedDealIds.includes(String(deal.id)))
                }
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-green-700"
              />
            </th>
            <th className="w-[72px] px-2 py-3 text-center">Ảnh</th>
            <th className="w-[130px] px-4 py-3">Mã</th>
            <th className="w-[220px] px-4 py-3">Tên chương trình</th>
            <th className="w-[130px] px-4 py-3 text-center">Loại</th>
            <th className="w-[110px] px-4 py-3 text-center">Giảm giá</th>
            <th className="w-[180px] px-4 py-3">Điều kiện</th>
            <th className="w-[210px] px-4 py-3 text-center">Thời gian</th>
            <th className="w-[140px] px-4 py-3 text-center">Trạng thái</th>
            <th className="w-[110px] px-4 py-3 text-center">Lượt dùng</th>
            <th className="w-[130px] px-4 py-3 text-center sticky right-0 bg-[#fbfcfb] z-10">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedDeals.length > 0 ? (
            paginatedDeals.map((deal) => {
              const lifecycle = getDealLifecycle(deal);
              return (
                <tr
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className={`border-t border-gray-100 hover:bg-green-50/30 cursor-pointer transition-colors ${
                    selectedDeal?.id === deal.id ? "bg-green-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDealIds.includes(String(deal.id))}
                      aria-label={`Chọn khuyến mãi ${deal.code}`}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleSelectDeal(deal.id)}
                      className="w-4 h-4 accent-green-700 cursor-pointer"
                    />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <div className="w-11 h-11 rounded-xl border border-slate-200/80 bg-slate-50 overflow-hidden mx-auto flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {deal.cardImage || deal.detailImage || deal.bannerImage ? (
                        <img
                          src={deal.cardImage || deal.detailImage || deal.bannerImage}
                          alt={deal.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-emerald-700">
                          <TicketPercent size={16} />
                          <span className="text-[9px] font-bold mt-0.5">Chưa có</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-emerald-800 whitespace-nowrap" title={deal.code}>
                    {deal.code}
                  </td>
                  <td className="px-4 py-3 max-w-[240px]">
                    <p className="font-bold text-slate-800 truncate" title={deal.name}>{deal.name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate" title={deal.subtitle}>{deal.subtitle || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${getTypeStyle(deal.type)}`}>
                      {deal.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700 text-center whitespace-nowrap">
                    {deal.discount}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap" title={`${Number(deal.condition || 0).toLocaleString("vi-VN")}đ`}>
                    {Number(deal.condition || 0).toLocaleString("vi-VN")}đ
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap" title={`${formatDate(deal.startDate)} - ${formatDate(deal.endDate)}`}>
                    {formatDate(deal.startDate)} - {formatDate(deal.endDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border ${lifecycle.badgeClass}`}>
                        {lifecycle.label}
                      </span>
                      {lifecycle.warningText && (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          ⚡ {lifecycle.warningText}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-gray-700 text-center">
                    {Number(deal.used || 0).toLocaleString("vi-VN")}
                  </td>
                  <td className={`px-4 py-3 sticky right-0 z-10 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.25)] transition-colors ${selectedDeal?.id === deal.id ? "bg-[#f0f9f1]" : "bg-white"}`}>
                    <div className="flex items-center justify-center gap-1.5">
                      <IconButton
                        icon={<Pencil size={15} />}
                        color="emerald"
                        disabled={!canUseAction(currentUser, "promotions:update")}
                        title="Chỉnh sửa khuyến mãi"
                        aria-label="Chỉnh sửa khuyến mãi"
                        onClick={(e) => { e.stopPropagation(); openEditModal(deal); }}
                      />
                      {lifecycle.key === "expired" || lifecycle.key === "invalid" ? (
                        <IconButton
                          icon={<Copy size={15} />}
                          color="blue"
                          disabled={!canUseAction(currentUser, "promotions:create")}
                          title="Nhân bản khuyến mãi để tạo chương trình mới"
                          aria-label="Nhân bản khuyến mãi"
                          onClick={(e) => { e.stopPropagation(); cloneDeal && cloneDeal(deal); }}
                        />
                      ) : (
                        <IconButton
                          icon={deal.status === "paused" ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                          color="orange"
                          disabled={!canUseAction(currentUser, "promotions:update")}
                          title={deal.status === "paused" ? "Kích hoạt lại khuyến mãi" : "Tạm dừng khuyến mãi"}
                          aria-label={deal.status === "paused" ? "Kích hoạt lại khuyến mãi" : "Tạm dừng khuyến mãi"}
                          onClick={(e) => { e.stopPropagation(); togglePauseDeal(deal); }}
                        />
                      )}
                      <IconButton
                        icon={<Trash2 size={15} />}
                        color="red"
                        disabled={!canUseAction(currentUser, "promotions:delete")}
                        title="Xóa khuyến mãi"
                        aria-label="Xóa khuyến mãi"
                        onClick={(e) => { e.stopPropagation(); deleteDeal(deal); }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan="11" className="px-5 py-14 text-center text-gray-400 font-bold">Không có khuyến mãi phù hợp</td></tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}
