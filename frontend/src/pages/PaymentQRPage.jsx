import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CheckCircle,
  Landmark,
  Wallet,
  Banknote,
  ArrowLeft,
  ShieldCheck,
  Copy,
  ReceiptText,
  Home,
  Loader2,
  Check,
  QrCode,
  AlertCircle,
} from "lucide-react";
import { bookingService } from "../services/bookingService";
import AppBadge from "../components/ui/AppBadge";
import AppButton from "../components/ui/AppButton";
import { showAdminToast } from "../components/admin/AdminToast";
import { BACKEND_URL } from "../config/api";

const API_URL = BACKEND_URL;
const getAuthToken = () => {
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
};

const clearUserSession = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("avatar");

  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("currentUser");
  sessionStorage.removeItem("avatar");

  window.dispatchEvent(new Event("authChanged"));
  window.dispatchEvent(new Event("loginStatusChanged"));
  window.dispatchEvent(new Event("avatarUpdated"));
};

function PaymentQRPage() {
  const navigate = useNavigate();

  // Lấy đơn hàng hoặc lịch đặt bàn cần cọc
  const order = JSON.parse(localStorage.getItem("currentOrder")) || {};
  const booking = JSON.parse(localStorage.getItem("currentBooking")) || {};
  const isDepositFlow = !!booking.id;

  const [currentOrder, setCurrentOrder] = useState(order);
  const [currentBooking, setCurrentBooking] = useState(booking);
  const [customAmount, setCustomAmount] = useState(
    isDepositFlow
      ? (booking.depositAmount || 200000)
      : (order.remainingAmount ?? order.total ?? 0),
  );
  const [isChecking, setIsChecking] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [copyToast, setCopyToast] = useState({
    show: false,
    message: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("bank");

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
  };

  const isMomo = paymentMethod === "momo";
  const isBank = paymentMethod === "bank";
  const isCash = paymentMethod === "cash";

  const bankInfo = {
    bankName: "BIDV",
    bankCode: "BIDV",
    accountName: "NHA HANG DE HUONG SON",
    accountNumber: "SBSEPAYYQMNFSKB9F1C",
  };

  const momoInfo = {
    phone: "0387136878",
    accountName: "NHA HANG DE HUONG SON",
  };

  const paymentContent = isDepositFlow
    ? `DB${booking.id}`
    : (currentOrder.paymentContent ||
       (currentOrder.id
         ? `DH${String(currentOrder.id).replace(/\D/g, "")}`
         : "DH1001"));

  const sepayQRUrl = `https://qr.sepay.vn/img?bank=${
    bankInfo.bankCode
  }&acc=${bankInfo.accountNumber}&template=compact&amount=${Math.round(
    Number(customAmount || 0),
  )}&des=${encodeURIComponent(paymentContent)}`;

  const changePaymentMethod = async (method) => {
    if (!currentOrder.id) return false;

    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return false;
    }

    const nextPaymentStatus = method === "cash" ? "unpaid" : "pending";
    const nextStatus = "pending";
    const updatedAt = new Date().toISOString();

    try {
      const res = await fetch(`${API_URL}/api/orders/${currentOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: method,
          paymentStatus: nextPaymentStatus,
          status: nextStatus,
          updatedAt,
        }),
      });

      const data = await res.json();

      if (data.code === "ACCOUNT_LOCKED" || data.code === "ACCOUNT_INACTIVE") {
        clearUserSession();
        navigate("/login");
        return false;
      }

      if (res.status === 401) {
        clearUserSession();
        navigate("/login");
        return false;
      }

      if (!res.ok || !data.success) {
        showAdminToast({
          title: "Lỗi thanh toán",
          message: data.message || "Không thể cập nhật phương thức thanh toán.",
          type: "error",
        });
        return false;
      }

      const serverOrder = {
        ...currentOrder,
        ...data.order,
        paymentMethod: method,
        paymentStatus: nextPaymentStatus,
        status: nextStatus,
        updatedAt,
      };

      setPaymentMethod(method);
      setCurrentOrder(serverOrder);
      localStorage.setItem("currentOrder", JSON.stringify(serverOrder));
      window.dispatchEvent(new Event("ordersUpdated"));

      return true;
    } catch (error) {
      console.error(error);
      showAdminToast({
        title: "Lỗi kết nối",
        message: "Không kết nối được backend để cập nhật thanh toán.",
        type: "error",
      });
      return false;
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedText(String(text));
      setCopyToast({
        show: true,
        message: `Đã sao chép: ${text}`,
      });

      setTimeout(() => {
        setCopiedText("");
      }, 1000);

      setTimeout(() => {
        setCopyToast({
          show: false,
          message: "",
        });
      }, 2200);
    } catch {
      setCopyToast({
        show: true,
        message: "Không thể sao chép. Vui lòng thử lại.",
      });
    }
  };

  const checkPaymentStatus = async ({ silent = false } = {}) => {
    if (isDepositFlow) {
      if (!booking.id) return;
      if (!silent) setIsChecking(true);

      try {
        const data = await bookingService.getMyBookingDetail(booking.id);
        if (
          data &&
          (data.paymentStatus === "paid" ||
            data.status === "confirmed" ||
            data.status === "serving")
        ) {
          localStorage.setItem("currentBooking", JSON.stringify(data));
          localStorage.removeItem("cartItems");
          localStorage.removeItem("checkoutSummary");
          localStorage.removeItem("appliedCoupon");
          localStorage.removeItem("checkoutForm");
          localStorage.removeItem("bookingForm");
          localStorage.removeItem("bookingSelectedArea");
          localStorage.removeItem("bookingSelectedTable");

          window.dispatchEvent(new Event("cartUpdated"));
          navigate("/booking-success");
          return;
        }

        if (!silent) {
          showAdminToast({
            title: "Chưa ghi nhận cọc",
            message: "Chưa ghi nhận tiền cọc. Vui lòng chuyển khoản đúng nội dung và số tiền trên mã QR.",
            type: "warning",
          });
        }
      } catch (error) {
        console.error("Lỗi kiểm tra cọc đặt bàn:", error);
        if (!silent) {
          showAdminToast({
            title: "Lỗi kiểm tra cọc",
            message: error.message || "Lỗi kiểm tra trạng thái cọc đặt bàn.",
            type: "error",
          });
        }
      } finally {
        if (!silent) setIsChecking(false);
      }
      return;
    }

    if (!currentOrder.id) return;
    if (!silent) setIsChecking(true);

    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/orders/me/${currentOrder.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.code === "ACCOUNT_LOCKED" || data.code === "ACCOUNT_INACTIVE") {
        clearUserSession();
        navigate("/login");
        return;
      }

      if (res.status === 401) {
        clearUserSession();
        navigate("/login");
        return;
      }

      if (res.status === 403) {
        if (!silent) {
          showAdminToast({
            title: "Không có quyền",
            message: data.message || "Bạn không có quyền xem đơn hàng này.",
            type: "error",
          });
        }
        return;
      }

      if (!data.success) {
        if (!silent) {
          showAdminToast({
            title: "Không tìm thấy",
            message: "Chưa tìm thấy đơn hàng trên hệ thống.",
            type: "warning",
          });
        }
        return;
      }

      const updatedOrder = {
        ...currentOrder,
        ...data.order,
        total: data.order.total ?? currentOrder.total,
        subtotal: data.order.subtotal ?? currentOrder.subtotal,
        shippingFee: data.order.shippingFee ?? currentOrder.shippingFee,
        discountTotal: data.order.discountTotal ?? currentOrder.discountTotal,
        serviceType: data.order.serviceType ?? currentOrder.serviceType,
        paymentMethod: data.order.paymentMethod ?? currentOrder.paymentMethod,
        paymentContent:
          data.order.paymentContent ?? currentOrder.paymentContent,
      };

      setCurrentOrder(updatedOrder);
      localStorage.setItem("currentOrder", JSON.stringify(updatedOrder));

      if (data.order.paymentStatus === "paid" || data.order.paymentStatus === "partial") {
        localStorage.removeItem("cartItems");
        localStorage.removeItem("checkoutSummary");
        localStorage.removeItem("appliedCoupon");
        localStorage.removeItem("checkoutForm");

        window.dispatchEvent(new Event("cartUpdated"));
        navigate("/order-success");
        return;
      }

      if (!silent) {
        showAdminToast({
          title: "Chưa ghi nhận thanh toán",
          message: "Chưa ghi nhận thanh toán. Vui lòng hoàn tất chuyển khoản và thử lại.",
          type: "warning",
        });
      }
    } catch (error) {
      console.error(error);
      if (!silent) {
        showAdminToast({
          title: "Lỗi kết nối",
          message: "Không kết nối được máy chủ.",
          type: "error",
        });
      }
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!isDepositFlow && !currentOrder.id) return;
    if (isMomo || isCash) return;

    const interval = setInterval(() => {
      checkPaymentStatus({ silent: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentOrder.id, booking.id, isDepositFlow, isMomo, isCash, navigate]);

  if (!currentOrder.id && !isDepositFlow) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Không có thông tin thanh toán
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-2">
            Vui lòng tạo đơn hàng hoặc đăng ký đặt bàn trước khi thanh toán.
          </p>
          <AppButton
            variant="primary"
            onClick={() => navigate("/home")}
            className="mt-6 mx-auto"
          >
            Về trang chủ
          </AppButton>
        </div>
      </div>
    );
  }

  const paymentStatusText = {
    pending_payment: "Chờ chọn thanh toán",
    unpaid: "Chưa thanh toán",
    pending: "Chờ chuyển khoản",
    paid_pending_confirm: "Đã thanh toán",
    paid: "Đã thanh toán thành công",
    failed: "Thanh toán thất bại",
    refunded: "Đã hoàn tiền",
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        <button
          type="button"
          onClick={() => navigate(isDepositFlow ? "/booking" : "/checkout")}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-700 font-bold text-xs sm:text-sm mb-6 transition"
        >
          <ArrowLeft size={16} />
          {isDepositFlow ? "Quay lại đặt bàn" : "Quay lại thanh toán"}
        </button>

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
            {isCash ? (
              <Banknote size={28} />
            ) : isMomo ? (
              <Wallet size={28} />
            ) : (
              <Landmark size={28} />
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#145c30] tracking-tight">
              {isCash
                ? "Thanh toán tiền mặt"
                : isMomo
                ? "Thanh toán ví điện tử MoMo"
                : "Thanh toán chuyển khoản ngân hàng (QR)"}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
              {isCash
                ? "Đơn hàng sẽ được thanh toán khi nhận món hoặc dùng bữa tại quán."
                : "Quét mã QR qua ứng dụng ngân hàng, hệ thống sẽ tự động xác nhận sau khi nhận tiền."}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
          {/* LEFT: PAYMENT DETAILS & QR */}
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* 1. Payment Method Tabs */}
            <div className="p-5 sm:p-6 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-3.5">
                1. Chọn phương thức thanh toán
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <PaymentMethodTab
                  active={paymentMethod === "bank"}
                  icon={<Landmark className="w-5 h-5" />}
                  title="Ngân hàng"
                  desc="Quét mã QR tự động"
                  onClick={() => changePaymentMethod("bank")}
                />

                <PaymentMethodTab
                  active={paymentMethod === "momo"}
                  icon={<Wallet className="w-5 h-5" />}
                  title="Ví MoMo"
                  desc="Ví điện tử MoMo"
                  onClick={() => changePaymentMethod("momo")}
                />

                <PaymentMethodTab
                  active={paymentMethod === "cash"}
                  icon={<Banknote className="w-5 h-5" />}
                  title="Tiền mặt"
                  desc="Thanh toán khi nhận"
                  onClick={() => changePaymentMethod("cash")}
                />
              </div>
            </div>

            {/* 2. QR / Content Display */}
            <div className="p-5 sm:p-6">
              {isCash ? (
                <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
                    <Banknote className="w-10 h-10" />
                  </div>

                  <h2 className="text-xl font-extrabold text-slate-900">
                    Xác nhận thanh toán tiền mặt
                  </h2>

                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
                    Bạn sẽ thanh toán trực tiếp số tiền{" "}
                    <strong className="text-amber-700">
                      {formatPrice(currentOrder.total)}
                    </strong>{" "}
                    cho nhân viên khi nhận món hoặc khi đến lấy tại quán.
                  </p>

                  <AppButton
                    variant="primary"
                    size="lg"
                    onClick={async () => {
                      const success = await changePaymentMethod("cash");
                      if (!success) return;

                      localStorage.removeItem("cartItems");
                      localStorage.removeItem("checkoutSummary");
                      localStorage.removeItem("appliedCoupon");
                      localStorage.removeItem("checkoutForm");

                      window.dispatchEvent(new Event("cartUpdated"));
                      window.dispatchEvent(new Event("ordersUpdated"));
                      navigate("/order-success");
                    }}
                    className="mt-6"
                  >
                    Xác nhận đặt hàng ngay
                  </AppButton>
                </div>
              ) : (
                <div className="grid md:grid-cols-[340px_1fr] gap-6 items-center">
                  {/* QR Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <div className="w-full mb-3">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Số tiền thanh toán (VNĐ)
                      </label>
                      <input
                        type="text"
                        value={customAmount ? Number(customAmount).toLocaleString("vi-VN") : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCustomAmount(val ? Number(val) : "");
                        }}
                        className="w-full h-11 border border-slate-200 rounded-xl px-3 font-extrabold text-center text-emerald-800 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none text-base"
                      />
                    </div>

                    <div className="w-[260px] h-[260px] rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xs">
                      {isMomo ? (
                        <div className="text-center p-4">
                          <Wallet className="w-12 h-12 text-amber-600 mx-auto" />
                          <p className="font-extrabold text-slate-900 text-sm mt-3">
                            MOMO DEMO QR
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Demo MoMo test mode
                          </p>
                        </div>
                      ) : (
                        <img
                          src={sepayQRUrl}
                          alt="Mã QR thanh toán SePay"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {!isMomo && (
                      <div className="mt-3.5 w-full rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 text-[11px] font-semibold leading-relaxed text-left flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>Giữ nguyên đúng nội dung chuyển khoản để hệ thống đối soát tự động.</span>
                      </div>
                    )}
                  </div>

                  {/* Account Information Copy Rows */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-slate-100">
                      <ReceiptText className="w-4 h-4 text-emerald-700" />
                      Thông tin chuyển khoản
                    </h3>

                    {isMomo ? (
                      <>
                        <InfoActionRow
                          label="Số điện thoại MoMo"
                          value={momoInfo.phone}
                          copiedValue={momoInfo.phone}
                          copiedText={copiedText}
                          onCopy={() => copyText(momoInfo.phone)}
                        />
                        <InfoActionRow
                          label="Tên tài khoản"
                          value={momoInfo.accountName}
                        />
                      </>
                    ) : (
                      <>
                        <InfoActionRow
                          label="Ngân hàng"
                          value={bankInfo.bankName}
                        />

                        <InfoActionRow
                          label="Số tài khoản"
                          value={bankInfo.accountNumber}
                          copiedValue={bankInfo.accountNumber}
                          copiedText={copiedText}
                          onCopy={() => copyText(bankInfo.accountNumber)}
                        />

                        <InfoActionRow
                          label="Chủ tài khoản"
                          value={bankInfo.accountName}
                        />
                      </>
                    )}

                    <InfoActionRow
                      label="Số tiền"
                      value={formatPrice(customAmount)}
                      copiedValue={Math.round(Number(customAmount || 0))}
                      highlight
                      copiedText={copiedText}
                      onCopy={() => copyText(Math.round(Number(customAmount || 0)))}
                    />

                    <InfoActionRow
                      label="Nội dung CK"
                      value={paymentContent}
                      copiedValue={paymentContent}
                      strong
                      copiedText={copiedText}
                      onCopy={() => copyText(paymentContent)}
                    />

                    <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                        Hệ thống tự động lắng nghe giao dịch 24/7 qua cổng SePay. Trang sẽ tự động chuyển sau vài giây khi hoàn tất.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: ORDER SUMMARY */}
          <aside className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 md:p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-900 text-base uppercase tracking-wide">
                Tóm tắt đơn
              </h2>
              <AppBadge
                variant={
                  isDepositFlow
                    ? (booking.paymentStatus === "paid" ? "success" : "warning")
                    : (currentOrder.paymentStatus === "paid" ? "success" : "warning")
                }
                size="sm"
                pill
              >
                {isDepositFlow
                  ? (booking.paymentStatus === "paid" || booking.status === "confirmed" ? "Đã cọc" : "Chờ cọc")
                  : (paymentStatusText[currentOrder.paymentStatus] || "Chờ thanh toán")}
              </AppBadge>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Mã tham chiếu:</span>
                <strong className="text-slate-900 font-bold">
                  {isDepositFlow ? `DB${booking.id}` : `#${currentOrder.id || "..."}`}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Hình thức:</span>
                <strong className="text-slate-900 font-bold">
                  {isDepositFlow
                    ? "Đặt cọc giữ bàn"
                    : currentOrder.serviceType === "delivery"
                    ? "Giao tận nơi"
                    : "Đến lấy tại quán"}
                </strong>
              </div>

              {isDepositFlow && (
                <>
                  <div className="flex justify-between">
                    <span>Khách đặt:</span>
                    <strong className="text-slate-900">{booking.customerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian:</span>
                    <strong className="text-slate-900">
                      {booking.date ? booking.date.split("-").reverse().join("/") : ""} ({booking.time})
                    </strong>
                  </div>
                </>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="font-extrabold text-slate-900">
                  {isDepositFlow ? "Tiền cọc cần thanh toán:" : "Tổng số tiền:"}
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-700">
                  {formatPrice(customAmount)}
                </span>
              </div>
            </div>

            {/* Verification Button */}
            {!isCash && (
              <button
                type="button"
                onClick={() => checkPaymentStatus()}
                disabled={isChecking || isMomo}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang kiểm tra giao dịch...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Kiểm tra trạng thái thanh toán
                  </>
                )}
              </button>
            )}

            <Link to="/home" className="block">
              <AppButton
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<Home className="w-4 h-4" />}
                className="text-xs font-bold"
              >
                Về trang chủ
              </AppButton>
            </Link>
          </aside>
        </div>
      </div>

      {/* Copy Toast */}
      {copyToast.show && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-slate-900 text-white shadow-xl rounded-2xl px-4 py-2.5 flex items-center gap-2.5 text-xs font-semibold animate-slide-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{copyToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentMethodTab({ active, icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-3 text-center transition-all duration-200 cursor-pointer ${
        active
          ? "border-emerald-600 bg-emerald-50/70 text-emerald-800 shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${active ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>
        {icon}
      </div>
      <p className="font-extrabold text-xs leading-snug">{title}</p>
      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{desc}</p>
    </button>
  );
}

function InfoActionRow({
  label,
  value,
  copiedValue,
  highlight = false,
  strong = false,
  copiedText = "",
  onCopy,
}) {
  const isCopied = String(copiedValue ?? value) === String(copiedText);

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-b-0 text-xs sm:text-sm">
      <span className="text-slate-500 font-medium">{label}:</span>

      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`font-extrabold text-right truncate ${
            highlight
              ? "text-amber-700 text-base"
              : strong
              ? "text-emerald-700 font-black"
              : "text-slate-900"
          }`}
        >
          {value}
        </span>

        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            title="Sao chép"
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
              isCopied
                ? "bg-emerald-600 text-white border-emerald-600 scale-105"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {isCopied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default PaymentQRPage;
