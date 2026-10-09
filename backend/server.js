const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketConfig = require("./src/config/socket");

const db = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const roleRoutes = require("./src/routes/roleRoutes");
const adminMenuRoutes = require("./src/routes/adminMenuRoutes");
const menuRoutes = require("./src/routes/menuRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const tableRoutes = require("./src/routes/tableRoutes");
const dealRoutes = require("./src/routes/dealRoutes");
const spaceRoutes = require("./src/routes/spaceRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const activityLogRoutes = require("./src/routes/activityLogRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const revenueRoutes = require("./src/routes/revenueRoutes");

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/admin/menu-items", adminMenuRoutes);
app.use("/api/menu-items", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/revenue", revenueRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Backend SePay is running",
  });
});

// Webhook SePay
app.post("/api/sepay/webhook", async (req, res) => {
  try {
    const payment = req.body;

    console.log("=== SEPAY WEBHOOK RECEIVED ===");
    console.log(payment);

    // Xác thực Webhook Security
    const webhookApiKey = req.headers["authorization"] || req.headers["x-sepay-key"];
    const configuredSecret = process.env.SEPAY_WEBHOOK_SECRET;
    if (configuredSecret && webhookApiKey !== `Apikey ${configuredSecret}` && webhookApiKey !== configuredSecret) {
      console.warn(`[Security Alert] Webhook không hợp lệ từ IP: ${req.ip}`);
      return res.status(401).json({ success: false, message: "Unauthorized webhook signature." });
    }

    const paymentContent = String(
      payment.content || payment.description || "",
    ).replace(/[^A-Z0-9]/gi, "");

    const transferAmount = Number(payment.transferAmount || 0);
    if (!paymentContent || transferAmount <= 0) {
      return res.status(400).json({ success: false, message: "Dữ liệu webhook không hợp lệ." });
    }

    const [orders] = await db.query(`
      SELECT id, order_code, payment_content, total
      FROM orders
      WHERE payment_status != 'paid'
      ORDER BY created_at DESC
      LIMIT 100
    `);

    const matchedOrder = orders.find((order) => {
      const orderCode = String(
        order.payment_content || order.order_code || "",
      ).replace(/[^A-Z0-9]/gi, "");

      return paymentContent.toLowerCase().includes(orderCode.toLowerCase());
    });

    // 2. Kiểm tra các bàn đang phục vụ (bookings) hoặc đặt bàn chờ cọc (status = 'pending')
    const [bookings] = await db.query(`
      SELECT id, status, payment_status, total, deposit_amount, customer_name, email, booking_date, booking_time, guests, note
      FROM bookings
      WHERE deleted_at IS NULL AND payment_status != 'paid'
      ORDER BY created_at DESC
      LIMIT 100
    `);

    const matchedBooking = bookings.find((booking) => {
      const bookingCode = `DB${booking.id}`;
      return paymentContent.toLowerCase().includes(bookingCode.toLowerCase());
    });

    if (matchedOrder) {
      // Lưu vào order_payments
      await db.query(
        `INSERT INTO order_payments (order_id, amount, payment_method, payment_status, created_at, updated_at) 
         VALUES (?, ?, 'bank', 'paid', NOW(), NOW())`,
        [matchedOrder.id, transferAmount]
      );

      const [paymentSumRows] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) AS totalPaid FROM order_payments WHERE order_id = ?`,
        [matchedOrder.id]
      );
      const totalPaid = Number(paymentSumRows[0]?.totalPaid || 0);
      const nextPaymentStatus = totalPaid >= Number(matchedOrder.total || 0) ? "paid" : "partially_paid";

      await db.query(
        `
        UPDATE orders
        SET
          payment_method = 'bank',
          payment_status = ?,
          status = CASE WHEN ? = 'paid' THEN 'processing' ELSE status END,
          paid_at = NOW(),
          sepay_transaction = ?,
          sepay_amount = ?,
          updated_at = NOW()
        WHERE id = ?
        `,
        [nextPaymentStatus, nextPaymentStatus, JSON.stringify(payment), transferAmount, matchedOrder.id],
      );

      console.log(`Đã cập nhật đơn hàng ${matchedOrder.order_code}. Trạng thái: ${nextPaymentStatus} (Đã thu: ${totalPaid}/${matchedOrder.total})`);

      try {
        const { getIO } = require("./src/config/socket");
        getIO().emit("order_updated"); // Frontend sẽ tự load lại
      } catch (err) {
        console.error("Lỗi socket:", err);
      }
    } else if (matchedBooking) {
      await db.query(
        `
        UPDATE bookings
        SET
          status = 'confirmed',
          payment_method = 'bank',
          payment_status = 'paid',
          paid_at = NOW()
        WHERE id = ?
        `,
        [matchedBooking.id],
      );

      console.log("Đã cập nhật thanh toán và xác nhận lịch đặt bàn:", matchedBooking.id);

      // Emit socket cập nhật
      try {
        const { getIO } = require("./src/config/socket");
        getIO().emit("booking_updated", { id: matchedBooking.id, status: "confirmed" });
        getIO().emit("table_updated", { source: "booking_confirmed" });
      } catch (err) {
        console.error("Lỗi socket booking:", err);
      }

      // Gửi email xác nhận cọc thành công
      if (matchedBooking.email) {
        try {
          const { sendBookingEmail } = require("./src/utils/mail");
          sendBookingEmail({
            to: matchedBooking.email,
            name: matchedBooking.customer_name,
            bookingCode: `DB${String(matchedBooking.id).padStart(5, "0")}`,
            status: "confirmed",
            date: matchedBooking.booking_date,
            time: matchedBooking.booking_time,
            guests: matchedBooking.guests,
            note: matchedBooking.note || null,
            total: Number(matchedBooking.total || 0)
          }).catch(err => console.error("Lỗi gửi mail đặt bàn cọc thành công:", err));
        } catch (mailErr) {
          console.error("Lỗi khởi tạo mail cho đặt cọc thành công:", mailErr);
        }
      }
    } else {
      console.log("Không tìm thấy đơn hàng hoặc lịch đặt phù hợp cho nội dung:", paymentContent);
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Lỗi webhook SePay:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi xử lý webhook SePay",
      error: error.message,
    });
  }
});

// API reset thủ công (chỉ dùng nội bộ / admin)
app.post("/api/admin/reset-stale-tables", async (req, res) => {
  try {
    await resetStaleTables();
    res.json({ success: true, message: "Đã reset bàn cũ thành công." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Auto-reset bàn qua ngày mới ───────────────────────────────────────────
/**
 * Reset tất cả bàn đang ở trạng thái "serving" (đang phục vụ) mà lịch đặt bàn
 * liên kết thuộc về ngày hôm trước hoặc sớm hơn về trạng thái "available" (bàn trống).
 * Đồng thời đánh dấu các lịch đặt tương ứng là "completed" (hoàn thành).
 */
async function resetStaleTables() {
  try {
    // Tính ngày hôm nay theo múi giờ Việt Nam (UTC+7)
    const now = new Date();
    const vnOffset = 7 * 60; // phút
    const vnNow = new Date(now.getTime() + vnOffset * 60 * 1000);
    const todayStr = vnNow.toISOString().slice(0, 10); // "YYYY-MM-DD" theo giờ VN

    console.log(`[Auto-Reset] Kiểm tra bàn cũ vào lúc ${now.toLocaleString("vi-VN")} (ngày VN: ${todayStr})...`);

    // 1. Tìm tất cả lịch đặt bàn đang serving/confirmed thuộc ngày trước hôm nay
    const [staleBookings] = await db.query(
      `
      SELECT b.id, b.selected_table, b.booking_date, b.status
      FROM bookings b
      WHERE b.status IN ('serving', 'confirmed')
        AND b.deleted_at IS NULL
        AND DATE(b.booking_date) < ?
      `,
      [todayStr]
    );

    if (staleBookings.length > 0) {
      console.log(`[Auto-Reset] Tìm thấy ${staleBookings.length} lịch đặt cũ cần reset:`, staleBookings.map(b => `DB${b.id} (bàn ${b.selected_table}, ngày ${b.booking_date})`));

      // 2. Cập nhật trạng thái lịch đặt → completed
      const staleBookingIds = staleBookings.map(b => b.id);
      await db.query(
        `UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE id IN (?)`,
        [staleBookingIds]
      );

      // 3. Tìm các bàn ăn tương ứng đang bị giữ (serving) và reset về available
      const staleTablCodes = [...new Set(staleBookings.map(b => b.selected_table).filter(Boolean))];
      if (staleTablCodes.length > 0) {
        await db.query(
          `UPDATE restaurant_tables SET status = 'available', updated_at = NOW()
           WHERE table_code IN (?) AND status IN ('serving', 'reserved') AND deleted_at IS NULL`,
          [staleTablCodes]
        );
      }
      console.log(`[Auto-Reset] Đã reset ${staleBookings.length} lịch đặt cũ và ${staleTablCodes.length} bàn.`);
    } else {
      console.log("[Auto-Reset] Không có lịch đặt quá ngày cần reset.");
    }

    // 1b. Tìm tất cả lịch đặt bàn đang pending (chờ xác nhận) thuộc ngày trước hôm nay
    const [stalePendingBookings] = await db.query(
      `
      SELECT b.id, b.booking_date
      FROM bookings b
      WHERE b.status = 'pending'
        AND b.deleted_at IS NULL
        AND DATE(b.booking_date) < ?
      `,
      [todayStr]
    );

    if (stalePendingBookings.length > 0) {
      console.log(`[Auto-Reset] Tìm thấy ${stalePendingBookings.length} lịch đặt chờ xác nhận đã quá hạn.`);
      const stalePendingIds = stalePendingBookings.map(b => b.id);
      await db.query(
        `UPDATE bookings 
         SET status = 'cancelled', note = 'Hệ thống tự động hủy do quá hạn đặt bàn', updated_at = NOW() 
         WHERE id IN (?)`,
        [stalePendingIds]
      );
      console.log(`[Auto-Reset] Đã tự động hủy ${stalePendingBookings.length} lịch đặt chờ xác nhận quá hạn.`);
    }

    // 4. Dọn dẹp bàn "mồ côi": đang serving nhưng không có lịch đặt active nào
    const [orphanResult] = await db.query(`
      UPDATE restaurant_tables rt
      SET rt.status = 'available', rt.updated_at = NOW()
      WHERE rt.status = 'serving'
        AND rt.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.selected_table = rt.table_code
            AND b.status IN ('serving', 'confirmed')
            AND b.deleted_at IS NULL
        )
    `);
    if (orphanResult.affectedRows > 0) {
      console.log(`[Auto-Reset] Đã reset ${orphanResult.affectedRows} bàn mồ côi (serving không có lịch đặt) về available.`);
    }

  } catch (err) {
    console.error("[Auto-Reset] Lỗi khi reset bàn:", err);
  }
}

/**
 * Tính số mili-giây còn lại đến 00:00:00 của ngày hôm sau (múi giờ server).
 */
function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // ngày mai 00:00:00
  return midnight.getTime() - now.getTime();
}

/**
 * Lên lịch chạy resetStaleTables mỗi đêm lúc 00:00.
 */
function scheduleMidnightReset() {
  const delay = msUntilMidnight();
  console.log(`[Auto-Reset] Lên lịch reset bàn vào lúc 00:00 (còn ${Math.round(delay / 60000)} phút).`);
  setTimeout(() => {
    resetStaleTables();
    // Sau lần đầu tiên chạy đúng 00:00, đặt interval 24h cho các ngày tiếp theo
    setInterval(resetStaleTables, 24 * 60 * 60 * 1000);
  }, delay);
}

/**
 * Quét các đặt bàn sắp diễn ra trong vòng 2 tiếng (120 phút) tiếp theo để gửi email nhắc nhở.
 */
async function checkAndSendBookingReminders() {
  try {
    const [upcomingBookings] = await db.query(`
      SELECT id, booking_code, customer_name, email, booking_date, booking_time, guests, note
      FROM bookings
      WHERE status = 'confirmed'
        AND is_reminded = 0
        AND email IS NOT NULL
        AND email != ''
        AND deleted_at IS NULL
        AND CONCAT(booking_date, ' ', booking_time) <= DATE_ADD(NOW(), INTERVAL 150 MINUTE)
        AND CONCAT(booking_date, ' ', booking_time) >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    `);

    if (upcomingBookings.length > 0) {
      console.log(`[Reminder-System] Tìm thấy ${upcomingBookings.length} lịch đặt bàn cần gửi mail nhắc nhở.`);
      const { sendBookingReminderEmail } = require("./src/utils/mail");

      for (const booking of upcomingBookings) {
        // Atomic lock claim để chống race condition giữa các instance
        const [claimResult] = await db.query(
          `UPDATE bookings SET is_reminded = 1 WHERE id = ? AND is_reminded = 0`,
          [booking.id]
        );
        if (claimResult.affectedRows === 0) continue;

        try {
          await sendBookingReminderEmail({
            to: booking.email,
            name: booking.customer_name,
            bookingCode: booking.booking_code,
            date: booking.booking_date,
            time: booking.booking_time,
            guests: booking.guests,
            note: booking.note
          });
          console.log(`[Reminder-System] ✔️ Đã gửi nhắc lịch hẹn cho: ${booking.booking_code} (${booking.email})`);
        } catch (mailErr) {
          console.error(`[Reminder-System] ❌ Lỗi khi gửi mail nhắc nhở cho ${booking.booking_code}:`, mailErr);
        }
      }
    }
  } catch (err) {
    console.error("[Reminder-System] Lỗi hệ thống khi quét gửi nhắc nhở:", err);
  }
}
// ────────────────────────────────────────────────────────────────────────────

const server = http.createServer(app);
socketConfig.init(server);

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Chạy reset ngay khi server khởi động để dọn dẹp các bàn từ ngày hôm trước
  await resetStaleTables();
  // Lên lịch chạy lại mỗi đêm lúc 00:00
  scheduleMidnightReset();

  try {
    const [columns] = await db.query("SHOW COLUMNS FROM bookings");
    const hasPaymentMethod = columns.some(c => c.Field === "payment_method");
    if (!hasPaymentMethod) {
      console.log("Migrating bookings table: adding payment_method, payment_status, paid_at...");
      await db.query(`
        ALTER TABLE bookings
        ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL AFTER status,
        ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid' AFTER payment_method,
        ADD COLUMN paid_at DATETIME DEFAULT NULL AFTER payment_status
      `);
      console.log("Migration successful!");
    }
    const hasCouponCode = columns.some(c => c.Field === "coupon_code");
    if (!hasCouponCode) {
      console.log("Migrating bookings table: adding coupon_code, discount_amount...");
      await db.query(`
        ALTER TABLE bookings
        ADD COLUMN coupon_code VARCHAR(50) DEFAULT NULL AFTER payment_status,
        ADD COLUMN discount_amount DECIMAL(12,2) DEFAULT 0.00 AFTER coupon_code
      `);
      console.log("Coupon migration successful!");
    }
    const hasIsReminded = columns.some(c => c.Field === "is_reminded");
    if (!hasIsReminded) {
      console.log("Migrating bookings table: adding is_reminded column...");
      await db.query(`
        ALTER TABLE bookings
        ADD COLUMN is_reminded TINYINT(1) DEFAULT 0 AFTER discount_amount
      `);
      console.log("is_reminded migration successful!");
    }
    const hasDepositAmount = columns.some(c => c.Field === "deposit_amount");
    if (!hasDepositAmount) {
      console.log("Migrating bookings table: adding deposit_amount column...");
      await db.query(`
        ALTER TABLE bookings
        ADD COLUMN deposit_amount DECIMAL(15, 2) DEFAULT 0.00 AFTER is_reminded
      `);
      console.log("deposit_amount migration successful!");
    }
    const statusCol = columns.find(c => c.Field === "status");
    const hasServingStatus = statusCol && statusCol.Type.includes("'serving'");
    if (!hasServingStatus) {
      console.log("Migrating bookings table: updating status enum to include serving...");
      await db.query(`
        ALTER TABLE bookings
        MODIFY COLUMN status enum('pending','confirmed','serving','completed','cancelled') DEFAULT 'pending'
      `);
      console.log("Status enum migration successful!");
    }

    // Migration cho bảng restaurant_tables để thêm pin_code
    const [tableColumns] = await db.query("SHOW COLUMNS FROM restaurant_tables");
    const hasPinCode = tableColumns.some(c => c.Field === "pin_code");
    if (!hasPinCode) {
      console.log("Migrating restaurant_tables table: adding pin_code column...");
      await db.query(`
        ALTER TABLE restaurant_tables
        ADD COLUMN pin_code VARCHAR(4) DEFAULT NULL AFTER status
      `);
      console.log("pin_code migration successful!");
    }

    // Bắt đầu chạy quét lịch hẹn nhắc nhở định kỳ mỗi 15 phút
    setInterval(checkAndSendBookingReminders, 15 * 60 * 1000);
    // Chạy thử luôn lần đầu tiên
    await checkAndSendBookingReminders();
  } catch (err) {
    console.error("Database migration error:", err);
  }
});
