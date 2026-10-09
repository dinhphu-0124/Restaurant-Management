import { Link } from "react-router-dom";
import { CheckCircle, Home, ClipboardList, ReceiptText } from "lucide-react";

function OrderSuccessPage() {
  const order = JSON.parse(localStorage.getItem("currentOrder")) || {};

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
  };

  const paymentText = {
    cash: "Tiền mặt",
    bank: "Chuyển khoản ngân hàng",
    momo: "MoMo",
  };

  const orderStatusText = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    preparing: "Đang chuẩn bị",
    delivering: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
  };

  const paymentStatusText = {
    pending_payment: "Chờ chọn thanh toán",
    unpaid: "Chưa thanh toán",
    pending: "Chờ thanh toán",
    paid_pending_confirm: "Đã thanh toán",
    paid: "Đã thanh toán",
    partial: "Thanh toán một phần",
    failed: "Thanh toán thất bại",
    refunded: "Đã hoàn tiền",
  };

  const paymentNote = {
    unpaid: "Khách sẽ thanh toán khi nhận món.",
    pending: "Đang chờ khách thực hiện thanh toán.",
    paid_pending_confirm:
      "Thanh toán đã ghi nhận, đơn hàng đang chờ nhà hàng xác nhận.",
    paid: "Thanh toán đã được ghi nhận thành công.",
    partial: "Đã ghi nhận thanh toán một phần. Bạn sẽ thanh toán phần còn lại khi nhận món/tại quán.",
    failed: "Giao dịch không thành công.",
    refunded: "Giao dịch đã được hoàn tiền.",
  };

  return (
    <div className="min-h-screen bg-[#fbf7ec] flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-[#eadfcd] rounded-[32px] p-6 md:p-8 max-w-2xl w-full text-center shadow-xl">
        <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckCircle className="w-16 h-16 text-green-800" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-[#145c30] mt-5">
          Đặt hàng thành công
        </h1>

        <p className="text-gray-600 mt-3 leading-relaxed">
          Cảm ơn bạn đã đặt món tại Dê Hương Sơn.
          <br />
          Đơn hàng đang được nhà hàng xử lý.
        </p>

        <div className="mt-8 bg-[#fffaf0] border border-[#eadfcd] rounded-3xl p-6 md:p-7 text-left space-y-4">
          <Info label="Mã đơn" value={`#${order.id || "Chưa có"}`} />

          <Info
            label="Thanh toán"
            value={paymentText[order.paymentMethod] || "Chưa xác định"}
          />

          <Info
            label="Trạng thái đơn"
            value={
              orderStatusText[order.status] || order.status || "Chờ xác nhận"
            }
          />

          <Info
            label="Trạng thái thanh toán"
            value={
              paymentStatusText[order.paymentStatus] ||
              order.paymentStatus ||
              "Chờ xác nhận"
            }
          />

          {order.paymentStatus && (
            <p className="text-sm text-green-800 font-bold bg-green-50 border border-green-100 rounded-2xl px-4 py-3 leading-relaxed">
              {paymentNote[order.paymentStatus] || "Đơn hàng đang được xử lý."}
            </p>
          )}

          {order.paymentContent && (
            <Info label="Nội dung CK" value={order.paymentContent} />
          )}

          <Info label="Tổng tiền" value={formatPrice(order.total)} highlight />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <Link
            to="/profile"
            state={{ activeTab: "history" }}
            className="h-12 rounded-xl border border-[#eadfcd] text-green-900 font-black flex items-center justify-center gap-2 hover:bg-green-50"
          >
            <ClipboardList size={18} />
            Lịch sử
          </Link>

          <Link
            to="/home"
            className="h-12 rounded-xl bg-green-900 text-white font-black flex items-center justify-center gap-2 hover:bg-green-950"
          >
            <Home size={18} />
            Trang chủ
          </Link>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-500">
          <ReceiptText size={16} className="text-[#b88935]" />
          Mã đơn được lưu trong lịch sử đơn hàng.
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, highlight = false }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#eadfcd] last:border-b-0 pb-2">
      <span className="text-gray-500 font-bold">{label}</span>

      <span
        className={`font-black text-right break-all ${
          highlight ? "text-[#b88935] text-xl" : "text-green-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default OrderSuccessPage;
