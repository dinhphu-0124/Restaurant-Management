const jwt = require("jsonwebtoken");
const db = require("../config/db");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Token không chứa thông tin tài khoản.",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        id,
        name,
        full_name,
        phone,
        email,
        address,
        avatar,
        role,
        status,
        email_verified,
        created_at
      FROM users
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
      `,
      [decoded.id],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại.",
      });
    }

    const user = rows[0];

    if (user.status === "locked") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ nhà hàng.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_INACTIVE",
        message: "Tài khoản không còn hoạt động.",
      });
    }

    req.user = {
      id: user.id,
      name: user.name || user.full_name,
      fullName: user.full_name || user.name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      emailVerified: Boolean(user.email_verified),
      createdAt: user.created_at,
    };

    next();
  } catch (error) {
    if (error.name !== "TokenExpiredError" && error.name !== "JsonWebTokenError") {
      console.error("Lỗi requireAuth:", error);
    }

    return res.status(401).json({
      success: false,
      message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
      error: error.message,
    });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Bạn không có quyền thực hiện thao tác này.",
      });
    }
    next();
  };
}

const requireAdmin = requireRoles("admin");
const requireManagerOrAdmin = requireRoles("manager", "admin");
const requireStaffOrHigher = requireRoles(
  "staff",
  "manager",
  "admin",
  "cashier",
  "waiter",
  "chef",
);
const requireBackOffice = requireStaffOrHigher;

const requireCashierOrHigher = requireRoles("cashier", "manager", "admin");
const requireWaiterOrHigher = requireRoles("waiter", "manager", "admin");
const requireChefOrHigher = requireRoles("chef", "manager", "admin");

module.exports = {
  requireAuth,
  requireAdmin,
  requireManagerOrAdmin,
  requireStaffOrHigher,
  requireBackOffice,
  requireCashierOrHigher,
  requireWaiterOrHigher,
  requireChefOrHigher,
  requireRoles,
};
