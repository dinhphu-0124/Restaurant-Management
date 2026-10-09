import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { showAdminToast } from "../../components/admin/AdminToast";
import { removeVietnameseTones, calculateSearchScore } from "../../utils/string";
import { ShieldCheck, Search, ChevronDown, Plus, Crown, BriefcaseBusiness, UserCog } from "lucide-react";

import { getCurrentUser } from "../../utils/auth";
import { TopStatCard, RolePermissionCard, AdminTipsCard, RecentActivityPanel, AccountDetailPanel } from "../../components/admin/AdminRoleComponents";
import { getRoleUsers, updateUserRole, getUserActivities, getAdminRoleActivities } from "../../services/roleService";
import { updateUserStatus } from "../../services/userService";
import { ROLE_TEXT, ROLE_BADGE, STATUS_TEXT, STATUS_BADGE, ROLE_THEME, roleCards, ROLE_PERMISSIONS } from "../../utils/rolesHelpers";
import AdminRoleTable from "../../components/admin/AdminRoleTable";
import GlobalPagination from "../../components/admin/GlobalPagination";

function AdminRolesPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminActivities, setAdminActivities] = useState([]);
  const [adminActivitiesLoading, setAdminActivitiesLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try { setLoading(true); const data = await getRoleUsers(); setUsers(data.users || []); }
      catch (error) { console.error("Lỗi:", error); showAdminToast({ title: "Lỗi", message: "Không thể tải danh sách tài khoản.", type: "error" }); }
      finally { setLoading(false); }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAdminActivities = async () => {
      try { setAdminActivitiesLoading(true); const data = await getAdminRoleActivities(15); setAdminActivities(data.activities || []); }
      catch (error) { console.error("Lỗi tải hoạt động:", error); }
      finally { setAdminActivitiesLoading(false); }
    };
    fetchAdminActivities();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      const fetchLogs = async () => {
        try { setActivityLoading(true); const logs = await getUserActivities(selectedAccount.id); setActivityLogs(logs.activities || []); }
        catch (error) { console.error("Lỗi tải lịch sử:", error); }
        finally { setActivityLoading(false); }
      };
      fetchLogs();
    } else { setActivityLogs([]); }
  }, [selectedAccount]);

  const stats = useMemo(() => {
    const st = { total: users.length, admin: 0, manager: 0, staff: 0, user: 0, active: 0, locked: 0, deleted: 0 };
    users.forEach((u) => {
      if (st[u.role] !== undefined) st[u.role]++;
      if (st[u.status] !== undefined) st[u.status]++;
    });
    return st;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const rawKeyword = String(searchQuery || "").trim();
    const scored = users
      .map((user) => {
        const matchTab = activeTab === "all" || (activeTab === "employee" && ["admin", "manager", "staff"].includes(user.role)) || (activeTab === "customer" && user.role === "user");
        const matchRole = roleFilter === "all" || user.role === roleFilter;
        const matchStatus = statusFilter === "all" || user.status === statusFilter;
        if (!matchTab || !matchRole || !matchStatus) return null;

        const score = rawKeyword ? calculateSearchScore({
          name: user.name || user.fullName,
          email: user.email,
          phone: user.phone,
          id: `tk${String(user.id).padStart(5, "0")}`,
          code: String(user.id)
        }, rawKeyword) : 1;

        if (score === 0) return null;
        return { user, score };
      })
      .filter(Boolean);

    if (rawKeyword) {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored.map((s) => s.user);
  }, [users, searchQuery, activeTab, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleChangeRole = async (user, newRole) => {
    try {
      const userId = user.id;
      if (String(currentUser.id) === String(userId)) { showAdminToast({ title: "Từ chối", message: "Bạn không thể tự thay đổi vai trò của mình.", type: "error" }); return; }
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (String(u.id) === String(userId) ? { ...u, role: newRole } : u)));
      if (selectedAccount && String(selectedAccount.id) === String(userId)) { setSelectedAccount({ ...selectedAccount, role: newRole }); }
      showAdminToast({ title: "Thành công", message: `Đã thay đổi vai trò thành ${ROLE_TEXT[newRole]}.` });
      const newLogs = await getAdminRoleActivities(15); setAdminActivities(newLogs.activities || []);
    } catch (error) { console.error("Lỗi:", error); showAdminToast({ title: "Thất bại", message: error.message || "Lỗi cập nhật vai trò", type: "error" }); }
  };

  const handleToggleStatus = async (user) => {
    try {
      const userId = user.id;
      const currentStatus = user.status;
      if (String(currentUser.id) === String(userId)) { showAdminToast({ title: "Từ chối", message: "Bạn không thể tự khóa tài khoản của mình.", type: "error" }); return; }
      const newStatus = currentStatus === "locked" ? "active" : "locked";
      await updateUserStatus(userId, newStatus);
      setUsers((prev) => prev.map((u) => (String(u.id) === String(userId) ? { ...u, status: newStatus } : u)));
      if (selectedAccount && String(selectedAccount.id) === String(userId)) { setSelectedAccount({ ...selectedAccount, status: newStatus }); }
      showAdminToast({ title: "Thành công", message: `Đã ${newStatus === "locked" ? "khóa" : "mở khóa"} tài khoản.` });
      const newLogs = await getAdminRoleActivities(15); setAdminActivities(newLogs.activities || []);
    } catch (error) { console.error("Lỗi:", error); showAdminToast({ title: "Thất bại", message: error.message || "Lỗi cập nhật trạng thái", type: "error" }); }
  };

  const formatDateTime = (value) => {
    if (!value) return "Chưa có"; const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${d.toLocaleDateString("vi-VN")}`;
  };

  const formatDateOnly = (value) => {
    if (!value) return ""; const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("vi-VN");
  };

  const formatTimeOnly = (value) => {
    if (!value) return ""; const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  if (!currentUser || currentUser.role !== "admin") return <Navigate to="/admin" replace />;

  const startItem = filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredUsers.length);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 delay-kpi">
        <TopStatCard icon={<ShieldCheck />} title="Tổng tài khoản" value={stats.total} note="Đang theo dõi" bg="bg-blue-50" color="text-blue-600" />
        <TopStatCard icon={<Crown />} title="Quản trị viên" value={stats.admin} note="Toàn quyền" bg="bg-red-50" color="text-red-600" />
        <TopStatCard icon={<BriefcaseBusiness />} title="Nhân viên & Quản lý" value={stats.staff + stats.manager} note="Thao tác" bg="bg-yellow-50" color="text-yellow-600" />
        <TopStatCard icon={<UserCog />} title="Khách hàng" value={stats.user} note="Đăng ký" bg="bg-green-50" color="text-green-600" />
      </div>

      <div className={`grid grid-cols-1 ${selectedAccount ? "xl:grid-cols-[1fr_320px]" : ""} gap-5 delay-table`}>
        <div className="space-y-5 min-w-0">
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/30">
              <div className="flex px-4 pt-4 pb-0 overflow-x-auto gap-2">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "employee", label: "Nội bộ (Admin, Quản lý, NV)" },
                  { id: "customer", label: "Khách hàng" },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }} className={`px-5 py-3 text-[13px] font-black border-b-2 whitespace-nowrap transition ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white flex flex-col md:flex-row gap-3">
              <div className="h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 flex items-center px-4 gap-3 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition">
                <Search size={18} className="text-gray-400" />
                <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Tìm theo tên, email, sđt..." className="w-full bg-transparent outline-none text-sm font-semibold" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <button onClick={() => { setShowRoleFilter(!showRoleFilter); setShowStatusFilter(false); }} className={`h-11 px-4 rounded-xl border flex items-center gap-2 text-[13px] font-bold transition ${roleFilter !== "all" ? "bg-green-50 border-green-200 text-green-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                    Vai trò: {roleFilter === "all" ? "Tất cả" : ROLE_TEXT[roleFilter]} <ChevronDown size={14} className={`transition ${showRoleFilter ? "rotate-180" : ""}`} />
                  </button>
                  {showRoleFilter && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-20 py-2">
                      <button onClick={() => { setRoleFilter("all"); setShowRoleFilter(false); setCurrentPage(1); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold hover:bg-gray-50">Tất cả</button>
                      {Object.keys(ROLE_TEXT).map((role) => (
                        <button key={role} onClick={() => { setRoleFilter(role); setShowRoleFilter(false); setCurrentPage(1); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold hover:bg-gray-50">{ROLE_TEXT[role]}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => { setShowStatusFilter(!showStatusFilter); setShowRoleFilter(false); }} className={`h-11 px-4 rounded-xl border flex items-center gap-2 text-[13px] font-bold transition ${statusFilter !== "all" ? "bg-green-50 border-green-200 text-green-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                    TT: {statusFilter === "all" ? "Tất cả" : STATUS_TEXT[statusFilter]} <ChevronDown size={14} className={`transition ${showStatusFilter ? "rotate-180" : ""}`} />
                  </button>
                  {showStatusFilter && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-20 py-2">
                      <button onClick={() => { setStatusFilter("all"); setShowStatusFilter(false); setCurrentPage(1); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold hover:bg-gray-50">Tất cả</button>
                      {Object.keys(STATUS_TEXT).map((status) => (
                        <button key={status} onClick={() => { setStatusFilter(status); setShowStatusFilter(false); setCurrentPage(1); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold hover:bg-gray-50">{STATUS_TEXT[status]}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => navigate("/admin/users")} className={`rounded-xl bg-green-800 text-white font-black hover:bg-green-950 hover:shadow-lg transition flex items-center justify-center whitespace-nowrap ${selectedAccount ? "h-10 px-2 text-xs gap-1" : "h-11 px-4 text-sm gap-2"}`}><Plus size={selectedAccount ? 14 : 17} />Cấp quyền</button>
              </div>
            </div>

            <AdminRoleTable paginatedUsers={paginatedUsers} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} formatDateTime={formatDateTime} />

            <GlobalPagination
              total={filteredUsers.length}
              page={currentPage}
              limit={itemsPerPage}
              onPageChange={setCurrentPage}
              onLimitChange={setItemsPerPage}
              isLoading={loading}
              limitOptions={[10, 20, 50]}
            />
          </section>

          <RecentActivityPanel activities={adminActivities} loading={adminActivitiesLoading} formatDateTime={formatDateTime} />
        </div>

        {selectedAccount && (
          <AccountDetailPanel user={selectedAccount} activities={activityLogs} activityLoading={activityLoading} onClose={() => setSelectedAccount(null)} onChangeRole={handleChangeRole} onToggleStatus={handleToggleStatus} formatDate={formatDateOnly} formatTime={formatTimeOnly} />
        )}
      </div>
    </div>
  );
}

export default AdminRolesPage;
