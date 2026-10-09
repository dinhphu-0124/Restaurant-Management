import React, { useId } from "react";

/**
 * AppInput - Ô nhập liệu chuẩn hóa có label, error state và focus-ring sắc nét
 */
export default function AppInput({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  leadingIcon = null,
  trailingIcon = null,
  className = "",
  wrapperClassName = "",
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1"
        >
          {label}
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leadingIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leadingIcon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-white text-slate-800 text-sm rounded-xl border transition-all duration-200 py-2.5 px-3.5
            ${leadingIcon ? "pl-10" : ""}
            ${trailingIcon ? "pr-10" : ""}
            ${
              error
                ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                : "border-slate-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            }
            disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
            placeholder:text-slate-400 ${className}`}
          {...props}
        />

        {trailingIcon && (
          <div className="absolute right-3.5 flex items-center text-slate-400">
            {trailingIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
