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
import { Gift, TicketPercent, Wallet, Search, RotateCcw, Trash2, Clock3 } from "lucide-react";
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

  const resetFilter = () => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); };

  const filteredDeals = useMemo(() => {
    const rawKeyword = String(search || globalSearch || "").trim();
    const scored = deals
      .map((deal) => {
        const matchType = typeFilter === "all" || deal.type === typeFilter;
        const matchStatus = statusFilter === "all" || deal.status === statusFilter;
        if (!matchType || !matchStatus) return null;

        const score = rawKeyword ? calculateSearchScore({
          name: deal.name || deal.title,
          code: deal.code,
          description: deal.description
        }, rawKeyword) : 1;

        if (score === 0) return null;
        return { deal, score };
      })
      .filter(Boolean);

    if (rawKeyword) {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored.map((s) => s.deal);
  }, [deals, search, globalSearch, typeFilter, statusFilter]);

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
      if (res.ok) {
        showAdminToast({ title: "Xóa khuyến mãi", message: `Đã xóa khuyến mãi "${deal.name}".` });
        fetchDeals();
        if (selectedDeal?.id === deal.id) setSelectedDeal(null);
      } else {
        const data = await res.json();
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
        showAdminToast({ title: "Thành công", message: editingDeal ? "Cập nhật khuyến mãi thành công." : "Thêm khuyến mãi mới thành công." });
        fetchDeals(); closeEditModal();
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DealStatCard icon={<Gift />} title="Đang chạy" value={deals.filter(d => d.status === "active").length} bg="bg-green-100/70" color="text-green-700" note="Chương trình ưu đãi" />
        <DealStatCard icon={<Clock3 />} title="Sắp diễn ra" value={deals.filter(d => d.status === "upcoming").length} bg="bg-orange-100/70" color="text-orange-600" note="Chương trình đã lên lịch" />
        <DealStatCard icon={<TicketPercent />} title="Tổng lượt dùng" value={Number(deals.reduce((sum, d) => sum + Number(d.used || 0), 0)).toLocaleString("vi-VN")} bg="bg-blue-100/70" color="text-blue-600" note="Lượt áp dụng mã" />
        <DealStatCard icon={<Wallet />} title="Tổng giảm giá" value={formatMoneyDeal(deals.reduce((sum, d) => sum + Number(d.totalDiscount || 0), 0))} bg="bg-purple-100/70" color="text-purple-600" note="Ngân sách khuyến mãi" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left transition-all ${selectedDeal ? "xl:col-span-8" : "xl:col-span-12"}`}>
          <div className="p-4 border-b border-gray-100">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${selectedDeal ? "xl:grid-cols-[1fr_160px_160px_90px]" : "xl:grid-cols-[1fr_190px_190px_100px]"}`}>
              <div className="h-12 rounded-xl border border-gray-100 bg-white px-4 flex items-center gap-3 shadow-sm">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm khuyến mãi..." className="w-full min-w-0 outline-none text-sm truncate" />
                <Search size={18} className="text-gray-400" />
              </div>
              <SelectBox label="Loại chương trình" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">Tất cả</option>
                {availableDealTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectBox>
              <SelectBox label="Trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tất cả</option><option value="active">Đang áp dụng</option><option value="upcoming">Sắp diễn ra</option><option value="paused">Tạm dừng</option><option value="ended">Đã kết thúc</option>
              </SelectBox>
              <button onClick={resetFilter} className="h-12 rounded-xl border border-gray-100 bg-white shadow-sm text-sm font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 transition"><RotateCcw size={16} /><span className={selectedDeal ? "hidden 2xl:inline" : ""}>Xóa</span></button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-4">
            <p className="text-sm font-bold text-gray-500">Tìm thấy {filteredDeals.length} chương trình khuyến mãi</p>
          </div>

          {selectedDealIds.length > 0 && (
            <div className="mx-4 mb-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-primary">Đã chọn {selectedDealIds.length} chương trình</p>
              <div className="flex items-center gap-2">
                <button onClick={() => bulkUpdateStatus("active")} className="h-10 px-4 rounded-xl bg-white text-green-700 border border-green-200 text-sm font-black hover:bg-green-100">Kích hoạt</button>
                <button onClick={() => bulkUpdateStatus("paused")} className="h-10 px-4 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 text-sm font-black hover:bg-orange-100">Tạm dừng</button>
                <button onClick={bulkDeleteDeals} className="h-10 px-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-black hover:bg-red-100">Xóa</button>
                <button onClick={() => setSelectedDealIds([])} className="h-10 px-4 rounded-xl bg-white text-gray-500 border border-gray-100 text-sm font-black hover:bg-gray-50">Bỏ chọn</button>
              </div>
            </div>
          )}

          <AdminDealTable
            paginatedDeals={paginatedDeals} selectedDealIds={selectedDealIds} selectedDeal={selectedDeal}
            setSelectedDeal={setSelectedDeal} toggleSelectAll={toggleSelectAll} handleSelectDeal={handleSelectDeal}
            getTypeStyle={getTypeStyleDeal} formatDate={formatDateDeal} getStatusStyle={getStatusStyleDeal}
            getStatusText={getStatusTextDeal} currentUser={currentUser} canUseAction={canUseAction}
            openEditModal={openEditModal} togglePauseDeal={togglePauseDeal} deleteDeal={deleteDeal}
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
          <DealDetailPanel
            deal={selectedDeal} formatMoney={formatMoneyDeal} formatNumber={formatNumberDeal} formatDate={formatDateDeal}
            getStatusText={getStatusTextDeal} getStatusStyle={getStatusStyleDeal} getTypeStyle={getTypeStyleDeal}
            getServiceTypeText={getServiceTypeTextDeal} onClose={() => setSelectedDeal(null)} openEditModal={openEditModal}
            canUseAction={canUseAction} currentUser={currentUser} deleteDeal={deleteDeal} togglePauseDeal={togglePauseDeal}
          />
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
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-[scaleIn_0.2s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner"><Trash2 size={28} /></div>
            <div>
              <h4 className="font-black text-gray-900 text-base">{deleteConfirmDeal.bulk ? "Xác nhận xóa hàng loạt" : deleteConfirmDeal.bulkStatus ? "Xác nhận cập nhật hàng loạt" : "Xác nhận xóa khuyến mãi"}</h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {deleteConfirmDeal.bulk ? `Bạn có chắc chắn muốn xóa ${selectedDealIds.length} chương trình đã chọn? Hành động này không thể khôi phục.` : deleteConfirmDeal.bulkStatus ? `Bạn muốn chuyển ${selectedDealIds.length} chương trình sang trạng thái ${deleteConfirmDeal.bulkStatus === "active" ? "kích hoạt" : "tạm dừng"}?` : `Bạn có chắc chắn muốn xóa chương trình "${deleteConfirmDeal.deal?.name}"? Hành động này không thể khôi phục.`}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => setDeleteConfirmDeal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">Hủy bỏ</button>
              <button type="button" onClick={() => { const target = deleteConfirmDeal; setDeleteConfirmDeal(null); if (target.bulk) executeBulkDeleteDeals(); else if (target.bulkStatus) executeBulkUpdateStatus(target.bulkStatus); else executeDeleteDeal(target.deal); }} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-sm">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDealsPage;
