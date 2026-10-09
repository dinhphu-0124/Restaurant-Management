import React from "react";
import { X, Printer, Wallet } from "lucide-react";

export default function AdminBillingModal({
  activeBillingBooking,
  setActiveBillingBooking,
  appliedCoupon,
  applyCouponCode,
  couponCodeInput,
  setCouponCodeInput,
  couponMsg,
  paymentMethod,
  setPaymentMethod,
  simulatedPaid,
  cashReceived,
  handleCashReceivedChange,
  setCashReceived,
  formatDate,
  formatDateTime,
  handleSimulatePayment,
  confirmPayment,
}) {
  if (!activeBillingBooking) return null;

  const billSubtotal = activeBillingBooking.subtotal || activeBillingBooking.total || 0;
  const billDiscount = activeBillingBooking.paymentStatus === "paid"
    ? (activeBillingBooking.discountAmount || 0)
    : (appliedCoupon ? (appliedCoupon.discountAmount || 0) : 0);
  const billTotal = activeBillingBooking.paymentStatus === "paid"
    ? (activeBillingBooking.total || 0)
    : Math.max(0, billSubtotal - billDiscount);

  const parsedCashReceived = Number(String(cashReceived).replace(/\D/g, ""));
  const isEnoughCash = parsedCashReceived >= billTotal;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 text-left">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-green-50/20">
          <div>
            <h3 className="text-lg font-black text-green-955">
              Hóa đơn tạm tính / Thanh toán
            </h3>
          </div>
          <button
            onClick={() => {
              setActiveBillingBooking(null);
              setPaymentMethod("cash");
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Bill Receipt Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" id="printable-bill">
          {/* Receipt Header */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-green-955">NHÀ HÀNG DÊ HƯƠNG SƠN HÀ TĨNH</h2>
            <p className="text-[10px] text-gray-400 font-extrabold">Đ. Vũ Lăng, Thanh Trì, Hà Nội</p>
            <p className="text-[10px] text-gray-400 font-extrabold">Hotline: 038 713 6878</p>
            <div className="border-b border-dashed border-gray-200 pt-3"></div>
          </div>

          {/* Receipt Meta */}
          <div className="grid grid-cols-2 gap-y-2 text-xs font-bold text-gray-600">
            <div>
              <span className="text-gray-400">Mã đặt bàn:</span>{" "}
              <span className="text-green-955 font-black">DB{activeBillingBooking.id}</span>
            </div>
            <div>
              <span className="text-gray-400">Mã bàn:</span>{" "}
              <span className="text-green-955 font-black">{activeBillingBooking.selectedTable}</span>
            </div>
            <div>
              <span className="text-gray-400">Khu vực:</span>{" "}
              <span>{activeBillingBooking.selectedAreaTitle}</span>
            </div>
            <div>
              <span className="text-gray-400">Khách hàng:</span>{" "}
              <span>{activeBillingBooking.customerName || activeBillingBooking.name}</span>
            </div>
            <div>
              <span className="text-gray-400">SĐT:</span>{" "}
              <span>{activeBillingBooking.phone}</span>
            </div>
            <div>
              <span className="text-gray-400">Ngày đặt:</span>{" "}
              <span>{formatDate(activeBillingBooking.date)}</span>
            </div>
            <div>
              <span className="text-gray-400">Giờ đặt:</span>{" "}
              <span>{activeBillingBooking.time}</span>
            </div>
            <div>
              <span className="text-gray-400">Giờ in bill:</span>{" "}
              <span>{new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-dashed border-gray-200 py-3">
            <table className="w-full text-left text-xs font-bold text-gray-600">
              <thead>
                <tr className="text-green-955 font-black border-b border-gray-100 pb-2">
                  <th className="pb-2">Tên món</th>
                  <th className="text-center pb-2 w-12">SL</th>
                  <th className="text-right pb-2 w-20">Đơn giá</th>
                  <th className="text-right pb-2 w-24">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {activeBillingBooking.cartItems && activeBillingBooking.cartItems.length > 0 ? (
                  activeBillingBooking.cartItems.map((item, idx) => (
                    <tr key={item.id ? `${item.id}_${item.priceOptionId || idx}` : idx} className="border-b border-gray-50/50 last:border-0">
                      <td className="py-2.5 pr-2 leading-tight">
                        <div className="font-black text-green-955">{item.name}</div>
                        {(item.priceOptionNote || item.price_option_note) && (
                          <div className="text-[10px] text-amber-700 font-semibold">
                            Quy cách: {item.priceOptionNote || item.price_option_note}
                          </div>
                        )}
                      </td>
                      <td className="text-center py-2.5">{item.qty}</td>
                      <td className="text-right py-2.5">{Number(item.price || 0).toLocaleString("vi-VN")}đ</td>
                      <td className="text-right py-2.5 font-black text-gray-700">
                        {Number((item.price || 0) * (item.qty || 0)).toLocaleString("vi-VN")}đ
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-400 font-bold">Khách chưa gọi món.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs text-right font-bold text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400">Tạm tính:</span>
              <span>{billSubtotal.toLocaleString("vi-VN")}đ</span>
            </div>
            {billDiscount > 0 && (
              <div className="flex justify-between text-red-600 font-extrabold">
                <span className="text-gray-400">Khuyến mãi ({appliedCoupon?.code || activeBillingBooking.couponCode || ""}):</span>
                <span>-{billDiscount.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-green-955 border-t border-dashed border-gray-200 pt-2">
              <span>Tổng thanh toán:</span>
              <span>{billTotal.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          {/* Payment Status Info */}
          {activeBillingBooking.paymentStatus === "paid" && (
            <div className="p-3 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              <span className="text-xs font-black text-green-700">
                Đã thanh toán bằng {activeBillingBooking.paymentMethod === 'cash' ? 'Tiền mặt' : activeBillingBooking.paymentMethod === 'bank' ? 'Chuyển khoản' : 'Ví điện tử'} lúc {formatDateTime(activeBillingBooking.paidAt)}
              </span>
            </div>
          )}
        </div>

        {/* Bill Footer / Payment actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4 shrink-0">
          {activeBillingBooking.paymentStatus !== "paid" && (
            <div className="space-y-3">
              {/* Coupon Code Input */}
              <div className="space-y-2 pb-3 border-b border-gray-200/60">
                <span className="text-xs font-black text-green-955 block">Nhập mã khuyến mãi (nếu có):</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: GIAM10, COMBO50..."
                    className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-xs font-black uppercase placeholder:normal-case placeholder-gray-400 focus:outline-none focus:border-green-600 bg-white transition"
                  />
                  <button
                    onClick={applyCouponCode}
                    className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-black transition shrink-0"
                  >
                    Áp dụng
                  </button>
                </div>
                {couponMsg && (
                  <p className="text-[10px] font-black text-red-500">{couponMsg}</p>
                )}
                {appliedCoupon && !couponMsg && (
                  <p className="text-[10px] font-black text-green-600">
                    Áp dụng thành công mã {appliedCoupon.code} - Giảm {appliedCoupon.discountAmount.toLocaleString("vi-VN")}đ
                  </p>
                )}
              </div>

              <span className="text-xs font-black text-green-955 block">Chọn phương thức thanh toán:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`h-11 rounded-xl text-xs font-black border transition ${paymentMethod === "cash"
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  Tiền mặt
                </button>
                <button
                  onClick={() => setPaymentMethod("bank")}
                  className={`h-11 rounded-xl text-xs font-black border transition ${paymentMethod === "bank"
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  Chuyển khoản
                </button>
                <button
                  onClick={() => setPaymentMethod("momo")}
                  className={`h-11 rounded-xl text-xs font-black border transition ${paymentMethod === "momo"
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  Ví điện tử (Momo)
                </button>
              </div>

              {paymentMethod !== "cash" && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-3 flex flex-col items-center">
                  <span className="text-xs font-black text-amber-900 self-start">Thông tin chuyển khoản:</span>

                  {paymentMethod === "bank" ? (
                    <>
                      <div className="w-48 h-48 bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-sm">
                        <img
                          src={`https://qr.sepay.vn/img?bank=BIDV&acc=SBSEPAYYQMNFSKB9F1C&template=compact&amount=${Math.round(billTotal)}&des=DB${activeBillingBooking.id}`}
                          alt="VietQR Sepay"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-[10px] font-bold text-gray-600 text-center space-y-0.5">
                        <p><span className="text-gray-400">Ngân hàng:</span> BIDV</p>
                        <p><span className="text-gray-400">Số tài khoản:</span> SBSEPAYYQMNFSKB9F1C</p>
                        <p><span className="text-gray-400">Chủ tài khoản:</span> NHA HANG DE HUONG SON HA TINH</p>
                        <p><span className="text-gray-400">Nội dung chuyển khoản:</span> <strong className="text-red-600">DB{activeBillingBooking.id}</strong></p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-48 h-48 bg-[#fce8ef] border border-[#f5b8cc] rounded-xl flex flex-col items-center justify-center p-4 text-center shadow-sm">
                        <Wallet className="w-12 h-12 text-[#ae2070]" />
                        <p className="font-black text-[#ae2070] text-sm mt-3">MOMO PAYMENT DEMO</p>
                        <p className="text-[10px] text-gray-500 mt-1">Sử dụng QR chuyển nhanh Momo</p>
                      </div>
                      <div className="text-[10px] font-bold text-gray-600 text-center space-y-0.5">
                        <p><span className="text-gray-400">Số điện thoại MoMo:</span> 038 713 6878</p>
                        <p><span className="text-gray-400">Chủ tài khoản:</span> DÊ HƯƠNG SƠN HÀ TĨNH</p>
                        <p><span className="text-gray-400">Nội dung:</span> <strong className="text-red-600">DB{activeBillingBooking.id}</strong></p>
                      </div>
                    </>
                  )}

                  {!simulatedPaid ? (
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black transition text-xs flex items-center justify-center gap-1.5"
                    >
                      Giả lập nhận tiền thành công (SePay)
                    </button>
                  ) : (
                    <div className="w-full p-2.5 bg-green-50 border border-green-200 rounded-xl flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-green-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <strong className="text-xs font-black">Sepay Notification:</strong>
                      </div>
                      <p className="text-[10px] font-bold text-primary leading-tight">
                        Đã nhận {billTotal.toLocaleString("vi-VN")}đ từ tài khoản khách hàng. Nội dung: DB{activeBillingBooking.id}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-black text-green-955 block">Nhận tiền mặt từ khách:</span>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={cashReceived}
                        onChange={(e) => handleCashReceivedChange(e.target.value)}
                        placeholder="Nhập số tiền khách đưa..."
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-xs font-black placeholder-gray-400 focus:outline-none focus:border-green-600 bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setCashReceived(billTotal.toLocaleString("vi-VN"))}
                        className="h-10 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black transition shrink-0"
                      >
                        Đưa đủ
                      </button>
                    </div>
                    {cashReceived && (
                      <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-dashed border-gray-200">
                        <span className="text-gray-500">Trạng thái / Tiền thừa:</span>
                        <span className={`text-sm font-black ${isEnoughCash ? "text-green-700" : "text-red-600 animate-pulse"}`}>
                          {isEnoughCash
                            ? `Thừa: ${(parsedCashReceived - billTotal).toLocaleString("vi-VN")}đ`
                            : "Chưa đủ tiền"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="h-11 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 font-bold text-gray-600 transition flex items-center justify-center gap-1.5 text-xs"
            >
              <Printer size={16} />
              In Bill
            </button>
            {activeBillingBooking.paymentStatus !== "paid" ? (
              <button
                onClick={confirmPayment}
                disabled={
                  (paymentMethod !== "cash" && !simulatedPaid) ||
                  (paymentMethod === "cash" && (cashReceived === "" || Number(String(cashReceived).replace(/\D/g, "")) < billTotal))
                }
                className="flex-1 h-11 rounded-xl bg-green-700 text-white font-black hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs"
              >
                Xác nhận thanh toán
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveBillingBooking(null);
                  setPaymentMethod("cash");
                }}
                className="flex-1 h-11 rounded-xl bg-green-700 text-white font-black hover:bg-green-800 transition text-xs"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
