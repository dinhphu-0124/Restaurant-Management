import React, { useId } from "react";
import { ChevronDown } from "lucide-react";

/**
 * AppSelect - Hộp chọn thả xuống (Native Select bọc giao diện đẹp)
 */
export default function AppSelect({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = "Chọn một tùy chọn",
  error,
  required = false,
  disabled = false,
  className = "",
  wrapperClassName = "",
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1"
        >
          {label}
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none bg-white text-slate-800 text-sm rounded-xl border transition-all duration-200 py-2.5 pl-3.5 pr-10 cursor-pointer
            ${
              error
                ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                : "border-slate-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            }
            disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const text = typeof opt === "object" ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {text}
              </option>
            );
          })}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
