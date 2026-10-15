const express = require("express");
const db = require("../config/db");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { getIO } = require("../config/socket");
const {
  requireAuth,
  requireBackOffice,
  requireManagerOrAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Configure storage for space images
const uploadDir = path.join(__dirname, "../../uploads/spaces");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const spaceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `space-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const uploadSpaceImages = multer({
  storage: spaceStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Chỉ hỗ trợ tải lên các tệp định dạng JPG, JPEG, PNG, WEBP."),
      );
    }
  },
});

// Helper to format output space data with images sorted (cover first)
function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):5001/, "");
}

function formatSpaces(spacesRows, imagesRows, tableStatsMap = {}) {
  return spacesRows.map((space) => {
    const spaceImages = imagesRows
      .filter((img) => img.space_id === space.id)
      .map((img) => ({
        id: String(img.id),
        url: normalizeImageUrl(img.url),
        title: img.title || "",
        description: img.description || "",
        isCover: img.is_cover === 1,
      }))
      .sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0));

    const stats = tableStatsMap[space.id] || tableStatsMap[space.label] || { tableCount: 0, totalSeats: 0 };
    const capacity = space.capacity > 0 ? space.capacity : stats.totalSeats;

    return {
      id: space.id,
      key: space.space_key,
      label: space.label,
      name: space.label,
      description: space.description || "",
      detailDescription: space.detail_description || "",
      capacity: Number(capacity) || 0,
      tableCount: stats.tableCount || 0,
      order: space.display_order || 1,
      status: space.status || "active",
      coverImage: spaceImages.find((img) => img.isCover)?.url || spaceImages[0]?.url || "",
      images: spaceImages,
    };
  });
}

// 1. GET /api/spaces/active (Public)
router.get("/active", async (req, res) => {
  try {
    const [spaces] = await db.query(
      "SELECT * FROM restaurant_spaces WHERE status = 'active' ORDER BY display_order ASC, id ASC",
    );
    if (spaces.length === 0) {
      return res.json([]);
    }

    const [images] = await db.query(
      "SELECT * FROM space_images WHERE space_id IN (?) ORDER BY is_cover DESC, id ASC",
      [spaces.map((s) => s.id)],
    );

    // Get table stats directly from restaurant_spaces and restaurant_tables.space_id
    const [tableStats] = await db.query(
      `SELECT s.id AS space_id, s.label AS space_name, COUNT(t.id) AS table_count, COALESCE(SUM(t.seats), 0) AS total_seats
       FROM restaurant_spaces s
       LEFT JOIN restaurant_tables t ON t.space_id = s.id AND t.deleted_at IS NULL
       GROUP BY s.id, s.label`,
    );
    const tableStatsMap = {};
    tableStats.forEach((row) => {
      tableStatsMap[row.space_id] = {
        tableCount: Number(row.table_count || 0),
        totalSeats: Number(row.total_seats || 0),
      };
      tableStatsMap[row.space_name] = tableStatsMap[row.space_id];
    });

    const formatted = formatSpaces(spaces, images, tableStatsMap);
    res.json(formatted);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách không gian:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// 2. GET /api/spaces/admin-list (Admin only)
router.get("/admin-list", requireAuth, requireBackOffice, async (req, res) => {
  try {
    const [spaces] = await db.query(
      "SELECT * FROM restaurant_spaces ORDER BY display_order ASC, id ASC",
    );
    if (spaces.length === 0) {
      return res.json([]);
    }

    const [images] = await db.query(
      "SELECT * FROM space_images ORDER BY is_cover DESC, id ASC",
    );

    // Get table stats directly from restaurant_spaces and restaurant_tables.space_id
    const [tableStats] = await db.query(
      `SELECT s.id AS space_id, s.label AS space_name, COUNT(t.id) AS table_count, COALESCE(SUM(t.seats), 0) AS total_seats
       FROM restaurant_spaces s
       LEFT JOIN restaurant_tables t ON t.space_id = s.id AND t.deleted_at IS NULL
       GROUP BY s.id, s.label`,
    );
    const tableStatsMap = {};
    tableStats.forEach((row) => {
      tableStatsMap[row.space_id] = {
        tableCount: Number(row.table_count || 0),
        totalSeats: Number(row.total_seats || 0),
      };
      tableStatsMap[row.space_name] = tableStatsMap[row.space_id];
    });

    const formatted = formatSpaces(spaces, images, tableStatsMap);
    res.json(formatted);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách không gian quản trị:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// 3. POST /api/spaces
router.post("/", requireAuth, requireManagerOrAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      key,
      label,
      description,
      detailDescription,
      capacity,
      order,
      status,
      images,
    } = req.body;

    const cleanLabel = String(label || "").trim();
    if (!cleanLabel) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Tên không gian không được để trống." });
    }

    const randomKey =
      key || "space_" + Math.random().toString(36).substring(2, 9);
    const currentStatus = status || "active";
    const areaStatus = currentStatus === "active" ? "active" : "inactive";

    // 1. Insert into restaurant_spaces
    const [spaceResult] = await conn.query(
      `INSERT INTO restaurant_spaces (space_key, label, description, detail_description, capacity, display_order, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        randomKey,
        cleanLabel,
        description || "",
        detailDescription || "",
        Number(capacity) || 0,
        Number(order) || 1,
        currentStatus,
      ],
    );
    const spaceId = spaceResult.insertId;

    // 2. Insert images if provided
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await conn.query(
          `INSERT INTO space_images (space_id, url, title, description, is_cover) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            spaceId,
            img.url,
            img.title || cleanLabel,
            img.description || "",
            img.isCover ? 1 : i === 0 ? 1 : 0,
          ],
        );
      }
    }

    await conn.commit();

    // Broadcast realtime update
    try {
      getIO().emit("spaces_updated", { action: "create", spaceId, spaceKey: randomKey });
      getIO().emit("areas_updated");
      getIO().emit("table_updated", { source: "space_created" });
    } catch (ioErr) {
      console.error("Socket emit error:", ioErr);
    }

    res.status(201).json({
      success: true,
      message: "Tạo không gian mới thành công",
      space: {
        id: spaceId,
        key: randomKey,
        label: cleanLabel,
        name: cleanLabel,
        description: description || "",
        detailDescription: detailDescription || "",
        capacity: Number(capacity) || 0,
        order: Number(order) || 1,
        status: currentStatus,
        images: images || [],
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi tạo không gian mới:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Không thể tạo không gian mới" });
  } finally {
    conn.release();
  }
});

// 4. PUT /api/spaces/:key
router.put("/:key", requireAuth, requireManagerOrAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { key } = req.params;
    const {
      label,
      description,
      detailDescription,
      capacity,
      order,
      status,
      images,
    } = req.body;

    const cleanLabel = String(label || "").trim();
    if (!cleanLabel) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Tên không gian không được để trống." });
    }

    // Get the existing space
    const [spaces] = await conn.query(
      "SELECT id, label, space_key FROM restaurant_spaces WHERE space_key = ? LIMIT 1 FOR UPDATE",
      [key],
    );
    if (spaces.length === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy không gian" });
    }

    const space = spaces[0];
    const spaceId = space.id;
    const oldLabel = space.label;
    const currentStatus = status || "active";
    const areaStatus = currentStatus === "active" ? "active" : "inactive";

    // 1. Update restaurant_spaces metadata
    await conn.query(
      `UPDATE restaurant_spaces 
       SET label = ?, description = ?, detail_description = ?, capacity = ?, display_order = ?, status = ?
       WHERE id = ?`,
      [
        cleanLabel,
        description || "",
        detailDescription || "",
        Number(capacity) || 0,
        Number(order) || 1,
        currentStatus,
        spaceId,
      ],
    );

    // 2. Clean up deleted physical files if any and update images in space_images
    const [oldImages] = await conn.query("SELECT url FROM space_images WHERE space_id = ?", [spaceId]);
    const newImageUrls = Array.isArray(images) ? images.map((img) => img.url) : [];

    for (const oldImg of oldImages) {
      if (oldImg.url && oldImg.url.startsWith("/uploads/spaces/") && !newImageUrls.includes(oldImg.url)) {
        const filename = path.basename(oldImg.url);
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkErr) {
            console.warn("Không thể xóa file ảnh vật lý cũ:", unlinkErr.message);
          }
        }
      }
    }

    await conn.query("DELETE FROM space_images WHERE space_id = ?", [spaceId]);

    if (Array.isArray(images) && images.length > 0) {
      // Find designated cover index, default to first image
      const coverIdx = images.findIndex((img) => img.isCover);
      const targetCoverIdx = coverIdx !== -1 ? coverIdx : 0;

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await conn.query(
          `INSERT INTO space_images (space_id, url, title, description, is_cover) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            spaceId,
            img.url,
            img.title || cleanLabel,
            img.description || "",
            i === targetCoverIdx ? 1 : 0,
          ],
        );
      }
    }

    await conn.commit();

    // Broadcast realtime update
    try {
      getIO().emit("spaces_updated", { action: "update", spaceId, spaceKey: key });
      getIO().emit("areas_updated");
      getIO().emit("table_updated", { source: "space_updated" });
    } catch (ioErr) {
      console.error("Socket emit error:", ioErr);
    }

    res.json({
      success: true,
      message: "Cập nhật không gian thành công",
    });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi cập nhật không gian:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Không thể lưu cập nhật không gian" });
  } finally {
    conn.release();
  }
});

// 5. DELETE /api/spaces/:key
router.delete("/:key", requireAuth, requireManagerOrAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { key } = req.params;
    const [spaces] = await conn.query(
      "SELECT id, label, space_key FROM restaurant_spaces WHERE space_key = ? LIMIT 1 FOR UPDATE",
      [key],
    );
    if (spaces.length === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy không gian để xóa" });
    }

    const space = spaces[0];

    // Check if there are tables with active bookings
    const [tables] = await conn.query(
      `SELECT t.id, t.table_code 
       FROM restaurant_tables t 
       WHERE t.space_id = ? AND t.deleted_at IS NULL`,
      [space.id],
    );

    if (tables.length > 0) {
      const tableCodes = tables.map((t) => t.table_code);
      const [activeBookings] = await conn.query(
        `SELECT id FROM bookings WHERE selected_table IN (?) AND status IN ('pending', 'confirmed', 'serving') AND deleted_at IS NULL LIMIT 1`,
        [tableCodes],
      );
      if (activeBookings.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: "Không thể xóa không gian này vì đang có bàn có lịch đặt bàn đang chờ xác nhận hoặc đang phục vụ.",
        });
      }
    }

    // Clean up physical files
    const [oldImages] = await conn.query("SELECT url FROM space_images WHERE space_id = ?", [space.id]);
    for (const oldImg of oldImages) {
      if (oldImg.url && oldImg.url.startsWith("/uploads/spaces/")) {
        const filename = path.basename(oldImg.url);
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkErr) {
            console.warn("Không thể xóa file ảnh vật lý:", unlinkErr.message);
          }
        }
      }
    }

    // Detach and soft-delete tables in this space
    await conn.query("UPDATE restaurant_tables SET space_id = NULL, deleted_at = NOW() WHERE space_id = ?", [space.id]);

    // Delete space images and space
    await conn.query("DELETE FROM space_images WHERE space_id = ?", [space.id]);
    await conn.query("DELETE FROM restaurant_spaces WHERE id = ?", [space.id]);

    await conn.commit();

    // Broadcast realtime update
    try {
      getIO().emit("spaces_updated", { action: "delete", spaceKey: key });
      getIO().emit("areas_updated");
      getIO().emit("table_updated", { source: "space_deleted" });
    } catch (ioErr) {
      console.error("Socket emit error:", ioErr);
    }

    res.json({ success: true, message: "Xóa không gian thành công" });
  } catch (error) {
    await conn.rollback();
    console.error("Lỗi xóa không gian:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Không thể xóa không gian này" });
  } finally {
    conn.release();
  }
});

// 6. POST /api/spaces/upload
router.post(
  "/upload",
  requireAuth,
  requireManagerOrAdmin,
  uploadSpaceImages.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng chọn ảnh để tải lên" });
      }
      const publicUrl = `/uploads/spaces/${req.file.filename}`;
      res.json({
        success: true,
        url: publicUrl,
        fileName: req.file.filename,
      });
    } catch (error) {
      console.error("Lỗi upload ảnh không gian:", error);
      res
        .status(500)
        .json({ success: false, message: "Không thể tải lên hình ảnh" });
    }
  },
);

module.exports = router;

