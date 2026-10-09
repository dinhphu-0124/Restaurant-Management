import React from "react";
import { X, Copy } from "lucide-react";
import { DetailBlock, DetailRow, MiniStat } from "./AdminDealsComponents";

export default function DealDetailPanel({
  deal,
  formatMoney,
  formatDate,
  getStatusText,
  getStatusStyle,
  getTypeStyle,
  onClose,
  onEdit,
  onTogglePause,
  onDelete,
}) {
  const usageHistory = Array.isArray(deal.usageHistory)
    ? deal.usageHistory.slice(-7)
    : [];

  const maxUsage = Math.max(
    ...usageHistory.map((item) => Number(item.count || 0)),
    1,
  );

  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden xl:sticky xl:top-4 text-left">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xl font-black text-primary">
          Chi tiết khuyến mãi
        </h3>

        <button onClick={onClose} className="text-gray-400 hover:text-red-500">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-green-950 to-green-700 p-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-lg bg-white/15 text-xs font-black">
              {getStatusText(deal.status)}
            </span>

            <button
              onClick={() => navigator.clipboard.writeText(deal.code)}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
            >
              <Copy size={16} />
            </button>
          </div>

          <h2 className="text-2xl font-black mt-5">{deal.name}</h2>

          <p className="text-[#f6d47a] text-4xl font-black mt-2">
            {deal.discount}
          </p>

          <p className="mt-4 px-4 py-2 rounded-xl border border-white/25 font-black tracking-widest inline-block">
            {deal.code}
          </p>
        </div>

        <DetailBlock title="Thông tin chương trình">
          <DetailRow label="Mã khuyến mãi" value={deal.code} />
          <DetailRow label="Tên chương trình" value={deal.name} />
          <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
            <span className="text-gray-500 font-semibold">Loại</span>
            <span
              className={`w-fit px-3 py-1 rounded-lg text-xs font-black ${getTypeStyle(
                deal.type,
              )}`}
            >
              {deal.type}
            </span>
          </div>
          <DetailRow label="Giảm giá" value={deal.discount} />

          <DetailRow
            label="Điều kiện"
            value={`${Number(deal.condition || 0).toLocaleString("vi-VN")}đ`}
          />

          {Array.isArray(deal.conditionItems) &&
            deal.conditionItems.length > 0 && (
              <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
                <span className="text-gray-500 font-semibold">
                  Điều kiện khác
                </span>
                <div className="space-y-1">
                  {deal.conditionItems.map((item) => (
                    <p key={item} title={item} className="text-gray-800 font-bold break-words">
                      • {item}
                    </p>
                  ))}
                </div>
              </div>
            )}

          {deal.serviceConditionItems &&
            Object.values(deal.serviceConditionItems).some(
              (arr) => Array.isArray(arr) && arr.length > 0
            ) && (
              <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
                <span className="text-gray-500 font-semibold">
                  Đ/k theo hình thức
                </span>
                <div className="space-y-2">
                  {deal.serviceConditionItems.dinein?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Ăn tại quán:</p>
                      <ul className="list-disc list-inside text-xs text-slate-700 font-medium pl-1">
                        {deal.serviceConditionItems.dinein.map((item) => (
                          <li key={item} title={item} className="break-words">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {deal.serviceConditionItems.delivery?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Giao tận nơi:</p>
                      <ul className="list-disc list-inside text-xs text-slate-700 font-medium pl-1">
                        {deal.serviceConditionItems.delivery.map((item) => (
                          <li key={item} title={item} className="break-words">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {deal.serviceConditionItems.pickup?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Đến lấy tại quán:</p>
                      <ul className="list-disc list-inside text-xs text-slate-700 font-medium pl-1">
                        {deal.serviceConditionItems.pickup.map((item) => (
                          <li key={item} title={item} className="break-words">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

          <DetailRow
            label="Thời gian"
            value={`${formatDate(deal.startDate)} - ${formatDate(deal.endDate)}`}
          />

          <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
            <span className="text-gray-500 font-semibold">Trạng thái</span>
            <span
              className={`w-fit px-3 py-1 rounded-lg text-xs font-black ${getStatusStyle(
                deal.status,
              )}`}
            >
              {getStatusText(deal.status)}
            </span>
          </div>
          <DetailRow label="Mô tả" value={deal.desc || "Không có"} />
        </DetailBlock>

        <div className="grid grid-cols-2 gap-3">
          <MiniStat
            label="Đã sử dụng"
            value={`${Number(deal.used || 0).toLocaleString("vi-VN")}`}
          />
          <MiniStat
            label="Tổng giảm giá"
            value={formatMoney(deal.totalDiscount)}
          />

          <MiniStat
            label="Giới hạn lượt dùng"
            value={
              deal.usageLimit
                ? `${Number(deal.usageLimit).toLocaleString("vi-VN")} lượt`
                : "Không giới hạn"
            }
          />
        </div>

        <DetailBlock title="Thống kê sử dụng">
          {usageHistory.length > 0 ? (
            <>
              <div
                className={`h-[180px] flex items-end gap-3 border-b border-l border-gray-100 px-3 ${
                  usageHistory.length === 1 ? "justify-center" : ""
                }`}
              >
                {usageHistory.map((item) => {
                  const count = Number(item.count || 0);

                  return (
                    <div
                      key={item.date}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <p className="text-xs font-black text-gray-500">
                        {count}
                      </p>

                      <div
                        className={`rounded-t-xl bg-green-600 ${
                          usageHistory.length === 1 ? "w-32" : "w-full"
                        }`}
                        style={{
                          height: `${Math.max((count / maxUsage) * 150, 8)}px`,
                        }}
                      ></div>
                    </div>
                  );
                })}
              </div>

              <div
                className={`text-[11px] text-gray-400 font-bold mt-2 ${
                  usageHistory.length === 1 ? "flex justify-center" : "grid"
                }`}
                style={
                  usageHistory.length > 1
                    ? {
                        gridTemplateColumns: `repeat(${usageHistory.length}, minmax(0, 1fr))`,
                      }
                    : {}
                }
              >
                {usageHistory.map((item) => (
                  <span key={item.date} className="text-center block">
                    {new Date(item.date).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-gray-400 font-bold">
              Chưa có dữ liệu sử dụng
            </div>
          )}
        </DetailBlock>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={onEdit}
            className="h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 font-black hover:bg-blue-100"
          >
            Sửa
          </button>

          <button
            onClick={onTogglePause}
            className="h-11 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 font-black hover:bg-orange-100"
          >
            {deal.status === "paused" ? "Bán lại" : "Tạm dừng"}
          </button>

          <button
            onClick={onDelete}
            className="h-11 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black hover:bg-red-100"
          >
            Xóa
          </button>
        </div>
      </div>
    </aside>
  );
}
