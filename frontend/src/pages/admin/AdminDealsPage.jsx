import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { showAdminToast } from "../../components/admin/AdminToast";
import { removeVietnameseTones, calculateSearchScore } from "../../utils/string";
import { getCurrentUser, getAuthToken } from "../../utils/auth";
import { canUseAction } from "../../utils/permissions";
import { DealStatCard, SelectBox } from "../../components/admin/AdminDealsComponents";
import AdminDealEditModal from "../../components/admin/AdminDealEditModal";
import DealDetailPanel from "../../components/admin/DealDetailPanel";
import AdminDealTable from "../../components/admin/AdminDealTable";
import GlobalPagination from "../../components/admin/GlobalPagination";
import { Gift, TicketPercent, Wallet, Search, RotateCcw, Trash2, Clock3, AlertTriangle, Copy } from "lucide-react";
import {
  EMPTY_DEAL_FORM,
  formatMoneyDeal,
  formatNumberDeal,
  formatDateDeal,
  getStatusTextDeal,
  getStatusStyleDeal,
  getTypeStyleDeal,
  getServiceTypeTextDeal,
  getStoredDealTypes,
  getDealLifecycle,
} from "../../utils/dealsHelpers";
import { API_BASE_URL } from "../../config/api";

const API_URL = `${API_BASE_URL}/deals`;

const authHeaders = (contentType = "application/json") => {
  const token = getAuthToken();
  return { ...(contentType ? { "Content-Type": contentType } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

function AdminDealsPage() {
  const { globalSearch, dateRange } = useOutletContext();
  const currentUser = getCurrentUser();
  const [deals, setDeals] = useState([]);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lifecycle");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [selectedDealIds, setSelectedDealIds] = useState([]);
  const [editingDeal, setEditingDeal] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_DEAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirmDeal, setDeleteConfirmDeal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenAdd = () => openEditModal(null);
    window.addEventListener("openAddDealModal", handleOpenAdd);
    return () => window.removeEventListener("openAddDealModal", handleOpenAdd);
  }, []);

  const fetchDeals = async () => {
    try { const res = await fetch(API_URL); const data = await res.json(); setDeals(data.deals || []); }
    catch (error) { console.error("Lỗi:", error); setDeals([]); }
  };
  useEffect(() => { fetchDeals(); }, []);

  const handleImageChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showAdminToast({ title: "Kích thước quá lớn", message: "Ảnh không được vượt quá 5MB.", type: "warning" }); return; }
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getAuthToken()}` },
        body: formData
      });
      const result = await res.json();
      if (!result.success) { showAdminToast({ title: "Lỗi", message: result.message || "Upload ảnh thất bại", type: "error" }); return; }
      
      const imageUrl = result.imageUrl || result.images?.[0] || result.image || "";
      setEditForm((prev) => ({ ...prev, [fieldName]: imageUrl }));
    } catch (error) {
      console.error("Lỗi:", error);
      showAdminToast({ title: "Lỗi", message: "Không thể upload ảnh", type: "error" });
    } finally {
      e.target.value = "";
    }
  };

  const removeImage = (fieldName) => {
    setEditForm((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const resetFilter = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setSortBy("lifecycle");
  };

  const cloneDeal = (deal) => {
    const baseCode = (deal.code || "DEAL").replace(/_COPY(\d+)?$/, "");
    const newCode = `${baseCode}_COPY`;

    const today = new Date();
    const startDateStr = today.toISOString().slice(0, 10);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);
    const endDateStr = nextMonth.toISOString().slice(0, 10);

    const clonedData = {
      ...EMPTY_DEAL_FORM,
      ...deal,
      id: undefined,
      code: newCode,
      name: `${deal.name || deal.title || "Khuyến mãi"} (Bản sao)`,
      startDate: startDateStr,
      endDate: endDateStr,
      used: 0,
      used_count: 0,
      totalDiscount: 0,
      usageHistory: [],
      status: "active",
    };

    setEditingDeal(null);
    setEditForm(clonedData);
    setFormErrors({});
    setIsModalOpen(true);
    showAdminToast({
      title: "Nhân bản khuyến mãi",
      message: `Đã chuẩn bị bản sao "${newCode}". Vui lòng kiểm tra lại thời gian áp dụng và lưu.`,
      type: "info",
    });
  };

  const filteredDeals = useMemo(() => {
    const rawKeyword = String(search || globalSearch || "").trim();

    // 1. Lọc theo loại và vòng đời thời gian thực
    const filtered = deals.filter((deal) => {
      const matchType = typeFilter === "all" || deal.type === typeFilter;
      
      const lc = getDealLifecycle(deal);
      let matchStatus = true;
      if (statusFilter === "active") {
        matchStatus = lc.key === "active" || lc.key === "expiring_soon";
      } else if (statusFilter === "upcoming") {
        matchStatus = lc.key === "upcoming";
      } else if (statusFilter === "expiring_soon") {
        matchStatus = lc.key === "expiring_soon";
      } else if (statusFilter === "paused") {
        matchStatus = lc.key === "paused";
      } else if (statusFilter === "expired" || statusFilter === "ended") {
        matchStatus = lc.key === "expired";
      } else if (statusFilter === "invalid") {
        matchStatus = lc.key === "invalid";
      }

      return matchType && matchStatus;
    });

    // 2. Chấm điểm tìm kiếm
    let scored = filtered.map((deal) => {
      const score = rawKeyword
        ? calculateSearchScore(
            {
              name: deal.name || deal.title,
              code: deal.code,
              description: deal.description,
            },
            rawKeyword,
          )
        : 1;
      return { deal, score };
    }).filter((item) => item.score > 0);

    // 3. Sắp xếp đa tiêu chí
    scored.sort((a, b) => {
      if (rawKeyword && b.score !== a.score) {
        return b.score - a.score;
      }

      const da = a.deal;
      const db = b.deal;

      if (sortBy === "lifecycle") {
        const orderMap = {
          expiring_soon: 1,
          active: 2,
          upcoming: 3,
          paused: 4,
          expired: 5,
          invalid: 6,
        };
        const orderA = orderMap[getDealLifecycle(da).key] || 99;
        const orderB = orderMap[getDealLifecycle(db).key] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return Number(db.id || 0) - Number(da.id || 0);
      }

      if (sortBy === "newest") {
        return Number(db.id || 0) - Number(da.id || 0);
      }
      if (sortBy === "oldest") {
        return Number(da.id || 0) - Number(db.id || 0);
      }
      if (sortBy === "start_soon") {
        const sa = new Date(da.startDate || 0).getTime();
        const sb = new Date(db.startDate || 0).getTime();
        return sa - sb;
      }
      if (sortBy === "end_soon") {
        const ea = new Date(da.endDate || "2099-12-31").getTime();
        const eb = new Date(db.endDate || "2099-12-31").getTime();
        return ea - eb;
      }
      if (sortBy === "used_high") {
        return Number(db.used || 0) - Number(da.used || 0);
      }
      if (sortBy === "discount_high") {
        const parseDisc = (d) => {
          const match = String(d.discount || "").match(/(\d+)/);
          return match ? Number(match[1]) : 0;
        };
        return parseDisc(db) - parseDisc(da);
      }

      return 0;
    });

    return scored.map((s) => s.deal);
  }, [deals, search, globalSearch, typeFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / pageSize));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages, filteredDeals.length]);

  const paginatedDeals = filteredDeals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (paginatedDeals.length > 0 && paginatedDeals.every((deal) => selectedDealIds.includes(String(deal.id)))) {
      setSelectedDealIds((prev) => prev.filter((id) => !paginatedDeals.find((d) => String(d.id) === id)));
    } else {
      const newIds = paginatedDeals.map((deal) => String(deal.id)).filter((id) => !selectedDealIds.includes(id));
      setSelectedDealIds((prev) => [...prev, ...newIds]);
    }
  };

  const handleSelectDeal = (id) => {
    const stringId = String(id);
    setSelectedDealIds((prev) => prev.includes(stringId) ? prev.filter((item) => item !== stringId) : [...prev, stringId]);
  };

  const executeDeleteDeal = async (deal) => {
    try {
      const res = await fetch(`${API_URL}/${deal.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        showAdminToast({
          title: data.archived ? "Đã lưu trữ hồ sơ" : "Xóa khuyến mãi",
          message: data.message || `Đã xóa khuyến mãi "${deal.name}".`,
          type: data.archived ? "info" : "success",
        });
        fetchDeals();
        if (selectedDeal?.id === deal.id) setSelectedDeal(null);
      } else {
        showAdminToast({ title: "Thất bại", message: data.message || "Xóa thất bại", type: "error" });
      }
    } catch (error) { console.error("Lỗi:", error); showAdminToast({ title: "Thất bại", message: "Lỗi kết nối.", type: "error" }); }
  };

  const deleteDeal = (deal) => setDeleteConfirmDeal({ deal });

  const executeBulkDeleteDeals = async () => {
    try {
      for (const id of selectedDealIds) { await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: authHeaders() }); }
      showAdminToast({ title: "Thành công", message: `Đã xóa ${selectedDealIds.length} khuyến mãi.` });
      fetchDeals(); setSelectedDealIds([]);
      if (selectedDealIds.includes(String(selectedDeal?.id))) setSelectedDeal(null);
    } catch (error) { console.error("Lỗi:", error); showAdminToast({ title: "Thất bại", message: "Lỗi xóa hàng loạt", type: "error" }); }
  };
  const bulkDeleteDeals = () => { if (selectedDealIds.length === 0) return; setDeleteConfirmDeal({ bulk: true }); };

  const togglePauseDeal = async (deal) => {
    const newStatus = deal.status === "paused" ? "active" : "paused";
    try {
      const res = await fetch(`${API_URL}/${deal.id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ ...deal, status: newStatus }) });
      if (res.ok) {
        showAdminToast({ title: "Thành công", message: `Đã ${newStatus === "paused" ? "tạm dừng" : "kích hoạt"} khuyến mãi "${deal.name}".` });
        fetchDeals();
        if (selectedDeal?.id === deal.id) setSelectedDeal({ ...selectedDeal, status: newStatus });
      } else {
        const data = await res.json(); showAdminToast({ title: "Thất bại", message: data.message || "Lỗi cập nhật trạng thái", type: "error" });
      }
    } catch (error) { console.error("Lỗi:", error); showAdminToast({ title: "Thất bại", message: "Lỗi kết nối", type: "error" }); }
  };

  const executeBulkUpdateStatus = async (status) => {
    try {
      for (const id of selectedDealIds) {
        const dealToUpdate = deals.find(d => String(d.id) === String(id));
        if (dealToUpdate) {
          await fetch(`${API_URL}/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ ...dealToUpdate, status }) });
        }
      }
      showAdminToast({ title: "Thành công", message: `Đã cập nhật trạng thái ${selectedDealIds.length} khuyến mãi.` });
      fetchDeals(); setSelectedDealIds([]);
      if (selectedDealIds.includes(String(selectedDeal?.id))) setSelectedDeal({ ...selectedDeal, status });
    } catch (error) { console.error("Lỗi:", error); showAdminToast({ title: "Thất bại", message: "Lỗi cập nhật trạng thái", type: "error" }); }
  };
  const bulkUpdateStatus = (status) => { if (selectedDealIds.length === 0) return; setDeleteConfirmDeal({ bulkStatus: status }); };

  const openEditModal = (deal = null) => {
    setFormErrors({}); setEditingDeal(deal);
    if (deal) setEditForm({ ...EMPTY_DEAL_FORM, ...deal }); else setEditForm(EMPTY_DEAL_FORM);
    setIsModalOpen(true);
  };
  const closeEditModal = () => { setEditingDeal(null); setEditForm(EMPTY_DEAL_FORM); setIsModalOpen(false); };
  const saveDeal = async () => {
    const errors = {};
    if (!editForm.code || !editForm.code.trim()) errors.code = true;
    if (!editForm.name || !editForm.name.trim()) errors.name = true;
    if (!editForm.discount || !editForm.discount.trim()) errors.discount = true;
    if (!editForm.startDate) errors.startDate = true;
    if (!editForm.endDate) errors.endDate = true;
    if (!editForm.serviceTypes || editForm.serviceTypes.length === 0) errors.serviceTypes = true;

    if (editForm.startDate && editForm.endDate) {
      const s = new Date(`${String(editForm.startDate).slice(0, 10)}T00:00:00+07:00`);
      const e = new Date(`${String(editForm.endDate).slice(0, 10)}T23:59:59.999+07:00`);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) {
        errors.endDate = true;
        setFormErrors(errors);
        showAdminToast({
          title: "Ngày không hợp lệ",
          message: "Ngày kết thúc phải diễn ra sau hoặc cùng ngày với ngày bắt đầu.",
          type: "warning",
        });
        return;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showAdminToast({
        title: "Thông tin chưa đầy đủ",
        message: "Vui lòng nhập đầy đủ các trường bắt buộc (*).",
        type: "warning",
      });
      return;
    }
    setFormErrors({});

    try {
      const url = editingDeal ? `${API_URL}/${editingDeal.id}` : API_URL;
      const method = editingDeal ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(editForm) });
      if (res.ok) {
        const data = await res.json();
        showAdminToast({ title: "Thành công", message: editingDeal ? "Cập nhật khuyến mãi thành công." : "Thêm khuyến mãi mới thành công." });
        await fetchDeals();
        if (data.deal) setSelectedDeal(data.deal);
        closeEditModal();
      } else {
        const data = await res.json();
        showAdminToast({ title: "Lỗi", message: data.message || "Lưu thất bại", type: "error" });
      }
    } catch (error) {
      console.error("Lỗi:", error);
      showAdminToast({ title: "Thất bại", message: "Lỗi kết nối", type: "error" });
    }
  };

  const [dealTypesList, setDealTypesList] = useState(getStoredDealTypes);

  useEffect(() => {
    const handleUpdate = () => setDealTypesList(getStoredDealTypes());
    window.addEventListener("deal_types_updated", handleUpdate);
    return () => window.removeEventListener("deal_types_updated", handleUpdate);
  }, []);

  const availableDealTypes = useMemo(() => {
    const fromTypes = dealTypesList.map((t) => t.name);
    const fromDeals = deals.map((d) => d.type).filter(Boolean);
    return Array.from(new Set([...fromTypes, ...fromDeals]));
  }, [dealTypesList, deals]);

  return (
    <div className="space-y-5">
      {/* 4 Thẻ thống kê thời gian thực */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DealStatCard
          icon={<Gift />}
          title="Đang áp dụng"
          value={deals.filter(d => {
            const k = getDealLifecycle(d).key;
            return k === "active" || k === "expiring_soon";
          }).length}
          bg="bg-emerald-100/70"
          color="text-emerald-700"
          note="Chương trình ưu đãi hợp lệ"
        />
        <DealStatCard
          icon={<Clock3 />}
          title="Sắp diễn ra"
          value={deals.filter(d => getDealLifecycle(d).key === "upcoming").length}
          bg="bg-sky-100/70"
          color="text-sky-700"
          note="Chương trình đã lên lịch"
        />
        <DealStatCard
          icon={<TicketPercent />}
          title="Tổng lượt dùng"
          value={Number(deals.reduce((sum, d) => sum + Number(d.used || 0), 0)).toLocaleString("vi-VN")}
          bg="bg-blue-100/70"
          color="text-blue-600"
          note="Lượt áp dụng mã thực tế"
        />
        <DealStatCard
          icon={<Wallet />}
          title="Tổng giảm giá"
          value={formatMoneyDeal(deals.reduce((sum, d) => sum + Number(d.totalDiscount || 0), 0))}
          bg="bg-purple-100/70"
          color="text-purple-600"
          note="Ngân sách ưu đãi đã tài trợ"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left transition-all ${selectedDeal ? "xl:col-span-8" : "xl:col-span-12"}`}>
          <div className="p-4 border-b border-gray-100">
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${selectedDeal ? "xl:grid-cols-[1fr_135px_145px_155px_75px]" : "xl:grid-cols-[1fr_160px_170px_180px_85px]"} gap-3`}>
              <div className="sm:col-span-2 xl:col-span-1 h-12 rounded-xl border border-gray-100 bg-white px-4 flex items-center gap-3 shadow-sm">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo mã hoặc tên..."
                  className="w-full min-w-0 outline-none text-sm truncate"
                />
                <Search size={18} className="text-gray-400 shrink-0" />
              </div>

              <SelectBox label="Loại chương trình" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">Tất cả loại</option>
                {availableDealTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectBox>

              <SelectBox label="Trạng thái vòng đời" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">🟢 Đang áp dụng</option>
                <option value="upcoming">🔵 Sắp diễn ra</option>
                <option value="expiring_soon">⚡ Sắp hết hạn (&le; 24h)</option>
                <option value="paused">🟠 Tạm dừng</option>
                <option value="expired">⚪ Đã hết hạn</option>
                <option value="invalid">🔴 Dữ liệu lỗi</option>
              </SelectBox>

              <SelectBox label="Sắp xếp theo" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="lifecycle">⚡ Ưu tiên vòng đời</option>
                <option value="newest">🕒 Mới tạo nhất</option>
                <option value="oldest">🕰️ Cũ nhất</option>
                <option value="start_soon">📅 Bắt đầu gần nhất</option>
                <option value="end_soon">⏰ Kết thúc gần nhất</option>
                <option value="discount_high">💰 Giảm giá cao &rarr; thấp</option>
                <option value="used_high">🔥 Lượt dùng nhiều &rarr; ít</option>
              </SelectBox>

              <button
                type="button"
                onClick={resetFilter}
                title="Đặt lại bộ lọc"
                className="h-12 rounded-xl border border-gray-100 bg-white shadow-sm text-sm font-bold text-gray-600 flex items-center justify-center gap-1.5 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
              >
                <RotateCcw size={16} />
                <span className={selectedDeal ? "hidden 2xl:inline" : ""}>Đặt lại</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-4">
            <p className="text-sm font-bold text-gray-500">
              Tìm thấy <strong className="text-gray-900">{filteredDeals.length}</strong> chương trình khuyến mãi
            </p>
          </div>

          {selectedDealIds.length > 0 && (
            <div className="mx-4 mb-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-black text-primary">
                Đã chọn {selectedDealIds.length} chương trình
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => bulkUpdateStatus("active")}
                  className="h-10 px-4 rounded-xl bg-white text-green-700 border border-green-200 text-sm font-black hover:bg-green-100 cursor-pointer"
                >
                  Kích hoạt
                </button>
                <button
                  type="button"
                  onClick={() => bulkUpdateStatus("paused")}
                  className="h-10 px-4 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 text-sm font-black hover:bg-orange-100 cursor-pointer"
                >
                  Tạm dừng
                </button>
                <button
                  type="button"
                  onClick={bulkDeleteDeals}
                  className="h-10 px-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-black hover:bg-red-100 cursor-pointer"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDealIds([])}
                  className="h-10 px-4 rounded-xl bg-white text-gray-500 border border-gray-100 text-sm font-black hover:bg-gray-50 cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          <AdminDealTable
            paginatedDeals={paginatedDeals}
            selectedDealIds={selectedDealIds}
            selectedDeal={selectedDeal}
            setSelectedDeal={setSelectedDeal}
            toggleSelectAll={toggleSelectAll}
            handleSelectDeal={handleSelectDeal}
            getTypeStyle={getTypeStyleDeal}
            formatDate={formatDateDeal}
            getStatusStyle={getStatusStyleDeal}
            getStatusText={getStatusTextDeal}
            currentUser={currentUser}
            canUseAction={canUseAction}
            openEditModal={openEditModal}
            togglePauseDeal={togglePauseDeal}
            deleteDeal={deleteDeal}
            cloneDeal={cloneDeal}
          />

          <GlobalPagination
            total={filteredDeals.length}
            page={currentPage}
            limit={pageSize}
            onPageChange={setCurrentPage}
            onLimitChange={setPageSize}
            isLoading={false}
            limitOptions={[10, 20, 50]}
          />
        </section>

        {selectedDeal && (
          <>
            {/* Desktop (xl+): Cột cố định bên phải */}
            <div className="hidden xl:block xl:col-span-4">
              <DealDetailPanel
                deal={selectedDeal}
                formatMoney={formatMoneyDeal}
                formatNumber={formatNumberDeal}
                formatDate={formatDateDeal}
                getStatusText={getStatusTextDeal}
                getStatusStyle={getStatusStyleDeal}
                getTypeStyle={getTypeStyleDeal}
                getServiceTypeText={getServiceTypeTextDeal}
                onClose={() => setSelectedDeal(null)}
                onEdit={() => openEditModal(selectedDeal)}
                onTogglePause={() => togglePauseDeal(selectedDeal)}
                onDelete={() => deleteDeal(selectedDeal)}
                onClone={cloneDeal}
                canUseAction={canUseAction}
                currentUser={currentUser}
              />
            </div>

            {/* Mobile & Tablet (< xl): Slide-over Drawer với Backdrop che mờ */}
            <div
              className="xl:hidden fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 p-0 sm:p-3"
              onClick={() => setSelectedDeal(null)}
            >
              <div
                className="w-full sm:max-w-lg h-full bg-white sm:rounded-3xl shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-250 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <DealDetailPanel
                  deal={selectedDeal}
                  formatMoney={formatMoneyDeal}
                  formatNumber={formatNumberDeal}
                  formatDate={formatDateDeal}
                  getStatusText={getStatusTextDeal}
                  getStatusStyle={getStatusStyleDeal}
                  getTypeStyle={getTypeStyleDeal}
                  getServiceTypeText={getServiceTypeTextDeal}
                  onClose={() => setSelectedDeal(null)}
                  onEdit={() => openEditModal(selectedDeal)}
                  onTogglePause={() => togglePauseDeal(selectedDeal)}
                  onDelete={() => deleteDeal(selectedDeal)}
                  onClone={cloneDeal}
                  canUseAction={canUseAction}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <AdminDealEditModal
        isOpen={isModalOpen}
        editingDeal={editingDeal}
        form={editForm}
        setForm={setEditForm}
        formErrors={formErrors}
        areas={[]}
        handleImageChange={handleImageChange}
        removeImage={removeImage}
        onClose={closeEditModal}
        onSave={saveDeal}
        title={editingDeal ? "Chỉnh sửa khuyến mãi" : "Thêm khuyến mãi mới"}
        subtitle={editingDeal ? "Cập nhật thông tin chương trình khuyến mãi" : "Tạo chương trình khuyến mãi mới"}
      />

      {deleteConfirmDeal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-md w-full text-center space-y-4 animate-[scaleIn_0.2s_ease-out]">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner ${
              deleteConfirmDeal.deal && Number(deleteConfirmDeal.deal.used || 0) > 0
                ? "bg-amber-50 text-amber-600"
                : "bg-red-50 text-red-600"
            }`}>
              {deleteConfirmDeal.deal && Number(deleteConfirmDeal.deal.used || 0) > 0 ? (
                <AlertTriangle size={28} />
              ) : (
                <Trash2 size={28} />
              )}
            </div>

            <div>
              <h4 className="font-black text-gray-900 text-base">
                {deleteConfirmDeal.bulk
                  ? "Xác nhận xóa hàng loạt"
                  : deleteConfirmDeal.bulkStatus
                  ? "Xác nhận cập nhật hàng loạt"
                  : Number(deleteConfirmDeal.deal?.used || 0) > 0
                  ? "Lưu trữ chương trình khuyến mãi"
                  : "Xác nhận xóa khuyến mãi"}
              </h4>

              {deleteConfirmDeal.deal ? (
                <div className="mt-3 text-left bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Mã khuyến mãi:</span>
                    <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {deleteConfirmDeal.deal.code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Tên chương trình:</span>
                    <span className="font-black text-gray-800 truncate max-w-[200px]">
                      {deleteConfirmDeal.deal.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Thời hạn:</span>
                    <span className="font-semibold text-gray-700">
                      {deleteConfirmDeal.deal.startDate} &rarr; {deleteConfirmDeal.deal.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Lượt đã dùng:</span>
                    <span className={`font-black ${Number(deleteConfirmDeal.deal.used || 0) > 0 ? "text-amber-700" : "text-gray-700"}`}>
                      {deleteConfirmDeal.deal.used || 0} lượt
                    </span>
                  </div>

                  {Number(deleteConfirmDeal.deal.used || 0) > 0 && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                      ⚠️ <strong>Lưu ý đối soát kế toán:</strong> Chương trình này đã có <strong>{deleteConfirmDeal.deal.used}</strong> lượt sử dụng thực tế. Hệ thống sẽ tự động chuyển sang trạng thái <strong>Lưu trữ (Đã hủy)</strong> để bảo toàn số liệu đơn hàng và doanh thu.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {deleteConfirmDeal.bulk
                    ? `Bạn có chắc chắn muốn xóa ${selectedDealIds.length} chương trình đã chọn? Hành động này không thể khôi phục.`
                    : `Bạn muốn chuyển ${selectedDealIds.length} chương trình sang trạng thái ${
                        deleteConfirmDeal.bulkStatus === "active" ? "kích hoạt" : "tạm dừng"
                      }?`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmDeal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = deleteConfirmDeal;
                  setDeleteConfirmDeal(null);
                  if (target.bulk) executeBulkDeleteDeals();
                  else if (target.bulkStatus) executeBulkUpdateStatus(target.bulkStatus);
                  else executeDeleteDeal(target.deal);
                }}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-sm cursor-pointer ${
                  deleteConfirmDeal.deal && Number(deleteConfirmDeal.deal.used || 0) > 0
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {deleteConfirmDeal.deal && Number(deleteConfirmDeal.deal.used || 0) > 0
                  ? "Xác nhận lưu trữ"
                  : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDealsPage;
