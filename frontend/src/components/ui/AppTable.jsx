import React from "react";
import AppSkeleton from "./AppSkeleton.jsx";
import AppEmptyState from "./AppEmptyState.jsx";

/**
 * AppTable - Khung bảng dữ liệu chuẩn hóa dành cho Admin & Báo cáo
 */
export default function AppTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = "Không tìm thấy dữ liệu phù hợp",
  emptyIcon,
  className = "",
}) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80">
              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  className={`py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  } ${col.headerClassName || ""}`}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-4 px-4">
                      <AppSkeleton type="text" className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <AppEmptyState
                    title={emptyMessage}
                    icon={emptyIcon}
                    className="py-4"
                  />
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, rIdx) => (
                <tr
                  key={row.id || row.key || rIdx}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  {columns.map((col, cIdx) => {
                    const cellValue = col.render
                      ? col.render(row[col.dataIndex], row, rIdx)
                      : row[col.dataIndex];

                    return (
                      <td
                        key={col.key || cIdx}
                        className={`py-3.5 px-4 text-slate-700 ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        } ${col.cellClassName || ""}`}
                      >
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
