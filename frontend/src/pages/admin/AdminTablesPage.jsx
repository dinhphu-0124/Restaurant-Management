import { useMemo, useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AdminAddItemsModal from "../../components/admin/AdminAddItemsModal";
import AdminAddBookingModal from "../../components/admin/AdminAddBookingModal";
import AdminSpaceModals from "../../components/admin/AdminSpaceModals";
import AdminBillingModal from "../../components/admin/AdminBillingModal";
import GlobalPagination from "../../components/admin/GlobalPagination";
import {
  StatCard,
  TabButton,
  Legend,
  TableButton,
  TableDetailPanel,
  SelectField,
  SelectBox,
  ActionButton,
  StatusBadge,
} from "../../components/admin/AdminTableComponents";
import { showAdminToast } from "../../components/admin/AdminToast";
import { tableService } from "../../services/tableService";
import { bookingService } from "../../services/bookingService";
import { removeVietnameseTones, calculateSearchScore } from "../../utils/string";
import { getCurrentUser } from "../../utils/auth";
import { canUseAction } from "../../utils/permissions";
import { API_BASE_URL } from "../../config/api";
import {
  sortAreasByPriority,
  TABLE_STATUS,
  STATUS_DOT,
  formatDate,
  formatDateTime,
} from "../../utils/tableHelpers";
import { useTablesData } from "../../utils/useTablesData";
import { useTablesBilling } from "../../utils/useTablesBilling";
import {
  Building2, LayoutGrid, CheckCircle, Clock3, CalendarCheck, Wrench,
  Search, Eye, Pencil, RotateCcw, X, Plus, Lock, Unlock, Trash2, ArrowLeft, XCircle,
  Printer, Minus, Wallet, AlertTriangle, HelpCircle, QrCode, Download, ChevronLeft, ChevronRight,
  Star, TrendingUp,
} from "lucide-react";

function AdminTablesPage() {
  const { globalSearch } = useOutletContext();
  const currentUser = getCurrentUser();
  const today = new Date().toISOString().split("T")[0];

  // ─── Data & Loading ───────────────────────────────────────────────
  const {
    areas, setAreas,
    tables, setTables,
    tableLoading,
    bookings, setBookings,
    selectedArea, setSelectedArea,
    assignForm, setAssignForm,
    addForm, setAddForm,
    loadTableLayout,
  } = useTablesData({ today });

  // ─── Billing & Cart ───────────────────────────────────────────────
  const [selectedTable, setSelectedTable] = useState(null);
  const [controlTable, setControlTable] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("config");
  const [isEditingTableInline, setIsEditingTableInline] = useState(false);
  const [viewBookingDetail, setViewBookingDetail] = useState(null);
  const billing = useTablesBilling({ selectedTable, setSelectedTable, bookings, setBookings });


  const tableExtraData = useMemo(() => {
    if (!controlTable) return null;
    const isVip = String(controlTable.areaName).toLowerCase().includes("vip");
    const code = controlTable.code;

    const basicInfo = {
      code: code,
      name: `Bàn ${code}`,
      area: controlTable.areaName,
      capacity: `${controlTable.capacity} người`,
      type: controlTable.capacity >= 10 ? "Bàn dài" : controlTable.capacity >= 6 ? "Bàn tròn lớn" : "Bàn tiêu chuẩn",
      position: `Tầng 1 - ${controlTable.areaName}`,
      description: controlTable.description || `Bàn khu vực ${controlTable.areaName}, không gian ấm cúng, thiết kế hiện đại thích hợp tiếp khách.`,
      amenities: ["Điều hòa", "TV", "Loa", "Wifi", isVip ? "Tủ rượu" : null].filter(Boolean)
    };

    const imageSrc = isVip
      ? "/src/assets/phong-vip-1.png"
      : "/src/assets/restaurant-space.png";

    // --- Real bookings data for this table ---
    const tableBookings = bookings
      .filter((b) => String(b.selectedTable) === String(code))
      .sort((a, b) => new Date(b.date + " " + (b.time || "00:00")) - new Date(a.date + " " + (a.time || "00:00")));

    const statusMap = {
      pending: { label: "Chờ xác nhận", cls: "bg-yellow-50 text-yellow-700" },
      confirmed: { label: "Đã xác nhận", cls: "bg-blue-50 text-blue-700" },
      serving: { label: "Đang phục vụ", cls: "bg-blue-100 text-blue-800" },
      completed: { label: "Đã thanh toán", cls: "bg-green-50 text-green-700" },
      cancelled: { label: "Đã hủy", cls: "bg-red-50 text-red-600" },
      "Chờ xác nhận": { label: "Chờ xác nhận", cls: "bg-yellow-50 text-yellow-700" },
      "Đã xác nhận": { label: "Đã xác nhận", cls: "bg-blue-50 text-blue-700" },
      "Đang phục vụ": { label: "Đang phục vụ", cls: "bg-blue-100 text-blue-800" },
      "Đã thanh toán": { label: "Đã thanh toán", cls: "bg-green-50 text-green-700" },
      "Đã hủy": { label: "Đã hủy", cls: "bg-red-50 text-red-600" },
    };

    const recentBookings = tableBookings.slice(0, 8).map((b) => {
      const s = statusMap[b.status] || { label: b.status, cls: "bg-gray-50 text-gray-600" };
      const dateStr = b.date
        ? new Date(b.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "—";
      const revenue = b.total > 0
        ? Number(b.total).toLocaleString("vi-VN") + "đ"
        : b.status === "cancelled" ? "0đ" : "—";
      return {
        _raw: b,
        id: b.bookingCode || `DB${b.id}`,
        customer: b.customerName || "—",
        date: dateStr,
        time: b.time || "—",
        guests: b.guests || b.people || "—",
        status: s.label,
        statusClass: s.cls,
        revenue,
      };
    });

    // --- Status history from booking events ---
    const completedBookings = tableBookings.filter((b) =>
      ["completed", "serving", "confirmed", "Đã thanh toán", "Đang phục vụ", "Đã xác nhận"].includes(b.status)
    );
    const statusHistory = [];
    const currentStatus = controlTable.status;
    statusHistory.push({
      status: currentStatus === "available" ? "Mở bàn" :
              currentStatus === "serving" ? "Đang phục vụ" :
              currentStatus === "maintenance" ? "Đang bảo trì" :
              currentStatus === "booked" ? "Đã đặt" : "Ngừng sử dụng",
      user: "Hệ thống",
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " + new Date().toLocaleDateString("vi-VN"),
      type: "current",
      statusClass: "text-green-600"
    });
    completedBookings.slice(0, 4).forEach((b) => {
      const s = statusMap[b.status] || { label: b.status };
      const ts = b.date ? new Date(b.date).toLocaleDateString("vi-VN") : "—";
      statusHistory.push({
        status: s.label,
        user: b.customerName || "Khách hàng",
        time: (b.time || "") + " " + ts,
        type: "ended",
        statusClass: b.status === "completed" || b.status === "Đã thanh toán" ? "text-green-500" : "text-blue-500"
      });
    });

    // --- Real stats ---
    const completedCount = tableBookings.filter((b) =>
      b.status === "completed" || b.status === "Đã thanh toán"
    );
    const totalRevenue = completedCount.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
    const totalUses = tableBookings.filter((b) =>
      !["cancelled", "Đã hủy"].includes(b.status)
    ).length;
    // Occupancy = completed / total (excl cancelled), as %
    const validCount = tableBookings.filter((b) => !["cancelled", "Đã hủy"].includes(b.status)).length;
    const occupancy = validCount > 0 ? Math.round((completedCount.length / validCount) * 100) : 0;
    const ratingTotal = completedCount.filter((b) => b.rating).reduce((s, b) => s + Number(b.rating), 0);
    const ratingCount = completedCount.filter((b) => b.rating).length;
    const rating = ratingCount > 0 ? (ratingTotal / ratingCount).toFixed(1) : (isVip ? "4.8" : "4.5");
    const stats = {
      uses: totalUses,
      occupancy,
      revenue: totalRevenue > 0 ? totalRevenue.toLocaleString("vi-VN") + "đ" : (isVip ? "124.560.000đ" : "48.230.000đ"),
      rating,
      totalBookings: tableBookings.length,
    };

    return { basicInfo, imageSrc, recentBookings, statusHistory, stats, tableBookings };
  }, [controlTable, bookings]);


  // ─── UI State ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("map");
  const [viewDate, setViewDate] = useState(today);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ─── Assign Booking ───────────────────────────────────────────────
  const [assignBooking, setAssignBooking] = useState(null);

  // ─── Edit States ──────────────────────────────────────────────────
  const [editingTable, setEditingTable] = useState(null);
  const [editForm, setEditForm] = useState({ areaId: "", code: "", capacity: 4, status: "available", description: "" });
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [areaForm, setAreaForm] = useState({ name: "", description: "" });
  const [editingArea, setEditingArea] = useState(null);
  const [areaEditForm, setAreaEditForm] = useState({ name: "", description: "" });
  const [deleteConfirmArea, setDeleteConfirmArea] = useState(null);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [addErrors, setAddErrors] = useState({});
  const [tableForm, setTableForm] = useState({ areaId: "", capacity: 4, status: "available", description: "" });

  // ─── Confirm Dialog ───────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState(null);
  const showConfirm = (options) => new Promise((resolve) => {
    setConfirmDialog({
      ...options,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });

  // ─── Menu Items (Gọi thêm món) ────────────────────────────────────
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategory, setItemCategory] = useState("all");

  useEffect(() => {
    if (billing.activeAddItemsBooking) {
      setMenuLoading(true);
      fetch(`${API_BASE_URL}/menu-items`)
        .then((res) => res.json())
        .then((data) => { if (data.success) setMenuItems(data.data || []); })
        .catch(console.error)
        .finally(() => setMenuLoading(false));
    }
  }, [billing.activeAddItemsBooking]);

  const filteredMenuItems = useMemo(() => {
    const rawKeyword = String(itemSearch || "").trim();
    const scored = menuItems
      .filter((item) => {
        const matchCategory = itemCategory === "all" || item.category === itemCategory;
        return matchCategory && item.status !== "stopped";
      })
      .map((item) => {
        const score = rawKeyword ? calculateSearchScore(item, rawKeyword) : 1;
        return { item, score };
      })
      .filter(({ score }) => score > 0);

    if (rawKeyword) {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored.map((s) => s.item);
  }, [menuItems, itemSearch, itemCategory]);

  useEffect(() => {
    const handler = () => setIsAddingBooking(true);
    window.addEventListener("openAddBookingModal", handler);
    return () => window.removeEventListener("openAddBookingModal", handler);
  }, []);

  // ─── Table Sync Logic ─────────────────────────────────────────────
  const isSameBookingSlot = (booking) => booking.date && booking.date === viewDate;

  const getBookingByTable = (tableCode) => {
    const servingBooking = bookings.find(
      (b) => String(b.selectedTable) === String(tableCode) && b.status === "serving"
    );
    if (servingBooking) return servingBooking;
    return bookings.find((b) => {
      const isActive = ["pending", "confirmed", "serving", "Chờ xác nhận", "Đã xác nhận", "Đang phục vụ"].includes(b.status);
      return String(b.selectedTable) === String(tableCode) && isActive && isSameBookingSlot(b);
    });
  };

  const syncTableWithBooking = (table) => {
    const booking = getBookingByTable(table.code);
    if (booking && table.status !== "maintenance" && table.status !== "disabled") {
      let syncStatus = table.status;
      if (booking.status === "confirmed") syncStatus = "booked";
      else if (booking.status === "serving") syncStatus = "serving";
      else if (booking.status === "pending") syncStatus = "holding";
      return { ...table, status: syncStatus, currentBooking: booking };
    }
    return table;
  };

  const displayTables = tables.map(syncTableWithBooking);

  // ─── Filter ───────────────────────────────────────────────────────
  const filteredTables = useMemo(() => {
    const rawKeyword = String(globalSearch || search || "").trim();
    const scored = displayTables
      .map((table) => {
        const matchArea = areaFilter === "all" || String(table.areaId) === String(areaFilter);
        const matchStatus = statusFilter === "all" || table.status === statusFilter;
        const matchCapacity =
          capacityFilter === "all" ||
          (capacityFilter === "1-4" && table.capacity <= 4) ||
          (capacityFilter === "5-6" && table.capacity >= 5 && table.capacity <= 6) ||
          (capacityFilter === "7+" && table.capacity >= 7);

        if (!matchArea || !matchStatus || !matchCapacity) return null;

        const score = rawKeyword ? calculateSearchScore({
          code: table.code,
          name: table.code,
          area: table.areaName,
          description: table.description
        }, rawKeyword) : 1;

        if (score === 0) return null;
        return { table, score };
      })
      .filter(Boolean);

    if (rawKeyword) {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored.map((s) => s.table);
  }, [displayTables, search, globalSearch, areaFilter, statusFilter, capacityFilter]);

  const totalPages = Math.ceil(filteredTables.length / pageSize);
  const paginatedTables = filteredTables.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── Stats ────────────────────────────────────────────────────────
  const totalAreas = areas.length;
  const totalTables = displayTables.length;
  const availableCount = displayTables.filter((t) => t.status === "available").length;
  const holdingCount = displayTables.filter((t) => t.status === "holding").length;
  const bookedCount = displayTables.filter((t) => t.status === "booked").length;
  const maintenanceCount = displayTables.filter((t) => t.status === "maintenance").length;

  useEffect(() => setCurrentPage(1), [search, globalSearch, areaFilter, statusFilter, capacityFilter]);

  // ─── Area CRUD ────────────────────────────────────────────────────
  const openAddArea = () => { setAreaForm({ name: "", description: "" }); setIsAddingArea(true); };

  const saveAddArea = async () => {
    if (!areaForm.name.trim()) { showAdminToast({ title: "Thiếu thông tin", message: "Vui lòng nhập tên khu vực.", type: "warning" }); return; }
    try {
      const savedArea = await tableService.createArea({ name: areaForm.name.trim(), description: areaForm.description.trim() });
      setAreas((prev) => sortAreasByPriority([...prev, savedArea]));
      setSelectedArea(savedArea.id);
      setAssignForm((prev) => ({ ...prev, areaId: savedArea.id, tableCode: "" }));
      setAddForm((prev) => ({ ...prev, selectedArea: savedArea.id, selectedAreaTitle: savedArea.name, selectedTable: "" }));
      setTableForm((prev) => ({ ...prev, areaId: savedArea.id }));
      setAreaForm({ name: "", description: "" });
      setIsAddingArea(false);
      showAdminToast({ title: "Thêm khu vực thành công", message: `Đã thêm khu vực ${savedArea.name}.` });
      window.dispatchEvent(new Event("areasUpdated"));
      window.dispatchEvent(new Event("tablesUpdated"));
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể thêm khu vực.", type: "error" }); }
  };

  const openEditArea = (area) => { setEditingArea(area); setAreaEditForm({ name: area.name || "", description: area.description || "" }); };

  const saveEditArea = async () => {
    if (!editingArea || !areaEditForm.name.trim()) { showAdminToast({ title: "Thiếu thông tin", message: "Vui lòng nhập tên khu vực.", type: "warning" }); return; }
    try {
      const updatedArea = await tableService.updateArea(editingArea.id, { name: areaEditForm.name.trim(), description: areaEditForm.description.trim() });
      setAreas((prev) => sortAreasByPriority(prev.map((area) => String(area.id) === String(editingArea.id) ? updatedArea : area)));
      setTables((prev) => prev.map((table) => String(table.areaId) === String(editingArea.id) ? { ...table, areaName: updatedArea.name } : table));
      setSelectedTable((prev) => prev && String(prev.areaId) === String(editingArea.id) ? { ...prev, areaName: updatedArea.name } : prev);
      setAddForm((prev) => String(prev.selectedArea) === String(editingArea.id) ? { ...prev, selectedAreaTitle: updatedArea.name } : prev);
      setAssignForm((prev) => String(prev.areaId) === String(editingArea.id) ? { ...prev, areaId: updatedArea.id } : prev);
      setEditingArea(null);
      showAdminToast({ title: "Cập nhật khu vực thành công", message: `Đã cập nhật khu vực ${updatedArea.name}.` });
      window.dispatchEvent(new Event("areasUpdated"));
      window.dispatchEvent(new Event("tablesUpdated"));
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể cập nhật khu vực.", type: "error" }); }
  };

  const handleDeleteArea = async (id, name) => {
    try {
      await tableService.deleteArea(id);
      showAdminToast({ title: "Xóa khu vực thành công", message: `Đã xóa khu vực ${name} và không gian tương ứng.` });
      await loadTableLayout();
      window.dispatchEvent(new Event("areasUpdated"));
      window.dispatchEvent(new Event("tablesUpdated"));
      setEditingArea(null);
      setDeleteConfirmArea(null);
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể xóa khu vực.", type: "error" }); }
  };

  // ─── Table CRUD ───────────────────────────────────────────────────
  const openAddTable = () => {
    const currentArea = areas.find((area) => String(area.id) === String(selectedArea)) || areas[0];
    if (!currentArea) { showAdminToast({ title: "Chưa có khu vực", message: "Vui lòng tạo khu vực trước khi thêm bàn.", type: "warning" }); return; }
    setTableForm({ areaId: currentArea.id, capacity: 4, status: "available", description: "" });
    setIsAddingTable(true);
  };

  const saveAddTable = async () => {
    if (!tableForm.areaId) { showAdminToast({ title: "Thiếu thông tin", message: "Vui lòng chọn khu vực.", type: "warning" }); return; }
    if (Number(tableForm.capacity) <= 0) { showAdminToast({ title: "Không hợp lệ", message: "Sức chứa phải lớn hơn 0.", type: "warning" }); return; }
    try {
      const savedTable = await tableService.createTable({ areaId: tableForm.areaId, code: "", capacity: Number(tableForm.capacity || 4), status: tableForm.status, description: tableForm.description.trim() });
      setTables((prev) => [...prev, savedTable]);
      setSelectedArea(savedTable.areaId);
      setSelectedTable(savedTable);
      setActiveTab("map");
      setTableForm({ areaId: savedTable.areaId, capacity: 4, status: "available", description: "" });
      setIsAddingTable(false);
      showAdminToast({ title: "Thêm bàn thành công", message: `Đã thêm bàn ${savedTable.code}.` });
      window.dispatchEvent(new Event("tablesUpdated"));
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể thêm bàn.", type: "error" }); }
  };

  const openEditTable = (table) => {
    const editableStatus = table.status === "holding" || table.status === "booked" ? "available" : table.status;
    setEditingTable(table);
    setEditForm({ areaId: table.areaId, code: table.code, capacity: table.capacity, status: editableStatus, description: table.description });
  };

  const saveEditTable = async () => {
    const targetTable = editingTable || controlTable;
    if (!targetTable) return;
    try {
      const updatedTable = await tableService.updateTable(targetTable.id, {
        areaId: editForm.areaId,
        code: String(editForm.code || "").trim(),
        capacity: Number(editForm.capacity),
        status: editForm.status,
        description: editForm.description
      });
      setTables((prev) => prev.map((table) => String(table.id) === String(targetTable.id) ? updatedTable : table));
      setSelectedTable(updatedTable);
      setEditingTable(null);
      setControlTable(updatedTable);
      setIsEditingTableInline(false);
      showAdminToast({ title: "Cập nhật bàn thành công", message: `Đã cập nhật bàn ${updatedTable.code}.` });
      window.dispatchEvent(new Event("tablesUpdated"));
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể cập nhật bàn.", type: "error" }); }
  };

  const updateTableStatus = async (tableId, status) => {
    try {
      const updatedTable = await tableService.updateTableStatus(tableId, status);
      setTables((prev) => prev.map((table) => String(table.id) === String(tableId) ? updatedTable : table));
      setSelectedTable((prev) => prev && String(prev.id) === String(tableId) ? updatedTable : prev);
      // Also sync the control panel's currently viewed table
      setControlTable((prev) => prev && String(prev.id) === String(tableId) ? { ...prev, ...updatedTable } : prev);
      showAdminToast({ title: "Cập nhật trạng thái bàn thành công", message: `Đã chuyển bàn ${updatedTable.code} sang "${TABLE_STATUS[status]}".` });
      window.dispatchEvent(new Event("tablesUpdated"));
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể cập nhật trạng thái bàn.", type: "error" }); }
  };


  // ─── Booking Actions ──────────────────────────────────────────────
  const cancelCurrentBooking = async (booking) => {
    if (!booking) return;
    const confirmCancel = await showConfirm({ title: "Hủy đặt bàn", message: `Bạn có chắc muốn hủy đặt bàn ${booking.bookingCode || `DB${booking.id}`}?`, icon: <AlertTriangle size={28} />, iconBg: "bg-red-50 text-red-600", confirmStyle: "bg-red-600 hover:bg-red-700", confirmText: "Hủy đặt bàn" });
    if (!confirmCancel) return;
    try {
      const updatedBooking = await bookingService.updateBookingStatus(booking.id, "cancelled");
      setBookings((prev) => prev.map((item) => String(item.id) === String(booking.id) ? updatedBooking : item));
      setSelectedTable((prev) => prev ? { ...prev, status: "available", currentBooking: null } : prev);
      showAdminToast({ title: "Hủy đặt bàn thành công", message: `Đã hủy đặt bàn ${updatedBooking.bookingCode || `DB${updatedBooking.id}`}.` });
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể hủy đặt bàn.", type: "error" }); }
  };

  const confirmCurrentBooking = async (booking) => {
    if (!booking) return;
    try {
      const updatedBooking = await bookingService.updateBookingStatus(booking.id, "confirmed");
      setBookings((prev) => prev.map((item) => String(item.id) === String(booking.id) ? updatedBooking : item));
      setSelectedTable((prev) => prev ? { ...prev, status: "booked", currentBooking: updatedBooking } : prev);
      showAdminToast({ title: "Xác nhận đặt bàn thành công", message: `Đã xác nhận đặt bàn ${updatedBooking.bookingCode || `DB${updatedBooking.id}`}.` });
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể xác nhận đặt bàn.", type: "error" }); }
  };

  const completeCurrentBooking = async (booking, table) => {
    if (!booking || !table) return;
    if (booking.paymentStatus !== "paid") {
      const isPrivileged = ["admin", "manager"].includes(currentUser?.role);
      if (isPrivileged) {
        const bypass = await showConfirm({ title: "Cảnh báo thanh toán", message: `Lịch đặt bàn DB${booking.id} chưa được thanh toán!\n\nBạn là Quản lý/Admin, bạn có chắc chắn muốn bỏ qua thanh toán để HOÀN THÀNH phục vụ và giải phóng bàn ${table.code} không?`, icon: <AlertTriangle size={28} />, iconBg: "bg-red-50 text-red-600", confirmStyle: "bg-red-600 hover:bg-red-700", confirmText: "Bỏ qua & Hoàn thành" });
        if (!bypass) return;
      } else {
        showAdminToast({ title: "Chưa thanh toán", message: "Không thể hoàn thành dịch vụ: Bàn này chưa thanh toán hóa đơn! Vui lòng thực hiện thanh toán trước.", type: "warning" });
        return;
      }
    }
    const confirmComplete = await showConfirm({ title: "Xác nhận hoàn thành", message: `Bạn có chắc muốn hoàn thành đặt bàn ${booking.bookingCode || `DB${booking.id}`} và mở lại bàn ${table.code}?`, icon: <CheckCircle size={28} />, iconBg: "bg-green-50 text-green-600", confirmStyle: "bg-green-600 hover:bg-green-700", confirmText: "OK" });
    if (!confirmComplete) return;
    try {
      const updatedBooking = await bookingService.updateBookingStatus(booking.id, "completed");
      const updatedTable = await tableService.updateTableStatus(table.id, "available");
      setBookings((prev) => prev.map((item) => String(item.id) === String(booking.id) ? updatedBooking : item));
      setTables((prev) => prev.map((item) => String(item.id) === String(table.id) ? updatedTable : item));
      setSelectedTable({ ...updatedTable, currentBooking: null });
      showAdminToast({ title: "Hoàn thành đặt bàn thành công", message: `Đã hoàn thành đặt bàn ${updatedBooking.bookingCode || `DB${updatedBooking.id}`} và mở lại bàn ${updatedTable.code}.` });
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể hoàn thành đặt bàn.", type: "error" }); }
  };

  const startServingBooking = async (booking, table) => {
    if (!booking || !table) return;
    try {
      const updatedTable = await tableService.updateTableStatus(table.id, "serving");
      const updatedBooking = await bookingService.updateBookingStatus(booking.id, "serving");
      setTables((prev) => prev.map((item) => String(item.id) === String(table.id) ? updatedTable : item));
      setBookings((prev) => prev.map((item) => String(item.id) === String(booking.id) ? updatedBooking : item));
      setSelectedTable({ ...updatedTable, currentBooking: updatedBooking });
      showAdminToast({ title: "Nhận bàn thành công", message: `Đã chuyển bàn ${table.code} sang trạng thái phục vụ.` });
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể nhận bàn.", type: "error" }); }
  };

  // ─── Assign Booking ───────────────────────────────────────────────
  const unassignedBookings = bookings.filter((booking) => {
    const isActive = ["pending", "confirmed", "Chờ xác nhận", "Đã xác nhận"].includes(booking.status);
    const noArea = !booking.selectedAreaTitle || booking.selectedAreaTitle === "Nhà hàng sắp xếp" || booking.selectedAreaTitle === "Đang xếp";
    const noTable = !booking.selectedTable || booking.selectedTable === "Đang xếp" || booking.selectedTable === "Đang sắp xếp";
    return isActive && (noArea || noTable);
  });

  const openAssignBookingModal = (booking) => {
    const firstArea = areas[0];
    setAssignBooking(booking);
    setAssignForm({ areaId: booking.selectedArea || firstArea?.id || "", tableCode: "" });
  };

  const saveAssignBooking = async () => {
    if (!assignBooking) return;
    if (!assignForm.tableCode) { showAdminToast({ title: "Thiếu thông tin", message: "Vui lòng chọn bàn", type: "warning" }); return; }
    const area = areas.find((item) => String(item.id) === String(assignForm.areaId));
    try {
      const updatedBooking = await bookingService.updateBooking(assignBooking.id, { status: "confirmed", selectedArea: assignForm.areaId, selectedAreaTitle: area?.name || "", selectedTable: assignForm.tableCode, note: assignBooking.note || "", date: assignBooking.date, time: assignBooking.time, guests: Number(assignBooking.guests || assignBooking.people || 1) });
      setBookings((prev) => prev.map((booking) => String(booking.id) === String(assignBooking.id) ? updatedBooking : booking));
      setSelectedTable((prev) => prev ? { ...prev, status: "booked", currentBooking: updatedBooking } : prev);
      setAssignBooking(null);
      showAdminToast({ title: "Xếp bàn thành công", message: `Đã xếp bàn ${assignForm.tableCode} cho ${updatedBooking.bookingCode || `DB${updatedBooking.id}`}.` });
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể xếp bàn.", type: "error" }); }
  };

  const isTableBookedAtDate = (tableCode, date) => {
    return bookings.some((booking) => String(booking.selectedTable) === String(tableCode) && booking.date === date && ["pending", "confirmed", "Chờ xác nhận", "Đã xác nhận"].includes(booking.status));
  };

  // ─── Add Booking ──────────────────────────────────────────────────

  const getTableStatusForAdd = (table) => {
    if (!addForm.date) return table.status;
    const existedBooking = bookings.find((booking) => String(booking.selectedTable) === String(table.code) && booking.date === addForm.date && ["pending", "confirmed", "Chờ xác nhận", "Đã xác nhận"].includes(booking.status));
    if (existedBooking?.status === "pending" || existedBooking?.status === "Chờ xác nhận") return "holding";
    if (existedBooking?.status === "confirmed" || existedBooking?.status === "Đã xác nhận") return "booked";
    return table.status;
  };

  const findBestTableForAddBooking = () => {
    const guestCount = Number(addForm.guests || 0);
    return tables.filter((table) => {
      const sameArea = String(table.areaId) === String(addForm.selectedArea);
      const available = table.status === "available" && !isTableBookedAtDate(table.code, addForm.date);
      const enoughCapacity = guestCount <= 0 || Number(table.capacity || 0) >= guestCount;
      return sameArea && available && enoughCapacity;
    }).sort((a, b) => {
      const capacityDiff = Number(a.capacity || 0) - Number(b.capacity || 0);
      if (capacityDiff !== 0) return capacityDiff;
      return String(a.code || "").localeCompare(String(b.code || ""), "vi", { numeric: true });
    })[0] || null;
  };

  const handleSelectTableForAddBooking = async (table, status) => {
    if (status !== "available") return;
    const guestCount = Number(addForm.guests || 0);
    const tableCapacity = Number(table.capacity || 0);
    if (guestCount > 0 && tableCapacity < guestCount) {
      const suggestedTable = findBestTableForAddBooking();
      if (suggestedTable) {
        const shouldSwitch = await showConfirm({ title: "Gợi ý chuyển bàn", message: `Bàn ${table.code} chỉ chứa tối đa ${tableCapacity} người, nhưng lịch đặt này có ${guestCount} khách.\n\nBạn có muốn chuyển sang bàn ${suggestedTable.code} (${suggestedTable.capacity} người) không?`, icon: <HelpCircle size={28} />, iconBg: "bg-blue-50 text-blue-600", confirmStyle: "bg-green-600 hover:bg-green-700", confirmText: "Chuyển bàn" });
        if (shouldSwitch) setAddForm((prev) => ({ ...prev, selectedTable: suggestedTable.code }));
        return;
      }
      showAdminToast({ title: "Sức chứa không phù hợp", message: `Bàn ${table.code} chỉ chứa tối đa ${tableCapacity} người. Hiện khu vực này không có bàn phù hợp cho ${guestCount} khách.`, type: "warning" });
      return;
    }
    setAddForm((prev) => ({ ...prev, selectedTable: table.code }));
  };

  const saveAddBooking = async () => {
    const errs = {};
    if (!addForm.customerName.trim()) errs.customerName = "Vui lòng nhập tên khách hàng";
    if (!addForm.phone.trim()) {
      errs.phone = "Vui lòng nhập số điện thoại";
    } else {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(addForm.phone.trim())) {
        errs.phone = "Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)";
      }
    }
    if (!addForm.date) errs.date = "Vui lòng chọn ngày đặt bàn";
    if (!addForm.time) errs.time = "Vui lòng chọn giờ đặt bàn";
    const guestCount = Number(addForm.guests);
    if (!Number.isFinite(guestCount) || guestCount <= 0) {
      errs.guests = "Số khách phải lớn hơn 0";
    }
    if (!addForm.selectedTable) errs.selectedTable = "Vui lòng chọn bàn";

    if (Object.keys(errs).length > 0) {
      setAddErrors(errs);
      showAdminToast({
        title: "Lỗi nhập liệu",
        message: "Vui lòng kiểm tra các trường thông tin lỗi (được viền đỏ) và chọn bàn.",
        type: "error",
      });
      return;
    }
    setAddErrors({});

    const selectedTableData = tables.find((table) => String(table.code) === String(addForm.selectedTable) && String(table.areaId) === String(addForm.selectedArea));
    if (!selectedTableData) {
      showAdminToast({ title: "Lỗi dữ liệu", message: "Bàn đã chọn không hợp lệ. Vui lòng chọn lại.", type: "error" });
      setAddErrors({ selectedTable: true });
      return;
    }
    if (guestCount > Number(selectedTableData.capacity || 0)) {
      const suggestedTable = findBestTableForAddBooking();
      if (suggestedTable) {
        const shouldSwitch = await showConfirm({ title: "Gợi ý chuyển bàn", message: `Bàn ${selectedTableData.code} chỉ chứa tối đa ${selectedTableData.capacity} người, nhưng lịch đặt này có ${addForm.guests} khách.\n\nBạn có muốn chuyển sang bàn ${suggestedTable.code} (${suggestedTable.capacity} người) không?`, icon: <HelpCircle size={28} />, iconBg: "bg-blue-50 text-blue-600", confirmStyle: "bg-green-600 hover:bg-green-700", confirmText: "Chuyển bàn" });
        if (shouldSwitch) setAddForm((prev) => ({ ...prev, selectedTable: suggestedTable.code }));
        return;
      }
      showAdminToast({ title: "Sức chứa không phù hợp", message: `Khu vực này không có bàn phù hợp cho ${addForm.guests} khách. Vui lòng chọn khu vực khác.`, type: "warning" });
      return;
    }
    try {
      const savedBooking = await bookingService.createAdminBooking({ customerName: addForm.customerName.trim(), phone: addForm.phone.trim(), email: addForm.email.trim(), date: addForm.date, time: addForm.time, guests: guestCount, selectedArea: addForm.selectedArea, selectedAreaTitle: addForm.selectedAreaTitle, selectedTable: addForm.selectedTable, note: addForm.note.trim(), status: addForm.status, type: "table_only", total: 0 });
      setBookings((prev) => [savedBooking, ...prev]);
      setSelectedTable(null);
      setIsAddingBooking(false);
      const firstArea = areas[0];
      setAddForm({ customerName: "", phone: "", email: "", date: today, time: "", guests: 1, selectedArea: firstArea?.id || "", selectedAreaTitle: firstArea?.name || "", selectedTable: "", note: "", status: "pending" });
      showAdminToast({ title: "Tạo đặt bàn thành công", message: `Đã tạo đặt bàn ${savedBooking.bookingCode || `DB${savedBooking.id}`}.` });
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể tạo đặt bàn.", type: "error" }); }
  };

  const resetFilter = () => { setSearch(""); setAreaFilter("all"); setStatusFilter("all"); setCapacityFilter("all"); };

  // ─── RENDER ───────────────────────────────────────────────────────
  if (controlTable && tableExtraData) {
    const qrUrl = `${window.location.origin}/menu?table=${controlTable.code}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrUrl)}&color=1a472a&bgcolor=ffffff&margin=10`;
    const statusLabel = controlTable.status === "available" ? "Mở bàn trống" :
      controlTable.status === "serving" ? "Đang phục vụ" :
      controlTable.status === "booked" ? "Đã đặt" :
      controlTable.status === "holding" ? "Đang giữ" :
      controlTable.status === "maintenance" ? "Đang bảo trì" : "Ngừng sử dụng";
    const statusColor = controlTable.status === "available" ? "text-green-700" :
      controlTable.status === "serving" ? "text-blue-700" :
      controlTable.status === "maintenance" ? "text-yellow-700" : "text-gray-700";
    const statusBg = controlTable.status === "available" ? "bg-green-50 border-green-200" :
      controlTable.status === "serving" ? "bg-blue-50 border-blue-200" :
      controlTable.status === "maintenance" ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200";
    const statusDot = controlTable.status === "available" ? "bg-green-500" :
      controlTable.status === "serving" ? "bg-blue-500" :
      controlTable.status === "maintenance" ? "bg-yellow-500" : "bg-gray-400";

    return (
      <div className="text-left flex flex-col font-sans">
        {/* Breadcrumb + Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold mb-1">
              <button
                onClick={() => { setControlTable(null); setIsEditingTableInline(false); }}
                className="hover:text-green-700 hover:underline transition"
              >
                Bàn & Khu vực
              </button>
              <span>/</span>
              <span className="text-gray-600 font-black">Chi tiết bàn {controlTable.code}</span>
            </div>
            <h2 className="text-xl font-black text-green-955">Chi tiết bàn {controlTable.code}</h2>
            <p className="text-xs text-gray-400 font-bold mt-0.5">Khu vực: {controlTable.areaName} • Sức chứa: {controlTable.capacity} người</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => window.print()} className="h-9 px-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 transition flex items-center gap-1.5 shadow-sm">
              <Printer size={13} /> In chi tiết
            </button>
            <button
              onClick={() => setIsEditingTableInline(!isEditingTableInline)}
              className={`h-9 px-3.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm ${
                isEditingTableInline ? "bg-green-700 text-white hover:bg-green-800" : "bg-green-955 text-white hover:bg-green-900"
              }`}
            >
              <Pencil size={13} />
              {isEditingTableInline ? "Xem chi tiết" : "Chỉnh sửa bàn"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveModalTab("config")}
            className={`py-2 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeModalTab === "config" ? "border-green-700 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Building2 size={14} /> Cấu hình chi tiết bàn
          </button>
          <button
            onClick={() => setActiveModalTab("booking")}
            className={`py-2 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 relative ${
              activeModalTab === "booking" ? "border-green-700 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <CalendarCheck size={14} /> Thông tin đặt bàn
            {controlTable.currentBooking && <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-1.5 animate-ping" />}
          </button>
        </div>

        {/* ─── CONFIG TAB ─────────────────────────────────────────── */}
        {activeModalTab === "config" && (
          <div className="space-y-3">
            {/* TOP ROW: 3 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

              {/* Col 1: Thông tin cơ bản */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-150 shadow-sm p-4">
                <h3 className="font-black text-[11px] text-green-955 uppercase tracking-wider pb-2 border-b border-gray-100 mb-3">Thông tin cơ bản</h3>
                {isEditingTableInline ? (
                  <div className="space-y-2.5 text-xs font-bold text-gray-600">
                    <label className="block"><span className="text-gray-400 text-[10px]">Mã bàn</span>
                      <input type="text" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} className="mt-1 w-full h-8 rounded-lg border border-gray-200 px-3 text-xs font-semibold outline-none focus:border-green-700 transition" />
                    </label>
                    <label className="block"><span className="text-gray-400 text-[10px]">Sức chứa</span>
                      <input type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })} className="mt-1 w-full h-8 rounded-lg border border-gray-200 px-3 text-xs font-semibold outline-none focus:border-green-700 transition" />
                    </label>
                    <label className="block"><span className="text-gray-400 text-[10px]">Khu vực</span>
                      <select value={editForm.areaId} onChange={(e) => setEditForm({ ...editForm, areaId: e.target.value })} className="mt-1 w-full h-8 rounded-lg border border-gray-200 px-3 text-xs font-semibold outline-none focus:border-green-700 transition bg-white">
                        {areas.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                      </select>
                    </label>
                    <label className="block"><span className="text-gray-400 text-[10px]">Mô tả</span>
                      <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1 w-full h-14 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold outline-none resize-none focus:border-green-700 transition" />
                    </label>
                    <button onClick={saveEditTable} className="w-full h-9 rounded-lg bg-green-700 text-white font-black hover:bg-green-800 transition text-xs">Lưu thay đổi bàn</button>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {[
                      ["Mã bàn", tableExtraData.basicInfo.code],
                      ["Tên bàn", tableExtraData.basicInfo.name],
                      ["Khu vực", tableExtraData.basicInfo.area],
                      ["Sức chứa", tableExtraData.basicInfo.capacity],
                      ["Vị trí", tableExtraData.basicInfo.position],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between py-0.5 border-b border-gray-50">
                        <span className="text-gray-400 font-bold">{label}</span>
                        <span className="font-black text-green-955 text-right">{val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-0.5 border-b border-gray-50 items-center">
                      <span className="text-gray-400 font-bold">Loại bàn</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-50 text-green-700 border border-green-200">{tableExtraData.basicInfo.type}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-400 font-bold shrink-0">Mô tả</span>
                      <span className="font-semibold text-gray-500 text-right max-w-[150px] leading-tight text-[10px]">{tableExtraData.basicInfo.description}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 mt-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Tiện ích</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {tableExtraData.basicInfo.amenities.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-600">
                            <span className="text-green-700">✓</span><span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Col 2: Hình ảnh bàn */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-150 shadow-sm p-4 flex flex-col">
                <h3 className="font-black text-[11px] text-green-955 uppercase tracking-wider pb-2 border-b border-gray-100 mb-3">Hình ảnh bàn</h3>
                <div className="relative flex-1 min-h-[180px] rounded-xl overflow-hidden border border-gray-100 shadow-inner group">
                  <img src={tableExtraData.imageSrc} alt={tableExtraData.basicInfo.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" style={{ minHeight: 180 }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {/* Carousel dots */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {[0,1,2,3,4].map((i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full transition ${i===0 ? "bg-white" : "bg-white/50"}`} />
                    ))}
                  </div>
                  <button className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition">
                    <ChevronLeft size={14} />
                  </button>
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition">
                    <ChevronRight size={14} />
                  </button>
                </div>
                <button className="mt-3 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition flex items-center justify-center gap-1.5">
                  <Pencil size={12} /> Thay đổi hình ảnh
                </button>
              </div>

              {/* Col 3: QR code + Trạng thái & Hành động */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                {/* QR Code card */}
                <div className="bg-white rounded-2xl border-2 border-yellow-400 shadow-sm p-4 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-3">
                    <QrCode size={14} className="text-green-800" />
                    <h3 className="font-black text-[11px] text-green-955 uppercase tracking-wider">Mã QR Bàn</h3>
                    <span className="ml-auto text-gray-300 cursor-pointer"><HelpCircle size={13} /></span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-[90px] h-[90px] rounded-xl border border-gray-100 overflow-hidden shadow-sm flex-shrink-0 bg-white flex items-center justify-center">
                      <img id="qr-img-canvas" src={qrSrc} alt={`QR Bàn ${controlTable.code}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mb-3">Quét QR để xem menu và đặt món tại bàn</p>
                      <button
                        onClick={() => {
                          const img = new Image();
                          img.crossOrigin = "anonymous";
                          img.onload = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            const ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);
                            const link = document.createElement("a");
                            link.download = `QR-Ban-${controlTable.code}.png`;
                            link.href = canvas.toDataURL("image/png");
                            link.click();
                          };
                          img.src = qrSrc;
                        }}
                        className="h-8 px-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition font-bold text-xs text-gray-600 flex items-center gap-1.5"
                      >
                        <Download size={12} /> Tải mã QR
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trạng thái & Hành động nhanh */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-4 flex-1">
                  <h3 className="font-black text-[11px] text-green-955 uppercase tracking-wider pb-2 border-b border-gray-100 mb-3">Trạng thái & hành động nhanh</h3>
                  {/* Status badge */}
                  <div className={`rounded-xl px-3 py-2.5 border mb-3 flex items-center gap-2 ${statusBg}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${statusDot}`} />
                    <div>
                      <p className={`text-xs font-black ${statusColor}`}>{statusLabel}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">Bàn sẵn sàng phục vụ</p>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => { setEditForm({ ...editForm, status: "available" }); updateTableStatus(controlTable.id, "available"); }}
                      className={`h-8 rounded-xl font-black text-xs flex items-center justify-center gap-1 border transition ${
                        controlTable.status === "available" ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Unlock size={12} /> Mở bàn
                    </button>
                    <button
                      onClick={() => setActiveModalTab("booking")}
                      className="h-8 rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition font-black text-xs flex items-center justify-center gap-1"
                    >
                      <CalendarCheck size={12} /> Đặt bàn ngay
                    </button>
                    <button
                      onClick={() => updateTableStatus(controlTable.id, "disabled")}
                      className={`h-8 rounded-xl font-black text-xs flex items-center justify-center gap-1 border transition ${
                        controlTable.status === "disabled" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Lock size={12} /> Khóa bàn
                    </button>
                    <button
                      onClick={() => { setEditForm({ ...editForm, status: "maintenance" }); updateTableStatus(controlTable.id, "maintenance"); }}
                      className={`h-8 rounded-xl font-black text-xs flex items-center justify-center gap-1 border transition ${
                        controlTable.status === "maintenance" ? "bg-yellow-600 text-white border-yellow-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Wrench size={12} /> Bảo trì bàn
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: Bookings table (wide) + Timeline + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Bookings table */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-150 shadow-sm p-4">
                <h3 className="font-black text-[11px] text-green-955 uppercase tracking-wider pb-2 border-b border-gray-100 mb-3">Thông tin đặt bàn gần đây</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-gray-400 uppercase font-black border-b border-gray-100">
                        <th className="py-2 px-1.5">Mã đơn</th>
                        <th className="py-2 px-1.5">Khách hàng</th>
                        <th className="py-2 px-1.5">Ngày đặt</th>
                        <th className="py-2 px-1.5">Thời gian</th>
                        <th className="py-2 px-1.5">Số người</th>
                        <th className="py-2 px-1.5">Trạng thái</th>
                        <th className="py-2 px-1.5">Doanh thu</th>
                        <th className="py-2 px-1.5 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-gray-700">
                      {tableExtraData.recentBookings.map((bk, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                          <td className="py-2 px-1.5 text-green-900 font-black text-[11px] whitespace-nowrap">{bk.id}</td>
                          <td className="py-2 px-1.5 text-green-955 font-black text-[11px] max-w-[110px] truncate">{bk.customer}</td>
                          <td className="py-2 px-1.5 text-gray-500 text-[11px] whitespace-nowrap">{bk.date}</td>
                          <td className="py-2 px-1.5 text-gray-500 text-[11px] whitespace-nowrap">{bk.time}</td>
                          <td className="py-2 px-1.5 text-green-900 text-[11px] text-center">{bk.guests}</td>
                          <td className="py-2 px-1.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black whitespace-nowrap ${bk.statusClass}`}>{bk.status}</span>
                          </td>
                          <td className="py-2 px-1.5 text-gray-700 font-bold text-[11px] whitespace-nowrap">{bk.revenue}</td>
                          <td className="py-2 px-1.5 text-center">
                            <button
                              onClick={() => setViewBookingDetail(bk._raw)}
                              className="p-1 rounded bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 text-gray-500 hover:text-green-800 transition"
                              title="Xem chi tiết"
                            >
                              <Eye size={11} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3 text-[10px] font-bold text-gray-400">
                  <span>Hiển thị 1 - {Math.min(tableExtraData.recentBookings.length, 8)} trong tổng số {tableExtraData.stats.totalBookings} đặt bàn</span>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 rounded border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 transition text-xs"><ChevronLeft size={11} /></button>
                    <button className="w-6 h-6 rounded bg-green-700 text-white flex items-center justify-center font-black text-xs">1</button>
                    <button className="w-6 h-6 rounded border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 transition text-xs">2</button>
                    <button className="w-6 h-6 rounded border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 transition text-xs">3</button>
                    <span className="w-6 h-6 flex items-center justify-center text-xs text-gray-400">...</span>
                    <button className="w-6 h-6 rounded border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 transition text-xs">5</button>
                    <button className="w-6 h-6 rounded border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 transition text-xs"><ChevronRight size={11} /></button>
                  </div>
                </div>
              </div>

              {/* Lịch sử trạng thái */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-150 shadow-sm p-4">
                <h3 className="font-black text-[11px] text-green-955 uppercase tracking-wider pb-2 border-b border-gray-100 mb-3">Lịch sử trạng thái</h3>
                <div className="relative pl-5 border-l-2 border-gray-100 space-y-4 ml-1.5 py-1">
                  {tableExtraData.statusHistory.map((h, idx) => (
                    <div key={idx} className="relative text-xs">
                      <span className={`absolute -left-[22px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                        h.type === "current" ? "bg-green-500" : h.type === "ended" && h.statusClass.includes("blue") ? "bg-blue-400" : h.type === "ended" && h.statusClass.includes("orange") ? "bg-orange-400" : "bg-gray-300"
                      } ${idx === 0 ? "animate-pulse" : ""}`} />
                      <div className="font-bold">
                        <p className={`font-black text-xs ${idx === 0 ? "text-green-800" : "text-gray-700"}`}>{h.status}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{h.user}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{h.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 text-[11px] font-black text-green-700 hover:underline flex items-center gap-1 transition">
                  Xem tất cả lịch sử →
                </button>
              </div>

              {/* Thống kê sử dụng */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-150 shadow-sm p-4">
                <h3 className="font-black text-[11px] text-green-955 uppercase tracking-wider pb-2 border-b border-gray-100 mb-3">Thống kê sử dụng</h3>
                <div className="space-y-3">
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold">Tổng lượt sử dụng</p>
                    <p className="text-sm font-black text-green-955 mt-0.5">{tableExtraData.stats.uses} lần</p>
                  </div>
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold">Tỷ lệ lấp đầy</p>
                    <p className="text-sm font-black text-green-955 mt-0.5">{tableExtraData.stats.occupancy}%</p>
                  </div>
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold">Doanh thu tạo ra</p>
                    <p className="text-sm font-black text-green-955 mt-0.5">{tableExtraData.stats.revenue}</p>
                  </div>
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold">Đánh giá khách hàng</p>
                    <p className="text-sm font-black text-yellow-600 mt-0.5 flex items-center gap-1"><Star size={12} fill="currentColor" />{tableExtraData.stats.rating}/5</p>
                  </div>
                  <div className="p-2.5 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-[10px] text-green-700 font-black">Bàn được yêu thích</p>
                    <p className="text-[10px] text-green-800 font-bold mt-0.5 leading-snug">Top 3 bàn được đặt nhiều nhất trong {controlTable.areaName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Booking Detail Drawer ─────────────────────────────────── */}
        {viewBookingDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewBookingDetail(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-green-955">Chi tiết đặt bàn</h3>
                  <p className="text-xs text-gray-400 font-bold mt-0.5">{viewBookingDetail.bookingCode || `DB${viewBookingDetail.id}`}</p>
                </div>
                <button onClick={() => setViewBookingDetail(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition">
                  <X size={16} />
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                {[
                  ["Mã đặt bàn", viewBookingDetail.bookingCode || `DB${viewBookingDetail.id}`],
                  ["Khách hàng", viewBookingDetail.customerName],
                  ["Số điện thoại", viewBookingDetail.phone || "—"],
                  ["Email", viewBookingDetail.email || "Chưa có"],
                  ["Ngày đặt", viewBookingDetail.date ? new Date(viewBookingDetail.date).toLocaleDateString("vi-VN") : "—"],
                  ["Giờ", viewBookingDetail.time || "—"],
                  ["Số người", `${viewBookingDetail.guests || viewBookingDetail.people || "—"} người`],
                  ["Khu vực", viewBookingDetail.selectedAreaTitle || "—"],
                  ["Bàn", viewBookingDetail.selectedTable || "—"],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-gray-400 font-bold text-[10px]">{label}</p>
                    <p className="font-black text-green-955 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              {/* Status */}
              {(() => {
                const sMap = {
                  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
                  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
                  serving: "bg-blue-100 text-blue-800 border-blue-300",
                  completed: "bg-green-50 text-green-700 border-green-200",
                  cancelled: "bg-red-50 text-red-600 border-red-200",
                };
                const cls = sMap[viewBookingDetail.status] || "bg-gray-50 text-gray-600 border-gray-200";
                const labels = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", serving: "Đang phục vụ", completed: "Đã thanh toán", cancelled: "Đã hủy" };
                const label = labels[viewBookingDetail.status] || viewBookingDetail.status;
                return (
                  <div className={`rounded-xl px-4 py-2.5 border mb-4 flex items-center gap-2 ${cls}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse flex-shrink-0" />
                    <span className="font-black text-xs">{label}</span>
                    {viewBookingDetail.total > 0 && (
                      <span className="ml-auto font-black text-xs">{Number(viewBookingDetail.total).toLocaleString("vi-VN")}đ</span>
                    )}
                  </div>
                );
              })()}

              {/* Note */}
              {viewBookingDetail.note && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs mb-4">
                  <p className="text-amber-700 font-black text-[10px] uppercase mb-1">Ghi chú</p>
                  <p className="font-semibold text-amber-800">{viewBookingDetail.note}</p>
                </div>
              )}

              {/* Pre-ordered items */}
              {viewBookingDetail.cartItems && viewBookingDetail.cartItems.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Món ăn đặt trước</p>
                  <div className="space-y-2">
                    {viewBookingDetail.cartItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                        {item.image && <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-green-955 text-xs truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{Number(item.price || 0).toLocaleString("vi-VN")}đ x {item.qty}</p>
                        </div>
                        <p className="font-black text-green-900 text-xs">{Number((item.price || 0) * (item.qty || 0)).toLocaleString("vi-VN")}đ</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setViewBookingDetail(null)}
                className="w-full h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {activeModalTab === "booking" && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-150 p-6 shadow-sm text-left">
              {controlTable.currentBooking ? (
                <div className="space-y-6">
                  <h4 className="font-black text-base text-green-955 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center gap-1.5">
                    <CalendarCheck size={18} className="text-green-800" />
                    Thông tin đặt bàn hiện tại
                  </h4>

                  {/* Booking Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 text-xs font-bold text-gray-600">
                    <div className="space-y-1">
                      <p className="text-gray-400">Mã đặt bàn:</p>
                      <p className="text-green-955 font-black text-sm">DB{controlTable.currentBooking.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Khách hàng:</p>
                      <p className="text-green-955 font-black text-sm">{controlTable.currentBooking.customerName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Số điện thoại:</p>
                      <p className="text-green-955 font-black">{controlTable.currentBooking.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Email nhận vé:</p>
                      <p className="text-green-955 font-black truncate">{controlTable.currentBooking.email || "Chưa cung cấp"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Thời gian hẹn:</p>
                      <p className="text-green-955 font-black">{formatDate(controlTable.currentBooking.date)} - {controlTable.currentBooking.time}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Số lượng khách:</p>
                      <p className="text-green-955 font-black">{controlTable.currentBooking.guests} người</p>
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <p className="text-gray-400">Ghi chú đặc biệt:</p>
                      <p className="text-green-955 font-black italic">"{controlTable.currentBooking.note || "Không có"}"</p>
                    </div>
                  </div>

                  {/* Cart Items Table */}
                  <div className="space-y-3">
                    <span className="text-xs font-black text-gray-500 block">Các món ăn đặt kèm</span>
                    {controlTable.currentBooking.cartItems && controlTable.currentBooking.cartItems.length > 0 ? (
                      <div className="border border-gray-155 rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto bg-white shadow-sm">
                        {controlTable.currentBooking.cartItems.map((item, idx) => (
                          <div key={item.id || idx} className="flex items-center gap-3.5 p-3 border-b border-gray-50 last:border-0 text-xs">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg bg-gray-50 shrink-0 border border-gray-100" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-green-955 truncate">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-extrabold">{Number(item.price || 0).toLocaleString("vi-VN")}đ x {item.qty}</p>
                            </div>
                            <span className="font-black text-green-900">{Number((item.price || 0) * (item.qty || 0)).toLocaleString("vi-VN")}đ</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-400 font-bold border border-dashed border-gray-200">
                        Khách chưa pre-order món ăn nào
                      </div>
                    )}
                  </div>

                  {/* Booking Control Actions */}
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    {controlTable.currentBooking.status === "pending" && (
                      <button
                        onClick={() => {
                          setControlTable(null);
                          confirmCurrentBooking(controlTable.currentBooking);
                        }}
                        className="w-full h-12 rounded-xl bg-green-700 text-white font-black hover:bg-green-800 transition text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={16} />
                        Xác nhận đặt bàn
                      </button>
                    )}

                    {controlTable.currentBooking.status === "confirmed" && controlTable.status !== "serving" && (
                      <button
                        onClick={() => {
                          setControlTable(null);
                          startServingBooking(controlTable.currentBooking, controlTable);
                        }}
                        className="w-full h-12 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Clock3 size={16} />
                        Nhận bàn / Bắt đầu phục vụ
                      </button>
                    )}

                    {controlTable.status === "serving" && (
                      <div className="space-y-2">
                        {controlTable.currentBooking.paymentStatus !== "paid" ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setControlTable(null);
                                billing.setActiveAddItemsBooking(controlTable.currentBooking);
                              }}
                              className="h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 font-black hover:bg-blue-100 transition text-xs"
                            >
                              Thêm món
                            </button>
                            <button
                              onClick={() => {
                                setControlTable(null);
                                billing.setActiveBillingBooking(controlTable.currentBooking);
                              }}
                              className="h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-black hover:bg-emerald-100 transition text-xs"
                            >
                              Thanh toán
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center text-xs font-black text-green-700">
                            Đã thanh toán hóa đơn thành công. Hãy bấm Hoàn thành bên dưới để dọn bàn.
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setControlTable(null);
                            completeCurrentBooking(controlTable.currentBooking, controlTable);
                          }}
                          className="w-full h-11 rounded-xl bg-green-700 text-white font-black hover:bg-green-800 transition text-xs shadow-sm"
                        >
                          Hoàn thành phục vụ
                        </button>
                      </div>
                    )}

                    {controlTable.status !== "serving" && (
                      <button
                        onClick={() => {
                          setControlTable(null);
                          cancelCurrentBooking(controlTable.currentBooking);
                        }}
                        className="w-full h-11 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black hover:bg-red-100 transition text-xs flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={14} />
                        Hủy lịch đặt bàn này
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-xs space-y-3">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
                    <CalendarCheck size={28} />
                  </div>
                  <p className="font-black text-gray-400 text-sm">Bàn này chưa có lịch đặt hiện tại</p>
                  <p className="text-gray-400 font-medium max-w-[320px] leading-relaxed">
                    Khi khách hàng đặt đúng mã bàn này trên website hoặc ứng dụng, thông tin chi tiết đặt bàn và đơn món ăn sẽ tự động đồng bộ hiển thị ở đây.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="overflow-x-auto xl:overflow-visible pb-1">
        <div className="grid grid-flow-col auto-cols-[150px] sm:auto-cols-[158px] md:auto-cols-[166px] lg:auto-cols-[172px] xl:grid-flow-row xl:grid-cols-6 xl:auto-cols-auto gap-2 w-max xl:w-full">
          <StatCard icon={<Building2 size={18} />} title="Tổng khu vực" value={totalAreas} bg="bg-green-50" color="text-green-700" note="hiện tại" />
          <StatCard icon={<LayoutGrid size={18} />} title="Tổng bàn" value={totalTables} bg="bg-blue-50" color="text-blue-600" note="hiện tại" />
          <StatCard icon={<CheckCircle size={18} />} title="Bàn trống" value={availableCount} bg="bg-green-50" color="text-green-600" note="hiện tại" />
          <StatCard icon={<Clock3 size={18} />} title="Đang giữ ngày đã chọn" value={holdingCount} bg="bg-orange-50" color="text-orange-600" note="theo lịch chọn" />
          <StatCard icon={<CalendarCheck size={18} />} title="Đã đặt ngày đã chọn" value={bookedCount} bg="bg-red-50" color="text-red-600" note="theo lịch chọn" />
          <StatCard icon={<Wrench size={18} />} title="Bảo trì" value={maintenanceCount} bg="bg-gray-100" color="text-gray-600" note="hiện tại" />
        </div>
      </div>

      {tableLoading && (
        <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-black text-green-700">
          Đang tải danh sách bàn/khu vực...
        </div>
      )}

      <div className={`grid grid-cols-1 gap-4 items-start ${selectedTable ? "xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-w-0">
          {/* Tabs */}
          <div className="px-5 border-b border-gray-100">
            <div className="flex items-center gap-8 overflow-x-auto">
              <TabButton active={activeTab === "map"} onClick={() => setActiveTab("map")}>Sơ đồ bàn</TabButton>
              <TabButton active={activeTab === "list"} onClick={() => setActiveTab("list")}>Danh sách bàn</TabButton>
            </div>
          </div>

          {/* Map Tab */}
          {activeTab === "map" && (
            <>
              <div className="px-4 pt-4">
                <div className="rounded-2xl border border-gray-100 bg-green-50/40 p-4 flex flex-col md:flex-row md:items-end gap-4">
                  <label className="block">
                    <span className="text-sm font-black text-green-900">Ngày xem trạng thái bàn</span>
                    <input type="date" value={viewDate} onChange={(e) => { setViewDate(e.target.value); setSelectedTable(null); }} className="mt-2 h-11 rounded-xl border border-green-100 bg-white px-4 font-bold outline-none" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[210px_minmax(0,1fr)] 2xl:grid-cols-[230px_minmax(0,1fr)] gap-3 sm:gap-4 p-3 sm:p-4">
                {/* Area sidebar */}
                <aside className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 self-start">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-primary">Khu vực</h3>
                  </div>
                  <div className="space-y-3">
                    {areas.map((area) => {
                      const areaTableCount = displayTables.filter((table) => String(table.areaId) === String(area.id)).length;
                      const bookedCount = displayTables.filter((table) => String(table.areaId) === String(area.id) && table.currentBooking).length;
                      const isActive = String(selectedArea) === String(area.id);
                      return (
                        <div key={area.id} className={`group w-full rounded-xl border p-3 sm:p-4 transition flex items-start justify-between gap-3 ${isActive ? "bg-primary-50 border-primary/20 border-t-primary" : "bg-white border-gray-100 text-gray-600 hover:bg-primary-50/50"}`}>
                          <button type="button" onClick={() => setSelectedArea(area.id)} className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm sm:text-base leading-5">{area.name}</span>
                              {bookedCount > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                                  {bookedCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm font-semibold mt-1">{areaTableCount} bàn</p>
                          </button>

                        </div>
                      );
                    })}
                  </div>
                </aside>

                {/* Map content */}
                <div className="space-y-4 min-w-0">
                  <div className="overflow-x-auto pb-1 -mx-1 px-1">
                    <div className="flex items-center gap-2 min-w-max xl:min-w-0 xl:w-full">
                      <div className="flex items-center gap-1.5 shrink-0">
                        {Object.entries(TABLE_STATUS).map(([key, label]) => (
                          <Legend key={key} color={STATUS_DOT[key]} text={label} compact={!!selectedTable} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 xl:ml-auto">
                        {canUseAction(currentUser, "tables:create") && (
                          <button onClick={openAddTable} className="h-8 px-3 rounded-xl bg-primary-800 text-white text-[11px] font-black flex items-center justify-center gap-1.5 hover:bg-primary-900 transition whitespace-nowrap">
                            <Plus size={14} />Thêm bàn
                          </button>
                        )}
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 w-[132px] rounded-xl border border-gray-100 px-2.5 text-[11px] font-black outline-none bg-white">
                          <option value="all">Tất cả trạng thái</option>
                          {Object.entries(TABLE_STATUS).filter(([key]) => key !== "holding" && key !== "booked").map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {areas.filter((area) => selectedArea === "all" || String(area.id) === String(selectedArea)).map((area) => {
                    const areaTables = displayTables.filter((table) => String(table.areaId) === String(area.id) && (statusFilter === "all" || table.status === statusFilter));
                    return (
                      <div key={area.id} className="rounded-2xl border border-gray-100 p-4">
                        <h3 className="font-black text-primary mb-4">{area.name} <span className="text-sm text-gray-500">({areaTables.length} bàn)</span></h3>
                        <div className="px-1 py-3">
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 xl:gap-4">
                            {areaTables.map((table) => (
                              <TableButton key={table.id} table={table} active={selectedTable?.id === table.id} onClick={() => setSelectedTable(table)} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unassigned Bookings */}
              {unassignedBookings.length > 0 && (
                <section className="mx-4 mb-4 rounded-2xl border border-orange-100 bg-orange-50/40 overflow-hidden">
                  <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between">
                    <h3 className="font-black text-primary">Khách đặt bàn chưa chọn khu vực / bàn</h3>
                    <span className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 text-sm font-black">{unassignedBookings.length} lịch</span>
                  </div>
                  <div className="max-h-[390px] overflow-auto relative">
                    <table className="min-w-[1230px] w-full text-left text-sm table-fixed">
                      <thead className="sticky top-0 z-30 bg-white text-gray-600 font-black text-xs uppercase shadow-sm">
                        <tr>
                          <th className="w-[190px] px-4 py-3 whitespace-nowrap bg-white">Mã đặt</th>
                          <th className="w-[190px] px-4 py-3 whitespace-nowrap bg-white">Khách hàng</th>
                          <th className="w-[150px] px-4 py-3 whitespace-nowrap bg-white">SĐT</th>
                          <th className="w-[140px] px-4 py-3 whitespace-nowrap bg-white">Ngày</th>
                          <th className="w-[100px] px-4 py-3 whitespace-nowrap bg-white">Giờ</th>
                          <th className="w-[110px] px-4 py-3 whitespace-nowrap bg-white">Số khách</th>
                          <th className="w-[200px] px-4 py-3 whitespace-nowrap bg-white">Ghi chú</th>
                          <th className="w-[150px] px-4 py-3 text-center sticky right-0 bg-white z-30 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.18)]">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unassignedBookings.map((booking) => (
                          <tr key={booking.id} className="border-t border-orange-100 bg-white">
                            <td className="w-[190px] px-4 py-3 font-black text-primary-700 whitespace-nowrap overflow-hidden text-ellipsis">DB{booking.id}</td>
                            <td className="w-[190px] px-4 py-3 font-bold text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">{booking.customerName || booking.fullName || booking.name || "Khách hàng"}</td>
                            <td className="w-[150px] px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{booking.phone || "Chưa có"}</td>
                            <td className="w-[140px] px-4 py-3 font-semibold whitespace-nowrap">{formatDate(booking.date)}</td>
                            <td className="w-[100px] px-4 py-3 font-semibold whitespace-nowrap">{booking.time || "Chưa có"}</td>
                            <td className="w-[110px] px-4 py-3 font-black whitespace-nowrap">{booking.guests || booking.people || 0} người</td>
                            <td className="w-[200px] px-4 py-3 text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">{booking.note || "Không có"}</td>
                            <td className="w-[150px] px-4 py-3 text-center sticky right-0 bg-white z-20 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.18)]">
                              <button onClick={() => openAssignBookingModal(booking)} className="h-9 min-w-[92px] px-4 rounded-lg bg-primary-700 text-white font-black hover:bg-primary-800 transition whitespace-nowrap">Xếp bàn</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {/* List Tab */}
          {activeTab === "list" && (
            <>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_150px_150px_56px] gap-3">
                  <div className="h-12 rounded-xl border border-gray-100 bg-white px-4 flex items-center gap-3 shadow-sm min-w-0">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm bàn, khu vực..." className="w-full outline-none text-sm" />
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <SelectBox label="Khu vực" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                  </SelectBox>
                  <SelectBox label="Trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    {Object.entries(TABLE_STATUS).filter(([key]) => key !== "holding" && key !== "booked").map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </SelectBox>
                  <SelectBox label="Sức chứa" value={capacityFilter} onChange={(e) => setCapacityFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="1-4">1 - 4 người</option>
                    <option value="5-6">5 - 6 người</option>
                    <option value="7+">Trên 7 người</option>
                  </SelectBox>
                  <button onClick={resetFilter} title="Đặt lại bộ lọc" className="h-12 rounded-xl border border-gray-100 bg-white shadow-sm text-sm font-bold text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition">
                    <RotateCcw size={17} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-4 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-500">Danh sách bàn ({filteredTables.length} bàn)</p>
                {canUseAction(currentUser, "tables:create") && (
                  <button onClick={openAddTable} className="h-10 px-5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-light shadow-sm shadow-primary/30 transition self-start sm:self-auto flex items-center gap-2 whitespace-nowrap">
                    <Plus size={16} />Thêm bàn
                  </button>
                )}
              </div>
              {/* Mobile Table Cards (md:hidden) */}
              <div className="block md:hidden divide-y divide-gray-100">
                {paginatedTables.length > 0 ? (
                  paginatedTables.map((table) => {
                    const isSelected = selectedTable?.id === table.id;
                    return (
                      <div
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        className={`p-3.5 space-y-2.5 transition-colors cursor-pointer text-left ${
                          isSelected ? "bg-emerald-50/70" : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Header: Table Code, Area, Status, Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-black text-sm shrink-0">
                              {table.code}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate">
                                Bàn {table.code}
                              </p>
                              <p className="text-[11px] text-slate-500 font-semibold truncate">
                                {table.areaName} • {table.capacity} người
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <ActionButton
                              icon={<Pencil size={15} />}
                              color="secondary"
                              title="Chỉnh sửa bàn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTable(table);
                              }}
                            />
                            <ActionButton
                              icon={table.status === "disabled" ? <Unlock size={15} /> : <Lock size={15} />}
                              color={table.status === "disabled" ? "primary" : "red"}
                              title={table.status === "disabled" ? "Mở khóa bàn" : "Khóa bàn"}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTableStatus(table.id, table.status === "disabled" ? "available" : "disabled");
                              }}
                            />
                          </div>
                        </div>

                        {/* Status & Description Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <StatusBadge status={table.status} />
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatDateTime(table.updatedAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-12 text-center text-gray-400 font-bold text-xs">
                    Chưa có bàn nào phù hợp
                  </div>
                )}
              </div>

              {/* Desktop Table (hidden on mobile, visible on md+) */}
              <div className="overflow-x-auto hidden md:block">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="bg-[#fbfcfb] text-gray-600 font-black text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Mã bàn</th>
                      <th className="px-4 py-3">Khu vực</th>
                      <th className="px-4 py-3">Sức chứa</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Mô tả</th>
                      <th className="px-4 py-3">Cập nhật cuối</th>
                      <th className="px-4 py-3 text-center sticky right-0 bg-[#fbfcfb]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTables.map((table) => (
                      <tr key={table.id} onClick={() => setSelectedTable(table)} className={`border-t border-gray-100 cursor-pointer hover:bg-primary-50/30 ${selectedTable?.id === table.id ? "bg-primary-50/50" : ""}`}>
                        <td className="px-4 py-3 font-black text-primary-700">{table.code}</td>
                        <td className="px-4 py-3 font-bold">{table.areaName}</td>
                        <td className="px-4 py-3">{table.capacity} người</td>
                        <td className="px-4 py-3"><StatusBadge status={table.status} /></td>
                        <td className="px-4 py-3 text-gray-600">{table.description}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDateTime(table.updatedAt)}</td>
                        <td className="px-4 py-3 sticky right-0 bg-white">
                          <div className="flex items-center justify-center gap-2">
                            <ActionButton icon={<Pencil size={16} />} color="secondary" title="Chỉnh sửa bàn" onClick={(e) => { e.stopPropagation(); openEditTable(table); }} />
                            <ActionButton icon={table.status === "disabled" ? <Unlock size={16} /> : <Lock size={16} />} color={table.status === "disabled" ? "primary" : "red"} title={table.status === "disabled" ? "Mở khóa sử dụng bàn" : "Khóa ngừng sử dụng bàn"} onClick={(e) => { e.stopPropagation(); updateTableStatus(table.id, table.status === "disabled" ? "available" : "disabled"); }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <GlobalPagination
                total={filteredTables.length}
                page={currentPage}
                limit={pageSize}
                onPageChange={setCurrentPage}
                onLimitChange={setPageSize}
                isLoading={tableLoading}
                limitOptions={[10, 20, 50, 100]}
              />
            </>
          )}
        </section>

        {selectedTable && (
          <TableDetailPanel
            table={selectedTable}
            booking={selectedTable.currentBooking}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            onClose={() => setSelectedTable(null)}
            onEdit={() => {
              setControlTable(selectedTable);
              setActiveModalTab(selectedTable.currentBooking ? "booking" : "config");
              setEditForm({
                areaId: selectedTable.areaId,
                code: selectedTable.code,
                capacity: selectedTable.capacity,
                status: selectedTable.status === "holding" || selectedTable.status === "booked" ? "available" : selectedTable.status,
                description: selectedTable.description || ""
              });
            }}
            onStatusChange={(status) => updateTableStatus(selectedTable.id, status)}
            onCancelBooking={() => cancelCurrentBooking(selectedTable.currentBooking)}
            onConfirmBooking={() => confirmCurrentBooking(selectedTable.currentBooking)}
            onCompleteBooking={() => completeCurrentBooking(selectedTable.currentBooking, selectedTable)}
            onStartServing={startServingBooking}
            onOpenAddItems={billing.setActiveAddItemsBooking}
            onOpenBilling={billing.setActiveBillingBooking}
            currentUser={currentUser}
          />
        )}
      </div>

      {/* Assign Booking Modal */}
      {assignBooking && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-primary-950">Xếp bàn cho khách</h3>
                <p className="text-sm text-gray-500 font-semibold mt-1">DB{assignBooking.id} - {assignBooking.customerName || assignBooking.name || "Khách hàng"}</p>
              </div>
              <button onClick={() => setAssignBooking(null)} className="text-gray-400 hover:text-red-500"><X size={22} /></button>
            </div>
            <div className="p-6 space-y-4">
              <SelectField label="Khu vực" value={assignForm.areaId} onChange={(value) => setAssignForm((prev) => ({ ...prev, areaId: value, tableCode: "" }))}>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </SelectField>
              <SelectField label="Bàn trống" value={assignForm.tableCode} onChange={(value) => setAssignForm((prev) => ({ ...prev, tableCode: value }))}>
                <option value="">Chọn bàn</option>
                {tables.filter((table) => String(table.areaId) === String(assignForm.areaId) && table.status === "available" && Number(table.capacity) >= Number(assignBooking.guests || assignBooking.people || 0) && !isTableBookedAtDate(table.code, assignBooking.date)).map((table) => (
                  <option key={table.id} value={table.code}>Bàn {table.code} - {table.capacity} người</option>
                ))}
              </SelectField>
              <div className="rounded-2xl bg-primary-50 border border-primary-100 p-4 text-sm">
                <p className="font-black text-primary-900 mb-2">Thông tin khách</p>
                <p>Khách: {assignBooking.customerName || assignBooking.name}</p>
                <p>SĐT: {assignBooking.phone || "Chưa có"}</p>
                <p>Thời gian: {formatDate(assignBooking.date)} - {assignBooking.time || "Chưa có"}</p>
                <p>Số khách: {assignBooking.guests || assignBooking.people || 0}</p>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setAssignBooking(null)} className="h-11 px-5 rounded-xl bg-gray-100 text-gray-600 font-black hover:bg-gray-200">Đóng</button>
              <button onClick={saveAssignBooking} className="h-11 px-5 rounded-xl bg-primary-800 text-white font-black hover:bg-primary-900">Lưu xếp bàn</button>
            </div>
          </div>
        </div>
      )}

      {/* Space Modals */}
      <AdminSpaceModals
        isAddingArea={isAddingArea} setIsAddingArea={setIsAddingArea}
        areaForm={areaForm} setAreaForm={setAreaForm} saveAddArea={saveAddArea}
        isAddingTable={isAddingTable} setIsAddingTable={setIsAddingTable}
        tableForm={tableForm} setTableForm={setTableForm} areas={areas} saveAddTable={saveAddTable}
        editingArea={editingArea} setEditingArea={setEditingArea}
        areaEditForm={areaEditForm} setAreaEditForm={setAreaEditForm} saveEditArea={saveEditArea}
        deleteConfirmArea={deleteConfirmArea} setDeleteConfirmArea={setDeleteConfirmArea} handleDeleteArea={handleDeleteArea}
        editingTable={editingTable} setEditingTable={setEditingTable}
        tableEditForm={editForm} setTableEditForm={setEditForm} saveEditTable={saveEditTable}
      />

      {/* Add Booking Modal */}
      <AdminAddBookingModal
        isAddingBooking={isAddingBooking} setIsAddingBooking={setIsAddingBooking}
        addForm={addForm} setAddForm={setAddForm}
        areas={areas} tables={tables}
        getTableStatusForAdd={getTableStatusForAdd}
        handleSelectTableForAddBooking={handleSelectTableForAddBooking}
        saveAddBooking={saveAddBooking}
        errors={addErrors}
      />

      {/* Add Items Modal */}
      <AdminAddItemsModal
        activeAddItemsBooking={billing.activeAddItemsBooking}
        setActiveAddItemsBooking={billing.setActiveAddItemsBooking}
        cartToAdd={billing.cartToAdd} setCartToAdd={billing.setCartToAdd}
        menuItems={menuItems} menuLoading={menuLoading} filteredMenuItems={filteredMenuItems}
        itemSearch={itemSearch} setItemSearch={setItemSearch}
        itemCategory={itemCategory} setItemCategory={setItemCategory}
        handleAddItemToTempCart={billing.handleAddItemToTempCart}
        handleUpdateTempCartQty={billing.handleUpdateTempCartQty}
        saveAddedItems={billing.saveAddedItems}
      />

      {/* Billing Modal */}
      <AdminBillingModal
        activeBillingBooking={billing.activeBillingBooking}
        setActiveBillingBooking={billing.setActiveBillingBooking}
        appliedCoupon={billing.appliedCoupon}
        applyCouponCode={billing.applyCouponCode}
        couponCodeInput={billing.couponCodeInput}
        setCouponCodeInput={billing.setCouponCodeInput}
        couponMsg={billing.couponMsg}
        paymentMethod={billing.paymentMethod}
        setPaymentMethod={billing.setPaymentMethod}
        simulatedPaid={billing.simulatedPaid}
        cashReceived={billing.cashReceived}
        handleCashReceivedChange={billing.handleCashReceivedChange}
        setCashReceived={billing.setCashReceived}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        handleSimulatePayment={billing.handleSimulatePayment}
        confirmPayment={billing.confirmPayment}
      />

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-[scaleIn_0.2s_ease-out]">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner ${confirmDialog.iconBg || "bg-blue-50 text-blue-600"}`}>
              {confirmDialog.icon || <HelpCircle size={28} />}
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-base">{confirmDialog.title}</h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed whitespace-pre-line">{confirmDialog.message}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => { setConfirmDialog(null); if (confirmDialog.onCancel) confirmDialog.onCancel(); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">Hủy bỏ</button>
              <button type="button" onClick={() => { setConfirmDialog(null); if (confirmDialog.onConfirm) confirmDialog.onConfirm(); }} className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-sm ${confirmDialog.confirmStyle || "bg-blue-600 hover:bg-blue-700"}`}>{confirmDialog.confirmText || "Xác nhận"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTablesPage;
