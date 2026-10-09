import React from "react";
import {
  X,
  CalendarPlus,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users as UsersIcon,
  MapPin,
  FileText,
  Check,
} from "lucide-react";
import { showAdminToast } from "./AdminToast";

const TABLE_STATUS = {
  available: "Trống",
  holding: "Đang giữ",
  booked: "Đã đặt",
  serving: "Đang phục vụ",
  maintenance: "Bảo trì",
  disabled: "Ngừng sử dụng",
};

const TABLE_STATUS_STYLE = {
  available: "border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100/70",
  holding: "border-amber-200 bg-amber-50/70 text-amber-700",
  booked: "border-rose-200 bg-rose-50/60 text-rose-700",
  serving: "border-blue-200 bg-blue-50/70 text-blue-700",
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

export default function AdminAddBookingModal({
  isAddingBooking,
  setIsAddingBooking,
  addForm,
  setAddForm,
  areas = [],
  tables = [],
  getTableStatusForAdd,
  handleSelectTableForAddBooking,
  saveAddBooking,
  errors = {},
}) {
  if (!isAddingBooking) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-left animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
              <CalendarPlus size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Thêm đặt bàn mới
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Tạo lịch đặt bàn mới từ sơ đồ bàn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingBooking(false)}
            aria-label="Đóng"
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Cột trái: Form thông tin */}
          <div className="space-y-3">
            {/* Tên khách hàng */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <User size={13} className="text-slate-400" /> Tên khách hàng <span className="text-rose-500">*</span>
              </label>
              <input
                value={addForm.customerName}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, customerName: e.target.value }))
                }
                placeholder="VD: Nguyễn Văn An"
                className={`w-full h-9.5 px-3 rounded-xl border text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition ${
                  errors.customerName
                    ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                    : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                }`}
              />
              {errors.customerName && (
                <p className="text-[11px] text-rose-500 font-bold mt-1">
                  {errors.customerName}
                </p>
              )}
            </div>

            {/* SĐT + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
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
                  className={`w-full h-9.5 px-3 rounded-xl border text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition ${
                    errors.phone
                      ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                      : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Mail size={12} className="text-slate-400" /> Email
                </label>
                <input
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Không bắt buộc"
                  className="w-full h-9.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Ngày đặt + Giờ */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Calendar size={12} className="text-slate-400" /> Ngày đặt <span className="text-rose-500">*</span>
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
                  className={`w-full h-9.5 px-2.5 rounded-xl border text-xs font-semibold text-slate-800 outline-none transition ${
                    errors.date
                      ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                      : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  }`}
                />
                {errors.date && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1">
                    {errors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
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
                  className={`w-full h-9.5 px-2.5 rounded-xl border text-xs font-semibold text-slate-800 outline-none transition ${
                    errors.time
                      ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                      : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  }`}
                />
                {errors.time && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1">
                    {errors.time}
                  </p>
                )}
              </div>
            </div>

            {/* Số khách + Khu vực */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <UsersIcon size={12} className="text-slate-400" /> Số khách <span className="text-rose-500">*</span>
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
                  className={`w-full h-9.5 px-3 rounded-xl border text-xs font-semibold text-slate-800 outline-none transition ${
                    errors.guests
                      ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                      : "border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  }`}
                />
                {errors.guests && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1">
                    {errors.guests}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <MapPin size={12} className="text-slate-400" /> Khu vực <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addForm.selectedArea}
                  onChange={(e) => {
                    const areaId = String(e.target.value);
                    const area = areas.find((item) => String(item.id) === areaId);
                    setAddForm((prev) => ({
                      ...prev,
                      selectedArea: areaId,
                      selectedAreaTitle: area?.name || "",
                      selectedTable: "",
                    }));
                  }}
                  className={`w-full h-9.5 px-2.5 rounded-xl border text-xs font-semibold text-slate-800 outline-none transition ${
                    errors.selectedArea
                      ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
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
                  <p className="text-[11px] text-rose-500 font-bold mt-1">
                    {errors.selectedArea}
                  </p>
                )}
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <FileText size={12} className="text-slate-400" /> Ghi chú yêu cầu
              </label>
              <textarea
                value={addForm.note}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Ghi chú thêm..."
                className="w-full h-18 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Cột phải: Sơ đồ chọn bàn */}
          <div className="flex flex-col min-w-0 border border-slate-100 rounded-2xl p-3.5 bg-slate-50/40">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900">
                  Sơ đồ chọn bàn
                </span>
                <span className="text-[11px] text-slate-500 font-medium ml-2">
                  (Yêu cầu: <strong className="text-slate-800">{addForm.guests || 1} khách</strong>)
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-[10px] font-bold shrink-0">
                <span className="flex items-center gap-1 text-emerald-700">
                  <i className="w-2 h-2 rounded-full bg-emerald-500" /> Trống
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <i className="w-2 h-2 rounded-full bg-amber-500" /> Đang giữ
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <i className="w-2 h-2 rounded-full bg-rose-500" /> Đã đặt
                </span>
              </div>
            </div>

            <div className="flex-1 max-h-[340px] overflow-y-auto custom-scrollbar p-1.5">
              {addForm.selectedArea ? (
                (() => {
                  const areaTables = tables.filter(
                    (table) => String(table.areaId) === String(addForm.selectedArea),
                  );

                  if (areaTables.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 font-medium text-xs">
                        Khu vực này hiện chưa có bàn nào
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
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
                              handleSelectTableForAddBooking(table, status);
                            }}
                            className={`p-2.5 rounded-xl border font-bold text-xs transition-all duration-150 flex flex-col items-center justify-center text-center ${
                              isSelected
                                ? TABLE_STATUS_STYLE.selected
                                : disabled
                                ? TABLE_STATUS_STYLE[status] || TABLE_STATUS_STYLE.available
                                : insufficientCapacity
                                ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400"
                                : TABLE_STATUS_STYLE[status] || TABLE_STATUS_STYLE.available
                            } ${disabled ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5 hover:shadow-md cursor-pointer"}`}
                          >
                            <div className="flex items-center justify-center gap-1.5 leading-none">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isSelected
                                    ? "bg-white ring-1 ring-white/50"
                                    : TABLE_DOT_STYLE[status]
                                }`}
                              />
                              <span className="font-black text-xs leading-none">
                                {table.code}
                              </span>
                            </div>

                            <span className="text-[10px] opacity-80 mt-1">
                              {status === "available"
                                ? `${table.capacity} chỗ`
                                : TABLE_STATUS[status] || status}
                            </span>

                            {isSelected && (
                              <span className="text-[9px] font-black uppercase tracking-wider mt-1 bg-white/25 px-1.5 py-0.2 rounded-md">
                                Đang chọn
                              </span>
                            )}

                            {insufficientCapacity && !disabled && !isSelected && (
                              <span className="text-[9px] font-black text-amber-700 mt-1">
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
                <div className="py-14 text-center text-slate-400 font-medium text-xs flex flex-col items-center justify-center gap-2">
                  <MapPin size={24} className="text-slate-300" />
                  <span>Vui lòng chọn <strong>Khu vực</strong> ở cột bên trái để tải sơ đồ bàn</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <div className="text-xs font-semibold text-slate-600 truncate">
            {addForm.selectedTable ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 font-bold">
                <Check size={13} /> Đã chọn bàn: <strong className="underline">{addForm.selectedTable}</strong>
              </span>
            ) : (
              <span className="text-slate-400">Chưa chọn bàn (Tùy chọn)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingBooking(false)}
              className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={saveAddBooking}
              className="h-9 px-5 rounded-xl bg-[#145c30] hover:bg-[#166534] text-white text-xs font-black shadow-sm transition"
            >
              Tạo đặt bàn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

