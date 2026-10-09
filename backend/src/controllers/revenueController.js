const db = require("../config/db");

const getLocalDate = (d = new Date()) => {
  const date = new Date(d);
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseJson = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const today = getLocalDate();
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterday = getLocalDate(yesterdayDate);

    const [orders] = await db.query(
      `SELECT id, total, status, DATE(created_at) as date
       FROM orders
       WHERE status = 'paid' OR status = 'completed' OR payment_status = 'paid'`
    );

    const [bookings] = await db.query(
      `SELECT id, total, status, DATE(created_at) as date, cart_items
       FROM bookings
       WHERE deleted_at IS NULL AND (status = 'completed' OR payment_status = 'paid')`
    );

    // Fetch all menu items for booking cost lookup
    const [menuItems] = await db.query("SELECT id, code, name, cost_price FROM menu_items");
    const menuMap = {};
    menuItems.forEach((mi) => {
      if (mi.code) menuMap[String(mi.code).toLowerCase()] = mi;
      if (mi.id) menuMap[String(mi.id)] = mi;
      if (mi.name) menuMap[String(mi.name).toLowerCase()] = mi;
    });

    let todayRevenue = 0;
    let yesterdayRevenue = 0;
    let todayOrdersCount = 0;
    let todayIds = [];
    let todayBookingCost = 0;

    orders.forEach(order => {
      const orderDate = order.date;
      if (orderDate === today) {
        todayRevenue += Number(order.total || 0);
        todayOrdersCount++;
        todayIds.push(order.id);
      } else if (orderDate === yesterday) {
        yesterdayRevenue += Number(order.total || 0);
      }
    });

    bookings.forEach(b => {
      const bDate = b.date;
      if (bDate === today) {
        todayRevenue += Number(b.total || 0);
        todayOrdersCount++;

        // Calculate cost for this booking
        const cartItems = parseJson(b.cart_items, []);
        cartItems.forEach(item => {
          const itemKey = String(item.id || item.code || item.name || '').toLowerCase();
          const matched = menuMap[itemKey];
          const cost = matched ? Number(matched.cost_price || 0) : 0;
          todayBookingCost += cost * Number(item.qty || 0);
        });
      } else if (bDate === yesterday) {
        yesterdayRevenue += Number(b.total || 0);
      }
    });

    let todayOrderCost = 0;
    if (todayIds.length > 0) {
      const [items] = await db.query(
        `SELECT unit_cost, qty FROM order_items WHERE order_id IN (?)`,
        [todayIds]
      );
      items.forEach(item => {
        todayOrderCost += Number(item.unit_cost || 0) * Number(item.qty || 1);
      });
    }

    const todayCost = todayOrderCost + todayBookingCost;
    const todayGrossProfit = todayRevenue - todayCost;
    const aov = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;
    const compareYesterday = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        todayRevenue,
        yesterdayRevenue,
        todayOrdersCount,
        todayGrossProfit,
        aov,
        compareYesterday
      }
    });
  } catch (error) {
    console.error("Lỗi lấy dashboard stats:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getRevenueChart = async (req, res) => {
  try {
    const days = 7;
    const [orders] = await db.query(
      `SELECT total, DATE(created_at) as date
       FROM orders
       WHERE (status = 'paid' OR status = 'completed' OR payment_status = 'paid')
         AND created_at >= DATE(NOW() - INTERVAL ? DAY)`,
      [days]
    );

    const [bookings] = await db.query(
      `SELECT total, DATE(created_at) as date
       FROM bookings
       WHERE deleted_at IS NULL AND (status = 'completed' OR payment_status = 'paid')
         AND created_at >= DATE(NOW() - INTERVAL ? DAY)`,
      [days]
    );

    const chartMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = getLocalDate(Date.now() - i * 86400000);
      chartMap[d] = 0;
    }

    orders.forEach(order => {
      if (chartMap[order.date] !== undefined) {
        chartMap[order.date] += Number(order.total || 0);
      }
    });

    bookings.forEach(b => {
      if (chartMap[b.date] !== undefined) {
        chartMap[b.date] += Number(b.total || 0);
      }
    });

    const labels = Object.keys(chartMap).map(d => {
      const parts = d.split('-');
      return `${parts[2]}/${parts[1]}`;
    });
    const values = Object.values(chartMap);

    res.json({
      success: true,
      data: {
        labels,
        datasets: [{ label: 'Doanh thu', data: values }]
      }
    });
  } catch (error) {
    console.error("Lỗi lấy revenue chart:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
exports.getDetailedReport = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT id, order_code, customer_name, phone, email, service_type, table_code, guests, payment_method, status, payment_status, subtotal, discount_total, coupon_discount_total, total, created_at
       FROM orders
       WHERE status != 'cancelled'
       ORDER BY created_at DESC`
    );

    const [bookings] = await db.query(
      `SELECT id, booking_code AS order_code, customer_name, phone, email, type AS service_type, selected_table AS table_code, guests, payment_method, status, payment_status, subtotal, discount_amount AS discount_total, total, created_at, created_by, selected_area_title, cart_items
       FROM bookings
       WHERE deleted_at IS NULL AND status != 'cancelled'
       ORDER BY created_at DESC`
    );

    // Fetch all menu items for booking cost lookup
    const [menuItems] = await db.query("SELECT id, code, name, cost_price FROM menu_items");
    const menuMap = {};
    menuItems.forEach((mi) => {
      if (mi.code) menuMap[String(mi.code).toLowerCase()] = mi;
      if (mi.id) menuMap[String(mi.id)] = mi;
      if (mi.name) menuMap[String(mi.name).toLowerCase()] = mi;
    });

    let orderItems = [];
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const [items] = await db.query(
        `SELECT order_id, name, unit_cost, price, qty FROM order_items WHERE order_id IN (?)`,
        [orderIds]
      );
      orderItems = items;
    }

    const orderItemsMap = orderItems.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push({
        name: item.name,
        price: Number(item.price || 0),
        qty: Number(item.qty || 1),
        unitCost: Number(item.unit_cost || 0)
      });
      return acc;
    }, {});

    const mappedOrders = orders.map(o => {
      const cartItems = orderItemsMap[o.id] || [];
      let cost = 0;
      cartItems.forEach(item => {
        cost += Number(item.unitCost || 0) * Number(item.qty || 1);
      });
      const netRevenue = Number(o.total || 0);
      const profit = netRevenue - cost;
      let area = "Online";
      if (o.table_code) {
        area = o.table_code.includes("-") ? o.table_code.split("-")[0].trim() : o.table_code;
      }
      return {
        orderId: o.order_code,
        customerName: o.customer_name || "Khách lẻ",
        phone: o.phone || "",
        email: o.email || "",
        date: o.created_at,
        paymentMethod: o.payment_method || "cash",
        status: o.status,
        paymentStatus: o.payment_status,
        subtotal: Number(o.subtotal || 0),
        discount: Number(o.discount_total || 0) + Number(o.coupon_discount_total || 0),
        total: netRevenue,
        cost: cost,
        profit: profit,
        serviceType: o.service_type || "takeaway",
        tableCode: o.table_code || "",
        area: area,
        guests: Number(o.guests || 1),
        staffName: "Hệ thống",
        cartItems: cartItems
      };
    });

    const mappedBookings = bookings.map(b => {
      const dbCartItems = parseJson(b.cart_items, []);
      const cartItems = dbCartItems.map(item => {
        const itemKey = String(item.id || item.code || item.name || '').toLowerCase();
        const matched = menuMap[itemKey];
        const cost = matched ? Number(matched.cost_price || 0) : 0;
        return {
          name: item.name || "",
          price: Number(item.price || 0),
          qty: Number(item.qty || 1),
          unitCost: cost
        };
      });

      let cost = 0;
      cartItems.forEach(item => {
        cost += item.unitCost * item.qty;
      });

      const netRevenue = Number(b.total || 0);
      const profit = netRevenue - cost;
      return {
        orderId: b.order_code || `DB${b.id}`,
        customerName: b.customer_name || "Khách lẻ",
        phone: b.phone || "",
        email: b.email || "",
        date: b.created_at,
        paymentMethod: b.payment_method || 'cash',
        status: b.status,
        paymentStatus: b.payment_status || 'unpaid',
        subtotal: Number(b.subtotal || 0),
        discount: Number(b.discount_total || 0),
        total: netRevenue,
        cost: cost,
        profit: profit,
        serviceType: b.service_type || "dine_in",
        tableCode: b.table_code || "",
        area: b.selected_area_title || "Sảnh chính",
        guests: Number(b.guests || 1),
        staffName: b.created_by || "Lễ tân",
        cartItems: cartItems
      };
    });

    const reportData = [...mappedOrders, ...mappedBookings].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error("Lỗi lấy detailed report:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
const calcPct = (val, total) => total > 0 ? (val / total * 100).toFixed(1) : "0.0";

exports.getAdvancedDashboardData = async (req, res) => {
  try {
    const { timeRange, startDate, endDate, orderType, payment, space } = req.query;

    let timeWhere = "1=1";
    let compareWhere = "1=0";
    let pastDays = 0;

    const now = new Date();
    const todayStr = getLocalDate(now);

    if (timeRange === 'today') {
      timeWhere = `DATE(created_at) = '${todayStr}'`;
      const y = getLocalDate(now.getTime() - 86400000);
      compareWhere = `DATE(created_at) = '${y}'`;
      pastDays = 1;
    } else if (timeRange === '7days') {
      timeWhere = `DATE(created_at) >= DATE(NOW() - INTERVAL 7 DAY)`;
      compareWhere = `DATE(created_at) >= DATE(NOW() - INTERVAL 14 DAY) AND DATE(created_at) < DATE(NOW() - INTERVAL 7 DAY)`;
      pastDays = 7;
    } else if (timeRange === 'thismonth') {
      timeWhere = `MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`;
      compareWhere = `MONTH(created_at) = MONTH(NOW() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(NOW() - INTERVAL 1 MONTH)`;
      pastDays = 30;
    } else if (timeRange === 'custom' && startDate && endDate) {
      timeWhere = `DATE(created_at) >= '${startDate}' AND DATE(created_at) <= '${endDate}'`;
    } else {
      timeWhere = `DATE(created_at) >= DATE(NOW() - INTERVAL 7 DAY)`;
      compareWhere = `DATE(created_at) >= DATE(NOW() - INTERVAL 14 DAY) AND DATE(created_at) < DATE(NOW() - INTERVAL 7 DAY)`;
      pastDays = 7;
    }

    // Xây dựng bộ lọc cho orders
    let orderFilter = "1=1";
    if (orderType && orderType !== 'all') {
      orderFilter += orderType === 'online' ? ` AND service_type = 'delivery'` : ` AND service_type != 'delivery'`;
    }
    if (payment && payment !== 'all') {
      orderFilter += payment === 'cash' ? ` AND payment_method = 'cash'` : ` AND payment_method != 'cash'`;
    }
    if (space && space !== 'all') {
      orderFilter += ` AND table_code LIKE '%${space}%'`;
    }

    // Xây dựng bộ lọc cho bookings
    let bookingFilter = "1=1";
    if (orderType && orderType !== 'all') {
      bookingFilter += orderType === 'online' ? ` AND 1=0` : ` AND 1=1`; // Booking always is dine-in
    }
    if (payment && payment !== 'all') {
      bookingFilter += payment === 'cash' ? ` AND payment_method = 'cash'` : ` AND payment_method != 'cash'`;
    }
    if (space && space !== 'all') {
      bookingFilter += ` AND selected_table LIKE '%${space}%'`;
    }

    const baseOrderWhere = `(status = 'paid' OR status = 'completed' OR payment_status = 'paid') AND ${orderFilter}`;
    const baseBookingWhere = `deleted_at IS NULL AND (status = 'completed' OR payment_status = 'paid') AND ${bookingFilter}`;

    // Query orders
    const [currentOrders] = await db.query(`
      SELECT id, total, subtotal, discount_total, coupon_discount_total, payment_method, service_type, table_code, order_code, customer_name, created_at, status, payment_status
      FROM orders
      WHERE ${baseOrderWhere} AND ${timeWhere}
      ORDER BY created_at DESC
    `);

    const [compareOrders] = await db.query(`
      SELECT total, subtotal, discount_total, coupon_discount_total
      FROM orders
      WHERE ${baseOrderWhere} AND ${compareWhere}
    `);

    // Query bookings
    const [currentBookings] = await db.query(`
      SELECT id, total, subtotal, discount_amount AS discount_total, 0 AS coupon_discount_total, payment_method, 'dine_in' AS service_type, selected_table AS table_code, booking_code AS order_code, customer_name, created_at, status, payment_status, cart_items
      FROM bookings
      WHERE ${baseBookingWhere} AND ${timeWhere}
      ORDER BY created_at DESC
    `);

    const [compareBookings] = await db.query(`
      SELECT total, subtotal, discount_amount AS discount_total
      FROM bookings
      WHERE ${baseBookingWhere} AND ${compareWhere}
    `);

    // Fetch all menu items for booking cost lookup
    const [menuItems] = await db.query("SELECT id, code, name, cost_price FROM menu_items");
    const menuMap = {};
    menuItems.forEach((mi) => {
      if (mi.code) menuMap[String(mi.code).toLowerCase()] = mi;
      if (mi.id) menuMap[String(mi.id)] = mi;
      if (mi.name) menuMap[String(mi.name).toLowerCase()] = mi;
    });

    const currentOrdersMapped = currentOrders.map(o => ({
      id: o.id,
      dbTable: 'orders',
      total: Number(o.total || 0),
      subtotal: Number(o.subtotal || 0),
      discount: Number(o.discount_total || 0) + Number(o.coupon_discount_total || 0),
      paymentMethod: o.payment_method,
      serviceType: o.service_type,
      tableCode: o.table_code,
      orderCode: o.order_code,
      customerName: o.customer_name,
      createdAt: o.created_at,
      status: o.status,
      paymentStatus: o.payment_status,
      cartItems: null
    }));

    const currentBookingsMapped = currentBookings.map(b => ({
      id: b.id,
      dbTable: 'bookings',
      total: Number(b.total || 0),
      subtotal: Number(b.subtotal || 0),
      discount: Number(b.discount_total || 0),
      paymentMethod: b.payment_method,
      serviceType: b.service_type,
      tableCode: b.table_code,
      orderCode: b.order_code,
      customerName: b.customer_name,
      createdAt: b.created_at,
      status: b.status,
      paymentStatus: b.payment_status,
      cartItems: parseJson(b.cart_items, [])
    }));

    const allTransactions = [...currentOrdersMapped, ...currentBookingsMapped].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    let totalRevenue = 0, totalDiscount = 0, cashRev = 0, bankRev = 0;
    let onlineOrders = 0, tableOrders = 0;

    allTransactions.forEach(t => {
      const rev = t.total;
      totalRevenue += rev;
      totalDiscount += t.discount;
      if (t.paymentMethod === 'cash') cashRev += rev; else bankRev += rev;

      const type = (t.serviceType || "").toLowerCase();
      if (type === 'delivery' || type === 'online') onlineOrders++; else tableOrders++;
    });

    const totalOrdersCount = allTransactions.length;
    const aov = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    // Tính tổng giá vốn từ booking cart_items
    let totalBookingCost = 0;
    currentBookingsMapped.forEach(b => {
      b.cartItems.forEach(item => {
        const itemKey = String(item.id || item.code || item.name || '').toLowerCase();
        const matched = menuMap[itemKey];
        const cost = matched ? Number(matched.cost_price || 0) : 0;
        totalBookingCost += cost * Number(item.qty || 0);
      });
    });

    // Tính giá vốn từ order_items
    let totalOrderCost = 0;
    if (currentOrders.length > 0) {
      const [costItems] = await db.query(
        `SELECT unit_cost, qty FROM order_items WHERE order_id IN (?)`,
        [currentOrders.map(o => o.id)]
      );
      costItems.forEach(item => {
        totalOrderCost += Number(item.unit_cost || 0) * Number(item.qty || 1);
      });
    }
    const totalCost = Math.round(totalBookingCost + totalOrderCost);
    const grossProfit = Math.round(totalRevenue - totalCost);
    const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

    let compRev = 0, compOrders = 0, compAov = 0, compDiscount = 0;
    compareOrders.forEach(o => {
      compRev += Number(o.total || 0);
      compDiscount += Number(o.discount_total || 0) + Number(o.coupon_discount_total || 0);
    });
    compareBookings.forEach(b => {
      compRev += Number(b.total || 0);
      compDiscount += Number(b.discount_total || 0);
    });
    compOrders = compareOrders.length + compareBookings.length;
    compAov = compOrders > 0 ? compRev / compOrders : 0;

    const calcGrowth = (cur, prev) => prev > 0 ? ((cur - prev) / prev * 100) : 0;

    // Build chartData
    const chartMap = {};
    if (pastDays > 0 && pastDays <= 31) {
      for (let i = pastDays - 1; i >= 0; i--) {
        const d = getLocalDate(Date.now() - i * 86400000);
        chartMap[d] = 0;
      }
    }
    const dailyChartMap = { ...chartMap };
    allTransactions.forEach(t => {
      const d = getLocalDate(t.createdAt);
      if (dailyChartMap[d] !== undefined) {
        dailyChartMap[d] += t.total;
      } else {
        dailyChartMap[d] = t.total;
      }
    });

    const dailyCostMap = { ...chartMap };
    const chartData = Object.keys(dailyChartMap).sort().map(d => {
      const parts = d.split('-');
      const cost = Math.round(dailyCostMap[d] || 0);
      const revenue = Math.round(dailyChartMap[d] || 0);
      return {
        date: `${parts[2]}/${parts[1]}`,
        revenue,
        cost,
        profit: revenue - cost
      };
    });

    // Top selling items
    const itemQuantities = {};
    if (currentOrders.length > 0) {
      const [orderItems] = await db.query(`
        SELECT name, qty FROM order_items WHERE order_id IN (?)
      `, [currentOrders.map(o => o.id)]);
      orderItems.forEach(oi => {
        const name = oi.name || 'Món không tên';
        itemQuantities[name] = (itemQuantities[name] || 0) + Number(oi.qty || 0);
      });
    }

    currentBookingsMapped.forEach(b => {
      b.cartItems.forEach(item => {
        const name = item.name || 'Món không tên';
        itemQuantities[name] = (itemQuantities[name] || 0) + Number(item.qty || 0);
      });
    });

    const topItems = Object.keys(itemQuantities)
      .map(name => ({ name, quantity: itemQuantities[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Space/Area revenue
    const spaceMap = {};
    allTransactions.forEach(t => {
      let spaceName = "Khác";
      if (t.tableCode && t.tableCode.includes("-")) {
        spaceName = t.tableCode.split("-")[0].trim();
      } else if (t.serviceType === 'delivery' || t.serviceType === 'online') {
        spaceName = "Giao hàng";
      } else if (t.serviceType === 'takeaway') {
        spaceName = "Mang về";
      } else if (t.tableCode) {
        spaceName = t.tableCode;
      }
      if (!spaceMap[spaceName]) spaceMap[spaceName] = 0;
      spaceMap[spaceName] += t.total;
    });

    const spaceRevenue = Object.keys(spaceMap).map(key => ({
      name: key,
      revenue: spaceMap[key],
      pct: calcPct(spaceMap[key], totalRevenue)
    })).sort((a, b) => b.revenue - a.revenue);

    const recentTransactions = allTransactions.map(t => ({
      orderId: t.orderCode || `DB${t.id}`,
      customerName: t.customerName || "Khách lẻ",
      orderType: (t.serviceType === 'delivery' || t.serviceType === 'online') ? 'Online' : 'Tại bàn',
      area: t.tableCode || (t.serviceType === 'takeaway' ? "Mang về" : "Giao hàng"),
      total: t.total,
      discount: t.discount,
      paymentMethod: t.paymentMethod === 'cash' ? 'Tiền mặt' : 'VietQR',
      time: t.createdAt
    }));

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue: { value: Math.round(totalRevenue), growth: calcGrowth(totalRevenue, compRev) },
          orders: { value: totalOrdersCount, growth: calcGrowth(totalOrdersCount, compOrders) },
          aov: { value: Math.round(aov), growth: calcGrowth(aov, compAov) },
          discount: { value: Math.round(totalDiscount), growth: calcGrowth(totalDiscount, compDiscount) },
          totalCost: { value: totalCost },
          grossProfit: { value: grossProfit, margin: Math.round(grossMargin * 10) / 10 }
        },
        paymentSplit: {
          cash: { value: Math.round(cashRev), pct: calcPct(cashRev, totalRevenue) },
          transfer: { value: Math.round(bankRev), pct: calcPct(bankRev, totalRevenue) }
        },
        orderTypeSplit: {
          online: { value: onlineOrders, pct: calcPct(onlineOrders, totalOrdersCount) },
          table: { value: tableOrders, pct: calcPct(tableOrders, totalOrdersCount) }
        },
        chartData,
        topItems,
        spaceRevenue: spaceRevenue.map(s => ({ ...s, revenue: Math.round(s.revenue) })),
        recentTransactions: recentTransactions.map(t => ({ ...t, total: Math.round(t.total), discount: Math.round(t.discount) }))
      }
    });
  } catch (error) {
    console.error("Lỗi getAdvancedDashboardData:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
