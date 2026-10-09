import React from "react";
import {
  CalendarDays,
  Clock,
  Truck,
  Store,
  Utensils,
  Phone,
  Mail,
  User,
  AlertCircle,
  Users,
  MapPin,
  Check,
} from "lucide-react";

export function ServiceCard({ active, icon, title, subtitle, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border-2 p-3 sm:p-4 text-center transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 ${
        active
          ? "border-emerald-600 bg-emerald-50/60 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div
        className={`mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-colors ${
          active ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-700"
        }`}
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6">
          {icon}
        </div>
      </div>

      <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-2.5 leading-snug">
        {title}
      </h3>

      <p className="font-semibold text-slate-500 text-[10px] sm:text-xs mt-0.5">
        {subtitle}
      </p>

      <p className="hidden md:block text-[11px] text-slate-500 mt-2 leading-relaxed text-center line-clamp-2">
        {text}
      </p>

      {active && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
          ✓
        </div>
      )}
    </button>
  );
}

export function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  error,
  helperText,
}) {
  return (
    <label className="block text-left w-full">
      {label && (
        <span className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
          {label}
        </span>
      )}
      <div
        className={`h-11 rounded-xl px-3 flex items-center gap-2 bg-slate-50 border transition focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15 ${
          error ? "border-rose-500 bg-rose-50/50" : "border-slate-200"
        }`}
      >
        <span className="text-slate-400 shrink-0">{icon}</span>
        <input
          name={name}
          type={type}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full outline-none focus:outline-none focus:ring-0 border-none bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400"
        />
      </div>
      {error && <p className="text-rose-600 text-[11px] mt-1 font-semibold">{error}</p>}
      {!error && helperText && (
        <p className="text-[11px] text-slate-400 mt-1 font-medium">{helperText}</p>
      )}
    </label>
  );
}

export function Input(props) {
  return <FormInput {...props} />;
}

export function Textarea({ label, value, name = "note", onChange, placeholder }) {
  return (
    <label className="block text-left w-full">
      {label && (
        <span className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
          {label}
        </span>
      )}
      <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15 transition">
        <textarea
          name={name}
          value={value || ""}
          onChange={onChange}
          maxLength={200}
          placeholder={placeholder || "Ghi chú thêm cho nhà hàng..."}
          className="w-full h-16 outline-none focus:outline-none focus:ring-0 border-none resize-none text-xs sm:text-sm font-medium text-slate-800 bg-transparent placeholder:text-slate-400"
        />
        <p className="text-right text-[10px] text-slate-400 font-medium">{(value || "").length}/200</p>
      </div>
    </label>
  );
}

/**
 * DineInBookingForm: Full 4-step booking form for "Ăn tại quán"
 */
export function DineInBookingForm({
  form,
  errors,
  handleChange,
  areas = [],
  selectedArea,
  setSelectedArea,
  currentTables = [],
  selectedTable,
  setSelectedTable,
  selectedTableInfo,
  selectedTableOverCapacity,
  getTableBookingAtSelectedDate,
  handleSelectTable,
  findBestAvailableTable,
  getFinalAreaImage,
  requiresDeposit,
  isVipArea,
  isTableServing,
  pinCode,
  setPinCode,
  qrTableCode,
}) {
  return (
    <div className="space-y-6">
      {/* Step 1: Customer Contact Info */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
            1
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            THÔNG TIN LIÊN HỆ
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormInput
            label="Họ và tên khách hàng"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ví dụ: Nguyễn Văn A"
            icon={<User className="w-4 h-4" />}
            error={errors.name}
          />
          <FormInput
            label="Số điện thoại"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Ví dụ: 0901234567"
            icon={<Phone className="w-4 h-4" />}
            error={errors.phone}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormInput
            label="Email (nhận xác nhận điện tử)"
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            placeholder="Ví dụ: nguyenvana@gmail.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email}
          />
          <Textarea
            label="Ghi chú đặc biệt"
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="Ghi chú thêm (VD: Chuẩn bị ghế trẻ em, trang trí sinh nhật...)"
          />
        </div>
      </div>

      {/* Step 2: Time & Date & Guests */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
            2
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            THỜI GIAN & SỐ LƯỢNG KHÁCH
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput
            label="Ngày dùng bữa"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            icon={<CalendarDays className="w-4 h-4" />}
            error={errors.date}
          />
          <FormInput
            label="Giờ đến"
            name="time"
            type="time"
            value={form.time}
            onChange={handleChange}
            icon={<Clock className="w-4 h-4" />}
            error={errors.time}
            helperText="Phục vụ: 08:00 - 22:00"
          />
          <FormInput
            label="Số lượng khách"
            name="guests"
            type="number"
            value={form.guests}
            onChange={handleChange}
            placeholder="Ví dụ: 4"
            icon={<Users className="w-4 h-4" />}
            error={errors.guests}
          />
        </div>
      </div>

      {/* Step 3: Area Selection */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              3
            </span>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              CHỌN KHÔNG GIAN HẸN
            </h2>
          </div>
          {errors.area && <p className="text-rose-600 text-xs font-bold">{errors.area}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {areas.map((area) => {
            const isSelected = String(selectedArea) === String(area.id);
            const isVip = String(area.title || area.name || "").toLowerCase().includes("vip");

            return (
              <div
                key={area.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  const areaId = String(area.id);
                  setSelectedArea(areaId);
                  if (findBestAvailableTable) {
                    const bestTable = findBestAvailableTable(areaId);
                    setSelectedTable(bestTable?.code || "");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    const areaId = String(area.id);
                    setSelectedArea(areaId);
                    if (findBestAvailableTable) {
                      const bestTable = findBestAvailableTable(areaId);
                      setSelectedTable(bestTable?.code || "");
                    }
                  }
                }}
                className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  isSelected
                    ? "border-emerald-600 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="h-28 overflow-hidden relative bg-slate-100">
                  <img
                    src={getFinalAreaImage ? getFinalAreaImage(area) : area.image}
                    alt={area.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  {isVip && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                      Cọc trước
                    </span>
                  )}
                </div>

                <div className="p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {area.title}
                    </h4>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {area.text || "Không gian thoáng mát"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 4: Table Map & Selection */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              4
            </span>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              SƠ ĐỒ CHỌN BÀN
            </h2>
          </div>
          {errors.table && <p className="text-rose-600 text-xs font-bold">{errors.table}</p>}
        </div>

        {qrTableCode && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 font-semibold text-xs leading-relaxed flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Bạn đang gọi món trực tiếp tại <strong>Bàn {qrTableCode}</strong>. Bàn này đã được tự động chọn.</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600"></span>
            <span>Trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-300"></span>
            <span>Giữ chỗ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span>Đã đặt</span>
          </div>
        </div>

        {/* Table Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
          {currentTables.map((table) => {
            const tableBooking = getTableBookingAtSelectedDate ? getTableBookingAtSelectedDate(table.code) : null;
            const holding = tableBooking?.status === "pending" || tableBooking?.status === "Chờ xác nhận";
            const booked = tableBooking?.status === "confirmed" || tableBooking?.status === "Đã xác nhận";
            const disabled = !!tableBooking || table.status === "serving" || table.status === "maintenance" || table.status === "disabled";
            const guestCount = Number(form.guests || 0);
            const insufficientCapacity = guestCount > 0 && Number(table.capacity || 0) < guestCount;
            const active = String(table.code) === String(selectedTable) && !disabled;

            return (
              <button
                type="button"
                key={table.id}
                disabled={disabled}
                onClick={() => handleSelectTable ? handleSelectTable(table) : setSelectedTable(table.code)}
                className={`relative h-13 rounded-xl border-2 font-bold transition-all text-xs flex flex-col items-center justify-center ${
                  active
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold"
                    : holding
                    ? "border-amber-300 bg-amber-50 text-amber-800 cursor-not-allowed"
                    : booked
                    ? "border-rose-200 bg-rose-50 text-rose-600 cursor-not-allowed"
                    : disabled
                    ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                    : insufficientCapacity
                    ? "border-amber-300 bg-amber-50/50 text-amber-800 hover:border-amber-500"
                    : "border-slate-200 bg-white text-slate-800 hover:border-emerald-500"
                }`}
              >
                {active && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] flex items-center justify-center">
                    ✓
                  </span>
                )}
                <span>{table.code}</span>
                <span className="text-[9px] opacity-75 font-normal">{table.capacity} chỗ</span>
              </button>
            );
          })}
        </div>

        {/* Selected Table Summary Pill */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <h4 className="font-bold text-slate-900">
              Bàn đã chọn: <span className="text-emerald-700">{selectedTable || "Chưa chọn"}</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sức chứa: {selectedTableInfo ? `${selectedTableInfo.capacity} khách` : "Chưa rõ"}
            </p>
          </div>
          {selectedTableOverCapacity && (
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
              ⚠ Thiếu chỗ
            </span>
          )}
        </div>

        {/* Deposit Notice if required */}
        {requiresDeposit && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
              <span>⚠️</span> Chính sách đặt cọc giữ bàn
            </h4>
            <p className="text-amber-900 leading-relaxed font-medium">
              Yêu cầu đặt cọc trước <strong className="text-emerald-700">200.000đ</strong> đối với <strong>{isVipArea ? "phòng VIP" : "tiệc lớn (≥ 15 người)"}</strong>. Số tiền cọc sẽ được tự động khấu trừ vào hóa đơn khi dùng bữa.
            </p>
          </div>
        )}

        {/* Serving PIN code input if table is currently active */}
        {isTableServing && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0"></span>
              Nhập mã PIN của bàn để gọi thêm món:
            </h4>
            <p className="text-[11px] text-slate-500">
              Bàn này đang có khách phục vụ. Vui lòng nhập mã PIN (in trên phiếu tạm tính hoặc hỏi nhân viên) để liên kết món vào bàn.
            </p>
            <div className="max-w-[180px]">
              <input
                type="text"
                maxLength={4}
                value={pinCode || ""}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                placeholder="PIN 4 số"
                className="w-full text-center tracking-widest text-base font-extrabold bg-white border border-slate-200 rounded-xl py-2 px-3 outline-none focus:border-amber-600 transition"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const DineInForm = DineInBookingForm;

/**
 * DeliveryForm: Form for "Giao tận nơi"
 */
export function DeliveryForm({
  errors = {},
  deliveryTimeType = "now",
  setDeliveryTimeType,
  checkoutForm = {},
  handleChange,
}) {
  return (
    <div className="space-y-6">
      {/* Step 1: Customer Contact Info */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
            1
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            THÔNG TIN NGƯỜI NHẬN
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormInput
            label="Họ và tên người nhận hàng"
            name="name"
            value={checkoutForm.name}
            onChange={handleChange}
            placeholder="Ví dụ: Nguyễn Văn A"
            icon={<User className="w-4 h-4" />}
            error={errors.name}
          />
          <FormInput
            label="Số điện thoại giao hàng"
            name="phone"
            value={checkoutForm.phone}
            onChange={handleChange}
            placeholder="Ví dụ: 0901234567"
            icon={<Phone className="w-4 h-4" />}
            error={errors.phone}
          />
        </div>

        <FormInput
          label="Email (nhận hóa đơn điện tử)"
          name="email"
          value={checkoutForm.email}
          onChange={handleChange}
          placeholder="Ví dụ: nguyenvana@gmail.com (không bắt buộc)"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email}
        />
      </div>

      {/* Step 2: Delivery Address */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
            2
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            ĐỊA CHỈ GIAO HÀNG CHI TIẾT
          </h2>
        </div>

        <FormInput
          label="Địa chỉ nhận món (Số nhà, tên đường, phường/xã, quận/huyện)"
          name="address"
          value={checkoutForm.address}
          onChange={handleChange}
          placeholder="Ví dụ: Số 123 đường Lê Lợi, Phường 1, TP. Hà Tĩnh"
          icon={<MapPin className="w-4 h-4" />}
          error={errors.address}
        />
      </div>

      {/* Step 3: Delivery Mode & Time */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
            3
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            HÌNH THỨC & THỜI GIAN GIAO HÀNG
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => setDeliveryTimeType("now")}
            className={`rounded-2xl p-3.5 border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
              deliveryTimeType === "now"
                ? "bg-emerald-50/70 border-emerald-600 text-emerald-800 shadow-sm"
                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${deliveryTimeType === "now" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-xs sm:text-sm">Giao ngay</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Nhanh nhất có thể (30-45 phút)</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryTimeType("schedule")}
            className={`rounded-2xl p-3.5 border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
              deliveryTimeType === "schedule"
                ? "bg-emerald-50/70 border-emerald-600 text-emerald-800 shadow-sm"
                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${deliveryTimeType === "schedule" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-xs sm:text-sm">Hẹn giờ giao</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Chọn giờ giao cụ thể</p>
            </div>
          </button>
        </div>

        {deliveryTimeType === "schedule" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
            <FormInput
              label="Ngày nhận món"
              name="date"
              type="date"
              icon={<CalendarDays className="w-4 h-4" />}
              error={errors.date}
              value={checkoutForm.date}
              onChange={handleChange}
            />
            <FormInput
              label="Giờ nhận món"
              name="time"
              type="time"
              icon={<Clock className="w-4 h-4" />}
              error={errors.time}
              helperText="Khung giờ phục vụ: 08:00 - 22:00"
              value={checkoutForm.time}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {/* Step 4: Notes */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
            4
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            GHI CHÚ GIAO HÀNG
          </h2>
        </div>

        <Textarea
          name="note"
          value={checkoutForm.note}
          onChange={handleChange}
          placeholder="Ghi chú thêm cho nhân viên giao hàng (VD: Để trước cửa, gọi trước khi đến...)"
        />
      </div>
    </div>
  );
}

/**
 * PickupForm: Form for "Đến lấy mang về"
 */
export function PickupForm({
  errors = {},
  checkoutForm = {},
  handleChange,
}) {
  return (
    <div className="space-y-6">
      {/* Step 1: Customer Contact Info */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
            1
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            THÔNG TIN NGƯỜI ĐẾN LẤY
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormInput
            label="Họ và tên người nhận món"
            name="name"
            placeholder="Ví dụ: Nguyễn Văn A"
            icon={<User className="w-4 h-4" />}
            error={errors.name}
            value={checkoutForm.name}
            onChange={handleChange}
          />
          <FormInput
            label="Số điện thoại nhận thông báo"
            name="phone"
            placeholder="Ví dụ: 0901234567"
            icon={<Phone className="w-4 h-4" />}
            error={errors.phone}
            value={checkoutForm.phone}
            onChange={handleChange}
          />
        </div>

        <FormInput
          label="Email (nhận hóa đơn điện tử)"
          name="email"
          placeholder="Ví dụ: nguyenvana@gmail.com (không bắt buộc)"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email}
          value={checkoutForm.email}
          onChange={handleChange}
        />
      </div>

      {/* Step 2: Pickup Date & Time */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
            2
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            THỜI GIAN DỰ KIẾN ĐẾN LẤY
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Ngày đến lấy"
            name="date"
            type="date"
            icon={<CalendarDays className="w-4 h-4" />}
            error={errors.date}
            value={checkoutForm.date}
            onChange={handleChange}
          />
          <FormInput
            label="Giờ đến lấy"
            name="time"
            type="time"
            icon={<Clock className="w-4 h-4" />}
            error={errors.time}
            helperText="Nhà hàng phục vụ chuẩn bị: 08:00 - 22:00"
            value={checkoutForm.time}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Step 3: Preparation Notes */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
            3
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            GHI CHÚ CHUẨN BỊ MÓN
          </h2>
        </div>

        <Textarea
          name="note"
          value={checkoutForm.note}
          onChange={handleChange}
          placeholder="Ghi chú thêm (VD: Đóng hộp riêng nước chấm, chuẩn bị thêm rau sống...)"
        />
      </div>
    </div>
  );
}
