import { useState, useEffect } from "react";
import { bookingService } from "../services/bookingService";
import { tableService } from "../services/tableService";
import { showAdminToast } from "../components/admin/AdminToast";
import { parsePriceNumber } from "./tableHelpers";
import { API_BASE_URL } from "../config/api";

/**
 * Custom hook quản lý logic thanh toán tại bàn:
 * - Gọi thêm món, thanh toán (tiền mặt / chuyển khoản / ví)
 * - Áp dụng mã khuyến mãi
 * - Giả lập SePay webhook
 * - Polling tự động cập nhật khi SePay thanh toán thành công
 */
export function useTablesBilling({ selectedTable, setSelectedTable, bookings, setBookings }) {
  const [activeAddItemsBooking, setActiveAddItemsBooking] = useState(null);
  const [activeBillingBooking, setActiveBillingBooking] = useState(null);
  const [cartToAdd, setCartToAdd] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [simulatedPaid, setSimulatedPaid] = useState(false);
  const [cashReceived, setCashReceived] = useState("");

  // Reset state billing khi mở modal
  useEffect(() => {
    if (activeBillingBooking) {
      setCouponCodeInput(activeBillingBooking.couponCode || "");
      if (activeBillingBooking.couponCode) {
        setAppliedCoupon({
          code: activeBillingBooking.couponCode,
          discountAmount: activeBillingBooking.discountAmount || 0,
        });
      } else {
        setAppliedCoupon(null);
      }
      setCouponMsg("");
    }
    setSimulatedPaid(false);
    setCashReceived("");
  }, [activeBillingBooking, paymentMethod]);

  // Polling SePay auto-detect
  useEffect(() => {
    if (!activeBillingBooking || activeBillingBooking.paymentStatus === "paid") return;
    const interval = setInterval(async () => {
      try {
        const apiBookings = await bookingService.getBookings();
        const currentDbBooking = apiBookings.find(
          (b) => String(b.id) === String(activeBillingBooking.id)
        );
        if (currentDbBooking && currentDbBooking.paymentStatus === "paid") {
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
            setTimeout(() => {
              const osc2 = audioCtx.createOscillator();
              osc2.connect(gain);
              osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
              osc2.start();
              osc2.stop(audioCtx.currentTime + 0.25);
            }, 120);
          } catch (e) {
            console.log("Không phát được âm thanh:", e);
          }
          showAdminToast({
            title: "Thanh toán thành công (SePay)",
            message: `Bàn đã tự động nhận thanh toán thành công số tiền ${Number(currentDbBooking.total || 0).toLocaleString("vi-VN")}đ cho đơn DB${currentDbBooking.id}.`,
          });
          setBookings(apiBookings);
          setActiveBillingBooking(currentDbBooking);
          if (selectedTable && String(selectedTable.currentBooking?.id) === String(activeBillingBooking.id)) {
            setSelectedTable((prev) => ({ ...prev, currentBooking: currentDbBooking }));
          }
        }
      } catch (err) {
        console.error("Lỗi đồng bộ hóa hóa đơn tự động:", err);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [activeBillingBooking, bookings, selectedTable]);

  const handleAddItemToTempCart = (food) => {
    const rawPrice = parsePriceNumber(food.price);
    setCartToAdd((prev) => {
      const existing = prev.find((item) => String(item.id) === String(food.id));
      if (existing) {
        return prev.map((item) =>
          String(item.id) === String(food.id) ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id: food.id, name: food.name, price: rawPrice, qty: 1, image: food.image }];
    });
  };

  const handleUpdateTempCartQty = (id, delta) => {
    setCartToAdd((prev) =>
      prev
        .map((item) =>
          String(item.id) === String(id) ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const saveAddedItems = async () => {
    if (!activeAddItemsBooking) return;
    try {
      const mergedCart = [...(activeAddItemsBooking.cartItems || [])];
      cartToAdd.forEach((toAdd) => {
        const existing = mergedCart.find((item) => String(item.id) === String(toAdd.id));
        if (existing) {
          existing.qty = Number(existing.qty || 0) + Number(toAdd.qty || 0);
        } else {
          mergedCart.push({ ...toAdd });
        }
      });
      const sanitizedCart = mergedCart.map((item) => ({
        ...item,
        price: parsePriceNumber(item.price),
      }));
      const updatedBooking = await bookingService.updateBookingItems(
        activeAddItemsBooking.id,
        sanitizedCart
      );
      setBookings((prev) =>
        prev.map((b) => String(b.id) === String(activeAddItemsBooking.id) ? updatedBooking : b)
      );
      if (selectedTable && String(selectedTable.currentBooking?.id) === String(activeAddItemsBooking.id)) {
        setSelectedTable((prev) => ({ ...prev, currentBooking: updatedBooking }));
      }
      showAdminToast({
        title: "Gọi thêm món thành công",
        message: `Đã lưu danh sách món gọi thêm cho lịch đặt DB${activeAddItemsBooking.id}.`,
      });
      setActiveAddItemsBooking(null);
      setCartToAdd([]);
    } catch (error) {
      console.error(error);
      showAdminToast({ title: "Lỗi", message: error.message || "Không thể gọi thêm món.", type: "error" });
    }
  };

  const handleCashReceivedChange = (val) => {
    const numericValue = val.replace(/\D/g, "");
    setCashReceived(numericValue === "" ? "" : Number(numericValue).toLocaleString("vi-VN"));
  };

  const applyCouponCode = async () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) { setAppliedCoupon(null); setCouponMsg("Vui lòng nhập mã."); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/deals`);
      const data = await res.json();
      if (!data.success) { setCouponMsg("Không thể tải danh sách khuyến mãi."); return; }
      const deals = data.deals || [];
      const deal = deals.find((d) => String(d.code).toUpperCase() === code);
      if (!deal) { setAppliedCoupon(null); setCouponMsg("Mã khuyến mãi không tồn tại."); return; }
      if (deal.status !== "active") { setAppliedCoupon(null); setCouponMsg("Mã khuyến mãi hiện không hoạt động."); return; }
      const subtotal = activeBillingBooking.subtotal || activeBillingBooking.total || 0;
      const minOrder = Number(deal.condition_amount || 0);
      if (subtotal < minOrder) {
        setAppliedCoupon(null);
        setCouponMsg(`Yêu cầu đơn hàng tối thiểu ${minOrder.toLocaleString("vi-VN")}đ để dùng mã này.`);
        return;
      }
      const discountText = String(deal.discount || "").trim();
      const isPercent = discountText.includes("%");
      const discountVal = isPercent
        ? Number(discountText.replace(/[^0-9]/g, ""))
        : parseFloat(discountText.replace(/[^0-9]/g, "")) || 0;
      const discountAmount = isPercent ? (subtotal * discountVal) / 100 : discountVal;
      setAppliedCoupon({
        code: deal.code, name: deal.name,
        discountType: isPercent ? "percent" : "fixed",
        percent: isPercent ? discountVal : 0,
        amount: isPercent ? 0 : discountVal,
        discountAmount,
      });
      setCouponMsg("");
    } catch (err) {
      console.error(err);
      setCouponMsg("Lỗi khi áp dụng mã.");
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeBillingBooking) return;
    const billSubtotal = activeBillingBooking.subtotal || activeBillingBooking.total || 0;
    const billDiscount = appliedCoupon ? (appliedCoupon.discountAmount || 0) : 0;
    const billTotal = Math.max(0, billSubtotal - billDiscount);
    try {
      const res = await fetch(`${API_BASE_URL}/sepay/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "MB", transactionDate: new Date().toISOString(),
          accountNumber: "SBSEPAYYQMNFSKB9F1C", transferType: "in",
          transferAmount: billTotal,
          content: `DB${activeBillingBooking.id}`,
          description: `DB${activeBillingBooking.id}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Gửi webhook giả lập thất bại.");
      setSimulatedPaid(true);
      showAdminToast({
        title: "Giao dịch thành công",
        message: `Hệ thống SePay đã ghi nhận thành công giao dịch chuyển khoản cho đơn hàng DB${activeBillingBooking.id}.`,
      });
      const apiBookings = await bookingService.getBookings();
      setBookings(apiBookings);
      const updatedBooking = apiBookings.find((b) => String(b.id) === String(activeBillingBooking.id));
      if (updatedBooking) {
        setActiveBillingBooking(updatedBooking);
        if (selectedTable && String(selectedTable.currentBooking?.id) === String(activeBillingBooking.id)) {
          setSelectedTable((prev) => ({ ...prev, currentBooking: updatedBooking }));
        }
      }
    } catch (err) {
      console.error(err);
      showAdminToast({ title: "Lỗi giả lập", message: "Không thể giả lập thanh toán SePay: " + err.message, type: "error" });
    }
  };

  const confirmPayment = async () => {
    if (!activeBillingBooking) return;
    try {
      const subtotal = activeBillingBooking.subtotal || activeBillingBooking.total || 0;
      const discountVal = appliedCoupon ? (appliedCoupon.discountAmount || 0) : 0;
      const finalTotal = Math.max(0, subtotal - discountVal);
      const updatedBooking = await bookingService.confirmBookingPayment(activeBillingBooking.id, {
        paymentMethod, paymentStatus: "paid",
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount: discountVal, total: finalTotal,
      });
      setBookings((prev) =>
        prev.map((b) => String(b.id) === String(activeBillingBooking.id) ? updatedBooking : b)
      );
      if (selectedTable && String(selectedTable.currentBooking?.id) === String(activeBillingBooking.id)) {
        setSelectedTable((prev) => ({ ...prev, currentBooking: updatedBooking }));
      }
      showAdminToast({
        title: "Thanh toán thành công",
        message: `Đã thanh toán hóa đơn lịch đặt DB${activeBillingBooking.id} bằng ${paymentMethod === "cash" ? "Tiền mặt" : paymentMethod === "bank" ? "Chuyển khoản" : "Ví điện tử"}.`,
      });
      setActiveBillingBooking(null);
      setPaymentMethod("cash");
      setCouponCodeInput("");
      setAppliedCoupon(null);
      setCouponMsg("");
    } catch (error) {
      console.error(error);
      showAdminToast({ title: "Lỗi thanh toán", message: error.message || "Không thể thanh toán.", type: "error" });
    }
  };

  return {
    activeAddItemsBooking, setActiveAddItemsBooking,
    activeBillingBooking, setActiveBillingBooking,
    cartToAdd, setCartToAdd,
    paymentMethod, setPaymentMethod,
    couponCodeInput, setCouponCodeInput,
    appliedCoupon,
    couponMsg,
    simulatedPaid,
    cashReceived,
    handleAddItemToTempCart,
    handleUpdateTempCartQty,
    saveAddedItems,
    handleCashReceivedChange,
    applyCouponCode,
    handleSimulatePayment,
    confirmPayment,
  };
}
