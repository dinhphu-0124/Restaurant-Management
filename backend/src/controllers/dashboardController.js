const db = require("../config/db");

function parseJson(value, fallback = []) {
  if (!value) return fallback;
  try {
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Lấy toàn bộ số liệu thống kê Dashboard tổng quan
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Thực hiện các truy vấn đếm cơ bản song song (Parallel execution)
    const [
      [[{ totalUsers }]],
      [[{ totalOrders }]],
      [[{ totalBookings }]],
      [[{ orderRevenue }]],
      [[{ bookingRevenue }]],
      [[{ totalBookingGuests }]],
      [[{ activeMenuItems }]],
      [orderStatuses],
      [latestOrderRows],
      [latestBookingRows],
      [bestFoodRows],
      [menuItems]
    ] = await Promise.all([
      db.query("SELECT COUNT(*) AS totalUsers FROM users WHERE deleted_at IS NULL AND role = 'user'"),
      db.query("SELECT COUNT(*) AS totalOrders FROM orders"),
      db.query("SELECT COUNT(*) AS totalBookings FROM bookings WHERE deleted_at IS NULL"),
      db.query("SELECT COALESCE(SUM(total), 0) AS orderRevenue FROM orders WHERE (status = 'paid' OR status = 'completed' OR payment_status = 'paid')"),
      db.query("SELECT COALESCE(SUM(total), 0) AS bookingRevenue FROM bookings WHERE deleted_at IS NULL AND (status = 'completed' OR payment_status = 'paid')"),
      db.query("SELECT COALESCE(SUM(guests), 0) AS totalBookingGuests FROM bookings WHERE deleted_at IS NULL AND status != 'cancelled'"),
      db.query("SELECT COUNT(*) AS activeMenuItems FROM menu_items WHERE status = 'selling'"),
      db.query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status"),
      db.query("SELECT order_code AS id, customer_name AS customerName, total, status, created_at AS createdAt, phone FROM orders ORDER BY created_at DESC LIMIT 5"),
      db.query("SELECT id, customer_name AS customerName, phone, booking_time AS time, selected_area_title AS selectedAreaTitle, selected_table AS selectedTable, status FROM bookings WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 4"),
      db.query("SELECT id, name, image, sold AS qty, price FROM menu_items WHERE status = 'selling' ORDER BY sold DESC LIMIT 5"),
      db.query("SELECT mi.id, mi.code, mi.name, mi.cost_price, c.name AS category_name FROM menu_items mi LEFT JOIN categories c ON c.id = mi.category_id")
    ]);

    const totalRevenue = Number(orderRevenue) + Number(bookingRevenue);

    const orderStatusBreakdown = {
      pending: 0,
      preparing: 0,
      delivering: 0,
      completed: 0,
      cancelled: 0,
    };
    orderStatuses.forEach((row) => {
      const status = row.status || "pending";
      if (Object.prototype.hasOwnProperty.call(orderStatusBreakdown, status)) {
        orderStatusBreakdown[status] = row.count;
      }
    });

    const menuMap = {};
    menuItems.forEach((mi) => {
      if (mi.code) menuMap[String(mi.code).toLowerCase()] = mi;
      if (mi.id) menuMap[String(mi.id)] = mi;
      if (mi.name) menuMap[String(mi.name).toLowerCase()] = mi;
    });

    // 10. Lấy toàn bộ đơn hàng và lịch đặt để tính toán biểu đồ theo mốc thời gian
    const [orders] = await db.query(
      "SELECT id, order_code, total, subtotal, shipping_fee, discount_total, coupon_discount_total, status, payment_status, created_at, raw_data FROM orders ORDER BY created_at ASC",
    );
    const [bookings] = await db.query(
      "SELECT id, booking_code, total, guests, status, payment_status, booking_date, created_at, cart_items, discount_amount FROM bookings WHERE deleted_at IS NULL ORDER BY created_at ASC",
    );

    const orderIds = orders.map((o) => o.id);
    let orderItems = [];
    if (orderIds.length > 0) {
      const [rows] = await db.query(
        "SELECT order_id, menu_item_code, name, price, qty, unit_cost FROM order_items WHERE order_id IN (?)",
        [orderIds],
      );
      orderItems = rows;
    }

    const orderItemsMap = {};
    orderItems.forEach((item) => {
      if (!orderItemsMap[item.order_id]) orderItemsMap[item.order_id] = [];
      orderItemsMap[item.order_id].push(item);
    });

    const timeFrames = ["today", "yesterday", "week", "month", "year", "custom"];
    const statsByTimeFrame = {};

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Đầu tuần (Thứ 2)
    const currentDay = now.getDay();
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // Đầu tháng
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Đầu năm
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    timeFrames.forEach((tf) => {
      let filterOrderFn;
      let filterBookingFn;

      if (tf === "today") {
        filterOrderFn = (o) => o.created_at && o.created_at.startsWith(todayStr);
        filterBookingFn = (b) => (b.booking_date && b.booking_date.startsWith(todayStr)) || (b.created_at && b.created_at.startsWith(todayStr));
      } else if (tf === "yesterday") {
        filterOrderFn = (o) => o.created_at && o.created_at.startsWith(yesterdayStr);
        filterBookingFn = (b) => (b.booking_date && b.booking_date.startsWith(yesterdayStr)) || (b.created_at && b.created_at.startsWith(yesterdayStr));
      } else if (tf === "week") {
        filterOrderFn = (o) => o.created_at && new Date(o.created_at) >= monday;
        filterBookingFn = (b) => {
          const date = b.booking_date ? new Date(b.booking_date) : new Date(b.created_at);
          return date >= monday;
        };
      } else if (tf === "month") {
        filterOrderFn = (o) => o.created_at && new Date(o.created_at) >= firstDayOfMonth;
        filterBookingFn = (b) => {
          const date = b.booking_date ? new Date(b.booking_date) : new Date(b.created_at);
          return date >= firstDayOfMonth;
        };
      } else if (tf === "year") {
        filterOrderFn = (o) => o.created_at && new Date(o.created_at) >= firstDayOfYear;
        filterBookingFn = (b) => {
          const date = b.booking_date ? new Date(b.booking_date) : new Date(b.created_at);
          return date >= firstDayOfYear;
        };
      } else {
        filterOrderFn = () => true;
        filterBookingFn = () => true;
      }

      const filteredOrders = orders.filter(filterOrderFn);
      const filteredBookings = bookings.filter(filterBookingFn);

      const count = filteredOrders.length;
      const tfOrderRev = filteredOrders
        .filter((o) => o.status === "paid" || o.status === "completed" || o.payment_status === "paid")
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

      const tfBookingRev = filteredBookings
        .filter((b) => b.status === "completed" || b.payment_status === "paid")
        .reduce((sum, b) => sum + Number(b.total || 0), 0);

      const tfTotalRevenue = tfOrderRev + tfBookingRev;
      const guests = filteredBookings
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + Number(b.guests || 0), 0);

      let totalDiscount = 0;
      let totalCost = 0;
      let dineInRev = 0;
      let takeawayRev = 0;
      let deliveryRev = 0;
      let onlineOrderCount = 0;
      let dineInOrderCount = 0;
      let totalOrderItemsSold = 0;

      const categoryRevenueMap = {};

      filteredOrders.forEach((o) => {
        const isPaid = o.status === "paid" || o.status === "completed" || o.payment_status === "paid";
        totalDiscount += Number(o.discount_total || 0) + Number(o.coupon_discount_total || 0);

        const raw = parseJson(o.raw_data, {});
        const serviceType = raw.serviceType || raw.type || "";
        if (serviceType === "dine-in" || serviceType === "table") {
          dineInOrderCount++;
          if (isPaid) dineInRev += Number(o.total || 0);
        } else if (serviceType === "takeaway") {
          onlineOrderCount++;
          if (isPaid) takeawayRev += Number(o.total || 0);
        } else {
          onlineOrderCount++;
          if (isPaid) deliveryRev += Number(o.total || 0);
        }

        const items = orderItemsMap[o.id] || [];
        items.forEach((it) => {
          totalOrderItemsSold += Number(it.qty || 1);
          const matchedMenu = (it.menu_item_code && menuMap[String(it.menu_item_code).toLowerCase()]) ||
            menuMap[String(it.name).toLowerCase()] || null;

          const unitCost = Number(it.unit_cost || matchedMenu?.cost_price || 0);
          totalCost += unitCost * Number(it.qty || 1);

          if (isPaid) {
            const catName = matchedMenu?.category_name || "Khác";
            categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + Number(it.price || 0) * Number(it.qty || 1);
          }
        });
      });

      filteredBookings.forEach((b) => {
        const isPaid = b.status === "completed" || b.payment_status === "paid";
        totalDiscount += Number(b.discount_amount || 0);
        if (isPaid) {
          dineInRev += Number(b.total || 0);
        }
        dineInOrderCount++;

        const bItems = parseJson(b.cart_items, []);
        bItems.forEach((it) => {
          const qty = Number(it.quantity || it.qty || 1);
          totalOrderItemsSold += qty;
          const matchedMenu = (it.code && menuMap[String(it.code).toLowerCase()]) ||
            (it.id && menuMap[String(it.id)]) ||
            menuMap[String(it.name).toLowerCase()] || null;

          const unitCost = Number(matchedMenu?.cost_price || 0);
          totalCost += unitCost * qty;

          if (isPaid) {
            const catName = matchedMenu?.category_name || "Khác";
            categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + Number(it.price || 0) * qty;
          }
        });
      });

      const netProfit = tfTotalRevenue - totalCost;

      const totalCatRev = Object.values(categoryRevenueMap).reduce((sum, v) => sum + v, 0);
      const categorySales = Object.keys(categoryRevenueMap).map((catName) => {
        const value = categoryRevenueMap[catName];
        return {
          name: catName,
          value,
          percentage: totalCatRev > 0 ? Math.round((value / totalCatRev) * 100) : 0,
        };
      });

      statsByTimeFrame[tf] = {
        totalRevenue: tfTotalRevenue,
        totalOrders: count,
        totalGuests: guests,
        totalDiscount,
        totalCost,
        netProfit,
        dineInRevenue: dineInRev,
        takeawayRevenue: takeawayRev,
        deliveryRevenue: deliveryRev,
        onlineOrderCount,
        dineInOrderCount,
        totalOrderItemsSold,
        categorySales,
      };
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalBookings,
        totalRevenue,
        orderRevenue: Number(orderRevenue),
        bookingRevenue: Number(bookingRevenue),
        totalBookingGuests,
        activeMenuItems,
        orderStatusBreakdown,
        latestOrders: latestOrderRows,
        latestBookings: latestBookingRows,
        bestSellingFoods: bestFoodRows,
        byTimeFrame: statsByTimeFrame,
      },
    });
  } catch (error) {
    console.error("Lỗi getDashboardStats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi tải thống kê tổng quan.",
    });
  }
};

/**
 * Lấy danh sách thông báo hoạt động cần xử lý của Admin
 */
exports.getDashboardNotifications = async (req, res) => {
  try {
    const [pendingBookings] = await db.query(`
      SELECT id, booking_code, customer_name, booking_time, booking_date, created_at
      FROM bookings
      WHERE deleted_at IS NULL AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const [unassignedBookings] = await db.query(`
      SELECT id, booking_code, customer_name, booking_time, booking_date, created_at
      FROM bookings
      WHERE deleted_at IS NULL AND status = 'confirmed' AND (selected_table IS NULL OR selected_table = '')
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const [orders] = await db.query(`
      SELECT id, order_code, customer_name, total, created_at
      FROM orders
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const notifications = [];

    pendingBookings.forEach((b) => {
      const dateStr = b.booking_date ? new Date(b.booking_date).toLocaleDateString("vi-VN") : "";
      notifications.push({
        id: `pending-${b.id}`,
        type: "pending_booking",
        title: "Yêu cầu đặt bàn mới",
        link: "/admin/bookings",
        createdAt: b.created_at,
        details: {
          customerName: b.customer_name,
          time: b.booking_time,
          date: dateStr,
          bookingCode: b.booking_code || `DB${b.id}`,
        },
      });
    });

    unassignedBookings.forEach((b) => {
      const dateStr = b.booking_date ? new Date(b.booking_date).toLocaleDateString("vi-VN") : "";
      notifications.push({
        id: `unassigned-${b.id}`,
        type: "unassigned_booking",
        title: "Lịch cần xếp bàn",
        link: "/admin/tables",
        createdAt: b.created_at,
        details: {
          customerName: b.customer_name,
          time: b.booking_time,
          date: dateStr,
          bookingCode: b.booking_code || `DB${b.id}`,
        },
      });
    });

    orders.forEach((o) => {
      notifications.push({
        id: `order-${o.id}`,
        type: "order",
        title: "Đơn hàng mới",
        link: "/admin/orders",
        createdAt: o.created_at,
        details: {
          orderCode: o.order_code || o.id,
          customerName: o.customer_name || "Khách vãng lai",
          total: o.total,
        },
      });
    });

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Lỗi getDashboardNotifications:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy thông báo.",
    });
  }
};
