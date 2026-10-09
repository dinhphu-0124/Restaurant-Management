import React from "react";
import { X } from "lucide-react";
import { DetailBlock, DetailRow } from "./AdminMenuComponents";

export default function AdminFoodDetailModal({
  selectedFood,
  setSelectedFood,
  formatPrice,
  getStatusText,
  formatDateTime,
  canUseAction,
  currentUser,
  openEditFoodModal,
  toggleFoodStatus
}) {
  if (!selectedFood) return null;

  const foodImages = React.useMemo(() => {
    if (!selectedFood) return [];
    if (Array.isArray(selectedFood.images) && selectedFood.images.length > 0) {
      return selectedFood.images.filter(Boolean);
    }
    if (selectedFood.image) return [selectedFood.image];
    return [];
  }, [selectedFood]);

  const [activeImgIdx, setActiveImgIdx] = React.useState(0);

  React.useEffect(() => {
    setActiveImgIdx(0);
  }, [selectedFood?.id]);

  const currentImage = foodImages[activeImgIdx] || selectedFood?.image || "/src/assets/images/Menu/default-food.png";

  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden 2xl:sticky 2xl:top-4">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xl font-black text-primary">
          Chi tiết món ăn
        </h3>
        <button
          onClick={() => setSelectedFood(null)}
          className="text-gray-400 hover:text-red-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Image with Thumbnails if multiple images */}
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden bg-gray-100 h-[160px] 2xl:h-[180px]">
            <img
              src={currentImage}
              alt={selectedFood.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/src/assets/images/Menu/default-food.png";
              }}
              className="w-full h-full object-cover"
            />
            {foodImages.length > 1 && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-2xs">
                {activeImgIdx + 1} / {foodImages.length}
              </div>
            )}
          </div>

          {foodImages.length > 1 && (
            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
              {foodImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImgIdx(idx)}
                  className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                    activeImgIdx === idx
                      ? "border-primary ring-2 ring-primary/20 scale-105 shadow-xs"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/src/assets/images/Menu/default-food.png";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black text-primary">
            {selectedFood.name}
          </h2>
          <p className="text-sm text-gray-500 font-semibold mt-1">
            Mã món: {selectedFood.id}
          </p>
        </div>

        <DetailBlock title="Thông tin chung">
          <DetailRow label="Danh mục" value={selectedFood.category} />
          <DetailRow label="Loại món" value={selectedFood.type} />
          <DetailRow
            label="Giá bán"
            value={formatPrice(selectedFood.price)}
          />
          <DetailRow
            label="Giá vốn"
            value={formatPrice(selectedFood.costPrice)}
          />
          <DetailRow
            label="Trạng thái"
            value={getStatusText(selectedFood.status)}
          />
          <DetailRow label="Đã bán" value={`${selectedFood.sold} phần`} />
          <DetailRow
            label="Đánh giá"
            value={`${selectedFood.rating} (${selectedFood.reviews} đánh giá)`}
          />
          <DetailRow label="Cập nhật" value={formatDateTime(selectedFood.updatedAt)} />
        </DetailBlock>

        {selectedFood.priceOptions && selectedFood.priceOptions.length > 0 && (
          <DetailBlock title={`Các mức giá / Quy cách (${selectedFood.priceOptions.length})`}>
            <div className="space-y-1.5">
              {selectedFood.priceOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs border border-gray-100"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-gray-800 truncate">
                      {opt.note || `Mức giá #${idx + 1}`}
                    </span>
                    {!opt.isActive && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 shrink-0">
                        Tạm ẩn
                      </span>
                    )}
                  </div>
                  <span className="font-black text-amber-700 shrink-0">
                    {formatPrice(opt.price)}
                  </span>
                </div>
              ))}
            </div>
          </DetailBlock>
        )}

        {(() => {
          const isDrink =
            ["bia", "nước ngọt", "rượu", "đồ uống"].some((c) =>
              (selectedFood.parentCategory || selectedFood.category || "")
                .toLowerCase()
                .includes(c)
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
            ].some((k) => (selectedFood.name || "").toLowerCase().includes(k));

          return (
            <DetailBlock title="Thông tin phục vụ & chế biến">
              <DetailRow label="Badge" value={selectedFood.badge || "Không có"} />
              <DetailRow
                label={isDrink ? "Quy cách / Thể tích" : "Khẩu phần"}
                value={selectedFood.portion || "Chưa thiết lập"}
              />
              <DetailRow
                label={isDrink ? "Phục vụ / Nhiệt độ" : "Chế biến"}
                value={selectedFood.cooking || "Chưa thiết lập"}
              />
              <DetailRow label="Thời gian" value={selectedFood.time || "Chưa thiết lập"} />
            </DetailBlock>
          );
        })()}

        <DetailBlock title="Mô tả ngắn">
          <p>{selectedFood.shortDescription || "Chưa có mô tả ngắn"}</p>
        </DetailBlock>

        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
          <button
            disabled={!canUseAction(currentUser, "menu:update")}
            onClick={() => openEditFoodModal(selectedFood)}
            className={`h-11 rounded-xl border text-sm font-black transition w-full ${
              !canUseAction(currentUser, "menu:update")
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
            }`}
            title={!canUseAction(currentUser, "menu:update") ? "Bạn không có quyền chỉnh sửa món ăn." : ""}
          >
            Chỉnh sửa
          </button>

          <button
            disabled={!canUseAction(currentUser, "menu:update")}
            onClick={() => toggleFoodStatus(selectedFood)}
            className={`h-11 rounded-xl text-sm font-black border transition ${
              !canUseAction(currentUser, "menu:update")
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : selectedFood.status === "stopped"
                ? "bg-primary/10 text-primary border-primary hover:bg-primary/20"
                : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
            }`}
            title={!canUseAction(currentUser, "menu:update") ? "Bạn không có quyền thay đổi trạng thái món ăn." : ""}
          >
            {selectedFood.status === "stopped" ? "Bán lại" : "Ngừng bán"}
          </button>
        </div>
      </div>
    </aside>
  );
}
