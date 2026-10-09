import React, { useState, useEffect } from "react";
import { showAdminToast } from "./AdminToast";

export function DetailBlock({ title, children }) {
  return (
    <div className="border-t border-gray-100 pt-4 text-left">
      <h4 className="font-black text-green-800 mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[105px_1fr] gap-3 text-sm text-left">
      <span className="text-gray-500 font-semibold">{label}</span>
      <span className="text-gray-800 font-bold">{value}</span>
    </div>
  );
}

export function OrderDetailPanel({
  order,
  formatPrice,
  formatDateTime,
  getStatusText,
  getStatusStyle,
  getServiceText,
  getPaymentText,
  getPaymentStatusText,
  onClose,
  onChangeStatus,
  onAddPayment,
}) {
  const foods = order.cartItems || order.items || [];
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState(order.remainingAmount || 0);
  const [payMethod, setPayMethod] = useState("cash");
  const [customerGivenStr, setCustomerGivenStr] = useState("");

  // Reset states when order changes
  useEffect(() => {
    setPayAmount(order.remainingAmount || 0);
    setShowPayForm(false);
    setCustomerGivenStr("");
  }, [order.id, order.remainingAmount]);

  const handleCustomerGivenChange = (e) => {
    // Chỉ lấy số
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setCustomerGivenStr("");
      return;
    }
    // Format dạng 1.000.000
    setCustomerGivenStr(Number(val).toLocaleString("vi-VN"));
  };

  const customerGivenNumber = Number(customerGivenStr.replace(/\D/g, "")) || 0;
  const changeAmount = Math.max(0, customerGivenNumber - (order.remainingAmount || 0));
  const actualPayAmount = Math.min(customerGivenNumber, order.remainingAmount || 0);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 xl:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto xl:static xl:z-auto xl:w-auto xl:max-w-none xl:rounded-2xl xl:border xl:border-gray-100 xl:shadow-sm xl:overflow-hidden xl:sticky xl:top-4 text-left">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h3 className="text-lg sm:text-xl font-black text-primary">Chi tiết đơn hàng</h3>

          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition font-bold text-sm">
            ✕
          </button>
        </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black text-gray-400">Mã đơn hàng</p>

            <span
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-black whitespace-nowrap ${getStatusStyle(
                order.status,
              )}`}
            >
              {getStatusText(order.status)}
            </span>
          </div>

          <h2 className="text-2xl font-black text-green-955 mt-1 break-all leading-tight">
            {order.orderCode || `DH${order.id}`}
          </h2>

          <p className="text-xs text-gray-500 font-semibold mt-2">
            Đặt lúc: {formatDateTime(order.createdAt)}
          </p>
        </div>

        <DetailBlock title="Thông tin giao hàng">
          <DetailRow
            label="Họ tên"
            value={order.shippingAddress?.name || order.customerName || order.name || "Chưa có"}
          />
          <DetailRow
            label="SĐT"
            value={order.shippingAddress?.phone || order.phone || "Chưa có"}
          />
          <DetailRow
            label="Địa chỉ"
            value={order.shippingAddress?.address || "Lấy tại quán"}
          />
          <DetailRow label="Ghi chú khách" value={order.note || "Không có"} />
        </DetailBlock>

        <DetailBlock title="Thông tin đơn hàng">
          <DetailRow label="Hình thức" value={getServiceText(order.serviceType)} />
          <DetailRow label="Phương thức" value={getPaymentText(order.paymentMethod)} />
          <DetailRow
            label="Thanh toán"
            value={getPaymentStatusText(order.paymentStatus)}
          />
          {order.tableCode && <DetailRow label="Số bàn" value={order.tableCode} />}
        </DetailBlock>

        <DetailBlock title="Danh sách món ăn">
          {foods.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_40px_80px_80px] gap-2 text-xs font-black text-gray-500">
                <span>Món ăn</span>
                <span>SL</span>
                <span>Đơn giá</span>
                <span className="text-right">Tổng</span>
              </div>

              {foods.map((food, index) => (
                <div
                  key={food.id ? `${food.id}_${food.priceOptionId || index}` : index}
                  className="grid grid-cols-[1fr_40px_80px_80px] gap-2 text-xs font-semibold text-gray-700 py-1 border-b border-gray-50 last:border-0 items-center"
                >
                  <div className="pr-1">
                    <div className="font-bold text-gray-900 truncate">{food.name}</div>
                    {(food.priceOptionNote || food.price_option_note) && (
                      <div className="text-[11px] text-amber-600 font-medium">
                        Quy cách: {food.priceOptionNote || food.price_option_note}
                      </div>
                    )}
                  </div>
                  <span>{food.qty || 1}</span>
                  <span>{formatPrice(food.price)}</span>
                  <span className="text-right">
                    {formatPrice(
                      Number(food.price || 0) * Number(food.qty || 1),
                    )}
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-gray-100 flex justify-between font-black text-green-800">
                <span>Tổng tiền hàng</span>
                <span>{formatPrice(order.subtotal || order.total)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between font-black text-red-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}

              {order.shippingFee > 0 && (
                <div className="flex justify-between font-black text-gray-700">
                  <span>Phí giao hàng</span>
                  <span>{formatPrice(order.shippingFee)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-green-955 text-base">
                <span>Tổng thanh toán</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 font-bold">
              Đơn hàng không có món ăn nào.
            </p>
          )}
        </DetailBlock>

        <DetailBlock title="Lịch sử thanh toán">
          {order.payments && order.payments.length > 0 ? (
            <div className="space-y-3">
              {order.payments.map((p, idx) => (
                <div key={p.id || idx} className="bg-gray-50 p-2 rounded text-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold">{formatPrice(Number(p.amount))}</p>
                    <p className="text-xs text-gray-500">{getPaymentText(p.payment_method)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 font-bold">{getPaymentStatusText(p.payment_status)}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(p.created_at)}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between font-bold">
                <span>Đã thanh toán:</span>
                <span className="text-green-600">{formatPrice(order.totalPaid || 0)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Còn lại:</span>
                <span className="text-red-500">{formatPrice(order.remainingAmount || 0)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 font-bold mb-2">Chưa có giao dịch thanh toán.</p>
          )}

          {order.remainingAmount > 0 && !showPayForm && (
            <button
              onClick={() => setShowPayForm(true)}
              className="mt-2 w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded hover:bg-indigo-100 text-sm transition"
            >
              + Thêm thanh toán
            </button>
          )}

          {showPayForm && (
            <div className="mt-3 p-3 border border-indigo-100 rounded-lg bg-white space-y-3 shadow-sm">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Phương thức</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full border rounded p-1.5 text-sm bg-white"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Chuyển khoản</option>
                  <option value="momo">MoMo</option>
                  <option value="vnpay">VNPay</option>
                </select>
              </div>

              {payMethod === "cash" && (
                <div className="space-y-3 mt-2 border-t pt-2">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Khách đưa (VNĐ)</label>
                    <input
                      type="text"
                      value={customerGivenStr}
                      onChange={handleCustomerGivenChange}
                      placeholder="VD: 500.000"
                      className="w-full border rounded p-1.5 text-sm font-bold text-blue-600 bg-white"
                    />
                  </div>
                  {customerGivenStr && (
                    <div className="flex justify-between font-bold text-sm bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">Tiền thừa trả khách:</span>
                      <span className="text-orange-500">{formatPrice(changeAmount)}</span>
                    </div>
                  )}
                </div>
              )}

              {payMethod === "bank" && (
                <div className="flex flex-col items-center justify-center my-3 p-2 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-xs font-bold text-gray-600 mb-2">Quét mã QR để thanh toán phần còn thiếu</p>
                  <img
                    src={`https://qr.sepay.vn/img?bank=BIDV&acc=0000000002&template=compact&amount=${order.remainingAmount || 0}&des=${encodeURIComponent(order.paymentContent || (order.id ? `DH${String(order.id).replace(/\D/g, "")}` : "DH1001"))}`}
                    alt="Mã QR thanh toán"
                    className="w-40 h-40 object-contain mix-blend-multiply"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 text-center">Hệ thống sẽ tự động xác nhận khi nhận được tiền chuyển khoản.</p>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                {payMethod === "cash" && (
                  <button
                    onClick={() => {
                      if (customerGivenNumber <= 0) {
                        showAdminToast({ title: "Thiếu thông tin", message: "Vui lòng nhập số tiền khách đưa!", type: "warning" });
                        return;
                      }
                      onAddPayment(actualPayAmount, payMethod);
                    }}
                    className="flex-1 bg-indigo-600 text-white font-bold py-1.5 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Xác nhận thu tiền
                  </button>
                )}
                <button
                  onClick={() => setShowPayForm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-1.5 rounded text-sm hover:bg-gray-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </DetailBlock>

        {/* Cập nhật trạng thía đơn hàng */}
        <div
          className={`
    border-t pt-4
    ${
      order.status === "pending"
        ? "border-orange-200"
        : order.status === "confirmed"
          ? "border-blue-200"
          : order.status === "preparing"
            ? "border-purple-200"
            : order.status === "delivering"
              ? "border-amber-200"
              : order.status === "completed"
                ? "border-green-200"
                : "border-red-200"
    }
  `}
        >
          <div
            className={`
      rounded-xl p-3 border
      ${
        order.status === "pending"
          ? "bg-orange-50 border-orange-200"
          : order.status === "confirmed"
            ? "bg-blue-50 border-blue-200"
            : order.status === "preparing"
              ? "bg-purple-50 border-purple-200"
              : order.status === "delivering"
                ? "bg-amber-50 border-amber-200"
                : order.status === "completed"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
      }
    `}
          >
            <label
              className={`
        block text-xs font-black mb-2
        ${
          order.status === "pending"
            ? "text-orange-700"
            : order.status === "confirmed"
              ? "text-blue-700"
              : order.status === "preparing"
                ? "text-purple-700"
                : order.status === "delivering"
                  ? "text-amber-700"
                  : order.status === "completed"
                    ? "text-green-700"
                    : "text-red-700"
        }
      `}
            >
              🔄 Trạng thái đơn hàng
            </label>

            <select
              value={order.status || "pending"}
              onChange={(e) => onChangeStatus(e.target.value)}
              className="
        w-full
        h-11
        rounded-xl
        border
        border-white/70
        bg-white
        px-3
        text-sm
        font-black
        text-gray-800
        outline-none
        shadow-sm
      "
            >
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="preparing">Đang chuẩn bị</option>
              <option value="delivering">Đang giao</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
