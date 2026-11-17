import React from "react";
import { X, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { getImageUrl } from "../../config/api";

export function Service({ icon, title, text }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="w-11 h-11 rounded-full bg-white text-[#b88935] flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div>
        <h3 className="font-black text-sm text-green-900">{title}</h3>
        <p className="text-xs text-gray-600 mt-1">{text}</p>
      </div>
    </div>
  );
}

export default function CartModals({
  selectedDish,
  setSelectedDish,
  activeDetailTab,
  setActiveDetailTab,
  detailQty,
  setDetailQty,
  cartItems,
  setCartItems,
  showToast,
  formatPrice,
  showEmptyCartAlert,
  setShowEmptyCartAlert,
  showClearConfirm,
  setShowClearConfirm,
  navigate,
}) {
  return (
    <>
      {/* popup chi tiết món */}
      {selectedDish && (
        <div
          className="fixed inset-0 z-[998] bg-black/50 flex items-center justify-center px-4 py-6 text-left"
          onClick={() => setSelectedDish(null)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thêm nút X mới lên góc trên phải trong chi tiết món ăn ở mobile */}
            <button
              onClick={() => setSelectedDish(null)}
              className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/95 border border-green-900 text-green-900 shadow-md flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="grid md:grid-cols-2 gap-5 p-4 md:p-5">
              <div>
                <div className="rounded-3xl overflow-hidden h-48 md:h-[250px] bg-gray-100">
                  <img
                    src={getImageUrl(selectedDish.image) || "/images/placeholder.jpg"}
                    alt={selectedDish.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/placeholder.jpg";
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* MOBILE TITLE */}
                <div className="md:hidden mt-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-[32px] leading-none font-black text-green-900">
                      {selectedDish.name}
                    </h2>

                    {selectedDish.tag && (
                      <span className="inline-flex bg-[#f4ead6] text-[#b88935] text-xs font-bold px-3 py-1 rounded-full">
                        {selectedDish.tag}
                      </span>
                    )}
                  </div>

                  <p className="text-[#b88935] text-2xl font-black mt-4">
                    {formatPrice(selectedDish.price)}
                  </p>

                  <p className="text-gray-600 mt-4 leading-relaxed">
                    {selectedDish.desc}
                  </p>
                </div>

                <div className="mt-5 border border-green-900 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-3 text-center text-sm font-black">
                    <button
                      onClick={() => setActiveDetailTab("description")}
                      className={`py-3 ${
                        activeDetailTab === "description"
                          ? "text-green-800 border-b-4 border-green-800"
                          : "text-gray-500"
                      }`}
                    >
                      MÔ TẢ
                    </button>

                    <button
                      onClick={() => setActiveDetailTab("ingredients")}
                      className={`py-3 ${
                        activeDetailTab === "ingredients"
                          ? "text-green-800 border-b-4 border-green-800"
                          : "text-gray-500"
                      }`}
                    >
                      THÀNH PHẦN
                    </button>

                    <button
                      onClick={() => setActiveDetailTab("taste")}
                      className={`py-3 ${
                        activeDetailTab === "taste"
                          ? "text-green-800 border-b-4 border-green-800"
                          : "text-gray-500"
                      }`}
                    >
                      HƯƠNG VỊ
                    </button>
                  </div>

                  <div className="border-t border-green-900 p-4 text-gray-600 leading-relaxed min-h-[120px]">
                    {activeDetailTab === "description" && (
                      <p>
                        {selectedDish.desc} Món ăn được chế biến từ nguyên liệu
                        tươi ngon, giữ trọn hương vị đặc trưng của đặc sản dê
                        Hương Sơn.
                      </p>
                    )}

                    {activeDetailTab === "ingredients" && (
                      <ul className="space-y-2">
                        <li>• Thịt dê tươi Hương Sơn</li>
                        <li>• Sả, ớt, hành tím</li>
                        <li>• Rau thơm ăn kèm</li>
                        <li>• Nước chấm đặc biệt</li>
                      </ul>
                    )}

                    {activeDetailTab === "taste" && (
                      <p>
                        Hương vị đậm đà, thơm nhẹ, thịt mềm ngọt tự nhiên, phù
                        hợp khẩu vị gia đình và thực khách yêu thích đặc sản dê
                        núi.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 md:pt-0">
                <h2 className="hidden md:block text-2xl md:text-3xl font-black text-green-900 pr-10">
                  {selectedDish.name}
                </h2>

                {selectedDish.tag && (
                  <span className="hidden md:inline-flex mt-3 bg-[#f4ead6] text-[#b88935] text-xs font-bold px-3 py-1 rounded-full">
                    {selectedDish.tag}
                  </span>
                )}

                <p className="hidden md:block text-[#b88935] text-2xl font-black mt-4">
                  {formatPrice(selectedDish.price)}
                </p>

                <p className="hidden md:block text-gray-600 mt-4 leading-relaxed">
                  {selectedDish.desc}
                </p>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="bg-[#fbf7ec] rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Khẩu phần</p>
                    <p className="font-bold text-green-900">2 - 3 người</p>
                  </div>

                  <div className="bg-[#fbf7ec] rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Chế biến</p>
                    <p className="font-bold text-green-900">Nóng hổi</p>
                  </div>

                  <div className="bg-[#fbf7ec] rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Thời gian</p>
                    <p className="font-bold text-green-900">15 - 20 phút</p>
                  </div>
                </div>

                <div className="mt-5 bg-[#fbf7ec] rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-green-900">Số lượng</p>

                    <div className="w-32 h-10 rounded-xl border border-[#eadfcd] flex items-center justify-between px-3 bg-white">
                      <button
                        onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="font-black">{detailQty}</span>

                      <button onClick={() => setDetailQty(detailQty + 1)}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCartItems((prev) => {
                        const existed = prev.find(
                          (item) => item.id === selectedDish.id,
                        );

                        if (existed) {
                          return prev.map((item) =>
                            item.id === selectedDish.id
                              ? { ...item, qty: detailQty }
                              : item,
                          );
                        }

                        return [
                          ...prev,
                          {
                            ...selectedDish,
                            qty: detailQty,
                            desc:
                              selectedDish.desc ||
                              "Món ăn gợi ý dùng kèm trong bữa chính.",
                          },
                        ];
                      });
                      showToast(
                        "Đã cập nhật giỏ hàng",
                        "đã được cập nhật",
                        "success",
                        selectedDish.name,
                      );

                      setSelectedDish(null);
                    }}
                    className="mt-4 w-full h-12 rounded-xl bg-green-900 text-white font-black hover:bg-green-950"
                  >
                    {cartItems.some((item) => item.id === selectedDish.id)
                      ? "Cập nhật giỏ hàng"
                      : "Thêm vào giỏ hàng"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmptyCartAlert && (
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 text-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
            <div className="w-20 h-20 rounded-full bg-[#fbf0dc] text-[#b88935] flex items-center justify-center mx-auto">
              <ShoppingCart className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-green-955 mt-5">
              Giỏ hàng đang trống
            </h2>

            <p className="text-gray-500 mt-3 leading-relaxed">
              Bạn chưa có món ăn nào trong giỏ hàng.
              <br />
              Hãy chọn món trước khi tiến hành thanh toán nhé.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-7">
              <button
                onClick={() => setShowEmptyCartAlert(false)}
                className="h-12 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                Đóng
              </button>

              <button
                onClick={() => {
                  setShowEmptyCartAlert(false);
                  navigate("/menu");
                }}
                className="h-12 rounded-xl bg-green-900 text-white font-bold hover:bg-green-955 transition"
              >
                Xem thực đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 text-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-green-955 mt-5">
              Xóa tất cả sản phẩm?
            </h2>

            <p className="text-gray-500 mt-3 leading-relaxed">
              Tất cả món ăn trong giỏ hàng sẽ bị xóa.
              <br />
              Bạn có chắc chắn muốn tiếp tục?
            </p>

            <div className="grid grid-cols-2 gap-3 mt-7">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="h-12 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                Hủy
              </button>

              <button
                onClick={() => {
                  setCartItems([]);
                  setShowClearConfirm(false);
                  showToast(
                    "Đã xóa tất cả",
                    "Tất cả món ăn đã được xóa khỏi giỏ hàng",
                    "delete",
                  );
                }}
                className="h-12 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
