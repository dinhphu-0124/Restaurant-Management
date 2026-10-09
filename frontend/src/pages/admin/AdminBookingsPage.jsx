import { useMemo, useState, useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { tableService } from "../../services/tableService";
import { bookingService } from "../../services/bookingService";
import { socket } from "../../utils/socket";
import { showAdminToast } from "../../components/admin/AdminToast";
import { removeVietnameseTones, calculateSearchScore } from "../../utils/string";
import { getCurrentUser } from "../../utils/auth";
import { canUseAction } from "../../utils/permissions";
import { sortAreasByPriority } from "../../utils/tableHelpers";
import {
  normalizeTableStatus, getStatusText, getStatusStyle,
  getTypeText, getTypeStyle, formatPrice,
  formatDateBooking, formatDateTimeBooking, isActiveBooking,
} from "../../utils/bookingHelpers";
import {
  BookingDetailPanel, BookingStatCard, TabButton, SelectBox,
} from "../../components/admin/AdminBookingComponents";
import GlobalPagination from "../../components/admin/GlobalPagination";
import AdminBookingModals from "../../components/admin/AdminBookingModals";
import {
  CalendarCheck, Clock3, CheckCircle, XCircle, Search,
  Pencil, Trash2, RotateCcw, CalendarDays, Users, X,
} from "lucide-react";

function AdminBookingsPage() {
  const currentUser = getCurrentUser();
  const { globalSearch, dateRange } = useOutletContext();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  // ─── State ────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [guestFilter, setGuestFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState(null);
  const [pageSize, setPageSize] = useState(10);

  const [addForm, setAddForm] = useState({
    customerName: "", phone: "", email: "", date: "", time: "",
    guests: 1, selectedArea: "", selectedAreaTitle: "", selectedTable: "", note: "", status: "pending",
  });

  const [editForm, setEditForm] = useState({
    status: "pending", date: "", selectedArea: "", selectedAreaTitle: "", selectedTable: "", note: "",
  });

  const [errors, setErrors] = useState({});

  // ─── Data Loading ─────────────────────────────────────────────────
  const loadTableLayout = async () => {
    try {
      const [apiAreas, apiTables] = await Promise.all([tableService.getAreas(), tableService.getTables()]);
      const nextAreas = sortAreasByPriority(
        apiAreas.map((area) => ({ ...area, id: String(area.id), name: area.name || area.title || "Khu vực" }))
      );
      const nextTables = apiTables.map((table) => ({
        ...table,
        id: String(table.id || table.code),
        code: String(table.code || table.tableCode || table.name || table.id),
        areaId: String(table.areaId),
        areaName: table.areaName || "",
        status: normalizeTableStatus(table.status),
        capacity: Number(table.capacity || table.seats || 4),
      }));
      setAreas(nextAreas);
      setTables(nextTables);
      return { areas: nextAreas, tables: nextTables };
    } catch (error) {
      console.error(error);
      setAreas([]); setTables([]);
      return { areas: [], tables: [] };
    }
  };

  const loadBookings = async () => {
    try {
      const [apiBookings] = await Promise.all([bookingService.getBookings(), loadTableLayout()]);
      setBookings(apiBookings);
      const viewId = searchParams.get("view");
      if (viewId) {
        const bookingToView = apiBookings.find((b) => String(b.id) === String(viewId));
        if (bookingToView) setSelectedBooking(bookingToView);
      }
    } catch (error) {
      console.error(error);
      showAdminToast({ title: "Lỗi tải dữ liệu", message: error.message || "Không thể tải danh sách đặt bàn.", type: "error" });
    }
  };

  useEffect(() => {
    loadBookings();
    window.addEventListener("bookingsUpdated", loadBookings);
    window.addEventListener("tablesUpdated", loadBookings);
    socket.on("table_updated", loadBookings);
    return () => {
      window.removeEventListener("bookingsUpdated", loadBookings);
      window.removeEventListener("tablesUpdated", loadBookings);
      socket.off("table_updated", loadBookings);
    };
  }, []);

  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam !== null) setSearch(searchParam);
  }, [searchParams]);

  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId && bookings.length > 0) {
      const bookingToView = bookings.find((b) => String(b.id) === String(viewId));
      if (bookingToView) setSelectedBooking(bookingToView);
    }
  }, [searchParams, bookings]);

  useEffect(() => {
    const openAddBookingModal = async () => {
      if (!canUseAction(currentUser, "bookings:create")) {
        showAdminToast({ title: "Từ chối", message: "Bạn không có quyền thêm đặt bàn.", type: "error" });
        return;
      }
      const layout = await loadTableLayout();
      const firstArea = layout.areas[0];
      setAddForm((prev) => ({
        ...prev, date: prev.date || new Date().toISOString().split("T")[0],
        selectedArea: firstArea?.id || "", selectedAreaTitle: firstArea?.name || "", selectedTable: "",
      }));
      setIsAddingBooking(true);
    };
    window.addEventListener("openAddBookingModal", openAddBookingModal);
    return () => window.removeEventListener("openAddBookingModal", openAddBookingModal);
  }, []);

  // ─── Date Constants ───────────────────────────────────────────────
  const todayString = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = tomorrowDate.toISOString().split("T")[0];

  // ─── Stats ────────────────────────────────────────────────────────
  const totalBookings = bookings.length;
  const pendingCount = bookings.filter((item) => getStatusText(item.status) === "Chờ xác nhận").length;
  const confirmedCount = bookings.filter((item) => getStatusText(item.status) === "Đã xác nhận").length;
  const completedCount = bookings.filter((item) => getStatusText(item.status) === "Hoàn thành").length;
  const cancelledCount = bookings.filter((item) => getStatusText(item.status) === "Đã hủy").length;
  const todayCount = bookings.filter((item) => item.date === todayString).length;
  const tomorrowCount = bookings.filter((item) => item.date === tomorrowString).length;

  // ─── Filters ──────────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    const rawKeyword = String(globalSearch || search || "").trim();

    const scored = bookings
      .map((booking) => {
        let matchDate = true;
        if (dateRange?.startDate || dateRange?.endDate) {
          const bookingDate = new Date(booking.date);
          const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
          const end = dateRange.endDate ? new Date(dateRange.endDate) : null;
          if (start) start.setHours(0, 0, 0, 0);
          if (end) end.setHours(23, 59, 59, 999);
          matchDate = (!start || bookingDate >= start) && (!end || bookingDate <= end);
        }

        const areaName = booking.selectedAreaTitle || booking.area || "";
        const matchArea = areaFilter === "all" || removeVietnameseTones(areaName).includes(removeVietnameseTones(areaFilter));
        const matchStatus = statusFilter === "all" || getStatusText(booking.status) === statusFilter;
        const matchType = typeFilter === "all" ||
          (typeFilter === "table_only" && getTypeText(booking) === "Chỉ đặt bàn") ||
          (typeFilter === "table_with_food" && getTypeText(booking) === "Kèm món") ||
          (typeFilter === "table_with_order" && getTypeText(booking) === "Từ Checkout");

        const guests = Number(booking.guests || booking.people || 0);
        const matchGuest = guestFilter === "all" ||
          (guestFilter === "1-2" && guests >= 1 && guests <= 2) ||
          (guestFilter === "3-5" && guests >= 3 && guests <= 5) ||
          (guestFilter === "6-10" && guests >= 6 && guests <= 10) ||
          (guestFilter === "10+" && guests > 10);

        const matchTab = activeTab === "all" ||
          (activeTab === "pending" && getStatusText(booking.status) === "Chờ xác nhận") ||
          (activeTab === "today" && booking.date === todayString) ||
          (activeTab === "tomorrow" && booking.date === tomorrowString) ||
          (activeTab === "completed" && getStatusText(booking.status) === "Hoàn thành");

        if (!matchDate || !matchArea || !matchStatus || !matchType || !matchGuest || !matchTab) return null;

        const score = rawKeyword ? calculateSearchScore({
          customerName: booking.customerName || booking.fullName || booking.name,
          phone: booking.phone,
          id: booking.id,
          code: booking.id,
          tableName: booking.selectedTable,
          area: areaName,
          notes: booking.notes
        }, rawKeyword) : 1;

        if (score === 0) return null;
        return { booking, score };
      })
      .filter(Boolean);

    if (rawKeyword) {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored.map((s) => s.booking);
  }, [bookings, search, globalSearch, dateRange, areaFilter, statusFilter, typeFilter, guestFilter, activeTab]);

  const totalPages = Math.ceil(filteredBookings.length / pageSize);
  const paginatedBookings = useMemo(() => {
    return filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  useEffect(() => setCurrentPage(1), [search, globalSearch, dateRange, areaFilter, statusFilter, typeFilter, guestFilter, activeTab]);

  const resetFilter = () => { setSearch(""); setAreaFilter("all"); setStatusFilter("all"); setTypeFilter("all"); setGuestFilter("all"); setActiveTab("all"); };

  // ─── Booking Actions ──────────────────────────────────────────────
  const updateBookingStatus = async (id, status) => {
    try {
      const updatedBooking = await bookingService.updateBookingStatus(id, status);
      setBookings((prev) => prev.map((item) => String(item.id) === String(id) ? updatedBooking : item));
      setSelectedBooking((prev) => prev && String(prev.id) === String(id) ? updatedBooking : prev);
      showAdminToast({ title: "Cập nhật trạng thái thành công", message: `Đã chuyển đặt bàn ${updatedBooking.bookingCode || `DB${updatedBooking.id}`} sang "${getStatusText(status)}".` });
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("tablesUpdated"));
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi", message: error.message || "Không thể cập nhật trạng thái đặt bàn.", type: "error" }); }
  };

  const openEditBookingModal = (booking) => {
    setEditingBooking(booking);
    const areaTitle = booking.selectedAreaTitle || booking.area || "";
    const matchedArea = areas.find((area) => String(area.id) === String(booking.selectedArea) || area.name === areaTitle);
    setEditForm({ status: booking.status || "pending", date: booking.date || "", selectedArea: booking.selectedArea || matchedArea?.id || "", selectedAreaTitle: areaTitle || matchedArea?.name || "", selectedTable: booking.selectedTable || "", note: booking.note || "" });
  };

  // ─── Edit Table Logic ─────────────────────────────────────────────
  const getTableBookingAtDate = (tableCode, date) => {
    if (!date) return null;
    return bookings.find((booking) => String(booking.id) !== String(editingBooking?.id) && isActiveBooking(booking) && String(booking.selectedTable) === String(tableCode) && booking.date === date);
  };

  const getTableStatusForEdit = (table) => {
    const bookingAtDate = getTableBookingAtDate(table.code, editForm.date);
    if (bookingAtDate?.status === "pending" || bookingAtDate?.status === "Chờ xác nhận") return "holding";
    if (["confirmed", "Đã xác nhận", "serving", "Đang phục vụ"].includes(bookingAtDate?.status)) return "booked";
    return table.status;
  };

  const getEditGuestCount = () => Number(editingBooking?.guests || editingBooking?.people || 0);

  const findBestTableForEditBooking = () => {
    const guestCount = getEditGuestCount();
    return tables.filter((table) => {
      const sameArea = String(table.areaId) === String(editForm.selectedArea);
      const available = getTableStatusForEdit(table) === "available";
      const enoughCapacity = guestCount <= 0 || Number(table.capacity || 0) >= guestCount;
      return sameArea && available && enoughCapacity;
    }).sort((a, b) => {
      const diff = Number(a.capacity || 0) - Number(b.capacity || 0);
      return diff !== 0 ? diff : String(a.code || "").localeCompare(String(b.code || ""), "vi", { numeric: true });
    })[0] || null;
  };

  const handleSelectTableForEditBooking = (table, rawStatus, currentTable) => {
    if (currentTable || rawStatus !== "available") return;
    const guestCount = getEditGuestCount();
    const tableCapacity = Number(table.capacity || 0);
    if (guestCount > 0 && tableCapacity < guestCount) {
      const suggestedTable = findBestTableForEditBooking();
      if (suggestedTable) {
        setEditForm((prev) => ({ ...prev, selectedTable: suggestedTable.code }));
        showAdminToast({ title: "Gợi ý chọn bàn", message: `Đã tự động chọn bàn ${suggestedTable.code} phù hợp cho ${guestCount} khách.`, type: "info" });
        return;
      }
      showAdminToast({ title: "Sức chứa không phù hợp", message: `Bàn ${table.code} chỉ chứa tối đa ${tableCapacity} người. Hiện khu vực này không có bàn phù hợp cho ${guestCount} khách.`, type: "warning" });
      return;
    }
    setEditForm((prev) => ({ ...prev, selectedTable: table.code }));
  };

  const saveEditBooking = async () => {
    if (!editingBooking) return;
    const guestCount = getEditGuestCount();
    if (!editForm.date) { showAdminToast({ title: "Thiếu thông tin", message: "Vui lòng chọn ngày đặt bàn.", type: "warning" }); return; }
    if (editForm.status === "confirmed" && !editForm.selectedTable) { showAdminToast({ title: "Thiếu thông tin", message: "Vui lòng chọn bàn trước khi xác nhận đặt bàn.", type: "warning" }); return; }
    if (editForm.selectedTable) {
      const selectedTableData = tables.find((table) => String(table.code) === String(editForm.selectedTable) && String(table.areaId) === String(editForm.selectedArea));
      if (!selectedTableData) { showAdminToast({ title: "Lỗi", message: "Bàn đã chọn không hợp lệ. Vui lòng chọn lại.", type: "error" }); return; }
      if (guestCount > Number(selectedTableData.capacity || 0)) {
        const suggestedTable = findBestTableForEditBooking();
        if (suggestedTable) {
          setEditForm((prev) => ({ ...prev, selectedTable: suggestedTable.code }));
          showAdminToast({ title: "Gợi ý chọn bàn", message: `Đã tự động chọn bàn ${suggestedTable.code} phù hợp cho ${guestCount} khách.`, type: "info" });
          return;
        }
        showAdminToast({ title: "Sức chứa không phù hợp", message: `Khu vực này không có bàn phù hợp cho ${guestCount} khách. Vui lòng chọn khu vực khác.`, type: "warning" });
        return;
      }
    }
    try {
      const updatedBooking = await bookingService.updateBooking(editingBooking.id, { status: editForm.status, date: editForm.date, time: editForm.time || editingBooking.time, selectedArea: editForm.selectedArea, selectedAreaTitle: editForm.selectedAreaTitle, selectedTable: editForm.selectedTable, note: editForm.note });
      setBookings((prev) => prev.map((booking) => String(booking.id) === String(editingBooking.id) ? updatedBooking : booking));
      setSelectedBooking((prev) => prev && String(prev.id) === String(editingBooking.id) ? updatedBooking : prev);
      showAdminToast({ title: "Lưu thay đổi thành công", message: `Đã cập nhật đặt bàn ${updatedBooking.bookingCode || `DB${updatedBooking.id}`}.` });
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("tablesUpdated"));
      setEditingBooking(null);
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi cập nhật", message: error.message || "Không thể cập nhật đặt bàn.", type: "error" }); }
  };

  // ─── Delete / Bulk ────────────────────────────────────────────────
  const executeDeleteBooking = async (id) => {
    try {
      await bookingService.deleteBooking(id);
      setBookings((prev) => prev.filter((booking) => String(booking.id) !== String(id)));
      setSelectedBooking((prev) => prev && String(prev.id) === String(id) ? null : prev);
      setSelectedBookingIds((prev) => prev.filter((bookingId) => String(bookingId) !== String(id)));
      showAdminToast({ title: "Xóa đặt bàn thành công", message: `Đã xóa đặt bàn DB${id}.` });
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("tablesUpdated"));
    } catch (error) { console.error(error); showAdminToast({ title: "Thất bại", message: error.message || "Không thể xóa đặt bàn.", type: "error" }); }
  };

  const deleteBooking = (id) => setDeleteConfirmBooking({ bookingId: id });

  const toggleSelectBooking = (bookingId) => setSelectedBookingIds((prev) => prev.includes(String(bookingId)) ? prev.filter((id) => id !== String(bookingId)) : [...prev, String(bookingId)]);

  const toggleSelectAllCurrentPage = () => {
    const currentIds = paginatedBookings.map((booking) => String(booking.id));
    const isSelectedAll = currentIds.every((id) => selectedBookingIds.includes(id));
    if (isSelectedAll) {
      setSelectedBookingIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedBookingIds((prev) => [...new Set([...prev, ...currentIds])]);
    }
  };

  const executeUpdateSelectedBookingsStatus = async (status) => {
    if (status === "confirmed") {
      const selectedBookings = bookings.filter((booking) => selectedBookingIds.includes(String(booking.id)));
      const bookingsWithoutTable = selectedBookings.filter((booking) => !booking.selectedTable);
      if (bookingsWithoutTable.length > 0) {
        showAdminToast({ title: "Thất bại", message: `Có ${bookingsWithoutTable.length} đặt bàn chưa được chọn bàn. Vui lòng chọn bàn trước khi xác nhận.`, type: "error" });
        return;
      }
    }
    try {
      const updatedBookings = await Promise.all(selectedBookingIds.map((id) => bookingService.updateBookingStatus(id, status)));
      const updatedMap = new Map(updatedBookings.map((booking) => [String(booking.id), booking]));
      setBookings((prev) => prev.map((booking) => updatedMap.has(String(booking.id)) ? updatedMap.get(String(booking.id)) : booking));
      setSelectedBooking((prev) => prev && updatedMap.has(String(prev.id)) ? updatedMap.get(String(prev.id)) : prev);
      showAdminToast({ title: "Cập nhật hàng loạt thành công", message: `Đã chuyển ${selectedBookingIds.length} đặt bàn sang trạng thái "${getStatusText(status)}".` });
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("tablesUpdated"));
      setSelectedBookingIds([]);
    } catch (error) { console.error(error); showAdminToast({ title: "Thất bại", message: error.message || "Không thể cập nhật trạng thái hàng loạt.", type: "error" }); }
  };

  const updateSelectedBookingsStatus = (status) => {
    if (selectedBookingIds.length === 0) return;
    setDeleteConfirmBooking({ bulkStatus: status });
  };

  const executeDeleteSelectedBookings = async () => {
    try {
      await Promise.all(selectedBookingIds.map((id) => bookingService.deleteBooking(id)));
      setBookings((prev) => prev.filter((booking) => !selectedBookingIds.includes(String(booking.id))));
      setSelectedBooking((prev) => prev && selectedBookingIds.includes(String(prev.id)) ? null : prev);
      showAdminToast({ title: "Xóa hàng loạt thành công", message: `Đã xóa ${selectedBookingIds.length} đặt bàn đã chọn.` });
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("tablesUpdated"));
      setSelectedBookingIds([]);
    } catch (error) { console.error(error); showAdminToast({ title: "Thất bại", message: error.message || "Không thể xóa các đặt bàn đã chọn.", type: "error" }); }
  };

  const deleteSelectedBookings = () => { if (selectedBookingIds.length === 0) return; setDeleteConfirmBooking({ bulk: true }); };

  // ─── Add Booking ──────────────────────────────────────────────────
  const getTableStatusForAdd = (table) => {
    if (!addForm.date) return table.status;
    const existedBooking = bookings.find((booking) => isActiveBooking(booking) && String(booking.selectedTable) === String(table.code) && booking.date === addForm.date);
    if (existedBooking?.status === "pending" || existedBooking?.status === "Chờ xác nhận") return "holding";
    if (["confirmed", "Đã xác nhận", "serving", "Đang phục vụ"].includes(existedBooking?.status)) return "booked";
    return table.status;
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
    if (!addForm.selectedTable) errs.selectedTable = "Vui lòng chọn bàn";
    const guestCount = Number(addForm.guests);
    if (!Number.isFinite(guestCount) || guestCount <= 0) {
      errs.guests = "Số khách phải lớn hơn 0";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showAdminToast({
        title: "Lỗi nhập liệu",
        message: "Vui lòng kiểm tra các trường thông tin lỗi (được viền đỏ) và chọn bàn.",
        type: "error",
      });
      return;
    }
    setErrors({});

    const selectedTableData = tables.find((table) => String(table.code) === String(addForm.selectedTable) && String(table.areaId) === String(addForm.selectedArea));
    if (!selectedTableData) {
      showAdminToast({ title: "Lỗi dữ liệu", message: "Bàn đã chọn không hợp lệ. Vui lòng chọn lại.", type: "error" });
      setErrors({ selectedTable: true });
      return;
    }
    if (guestCount > Number(selectedTableData.capacity || 0)) {
      showAdminToast({ title: "Lỗi vượt chứa", message: `Bàn ${selectedTableData.code} chỉ chứa tối đa ${selectedTableData.capacity} người. Vui lòng chọn bàn khác phù hợp hơn.`, type: "error" });
      setErrors({ guests: "Bàn không đủ sức chứa" });
      return;
    }
    try {
      const savedBooking = await bookingService.createAdminBooking({ customerName: addForm.customerName.trim(), phone: addForm.phone.trim(), email: addForm.email.trim(), date: addForm.date, time: addForm.time, guests: Number(addForm.guests || 1), selectedArea: addForm.selectedArea, selectedAreaTitle: addForm.selectedAreaTitle, selectedTable: addForm.selectedTable, note: addForm.note.trim(), status: addForm.status, type: "table_only", total: 0 });
      setBookings((prev) => [savedBooking, ...prev]);
      setSelectedBooking(savedBooking);
      setIsAddingBooking(false);
      showAdminToast({ title: "Tạo đặt bàn thành công", message: `Đã tạo đặt bàn ${savedBooking.bookingCode || `DB${savedBooking.id}`}.` });
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("tablesUpdated"));
      setAddForm({ customerName: "", phone: "", email: "", date: "", time: "", guests: 1, selectedArea: "", selectedAreaTitle: "", selectedTable: "", note: "", status: "pending" });
    } catch (error) { console.error(error); showAdminToast({ title: "Lỗi lưu dữ liệu", message: error.message || "Không thể tạo đặt bàn.", type: "error" }); }
  };

  // ─── RENDER ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Desktop & Tablet Stats Grid (>= sm) */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
        <BookingStatCard icon={<CalendarCheck />} title="Tổng đặt bàn" value={totalBookings} bg="bg-green-50" color="text-green-700" className="sm:col-span-2 md:col-span-1 xl:col-span-1" />
        <BookingStatCard icon={<Clock3 />} title="Chờ xác nhận" value={pendingCount} bg="bg-orange-50" color="text-orange-600" />
        <BookingStatCard icon={<CalendarDays />} title="Lịch hôm nay" value={todayCount} bg="bg-blue-50" color="text-blue-600" />
        <BookingStatCard icon={<CheckCircle />} title="Hoàn thành" value={completedCount} bg="bg-green-50" color="text-green-600" />
        <BookingStatCard icon={<XCircle />} title="Đã hủy" value={cancelledCount} bg="bg-red-50" color="text-red-600" className="sm:col-span-2 md:col-span-2 xl:col-span-1" />
      </div>

      {/* Mobile Compact Stats Section (< sm) */}
      <div className="sm:hidden space-y-2.5">
        {/* Mobile Total Bookings Hero Card */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-3.5 text-white shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Tổng đặt bàn</p>
            <h3 className="text-xl font-black mt-0.5 tracking-tight">{totalBookings} <span className="text-xs font-semibold text-emerald-200">lượt đặt</span></h3>
            <p className="text-[11px] text-emerald-200 font-medium mt-1">Hôm nay: <span className="font-bold text-white">{todayCount}</span> • Chờ duyệt: <span className="font-bold text-amber-300">{pendingCount}</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-emerald-100 shrink-0">
            <CalendarCheck size={20} />
          </div>
        </div>

        {/* Mobile Quick Status Filter Grid (2x2) */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Chờ xác nhận" ? "all" : "Chờ xác nhận")}
            className={`rounded-xl p-2.5 border text-left transition-all min-w-0 flex items-center justify-between ${
              statusFilter === "Chờ xác nhận"
                ? "bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-300/30 shadow-2xs"
                : "bg-white border-amber-100/80 text-slate-700 hover:bg-amber-50/40"
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase block">Chờ duyệt</span>
              <span className="text-base font-black text-slate-900">{pendingCount}</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock3 size={13} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "today" ? "all" : "today")}
            className={`rounded-xl p-2.5 border text-left transition-all min-w-0 flex items-center justify-between ${
              activeTab === "today"
                ? "bg-blue-50 text-blue-900 border-blue-300 ring-1 ring-blue-300/30 shadow-2xs"
                : "bg-white border-blue-100/80 text-slate-700 hover:bg-blue-50/40"
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Hôm nay</span>
              <span className="text-base font-black text-slate-900">{todayCount}</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CalendarDays size={13} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Hoàn thành" ? "all" : "Hoàn thành")}
            className={`rounded-xl p-2.5 border text-left transition-all min-w-0 flex items-center justify-between ${
              statusFilter === "Hoàn thành"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-300/30 shadow-2xs"
                : "bg-white border-emerald-100/80 text-slate-700 hover:bg-emerald-50/40"
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Hoàn thành</span>
              <span className="text-base font-black text-slate-900">{completedCount}</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle size={13} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Đã hủy" ? "all" : "Đã hủy")}
            className={`rounded-xl p-2.5 border text-left transition-all min-w-0 flex items-center justify-between ${
              statusFilter === "Đã hủy"
                ? "bg-rose-50 text-rose-900 border-rose-300 ring-1 ring-rose-300/30 shadow-2xs"
                : "bg-white border-rose-100/80 text-slate-700 hover:bg-rose-50/40"
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase block">Đã hủy</span>
              <span className="text-base font-black text-slate-900">{cancelledCount}</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle size={13} />
            </div>
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 items-start ${selectedBooking ? "xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="px-3 sm:px-5 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center overflow-x-auto no-scrollbar min-w-0 flex-1">
                <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>Tất cả ({totalBookings})</TabButton>
                <TabButton active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>Chờ xác nhận ({pendingCount})</TabButton>
                <TabButton active={activeTab === "today"} onClick={() => setActiveTab("today")}>Hôm nay ({todayCount})</TabButton>
                <TabButton active={activeTab === "tomorrow"} onClick={() => setActiveTab("tomorrow")}>Ngày mai ({tomorrowCount})</TabButton>
                <TabButton active={activeTab === "completed"} onClick={() => setActiveTab("completed")}>Hoàn thành ({completedCount})</TabButton>
              </div>
              <div className="hidden xl:flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap shrink-0">
                <span>Hiển thị</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="h-9 w-[120px] rounded-xl border border-gray-200 px-2.5 text-xs font-bold outline-none bg-white shadow-2xs">
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filters - Compact 2-Row Layout */}
          <div className="p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5 bg-slate-50/40 border-b border-slate-100">
            {/* Row 1: Search bar + Reset button */}
            <div className="flex items-center gap-2">
              <div className="h-9 sm:h-10 rounded-xl border border-slate-200/90 bg-white px-3 flex items-center gap-2 shadow-2xs flex-1 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600/20 transition-all">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo mã, tên khách, SĐT..."
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

            {/* Row 2: 4 SelectBoxes in 2x2 grid on mobile or 4-cols on tablet/desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5">
              <SelectBox label="Khu vực" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} compact={selectedBooking}>
                <option value="all">Tất cả</option>
                {areas.map((area) => <option key={area.id} value={area.name}>{area.name}</option>)}
              </SelectBox>
              <SelectBox label="Trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} compact={selectedBooking}>
                <option value="all">Tất cả</option>
                <option value="Chờ xác nhận">Chờ xác nhận</option>
                <option value="Đã xác nhận">Đã xác nhận</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Đã hủy">Đã hủy</option>
              </SelectBox>
              <SelectBox label="Loại đặt" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} compact={selectedBooking}>
                <option value="all">Tất cả</option>
                <option value="table_only">Chỉ đặt bàn</option>
                <option value="table_with_food">Kèm món</option>
                <option value="table_with_order">Từ Checkout</option>
              </SelectBox>
              <SelectBox label="Số khách" value={guestFilter} onChange={(e) => setGuestFilter(e.target.value)} compact={selectedBooking}>
                <option value="all">Tất cả</option>
                <option value="1-2">1 - 2 khách</option>
                <option value="3-5">3 - 5 khách</option>
                <option value="6-10">6 - 10 khách</option>
                <option value="10+">Trên 10 khách</option>
              </SelectBox>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedBookingIds.length > 0 && (
            <div className="mx-3 sm:mx-4 my-3 rounded-2xl border border-green-100 bg-green-50 px-3.5 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <p className="text-xs sm:text-sm font-black text-primary">Đã chọn {selectedBookingIds.length} đặt bàn</p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button onClick={() => updateSelectedBookingsStatus("confirmed")} className="h-8 sm:h-10 px-2.5 sm:px-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-xs sm:text-sm font-black hover:bg-blue-100 transition">Xác nhận</button>
                <button onClick={deleteSelectedBookings} className="h-8 sm:h-10 px-2.5 sm:px-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs sm:text-sm font-black hover:bg-red-100 transition">Xóa</button>
                <button onClick={() => setSelectedBookingIds([])} className="h-8 sm:h-10 px-2.5 sm:px-4 rounded-xl bg-white text-gray-500 border border-gray-200 text-xs sm:text-sm font-black hover:bg-gray-50 transition">Bỏ chọn</button>
              </div>
            </div>
          )}

          {/* Mobile Card List (lg:hidden) */}
          <div className="block lg:hidden p-3 space-y-3 bg-slate-50/70">
            {filteredBookings.length > 0 ? (
              paginatedBookings.map((booking, index) => {
                const isSelected = String(selectedBooking?.id) === String(booking.id);
                const isChecked = selectedBookingIds.includes(String(booking.id));
                const statusText = getStatusText(booking.status);
                const isPending = booking.status === "pending" || statusText === "Chờ xác nhận";
                const isConfirmed = booking.status === "confirmed" || statusText === "Đã xác nhận";
                const isCompleted = booking.status === "completed" || statusText === "Hoàn thành";
                const isCancelled = booking.status === "cancelled" || statusText === "Đã hủy";

                return (
                  <div
                    key={booking.id || index}
                    onClick={() => setSelectedBooking(booking)}
                    className={`bg-white rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer text-left shadow-2xs hover:shadow-md relative overflow-hidden space-y-2.5 ${
                      isSelected
                        ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
                        : isChecked
                        ? "border-emerald-400 bg-emerald-50/10"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    {/* Left status accent line */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isPending
                          ? "bg-amber-400"
                          : isConfirmed
                          ? "bg-blue-500"
                          : isCompleted
                          ? "bg-emerald-500"
                          : isCancelled
                          ? "bg-rose-400"
                          : "bg-slate-300"
                      }`}
                    />

                    {/* Top Row: Checkbox, Booking Code, Status Badge, Edit */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleSelectBooking(booking.id)}
                          className="w-4 h-4 accent-emerald-700 rounded shrink-0 cursor-pointer"
                        />
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-black text-xs shrink-0 tracking-tight">
                          {booking.bookingCode || `DB${booking.id}`}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold truncate ${getStatusStyle(
                            booking.status
                          )}`}
                        >
                          {statusText}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditBookingModal(booking);
                        }}
                        title="Chỉnh sửa đặt bàn"
                        className="w-7 h-7 rounded-lg bg-slate-100/80 text-slate-600 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-700 transition shrink-0"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>

                    {/* Middle Row: Customer Info (Left) & Time / Type (Right) */}
                    <div className="flex items-center justify-between gap-3 pt-0.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100/60 flex items-center justify-center font-bold text-sm shrink-0">
                          {(booking.customerName || booking.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate leading-snug">
                            {booking.customerName || booking.name || "Khách hàng"}
                          </p>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            {booking.phone || "Chưa có SĐT"} • <span className="text-slate-700 font-semibold">{booking.guests || 1} khách</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-sm text-emerald-700 leading-none">
                          {booking.time || "--:--"}
                        </p>
                        <p className="text-[10.5px] text-slate-400 font-medium mt-1">
                          {formatDateBooking(booking.date)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Area / Table & Booking Type Chips */}
                    <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium truncate bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <span>{booking.selectedAreaTitle || booking.area || "Khu vực"}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-bold text-slate-800">
                          {booking.selectedTable ? `Bàn ${booking.selectedTable}` : "Đang xếp"}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${getTypeStyle(booking)}`}>
                        {getTypeText(booking)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-12 text-center text-slate-400 font-bold text-xs bg-white rounded-2xl border border-dashed border-slate-200">
                Chưa có lịch đặt bàn phù hợp
              </div>
            )}
          </div>

          {/* Table (hidden on mobile, visible on lg+) */}
          <div className="overflow-x-auto hidden lg:block">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-[#fbfcfb] text-gray-500 font-bold text-sm whitespace-nowrap">
                <tr>
                  <th className="w-[50px] px-4 py-3">
                    <input type="checkbox" checked={paginatedBookings.length > 0 && paginatedBookings.every((booking) => selectedBookingIds.includes(String(booking.id)))} onChange={toggleSelectAllCurrentPage} className="w-4 h-4 accent-green-700" />
                  </th>
                  <th className="px-4 py-3">Mã đặt bàn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">SĐT</th>
                  <th className="px-4 py-3 text-center">Ngày</th>
                  <th className="px-4 py-3 text-center">Giờ</th>
                  <th className="px-4 py-3 text-center">Số khách</th>
                  <th className="px-4 py-3">Khu vực</th>
                  <th className="px-4 py-3">Bàn</th>
                  <th className="px-4 py-3 text-center">Loại</th>
                  <th className="px-4 py-3 text-center">Tổng tiền</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-center sticky right-0 bg-[#fbfcfb] z-10 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.25)]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.length > 0 ? (
                  paginatedBookings.map((booking, index) => (
                    <tr key={booking.id || index} onClick={() => setSelectedBooking(booking)} className={`border-t border-gray-100 hover:bg-black/5 transition cursor-pointer ${String(selectedBooking?.id) === String(booking.id) ? "bg-green-100/70" : booking.status === 'pending' ? 'bg-red-50/80' : booking.status === 'completed' ? 'bg-green-50/60' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedBookingIds.includes(String(booking.id))} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelectBooking(booking.id)} className="w-4 h-4 accent-green-700" />
                      </td>
                      <td className="px-4 py-3 font-black text-green-700 whitespace-nowrap">{booking.bookingCode || `DB${booking.id}`}</td>
                      <td className="px-4 py-3 font-bold text-gray-700 whitespace-nowrap">{booking.customerName || booking.name || "Khách hàng"}</td>
                      <td className="px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">{booking.phone || "Chưa có"}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">{formatDateBooking(booking.date)}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">{booking.time || "Chưa có"}</td>
                      <td className="px-4 py-3 font-black text-center">{booking.guests || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{booking.selectedAreaTitle || booking.area || "Nhà hàng sắp xếp"}</td>
                      <td className="px-4 py-3 font-bold">{booking.selectedTable || "Đang xếp"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap ${getTypeStyle(booking)}`}>{getTypeText(booking)}</span>
                      </td>
                      <td className="px-4 py-3 font-black text-primary whitespace-nowrap text-center">{formatPrice(booking.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex justify-center min-w-[105px] px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap ${getStatusStyle(booking.status)}`}>{getStatusText(booking.status)}</span>
                      </td>
                      <td className="px-4 py-3 sticky right-0 bg-white z-10 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.25)]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); openEditBookingModal(booking); }} title="Chỉnh sửa đặt bàn" className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-100"><Pencil size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="13" className="px-5 py-14 text-center text-gray-400 font-bold">Chưa có lịch đặt bàn phù hợp</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & Status Legend Footer */}
          <div className="border-t border-slate-100 bg-white">
            <GlobalPagination
              total={filteredBookings.length}
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


        {selectedBooking && (
          <BookingDetailPanel
            booking={selectedBooking}
            formatDate={formatDateBooking}
            formatDateTime={formatDateTimeBooking}
            formatPrice={formatPrice}
            getStatusText={getStatusText}
            getStatusStyle={getStatusStyle}
            getTypeText={getTypeText}
            onClose={() => setSelectedBooking(null)}
            onConfirm={() => {
              if (!selectedBooking.selectedTable) {
                openEditBookingModal(selectedBooking);
                showAdminToast({ title: "Cần chọn bàn trước", message: "Vui lòng chọn bàn trước khi xác nhận đặt bàn.", type: "warning" });
                return;
              }
              updateBookingStatus(selectedBooking.id, "confirmed");
            }}
            onComplete={() => updateBookingStatus(selectedBooking.id, "completed")}
            onCancel={() => updateBookingStatus(selectedBooking.id, "cancelled")}
          />
        )}
      </div>

      {/* Modals */}
      <AdminBookingModals
        editingBooking={editingBooking} setEditingBooking={setEditingBooking}
        editForm={editForm} setEditForm={setEditForm}
        isAddingBooking={isAddingBooking} setIsAddingBooking={setIsAddingBooking}
        addForm={addForm} setAddForm={setAddForm}
        areas={areas} tables={tables}
        getTableStatusForAdd={getTableStatusForAdd}
        getTableStatusForEdit={getTableStatusForEdit}
        getEditGuestCount={getEditGuestCount}
        handleSelectTableForEditBooking={handleSelectTableForEditBooking}
        saveAddBooking={saveAddBooking}
        saveEditBooking={saveEditBooking}
        formatDate={formatDateBooking}
        errors={errors}
      />

      {/* Delete / Bulk Confirm Modal */}
      {deleteConfirmBooking && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-[scaleIn_0.2s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner"><Trash2 size={28} /></div>
            <div>
              <h4 className="font-black text-gray-900 text-base">{deleteConfirmBooking.bulkStatus ? "Xác nhận cập nhật trạng thái" : deleteConfirmBooking.bulk ? "Xác nhận xóa hàng loạt" : "Xác nhận xóa đặt bàn"}</h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{deleteConfirmBooking.bulkStatus ? `Bạn có chắc chắn muốn cập nhật trạng thái cho ${selectedBookingIds.length} đặt bàn đã chọn?` : deleteConfirmBooking.bulk ? `Bạn có chắc chắn muốn xóa ${selectedBookingIds.length} đặt bàn đã chọn? Hành động này không thể khôi phục.` : `Bạn có chắc chắn muốn xóa lịch đặt bàn DB${deleteConfirmBooking.bookingId}? Hành động này không thể khôi phục.`}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => setDeleteConfirmBooking(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">Hủy bỏ</button>
              <button type="button" onClick={() => {
                const target = deleteConfirmBooking;
                setDeleteConfirmBooking(null);
                if (target.bulkStatus) executeUpdateSelectedBookingsStatus(target.bulkStatus);
                else if (target.bulk) executeDeleteSelectedBookings();
                else executeDeleteBooking(target.bookingId);
              }} className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-sm ${deleteConfirmBooking.bulkStatus ? "bg-primary hover:bg-primary-light" : "bg-red-600 hover:bg-red-700"}`}>
                {deleteConfirmBooking.bulkStatus ? "Xác nhận" : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookingsPage;
