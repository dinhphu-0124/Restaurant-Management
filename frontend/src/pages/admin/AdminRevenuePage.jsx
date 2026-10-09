import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  ShoppingBag, Tag, Wallet, QrCode, Bike, Armchair, 
  TrendingUp, TrendingDown, Search, Calendar, Bell, 
  FileSpreadsheet, Activity, DollarSign, BadgeDollarSign
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend as RechartsLegend
} from "recharts";
import { AnimatedNumber } from "../../components/admin/AdminDashboardComponents";
import GlobalPagination from "../../components/admin/GlobalPagination";
import { getAdvancedDashboardData } from "../../services/revenueService";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

function StatCard({ title, value, growth, icon: Icon, isCurrency = false, subtitle = "" }) {
  const isUp = growth >= 0;
  return (
    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
      <div>
        <p className="text-[13px] font-bold text-gray-500 mb-1">{title}</p>
        <h3 className="text-[22px] font-black text-primary">
          <AnimatedNumber value={value} isCurrency={isCurrency} duration={2000} />
        </h3>
        {subtitle ? (
          <p className="text-xs font-semibold text-gray-400 mt-1">{subtitle}</p>
        ) : (
          <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span><AnimatedNumber value={Math.abs(growth)} isDecimal duration={2000} />% so với kỳ trước</span>
          </div>
        )}
      </div>
      <div className="w-12 h-12 rounded-xl bg-gray-50 text-primary flex items-center justify-center">
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  );
}

export default function AdminRevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animateBars, setAnimateBars] = useState(false);
  const { setExportExcelHandler } = useOutletContext();
  
  const [filters, setFilters] = useState({
    timeRange: "7days",
    orderType: "all",
    payment: "all",
    space: "all"
  });

  const [page, setPage] = useState(1);
  const limit = 5;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdvancedDashboardData(filters);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadData();
  }, [filters]);

  useEffect(() => {
    if (data) {
      setAnimateBars(false);
      const timer = setTimeout(() => setAnimateBars(true), 100);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const handleExportExcel = () => {
    if (!data) return;
    const ws_data = [
      ["BÁO CÁO DOANH THU CHI TIẾT"],
      [],
      ["1. TỔNG QUAN"],
      ["Tổng doanh thu", data.overview.totalRevenue.value],
      ["Số đơn hàng", data.overview.orders.value],
      ["AOV (Giá trị TB/Đơn)", data.overview.aov.value],
      ["Tổng giảm giá", data.overview.discount.value],
      [],
      ["2. GIAO DỊCH GẦN ĐÂY"],
      ["Mã đơn", "Khách hàng", "Loại đơn", "Khu vực", "Tổng tiền", "Giảm giá", "Thanh toán", "Thời gian"]
    ];

    data.recentTransactions.forEach(t => {
      ws_data.push([
        t.orderId, t.customerName, t.orderType, t.area,
        t.total, t.discount, t.paymentMethod, new Date(t.time).toLocaleString('vi-VN')
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doanh Thu");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "BaoCaoDoanhThu.xlsx");
  };

  useEffect(() => {
    setExportExcelHandler(() => handleExportExcel);
    return () => setExportExcelHandler(null);
  }, [data]);

  if (!data && loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      <p className="text-sm font-bold text-gray-500">Đang tải số liệu thống kê...</p>
    </div>
  );
  if (!data) return <div className="p-6 text-red-500">Lỗi tải dữ liệu</div>;

  const PIE_COLORS = ["#22c55e", "#3b82f6"];

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-10">

      <div className="px-3 sm:px-5 lg:px-6 mt-4 sm:mt-6 max-w-[1600px] mx-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner shrink-0">
              {['today', '7days', 'thismonth'].map(t => {
                const labels = { today: 'Hôm nay', '7days': '7 ngày', 'thismonth': 'Tháng này' };
                return (
                  <button key={t} 
                    onClick={() => setFilters(f => ({ ...f, timeRange: t }))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filters.timeRange === t ? 'bg-white text-green-700 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}>
                    {labels[t]}
                  </button>
                );
              })}
            </div>
            
            <select 
              value={filters.orderType} onChange={e => setFilters(f => ({...f, orderType: e.target.value}))}
              className="flex-1 sm:flex-initial px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none hover:border-gray-300 cursor-pointer shadow-sm">
              <option value="all">Loại đơn: Tất cả</option>
              <option value="online">Online</option>
              <option value="table">Tại bàn</option>
            </select>
            
            <select 
              value={filters.payment} onChange={e => setFilters(f => ({...f, payment: e.target.value}))}
              className="flex-1 sm:flex-initial px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none hover:border-gray-300 cursor-pointer shadow-sm">
              <option value="all">Thanh toán: Tất cả</option>
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
            </select>

            <select 
              value={filters.space} onChange={e => setFilters(f => ({...f, space: e.target.value}))}
              className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none hover:border-gray-300 cursor-pointer shadow-sm">
              <option value="all">Khu vực: Tất cả</option>
              <option value="Tầng 1">Tầng 1</option>
              <option value="Tầng 2">Tầng 2</option>
              <option value="Tầng 3">Tầng 3</option>
              <option value="Phòng VIP">Phòng VIP</option>
            </select>
          </div>
        </div>

        {/* 10 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <StatCard title="Tổng doanh thu" value={data.overview.totalRevenue.value} growth={data.overview.totalRevenue.growth} isCurrency icon={ShoppingBag} />
          <StatCard title="Số đơn hàng" value={data.overview.orders.value} growth={data.overview.orders.growth} icon={ShoppingBag} />
          <StatCard title="AOV" value={data.overview.aov.value} growth={data.overview.aov.growth} isCurrency icon={TrendingUp} />
          <StatCard title="Tổng giảm giá" value={data.overview.discount.value} growth={data.overview.discount.growth} isCurrency icon={Tag} />
          <StatCard
            title="Tổng giá vốn"
            value={data.overview.totalCost?.value ?? 0}
            isCurrency
            icon={DollarSign}
            subtitle="Chi phí nguyên liệu ước tính"
          />
        </div>

        {/* Profit highlight row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="md:col-span-2 bg-gradient-to-br from-green-700 to-green-900 p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between text-white">
            <div>
              <p className="text-xs sm:text-sm font-bold text-green-200 mb-1">💰 LỢI NHUẬN GỘP (Gross Profit)</p>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                <AnimatedNumber value={data.overview.grossProfit?.value ?? 0} isCurrency duration={2000} />
              </h3>
              <p className="text-xs text-green-300 mt-1">
                Biên lợi nhuận: <span className="font-black text-white text-sm">{data.overview.grossProfit?.margin ?? 0}%</span>
              </p>
            </div>
            <BadgeDollarSign size={40} className="text-green-400 opacity-80 sm:w-12 sm:h-12" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <StatCard title="Doanh thu tiền mặt" value={data.overview.totalRevenue.value > 0 ? data.paymentSplit.cash.value : 0} isCurrency icon={Wallet} subtitle={<><AnimatedNumber value={data.paymentSplit.cash.pct} isDecimal duration={2000} />% tổng doanh thu</>} />
            <StatCard title="Doanh thu chuyển khoản" value={data.overview.totalRevenue.value > 0 ? data.paymentSplit.transfer.value : 0} isCurrency icon={QrCode} subtitle={<><AnimatedNumber value={data.paymentSplit.transfer.pct} isDecimal duration={2000} />% tổng doanh thu</>} />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Revenue vs Cost vs Profit Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 lg:col-span-2">
            <h3 className="text-sm sm:text-base font-black text-primary mb-4">Doanh thu / Giá vốn / Lợi nhuận</h3>
            <div className="h-[200px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }} formatter={(val, name) => [val.toLocaleString('vi-VN')+'đ', name === 'revenue' ? 'Doanh thu' : name === 'cost' ? 'Giá vốn' : 'Lợi nhuận']} />
                  <RechartsLegend formatter={(val) => val === 'revenue' ? 'Doanh thu' : val === 'cost' ? 'Giá vốn' : 'Lợi nhuận'} wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                  <Bar dataKey="revenue" fill="#15803d" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Donut */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-primary mb-2">Phương thức thanh toán</h3>
            <div className="h-[180px] sm:h-[200px] relative mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                      { name: "Tiền mặt", value: data.paymentSplit.cash.value },
                      { name: "VietQR", value: data.paymentSplit.transfer.value }
                    ]} 
                    cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                    {PIE_COLORS.map((color, i) => <Cell key={`cell-${i}`} fill={color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontWeight: 'bold' }} formatter={(val) => val.toLocaleString('vi-VN')+'đ'}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base sm:text-lg font-black text-primary">
                  <AnimatedNumber value={data.overview.totalRevenue.value} isCurrency duration={2000} />
                </span>
                <span className="text-[10px] font-bold text-gray-400">Tổng doanh thu</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div>Tiền mặt</div>
                <div className="text-right"><div className="font-black text-primary"><AnimatedNumber value={data.paymentSplit.cash.value} isCurrency duration={2000} /></div><div className="text-[11px] font-bold text-gray-400"><AnimatedNumber value={data.paymentSplit.cash.pct} isDecimal duration={2000} />%</div></div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div>VietQR</div>
                <div className="text-right"><div className="font-black text-primary"><AnimatedNumber value={data.paymentSplit.transfer.value} isCurrency duration={2000} /></div><div className="text-[11px] font-bold text-gray-400"><AnimatedNumber value={data.paymentSplit.transfer.pct} isDecimal duration={2000} />%</div></div>
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-primary mb-4">Top món bán chạy</h3>
            <div className="space-y-4 mt-4 sm:mt-6">
              {data.topItems.map((item, idx) => {
                const maxQty = Math.max(...data.topItems.map(i => i.quantity), 1);
                const w = (item.quantity / maxQty) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-24 truncate text-xs sm:text-[13px] font-bold text-gray-700">{item.name}</div>
                    <div className="flex-1 h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#15803d] rounded-full transition-all duration-1000 ease-out" style={{ width: `${animateBars ? w : 0}%` }}></div>
                    </div>
                    <div className="w-8 text-right text-xs sm:text-[13px] font-black text-primary">
                      <AnimatedNumber value={item.quantity} duration={2000} />
                    </div>
                  </div>
                );
              })}
              {data.topItems.length === 0 && <div className="text-sm text-gray-400 text-center py-4 font-bold">Chưa có dữ liệu</div>}
            </div>
            {data.topItems.length > 0 && <div className="text-center text-[11px] font-bold text-gray-400 mt-4">Số lượng bán</div>}
          </div>

          {/* Revenue By Space */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm sm:text-base font-black text-primary mb-4">Doanh thu theo khu vực</h3>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider border-b border-gray-100 pb-2">
                <span>Khu vực</span>
                <div className="flex items-center gap-6 sm:gap-8 text-right"><span className="w-16 sm:w-20">Doanh thu</span><span className="w-8 sm:w-10">Tỷ lệ</span></div>
              </div>
              <div className="space-y-3">
                {data.spaceRevenue.map((sp, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs sm:text-[13px]">
                    <span className="font-bold text-gray-700 truncate mr-2">{sp.name}</span>
                    <div className="flex items-center gap-6 sm:gap-8 text-right shrink-0">
                      <span className="w-16 sm:w-20 font-black text-primary"><AnimatedNumber value={sp.revenue} isCurrency duration={2000} /></span>
                      <span className="w-8 sm:w-10 font-bold text-gray-500"><AnimatedNumber value={sp.pct} isDecimal duration={2000} />%</span>
                    </div>
                  </div>
                ))}
                {data.spaceRevenue.length === 0 && <div className="text-sm text-gray-400 text-center py-4 font-bold">Chưa có dữ liệu</div>}
              </div>
              {data.spaceRevenue.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 bg-[#f0fdf4] -mx-4 sm:-mx-6 px-4 sm:px-6 -mb-4 sm:-mb-6 pb-4 sm:pb-6 rounded-b-2xl">
                  <span className="font-black text-green-800 text-xs sm:text-[13px]">Tổng</span>
                  <div className="flex items-center gap-6 sm:gap-8 text-right shrink-0">
                    <span className="w-16 sm:w-20 font-black text-green-700 text-xs sm:text-[13px]"><AnimatedNumber value={data.overview.totalRevenue.value} isCurrency duration={2000} /></span>
                    <span className="w-8 sm:w-10 font-black text-green-700 text-xs sm:text-[13px]"><AnimatedNumber value={100} duration={2000} />%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-primary">Giao dịch gần đây</h3>
            <span className="text-xs font-bold text-gray-400">{data.recentTransactions.length} giao dịch</span>
          </div>

          {/* MOBILE CARD VIEW (< lg) */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {data.recentTransactions.slice((page - 1) * limit, page * limit).map((tx, idx) => (
              <div key={idx} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-black text-sm text-emerald-800">#{tx.orderId}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black ${tx.orderType === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {tx.orderType}
                    </span>
                  </div>
                  <span className="text-sm font-black text-primary shrink-0">
                    {tx.total.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="font-bold truncate">{tx.customerName}</span>
                  <span className="text-gray-400 font-medium">{tx.area}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-black ${tx.paymentMethod === 'Tiền mặt' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {tx.paymentMethod}
                  </span>
                  <span className="text-gray-400 font-semibold">
                    {new Date(tx.time).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            {data.recentTransactions.length === 0 && (
              <div className="py-12 text-center text-xs font-bold text-gray-400">Không có giao dịch nào</div>
            )}
          </div>

          {/* DESKTOP TABLE VIEW (>= lg) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-3 px-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Mã đơn</th>
                  <th className="py-3 px-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Khách hàng</th>
                  <th className="py-3 px-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Loại đơn</th>
                  <th className="py-3 px-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Khu vực / Bàn</th>
                  <th className="py-3 px-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Tổng tiền</th>
                  <th className="py-3 px-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Giảm giá</th>
                  <th className="py-3 px-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">Thanh toán</th>
                  <th className="py-3 px-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentTransactions.slice((page - 1) * limit, page * limit).map((tx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-5 text-[13px] font-bold text-gray-700 whitespace-nowrap">{tx.orderId}</td>
                    <td className="py-3 px-5 text-[13px] font-bold text-gray-600 whitespace-nowrap">{tx.customerName}</td>
                    <td className="py-3 px-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-black ${tx.orderType === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {tx.orderType}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-[13px] font-bold text-gray-600 whitespace-nowrap">{tx.area}</td>
                    <td className="py-3 px-5 text-[13px] font-black text-primary text-right whitespace-nowrap">{tx.total.toLocaleString('vi-VN')}đ</td>
                    <td className="py-3 px-5 text-[13px] font-bold text-gray-500 text-right whitespace-nowrap">{tx.discount > 0 ? tx.discount.toLocaleString('vi-VN') + 'đ' : '0đ'}</td>
                    <td className="py-3 px-5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-black ${tx.paymentMethod === 'Tiền mặt' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-[13px] font-bold text-gray-500 text-right whitespace-nowrap">{new Date(tx.time).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                  </tr>
                ))}
                {data.recentTransactions.length === 0 && (
                  <tr><td colSpan="8" className="py-8 text-center text-sm font-bold text-gray-400">Không có giao dịch nào</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {data.recentTransactions.length > 0 && (
            <div className="border-t border-gray-100 p-3 sm:p-4">
              <GlobalPagination
                total={data.recentTransactions.length}
                page={page}
                limit={limit}
                onPageChange={setPage}
                limitOptions={[5]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
