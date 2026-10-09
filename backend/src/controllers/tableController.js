const db = require("../config/db");
const { getIO } = require("../config/socket");
const { createActivityLog } = require("../utils/activityLog");
const { sendTablePinEmail } = require("../utils/mail");

const TABLE_STATUSES = ["available", "reserved", "serving", "cleaning"];

function removeVietnameseTones(str = "") {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function escapeRegExp(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAreaCodeConfig(areaName = "") {
  const normalizedName = removeVietnameseTones(areaName);
  if (normalizedName.includes("vip")) {
    return { type: "text", prefix: "VIP" };
  }
  const floorMatch = normalizedName.match(/tang\s*(\d+)/);
  if (floorMatch) {
    return { type: "floor", prefix: String(floorMatch[1]) };
  }
  if (normalizedName.includes("tret")) {
    return { type: "floor", prefix: "1" };
  }
  if (normalizedName.includes("san vuon")) {
    return { type: "text", prefix: "SV" };
  }
  const prefix =
    normalizedName
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "KV";
  return { type: "text", prefix };
}

async function generateTableCodeByArea(spaceIdOrAreaId) {
  const [spaceRows] = await db.query(
    `SELECT id, label AS name FROM restaurant_spaces WHERE id = ? AND status = 'active' LIMIT 1`,
    [spaceIdOrAreaId],
  );
  if (spaceRows.length === 0) {
    const error = new Error("Không gian / Khu vực không tồn tại hoặc đang tạm ẩn.");
    error.statusCode = 400;
    throw error;
  }
  const spaceName = spaceRows[0].name;

  const config = getAreaCodeConfig(spaceName);
  const safePrefix = escapeRegExp(config.prefix);

  const [tableRows] = await db.query(
    `SELECT table_code FROM restaurant_tables WHERE deleted_at IS NULL`,
  );
  const usedNumbers = tableRows
    .map((row) => String(row.table_code || "").trim())
    .map((code) => {
      if (config.type === "floor") {
        const match = code.match(new RegExp(`^${safePrefix}(\\d{2})$`));
        return match ? Number(match[1]) : null;
      }
      const match = code.match(new RegExp(`^${safePrefix}(\\d+)$`, "i"));
      return match ? Number(match[1]) : null;
    })
    .filter((number) => Number.isInteger(number));

  let nextNumber = 1;
  while (usedNumbers.includes(nextNumber)) {
    nextNumber += 1;
  }
  return `${config.prefix}${String(nextNumber).padStart(2, "0")}`;
}

const mapArea = (row) => ({
  id: row.id,
  spaceId: row.id,
  areaId: row.id,
  name: row.label || row.name,
  title: row.label || row.name,
  label: row.label || row.name,
  description: row.description || "",
  status: row.status,
  capacity: Number(row.capacity || row.total_seats || 0),
  seats: Number(row.total_seats || row.capacity || 0),
  tableCount: Number(row.table_count || 0),
  image: row.cover_image || row.image_url || "",
  imageUrl: row.cover_image || row.image_url || "",
  spaceKey: row.space_key || "",
  displayOrder: row.display_order || 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTable = (row) => ({
  id: row.id,
  spaceId: row.space_id || row.area_id,
  areaId: row.space_id || row.area_id,
  areaName: row.space_label || row.area_name || "",
  spaceName: row.space_label || row.area_name || "",
  spaceKey: row.space_key || "",
  code: row.table_code,
  tableCode: row.table_code,
  capacity: row.seats,
  seats: row.seats,
  status: row.status,
  description: row.description,
  pinCode: row.pin_code || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

exports.getAreas = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         s.id, 
         s.space_key,
         s.label AS name,
         s.label, 
         s.description, 
         s.capacity,
         s.display_order,
         s.status, 
         s.created_at, 
         s.updated_at,
         COUNT(t.id) AS table_count,
         COALESCE(SUM(t.seats), 0) AS total_seats,
         (
           SELECT si.url 
           FROM space_images si 
           WHERE si.space_id = s.id 
           ORDER BY si.is_cover DESC, si.id ASC 
           LIMIT 1
         ) AS cover_image
       FROM restaurant_spaces s
       LEFT JOIN restaurant_tables t ON t.space_id = s.id AND t.deleted_at IS NULL
       WHERE s.status = 'active'
       GROUP BY s.id, s.space_key, s.label, s.description, s.capacity, s.display_order, s.status, s.created_at, s.updated_at
       ORDER BY s.display_order ASC, s.id ASC`,
    );
    res.json({ success: true, areas: rows.map(mapArea), spaces: rows.map(mapArea) });
  } catch (error) {
    console.error("Lỗi lấy không gian/khu vực:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy không gian/khu vực.",
      error: error.message,
    });
  }
};

exports.createArea = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const name = String(req.body.name || req.body.label || "").trim();
    const description = String(req.body.description || "").trim();
    if (!name) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tên không gian / khu vực." });
    }

    const [maxOrderRows] = await conn.query(
      "SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM restaurant_spaces",
    );
    const nextOrder = maxOrderRows[0]?.next_order || 1;

    const spaceKey =
      "space_" +
      Math.random().toString(36).substring(2, 8);

    const [result] = await conn.query(
      `INSERT INTO restaurant_spaces (space_key, label, description, detail_description, capacity, display_order, status) 
       VALUES (?, ?, ?, '', 0, ?, 'active')`,
      [spaceKey, name, description || "", nextOrder],
    );
    const spaceId = result.insertId;

    const [rows] = await conn.query(`SELECT * FROM restaurant_spaces WHERE id = ? LIMIT 1`, [
      spaceId,
    ]);

    await conn.commit();

    try {
      getIO().emit("spaces_updated", { action: "create", spaceId });
      getIO().emit("areas_updated");
      getIO().emit("table_updated", { source: "space_created" });
    } catch (ioErr) {
      console.error("Socket emit error:", ioErr);
    }

    res.status(201).json({
      success: true,
      message: "Thêm không gian / khu vực thành công.",
      area: mapArea(rows[0]),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi thêm không gian / khu vực:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm không gian / khu vực.",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

exports.updateArea = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const spaceId = Number(req.params.id);
    const name = String(req.body.name || req.body.label || "").trim();
    const description = String(req.body.description || "").trim();
    if (!name) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tên không gian / khu vực." });
    }

    await conn.query(
      `UPDATE restaurant_spaces 
       SET label = ?, description = ?, updated_at = NOW() 
       WHERE id = ?`,
      [name, description || "", spaceId],
    );

    const [rows] = await conn.query(`SELECT * FROM restaurant_spaces WHERE id = ? LIMIT 1`, [
      spaceId,
    ]);

    await conn.commit();

    try {
      getIO().emit("spaces_updated", { action: "update", spaceId });
      getIO().emit("areas_updated");
      getIO().emit("table_updated", { source: "space_updated" });
    } catch (ioErr) {
      console.error("Socket emit error:", ioErr);
    }

    res.json({
      success: true,
      message: "Cập nhật không gian / khu vực thành công.",
      area: mapArea(rows[0]),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi cập nhật không gian / khu vực:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật không gian / khu vực.",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

exports.deleteArea = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const spaceId = Number(req.params.id);
    const [tableRows] = await conn.query(
      `SELECT id, table_code FROM restaurant_tables WHERE space_id = ? AND deleted_at IS NULL`,
      [spaceId],
    );
    if (tableRows.length > 0) {
      const tableCodes = tableRows.map((t) => t.table_code);
      const [bookingRows] = await conn.query(
        `SELECT id FROM bookings WHERE selected_table IN (?) AND status IN ('pending', 'confirmed', 'serving') AND deleted_at IS NULL LIMIT 1`,
        [tableCodes],
      );
      if (bookingRows.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: "Không thể xóa không gian đang có bàn có lịch đặt bàn hoặc đang phục vụ.",
        });
      }
    }

    await conn.query("DELETE FROM space_images WHERE space_id = ?", [spaceId]);
    await conn.query("DELETE FROM restaurant_spaces WHERE id = ?", [spaceId]);

    await conn.commit();

    try {
      getIO().emit("spaces_updated", { action: "delete", spaceId });
      getIO().emit("areas_updated");
      getIO().emit("table_updated", { source: "space_deleted" });
    } catch (ioErr) {
      console.error("Socket emit error:", ioErr);
    }

    res.json({ success: true, message: "Xóa không gian / khu vực thành công.", areaId: spaceId, spaceId });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi xóa không gian / khu vực:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa không gian / khu vực.",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

exports.getTables = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, s.label AS space_label, s.label AS area_name, s.space_key 
       FROM restaurant_tables t 
       LEFT JOIN restaurant_spaces s ON s.id = t.space_id 
       WHERE t.deleted_at IS NULL 
       ORDER BY s.display_order ASC, s.id ASC, t.table_code ASC`,
    );
    res.json({ success: true, tables: rows.map(mapTable) });
  } catch (error) {
    console.error("Lỗi lấy danh sách bàn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách bàn.",
      error: error.message,
    });
  }
};

exports.createTable = async (req, res) => {
  try {
    const spaceId = Number(req.body.spaceId || req.body.areaId);
    let code = String(req.body.code || req.body.tableCode || "").trim();
    const seats = Number(req.body.capacity || req.body.seats || 4);
    const status = String(req.body.status || "available").trim();
    const description = String(req.body.description || "").trim();

    if (!spaceId) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng chọn không gian / khu vực." });
    }
    if (!Number.isInteger(seats) || seats <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Sức chứa bàn không hợp lệ." });
    }
    if (!TABLE_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái bàn không hợp lệ." });
    }

    if (!code) {
      code = await generateTableCodeByArea(spaceId);
    }

    const [existedRows] = await db.query(
      `SELECT id FROM restaurant_tables WHERE table_code = ? AND deleted_at IS NULL LIMIT 1`,
      [code],
    );
    if (existedRows.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Mã bàn đã tồn tại." });
    }

    const [result] = await db.query(
      `INSERT INTO restaurant_tables (space_id, table_code, seats, status, description) VALUES (?, ?, ?, ?, ?)`,
      [spaceId, code, seats, status, description || null],
    );

    const [rows] = await db.query(
      `SELECT t.*, s.label AS space_label, s.label AS area_name, s.space_key 
       FROM restaurant_tables t 
       LEFT JOIN restaurant_spaces s ON s.id = t.space_id 
       WHERE t.id = ? LIMIT 1`,
      [result.insertId],
    );

    await createActivityLog({
      targetUserId: req.user.id,
      actorUserId: req.user.id,
      action: "add_table",
      message: `Đã thêm bàn mới: ${code}`,
    }).catch((err) => console.error("Log error:", err));

    res.status(201).json({
      success: true,
      message: "Thêm bàn thành công.",
      table: mapTable(rows[0]),
    });
  } catch (error) {
    console.error("Lỗi thêm bàn:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Lỗi server khi thêm bàn.",
      error: error.message,
    });
  }
};

exports.updateTable = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const tableId = Number(req.params.id);
    const spaceId = Number(req.body.spaceId || req.body.areaId);
    const code = String(req.body.code || req.body.tableCode || "").trim();
    const seats = Number(req.body.capacity || req.body.seats || 4);
    const status = String(req.body.status || "available").trim();
    const description = String(req.body.description || "").trim();

    if (!spaceId || !code) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn không gian / khu vực và nhập mã bàn.",
      });
    }
    if (!TABLE_STATUSES.includes(status)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái bàn không hợp lệ." });
    }

    if (["maintenance", "disabled"].includes(status)) {
      const [bookingRows] = await conn.query(
        `SELECT id FROM bookings WHERE selected_table = (SELECT table_code FROM restaurant_tables WHERE id = ? LIMIT 1) AND status IN ('pending', 'confirmed') AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
        [tableId],
      );
      if (bookingRows.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message:
            "Không thể đổi trạng thái bàn vì bàn đang có lịch đặt chờ xác nhận hoặc đã xác nhận.",
        });
      }
    }

    const [existedRows] = await conn.query(
      `SELECT id FROM restaurant_tables WHERE table_code = ? AND id != ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      [code, tableId],
    );
    if (existedRows.length > 0) {
      await conn.rollback();
      return res
        .status(409)
        .json({ success: false, message: "Mã bàn đã tồn tại." });
    }

    await conn.query(
      `UPDATE restaurant_tables SET space_id = ?, table_code = ?, seats = ?, status = ?, description = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [spaceId, code, seats, status, description || null, tableId],
    );

    const [rows] = await conn.query(
      `SELECT t.*, s.label AS space_label, s.label AS area_name, s.space_key 
       FROM restaurant_tables t 
       LEFT JOIN restaurant_spaces s ON s.id = t.space_id 
       WHERE t.id = ? LIMIT 1`,
      [tableId],
    );

    await conn.commit();
    try {
      getIO().emit("table_updated", { tableId });
    } catch (err) {
      console.error("Emit error:", err);
    }
    res.json({
      success: true,
      message: "Cập nhật bàn thành công.",
      table: mapTable(rows[0]),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi cập nhật bàn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật bàn.",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

exports.updateTableStatus = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const tableId = Number(req.params.id);
    const status = String(req.body.status || "").trim();

    if (!TABLE_STATUSES.includes(status)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái bàn không hợp lệ." });
    }

    const [tableRows] = await conn.query(
      `SELECT id, table_code FROM restaurant_tables WHERE id = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      [tableId],
    );
    if (tableRows.length === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bàn." });
    }
    const table = tableRows[0];

    if (["maintenance", "disabled"].includes(status)) {
      const [bookingRows] = await conn.query(
        `SELECT id FROM bookings WHERE selected_table = ? AND status IN ('pending', 'confirmed') AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
        [table.table_code],
      );
      if (bookingRows.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message:
            "Không thể đổi trạng thái bàn vì bàn đang có lịch đặt chờ xác nhận hoặc đã xác nhận.",
        });
      }
    }

    let generatedPin = null;
    if (status === "serving") {
      generatedPin = String(Math.floor(1000 + Math.random() * 9000));
      await conn.query(
        `UPDATE restaurant_tables SET status = ?, pin_code = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
        [status, generatedPin, tableId],
      );
      await conn.query(
        `UPDATE bookings SET status = 'serving', updated_at = NOW() WHERE selected_table = ? AND status = 'confirmed' AND deleted_at IS NULL`,
        [table.table_code],
      );
    } else {
      await conn.query(
        `UPDATE restaurant_tables SET status = ?, pin_code = NULL, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
        [status, tableId],
      );
      if (status === "available") {
        await conn.query(
          `UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE selected_table = ? AND status IN ('serving', 'confirmed') AND deleted_at IS NULL`,
          [table.table_code],
        );
      }
    }

    const [rows] = await conn.query(
      `SELECT t.*, s.label AS space_label, s.label AS area_name, s.space_key 
       FROM restaurant_tables t 
       LEFT JOIN restaurant_spaces s ON s.id = t.space_id 
       WHERE t.id = ? LIMIT 1`,
      [tableId],
    );

    await conn.commit();
    try {
      getIO().emit("table_updated", { tableId });
    } catch (err) {
      console.error("Emit error:", err);
    }

    // Gửi email mã PIN không đồng bộ (không block response)
    if (generatedPin) {
      db.query(
        `SELECT customer_name, email, booking_code, booking_date, booking_time
         FROM bookings
         WHERE selected_table = ? AND status = 'serving' AND deleted_at IS NULL
         ORDER BY updated_at DESC LIMIT 1`,
        [table.table_code]
      ).then(([bookingRows]) => {
        if (bookingRows.length > 0) {
          const b = bookingRows[0];
          if (b.email) {
            sendTablePinEmail({
              to: b.email,
              name: b.customer_name || "Quý khách",
              bookingCode: b.booking_code || "",
              tableCode: table.table_code,
              pinCode: generatedPin,
              date: b.booking_date ? new Date(b.booking_date).toLocaleDateString("vi-VN") : "",
              time: b.booking_time || "",
            }).then(() => {
              console.log(`[PIN-Email] ✔️ Đã gửi mã PIN ${generatedPin} cho bàn ${table.table_code} tới ${b.email}`);
            }).catch(err => {
              console.error(`[PIN-Email] ❌ Lỗi gửi email PIN cho bàn ${table.table_code}:`, err);
            });
          }
        }
      }).catch(err => {
        console.error("[PIN-Email] Lỗi truy vấn booking:", err);
      });
    }
    if (["maintenance", "disabled"].includes(status)) {
      await createActivityLog({
        targetUserId: req.user.id,
        actorUserId: req.user.id,
        action: "update_table_status",
        message: `Đã đổi trạng thái bàn ${table.table_code} sang ${status}`,
      }).catch((err) => console.error("Log error:", err));
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái bàn thành công.",
      table: mapTable(rows[0]),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi cập nhật trạng thái bàn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái bàn.",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const tableId = Number(req.params.id);
    const [bookingRows] = await db.query(
      `SELECT id FROM bookings WHERE selected_table = (SELECT table_code FROM restaurant_tables WHERE id = ? LIMIT 1) AND status IN ('pending', 'confirmed') AND deleted_at IS NULL LIMIT 1`,
      [tableId],
    );
    if (bookingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa bàn đang có lịch đặt.",
      });
    }

    await db.query(
      `UPDATE restaurant_tables SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [tableId],
    );

    await createActivityLog({
      targetUserId: req.user.id,
      actorUserId: req.user.id,
      action: "delete_table",
      message: `Đã xóa bàn ID ${tableId}`,
    }).catch((err) => console.error("Log error:", err));

    res.json({ success: true, message: "Xóa bàn thành công.", tableId });
  } catch (error) {
    console.error("Lỗi xóa bàn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa bàn.",
      error: error.message,
    });
  }
};

exports.checkTableByCode = async (req, res) => {
  try {
    const code = req.params.code;
    const [rows] = await db.query(
      `SELECT t.id, t.table_code, t.status, t.seats, t.pin_code, s.label AS area_name, s.label AS space_name
       FROM restaurant_tables t
       LEFT JOIN restaurant_spaces s ON s.id = t.space_id
       WHERE LOWER(t.table_code) = LOWER(?) AND t.deleted_at IS NULL LIMIT 1`,
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bàn." });
    }

    const table = rows[0];
    res.json({
      success: true,
      table: {
        id: table.id,
        code: table.table_code,
        status: table.status,
        seats: table.seats,
        areaName: table.area_name || table.space_name,
        isServing: table.status === "serving",
      }
    });
  } catch (error) {
    console.error("Lỗi kiểm tra bàn:", error);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};
