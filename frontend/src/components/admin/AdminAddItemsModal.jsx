import React from "react";
import { X, Search, Plus, Minus, ShoppingBag, ChefHat, Trash2 } from "lucide-react";
import { getImageUrl } from "../../config/api";

export default function AdminAddItemsModal({
  activeAddItemsBooking,
  setActiveAddItemsBooking,
  cartToAdd,
  setCartToAdd,
  menuItems,
  menuLoading,
  filteredMenuItems,
  itemSearch,
  setItemSearch,
  itemCategory,
  setItemCategory,
  handleAddItemToTempCart,
  handleUpdateTempCartQty,
  saveAddedItems,
}) {
  if (!activeAddItemsBooking) return null;

  const totalAmount = cartToAdd.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const totalItems = cartToAdd.reduce((acc, i) => acc + i.qty, 0);

  const categories = Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ height: "88vh" }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <ChefHat size={20} className="text-green-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Gọi thêm món ăn</h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Bàn <span className="font-bold text-green-700">{activeAddItemsBooking.selectedTable}</span>
                &nbsp;·&nbsp;Lịch đặt <span className="font-bold text-green-700">DB{activeAddItemsBooking.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveAddItemsBooking(null);
              setCartToAdd([]);
            }}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-500 flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* Left panel: Menu items */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

            {/* Search & Category Filter */}
            <div className="px-5 pt-4 pb-3 space-y-3 shrink-0 border-b border-gray-50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm món ăn..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>

              {/* Category tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                <button
                  onClick={() => setItemCategory("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    itemCategory === "all"
                      ? "bg-green-700 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setItemCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      itemCategory === cat
                        ? "bg-green-700 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
              {menuLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-semibold">Đang tải thực đơn...</span>
                </div>
              ) : filteredMenuItems.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {filteredMenuItems.map(food => {
                    const cartItem = cartToAdd.find(c => c.id === food.id);
                    const qty = cartItem ? cartItem.qty : 0;
                    return (
                      <div
                        key={food.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          qty > 0
                            ? "border-green-200 bg-green-50/60 shadow-sm"
                            : "border-gray-100 bg-white hover:border-green-200 hover:shadow-sm"
                        }`}
                        onClick={() => handleAddItemToTempCart(food)}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                          <img
                            src={getImageUrl(food.image) || "/images/placeholder.jpg"}
                            alt={food.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/images/placeholder.jpg";
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate leading-tight">{food.name}</p>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">{food.category}</p>
                          <p className="text-sm font-black text-green-700 mt-1">
                            {typeof food.price === "number"
                              ? Number(food.price).toLocaleString("vi-VN") + "đ"
                              : food.price}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5 bg-white border border-green-200 rounded-xl px-1.5 py-1 shadow-sm"
                              onClick={e => e.stopPropagation()}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateTempCartQty(food.id, -1); }}
                                className="w-6 h-6 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-500 flex items-center justify-center transition"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-black text-green-700 w-5 text-center">{qty}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateTempCartQty(food.id, 1); }}
                                className="w-6 h-6 rounded-lg hover:bg-green-50 hover:text-green-700 text-gray-500 flex items-center justify-center transition"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-green-700 hover:bg-green-800 text-white flex items-center justify-center shadow-sm transition-all">
                              <Plus size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 py-16">
                  <Search size={32} className="opacity-30" />
                  <span className="text-sm font-semibold">Không tìm thấy món ăn phù hợp</span>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Cart */}
          <div className="w-72 flex flex-col min-h-0 border-l border-gray-100 bg-gray-50/60 shrink-0">

            {/* Cart header */}
            <div className="px-4 pt-4 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-green-700" />
                  <h4 className="font-black text-sm text-gray-900">Món đã chọn</h4>
                  {totalItems > 0 && (
                    <span className="px-2 py-0.5 bg-green-700 text-white text-xs font-black rounded-full">
                      {totalItems}
                    </span>
                  )}
                </div>
                {cartToAdd.length > 0 && (
                  <button
                    onClick={() => setCartToAdd([])}
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2 min-h-0" style={{ scrollbarWidth: "thin" }}>
              {cartToAdd.length > 0 ? (
                cartToAdd.map(item => (
                  <div key={item.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                      <img
                        src={getImageUrl(item.image) || "/images/placeholder.jpg"}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/placeholder.jpg";
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-900 truncate">{item.name}</p>
                      <p className="font-bold text-[11px] text-green-700 mt-0.5">
                        {Number(item.price || 0).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                        <button
                          onClick={() => handleUpdateTempCartQty(item.id, -1)}
                          className="w-5 h-5 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-black text-gray-900 w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => handleUpdateTempCartQty(item.id, 1)}
                          className="w-5 h-5 rounded hover:bg-green-50 hover:text-green-700 text-gray-400 flex items-center justify-center transition"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <button
                        onClick={() => setCartToAdd(prev => prev.filter(i => i.id !== item.id))}
                        className="w-6 h-6 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition"
                        title="Xóa món này"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <ShoppingBag size={28} className="opacity-25 mb-2" />
                  <p className="text-xs font-semibold text-center">Chưa có món nào</p>
                  <p className="text-[11px] text-center mt-1 opacity-70">Nhấn vào món để thêm</p>
                </div>
              )}
            </div>

            {/* Cart footer */}
            <div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-3 shrink-0 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Tổng cộng</span>
                <span className="text-base font-black text-green-700">
                  {Number(totalAmount).toLocaleString("vi-VN")}đ
                </span>
              </div>
              <button
                disabled={cartToAdd.length === 0}
                onClick={saveAddedItems}
                className="w-full h-11 rounded-xl bg-green-700 text-white text-sm font-black hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Xác nhận thêm món
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
