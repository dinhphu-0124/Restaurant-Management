import { useState, useEffect } from "react";
import { getAuthToken } from "../../utils/auth";
import { showAdminToast } from "../../components/admin/AdminToast";
import GlobalPagination from "../../components/admin/GlobalPagination";
import { translateAction, renderColoredMessage } from "../../utils/actionTranslator.jsx";

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const startIndex = (currentPage - 1) * pageSize;
  const currentLogs = logs.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/activity-logs", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      } else {
        showAdminToast({ title: "Lỗi", description: data.message, type: "error" });
      }
    } catch (error) {
      showAdminToast({ title: "Lỗi", description: "Không thể kết nối đến server", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Nhật ký hoạt động (Audit Logs)</h1>
          <p className="text-xs text-slate-500 font-medium">Theo dõi lịch sử thay đổi và thao tác trên hệ thống</p>
        </div>
        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto bg-primary text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:bg-emerald-800 transition active:scale-95"
        >
          Làm mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400">Đang tải nhật ký...</div>
        ) : (
          <>
            {/* MOBILE CARDS (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {currentLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">
                      {log.actor_user_name || "Hệ thống"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                      {new Date(log.created_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">
                      {translateAction(log.action)}
                    </span>
                  </div>
                  <div className="text-slate-600 font-medium leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    {renderColoredMessage(log.message)}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-8 text-center text-xs font-bold text-slate-400">Không có nhật ký nào</div>
              )}
            </div>

            {/* DESKTOP TABLE (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                      Người thao tác
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                      Hành động
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                      Chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-xs font-semibold text-slate-700">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-slate-900 font-bold">
                        {log.actor_user_name || "Hệ thống"}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black">
                          {translateAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {renderColoredMessage(log.message)}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-bold">
                        Không có nhật ký nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!loading && logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 sm:p-4">
          <GlobalPagination
            total={logs.length}
            page={currentPage}
            limit={pageSize}
            onPageChange={setCurrentPage}
            onLimitChange={setPageSize}
            limitOptions={[10, 20, 50, 100]}
          />
        </div>
      )}
    </div>
  );
}
