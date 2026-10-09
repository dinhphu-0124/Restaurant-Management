import React from "react";
import {
  X,
  TicketPercent,
  Gift,
  Tag,
  FileText,
  Sliders,
  DollarSign,
  Percent,
  Calendar,
  Layers,
  Image as ImageIcon,
  Save,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  InputField,
  SelectField,
  DealTypeSelectField,
  DiscountInputField,
  ServiceTypeCheckboxGroup,
  ServiceConditionItemsField,
  ImageUploadBox,
} from "./AdminDealsComponents";

export default function AdminDealEditModal({
  isOpen,
  editingDeal,
  form,
  setForm,
  formErrors = {},
  areas,
  handleImageChange,
  removeImage,
  onClose,
  onSave,
  title,
  subtitle,
}) {
  if (!isOpen) return null;

  const serviceTypeLabels = {
    dinein: "Ăn tại quán",
    delivery: "Giao tận nơi",
    pickup: "Đến lấy",
  };

  const selectedServicesCount = (form.serviceTypes || []).length;

  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 text-left"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="
          w-full max-w-5xl max-h-[92vh]
          bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100
          overflow-hidden flex flex-col transition-all animate-in fade-in zoom-in-95 duration-150
        "
      >
        {/* Modal Header */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
              <TicketPercent size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {title || (editingDeal ? "Chỉnh sửa khuyến mãi" : "Thêm khuyến mãi mới")}
                </h3>
                {editingDeal && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold tracking-wide uppercase">
                    Đang chỉnh sửa
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {subtitle || (editingDeal ? `Mã hiện tại: ${form.code || editingDeal.code}` : "Thiết lập thông tin khuyến mãi, thời hạn, điều kiện và hình ảnh truyền thông")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: 2 Balanced Columns */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
            
            {/* CỘT TRÁI (6 CỘT): THÔNG TIN CƠ BẢN, THỜI HẠN & MÔ TẢ */}
            <div className="lg:col-span-6 space-y-3.5">
              
              {/* CARD 1: THÔNG TIN CHƯƠNG TRÌNH */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                      <Tag size={13} />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Thông tin chương trình
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Bắt buộc (*)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <InputField
                    label="Mã khuyến mãi"
                    required
                    placeholder="VD: FAMILY20"
                    icon={<Tag size={13} />}
                    error={formErrors.code}
                    value={form.code}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        code: value.toUpperCase().replace(/\s+/g, ""),
                      }))
                    }
                  />

                  <InputField
                    label="Tên chương trình"
                    required
                    placeholder="VD: Combo gia đình"
                    icon={<Gift size={13} />}
                    error={formErrors.name}
                    value={form.name}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, name: value }))
                    }
                  />

                  <InputField
                    label="Phụ đề / Tiêu đề ngắn"
                    placeholder="VD: Ưu đãi đặc biệt cho gia đình"
                    icon={<FileText size={13} />}
                    error={formErrors.subtitle}
                    value={form.subtitle}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, subtitle: value }))
                    }
                  />

                  <DealTypeSelectField
                    label="Loại khuyến mãi"
                    required
                    icon={<Sliders size={13} />}
                    value={form.type}
                    error={formErrors.type}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, type: value }))
                    }
                  />

                  <DiscountInputField
                    label="Mức giảm giá"
                    required
                    icon={<Percent size={13} />}
                    value={form.discount}
                    error={formErrors.discount}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, discount: value }))
                    }
                  />

                  <InputField
                    label="Hóa đơn tối thiểu"
                    required
                    placeholder="VD: 500.000"
                    icon={<DollarSign size={13} />}
                    error={formErrors.condition}
                    value={
                      form.condition
                        ? Number(form.condition).toLocaleString("vi-VN")
                        : ""
                    }
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        condition: value.replace(/\D/g, ""),
                      }))
                    }
                  />
                </div>
              </div>

              {/* CARD 2: THỜI HẠN & TRẠNG THÁI HOẠT ĐỘNG */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                      <Clock size={13} />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Thời hạn & Thiết lập hiệu lực
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <InputField
                    label="Ngày bắt đầu"
                    required
                    type="date"
                    icon={<Calendar size={13} />}
                    error={formErrors.startDate}
                    value={form.startDate}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, startDate: value }))
                    }
                  />

                  <InputField
                    label="Ngày kết thúc"
                    required
                    type="date"
                    icon={<Calendar size={13} />}
                    error={formErrors.endDate}
                    value={form.endDate}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, endDate: value }))
                    }
                  />

                  <SelectField
                    label="Trạng thái áp dụng"
                    required
                    icon={<Sliders size={13} />}
                    error={formErrors.status}
                    value={form.status}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <option value="active">🟢 Đang áp dụng</option>
                    <option value="upcoming">🟡 Sắp diễn ra</option>
                    <option value="paused">🟠 Tạm dừng</option>
                    <option value="ended">⚪ Đã kết thúc</option>
                  </SelectField>

                  <InputField
                    label="Giới hạn lượt dùng"
                    type="number"
                    min="0"
                    placeholder="VD: 1000 (để trống = vô hạn)"
                    icon={<Percent size={13} />}
                    value={form.usageLimit}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        usageLimit: value === "" ? "" : Number(value),
                      }))
                    }
                  />
                </div>
              </div>

              {/* CARD 3: MÔ TẢ CHI TIẾT */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-2 text-left">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                      <FileText size={13} />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Mô tả chi tiết chương trình
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Tùy chọn
                  </span>
                </div>

                <textarea
                  value={form.desc || ""}
                  rows={2.5}
                  placeholder="Nhập chi tiết nội dung, quyền lợi và lưu ý của chương trình ưu đãi..."
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, desc: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none resize-none transition-all ${
                    formErrors.desc
                      ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
              </div>
            </div>

            {/* CỘT PHẢI (6 CỘT): HÌNH ẢNH TRUYỀN THÔNG & ĐIỀU KIỆN PHỤC VỤ */}
            <div className="lg:col-span-6 space-y-3.5">
              
              {/* CARD 1: HÌNH ẢNH TRUYỀN THÔNG (3 VỊ TRÍ) */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                      <ImageIcon size={13} />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Hình ảnh truyền thông
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    3 vị trí hiển thị
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* 1. Banner đầu trang (Ngang dài 2243x701) */}
                  <ImageUploadBox
                    title="1. Banner đầu trang"
                    size="2243×701px"
                    image={form.bannerImage}
                    fieldName="bannerImage"
                    aspectRatio="aspect-[2243/701]"
                    maxHeightClass="max-h-[95px]"
                    onChange={handleImageChange}
                    onRemove={removeImage}
                  />

                  {/* 2 & 3. Ảnh danh sách (dọc 1023x1537) & Ảnh chi tiết (ngang 1536x1024) */}
                  <div className="grid grid-cols-2 gap-2.5 items-start">
                    <ImageUploadBox
                      title="2. Danh sách (Dọc)"
                      size="1023×1537px"
                      image={form.cardImage}
                      fieldName="cardImage"
                      aspectRatio="aspect-[1023/1537]"
                      maxHeightClass="max-h-[140px]"
                      onChange={handleImageChange}
                      onRemove={removeImage}
                    />

                    <ImageUploadBox
                      title="3. Chi tiết (Ngang)"
                      size="1536×1024px"
                      image={form.detailImage}
                      fieldName="detailImage"
                      aspectRatio="aspect-[1536/1024]"
                      maxHeightClass="max-h-[140px]"
                      onChange={handleImageChange}
                      onRemove={removeImage}
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: HÌNH THỨC & ĐIỀU KIỆN ÁP DỤNG */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                      <Layers size={13} />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Hình thức & Điều kiện phục vụ
                    </h4>
                  </div>
                  {selectedServicesCount > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      Đã chọn {selectedServicesCount}/3 hình thức
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <ServiceTypeCheckboxGroup
                    error={formErrors.serviceTypes}
                    value={form.serviceTypes || []}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        serviceTypes: value,
                      }))
                    }
                  />

                  <ServiceConditionItemsField
                    error={formErrors.serviceConditionItems}
                    serviceTypes={form.serviceTypes || []}
                    value={
                      form.serviceConditionItems || {
                        dinein: [],
                        delivery: [],
                        pickup: [],
                      }
                    }
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        serviceConditionItems: value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer: Live Summary & Action Buttons */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
            {form.code ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Tag size={11} />
                Mã: {form.code}
              </span>
            ) : (
              <span className="text-slate-400 italic text-[11px]">Chưa nhập mã khuyến mãi</span>
            )}
            
            {form.type && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                {form.type}
              </span>
            )}

            {form.discount && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                Giảm: {form.discount}
              </span>
            )}

            {form.startDate && form.endDate && (
              <span className="text-[11px] text-slate-500 hidden md:inline">
                ({form.startDate} ➔ {form.endDate})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none h-9.5 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={onSave}
              className="flex-1 sm:flex-none h-9.5 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold shadow-xs shadow-emerald-800/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>{editingDeal ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi mới"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

