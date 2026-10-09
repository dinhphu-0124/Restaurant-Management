import React from "react";
import {
  X,
  CalendarPlus,
  CalendarCheck,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users as UsersIcon,
  MapPin,
  FileText,
  Check,
  Info,
} from "lucide-react";
import { showAdminToast } from "./AdminToast";

const TABLE_STATUS_STYLE = {
  available: "border-emerald-200/90 bg-emerald-50/50 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100/60",
  holding: "border-amber-300/80 bg-amber-50/80 text-amber-900",
  booked: "border-rose-200 bg-rose-50/60 text-rose-800",
  serving: "border-blue-200 bg-blue-50/70 text-blue-800",
  maintenance: "border-slate-200 bg-slate-100 text-slate-500",
  disabled: "border-slate-200 bg-slate-100 text-slate-400",
  selected: "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-600/30",
};

const TABLE_DOT_STYLE = {
  available: "bg-emerald-500",
  holding: "bg-amber-500",
  booked: "bg-rose-500",
  serving: "bg-blue-500",
  maintenance: "bg-slate-400",
  disabled: "bg-slate-300",
  selected: "bg-white",
};

const TABLE_STATUS_TEXT = {
  available: "Trống",
  holding: "Đang giữ",
  booked: "Đã đặt",
  serving: "Đang phục vụ",
  maintenance: "Bảo trì",
  disabled: "Ngừng sử dụng",
};

export default function AdminBookingModals({
  editingBooking,
  setEditingBooking,
  editForm,
  setEditForm,
  isAddingBooking,
  setIsAddingBooking,
  addForm,
  setAddForm,
  areas = [],
  tables = [],
  getTableStatusForAdd,
  getTableStatusForEdit,
  getEditGuestCount,
  handleSelectTableForEditBooking,
  saveAddBooking,
  saveEditBooking,
  formatDate,
  errors = {},
}) {
  return (
    <>
      {/* MODAL CHỈNH SỬA ĐẶT BÀN */}
      {editingBooking && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 pb-20 sm:pb-4 text-left animate-in fade-in duration-150">
          <div
            className={`w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100dvh-6rem)] sm:max-h-[85vh] transition-all duration-200 ${editingBooking.status === "completed" ? "max-w-md" : "max-w-4xl"
              }`}
          >
            {/* Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CalendarCheck size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                    Chỉnh sửa đặt bàn
                  </h3>
                  <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 mt-0.5 truncate">
                    Mã: {editingBooking.bookingCode || `DB${editingBooking.id}`} · {editingBooking.customerName || "Khách đặt"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                aria-label="Đóng"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {editingBooking.status === "completed" ? (
              <div className="p-5 flex flex-col items-center text-center gap-3 overflow-y-auto flex-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-xl shadow-inner">
                  ✓
                </div>
                <div>
                  <p className="text-sm sm:text-base font-black text-slate-900 mt-1">Đặt bàn đã hoàn thành</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Lịch đặt <strong className="text-slate-800">{editingBooking.bookingCode || `DB${editingBooking.id}`}</strong> đã hoàn tất phục vụ.
                  </p>
                </div>
                <div className="w-full bg-slate-50 rounded-xl p-3 text-left space-y-1.5 mt-1 border border-slate-100 text-xs">
                  {editingBooking.date && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Ngày đặt</span>
                      <span className="font-bold text-slate-800">{formatDate(editingBooking.date)}</span>
                    </div>
                  )}
                  {editingBooking.selectedTable && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Bàn</span>
                      <span className="font-bold text-emerald-700">{editingBooking.selectedTable}</span>
                    </div>
                  )}
                  {editingBooking.guests && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Số khách</span>
                      <span className="font-bold text-slate-800">{editingBooking.guests} người</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-[270px_1fr] lg:grid-cols-[310px_1fr] gap-3 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                {/* Cột trái: Form thông tin */}
                <div className="space-y-2.5">
                  {/* Hàng 1: Ngày đặt + Trạng thái (2 cột trên mobile) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <Calendar size={12} className="text-slate-400" /> Ngày đặt
                      </label>
                      <input
                        type="date"
                        disabled={editingBooking?.status === "completed" || editingBooking?.status === "serving" || editingBooking?.status === "confirmed"}
                        value={editForm.date}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                            selectedTable:
                              editingBooking?.date === e.target.value
                                ? editingBooking?.selectedTable || ""
                                : "",
                          }))
                        }
                        className="w-full h-8.5 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <Info size={12} className="text-slate-400" /> Trạng thái
                      </label>
                      {editingBooking?.status === "completed" || editingBooking?.status === "serving" || editingBooking?.status === "confirmed" ? (
                        <div className="w-full h-8.5 rounded-xl border border-slate-100 px-2 flex items-center bg-slate-50 text-xs">
                          <span className={`font-black text-[11px] truncate ${editingBooking.status === "serving" ? "text-amber-600" : editingBooking.status === "completed" ? "text-emerald-700" : "text-blue-600"}`}>
                            {editingBooking.status === "serving" ? "🟡 Đang phục vụ" : editingBooking.status === "completed" ? "✅ Hoàn thành" : "🔵 Đã xác nhận"}
                          </span>
                        </div>
                      ) : (
                        <select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="w-full h-8.5 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Khu vực */}
                  <div>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <MapPin size={12} className="text-slate-400" /> Khu vực
                    </label>
                    <select
                      disabled={editingBooking?.status === "completed" || editingBooking?.status === "serving" || editingBooking?.status === "confirmed"}
                      value={editForm.selectedArea}
                      onChange={(e) => {
                        const areaId = e.target.value;
                        const area = areas.find(
                          (item) => String(item.id) === String(areaId),
                        );
                        setEditForm((prev) => ({
                          ...prev,
                          selectedArea: areaId,
                          selectedAreaTitle: area?.name || "",
                          selectedTable: "",
                        }));
                      }}
                      className="w-full h-8.5 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="">Nhà hàng sắp xếp</option>
                      {areas.map((area) => (
                        <option key={area.id} value={String(area.id)}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ghi chú */}
                  <div>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <FileText size={12} className="text-slate-400" /> Ghi chú
                    </label>
                    <textarea
                      disabled={editingBooking?.status === "completed" || editingBooking?.status === "serving" || editingBooking?.status === "confirmed"}
                      value={editForm.note}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          note: e.target.value,
                        }))
                      }
                      placeholder="Nhập ghi chú..."
                      className="w-full h-12 sm:h-16 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none resize-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Cột phải: Chọn bàn (3 cột gọn gàng) */}
                <div className="flex flex-col min-w-0 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 bg-slate-50/40">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/80">
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-800">
                        Sơ đồ chọn bàn
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                        (Số khách: <strong className="text-slate-700">{editingBooking?.guests || editingBooking?.people || 0}</strong>)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold shrink-0">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <i className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trống
                      </span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <i className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Đang giữ
                      </span>
                      <span className="flex items-center gap-1 text-rose-600">
                        <i className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Đã đặt
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 max-h-[220px] sm:max-h-[280px] md:max-h-none overflow-y-auto custom-scrollbar p-0.5">
                    {editForm.selectedArea ? (
                      <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2">
                        {tables
                          .filter(
                            (table) =>
                              String(table.areaId) ===
                              String(editForm.selectedArea),
                          )
                          .map((table) => {
                            const currentTable =
                              String(editingBooking?.selectedTable) ===
                              String(table.code) &&
                              editingBooking?.date === editForm.date;

                            const newSelectedTable =
                              String(editForm.selectedTable) ===
                              String(table.code) && !currentTable;

                            const rawStatus = getTableStatusForEdit(table);
                            const status = currentTable ? "selected" : rawStatus;
                            const guestCount = getEditGuestCount();
                            const insufficientCapacity =
                              guestCount > 0 &&
                              Number(table.capacity || 0) < guestCount;

                            const disabled =
                              currentTable ||
                              rawStatus !== "available" ||
                              editingBooking?.status === "completed" ||
                              editingBooking?.status === "serving" ||
                              editingBooking?.status === "confirmed";

                            return (
                              <button
                                key={table.id}
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                  handleSelectTableForEditBooking(
                                    table,
                                    rawStatus,
                                    currentTable,
                                  )
                                }
                                className={`min-h-[46px] sm:min-h-[52px] p-1.5 sm:p-2 rounded-xl border font-bold text-xs transition-all duration-150 flex flex-col items-center justify-center text-center ${currentTable || newSelectedTable
                                  ? TABLE_STATUS_STYLE.selected
                                  : disabled
                                    ? TABLE_STATUS_STYLE[status] || TABLE_STATUS_STYLE.available
                                    : insufficientCapacity
                                      ? "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300"
                                      : TABLE_STATUS_STYLE[status] || TABLE_STATUS_STYLE.available
                                  } ${disabled ? "cursor-not-allowed opacity-75" : "hover:-translate-y-0.5 hover:shadow-md cursor-pointer"}`}
                              >
                                <div className="flex items-center justify-center gap-1.5 leading-none">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentTable || newSelectedTable
                                      ? "bg-white ring-1 ring-white/50"
                                      : TABLE_DOT_STYLE[status]
                                      }`}
                                  />
                                  <span className="font-black text-xs leading-none">
                                    {table.code}
                                  </span>
                                </div>
                                <span className="text-[10px] opacity-80 mt-1 leading-none">
                                  {rawStatus === "available"
                                    ? `${table.capacity} chỗ`
                                    : TABLE_STATUS_TEXT[rawStatus] || rawStatus}
                                </span>

                                {(currentTable || newSelectedTable) && (
                                  <span className="text-[8.5px] font-black uppercase tracking-wider mt-0.5 bg-white/20 px-1 py-0.2 rounded leading-none">
                                    {currentTable ? "Đang chọn" : "Mới chọn"}
                                  </span>
                                )}

                                {insufficientCapacity && !disabled && !currentTable && !newSelectedTable && (
                                  <span className="text-[8.5px] font-bold text-amber-600/90 mt-0.5 leading-none">
                                    Thiếu chỗ
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 font-medium text-xs">
                        Vui lòng chọn khu vực bên trái để hiển thị sơ đồ bàn
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-3.5 py-2.5 sm:px-6 sm:py-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/90 shrink-0">
              <div className="text-xs font-semibold text-slate-600 truncate">
                {editForm.selectedTable ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <Check size={12} /> Bàn: {editForm.selectedTable}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Chưa chọn bàn</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="h-8.5 sm:h-9 px-3 sm:px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Đóng
                </button>

                {editingBooking.status !== "completed" && (
                  <button
                    type="button"
                    onClick={saveEditBooking}
                    className="h-8.5 sm:h-9 px-3.5 sm:px-5 rounded-xl bg-[#145c30] hover:bg-[#166534] text-white text-xs font-black shadow-sm transition"
                  >
                    Lưu thay đổi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM ĐẶT BÀN MỚI */}
      {isAddingBooking && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 pb-20 sm:pb-4 text-left animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100dvh-6rem)] sm:max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CalendarPlus size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                    Thêm đặt bàn mới
                  </h3>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5 truncate">
                    Tạo lịch đặt bàn trực tiếp cho khách hàng
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingBooking(false)}
                aria-label="Đóng"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-[270px_1fr] lg:grid-cols-[310px_1fr] gap-3 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {/* Form Cột Trái: Thông tin khách + thời gian */}
              <div className="space-y-2.5">
                {/* Tên khách hàng */}
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-slate-400" /> Tên khách hàng <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <input
                    value={addForm.customerName}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    placeholder="VD: Nguyễn Văn An"
                    className={`w-full h-8.5 px-2.5 rounded-xl border text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition ${errors.customerName
                      ? "border-rose-400 ring-1 ring-rose-100 bg-rose-50/20"
                      : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      }`}
                  />
                  {errors.customerName && (
                    <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                      {errors.customerName}
                    </p>
                  )}
                </div>

                {/* SĐT + Email */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <Phone size={12} className="text-slate-400" /> SĐT <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={addForm.phone}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          phone: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      placeholder="0987654321"
                      className={`w-full h-8.5 px-2 rounded-xl border text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition ${errors.phone
                        ? "border-rose-400 ring-1 ring-rose-100 bg-rose-50/20"
                        : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        }`}
                    />
                    {errors.phone && (
                      <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <Mail size={12} className="text-slate-400" /> Email
                    </label>
                    <input
                      value={addForm.email}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Tùy chọn"
                      className="w-full h-8.5 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Ngày đặt + Giờ */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <Calendar size={12} className="text-slate-400" /> Ngày <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={addForm.date}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          date: e.target.value,
                          selectedTable: "",
                        }))
                      }
                      className={`w-full h-8.5 px-2 rounded-xl border text-xs font-semibold text-slate-800 outline-none transition ${errors.date
                        ? "border-rose-400 ring-1 ring-rose-100 bg-rose-50/20"
                        : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        }`}
                    />
                    {errors.date && (
                      <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                        {errors.date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <Clock size={12} className="text-slate-400" /> Giờ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={addForm.time}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          time: e.target.value,
                        }))
                      }
                      className={`w-full h-8.5 px-2 rounded-xl border text-xs font-semibold text-slate-800 outline-none transition ${errors.time
                        ? "border-rose-400 ring-1 ring-rose-100 bg-rose-50/20"
                        : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        }`}
                    />
                    {errors.time && (
                      <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                        {errors.time}
                      </p>
                    )}
                  </div>
                </div>

                {/* Số khách + Khu vực */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <UsersIcon size={12} className="text-slate-400" /> Khách <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={addForm.guests}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          guests: e.target.value,
                          selectedTable: "",
                        }))
                      }
                      className={`w-full h-8.5 px-2 rounded-xl border text-xs font-semibold text-slate-800 outline-none transition ${errors.guests
                        ? "border-rose-400 ring-1 ring-rose-100 bg-rose-50/20"
                        : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        }`}
                    />
                    {errors.guests && (
                      <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                        {errors.guests}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <MapPin size={12} className="text-slate-400" /> Khu vực <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={addForm.selectedArea}
                      onChange={(e) => {
                        const areaId = String(e.target.value);
                        const area = areas.find(
                          (item) => String(item.id) === areaId,
                        );
                        setAddForm((prev) => ({
                          ...prev,
                          selectedArea: areaId,
                          selectedAreaTitle: area?.name || "",
                          selectedTable: "",
                        }));
                      }}
                      className={`w-full h-8.5 px-2 rounded-xl border text-xs font-semibold text-slate-800 outline-none transition ${errors.selectedArea
                        ? "border-rose-400 ring-1 ring-rose-100 bg-rose-50/20"
                        : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        }`}
                    >
                      <option value="">Chọn khu vực</option>
                      {areas.map((area) => (
                        <option key={area.id} value={String(area.id)}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                    {errors.selectedArea && (
                      <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                        {errors.selectedArea}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <FileText size={12} className="text-slate-400" /> Ghi chú
                  </label>
                  <textarea
                    value={addForm.note}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                    placeholder="Ghi chú thêm..."
                    className="w-full h-12 sm:h-16 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Sơ đồ chọn bàn (Cột Phải - 3 cột bàn gọn gàng) */}
              <div className="flex flex-col min-w-0 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 bg-slate-50/40">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/80">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-900">
                      Sơ đồ chọn bàn
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                      (Yêu cầu: <strong className="text-slate-800">{addForm.guests || 1} khách</strong>)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-bold shrink-0">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <i className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trống
                    </span>
                    <span className="flex items-center gap-1 text-amber-600">
                      <i className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Đang giữ
                    </span>
                    <span className="flex items-center gap-1 text-rose-600">
                      <i className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Đã đặt
                    </span>
                  </div>
                </div>

                <div className="flex-1 max-h-[220px] sm:max-h-[280px] md:max-h-none overflow-y-auto custom-scrollbar p-0.5">
                  {addForm.selectedArea ? (
                    (() => {
                      const areaTables = tables.filter(
                        (table) => String(table.areaId) === String(addForm.selectedArea),
                      );

                      if (areaTables.length === 0) {
                        return (
                          <div className="py-8 text-center text-slate-400 font-medium text-xs">
                            Khu vực này hiện chưa có bàn nào
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2">
                          {areaTables.map((table) => {
                            const status = getTableStatusForAdd(table);
                            const isSelected = String(addForm.selectedTable) === String(table.code);
                            const guestCount = Number(addForm.guests || 0);
                            const insufficientCapacity =
                              guestCount > 0 && Number(table.capacity || 0) < guestCount;
                            const disabled = status !== "available";

                            return (
                              <button
                                key={table.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  if (disabled) return;
                                  if (insufficientCapacity) {
                                    showAdminToast({
                                      title: "Sức chứa không phù hợp",
                                      message: `Bàn ${table.code} chỉ chứa tối đa ${table.capacity} người. Vui lòng chọn bàn khác phù hợp hơn.`,
                                      type: "warning",
                                    });
                                    return;
                                  }
                                  setAddForm((prev) => ({
                                    ...prev,
                                    selectedTable: table.code,
                                  }));
                                }}
                                className={`min-h-[46px] sm:min-h-[52px] p-1.5 sm:p-2 rounded-xl border font-bold text-xs transition-all duration-150 flex flex-col items-center justify-center text-center ${isSelected
                                  ? TABLE_STATUS_STYLE.selected
                                  : disabled
                                    ? TABLE_STATUS_STYLE[status] || TABLE_STATUS_STYLE.available
                                    : insufficientCapacity
                                      ? "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300"
                                      : TABLE_STATUS_STYLE[status] || TABLE_STATUS_STYLE.available
                                  } ${disabled ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5 hover:shadow-md cursor-pointer"}`}
                              >
                                <div className="flex items-center justify-center gap-1.5 leading-none">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected
                                      ? "bg-white ring-1 ring-white/50"
                                      : TABLE_DOT_STYLE[status]
                                      }`}
                                  />
                                  <span className="font-black text-xs leading-none">
                                    {table.code}
                                  </span>
                                </div>

                                <span className="text-[10px] opacity-80 mt-1 leading-none">
                                  {status === "available"
                                    ? `${table.capacity} người`
                                    : TABLE_STATUS_TEXT[status] || status}
                                </span>

                                {isSelected && (
                                  <span className="text-[8.5px] font-black uppercase tracking-wider mt-0.5 bg-white/25 px-1 py-0.2 rounded leading-none">
                                    Đang chọn
                                  </span>
                                )}

                                {insufficientCapacity && !disabled && !isSelected && (
                                  <span className="text-[8.5px] font-bold text-amber-600/90 mt-0.5 leading-none">
                                    Thiếu chỗ
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="py-8 text-center text-slate-400 font-medium text-xs flex flex-col items-center justify-center gap-1.5">
                      <MapPin size={20} className="text-slate-300" />
                      <span>Vui lòng chọn <strong>Khu vực</strong> ở cột bên trái</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-3.5 py-2.5 sm:px-6 sm:py-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/90 shrink-0">
              <div className="text-xs font-semibold text-slate-600 truncate">
                {addForm.selectedTable ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <Check size={12} /> Đã chọn: <strong className="underline">{addForm.selectedTable}</strong>
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Chưa chọn bàn (Tùy chọn)</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBooking(false)}
                  className="h-8.5 sm:h-9 px-3 sm:px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={saveAddBooking}
                  className="h-8.5 sm:h-9 px-3.5 sm:px-5 rounded-xl bg-[#145c30] hover:bg-[#166534] text-white text-xs font-black shadow-sm transition"
                >
                  Tạo đặt bàn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
