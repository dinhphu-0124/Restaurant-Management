import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { getDetailedReport } from "../../services/revenueService";
import {
  Download, Search, TrendingUp, Wallet, ArrowDownRight, RotateCcw,
  ReceiptText, Calendar, Users, Percent, HelpCircle, AlertTriangle,
  ArrowUpRight, Printer, FileSpreadsheet, FileText, ChevronDown, Check,
  User, MapPin, CreditCard, LayoutDashboard
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import GlobalPagination from "../../components/admin/GlobalPagination";
import { removeVietnameseTones, calculateSearchScore } from "../../utils/string";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, BarChart, Bar, Legend, PieChart, Pie, Cell,
  LineChart, Line
} from "recharts";

// Helper để định dạng tiền tệ Việt Nam
const formatVND = (value) => {
  return Math.round(value).toLocaleString("vi-VN") + "₫";
};

// Mini Sparkline component cho các thẻ KPI
function MiniSparkline({ data = [], color = "#10b981" }) {
  if (data.length === 0) return <div className="w-16 h-8 bg-gray-50 rounded" />;
  return (
    <div className="w-16 h-8 opacity-70">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map(val => ({ value: val }))}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, growth, icon: Icon, colorClass, sparklineData, isCurrency = true, unit = "" }) {
  const isUp = growth >= 0;
  return (
    <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/70 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[130px]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-black text-gray-400 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <div>
          <h3 className="text-xl font-black text-primary leading-none">
            {isCurrency ? formatVND(value) : `${value.toLocaleString("vi-VN")}${unit}`}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold">
            <span className={`flex items-center gap-0.5 ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {isUp ? "↑" : "↓"} {Math.abs(growth).toFixed(1)}%
            </span>
            <span className="text-gray-400 font-medium">so với kỳ trước</span>
          </div>
        </div>
        <MiniSparkline data={sparklineData} color={isUp ? "#10b981" : "#ef4444"} />
      </div>
    </div>
  );
}

function AdminReportPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setExportExcelHandler } = useOutletContext();

  // Filters State
  const [timeRange, setTimeRange] = useState("7days");
  const [compareRange, setCompareRange] = useState("previous"); // previous, none
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [orderType, setOrderType] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [minRevenue, setMinRevenue] = useState("");
  const [maxRevenue, setMaxRevenue] = useState("");

  // Table Page State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedIds, setSelectedIds] = useState([]);

  // Charts mode state
  const [revenueChartPeriod, setRevenueChartPeriod] = useState("day"); // hour, day, month

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await getDetailedReport();
        setReports(data.data || []);
      } catch (err) {
        setError(err.message || "Lỗi lấy dữ liệu báo cáo");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Xác định khoảng ngày lọc thực tế
  const activeDateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (timeRange === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "yesterday") {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "7days") {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "30days") {
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "thisweek") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "thismonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "thisquarter") {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qStartMonth, 1);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "thisyear") {
      start = new Date(now.getFullYear(), 0, 1);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "custom" && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Mặc định 7 ngày
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }, [timeRange, startDate, endDate]);

  // Xác định khoảng ngày đối chiếu so sánh
  const compareDateRange = useMemo(() => {
    if (compareRange === "none") return null;
    const { start, end } = activeDateRange;
    const duration = end.getTime() - start.getTime();

    // Lùi ngày tương tự độ dài của kỳ hiện tại
    const compareStart = new Date(start.getTime() - duration - 1);
    const compareEnd = new Date(end.getTime() - duration - 1);
    return { start: compareStart, end: compareEnd };
  }, [activeDateRange, compareRange]);

  // Danh sách duy nhất phục vụ bộ lọc dropdown
  const uniqueFilterOptions = useMemo(() => {
    const areas = new Set();
    const staff = new Set();
    reports.forEach(r => {
      if (r.area) areas.add(r.area);
      if (r.staffName) staff.add(r.staffName);
    });
    return {
      areas: Array.from(areas),
      staff: Array.from(staff)
    };
  }, [reports]);

  // Lọc dữ liệu kỳ hiện tại
  const filteredReports = useMemo(() => {
    const rawKeyword = String(search || "").trim();
    const scored = reports
      .map((r) => {
        const orderDate = new Date(r.date);
        if (orderDate < activeDateRange.start || orderDate > activeDateRange.end) return null;

        // Dropdown filters
        if (paymentMethod !== "all" && r.paymentMethod !== paymentMethod) return null;
        if (paymentStatus !== "all" && r.paymentStatus !== paymentStatus) return null;
        if (orderType !== "all" && r.serviceType !== orderType) return null;
        if (areaFilter !== "all" && r.area !== areaFilter) return null;
        if (staffFilter !== "all" && r.staffName !== staffFilter) return null;

        // Khoảng giá trị
        if (minRevenue && Number(r.total || 0) < Number(minRevenue)) return null;
        if (maxRevenue && Number(r.total || 0) > Number(maxRevenue)) return null;

        const score = rawKeyword ? calculateSearchScore({
          customerName: r.customerName,
          phone: r.phone,
          id: r.orderId,
          code: r.orderId,
          tableName: r.area
        }, rawKeyword) : 1;

        if (score === 0) return null;
        return { r, score };
      })
      .filter(Boolean);

    if (rawKeyword) {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored.map((s) => s.r);
  }, [reports, activeDateRange, search, paymentMethod, paymentStatus, orderType, areaFilter, staffFilter, minRevenue, maxRevenue]);

  // Lọc dữ liệu kỳ đối chiếu
  const compareReports = useMemo(() => {
    if (!compareDateRange) return [];
    return reports.filter(r => {
      const orderDate = new Date(r.date);
      if (orderDate < compareDateRange.start || orderDate > compareDateRange.end) return false;

      // Áp dụng các bộ lọc phân loại tương ứng ngoại trừ thời gian và khoảng doanh thu
      if (paymentMethod !== "all" && r.paymentMethod !== paymentMethod) return false;
      if (paymentStatus !== "all" && r.paymentStatus !== paymentStatus) return false;
      if (orderType !== "all" && r.serviceType !== orderType) return false;
      if (areaFilter !== "all" && r.area !== areaFilter) return false;
      if (staffFilter !== "all" && r.staffName !== staffFilter) return false;

      return true;
    });
  }, [reports, compareDateRange, paymentMethod, paymentStatus, orderType, areaFilter, staffFilter]);

  // Sắp xếp dữ liệu bảng
  const sortedReports = useMemo(() => {
    const sorted = [...filteredReports];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "date") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (typeof aVal === "string") {
        aVal = removeVietnameseTones(aVal.toLowerCase());
        bVal = removeVietnameseTones(bVal.toLowerCase());
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredReports, sortField, sortOrder]);

  // Phân trang dữ liệu bảng
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedReports.slice(startIndex, startIndex + pageSize);
  }, [sortedReports, currentPage, pageSize]);

  // Reset các bộ lọc về mặc định
  const handleResetFilters = () => {
    setTimeRange("7days");
    setCompareRange("previous");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPaymentMethod("all");
    setPaymentStatus("all");
    setOrderType("all");
    setAreaFilter("all");
    setStaffFilter("all");
    setMinRevenue("");
    setMaxRevenue("");
    setCurrentPage(1);
    setSelectedIds([]);
  };

  // Tính toán chỉ số KPI của kỳ hiện tại và kỳ đối chiếu
  const kpiStats = useMemo(() => {
    const calculateTotals = (list) => {
      let orders = list.length;
      let revenue = 0;
      let cost = 0;
      let profit = 0;
      let guests = 0;
      const customers = new Set();
      const repeatedCustomers = {};

      list.forEach(item => {
        revenue += Number(item.total || 0);
        cost += Number(item.cost || 0);
        profit += Number(item.profit || 0);
        guests += Number(item.guests || 1);

        if (item.customerName) {
          customers.add(item.customerName);
          repeatedCustomers[item.customerName] = (repeatedCustomers[item.customerName] || 0) + 1;
        }
      });

      const profitPercent = revenue > 0 ? (profit / revenue) * 100 : 0;
      const aov = orders > 0 ? revenue / orders : 0;

      const totalCustomers = customers.size;
      const repeatedCount = Object.values(repeatedCustomers).filter(c => c > 1).length;
      const returnRate = totalCustomers > 0 ? (repeatedCount / totalCustomers) * 100 : 0;

      return { orders, revenue, cost, profit, profitPercent, aov, guests, returnRate };
    };

    const current = calculateTotals(filteredReports);
    const prev = calculateTotals(compareReports);

    // Tính % tăng trưởng
    const growth = (currVal, prevVal) => {
      if (prevVal === 0) return currVal > 0 ? 100 : 0;
      return ((currVal - prevVal) / prevVal) * 100;
    };

    return {
      current,
      growths: {
        orders: growth(current.orders, prev.orders),
        revenue: growth(current.revenue, prev.revenue),
        cost: growth(current.cost, prev.cost),
        profit: growth(current.profit, prev.profit),
        profitPercent: current.profitPercent - prev.profitPercent,
        aov: growth(current.aov, prev.aov),
        guests: growth(current.guests, prev.guests),
        returnRate: current.returnRate - prev.returnRate
      }
    };
  }, [filteredReports, compareReports]);

  // Tạo dữ liệu sparklines từ chuỗi ngày trong kỳ hiện tại
  const sparklineData = useMemo(() => {
    const dailyMap = {};
    filteredReports.forEach(r => {
      const dateStr = new Date(r.date).toLocaleDateString("en-CA");
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { revenue: 0, cost: 0, profit: 0, orders: 0, guests: 0 };
      dailyMap[dateStr].revenue += r.total;
      dailyMap[dateStr].cost += r.cost;
      dailyMap[dateStr].profit += r.profit;
      dailyMap[dateStr].orders += 1;
      dailyMap[dateStr].guests += r.guests;
    });

    const sortedDates = Object.keys(dailyMap).sort();
    return {
      revenue: sortedDates.map(d => dailyMap[d].revenue),
      cost: sortedDates.map(d => dailyMap[d].cost),
      profit: sortedDates.map(d => dailyMap[d].profit),
      orders: sortedDates.map(d => dailyMap[d].orders),
      guests: sortedDates.map(d => dailyMap[d].guests)
    };
  }, [filteredReports]);

  // Dữ liệu biểu đồ doanh thu chi tiết (được nhóm theo giờ/ngày/tháng tùy cấu hình)
  const chartData = useMemo(() => {
    const groupMap = {};
    const compareGroupMap = {};

    const getGroupKey = (date, period) => {
      const d = new Date(date);
      if (period === "hour") return `${String(d.getHours()).padStart(2, "0")}:00`;
      if (period === "month") return `Tháng ${d.getMonth() + 1}`;
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    filteredReports.forEach(r => {
      const key = getGroupKey(r.date, revenueChartPeriod);
      if (!groupMap[key]) groupMap[key] = { key, revenue: 0, cost: 0, profit: 0 };
      groupMap[key].revenue += r.total;
      groupMap[key].cost += r.cost;
      groupMap[key].profit += r.profit;
    });

    compareReports.forEach(r => {
      const key = getGroupKey(r.date, revenueChartPeriod);
      if (!compareGroupMap[key]) compareGroupMap[key] = { key, compareRevenue: 0 };
      compareGroupMap[key].compareRevenue += r.total;
    });

    // Merge và sắp xếp
    const keys = Array.from(new Set([...Object.keys(groupMap), ...Object.keys(compareGroupMap)]));
    return keys.map(key => ({
      key,
      revenue: groupMap[key]?.revenue || 0,
      cost: groupMap[key]?.cost || 0,
      profit: groupMap[key]?.profit || 0,
      compareRevenue: compareGroupMap[key]?.compareRevenue || 0
    })).sort((a, b) => {
      if (revenueChartPeriod === "hour") return a.key.localeCompare(b.key);
      if (revenueChartPeriod === "month") return Number(a.key.replace("Tháng ", "")) - Number(b.key.replace("Tháng ", ""));
      // So sánh ngày dd/mm
      const aParts = a.key.split("/");
      const bParts = b.key.split("/");
      return new Date(2026, aParts[1], aParts[0]) - new Date(2026, bParts[1], bParts[0]);
    });
  }, [filteredReports, compareReports, revenueChartPeriod]);

  // Thống kê tỷ lệ thanh toán (Pie chart)
  const paymentSplit = useMemo(() => {
    const counts = { cash: 0, bank: 0, qr: 0, card: 0 };
    filteredReports.forEach(r => {
      const pm = (r.paymentMethod || "cash").toLowerCase();
      if (pm.includes("cash") || pm === "tiền mặt") counts.cash += r.total;
      else if (pm.includes("qr")) counts.qr += r.total;
      else if (pm.includes("card") || pm === "thẻ") counts.card += r.total;
      else counts.bank += r.total;
    });
    const total = Object.values(counts).reduce((s, c) => s + c, 0);
    return [
      { name: "Tiền mặt", value: counts.cash, pct: total > 0 ? (counts.cash / total) * 100 : 0 },
      { name: "VietQR", value: counts.qr, pct: total > 0 ? (counts.qr / total) * 100 : 0 },
      { name: "Chuyển khoản", value: counts.bank, pct: total > 0 ? (counts.bank / total) * 100 : 0 },
      { name: "Quẹt thẻ", value: counts.card, pct: total > 0 ? (counts.card / total) * 100 : 0 }
    ].filter(i => i.value > 0);
  }, [filteredReports]);

  // Top món bán chạy
  const topSellingItems = useMemo(() => {
    const itemMap = {};
    filteredReports.forEach(r => {
      const items = r.cartItems || [];
      items.forEach(item => {
        const name = item.name || "Chưa đặt tên";
        if (!itemMap[name]) itemMap[name] = { name, qty: 0, revenue: 0 };
        itemMap[name].qty += Number(item.qty || 1);
        itemMap[name].revenue += Number(item.price || 0) * Number(item.qty || 1);
      });
    });

    const totalQty = Object.values(itemMap).reduce((s, i) => s + i.qty, 0);
    return Object.values(itemMap)
      .map(item => ({
        ...item,
        pct: totalQty > 0 ? (item.qty / totalQty) * 100 : 0
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredReports]);

  // Top khách hàng chi tiêu nhiều nhất
  const topCustomers = useMemo(() => {
    const custMap = {};
    filteredReports.forEach(r => {
      const name = r.customerName || "Khách lẻ";
      if (!custMap[name]) custMap[name] = { name, ordersCount: 0, totalSpending: 0, points: 0 };
      custMap[name].ordersCount += 1;
      custMap[name].totalSpending += r.total;
      custMap[name].points = Math.round(custMap[name].totalSpending / 100000); // 1 điểm cho mỗi 100k
    });
    return Object.values(custMap)
      .sort((a, b) => b.totalSpending - a.totalSpending)
      .slice(0, 5);
  }, [filteredReports]);

  // Hiệu suất nhân viên bán hàng
  const staffSalesPerformance = useMemo(() => {
    const staffMap = {};
    filteredReports.forEach(r => {
      const name = r.staffName || "Hệ thống";
      if (!staffMap[name]) staffMap[name] = { name, orders: 0, revenue: 0, profit: 0, commission: 0 };
      staffMap[name].orders += 1;
      staffMap[name].revenue += r.total;
      staffMap[name].profit += r.profit;
      // 1.5% hoa hồng trên doanh thu thuần
      staffMap[name].commission += r.total * 0.015;
    });
    return Object.values(staffMap).sort((a, b) => b.revenue - a.revenue);
  }, [filteredReports]);

  // Hiệu năng hoạt động của từng Khu vực (Area)
  const areaPerformance = useMemo(() => {
    const areaMap = {};
    filteredReports.forEach(r => {
      const area = r.area || "Online";
      if (!areaMap[area]) areaMap[area] = { name: area, revenue: 0, orders: 0 };
      areaMap[area].revenue += r.total;
      areaMap[area].orders += 1;
    });
    const totalRev = Object.values(areaMap).reduce((s, i) => s + i.revenue, 0);
    return Object.values(areaMap)
      .map(item => ({
        ...item,
        pct: totalRev > 0 ? (item.revenue / totalRev) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredReports]);

  // AI Insights tự động sinh
  const aiInsights = useMemo(() => {
    const insights = [];
    const stats = kpiStats.current;
    const growths = kpiStats.growths;

    if (growths.revenue !== 0) {
      const trend = growths.revenue >= 0 ? "tăng 📈" : "giảm 📉";
      insights.push(`Doanh thu thuần ${trend} ${Math.abs(growths.revenue).toFixed(1)}% so với kỳ trước.`);
    }

    if (topSellingItems.length > 0) {
      insights.push(`🐐 Món ăn được yêu chuộng nhất là "${topSellingItems[0].name}" với ${topSellingItems[0].qty} đơn hàng bán ra.`);
    }

    if (paymentSplit.length > 0) {
      const topPM = paymentSplit.sort((a, b) => b.value - a.value)[0];
      insights.push(`💳 Phương thức thanh toán phổ biến nhất là ${topPM.name} chiếm ${topPM.pct.toFixed(0)}% tổng hóa đơn.`);
    }

    if (areaPerformance.length > 0) {
      insights.push(`🍲 Khu vực hoạt động hiệu quả nhất là "${areaPerformance[0].name}" đóng góp ${areaPerformance[0].pct.toFixed(0)}% doanh thu.`);
    }

    if (stats.returnRate > 15) {
      insights.push(`👨‍👩‍👧‍👦 Tỷ lệ khách hàng quay lại đạt ${stats.returnRate.toFixed(1)}%, thể hiện mức độ trung thành của khách hàng cực kỳ tốt.`);
    }

    return insights;
  }, [kpiStats, topSellingItems, paymentSplit, areaPerformance]);

  // Cảnh báo tự động dựa trên chỉ số xấu
  const alerts = useMemo(() => {
    const alertsList = [];
    const growths = kpiStats.growths;

    if (growths.profit < -5) {
      alertsList.push({
        title: "Lợi nhuận suy giảm nghiêm trọng",
        message: `Lợi nhuận gộp giảm mạnh ${Math.abs(growths.profit).toFixed(1)}% so với kỳ trước.`,
        cause: growths.cost > growths.revenue ? "Tốc độ tăng chi phí giá vốn (COGS) vượt quá tốc độ tăng doanh thu." : "Doanh thu bán món sụt giảm đột ngột."
      });
    }

    if (growths.cost > 8) {
      alertsList.push({
        title: "Chi phí giá vốn tăng đột biến",
        message: `Giá vốn nguyên vật liệu tăng vọt ${growths.cost.toFixed(1)}% so với kỳ trước.`,
        cause: "Biến động giá nguyên liệu thịt dê đầu vào tăng hoặc hao hụt khi kiểm kê kho bếp."
      });
    }

    const cancelledCount = reports.filter(r => r.status === "cancelled" && new Date(r.date) >= activeDateRange.start && new Date(r.date) <= activeDateRange.end).length;
    if (cancelledCount > 5) {
      alertsList.push({
        title: "Tỷ lệ hủy đơn đáng báo động",
        message: `Có tổng cộng ${cancelledCount} đơn hàng bị hủy trong kỳ này.`,
        cause: "Khách hàng hủy bàn muộn hoặc nhân viên thao tác nhầm lẫn trên hệ thống POS."
      });
    }

    return alertsList;
  }, [kpiStats, reports, activeDateRange]);

  // Export Excel
  const handleExportExcel = () => {
    const exportData = sortedReports.map((r, i) => ({
      "STT": i + 1,
      "Mã đơn": r.orderId,
      "Ngày giờ": new Date(r.date).toLocaleString("vi-VN"),
      "Khách hàng": r.customerName || "Khách lẻ",
      "SĐT": r.phone || "",
      "Nhân viên": r.staffName || "",
      "Bàn": r.tableCode || "",
      "Khu vực": r.area || "",
      "PT Thanh toán": r.paymentMethod === 'cash' ? 'Tiền mặt' : r.paymentMethod === 'bank' ? 'Chuyển khoản' : r.paymentMethod === 'qr' ? 'VietQR' : r.paymentMethod,
      "Tổng phụ": Number(r.subtotal || 0),
      "Giảm giá": Number(r.discount || 0),
      "Doanh thu thuần": Number(r.total || 0),
      "Giá vốn": Number(r.cost || 0),
      "Lợi nhuận": Number(r.profit || 0),
      "Lợi nhuận %": r.total > 0 ? ((r.profit / r.total) * 100).toFixed(1) + "%" : "0%",
      "Trạng thái": r.status === 'completed' || r.status === 'paid' ? 'Hoàn thành' : 'Đang xử lý'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    // Format money columns
    const moneyCols = [9, 10, 11, 12, 13];
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let row = 1; row <= range.e.r; row++) {
        moneyCols.forEach(col => {
          const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[cellAddr]) ws[cellAddr].z = '#,##0 "₫"';
        });
      }
    }

    ws['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCaoChiTiet");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `bao_cao_doanh_thu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  useEffect(() => {
    setExportExcelHandler(() => handleExportExcel);
    return () => setExportExcelHandler(null);
  }, [sortedReports]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["STT,Ma don,Ngay gio,Khach hang,SDT,Nhan vien,Ban,Khu vuc,Thanh toan,Tong phu,Giam gia,Doanh thu thuan,Gia von,Loi nhuan\n"];
    const rows = sortedReports.map((r, i) => {
      return `${i + 1},${r.orderId},"${new Date(r.date).toLocaleString("vi-VN")}",${r.customerName || "Khach le"},${r.phone || ""},${r.staffName || ""},${r.tableCode || ""},${r.area || ""},${r.paymentMethod},${r.subtotal},${r.discount},${r.total},${r.cost},${r.profit}\n`;
    });
    const blob = new Blob([headers.concat(rows).join("")], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `bao_cao_doanh_thu_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedReports.map(r => r.orderId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const PIE_COLORS = ["#0F5D3E", "#E9B949", "#3b82f6", "#ef4444"];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      <p className="text-sm font-bold text-gray-500">Đang tạo dữ liệu báo cáo chi tiết...</p>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-2xl border border-red-100">{error}</div>;

  return (
    <div className="space-y-6 bg-[#f8fafc] pb-10 print:bg-white print:p-0 print:pb-0">

      {/* 1. BỘ LỌC NÂNG CAO */}
      <section className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 print:hidden transition-all hover:shadow-[0_6px_25px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <h3 className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-2">
            <LayoutDashboard size={18} /> Bộ lọc báo cáo nâng cao
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="h-9 px-3.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-black text-xs flex items-center gap-1.5 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all shrink-0"
            >
              <RotateCcw size={14} /> Đặt lại bộ lọc
            </button>
            <div className="relative group">
              <button className="h-9 px-3.5 rounded-xl bg-primary text-white font-black text-xs flex items-center gap-1.5 hover:bg-primary-dark transition-all">
                <Download size={14} /> Xuất báo cáo <ChevronDown size={12} />
              </button>
              <div className="absolute right-0 top-10 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-2"><FileSpreadsheet size={14} className="text-green-600" /> Xuất Excel (.xlsx)</button>
                <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-2"><FileText size={14} className="text-blue-500" /> Xuất CSV (.csv)</button>
                <button onClick={handlePrint} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-2"><Printer size={14} className="text-gray-500" /> In báo cáo (PDF)</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 text-xs">
          {/* Thời gian */}
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Khoảng thời gian</label>
            <select
              value={timeRange}
              onChange={e => { setTimeRange(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 font-bold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="thisweek">Tuần này</option>
              <option value="thismonth">Tháng này</option>
              <option value="thisquarter">Quý này</option>
              <option value="thisyear">Năm nay</option>
              <option value="custom">Tùy chọn khoảng ngày</option>
            </select>
          </div>

          {/* So sánh */}
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">So sánh với</label>
            <select
              value={compareRange}
              onChange={e => setCompareRange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 font-bold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="previous">Kỳ trước liền kề</option>
              <option value="none">Không so sánh</option>
            </select>
          </div>

          {/* Loại đơn */}
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Loại đơn hàng</label>
            <select
              value={orderType}
              onChange={e => { setOrderType(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 font-bold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">Tất cả loại đơn</option>
              <option value="dine_in">Ăn tại quán</option>
              <option value="takeaway">Mang về</option>
              <option value="delivery">Giao hàng (Online)</option>
            </select>
          </div>

          {/* Phương thức thanh toán */}
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">PT Thanh toán</label>
            <select
              value={paymentMethod}
              onChange={e => { setPaymentMethod(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 font-bold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">Tất cả phương thức</option>
              <option value="cash">Tiền mặt</option>
              <option value="qr">Thanh toán VietQR</option>
              <option value="bank">Chuyển khoản khác</option>
              <option value="card">Thanh toán thẻ</option>
            </select>
          </div>

          {/* Trạng thái đơn */}
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Trạng thái thanh toán</label>
            <select
              value={paymentStatus}
              onChange={e => { setPaymentStatus(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 font-bold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="unpaid">Chưa thu đủ</option>
            </select>
          </div>

          {/* Khu vực */}
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Khu vực</label>
            <select
              value={areaFilter}
              onChange={e => { setAreaFilter(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 font-bold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">Tất cả khu vực</option>
              {uniqueFilterOptions.areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Nhân viên phục vụ */}
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Nhân viên phục vụ</label>
            <select
              value={staffFilter}
              onChange={e => { setStaffFilter(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 font-bold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">Tất cả nhân viên</option>
              {uniqueFilterOptions.staff.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Khoảng doanh thu */}
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Doanh thu từ</label>
              <input
                type="number"
                placeholder="Ví dụ: 100k"
                value={minRevenue}
                onChange={e => { setMinRevenue(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="w-1/2">
              <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Đến</label>
              <input
                type="number"
                placeholder="Ví dụ: 10M"
                value={maxRevenue}
                onChange={e => { setMaxRevenue(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Ô tìm kiếm văn bản */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Tìm theo văn bản</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Tìm mã hóa đơn, tên hoặc số điện thoại..."
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Lọc theo ngày tùy chọn */}
        {timeRange === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-gray-50 pt-4 text-xs animate-[fadeIn_0.2s_ease-out]">
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Chọn ngày bắt đầu</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase block mb-1.5">Chọn ngày kết thúc</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. KPI TỔNG QUAN */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Tổng đơn hàng" value={kpiStats.current.orders} isCurrency={false} growth={kpiStats.growths.orders} icon={ReceiptText} colorClass="bg-blue-50 text-blue-600" sparklineData={sparklineData.orders} unit=" đơn" />
        <KPICard title="Doanh thu" value={kpiStats.current.revenue} growth={kpiStats.growths.revenue} icon={Wallet} colorClass="bg-green-50 text-green-700" sparklineData={sparklineData.revenue} />
        <KPICard title="Giá vốn" value={kpiStats.current.cost} growth={kpiStats.growths.cost} icon={ArrowDownRight} colorClass="bg-orange-50 text-orange-600" sparklineData={sparklineData.cost} />
        <KPICard title="Lợi nhuận" value={kpiStats.current.profit} growth={kpiStats.growths.profit} icon={TrendingUp} colorClass="bg-purple-50 text-purple-600" sparklineData={sparklineData.profit} />

        <KPICard title="Lợi nhuận (%)" value={kpiStats.current.profitPercent} isCurrency={false} growth={kpiStats.growths.profitPercent} icon={Percent} colorClass="bg-red-50 text-red-500" sparklineData={sparklineData.profit} unit="%" />
        <KPICard title="Giá trị đơn trung bình" value={kpiStats.current.aov} growth={kpiStats.growths.aov} icon={ArrowUpRight} colorClass="bg-teal-50 text-teal-600" sparklineData={sparklineData.revenue} />
        <KPICard title="Tổng số khách" value={kpiStats.current.guests} isCurrency={false} growth={kpiStats.growths.guests} icon={Users} colorClass="bg-amber-50 text-amber-600" sparklineData={sparklineData.guests} unit=" khách" />
        <KPICard title="Tỷ lệ khách quay lại" value={kpiStats.current.returnRate} isCurrency={false} growth={kpiStats.growths.returnRate} icon={Users} colorClass="bg-rose-50 text-rose-500" sparklineData={sparklineData.guests} unit="%" />
      </section>

      {/* 3 + 4 + 5. CÁC KHỐI BIỂU ĐỒ PHÂN TÍCH */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Biểu đồ doanh thu chi tiết */}
        <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/70 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-primary">Biểu đồ doanh thu</h3>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">So sánh doanh thu thực tế và kỳ đối chiếu</p>
            </div>
            <div className="bg-gray-100 p-0.5 rounded-xl flex items-center shadow-inner print:hidden">
              {['hour', 'day', 'month'].map(p => {
                const labels = { hour: 'Giờ', day: 'Ngày', month: 'Tháng' };
                return (
                  <button
                    key={p}
                    onClick={() => setRevenueChartPeriod(p)}
                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${revenueChartPeriod === p ? 'bg-white text-green-700 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}>
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F5D3E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F5D3E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="key" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }} formatter={(val) => [formatVND(val)]} />
                <Area type="monotone" name="Doanh thu kỳ này" dataKey="revenue" stroke="#0F5D3E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                {compareRange !== "none" && (
                  <Line type="monotone" name="Kỳ đối chiếu" dataKey="compareRevenue" stroke="#E9B949" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                )}
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 'bold', paddingTop: 15 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ phương thức thanh toán */}
        <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/70">
          <h3 className="text-base font-black text-primary mb-1">Phương thức thanh toán</h3>
          <p className="text-xs font-semibold text-gray-400 mb-6">Tỷ trọng thanh toán theo doanh thu</p>
          <div className="h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentSplit}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={3} dataKey="value" stroke="none"
                  startAngle={90} endAngle={-270}
                >
                  {paymentSplit.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }} formatter={(val) => formatVND(val)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-primary leading-none">
                {formatVND(kpiStats.current.revenue)}
              </span>
              <span className="text-[10px] font-bold text-gray-400 mt-1">Đã đối soát</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4 max-h-[120px] overflow-y-auto font-bold text-xs text-gray-600">
            {paymentSplit.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                  <span>{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-primary font-black">{formatVND(item.value)}</span>
                  <span className="text-gray-400 font-extrabold ml-1.5">{item.pct.toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {paymentSplit.length === 0 && (
              <div className="text-center py-6 text-gray-400 font-bold">Chưa phát sinh giao dịch</div>
            )}
          </div>
        </div>

        {/* Biểu đồ lợi nhuận thực tế (Doanh thu - Giá vốn - Lợi nhuận) */}
        <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/70 lg:col-span-3">
          <h3 className="text-base font-black text-primary mb-1">Cơ cấu Lợi nhuận gộp</h3>
          <p className="text-xs font-semibold text-gray-400 mb-6">Trực quan hóa doanh số, giá vốn nguyên liệu bếp và biên lợi nhuận thu về</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="key" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }} formatter={(val) => [formatVND(val)]} />
                <Bar name="Doanh thu" dataKey="revenue" fill="#0F5D3E" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar name="Giá vốn (COGS)" dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar name="Lợi nhuận" dataKey="profit" fill="#E9B949" radius={[4, 4, 0, 0]} barSize={16} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 'bold', paddingTop: 15 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 6 + 7 + 9. TOP MÓN ĂN, TOP KHÁCH HÀNG, HIỆU QUẢ KHU VỰC */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top món bán chạy */}
        <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/70">
          <h3 className="text-base font-black text-primary mb-1">Món ăn bán chạy</h3>
          <p className="text-xs font-semibold text-gray-400 mb-6">Thống kê theo số lượng bán ra bếp lò</p>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {topSellingItems.map((item, idx) => (
              <div key={item.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 shrink-0 font-extrabold">{idx + 1}</span>
                    <span className="truncate max-w-[140px] font-black">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 font-extrabold">{item.qty} suất</span>
                    <span className="text-primary font-black ml-2">{formatVND(item.revenue)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-0.5">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
            {topSellingItems.length === 0 && (
              <div className="text-center py-16 text-gray-400 font-bold">Chưa có thông tin đặt món</div>
            )}
          </div>
        </div>

        {/* Top khách hàng thân thiết */}
        <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/70">
          <h3 className="text-base font-black text-primary mb-1">Khách hàng tiêu biểu</h3>
          <p className="text-xs font-semibold text-gray-400 mb-6">Tích lũy chi tiêu và số lượt ghé quán</p>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {topCustomers.map((cust, idx) => (
              <div key={cust.name} className="flex items-center justify-between gap-3 text-xs font-bold text-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-black border border-green-100 shadow-sm shrink-0">
                    {cust.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black">{cust.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{cust.ordersCount} đơn hàng</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-primary font-black">{formatVND(cust.totalSpending)}</p>
                  <p className="text-[10px] text-amber-500 font-extrabold mt-0.5">{cust.points} Điểm tích lũy</p>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <div className="text-center py-16 text-gray-400 font-bold">Chưa có thông tin khách hàng</div>
            )}
          </div>
        </div>

        {/* Hiệu quả khu vực */}
        <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/70">
          <h3 className="text-base font-black text-primary mb-1">Hiệu suất khu vực</h3>
          <p className="text-xs font-semibold text-gray-400 mb-6">Đóng góp doanh thu của các khu vực trong quán</p>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {areaPerformance.map((area, idx) => (
              <div key={area.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span className="font-black">{area.name}</span>
                  <div className="text-right">
                    <span className="text-gray-400 font-semibold">{area.orders} hóa đơn</span>
                    <span className="text-primary font-black ml-3">{formatVND(area.revenue)}</span>
                    <span className="text-amber-500 font-extrabold ml-1.5">({area.pct.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-0.5">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${area.pct}%` }}></div>
                </div>
              </div>
            ))}
            {areaPerformance.length === 0 && (
              <div className="text-center py-16 text-gray-400 font-bold">Chưa phát sinh khu vực</div>
            )}
          </div>
        </div>
      </section>

      {/* 8. HIỆU SUẤT NHÂN VIÊN PHỤC VỤ (BẢNG) */}
      <section className="bg-white p-4 sm:p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100">
        <h3 className="text-sm sm:text-base font-black text-primary mb-1">Hiệu suất bán hàng của Nhân viên</h3>
        <p className="text-xs font-semibold text-gray-400 mb-4">Tính toán doanh số, lợi nhuận gộp và mức trích hoa hồng (1.5%) hỗ trợ</p>

        {/* MOBILE CARDS (< sm) */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {staffSalesPerformance.map(staff => (
            <div key={staff.name} className="py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{staff.name.slice(0, 1)}</div>
                  <span className="font-black text-xs text-gray-800">{staff.name}</span>
                </div>
                <span className="text-xs font-black text-gray-500">{staff.orders} đơn</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-2 rounded-xl text-[11px]">
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">Doanh thu</span>
                  <span className="font-black text-gray-800">{formatVND(staff.revenue)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">Lợi nhuận</span>
                  <span className="font-black text-primary">{formatVND(staff.profit)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">Hoa hồng</span>
                  <span className="font-black text-amber-600">{formatVND(staff.commission)}</span>
                </div>
              </div>
            </div>
          ))}
          {staffSalesPerformance.length === 0 && (
            <div className="py-6 text-center text-xs text-gray-400 font-bold">Không có dữ liệu nhân viên phục vụ</div>
          )}
        </div>

        {/* DESKTOP TABLE (>= sm) */}
        <div className="hidden sm:block overflow-x-auto text-xs font-bold text-gray-700">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-black uppercase text-[10px]">
                <th className="px-5 py-3">Nhân viên</th>
                <th className="px-5 py-3 text-center">Số hóa đơn</th>
                <th className="px-5 py-3 text-right">Doanh thu mang về</th>
                <th className="px-5 py-3 text-right text-primary">Lợi nhuận gộp</th>
                <th className="px-5 py-3 text-right text-amber-600">Hoa hồng (1.5%)</th>
              </tr>
            </thead>
            <tbody>
              {staffSalesPerformance.map(staff => (
                <tr key={staff.name} className="border-t border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-5 py-3.5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">{staff.name.slice(0, 1)}</div>
                    <span className="font-black text-gray-800">{staff.name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-extrabold text-gray-500">{staff.orders} đơn</td>
                  <td className="px-5 py-3.5 text-right font-black text-gray-800">{formatVND(staff.revenue)}</td>
                  <td className="px-5 py-3.5 text-right font-black text-primary">{formatVND(staff.profit)}</td>
                  <td className="px-5 py-3.5 text-right font-black text-amber-600">{formatVND(staff.commission)}</td>
                </tr>
              ))}
              {staffSalesPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">Không có dữ liệu nhân viên phục vụ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 11 + 12 + 13. SO SÁNH DỮ LIỆU, AI INSIGHTS & CẢNH BÁO */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* So sánh kỳ này vs kỳ trước */}
        <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-primary mb-1">So sánh với kỳ đối chiếu</h3>
            <p className="text-xs font-semibold text-gray-400 mb-5">Độ lệch % so với kỳ thời gian liền kề trước đó</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-2xl flex flex-col justify-between h-[80px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Doanh thu</span>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-base font-black ${kpiStats.growths.revenue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {kpiStats.growths.revenue >= 0 ? "+" : ""}{kpiStats.growths.revenue.toFixed(1)}%
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: kpiStats.growths.revenue >= 0 ? "#10b981" : "#ef4444" }}></span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl flex flex-col justify-between h-[80px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Lợi nhuận</span>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-base font-black ${kpiStats.growths.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {kpiStats.growths.profit >= 0 ? "+" : ""}{kpiStats.growths.profit.toFixed(1)}%
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: kpiStats.growths.profit >= 0 ? "#10b981" : "#ef4444" }}></span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl flex flex-col justify-between h-[80px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Đơn hàng</span>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-base font-black ${kpiStats.growths.orders >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {kpiStats.growths.orders >= 0 ? "+" : ""}{kpiStats.growths.orders.toFixed(1)}%
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: kpiStats.growths.orders >= 0 ? "#10b981" : "#ef4444" }}></span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl flex flex-col justify-between h-[80px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Số lượng khách</span>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-base font-black ${kpiStats.growths.guests >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {kpiStats.growths.guests >= 0 ? "+" : ""}{kpiStats.growths.guests.toFixed(1)}%
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: kpiStats.growths.guests >= 0 ? "#10b981" : "#ef4444" }}></span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight tự động */}
        <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100">
          <h3 className="text-base font-black text-primary mb-1">Nhận xét tự động (AI Insights)</h3>
          <p className="text-xs font-semibold text-gray-400 mb-5">Được tổng hợp từ các chỉ số báo cáo bếp và thu ngân</p>
          <div className="space-y-3.5 max-h-[180px] overflow-y-auto">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="flex gap-2.5 text-xs font-bold text-gray-600 items-start">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <p>{insight}</p>
              </div>
            ))}
            {aiInsights.length === 0 && (
              <p className="text-xs text-gray-400 font-bold text-center py-8">Chưa đủ dữ liệu để tổng hợp nhận xét</p>
            )}
          </div>
        </div>

        {/* Cảnh báo tự động */}
        <div className="bg-white p-5 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100">
          <h3 className="text-base font-black text-red-600 mb-1 flex items-center gap-1.5">
            <AlertTriangle size={18} /> Cảnh báo rủi ro
          </h3>
          <p className="text-xs font-semibold text-gray-400 mb-5">Phát hiện bất thường và dấu hiệu suy giảm kinh doanh</p>
          <div className="space-y-4.5 max-h-[180px] overflow-y-auto">
            {alerts.map((alert, idx) => (
              <div key={idx} className="p-3 bg-red-50/60 border border-red-100 rounded-2xl text-xs font-bold text-red-700">
                <p className="font-black text-red-800">{alert.title}</p>
                <p className="text-[11px] text-red-600 font-bold mt-1">{alert.message}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-1.5">Nguyên nhân: {alert.cause}</p>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-emerald-600 font-black">
                <Check size={28} className="bg-emerald-100/50 p-1 rounded-full mb-1" />
                <p>Mọi chỉ số đều an toàn!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 10. BẢNG CHI TIẾT GIAO DỊCH */}
      <section className="bg-white rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-primary">Danh sách giao dịch chi tiết</h3>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">Hiển thị {sortedReports.length} dòng báo cáo phù hợp bộ lọc</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            {selectedIds.length > 0 && (
              <div className="bg-primary/5 text-primary border border-primary/20 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                Đang chọn {selectedIds.length} đơn
              </div>
            )}
          </div>
        </div>

        {/* MOBILE CARDS VIEW (< lg) */}
        <div className="block lg:hidden divide-y divide-gray-100">
          {paginatedReports.map((item) => {
            const isSelected = selectedIds.includes(item.orderId);
            return (
              <div key={item.orderId} className={`p-4 space-y-2.5 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(item.orderId)}
                      className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="font-black text-sm text-primary">#{item.orderId}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${item.paymentStatus === 'paid' || item.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200/50' : 'bg-orange-50 text-orange-700 border border-orange-200/50'}`}>
                    {item.paymentStatus === 'paid' || item.status === 'completed' ? 'Hoàn thành' : 'Chưa TT'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-gray-800 truncate">{item.customerName} {item.phone ? `(${item.phone})` : ""}</span>
                  <span className="text-gray-400 font-semibold">{item.tableCode ? `Bàn ${item.tableCode}` : ""} {item.area || ""}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Doanh thu</span>
                    <span className="font-black text-gray-800">{formatVND(item.total)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Giá vốn</span>
                    <span className="font-semibold text-gray-500">{formatVND(item.cost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Lợi nhuận</span>
                    <span className="font-black text-primary">{formatVND(item.profit)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                  <span>NV: <strong className="text-gray-700 font-bold">{item.staffName || "Hệ thống"}</strong></span>
                  <span>{new Date(item.date).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span>
                </div>
              </div>
            );
          })}
          {paginatedReports.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Search size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="font-black text-sm text-gray-500">Không tìm thấy báo cáo nào</p>
            </div>
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= lg) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left border-collapse table-layout-fixed">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wider font-black sticky top-0 z-10">
                <th className="w-[50px] px-5 py-4 text-center print:hidden">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginatedReports.length > 0 && selectedIds.length === paginatedReports.length}
                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                </th>
                <th onClick={() => toggleSort("orderId")} className="w-[120px] px-5 py-4 cursor-pointer hover:bg-gray-100/60 select-none">
                  Mã đơn {sortField === "orderId" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("date")} className="w-[160px] px-5 py-4 cursor-pointer hover:bg-gray-100/60 select-none">
                  Ngày Giờ {sortField === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="w-[160px] px-5 py-4">Khách hàng</th>
                <th className="w-[120px] px-5 py-4">SĐT</th>
                <th className="w-[120px] px-5 py-4">Nhân viên</th>
                <th className="w-[100px] px-5 py-4">Bàn</th>
                <th className="w-[110px] px-5 py-4">Khu vực</th>
                <th className="w-[110px] px-5 py-4">Thanh toán</th>
                <th onClick={() => toggleSort("total")} className="w-[130px] px-5 py-4 cursor-pointer hover:bg-gray-100/60 select-none text-right">
                  Doanh thu {sortField === "total" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("cost")} className="w-[120px] px-5 py-4 cursor-pointer hover:bg-gray-100/60 select-none text-right">
                  Giá vốn {sortField === "cost" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("profit")} className="w-[130px] px-5 py-4 cursor-pointer hover:bg-gray-100/60 select-none text-right text-primary">
                  Lợi nhuận {sortField === "profit" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="w-[100px] px-5 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-bold text-gray-600">
              {paginatedReports.map((item, idx) => {
                const isSelected = selectedIds.includes(item.orderId);
                return (
                  <tr key={item.orderId} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/10'}`}>
                    <td className="px-5 py-3.5 text-center print:hidden">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(item.orderId)}
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-black text-primary">#{item.orderId}</td>
                    <td className="px-5 py-3.5 text-gray-500 font-semibold">{new Date(item.date).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                    <td className="px-5 py-3.5 text-gray-800 font-black">{item.customerName}</td>
                    <td className="px-5 py-3.5 text-gray-500 font-semibold">{item.phone || "-"}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-bold">{item.staffName}</td>
                    <td className="px-5 py-3.5 text-gray-700">{item.tableCode || "-"}</td>
                    <td className="px-5 py-3.5 text-gray-700">{item.area}</td>
                    <td className="px-5 py-3.5 text-gray-600">{item.paymentMethod === 'cash' ? 'Tiền mặt' : item.paymentMethod === 'bank' ? 'Chuyển khoản' : item.paymentMethod === 'qr' ? 'VietQR' : item.paymentMethod || 'Khác'}</td>
                    <td className="px-5 py-3.5 text-right font-black text-gray-800">{formatVND(item.total)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-500">{formatVND(item.cost)}</td>
                    <td className="px-5 py-3.5 text-right font-black text-primary">{formatVND(item.profit)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[90px] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.paymentStatus === 'paid' || item.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200/50' : 'bg-orange-50 text-orange-700 border border-orange-200/50'}`}>
                        {item.paymentStatus === 'paid' || item.status === 'completed' ? 'Hoàn thành' : 'Chưa thanh toán'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {paginatedReports.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={40} className="text-gray-200 mb-3" />
                      <p className="font-black text-base text-gray-500">Không tìm thấy báo cáo nào phù hợp</p>
                      <p className="text-xs font-semibold text-gray-400 mt-1">Vui lòng điều chỉnh lại bộ lọc nâng cao</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {filteredReports.length > 0 && (
          <div className="border-t border-gray-100 print:hidden">
            <GlobalPagination
              total={filteredReports.length}
              page={currentPage}
              limit={pageSize}
              onPageChange={setCurrentPage}
              onLimitChange={setPageSize}
              limitOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </section>

    </div>
  );
}

export default AdminReportPage;
