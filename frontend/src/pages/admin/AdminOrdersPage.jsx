import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { showAdminToast } from "../../components/admin/AdminToast";
import { removeVietnameseTones, calculateSearchScore } from "../../utils/string";
import { getCurrentUser, getAuthToken } from "../../utils/auth";
import { socket } from "../../utils/socket";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import {
  getStatusTextOrder, getStatusStyleOrder, getServiceText,
  getPaymentText, getPaymentStatusText,
  formatPriceOrder, formatDateTimeOrder, hasVietnameseTone,
} from "../../utils/orderHelpers";
import {
  OrderDetailPanel, DetailBlock, DetailRow,
} from "../../components/admin/AdminOrderComponents";
import GlobalPagination from "../../components/admin/GlobalPagination";
import {
  ShoppingBag, Clock3, CheckCircle, XCircle, Truck, Wallet,
  Search, Pencil, Trash2, RotateCcw, CalendarDays,
  Store, Utensils, CreditCard, Landmark,
} from "lucide-react";

const API_URL = "http://localhost:5001/api/orders";
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getServiceIcon = (type) => {
  switch (type) {
    case "delivery": return <Truck size={18} className="text-green-600" />;
    case "pickup": return <Store size={18} className="text-green-600" />;
    case "dinein": return <Utensils size={18} className="text-green-600" />;
    default: return <Utensils size={18} className="text-gray-500" />;
  }
};

const getPaymentIcon = (method) => {
  switch (method) {
    case "bank": return <Landmark size={18} className="text-blue-600" />;
    case "momo": return <Wallet size={18} className="text-pink-500" />;
    case "vnpay": return <CreditCard size={18} className="text-blue-500" />;
    default: return <Wallet size={18} className="text-gray-500" />;
  }
};

function AdminOrdersPage() {
  const currentUser = getCurrentUser();
  const { setExportExcelHandler, globalSearch, dateRange, dateMode, dateLabel } = useOutletContext();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  // ─── State ────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null);
  const [editForm, setEditForm] = useState({ status: "pending", paymentMethod: "", note: "" });

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) setStatusFilter(statusParam);
  }, [searchParams]);

  // ─── Load Orders ──────────────────────────────────────────────────
  const loadOrders = () => {
    fetch(API_URL, { headers: { ...getAuthHeaders() } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.orders);
          const viewId = searchParams.get("view");
          if (viewId) {
            const orderToView = data.orders.find((o) => String(o.id) === String(viewId));
            if (orderToView) setSelectedOrder(orderToView);
          }
        }
      })
      .catch((error) => console.error("Không lấy được đơn hàng:", error));
  };

  useEffect(() => {
    loadOrders();
    const handleOrderChange = () => loadOrders();
    window.addEventListener("ordersUpdated", handleOrderChange);
    socket.on("new_order", handleOrderChange);
    socket.on("order_updated", handleOrderChange);
    return () => {
      window.removeEventListener("ordersUpdated", handleOrderChange);
      socket.off("new_order", handleOrderChange);
      socket.off("order_updated", handleOrderChange);
    };
  }, [searchParams]);

  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find((o) => String(o.id) === String(selectedOrder.id));
      if (updatedOrder && JSON.stringify(updatedOrder) !== JSON.stringify(selectedOrder)) {
        if (updatedOrder.totalPaid > (selectedOrder.totalPaid || 0)) {
          showAdminToast({ title: "Thanh toán nhận được", message: "Khách hàng vừa chuyển khoản cho đơn hàng này!", type: "success" });
        }
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrder]);

  // ─── Stats ────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((sum, item) => sum + Number(item.total || item.totalPrice || 0), 0);
  const pendingCount = orders.filter((item) => ["Chờ xác nhận", "Chờ xử lý"].includes(getStatusTextOrder(item.status))).length;
  const preparingCount = orders.filter((item) => getStatusTextOrder(item.status) === "Đang chuẩn bị").length;
  const deliveringCount = orders.filter((item) => getStatusTextOrder(item.status) === "Đang giao").length;
  const completedCount = orders.filter((item) => getStatusTextOrder(item.status) === "Hoàn thành").length;
  const cancelledCount = orders.filter((item) => getStatusTextOrder(item.status) === "Đã hủy").length;

  // ─── Filters ──────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const rawKeyword = String(globalSearch || search || "").trim().replace("#", "");

    const scored = orders
      .map((order) => {
        let matchDate = true;
        if (dateRange?.startDate || dateRange?.endDate) {
          const orderDate = new Date(order.createdAt);
          const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
          const end = dateRange.endDate ? new Date(dateRange.endDate) : null;
          if (start) start.setHours(0, 0, 0, 0);
          if (end) end.setHours(23, 59, 59, 999);
          matchDate = (!start || orderDate >= start) && (!end || orderDate <= end);
        }

        const matchService = serviceType === "all" || order.serviceType === serviceType;
        const matchPayment = paymentMethod === "all" || order.paymentMethod === paymentMethod;
        const matchStatus = statusFilter === "all" || getStatusTextOrder(order.status) === statusFilter || order.status === statusFilter;
        const matchTab = activeTab === "all" || (activeTab === "dinein" && order.serviceType === "dinein") || (activeTab === "food" && order.serviceType === "delivery") || (activeTab === "pickup" && order.serviceType === "pickup") || (activeTab === "cancelled" && getStatusTextOrder(order.status) === "Đã hủy");

        if (!matchDate || !matchService || !matchPayment || !matchStatus || !matchTab) return null;

        const score = rawKeyword ? calculateSearchScore({
          customerName: order.customerName || order.fullName || order.name,
          phone: order.phone,
          orderCode: String(order.id || order.orderCode || ""),
          id: order.id,
          tableName: order.tableName,
          notes: order.notes || (order.items || []).map((i) => i.foodName || i.name).join(" ")
        }, rawKeyword) : 1;

        if (score === 0) return null;
        return { order, score };
      })
      .filter(Boolean);

    if (rawKeyword) {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored.map((s) => s.order);
  }, [orders, search, globalSearch, dateRange, serviceType, paymentMethod, statusFilter, activeTab]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = useMemo(() => filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredOrders, currentPage, pageSize]);

  useEffect(() => setCurrentPage(1), [search, globalSearch, dateRange, serviceType, paymentMethod, statusFilter, activeTab, pageSize]);
  const resetFilter = () => { setSearch(""); setServiceType("all"); setPaymentMethod("all"); setStatusFilter("all"); setActiveTab("all"); };

  // ─── Excel Export ─────────────────────────────────────────────────
  const formatFileDate = (value) => { if (!value) return ""; const [year, month, day] = value.split("-"); return `${day}-${month}-${year}`; };
  const getOrderMonth = (order) => { const date = new Date(order.createdAt); if (Number.isNaN(date.getTime())) return null; return date.getMonth() + 1; };
  const getExcelFileName = () => {
    if (dateMode === "month" && dateLabel) return `DonHang_${dateLabel.replaceAll(" ", "_").replaceAll("/", "_")}.xlsx`;
    if (dateMode === "year" && dateLabel) return `DonHang_${dateLabel.replaceAll(" ", "_")}.xlsx`;
    if (dateMode === "week" && dateLabel) return `DonHang_Tuan_${formatFileDate(dateRange.startDate)}_den_${formatFileDate(dateRange.endDate)}.xlsx`;
    if (dateRange?.startDate && dateRange?.endDate) return `DonHang_${formatFileDate(dateRange.startDate)}_den_${formatFileDate(dateRange.endDate)}.xlsx`;
    return "DonHang_TatCa.xlsx";
  };
  const mapOrderToExcelRow = (order, index) => ({ STT: index + 1, "Mã đơn": order.id || "", "Khách hàng": order.customerName || order.fullName || order.name || "", "Số điện thoại": order.phone || "", "Loại phục vụ": getServiceText(order.serviceType), "Phương thức thanh toán": getPaymentText(order.paymentMethod), "Tổng tiền": Number(order.total || order.totalPrice || 0), "Trạng thái": getStatusTextOrder(order.status), "Ngày tạo": formatDateTimeOrder(order.createdAt) });
  const setSheetColumnWidths = (worksheet, widths) => { worksheet["!cols"] = widths.map((width) => ({ wch: width })); };
  const formatMoneyColumn = (worksheet, columnIndex) => {
    if (!worksheet["!ref"]) return;
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: columnIndex });
      if (worksheet[cellAddress]) worksheet[cellAddress].z = '#,##0 "₫"';
    }
  };
  const styleWorksheet = (worksheet, { centerCols = [], rightCols = [], boldRows = [] } = {}) => {
    if (!worksheet["!ref"]) return;
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cell]) continue;
        const isBoldRow = boldRows.includes(row);
        let horizontal = "left";
        if (isBoldRow || centerCols.includes(col)) horizontal = "center";
        else if (rightCols.includes(col)) horizontal = "right";
        worksheet[cell].s = { ...worksheet[cell].s, font: { ...(worksheet[cell].s?.font || {}), bold: isBoldRow }, alignment: { ...(worksheet[cell].s?.alignment || {}), horizontal, vertical: "center" } };
      }
    }
  };

  const exportToExcel = () => {
    if (dateMode === "year" && dateRange?.startDate && dateRange?.endDate) {
      // Year export
      const workbook = XLSX.utils.book_new();
      const summaryData = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const monthOrders = filteredOrders.filter((order) => getOrderMonth(order) === month);
        const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.total || order.totalPrice || 0), 0);
        return { Tháng: `Tháng ${month}`, "Số đơn": monthOrders.length, "Tổng tiền": monthRevenue };
      });
      const totalOrdersInYear = summaryData.reduce((sum, item) => sum + Number(item["Số đơn"] || 0), 0);
      const totalRevenueInYear = summaryData.reduce((sum, item) => sum + Number(item["Tổng tiền"] || 0), 0);
      summaryData.push({ Tháng: "", "Số đơn": "", "Tổng tiền": "" });
      summaryData.push({ Tháng: "Tổng cộng", "Số đơn": totalOrdersInYear, "Tổng tiền": totalRevenueInYear });
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      formatMoneyColumn(summarySheet, 2);
      setSheetColumnWidths(summarySheet, [16, 12, 24]);
      const totalRowIndex = summaryData.findIndex((item) => item.Tháng === "Tổng cộng");
      styleWorksheet(summarySheet, { centerCols: [0, 1], rightCols: [2], boldRows: [0, totalRowIndex + 1] });
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Tổng hợp");
      for (let month = 1; month <= 12; month++) {
        const monthOrders = filteredOrders.filter((order) => getOrderMonth(order) === month);
        const monthData = monthOrders.length > 0 ? monthOrders.map((order, index) => mapOrderToExcelRow(order, index)) : [{ STT: "", "Mã đơn": "Không có đơn hàng", "Khách hàng": "", "Số điện thoại": "", "Loại phục vụ": "", "Phương thức thanh toán": "", "Tổng tiền": "", "Trạng thái": "", "Ngày tạo": "" }];
        const monthSheet = XLSX.utils.json_to_sheet(monthData);
        formatMoneyColumn(monthSheet, 6);
        setSheetColumnWidths(monthSheet, [10, 22, 26, 22, 22, 22, 26, 22, 22]);
        styleWorksheet(monthSheet, { centerCols: [0, 1, 3, 7, 8], rightCols: [6], boldRows: [0] });
        XLSX.utils.book_append_sheet(workbook, monthSheet, `Tháng ${month}`);
      }
      const blob = new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, getExcelFileName());
    } else {
      const exportData = filteredOrders.map((order, index) => mapOrderToExcelRow(order, index));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const totalOrders = filteredOrders.length;
      const totalRev = filteredOrders.reduce((sum, order) => sum + Number(order.total || order.totalPrice || 0), 0);
      formatMoneyColumn(worksheet, 6);
      worksheet["!cols"] = [{ wch: 10 }, { wch: 22 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 6 }, { wch: 22 }, { wch: 22 }];
      styleWorksheet(worksheet, { centerCols: [0, 1, 3, 7, 8], rightCols: [6], boldRows: [0] });
      worksheet["K1"] = { t: "s", v: "THỐNG KÊ" };
      worksheet["K2"] = { t: "s", v: "Tổng số đơn" };
      worksheet["L2"] = { t: "n", v: totalOrders };
      worksheet["K3"] = { t: "s", v: "Tổng tiền" };
      worksheet["L3"] = { t: "n", v: totalRev };
      worksheet["L3"].z = '#,##0 "₫"';
      worksheet["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(exportData.length, 2), c: 11 } });
      ["K1", "K2", "K3", "L2", "L3"].forEach((cell) => { if (!worksheet[cell]) return; worksheet[cell].s = { font: { bold: true }, alignment: { horizontal: "center", vertical: "center" } }; });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Đơn hàng");
      const blob = new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, getExcelFileName());
    }
    showAdminToast({ title: "Xuất Excel thành công", message: `Đã xuất file ${getExcelFileName()}.` });
  };

  useEffect(() => {
    setExportExcelHandler(() => exportToExcel);
    return () => setExportExcelHandler(null);
  }, [setExportExcelHandler, filteredOrders, dateMode, dateLabel, dateRange?.startDate, dateRange?.endDate]);

  // ─── Order Actions ────────────────────────────────────────────────
  const updateOrderStatus = async (id, status) => {
    if (status === "completed") {
      const currentOrder = orders.find((o) => String(o.id) === String(id));
      if (currentOrder && (currentOrder.remainingAmount > 0 || currentOrder.paymentStatus !== "paid")) {
        showAdminToast({ title: "Không thể hoàn thành", message: "Đơn hàng chưa thanh toán đủ số tiền. Vui lòng thanh toán phần còn thiếu trước khi hoàn thành.", type: "error" });
        return;
      }
    }
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ status, updatedAt: new Date().toISOString() }) });
      const data = await res.json();
      if (!data.success) { showAdminToast({ title: "Lỗi cập nhật", message: data.message || "Không thể cập nhật trạng thái đơn hàng.", type: "error" }); return; }
      const updatedOrder = data.order;
      setOrders((prev) => prev.map((order) => String(order.id) === String(id) ? updatedOrder : order));
      setSelectedOrder((prev) => prev && String(prev.id) === String(id) ? updatedOrder : prev);
      showAdminToast({ title: "Cập nhật trạng thái đơn hàng thành công", message: `Đã chuyển đơn #${updatedOrder.id} sang "${getStatusTextOrder(status)}".` });
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi kết nối", message: "Không kết nối được máy chủ.", type: "error" }); }
  };

  const openEditOrderModal = (order) => { setEditingOrder(order); setEditForm({ status: order.status || "pending", paymentMethod: order.paymentMethod || "", note: order.note || "" }); };

  const saveEditOrder = async () => {
    if (!editingOrder) return;
    try {
      const res = await fetch(`${API_URL}/${editingOrder.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ status: editForm.status, paymentMethod: editForm.paymentMethod, note: editForm.note, updatedAt: new Date().toISOString() }) });
      const data = await res.json();
      if (!data.success) { showAdminToast({ title: "Lỗi", message: data.message || "Không thể lưu thay đổi đơn hàng.", type: "error" }); return; }
      const updatedOrder = data.order;
      setOrders((prev) => prev.map((order) => String(order.id) === String(editingOrder.id) ? updatedOrder : order));
      setSelectedOrder((prev) => prev && String(prev.id) === String(editingOrder.id) ? updatedOrder : prev);
      showAdminToast({ title: "Lưu thay đổi đơn hàng thành công", message: `Đã cập nhật đơn #${updatedOrder.id}.` });
      setEditingOrder(null);
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi kết nối", message: "Không kết nối được máy chủ.", type: "error" }); }
  };



  const toggleSelectOrder = (orderId) => setSelectedOrderIds((prev) => prev.includes(String(orderId)) ? prev.filter((id) => id !== String(orderId)) : [...prev, String(orderId)]);
  const toggleSelectAllCurrentPage = () => {
    const currentIds = paginatedOrders.map((order) => String(order.id));
    const isSelectedAll = currentIds.every((id) => selectedOrderIds.includes(id));
    if (isSelectedAll) setSelectedOrderIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    else setSelectedOrderIds((prev) => [...new Set([...prev, ...currentIds])]);
  };

  const executeUpdateSelectedOrdersStatus = async (status) => {
    try {
      const updatedAt = new Date().toISOString();
      const results = await Promise.all(selectedOrderIds.map(async (id) => { const res = await fetch(`${API_URL}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ status, updatedAt }) }); return res.json(); }));
      const hasError = results.some((item) => !item.success);
      if (hasError) { showAdminToast({ title: "Thất bại", message: "Có đơn hàng cập nhật thất bại. Vui lòng tải lại danh sách.", type: "error" }); return; }
      const updatedOrderMap = results.reduce((map, item) => { if (item.success && item.order) map[String(item.order.id)] = item.order; return map; }, {});
      setOrders((prev) => prev.map((order) => updatedOrderMap[String(order.id)] || order));
      setSelectedOrder((prev) => prev ? updatedOrderMap[String(prev.id)] || prev : prev);
      showAdminToast({ title: "Cập nhật hàng loạt thành công", message: `Đã chuyển ${selectedOrderIds.length} đơn hàng sang trạng thái "${getStatusTextOrder(status)}".` });
      setSelectedOrderIds([]);
    } catch (error) { console.error(error); showAdminToast({ title: "Thất bại", message: "Không thể cập nhật nhiều đơn hàng.", type: "error" }); }
  };

  const updateSelectedOrdersStatus = (status) => { if (selectedOrderIds.length === 0) return; setDeleteConfirmOrder({ bulkStatus: status }); };

  // ─── RENDER ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Desktop & Tablet Stats Grid (>= sm) */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-2.5 sm:gap-3">
        <OrderStatCard icon={<ShoppingBag />} title="Tất cả đơn hàng" value={orders.length} bg="bg-green-50" color="text-green-700" />
        <OrderStatCard icon={<Clock3 />} title="Chờ xác nhận" value={pendingCount} bg="bg-blue-50" color="text-blue-600" />
        <OrderStatCard icon={<CalendarDays />} title="Đang chuẩn bị" value={preparingCount} bg="bg-purple-50" color="text-purple-600" />
        <OrderStatCard icon={<Truck />} title="Đang giao" value={deliveringCount} bg="bg-orange-50" color="text-orange-600" />
        <OrderStatCard icon={<CheckCircle />} title="Hoàn thành" value={completedCount} bg="bg-green-50" color="text-green-600" />
        <OrderStatCard icon={<XCircle />} title="Đã hủy" value={cancelledCount} bg="bg-red-50" color="text-red-600" />
        <OrderStatCard
          icon={<Wallet />}
          title="Tổng doanh thu"
          value={formatPriceOrder(totalRevenue)}
          bg="bg-yellow-50"
          color="text-yellow-600"
          className="sm:col-span-2 md:col-span-3 lg:col-span-2 2xl:col-span-1"
        />
      </div>

      {/* Mobile Compact Stats Section (< sm) */}
      <div className="sm:hidden space-y-2.5">
        {/* Mobile Revenue Hero Card */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Tổng doanh thu</p>
            <h3 className="text-xl font-black mt-0.5 tracking-tight">{formatPriceOrder(totalRevenue)}</h3>
            <p className="text-[11px] text-emerald-200 font-semibold mt-1">Tổng cộng: <span className="font-black text-white">{orders.length}</span> đơn hàng</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-emerald-200 shrink-0">
            <Wallet size={22} />
          </div>
        </div>

        {/* Mobile Status 2-Row Grid (3 columns x 2 rows = 6 buttons) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl p-2 sm:p-2.5 border text-left transition-all min-w-0 flex flex-col justify-between ${
              statusFilter === "all"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-300/30 shadow-2xs"
                : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between mb-0.5 opacity-85 gap-1">
              <span className="text-[10px] font-bold uppercase truncate">Tất cả</span>
              <ShoppingBag size={12} className="shrink-0" />
            </div>
            <span className="text-sm sm:text-base font-black leading-none mt-0.5">{orders.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Chờ xác nhận" ? "all" : "Chờ xác nhận")}
            className={`rounded-xl p-2 sm:p-2.5 border text-left transition-all min-w-0 flex flex-col justify-between ${
              statusFilter === "Chờ xác nhận"
                ? "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300/30 shadow-2xs"
                : "bg-white border-blue-100 text-slate-700 hover:bg-blue-50/40"
            }`}
          >
            <div className={`flex items-center justify-between mb-0.5 gap-1 ${statusFilter === "Chờ xác nhận" ? "text-blue-700" : "text-blue-600"}`}>
              <span className="text-[10px] font-bold uppercase truncate">Chờ duyệt</span>
              <Clock3 size={12} className="shrink-0" />
            </div>
            <span className="text-sm sm:text-base font-black leading-none mt-0.5">{pendingCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Đang chuẩn bị" ? "all" : "Đang chuẩn bị")}
            className={`rounded-xl p-2 sm:p-2.5 border text-left transition-all min-w-0 flex flex-col justify-between ${
              statusFilter === "Đang chuẩn bị"
                ? "bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-300/30 shadow-2xs"
                : "bg-white border-purple-100 text-slate-700 hover:bg-purple-50/40"
            }`}
          >
            <div className={`flex items-center justify-between mb-0.5 gap-1 ${statusFilter === "Đang chuẩn bị" ? "text-purple-700" : "text-purple-600"}`}>
              <span className="text-[10px] font-bold uppercase truncate">Chuẩn bị</span>
              <CalendarDays size={12} className="shrink-0" />
            </div>
            <span className="text-sm sm:text-base font-black leading-none mt-0.5">{preparingCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Đang giao" ? "all" : "Đang giao")}
            className={`rounded-xl p-2 sm:p-2.5 border text-left transition-all min-w-0 flex flex-col justify-between ${
              statusFilter === "Đang giao"
                ? "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300/30 shadow-2xs"
                : "bg-white border-amber-100 text-slate-700 hover:bg-amber-50/40"
            }`}
          >
            <div className={`flex items-center justify-between mb-0.5 gap-1 ${statusFilter === "Đang giao" ? "text-amber-800" : "text-amber-600"}`}>
              <span className="text-[10px] font-bold uppercase truncate">Đang giao</span>
              <Truck size={12} className="shrink-0" />
            </div>
            <span className="text-sm sm:text-base font-black leading-none mt-0.5">{deliveringCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Hoàn thành" ? "all" : "Hoàn thành")}
            className={`rounded-xl p-2 sm:p-2.5 border text-left transition-all min-w-0 flex flex-col justify-between ${
              statusFilter === "Hoàn thành"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-300/30 shadow-2xs"
                : "bg-white border-emerald-100 text-slate-700 hover:bg-emerald-50/40"
            }`}
          >
            <div className={`flex items-center justify-between mb-0.5 gap-1 ${statusFilter === "Hoàn thành" ? "text-emerald-700" : "text-emerald-600"}`}>
              <span className="text-[10px] font-bold uppercase truncate">Hoàn thành</span>
              <CheckCircle size={12} className="shrink-0" />
            </div>
            <span className="text-sm sm:text-base font-black leading-none mt-0.5">{completedCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Đã hủy" ? "all" : "Đã hủy")}
            className={`rounded-xl p-2 sm:p-2.5 border text-left transition-all min-w-0 flex flex-col justify-between ${
              statusFilter === "Đã hủy"
                ? "bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-300/30 shadow-2xs"
                : "bg-white border-rose-100 text-slate-700 hover:bg-rose-50/40"
            }`}
          >
            <div className={`flex items-center justify-between mb-0.5 gap-1 ${statusFilter === "Đã hủy" ? "text-rose-700" : "text-rose-600"}`}>
              <span className="text-[10px] font-bold uppercase truncate">Đã hủy</span>
              <XCircle size={12} className="shrink-0" />
            </div>
            <span className="text-sm sm:text-base font-black leading-none mt-0.5">{cancelledCount}</span>
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 items-start ${selectedOrder ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="px-3 sm:px-5 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center overflow-x-auto no-scrollbar min-w-0 flex-1">
                {[
                  ["all", "Tất cả đơn hàng"],
                  ["dinein", "Ăn tại quán"],
                  ["food", "Giao tận nơi"],
                  ["pickup", "Đến lấy"],
                  ["cancelled", "Đã hủy"],
                ].map(([value, label]) => (
                  <TabButton key={value} active={activeTab === value} onClick={() => setActiveTab(value)}>{label}</TabButton>
                ))}
              </div>
              <div className="hidden xl:flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap shrink-0">
                <span>Hiển thị</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="h-9 w-[130px] rounded-xl border border-gray-200 px-2.5 text-xs font-bold outline-none bg-white shadow-2xs">
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filters - Compact, Elegant 2-Row Layout */}
          <div className="p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5 bg-slate-50/40 border-b border-slate-100">
            {/* Row 1: Search bar + Reset button */}
            <div className="flex items-center gap-2">
              <div className="h-9 sm:h-10 rounded-xl border border-slate-200/90 bg-white px-3 flex items-center gap-2 shadow-2xs flex-1 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600/20 transition-all">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm mã đơn, tên khách, SĐT..."
                  className="w-full min-w-0 outline-none text-xs sm:text-sm font-medium bg-transparent text-slate-800 placeholder:text-slate-400"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1">×</button>
                )}
              </div>

              <button
                type="button"
                onClick={resetFilter}
                title="Xóa toàn bộ bộ lọc"
                className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-rose-200/90 bg-rose-50/70 text-rose-600 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 shadow-2xs text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0"
              >
                <RotateCcw size={13} className="text-rose-600 shrink-0" />
                <span className="hidden sm:inline">Xóa lọc</span>
              </button>
            </div>

            {/* Row 2: 3 Filter dropdowns in a 3-column grid */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
              <SelectBox label="Loại hình" value={serviceType} onChange={(e) => setServiceType(e.target.value)} compact={selectedOrder}>
                <option value="all">Tất cả</option>
                <option value="dinein">Tại quán</option>
                <option value="delivery">Giao hàng</option>
                <option value="pickup">Đến lấy</option>
              </SelectBox>
              <SelectBox label="Thanh toán" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} compact={selectedOrder}>
                <option value="all">Tất cả</option>
                <option value="cash">Tiền mặt</option>
                <option value="bank">Chuyển khoản</option>
                <option value="momo">Ví MoMo</option>
                <option value="vnpay">VNPay</option>
                <option value="pay_after_meal">Sau bữa ăn</option>
              </SelectBox>
              <SelectBox label="Trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} compact={selectedOrder}>
                <option value="all">Tất cả</option>
                <option value="Chờ xác nhận">Chờ duyệt</option>
                <option value="Đã xác nhận">Đã xác nhận</option>
                <option value="Đang chuẩn bị">Chuẩn bị</option>
                <option value="Đang giao">Đang giao</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Đã hủy">Đã hủy</option>
              </SelectBox>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedOrderIds.length > 0 && (
            <div className="mx-3 sm:mx-4 my-3 rounded-2xl border border-green-100 bg-green-50 px-3.5 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <p className="text-xs sm:text-sm font-black text-primary">Đã chọn {selectedOrderIds.length} đơn hàng</p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {[["confirmed", "Xác nhận", "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"], ["preparing", "Chuẩn bị", "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"], ["delivering", "Đang giao", "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100"], ["completed", "Hoàn thành", "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"], ["cancelled", "Hủy đơn", "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"]].map(([status, label, style]) => (
                  <button key={status} onClick={() => updateSelectedOrdersStatus(status)} className={`h-8 sm:h-10 px-2.5 sm:px-4 rounded-xl border text-xs sm:text-sm font-black transition ${style}`}>{label}</button>
                ))}
                <button onClick={() => setSelectedOrderIds([])} className="h-8 sm:h-10 px-2.5 sm:px-4 rounded-xl bg-white text-gray-500 border border-gray-200 text-xs sm:text-sm font-black hover:bg-gray-50 transition">Bỏ chọn</button>
              </div>
            </div>
          )}

          {/* Mobile Card List (lg:hidden) */}
          <div className="block lg:hidden p-3 space-y-3 bg-slate-50/70">
            {filteredOrders.length > 0 ? (
              paginatedOrders.map((order, index) => {
                const isSelected = String(selectedOrder?.id) === String(order.id);
                const isChecked = selectedOrderIds.includes(String(order.id));
                const statusText = getStatusTextOrder(order.status);
                const isPending = ["pending", "Chờ xác nhận", "Chờ xử lý"].includes(order.status) || ["Chờ xác nhận", "Chờ xử lý"].includes(statusText);
                const isDelivering = ["delivering", "Đang giao"].includes(order.status) || statusText === "Đang giao";
                const isCompleted = ["completed", "Hoàn thành"].includes(order.status) || statusText === "Hoàn thành";
                const isCancelled = ["cancelled", "Đã hủy"].includes(order.status) || statusText === "Đã hủy";

                return (
                  <div
                    key={order.id || index}
                    onClick={() => setSelectedOrder(order)}
                    className={`bg-white rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer text-left shadow-2xs hover:shadow-md relative overflow-hidden space-y-2.5 ${
                      isSelected
                        ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
                        : isChecked
                        ? "border-emerald-400 bg-emerald-50/10"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    {/* Left accent color bar for instant visual status recognition */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isPending
                          ? "bg-amber-400"
                          : isDelivering
                          ? "bg-amber-500"
                          : isCompleted
                          ? "bg-emerald-500"
                          : isCancelled
                          ? "bg-rose-400"
                          : "bg-slate-300"
                      }`}
                    />

                    {/* Top Row: Checkbox, Order ID Badge, Status & Edit Button */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 accent-emerald-700 rounded shrink-0 cursor-pointer"
                        />
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-black text-xs shrink-0 tracking-tight">
                          #{order.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold truncate ${getStatusStyleOrder(
                            order.status
                          )}`}
                        >
                          {statusText}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditOrderModal(order);
                        }}
                        title="Chỉnh sửa đơn hàng"
                        className="w-7 h-7 rounded-lg bg-slate-100/80 text-slate-600 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-700 transition shrink-0"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>

                    {/* Middle Row: Customer Info (Left) & Total / Time (Right) */}
                    <div className="flex items-center justify-between gap-3 pt-0.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100/60 flex items-center justify-center font-bold text-sm shrink-0">
                          {(order.customerName || order.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate leading-snug">
                            {order.customerName || order.fullName || order.name || "Khách hàng"}
                          </p>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            {order.phone || "Chưa có SĐT"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-base text-emerald-700 leading-none">
                          {formatPriceOrder(order.total || order.totalPrice)}
                        </p>
                        <p className="text-[10.5px] text-slate-400 font-medium mt-1">
                          {formatDateTimeOrder(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Service Type & Payment Method Tag Chips */}
                    <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium truncate bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        {getServiceIcon(order.serviceType)}
                        <span className="truncate">{getServiceText(order.serviceType)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium truncate bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        {getPaymentIcon(order.paymentMethod)}
                        <span className="truncate">{getPaymentText(order.paymentMethod)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-12 text-center text-slate-400 font-bold text-xs bg-white rounded-2xl border border-dashed border-slate-200">
                Chưa có đơn hàng phù hợp
              </div>
            )}
          </div>

          {/* Table (hidden on mobile, visible on lg+) */}
          <div className="overflow-x-auto hidden lg:block">
            <table className="min-w-[1180px] w-full text-left text-sm">
              <thead className="bg-[#fbfcfb] text-gray-500 font-bold text-sm whitespace-nowrap">
                <tr>
                  <th className="w-[50px] px-4 py-3">
                    <input type="checkbox" checked={paginatedOrders.length > 0 && paginatedOrders.every((order) => selectedOrderIds.includes(String(order.id)))} onChange={toggleSelectAllCurrentPage} className="w-4 h-4 accent-green-700" />
                  </th>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">SĐT</th>
                  <th className="px-4 py-3">Loại phục vụ</th>
                  <th className="px-4 py-3">Thanh toán</th>
                  <th className="px-4 py-3 text-center">Tổng tiền</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="w-[120px] px-4 py-3 text-center sticky right-0 bg-[#fbfcfb] z-10 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  paginatedOrders.map((order, index) => (
                    <tr key={order.id || index} onClick={() => setSelectedOrder(order)} className={`border-t border-gray-100 hover:bg-black/5 transition-colors cursor-pointer ${String(selectedOrder?.id) === String(order.id) ? "bg-green-100/70" : (["pending", "Chờ xác nhận", "Chờ xử lý"].includes(order.status) || ["Chờ xác nhận", "Chờ xử lý"].includes(getStatusTextOrder(order.status))) ? "bg-red-50/80" : (["completed", "Hoàn thành"].includes(order.status) || getStatusTextOrder(order.status) === "Hoàn thành") ? "bg-green-50/60" : ""}`}>
                      <td className="px-4 py-3"><input type="checkbox" checked={selectedOrderIds.includes(String(order.id))} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelectOrder(order.id)} className="w-4 h-4 accent-green-700" /></td>
                      <td className="px-4 py-3 font-black text-green-700 whitespace-nowrap">#{order.id || index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 text-primary flex items-center justify-center font-black">{(order.customerName || order.name || "A").charAt(0).toUpperCase()}</div>
                          <span className="font-bold text-gray-700 whitespace-nowrap">{order.customerName || order.fullName || order.name || "Khách hàng"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">{order.phone || "Chưa có"}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2 font-semibold text-gray-700 whitespace-nowrap">{getServiceIcon(order.serviceType)}{getServiceText(order.serviceType)}</div></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2 font-semibold text-gray-700 whitespace-nowrap">{getPaymentIcon(order.paymentMethod)}{getPaymentText(order.paymentMethod)}</div></td>
                      <td className="px-4 py-3 font-black text-primary whitespace-nowrap text-center">{formatPriceOrder(order.total || order.totalPrice)}</td>
                      <td className="px-4 py-3 text-center"><span className={`inline-flex items-center justify-center min-w-[96px] px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap ${getStatusStyleOrder(order.status)}`}>{getStatusTextOrder(order.status)}</span></td>
                      <td className="px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">{formatDateTimeOrder(order.createdAt)}</td>
                      <td className="px-4 py-3 sticky right-0 bg-white z-10 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.25)]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); openEditOrderModal(order); }} title="Chỉnh sửa đơn hàng" className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-100 hover:scale-105 transition-all"><Pencil size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="10" className="px-5 py-14 text-center text-gray-400 font-bold">Chưa có đơn hàng phù hợp</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & Status Legend Footer */}
          <div className="border-t border-slate-100 bg-white">
            <GlobalPagination
              total={filteredOrders.length}
              page={currentPage}
              limit={pageSize}
              onPageChange={setCurrentPage}
              onLimitChange={setPageSize}
              limitOptions={[10, 20, 50, 100]}
            />
            <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-50/60 border-t border-slate-100/80 flex flex-wrap items-center justify-center sm:justify-start gap-x-3.5 gap-y-1 text-[11px] font-semibold text-slate-500">
              {[
                ["bg-amber-400", "Chờ xác nhận"],
                ["bg-blue-500", "Đã xác nhận"],
                ["bg-purple-500", "Chuẩn bị"],
                ["bg-orange-500", "Đang giao"],
                ["bg-emerald-500", "Hoàn thành"],
                ["bg-rose-500", "Đã hủy"],
              ].map(([color, text]) => (
                <div key={text} className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${color}`}></span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {selectedOrder && (
          <OrderDetailPanel
            order={selectedOrder}
            formatPrice={formatPriceOrder}
            formatDateTime={formatDateTimeOrder}
            getStatusText={getStatusTextOrder}
            getStatusStyle={getStatusStyleOrder}
            getServiceText={getServiceText}
            getPaymentText={getPaymentText}
            getPaymentStatusText={getPaymentStatusText}
            onClose={() => setSelectedOrder(null)}
            onChangeStatus={(status) => updateOrderStatus(selectedOrder.id, status)}
            onAddPayment={async (amount, method) => {
              try {
                const res = await fetch(`http://localhost:5001/api/orders/${selectedOrder.id}/payments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ amount, paymentMethod: method }) });
                const data = await res.json();
                if (data.success) { showAdminToast({ title: "Thành công", description: "Đã thêm thanh toán.", type: "success" }); setSelectedOrder(data.order); loadOrders(); }
                else showAdminToast({ title: "Lỗi", description: data.message, type: "error" });
              } catch (err) { showAdminToast({ title: "Lỗi", description: "Lỗi kết nối", type: "error" }); }
            }}
          />
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div><h3 className="text-xl font-black text-primary">Chỉnh sửa đơn hàng</h3><p className="text-sm text-gray-500 font-semibold mt-1">#{editingOrder.id}</p></div>
              <button onClick={() => setEditingOrder(null)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-gray-500">Trạng thái</span>
                <select value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} className="mt-2 w-full h-12 rounded-xl border border-gray-100 px-4 font-bold outline-none shadow-sm">
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="preparing">Đang chuẩn bị</option>
                  <option value="delivering">Đang giao</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-black text-gray-500">Phương thức thanh toán</span>
                <select value={editForm.paymentMethod} onChange={(e) => setEditForm((prev) => ({ ...prev, paymentMethod: e.target.value }))} className="mt-2 w-full h-12 rounded-xl border border-gray-100 px-4 font-bold outline-none shadow-sm">
                  <option value="">Chưa chọn</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Chuyển khoản</option>
                  <option value="momo">Ví MoMo</option>
                  <option value="vnpay">VNPay</option>
                  <option value="pay_after_meal">Sau bữa ăn</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-black text-gray-500">Ghi chú</span>
                <textarea value={editForm.note} onChange={(e) => setEditForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="Nhập ghi chú cho đơn hàng..." className="mt-2 w-full h-24 rounded-xl border border-gray-100 px-4 py-3 text-sm font-semibold outline-none resize-none shadow-sm" />
              </label>
            </div>
            <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditingOrder(null)} className="h-11 px-5 rounded-xl bg-gray-100 text-gray-600 font-black hover:bg-gray-200">Đóng</button>
              <button onClick={saveEditOrder} className="h-11 px-5 rounded-xl bg-primary text-white font-black hover:bg-primary/90">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {deleteConfirmOrder && deleteConfirmOrder.bulkStatus && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-[scaleIn_0.2s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner"><Trash2 size={28} /></div>
            <div>
              <h4 className="font-black text-gray-900 text-base">Xác nhận cập nhật trạng thái</h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">Bạn có chắc chắn muốn cập nhật trạng thái cho {selectedOrderIds.length} đơn hàng đã chọn?</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => setDeleteConfirmOrder(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">Hủy bỏ</button>
              <button type="button" onClick={() => { const target = deleteConfirmOrder; setDeleteConfirmOrder(null); executeUpdateSelectedOrdersStatus(target.bulkStatus); }} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-sm bg-primary hover:bg-primary-light">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderStatCard({ icon, title, value, bg, color, note = "", className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-3.5 flex items-start gap-2.5 hover:bg-green-50/40 hover:border-green-100 hover:-translate-y-0.5 hover:shadow-md transition text-left min-w-0 ${className}`}>
      {/* Icon ở trước (bên trái) */}
      <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
        {React.cloneElement(icon, { size: 16 })}
      </div>

      {/* 3 hàng bắt đầu bằng nhau ở bên phải */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Row 1: Tên danh mục */}
        <p className="text-[11px] sm:text-xs font-bold text-gray-500 truncate leading-tight">
          {title}
        </p>

        {/* Row 2: Số tiền, thông số */}
        <h3 className="text-lg sm:text-[22px] font-black text-green-955 mt-1 leading-none truncate">
          {value}
        </h3>

        {/* Row 3: Tỉ lệ % / Ghi chú (chỉ hiện khi có note thực tế) */}
        {note && note !== "-" ? (
          <div className="mt-1 flex items-center min-w-0 h-4">
            <span className="px-1.5 py-0.2 rounded-md bg-green-50 text-green-700 text-[9px] sm:text-[10px] font-bold shrink-0">
              {note}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 sm:h-13 px-2.5 sm:px-4 lg:px-5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shrink-0 ${
        active
          ? "border-emerald-700 text-emerald-800 bg-emerald-50/50"
          : "border-transparent text-gray-500 hover:text-emerald-700 hover:bg-emerald-50/20"
      }`}
    >
      {children}
    </button>
  );
}

function SelectBox({ label, value, onChange, children, compact = false }) {
  const isFiltered = value && value !== "all";
  return (
    <label
      className={`h-9 sm:h-10 rounded-xl border flex flex-col justify-center px-2 sm:px-3 shadow-2xs min-w-0 w-full transition-all cursor-pointer ${
        isFiltered
          ? "border-emerald-300 bg-emerald-50/40 text-emerald-900"
          : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300"
      } focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600/20 ${compact ? "lg:w-[130px]" : ""}`}
    >
      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 truncate leading-none mb-0.5 uppercase tracking-tight">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="outline-none bg-transparent text-[11px] sm:text-xs font-semibold text-slate-700 min-w-0 truncate cursor-pointer leading-tight"
      >
        {children}
      </select>
    </label>
  );
}

export default AdminOrdersPage;


