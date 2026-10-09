const express = require("express");
const {
  requireAuth,
  requireBackOffice,
  requireManagerOrAdmin,
} = require("../middleware/authMiddleware");
const tableController = require("../controllers/tableController");

const router = express.Router();

// GET /api/tables/areas - Lấy danh sách khu vực
router.get("/areas", tableController.getAreas);

// POST /api/tables/areas - Tạo khu vực mới
router.post(
  "/areas",
  requireAuth,
  requireManagerOrAdmin,
  tableController.createArea,
);

// PATCH /api/tables/areas/:id - Cập nhật khu vực
router.patch(
  "/areas/:id",
  requireAuth,
  requireManagerOrAdmin,
  tableController.updateArea,
);

// DELETE /api/tables/areas/:id - Xóa khu vực
router.delete(
  "/areas/:id",
  requireAuth,
  requireManagerOrAdmin,
  tableController.deleteArea,
);

// GET /api/tables/check/:code - Kiểm tra trạng thái bàn theo mã (public, không cần auth)
router.get("/check/:code", tableController.checkTableByCode);

// GET /api/tables - Lấy danh sách bàn
router.get("/", tableController.getTables);

// POST /api/tables - Tạo bàn mới
router.post(
  "/",
  requireAuth,
  requireManagerOrAdmin,
  tableController.createTable,
);

// PATCH /api/tables/:id - Cập nhật bàn
router.patch(
  "/:id",
  requireAuth,
  requireManagerOrAdmin,
  tableController.updateTable,
);

// PATCH /api/tables/:id/status - Cập nhật trạng thái bàn
router.patch(
  "/:id/status",
  requireAuth,
  requireBackOffice,
  tableController.updateTableStatus,
);

// DELETE /api/tables/:id - Xóa bàn
router.delete(
  "/:id",
  requireAuth,
  requireManagerOrAdmin,
  tableController.deleteTable,
);

module.exports = router;
