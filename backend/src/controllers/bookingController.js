const db = require("../config/db");
const { getIO } = require("../config/socket");

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "serving",
  "completed",
  "cancelled",
];

const toJsonString = (value) => {
  if (!value) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
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

const mapBooking = (row) => ({
  id: row.id,
  bookingCode: row.booking_code,
  userId: row.user_id,
  source: row.source,
  type: row.type,
  customerName: row.customer_name,
  name: row.customer_name,
  phone: row.phone,
  email: row.email,
  date: row.booking_date,
  time: row.booking_time,
  guests: row.guests,
  selectedArea: row.selected_area,
  selectedAreaTitle: row.selected_area_title,
  selectedTable: row.selected_table,
  note: row.note,
  cartItems: parseJson(row.cart_items, []),
  subtotal: Number(row.subtotal || 0),
  total: Number(row.total || 0),
  totalQty: Number(row.total_qty || 0),
  paymentMethod: row.payment_method || null,
  paymentStatus: row.payment_status || "unpaid",
  paidAt: row.paid_at || null,
  couponCode: row.coupon_code || null,
  discountAmount: Number(row.discount_amount || 0),
  status: row.status,
  createdBy: row.created_by,
  assignedBy: row.assigned_by,
  assignedAt: row.assigned_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const hasTableConflict = async ({
  date,
  selectedTable,
  excludeBookingId = null,
  conn = db,
}) => {
  if (!date || !selectedTable) return false;
  const params = [date, selectedTable];
  let excludeSql = "";
  if (excludeBookingId) {
    excludeSql = "AND id != ?";
    params.push(excludeBookingId);
  }
  const [rows] = await conn.query(
    `
    SELECT id
    FROM bookings
    WHERE deleted_at IS NULL
      AND booking_date = ?
      AND selected_table = ?
      AND status IN ('pending', 'confirmed', 'serving')
      ${excludeSql}
    LIMIT 1
    FOR UPDATE
    `,
    params,
  );
  return rows.length > 0;
};

const validateTableCapacity = async ({
  selectedTable,
  guests,
  date,
  selectedArea = null,
  conn = db,
}) => {
  if (!selectedTable) return null;
  const guestCount = Number(guests || 0);
  if (!guestCount || guestCount <= 0) {
    const error = new Error("Số khách không hợp lệ.");
    error.statusCode = 400;
    throw error;
  }
  const [rows] = await conn.query(
    `
    SELECT
      t.id,
      t.table_code,
      t.seats,
      t.status,
      t.space_id,
      s.label AS area_name,
      s.label AS space_name,
      s.status AS area_status,
      s.status AS space_status,
      s.space_key
    FROM restaurant_tables t
    LEFT JOIN restaurant_spaces s ON s.id = t.space_id
    WHERE t.table_code = ?
      AND t.deleted_at IS NULL
    LIMIT 1
    FOR UPDATE
    `,
    [selectedTable],
  );
  if (rows.length === 0) {
    const error = new Error("Bàn không tồn tại hoặc đã bị xóa.");
    error.statusCode = 400;
    throw error;
  }
  const table = rows[0];
  if (table.space_status === "inactive" || table.area_status === "inactive") {
    const error = new Error(
      "Khu vực / Không gian chứa bàn này hiện đang tạm ẩn. Vui lòng chọn không gian khác."
    );
    error.statusCode = 400;
    throw error;
  }
  if (selectedArea && selectedArea !== "all") {
    const spaceIdMatch = Number(selectedArea) === table.space_id;
    const keyMatch = table.space_key && table.space_key.toLowerCase() === String(selectedArea).toLowerCase();
    const nameMatch = table.area_name && table.area_name.toLowerCase() === String(selectedArea).toLowerCase();
    if (!spaceIdMatch && !keyMatch && !nameMatch) {
      const error = new Error(`Bàn ${table.table_code} không thuộc không gian / khu vực đã chọn.`);
      error.statusCode = 400;
      throw error;
    }
  }
  if (["maintenance", "disabled"].includes(table.status)) {
    const error = new Error(
      `Bàn ${table.table_code} hiện đang bảo trì hoặc vô hiệu hóa. Vui lòng chọn bàn khác.`,
    );
    error.statusCode = 400;
    throw error;
  }
  if (date) {
    const today = new Date().toLocaleDateString("en-CA");
    const isToday = date === today;
    if (isToday && table.status === "serving") {
      const error = new Error(
        `Bàn ${table.table_code} hiện đang có khách. Vui lòng chọn bàn khác.`,
      );
      error.statusCode = 400;
      throw error;
    }
  }
  if (guestCount > Number(table.seats || 0)) {
    const error = new Error(
      `Bàn ${table.table_code} chỉ chứa tối đa ${table.seats} người. Vui lòng chọn bàn khác phù hợp hơn.`,
    );
    error.statusCode = 400;
    throw error;
  }
  return table;
};

exports.createBooking = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const customerName = String(
      req.body.customerName || req.body.name || "",
    ).trim();
    const phone = String(req.body.phone || "").trim();
    const email = String(req.body.email || req.user.email || "").trim();
    const date = String(req.body.date || "").trim();
    const time = String(req.body.time || "").trim();
    const guests = Number(req.body.guests || req.body.people || 1);
    const selectedTable = String(req.body.selectedTable || "").trim();
    const selectedArea = req.body.selectedArea || null;

    if (!customerName || !phone || !date || !time || !guests) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng nhập đầy đủ tên, số điện thoại, ngày, giờ và số khách.",
      });
    }

    let validatedTable = null;
    if (selectedTable) {
      validatedTable = await validateTableCapacity({
        selectedTable,
        guests,
        date,
        selectedArea,
        conn,
      });
      const [tableRows] = await conn.query(
        `SELECT status, pin_code FROM restaurant_tables WHERE table_code = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
        [selectedTable]
      );
      if (tableRows.length > 0) {
        const table = tableRows[0];
        if (table.status === "serving") {
          const inputPin = String(req.body.pinCode || "").trim();
          if (!table.pin_code || inputPin !== String(table.pin_code)) {
            await conn.rollback();
            return res.status(400).json({
              success: false,
              message: "Mã PIN của bàn không chính xác. Vui lòng nhập đúng mã PIN hiển thị tại bàn."
            });
          }
        } else {
          const isConflict = await hasTableConflict({ date, selectedTable, conn });
          if (isConflict) {
            await conn.rollback();
            return res.status(409).json({
              success: false,
              message: "Bàn này đã có lịch đặt trong ngày đã chọn.",
            });
          }
        }
      } else {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: "Bàn được chọn không tồn tại."
        });
      }
    }

    const depositAmount = Number(req.body.depositAmount || 0);

    const [result] = await conn.query(
      `
      INSERT INTO bookings (
        user_id, table_id, source, type, customer_name, phone, email, booking_date, booking_time, guests,
        selected_area, selected_area_title, selected_table, note, cart_items, subtotal, total, total_qty,
        status, created_by, deposit_amount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'user', ?)
      `,
      [
        req.user.id,
        validatedTable ? validatedTable.id : null,
        req.body.source || "booking_page",
        req.body.type || "table_only",
        customerName,
        phone,
        email || null,
        date,
        time,
        guests,
        req.body.selectedArea || null,
        req.body.selectedAreaTitle || (validatedTable ? validatedTable.area_name : "Nhà hàng sắp xếp"),
        selectedTable || null,
        req.body.note || null,
        toJsonString(req.body.cartItems || []),
        Number(req.body.subtotal || 0),
        Number(req.body.total || 0),
        Number(req.body.totalQty || 0),
        depositAmount
      ],
    );

    const bookingCode = `DB${String(result.insertId).padStart(5, "0")}`;
    await conn.query(`UPDATE bookings SET booking_code = ? WHERE id = ?`, [
      bookingCode,
      result.insertId,
    ]);

    const [rows] = await conn.query(
      `SELECT * FROM bookings WHERE id = ? LIMIT 1`,
      [result.insertId],
    );
    await conn.commit();

    if (depositAmount === 0) {
      try {
        getIO().emit("table_updated", { source: "booking_created" });
        getIO().emit("booking_updated", { id: result.insertId, status: "pending" });
      } catch (err) {
        console.error("Emit error:", err);
      }
    }

    const depositAmt = Number(req.body.depositAmount || 0);
    if (email && depositAmt === 0) {
      try {
        const { sendBookingEmail } = require("../utils/mail");
        sendBookingEmail({
          to: email,
          name: customerName,
          bookingCode: bookingCode,
          status: "pending",
          date: date,
          time: time,
          guests: guests,
          note: req.body.note || null,
          total: Number(req.body.total || 0)
        }).catch(err => console.error("Lỗi gửi mail đặt bàn:", err));
      } catch (mailErr) {
        console.error("Lỗi khởi tạo mail utility:", mailErr);
      }
    }

    res.status(201).json({
      success: true,
      message: "Đặt bàn thành công.",
      booking: mapBooking(rows[0]),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi tạo đặt bàn:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Lỗi server khi tạo đặt bàn.",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM bookings WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC, id DESC`,
      [req.user.id],
    );
    res.json({
      success: true,
      bookings: rows.map(mapBooking),
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đặt bàn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử đặt bàn.",
      error: error.message,
    });
  }
};

exports.getMyBookingById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM bookings WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`,
      [req.params.id, req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn.",
      });
    }
    res.json({
      success: true,
      booking: mapBooking(rows[0]),
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết đặt bàn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết đặt bàn.",
      error: error.message,
    });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const date = String(req.query.date || "").trim();
    if (!date) {
      return res.json({
        success: true,
        bookings: [],
      });
    }
    const [rows] = await db.query(
      `
      SELECT id, booking_code, booking_date, booking_time, selected_area, selected_area_title, selected_table, status
      FROM bookings
      WHERE deleted_at IS NULL AND booking_date = ? AND selected_table IS NOT NULL AND selected_table != '' AND status IN ('pending', 'confirmed')
      ORDER BY booking_time ASC, id ASC
      `,
      [date],
    );
    res.json({
      success: true,
      bookings: rows.map((row) => ({
        id: row.id,
        bookingCode: row.booking_code,
        date: row.booking_date,
        time: row.booking_time,
        selectedArea: row.selected_area,
        selectedAreaTitle: row.selected_area_title,
        selectedTable: row.selected_table,
        status: row.status,
      })),
    });
  } catch (error) {
    console.error("Lỗi lấy lịch bàn đã đặt:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch bàn đã đặt.",
      error: error.message,
    });
  }
};

exports.getAdminBookings = async (req, res) => {
  try {
    const status = String(req.query.status || "all").trim();
    const search = String(req.query.search || "")
      .trim()
      .toLowerCase();
    const date = String(req.query.date || "").trim();
    const where = ["deleted_at IS NULL", "(deposit_amount = 0 OR payment_status = 'paid' OR created_by = 'admin')"];
    const params = [];

    if (status !== "all") {
      where.push("status = ?");
      params.push(status);
    }
    if (date) {
      where.push("booking_date = ?");
      params.push(date);
    }
    if (search) {
      where.push(
        `(LOWER(customer_name) LIKE ? OR phone LIKE ? OR LOWER(email) LIKE ? OR LOWER(booking_code) LIKE ?)`,
      );
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    const [rows] = await db.query(
      `SELECT * FROM bookings WHERE ${where.join(" AND ")} ORDER BY created_at DESC, id DESC`,
      params,
    );
    res.json({
      success: true,
      bookings: rows.map(mapBooking),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách đặt bàn admin:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách đặt bàn.",
      error: error.message,
    });
  }
};

exports.adminCreateBooking = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const customerName = String(req.body.customerName || "").trim();
    const phone = String(req.body.phone || "").trim();
    const date = String(req.body.date || "").trim();
    const time = String(req.body.time || "").trim();
    const selectedTable = String(req.body.selectedTable || "").trim();
    const guests = Number(req.body.guests || 1);

    if (!customerName || !phone || !date || !time) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đủ tên, số điện thoại, ngày và giờ.",
      });
    }

    const status = ALLOWED_STATUSES.includes(req.body.status)
      ? req.body.status
      : "pending";
    let validatedTable = null;
    if (selectedTable && ["pending", "confirmed"].includes(status)) {
      validatedTable = await validateTableCapacity({
        selectedTable,
        guests,
        date,
        selectedArea: req.body.selectedArea,
        conn,
      });
      const isConflict = await hasTableConflict({ date, selectedTable, conn });
      if (isConflict) {
        await conn.rollback();
        return res.status(409).json({
          success: false,
          message: "Bàn này đã có lịch đặt trong ngày đã chọn.",
        });
      }
    }

    const [result] = await conn.query(
      `
      INSERT INTO bookings (
        table_id, source, type, customer_name, phone, email, booking_date, booking_time, guests,
        selected_area, selected_area_title, selected_table, note, cart_items, subtotal, total, total_qty,
        status, created_by, assigned_by, assigned_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?, ?)
      `,
      [
        validatedTable ? validatedTable.id : null,
        "admin_page",
        req.body.type || "table_only",
        customerName,
        phone,
        req.body.email || null,
        date,
        time,
        guests,
        req.body.selectedArea || null,
        req.body.selectedAreaTitle || (validatedTable ? validatedTable.area_name : null),
        selectedTable || null,
        req.body.note || null,
        toJsonString(req.body.cartItems || []),
        Number(req.body.subtotal || 0),
        Number(req.body.total || 0),
        Number(req.body.total_qty || 0),
        status,
        req.user.name || "admin",
        selectedTable ? new Date() : null,
      ],
    );

    const bookingCode = `DB${String(result.insertId).padStart(5, "0")}`;
    await conn.query(`UPDATE bookings SET booking_code = ? WHERE id = ?`, [
      bookingCode,
      result.insertId,
    ]);

    const [rows] = await conn.query(
      `SELECT * FROM bookings WHERE id = ? LIMIT 1`,
      [result.insertId],
    );
    await conn.commit();

    try {
      getIO().emit("table_updated", { source: "booking_admin_created" });
      getIO().emit("booking_updated", { id: result.insertId, status });
    } catch (err) {
      console.error("Emit error:", err);
    }

    if (rows[0] && rows[0].email) {
      try {
        const { sendBookingEmail } = require("../utils/mail");
        sendBookingEmail({
          to: rows[0].email,
          name: rows[0].customer_name,
          bookingCode: rows[0].booking_code,
          status: status,
          date: rows[0].booking_date ? new Date(rows[0].booking_date).toLocaleDateString("vi-VN") : "",
          time: rows[0].booking_time,
          guests: rows[0].guests,
          note: rows[0].note || null,
          total: Number(rows[0].total || 0)
        }).catch(err => console.error("Lỗi gửi mail admin tạo đặt bàn:", err));
      } catch (mailErr) {
        console.error("Lỗi khởi tạo mail utility:", mailErr);
      }
    }

    res.status(201).json({
      success: true,
      message: "Tạo đặt bàn thành công.",
      booking: mapBooking(rows[0]),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi admin tạo đặt bàn:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Lỗi server khi tạo đặt bàn.",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

exports.adminUpdateBooking = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const bookingId = Number(req.params.id);
    const [currentRows] = await conn.query(
      `SELECT * FROM bookings WHERE id = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      [bookingId],
    );
    if (currentRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn.",
      });
    }

    const current = currentRows[0];
    const status = ALLOWED_STATUSES.includes(req.body.status)
      ? req.body.status
      : current.status;
    const nextDate = req.body.date || current.booking_date;
    const nextTable = req.body.selectedTable ?? current.selected_table;
    const nextGuests = Number(req.body.guests ?? current.guests ?? 1);

    let validatedTable = null;
    if (nextTable && ["pending", "confirmed"].includes(status)) {
      validatedTable = await validateTableCapacity({
        selectedTable: nextTable,
        guests: nextGuests,
        date: nextDate,
        selectedArea: req.body.selectedArea ?? current.selected_area,
        conn,
      });
      const isConflict = await hasTableConflict({
        date: nextDate,
        selectedTable: nextTable,
        excludeBookingId: bookingId,
        conn,
      });
      if (isConflict) {
        await conn.rollback();
        return res.status(409).json({
          success: false,
          message: "Bàn này đã có lịch đặt trong ngày đã chọn.",
        });
      }
    }

    await conn.query(
      `
      UPDATE bookings
      SET status = ?, table_id = ?, booking_date = ?, booking_time = ?, guests = ?, selected_area = ?, selected_area_title = ?, selected_table = ?,
          note = ?, assigned_by = ?, assigned_at = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [
        status,
        validatedTable ? validatedTable.id : (nextTable ? current.table_id : null),
        req.body.date || current.booking_date,
        req.body.time || current.booking_time,
        nextGuests,
        req.body.selectedArea ?? current.selected_area,
        req.body.selectedAreaTitle ?? (validatedTable ? validatedTable.area_name : current.selected_area_title),
        nextTable ?? current.selected_table,
        req.body.note ?? current.note,
        nextTable ? req.user.name || "admin" : current.assigned_by,
        nextTable ? new Date() : current.assigned_at,
        bookingId,
      ],
    );

    const [rows] = await conn.query(
      `SELECT * FROM bookings WHERE id = ? LIMIT 1`,
      [bookingId],
    );
    await conn.commit();

    try {
      getIO().emit("table_updated", { source: "booking_admin_updated" });
      getIO().emit("booking_updated", { id: bookingId });
    } catch (err) {
      console.error("Emit error:", err);
    }

    if (rows[0] && rows[0].email) {
      if (status === "confirmed" || status === "cancelled") {
        try {
          const { sendBookingEmail } = require("../utils/mail");
          sendBookingEmail({
            to: rows[0].email,
            name: rows[0].customer_name,
            bookingCode: rows[0].booking_code,
            status: status,
            date: rows[0].booking_date ? new Date(rows[0].booking_date).toLocaleDateString("vi-VN") : "",
            time: rows[0].booking_time,
            guests: rows[0].guests,
            note: rows[0].note || null,
            total: Number(rows[0].total || 0)
          }).catch(err => console.error("Lỗi gửi mail cập nhật đặt bàn:", err));
        } catch (mailErr) {
          console.error("Lỗi khởi tạo mail utility:", mailErr);
        }
      }
    }

    res.json({
      success: true,
      message: "Cập nhật đặt bàn thành công.",
      booking: mapBooking(rows[0]),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi cập nhật đặt bàn:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Lỗi server khi cập nhật đặt bàn.",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

exports.adminUpdateBookingStatus = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const bookingId = Number(req.params.id);
    const status = String(req.body.status || "").trim();

    if (!ALLOWED_STATUSES.includes(status)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Trạng thái đặt bàn không hợp lệ.",
      });
    }

    const [currentRows] = await conn.query(
      `SELECT * FROM bookings WHERE id = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      [bookingId],
    );
    if (currentRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn.",
      });
    }

    const current = currentRows[0];
    if (current.selected_table && (status === "confirmed" || status === "serving")) {
      const [activeRows] = await conn.query(
        `SELECT id, cart_items, subtotal, total, total_qty FROM bookings WHERE selected_table = ? AND status = 'serving' AND deleted_at IS NULL AND id != ? LIMIT 1 FOR UPDATE`,
        [current.selected_table, bookingId]
      );
      if (activeRows.length > 0) {
        const activeBooking = activeRows[0];
        const activeCart = parseJson(activeBooking.cart_items, []);
        const pendingCart = parseJson(current.cart_items, []);

        pendingCart.forEach(pItem => {
          const existing = activeCart.find(aItem => String(aItem.id || aItem.code || '') === String(pItem.id || pItem.code || ''));
          if (existing) {
            existing.qty = Number(existing.qty || 0) + Number(pItem.qty || 0);
          } else {
            activeCart.push(pItem);
          }
        });

        let newTotalQty = 0;
        let newSubtotal = 0;
        activeCart.forEach(item => {
          newTotalQty += Number(item.qty || 0);
          newSubtotal += Number(item.price || 0) * Number(item.qty || 0);
        });

        await conn.query(
          `UPDATE bookings SET cart_items = ?, subtotal = ?, total = ?, total_qty = ?, updated_at = NOW() WHERE id = ?`,
          [JSON.stringify(activeCart), newSubtotal, newSubtotal, newTotalQty, activeBooking.id]
        );

        await conn.query(
          `UPDATE bookings SET status = 'completed', note = 'Đã gộp món vào hóa đơn chính', updated_at = NOW() WHERE id = ?`,
          [bookingId]
        );

        await conn.commit();
        try {
          getIO().emit("table_updated", { source: "booking_merged" });
          getIO().emit("booking_updated", { id: activeBooking.id });
          getIO().emit("booking_updated", { id: bookingId, status: "completed" });
        } catch (err) {
          console.error("Emit error:", err);
        }

        return res.json({
          success: true,
          message: "Đã xác nhận và gộp các món gọi thêm vào bàn thành công.",
          booking: mapBooking({ ...activeBooking, cart_items: JSON.stringify(activeCart), subtotal: newSubtotal, total: newSubtotal, total_qty: newTotalQty })
        });
      }
    }

    if (current.selected_table && ["pending", "confirmed"].includes(status)) {
      await validateTableCapacity({
        selectedTable: current.selected_table,
        guests: current.guests,
        date: current.booking_date,
        conn,
      });
      const isConflict = await hasTableConflict({
        date: current.booking_date,
        selectedTable: current.selected_table,
        excludeBookingId: bookingId,
        conn,
      });
      if (isConflict) {
        await conn.rollback();
        return res.status(409).json({
          success: false,
          message: "Bàn này đã có lịch đặt trong ngày đã chọn.",
        });
      }
    }

    await conn.query(
      `UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [status, bookingId],
    );

    const [rows] = await conn.query(
      `SELECT * FROM bookings WHERE id = ? LIMIT 1`,
      [bookingId],
    );
    await conn.commit();

    try {
      getIO().emit("table_updated", { source: "booking_status_updated" });
      getIO().emit("booking_updated", { id: bookingId, status });
    } catch (err) {
      console.error("Emit error:", err);
    }

    if (rows[0] && rows[0].email) {
      if (status === "confirmed" || status === "cancelled") {
        try {
          const { sendBookingEmail } = require("../utils/mail");
          sendBookingEmail({
            to: rows[0].email,
            name: rows[0].customer_name,
            bookingCode: rows[0].booking_code,
            status: status,
            date: rows[0].booking_date ? new Date(rows[0].booking_date).toLocaleDateString("vi-VN") : "",
            time: rows[0].booking_time,
            guests: rows[0].guests,
            note: rows[0].note || null,
            total: Number(rows[0].total || 0)
          }).catch(err => console.error("Lỗi gửi mail cập nhật trạng thái đặt bàn:", err));
        } catch (mailErr) {
          console.error("Lỗi khởi tạo mail utility:", mailErr);
        }
      }
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái đặt bàn thành công.",
      booking: mapBooking(rows[0]),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi cập nhật trạng thái đặt bàn:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Lỗi server khi cập nhật trạng thái đặt bàn.",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

exports.adminDeleteBooking = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    await db.query(
      `UPDATE bookings SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [bookingId],
    );
    res.json({
      success: true,
      message: "Xóa đặt bàn thành công.",
      bookingId,
    });
  } catch (error) {
    console.error("Lỗi xóa đặt bàn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa đặt bàn.",
      error: error.message,
    });
  }
};

exports.adminUpdateItems = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const cartItems = req.body.cartItems || [];
    let totalQty = 0;
    let subtotal = 0;
    cartItems.forEach((item) => {
      totalQty += Number(item.qty || 0);
      subtotal += Number(item.price || 0) * Number(item.qty || 0);
    });
    const total = subtotal;

    await db.query(
      `UPDATE bookings SET cart_items = ?, subtotal = ?, total = ?, total_qty = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [JSON.stringify(cartItems), subtotal, total, totalQty, bookingId],
    );

    const [rows] = await db.query(
      `SELECT * FROM bookings WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [bookingId],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn để cập nhật món ăn.",
      });
    }

    res.json({
      success: true,
      booking: mapBooking(rows[0]),
    });
  } catch (error) {
    console.error("Lỗi cập nhật món ăn đặt bàn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật món ăn.",
      error: error.message,
    });
  }
};

exports.adminUpdatePayment = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { paymentMethod, paymentStatus, couponCode, discountAmount, total } =
      req.body;

    await db.query(
      `UPDATE bookings SET payment_method = ?, payment_status = ?, paid_at = ?, coupon_code = ?, discount_amount = ?, total = ? WHERE id = ? AND deleted_at IS NULL`,
      [
        paymentMethod || null,
        paymentStatus || "unpaid",
        paymentStatus === "paid" ? new Date() : null,
        couponCode || null,
        Number(discountAmount || 0),
        Number(total || 0),
        bookingId,
      ],
    );

    const [rows] = await db.query(
      `SELECT * FROM bookings WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [bookingId],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn để cập nhật thanh toán.",
      });
    }

    res.json({
      success: true,
      booking: mapBooking(rows[0]),
    });
  } catch (error) {
    console.error("Lỗi xác nhận thanh toán:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận thanh toán.",
      error: error.message,
    });
  }
};
