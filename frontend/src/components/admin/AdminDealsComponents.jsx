import React, { useState, useEffect, useRef } from "react";
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Utensils,
  Truck,
  Store,
  Check,
  Sparkles,
  FileText,
  Tag,
  DollarSign,
  Percent,
  Sliders,
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
  Pencil,
  Info,
  HelpCircle,
  Eye,
} from "lucide-react";
import {
  getStoredDealTypes,
  saveStoredDealTypes,
  DEFAULT_DEAL_TYPES,
} from "../../utils/dealsHelpers";

export function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
      <p className="text-emerald-800 font-extrabold text-sm">{value}</p>
      <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
    </div>
  );
}

export function ServiceConditionItemsField({
  serviceTypes = [],
  value = {},
  onChange,
  error = false,
}) {
  const [activeGroupTab, setActiveGroupTab] = useState(
    serviceTypes[0] || "dinein"
  );
  const [newConditionText, setNewConditionText] = useState("");
  const [customOptions, setCustomOptions] = useState({
    dinein: [],
    delivery: [],
    pickup: [],
  });

  useEffect(() => {
    if (serviceTypes.length > 0 && !serviceTypes.includes(activeGroupTab)) {
      setActiveGroupTab(serviceTypes[0]);
    }
  }, [serviceTypes, activeGroupTab]);

  const groups = [
    {
      key: "dinein",
      title: "Ăn tại quán",
      icon: <Utensils size={13} />,
      options: [
        "Áp dụng khi dùng bữa tại nhà hàng",
        "Áp dụng khi đặt bàn trước",
        "Áp dụng cho nhóm từ 4 khách trở lên",
        "Xuất trình mã khuyến mãi khi thanh toán",
        "Không áp dụng vào ngày lễ, Tết",
        "Không áp dụng kèm các ưu đãi khác",
      ],
      suggestions: [
        "Áp dụng từ thứ 2 đến thứ 6",
        "Tối đa 1 mã ưu đãi/bàn",
        "Áp dụng khung giờ trưa (11h00 - 14h00)",
        "Dành riêng cho thành viên VIP",
        "Áp dụng cho hóa đơn từ 500.000đ",
      ],
    },
    {
      key: "delivery",
      title: "Giao tận nơi",
      icon: <Truck size={13} />,
      options: [
        "Áp dụng khi đặt món qua website",
        "Áp dụng cho đơn giao trong khu vực hỗ trợ",
        "Không áp dụng phí vận chuyển",
        "Khách hàng cung cấp đúng số điện thoại và địa chỉ",
        "Đơn hàng cần được xác nhận trước khi giao",
        "Không áp dụng kèm các ưu đãi khác",
      ],
      suggestions: [
        "Miễn phí ship tối đa 30.000đ",
        "Bán kính giao hàng tối đa 5km",
        "Thời gian giao hàng từ 30 - 45 phút",
        "Áp dụng cho đơn từ 200.000đ",
        "Chỉ áp dụng khi thanh toán online",
      ],
    },
    {
      key: "pickup",
      title: "Đến lấy tại quán",
      icon: <Store size={13} />,
      options: [
        "Áp dụng khi khách tự đến nhận món tại nhà hàng",
        "Áp dụng khi đặt món trước qua website",
        "Khách cần nhận món trong thời gian đã hẹn",
        "Không áp dụng phí giao hàng",
        "Xuất trình mã khuyến mãi khi nhận món",
        "Không áp dụng kèm các ưu đãi khác",
      ],
      suggestions: [
        "Nhận món sau 20 phút đặt thành công",
        "Hỗ trợ giữ nóng món ăn tối đa 30 phút",
        "Áp dụng từ 10h00 đến 21h00 hàng ngày",
        "Giảm thêm 5% khi mang theo hộp cá nhân",
      ],
    },
  ];

  const activeGroup = groups.find((g) => g.key === activeGroupTab) || groups[0];
  const enabled = serviceTypes.includes(activeGroup.key);
  const selectedItems = value[activeGroup.key] || [];

  // Combine default options + custom options + already saved options in value
  const allCurrentOptions = Array.from(
    new Set([
      ...activeGroup.options,
      ...(customOptions[activeGroup.key] || []),
      ...(value[activeGroup.key] || []),
    ])
  );

  const toggle = (groupKey, text) => {
    const current = value[groupKey] || [];
    const nextGroup = current.includes(text)
      ? current.filter((item) => item !== text)
      : [...current, text];

    onChange({
      ...value,
      [groupKey]: nextGroup,
    });
  };

  const selectAll = (groupKey, optionsList) => {
    const current = value[groupKey] || [];
    const isAll = optionsList.every((opt) => current.includes(opt));
    onChange({
      ...value,
      [groupKey]: isAll ? [] : [...optionsList],
    });
  };

  const handleAddCustomCondition = () => {
    const trimmed = newConditionText.trim();
    if (!trimmed) return;

    if (!allCurrentOptions.includes(trimmed)) {
      setCustomOptions((prev) => ({
        ...prev,
        [activeGroup.key]: [...(prev[activeGroup.key] || []), trimmed],
      }));
    }

    // Auto check the newly added condition
    if (!selectedItems.includes(trimmed)) {
      onChange({
        ...value,
        [activeGroup.key]: [...selectedItems, trimmed],
      });
    }

    setNewConditionText("");
  };

  const handleAddSuggestedCondition = (sugText) => {
    if (!allCurrentOptions.includes(sugText)) {
      setCustomOptions((prev) => ({
        ...prev,
        [activeGroup.key]: [...(prev[activeGroup.key] || []), sugText],
      }));
    }

    if (!selectedItems.includes(sugText)) {
      onChange({
        ...value,
        [activeGroup.key]: [...selectedItems, sugText],
      });
    }
  };

  const handleRemoveCustomOption = (e, optToRemove) => {
    e.preventDefault();
    e.stopPropagation();

    setCustomOptions((prev) => ({
      ...prev,
      [activeGroup.key]: (prev[activeGroup.key] || []).filter(
        (o) => o !== optToRemove
      ),
    }));

    if (selectedItems.includes(optToRemove)) {
      onChange({
        ...value,
        [activeGroup.key]: selectedItems.filter((o) => o !== optToRemove),
      });
    }
  };

  // Filter out suggestions that are already present in allCurrentOptions
  const availableSuggestions = (activeGroup.suggestions || []).filter(
    (sug) => !allCurrentOptions.includes(sug)
  );

  return (
    <div className="md:col-span-2 space-y-2 text-left">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <FileText size={14} className="text-emerald-700" />
          <span>Điều kiện theo hình thức phục vụ</span>
        </label>

        {enabled && (
          <button
            type="button"
            onClick={() => selectAll(activeGroup.key, allCurrentOptions)}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition"
          >
            {allCurrentOptions.length > 0 &&
            allCurrentOptions.every((opt) => selectedItems.includes(opt))
              ? "Bỏ chọn tất cả"
              : "Chọn tất cả"}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-3.5 space-y-3.5">
        {/* Tabs for service types */}
        <div className="flex items-center gap-1.5 border-b border-slate-200/70 pb-2.5 overflow-x-auto">
          {groups.map((group) => {
            const isServiceActive = serviceTypes.includes(group.key);
            const count = (value[group.key] || []).length;
            const isTabSelected = activeGroupTab === group.key;

            return (
              <button
                key={group.key}
                type="button"
                onClick={() => setActiveGroupTab(group.key)}
                disabled={!isServiceActive}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  !isServiceActive
                    ? "opacity-40 cursor-not-allowed text-slate-400"
                    : isTabSelected
                    ? "bg-white text-emerald-800 shadow-xs border border-emerald-200 ring-1 ring-emerald-600/10"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {group.icon}
                <span>{group.title}</span>
                {count > 0 && isServiceActive && (
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Options grid with full tooltip and flexible wrap */}
        {enabled ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[145px] overflow-y-auto pr-1">
              {allCurrentOptions.map((item) => {
                const isItemChecked = selectedItems.includes(item);
                const isDefault = activeGroup.options.includes(item);

                return (
                  <label
                    key={item}
                    title={item}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border flex items-start gap-2.5 cursor-pointer text-xs font-semibold transition-all group ${
                      isItemChecked
                        ? "border-emerald-400 bg-emerald-50/80 text-emerald-950 shadow-2xs"
                        : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isItemChecked}
                      onChange={() => toggle(activeGroup.key, item)}
                      className="w-4 h-4 accent-emerald-700 mt-0.5 shrink-0 rounded"
                    />

                    <span
                      title={item}
                      className="flex-1 leading-snug break-words select-none"
                    >
                      {item}
                    </span>

                    {!isDefault && (
                      <button
                        type="button"
                        title="Xóa điều kiện tùy chỉnh này"
                        onClick={(e) => handleRemoveCustomOption(e, item)}
                        className="opacity-40 hover:opacity-100 text-rose-500 hover:bg-rose-50 p-1 rounded-md transition shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Input thêm điều kiện mới + Danh sách gợi ý */}
            <div className="pt-2.5 border-t border-slate-200/70 space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Nhập điều kiện mới cho ${activeGroup.title.toLowerCase()}...`}
                  value={newConditionText}
                  onChange={(e) => setNewConditionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomCondition();
                    }
                  }}
                  className="flex-1 h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-slate-800"
                />

                <button
                  type="button"
                  onClick={handleAddCustomCondition}
                  disabled={!newConditionText.trim()}
                  className="h-9 px-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-xs shadow-emerald-800/20"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Thêm điều kiện</span>
                </button>
              </div>

              {/* Suggestions Chips */}
              {availableSuggestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Gợi ý điều kiện áp dụng phổ biến (nhấp để thêm):</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {availableSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        title={`Thêm điều kiện: "${sug}"`}
                        onClick={() => handleAddSuggestedCondition(sug)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/70 hover:text-emerald-900 text-[11px] font-semibold transition-all flex items-center gap-1 shadow-2xs group cursor-pointer"
                      >
                        <Plus
                          size={11}
                          className="text-slate-400 group-hover:text-emerald-700"
                        />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-5 text-center text-xs text-slate-400 font-medium">
            Hình thức "{activeGroup.title}" chưa được kích hoạt ở trên.
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] font-bold text-rose-500 mt-0.5">
          Vui lòng chọn ít nhất 1 điều kiện theo hình thức phục vụ
        </p>
      )}
    </div>
  );
}

export function ServiceTypeCheckboxGroup({
  value = [],
  onChange,
  error = false,
}) {
  const options = [
    { key: "dinein", label: "Ăn tại quán", icon: <Utensils size={15} /> },
    { key: "delivery", label: "Giao tận nơi", icon: <Truck size={15} /> },
    { key: "pickup", label: "Đến lấy tại quán", icon: <Store size={15} /> },
  ];

  const toggle = (key) => {
    if (value.includes(key)) {
      onChange(value.filter((item) => item !== key));
    } else {
      onChange([...value, key]);
    }
  };

  return (
    <div className="md:col-span-2 space-y-1.5 text-left">
      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <Sparkles size={14} className="text-emerald-700" />
        <span>Áp dụng hình thức phục vụ</span>
        <span className="text-rose-500 font-bold">*</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {options.map((option) => {
          const isChecked = value.includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => toggle(option.key)}
              className={`h-10 px-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all duration-200 ${
                isChecked
                  ? "border-emerald-600 bg-emerald-50/80 text-emerald-800 shadow-xs ring-1 ring-emerald-600/20"
                  : "border-slate-200 bg-slate-50/50 hover:bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={isChecked ? "text-emerald-700" : "text-slate-400"}
                >
                  {option.icon}
                </span>
                {option.label}
              </span>

              <div
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                  isChecked
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {isChecked && <Check size={11} strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-[11px] font-bold text-rose-500 mt-0.5">
          Vui lòng chọn ít nhất 1 hình thức phục vụ
        </p>
      )}
    </div>
  );
}

export function DiscountInputField({
  label = "Mức giảm giá",
  value = "",
  onChange,
  required = false,
  error = false,
  icon = <Percent size={13} />,
}) {
  const parseValue = (val) => {
    const str = String(val || "").trim();
    if (!str) return { num: "", unit: "%" };
    const isVnd =
      str.includes("đ") || str.includes("d") || str.toLowerCase().includes("vnd");
    const digits = str.replace(/[^\d]/g, "");
    return {
      num: digits,
      unit: isVnd ? "đ" : "%",
    };
  };

  const [unit, setUnit] = useState(() => parseValue(value).unit);
  const [numericValue, setNumericValue] = useState(() => parseValue(value).num);

  useEffect(() => {
    const parsed = parseValue(value);
    if (value) {
      setUnit(parsed.unit);
      setNumericValue(parsed.num);
    } else {
      setNumericValue("");
    }
  }, [value]);

  const emitChange = (newNum, newUnit) => {
    if (!newNum) {
      onChange("");
      return;
    }
    if (newUnit === "%") {
      const clamped = Math.min(Number(newNum) || 0, 100);
      onChange(`${clamped}%`);
    } else {
      onChange(`${Number(newNum).toLocaleString("vi-VN")}đ`);
    }
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    let clean = raw;
    if (unit === "%" && raw) {
      const num = Number(raw);
      if (num > 100) clean = "100";
    }
    setNumericValue(clean);
    emitChange(clean, unit);
  };

  const handleUnitToggle = (selectedUnit) => {
    if (selectedUnit === unit) return;
    setUnit(selectedUnit);
    let newNum = numericValue;
    if (selectedUnit === "%" && numericValue) {
      if (Number(numericValue) > 100) {
        newNum = "10";
        setNumericValue("10");
      }
    }
    emitChange(newNum, selectedUnit);
  };

  const displayFormattedNumber = () => {
    if (!numericValue) return "";
    if (unit === "đ") {
      return Number(numericValue).toLocaleString("vi-VN");
    }
    return numericValue;
  };

  return (
    <div className="text-left space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          {icon && <span className="text-emerald-700">{icon}</span>}
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        <span className="text-[11px] font-semibold text-slate-400">
          {unit === "%" ? "Theo phần trăm" : "Trừ tiền mặt"}
        </span>
      </div>

      <div
        className={`w-full h-9.5 px-3 rounded-xl border flex items-center gap-2 transition-all duration-200 ${
          error
            ? "border-rose-400 bg-rose-50/50 text-rose-900 focus-within:ring-2 focus-within:ring-rose-500/20"
            : "border-slate-200 bg-slate-50/60 hover:bg-white focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/10 text-slate-800"
        }`}
      >
        <input
          type="text"
          inputMode="numeric"
          value={displayFormattedNumber()}
          placeholder={unit === "%" ? "VD: 20 (tối đa 100)" : "VD: 100.000"}
          onChange={handleNumberChange}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />

        {/* Unit Selector Toggle */}
        <div className="flex items-center p-0.5 bg-slate-200/70 rounded-lg border border-slate-200 shrink-0">
          <button
            type="button"
            title="Giảm giá theo phần trăm (%)"
            onClick={() => handleUnitToggle("%")}
            className={`px-2.5 py-0.5 text-xs font-black rounded-md transition-all cursor-pointer ${
              unit === "%"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/50"
            }`}
          >
            %
          </button>
          <button
            type="button"
            title="Giảm giá theo số tiền (đ)"
            onClick={() => handleUnitToggle("đ")}
            className={`px-2.5 py-0.5 text-xs font-black rounded-md transition-all cursor-pointer ${
              unit === "đ"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/50"
            }`}
          >
            đ
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-bold text-rose-500 mt-0.5">
          {typeof error === "string"
            ? error
            : "Vui lòng nhập mức giảm giá hợp lệ"}
        </p>
      )}
    </div>
  );
}

export function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  error = false,
  icon = null,
  min,
  max,
}) {
  return (
    <div className="text-left space-y-1.5">
      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        {icon && <span className="text-emerald-700">{icon}</span>}
        <span>{label}</span>
        {required && <span className="text-rose-500 font-bold">*</span>}
      </label>

      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-9.5 px-3.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none ${
          error
            ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
            : "border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-slate-800 placeholder:text-slate-400"
        }`}
      />

      {error && (
        <p className="text-[11px] font-bold text-rose-500 mt-0.5">
          {typeof error === "string" ? error : "Trường này là bắt buộc"}
        </p>
      )}
    </div>
  );
}

export function DealTypeSelectField({
  label = "Loại khuyến mãi",
  value = "Combo",
  onChange,
  required = false,
  error = false,
  icon = <Sliders size={13} />,
}) {
  const [dealTypes, setDealTypes] = useState(getStoredDealTypes);
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete'
  const [formType, setFormType] = useState({ name: "", description: "", oldName: "" });
  const [formTypeError, setFormTypeError] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => {
      setDealTypes(getStoredDealTypes());
    };
    window.addEventListener("deal_types_updated", handleUpdate);
    return () => window.removeEventListener("deal_types_updated", handleUpdate);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentTypeObj = dealTypes.find((t) => t.name === value) || {
    name: value,
    description: "Chưa có mô tả trường hợp áp dụng cụ thể.",
  };

  const handleOpenAdd = () => {
    setFormType({ name: "", description: "", oldName: "" });
    setFormTypeError("");
    setModalMode("add");
    setIsOpen(false);
  };

  const handleOpenEdit = (e, dt) => {
    e.stopPropagation();
    setFormType({ name: dt.name, description: dt.description || "", oldName: dt.name });
    setFormTypeError("");
    setModalMode("edit");
    setIsOpen(false);
  };

  const handleOpenDelete = (e, dt) => {
    e.stopPropagation();
    setFormType({ name: dt.name, description: dt.description || "", oldName: dt.name });
    setModalMode("delete");
    setIsOpen(false);
  };

  const handleSaveType = (e) => {
    e.preventDefault();
    const trimmedName = formType.name.trim();
    const trimmedDesc = formType.description.trim();

    if (!trimmedName) {
      setFormTypeError("Vui lòng nhập tên loại khuyến mãi");
      return;
    }

    if (modalMode === "add") {
      if (dealTypes.some((t) => t.name.toLowerCase() === trimmedName.toLowerCase())) {
        setFormTypeError("Tên loại khuyến mãi này đã tồn tại");
        return;
      }
      const updated = [...dealTypes, { name: trimmedName, description: trimmedDesc }];
      setDealTypes(updated);
      saveStoredDealTypes(updated);
      onChange(trimmedName);
    } else if (modalMode === "edit") {
      const isDuplicate = dealTypes.some(
        (t) =>
          t.name.toLowerCase() === trimmedName.toLowerCase() &&
          t.name.toLowerCase() !== formType.oldName.toLowerCase()
      );
      if (isDuplicate) {
        setFormTypeError("Tên loại khuyến mãi này đã trùng với loại khác");
        return;
      }
      const updated = dealTypes.map((t) =>
        t.name === formType.oldName
          ? { name: trimmedName, description: trimmedDesc }
          : t
      );
      setDealTypes(updated);
      saveStoredDealTypes(updated);
      if (value === formType.oldName) {
        onChange(trimmedName);
      }
    }

    setModalMode(null);
  };

  const handleConfirmDelete = () => {
    const updated = dealTypes.filter((t) => t.name !== formType.name);
    setDealTypes(updated);
    saveStoredDealTypes(updated);
    if (value === formType.name) {
      onChange(updated[0]?.name || "Combo");
    }
    setModalMode(null);
  };

  return (
    <div className="text-left space-y-1.5 relative" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          {icon && <span className="text-emerald-700">{icon}</span>}
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition cursor-pointer flex items-center gap-1"
        >
          <Plus size={12} />
          <span>Thêm loại mới</span>
        </button>
      </div>

      {/* Trigger button - displays full type name clearly */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={
          currentTypeObj.description
            ? `${value}: ${currentTypeObj.description}`
            : value
        }
        className={`w-full h-9.5 px-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-bold transition-all duration-200 outline-none cursor-pointer ${
          error
            ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
            : isOpen
            ? "border-emerald-600 bg-white ring-2 ring-emerald-600/10 text-emerald-950 shadow-xs"
            : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 text-slate-800"
        }`}
      >
        <span className="font-extrabold text-emerald-950 text-xs sm:text-sm break-words select-none">
          {value}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-emerald-700" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown Menu with full details and actions */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[100] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[340px] animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 pb-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              <span>Di chuột để xem chi tiết áp dụng</span>
            </span>
            <span>{dealTypes.length} loại</span>
          </div>

          <div className="overflow-y-auto p-1.5 space-y-1 flex-1">
            {dealTypes.map((dt) => {
              const isSelected = value === dt.name;
              return (
                <div
                  key={dt.name}
                  title={`${dt.name}: ${dt.description || "Chưa có mô tả"}`}
                  onClick={() => {
                    onChange(dt.name);
                    setIsOpen(false);
                  }}
                  className={`group px-3 py-2 rounded-xl flex items-start justify-between gap-2 cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-emerald-50/90 text-emerald-950 border-emerald-300/80 shadow-2xs"
                      : "hover:bg-slate-50 border-transparent hover:border-slate-100"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-black ${
                          isSelected ? "text-emerald-900" : "text-slate-800"
                        }`}
                      >
                        {dt.name}
                      </span>
                      {isSelected && (
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[9px]">
                          <Check size={9} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug line-clamp-2">
                      {dt.description || "Chưa có hướng dẫn áp dụng."}
                    </p>
                  </div>

                  {/* Actions (Sửa / Xóa) */}
                  <div
                    className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title={`Chỉnh sửa loại "${dt.name}"`}
                      onClick={(e) => handleOpenEdit(e, dt)}
                      className="w-6.5 h-6.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/70 flex items-center justify-center transition cursor-pointer"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      title={`Xóa loại "${dt.name}"`}
                      onClick={(e) => handleOpenDelete(e, dt)}
                      className="w-6.5 h-6.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100/70 flex items-center justify-center transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="w-full h-8.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-dashed border-slate-200 hover:border-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Thêm loại khuyến mãi mới</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] font-bold text-rose-500 mt-0.5">
          {typeof error === "string" ? error : "Trường này là bắt buộc"}
        </p>
      )}

      {/* MODAL THÊM / SỬA LOẠI KHUYẾN MÃI */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div
          onMouseDown={() => setModalMode(null)}
          className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 text-left"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {modalMode === "add"
                      ? "Thêm loại khuyến mãi mới"
                      : "Chỉnh sửa loại khuyến mãi"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Nhập tên và mô tả chi tiết trường hợp áp dụng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Tên loại khuyến mãi</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="VD: Khai trương, Cuối tuần, Tri ân..."
                  value={formType.name}
                  onChange={(e) => {
                    setFormType((p) => ({ ...p, name: e.target.value }));
                    if (formTypeError) setFormTypeError("");
                  }}
                  className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-xs sm:text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Mô tả chi tiết trường hợp áp dụng</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    (Hiện khi di chuột vào)
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Áp dụng cho khách hàng dùng bữa vào các ngày thứ 7 và chủ nhật hàng tuần..."
                  value={formType.description}
                  onChange={(e) =>
                    setFormType((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-xs sm:text-sm font-semibold text-slate-800 outline-none resize-none placeholder:text-slate-400"
                />
              </div>

              {formTypeError && (
                <p className="text-xs font-bold text-rose-500">
                  {formTypeError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={13} strokeWidth={2.5} />
                  <span>{modalMode === "add" ? "Thêm mới" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {modalMode === "delete" && (
        <div
          onMouseDown={() => setModalMode(null)}
          className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 text-left"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Xác nhận xóa loại khuyến mãi?
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Bạn có chắc muốn xóa loại khuyến mãi "
                <span className="font-bold text-slate-800">{formType.name}</span>
                "?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  required = false,
  error = false,
  icon = null,
}) {
  return (
    <div className="text-left space-y-1.5">
      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        {icon && <span className="text-emerald-700">{icon}</span>}
        <span>{label}</span>
        {required && <span className="text-rose-500 font-bold">*</span>}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-9.5 px-3.5 pr-8 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none appearance-none cursor-pointer ${
            error
              ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
              : "border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-slate-800"
          }`}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
          ▼
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-bold text-rose-500 mt-0.5">
          {typeof error === "string" ? error : "Trường này là bắt buộc"}
        </p>
      )}
    </div>
  );
}

export function ImageUploadBox({
  title,
  size,
  image,
  fieldName,
  aspectRatio = "aspect-video",
  maxHeightClass = "max-h-[120px]",
  onChange,
  onRemove,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <div className="text-left rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs space-y-2 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-1.5">
        <h4
          className="text-[11px] sm:text-xs font-bold text-slate-800 truncate"
          title={title}
        >
          {title}
        </h4>
        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-bold shrink-0 border border-emerald-100">
          {size}
        </span>
      </div>

      {image ? (
        <div
          className={`relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group w-full ${aspectRatio} ${maxHeightClass} flex items-center justify-center cursor-pointer`}
          onClick={() => setIsPreviewOpen(true)}
          title="Nhấn để xem nhanh ảnh kích thước lớn"
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Hover Overlay with Action Buttons */}
          <div
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title="Xem nhanh ảnh"
              onClick={() => setIsPreviewOpen(true)}
              className="h-7 px-2 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-sm transition"
            >
              <Eye size={12} />
              <span className="hidden sm:inline">Xem</span>
            </button>

            <label
              title="Đổi ảnh khác"
              className="h-7 px-2 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-sm transition"
            >
              <UploadCloud size={12} />
              <span className="hidden sm:inline">Đổi</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) => onChange(event, fieldName)}
                className="hidden"
              />
            </label>

            <button
              type="button"
              title="Xóa ảnh này"
              onClick={() => onRemove(fieldName)}
              className="h-7 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 flex flex-col items-center justify-center text-center cursor-pointer transition-all group w-full ${aspectRatio} ${maxHeightClass} p-2`}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={(event) => onChange(event, fieldName)}
            className="hidden"
          />
          <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-emerald-700 transition-colors">
            <UploadCloud size={16} />
            <span className="text-[11px] font-bold">Tải ảnh lên</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
            Kéo thả hoặc click chọn
          </span>
        </label>
      )}

      {/* Quick View Lightbox Modal */}
      {isPreviewOpen && image && (
        <div
          onMouseDown={() => setIsPreviewOpen(false)}
          className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] bg-slate-900/95 rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex flex-col"
          >
            <div className="px-4 py-3 bg-black/40 border-b border-white/10 flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{title}</span>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-emerald-300">
                  {size}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 overflow-auto flex items-center justify-center max-h-[calc(90vh-60px)]">
              <img
                src={image}
                alt={title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DealStatCard({ icon, title, value, bg, color, note = "so với tuần trước" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-start gap-2.5 hover:bg-green-50/40 hover:border-green-100 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-left min-w-0">
      {/* Icon ở trước (bên trái) */}
      <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
        {React.cloneElement(icon, { size: 16 })}
      </div>
      
      {/* 3 hàng bắt đầu bằng nhau ở bên phải */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Row 1: Tên danh mục */}
        <p className="text-[11px] sm:text-xs font-black text-gray-500 truncate leading-tight">
          {title}
        </p>

        {/* Row 2: Số tiền, thông số */}
        <h3 className="text-[20px] sm:text-[22px] font-black text-green-955 mt-1 leading-none truncate">
          {value}
        </h3>

        {/* Row 3: Tỉ lệ % / Ghi chú */}
        <div className="mt-1 flex items-center min-w-0 h-5">
          <span className="px-1.5 py-0.5 rounded-lg bg-green-50 text-green-700 text-[9px] sm:text-[10px] font-black shrink-0">
            {note}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-16 min-w-[150px] px-5 border-b-2 font-black text-base whitespace-nowrap transition-all duration-200 ${
        active
          ? "border-primary/20 border-t-primary bg-primary/5"
          : "border-transparent text-gray-500 hover:text-primary hover:bg-primary/5"
      }`}
    >
      {children}
    </button>
  );
}

export function SelectBox({ label, value, onChange, children, compact = false }) {
  return (
    <label
      className={`h-12 rounded-xl border border-gray-100 bg-white flex flex-col justify-center shadow-sm shrink-0 min-w-0 text-left ${
        compact ? "w-[125px] px-3" : "w-[170px] 2xl:w-[190px] px-4"
      }`}
    >
      <span className="text-[11px] font-black text-gray-400 truncate">
        {label}
      </span>

      <select
        value={value}
        onChange={onChange}
        className="outline-none bg-transparent text-sm font-bold text-gray-700 min-w-0 truncate"
      >
        {children}
      </select>
    </label>
  );
}

export function IconButton({ icon, color, onClick, disabled = false, title = "" }) {
  const colors = {
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-all ${
        disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50" : colors[color]
      }`}
    >
      {icon}
    </button>
  );
}

export function DetailBlock({ title, children }) {
  return (
    <div className="border-t border-gray-100 pt-4 text-left">
      <h4 className="font-black text-primary mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-sm text-left">
      <span className="text-gray-500 font-semibold">{label}</span>
      <span className="text-gray-800 font-bold break-words">
        {value || "Chưa có"}
      </span>
    </div>
  );
}
