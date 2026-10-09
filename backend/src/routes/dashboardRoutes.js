const express = require("express");
const router = express.Router();
const {
  requireAuth,
  requireBackOffice,
} = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getDashboardNotifications,
} = require("../controllers/dashboardController");

router.get("/stats", requireAuth, requireBackOffice, getDashboardStats);
router.get(
  "/notifications",
  requireAuth,
  requireBackOffice,
  getDashboardNotifications,
);

module.exports = router;
