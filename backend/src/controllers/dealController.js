const db = require("../config/db");
const { createActivityLog } = require("../utils/activityLog");

const DEFAULT_SERVICE_CONDITION_ITEMS = {
  dinein: [],
  delivery: [],
  pickup: [],
};

function parseJsonValue(value, fallback) {
  if (!value) return fallback;
  try {
    if (typeof value === "object") return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toJsonString(value, fallback) {
  try {
    return JSON.stringify(value ?? fallback);
  } catch {
    return JSON.stringify(fallback);
  }
}

function parseMoney(value) {
  return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function formatDateOnly(value) {
  if (!value) return "";
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapDeal(row) {
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle || "",
    type: row.type || "Combo",
    discount: row.discount || "",
    condition: Number(row.condition_amount || 0),
    conditionItems: parseJsonValue(row.condition_items, []),
    serviceConditionItems: parseJsonValue(
      row.service_condition_items,
      DEFAULT_SERVICE_CONDITION_ITEMS,
    ),
    serviceTypes: parseJsonValue(row.service_types, [
      "dinein",
      "delivery",
      "pickup",
    ]),
    startDate: formatDateOnly(row.start_date),
    endDate: formatDateOnly(row.end_date),
    status: row.status || "active",
    usageLimit: Number(row.usage_limit || 0),
    used: Number(row.used_count || 0),
    totalDiscount: Number(row.total_discount || 0),
    usageHistory: parseJsonValue(row.usage_history, []),
    desc: row.description || "",
    cardImage: row.card_image || "",
    detailImage: row.detail_image || "",
    bannerImage: row.banner_image || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeDealPayload(body = {}) {
  const code = String(body.code || "")
    .trim()
    .toUpperCase();
  const name = String(body.name || "").trim();
  const serviceTypes =
    Array.isArray(body.serviceTypes) && body.serviceTypes.length > 0
      ? body.serviceTypes
      : ["dinein", "delivery", "pickup"];

  const serviceConditionItems = {
    dinein: serviceTypes.includes("dinein")
      ? body.serviceConditionItems?.dinein || []
      : [],
    delivery: serviceTypes.includes("delivery")
      ? body.serviceConditionItems?.delivery || []
      : [],
    pickup: serviceTypes.includes("pickup")
      ? body.serviceConditionItems?.pickup || []
      : [],
  };

  return {
    id: body.id || null,
    code,
    slug: body.slug || createSlug(code || name),
    name,
    subtitle: String(body.subtitle || "").trim(),
    type: body.type || "Combo",
    discount: String(body.discount || "").trim(),
    conditionAmount: parseMoney(body.condition),
    conditionItems: Array.isArray(body.conditionItems)
      ? body.conditionItems.filter((item) => String(item).trim() !== "")
      : [],
    serviceConditionItems,
    serviceTypes,
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    status: body.status || "active",
    usageLimit: Number(body.usageLimit || 0),
    used: Number(body.used || 0),
    totalDiscount: Number(body.totalDiscount || 0),
    usageHistory: Array.isArray(body.usageHistory) ? body.usageHistory : [],
    desc: String(body.desc || "").trim(),
    cardImage: body.cardImage || "",
    detailImage: body.detailImage || "",
    bannerImage: body.bannerImage || "",
  };
}

exports.getDeals = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM deals
      ORDER BY created_at DESC, id DESC
    `);
    res.json({
      success: true,
      deals: rows.map(mapDeal),
    });
  } catch (error) {
    console.error("Lỗi lấy khuyến mãi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách khuyến mãi.",
      error: error.message,
    });
  }
};

exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Chưa có ảnh được upload.",
    });
  }
  res.json({
    success: true,
    imageUrl: `${req.protocol}://${req.get("host")}/uploads/deals/${req.file.filename}`,
  });
};

exports.createDeal = async (req, res) => {
  try {
    const deal = normalizeDealPayload(req.body);

    if (!deal.code) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã khuyến mãi.",
      });
    }

    if (!deal.name) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên chương trình.",
      });
    }

    if (!deal.startDate || !deal.endDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ngày bắt đầu và ngày kết thúc.",
      });
    }

    const startMatch = String(deal.startDate).slice(0, 10);
    const endMatch = String(deal.endDate).slice(0, 10);
    const startObj = new Date(`${startMatch}T00:00:00+07:00`);
    const endObj = new Date(`${endMatch}T23:59:59.999+07:00`);

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime()) || startObj > endObj) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc phải diễn ra sau hoặc cùng ngày với ngày bắt đầu.",
      });
    }

    const [existedRows] = await db.query(
      `
      SELECT id
      FROM deals
      WHERE UPPER(code) = UPPER(?)
      LIMIT 1
      `,
      [deal.code],
    );

    if (existedRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Mã khuyến mãi đã tồn tại.",
      });
    }

    await db.query(
      `
      INSERT INTO deals (
        id,
        code,
        slug,
        name,
        subtitle,
        type,
        discount,
        condition_amount,
        condition_items,
        service_condition_items,
        service_types,
        start_date,
        end_date,
        status,
        usage_limit,
        used_count,
        total_discount,
        usage_history,
        description,
        card_image,
        detail_image,
        banner_image,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        deal.id,
        deal.code,
        deal.slug,
        deal.name,
        deal.subtitle,
        deal.type,
        deal.discount,
        deal.conditionAmount,
        toJsonString(deal.conditionItems, []),
        toJsonString(
          deal.serviceConditionItems,
          DEFAULT_SERVICE_CONDITION_ITEMS,
        ),
        toJsonString(deal.serviceTypes, []),
        deal.startDate,
        deal.endDate,
        deal.status,
        deal.usageLimit,
        deal.used,
        deal.totalDiscount,
        toJsonString(deal.usageHistory, []),
        deal.desc,
        deal.cardImage,
        deal.detailImage,
        deal.bannerImage,
      ],
    );

    const [rows] = await db.query(
      `
      SELECT *
      FROM deals
      WHERE code = ?
      LIMIT 1
      `,
      [deal.code],
    );

    const createdDeal = mapDeal(rows[0]);
    if (req.user?.id) {
      await createActivityLog({
        targetUserId: req.user.id,
        actorUserId: req.user.id,
        action: "DEAL_CREATE",
        message: `Tạo chương trình khuyến mãi "${createdDeal.name}" (${createdDeal.code})`,
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      deal: createdDeal,
    });
  } catch (error) {
    console.error("Lỗi thêm khuyến mãi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi thêm khuyến mãi.",
      error: error.message,
    });
  }
};

exports.updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const deal = normalizeDealPayload(req.body);

    const [currentRows] = await db.query(
      `
      SELECT *
      FROM deals
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    if (currentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi.",
      });
    }

    const [duplicateRows] = await db.query(
      `
      SELECT id
      FROM deals
      WHERE UPPER(code) = UPPER(?) AND id <> ?
      LIMIT 1
      `,
      [deal.code, id],
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Mã khuyến mãi đã tồn tại.",
      });
    }

    if (deal.startDate && deal.endDate) {
      const startMatch = String(deal.startDate).slice(0, 10);
      const endMatch = String(deal.endDate).slice(0, 10);
      const startObj = new Date(`${startMatch}T00:00:00+07:00`);
      const endObj = new Date(`${endMatch}T23:59:59.999+07:00`);

      if (isNaN(startObj.getTime()) || isNaN(endObj.getTime()) || startObj > endObj) {
        return res.status(400).json({
          success: false,
          message: "Ngày kết thúc phải diễn ra sau hoặc cùng ngày với ngày bắt đầu.",
        });
      }
    }

    await db.query(
      `
      UPDATE deals
      SET
        code = ?,
        slug = ?,
        name = ?,
        subtitle = ?,
        type = ?,
        discount = ?,
        condition_amount = ?,
        condition_items = ?,
        service_condition_items = ?,
        service_types = ?,
        start_date = ?,
        end_date = ?,
        status = ?,
        usage_limit = ?,
        used_count = ?,
        total_discount = ?,
        usage_history = ?,
        description = ?,
        card_image = ?,
        detail_image = ?,
        banner_image = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        deal.code,
        deal.slug,
        deal.name,
        deal.subtitle,
        deal.type,
        deal.discount,
        deal.conditionAmount,
        toJsonString(deal.conditionItems, []),
        toJsonString(
          deal.serviceConditionItems,
          DEFAULT_SERVICE_CONDITION_ITEMS,
        ),
        toJsonString(deal.serviceTypes, []),
        deal.startDate,
        deal.endDate,
        deal.status,
        deal.usageLimit,
        deal.used,
        deal.totalDiscount,
        toJsonString(deal.usageHistory, []),
        deal.desc,
        deal.cardImage,
        deal.detailImage,
        deal.bannerImage,
        id,
      ],
    );

    const [rows] = await db.query(
      `
      SELECT *
      FROM deals
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    const updatedDeal = mapDeal(rows[0]);
    if (req.user?.id) {
      await createActivityLog({
        targetUserId: req.user.id,
        actorUserId: req.user.id,
        action: "DEAL_UPDATE",
        message: `Cập nhật chương trình khuyến mãi "${updatedDeal.name}" (${updatedDeal.code})`,
      }).catch(() => {});
    }

    res.json({
      success: true,
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("Lỗi cập nhật khuyến mãi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật khuyến mãi.",
      error: error.message,
    });
  }
};

exports.deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const [dealRows] = await db.query(
      `SELECT id, code, name, used_count FROM deals WHERE id = ? LIMIT 1`,
      [id],
    );

    if (dealRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi.",
      });
    }

    const deal = dealRows[0];
    const usedCount = Number(deal.used_count || 0);

    // Nếu đã có lượt sử dụng thực tế: Archive thay vì Hard Delete để bảo toàn kế toán và báo cáo
    if (usedCount > 0) {
      await db.query(
        `UPDATE deals SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
        [id],
      );
      if (req.user?.id) {
        await createActivityLog({
          targetUserId: req.user.id,
          actorUserId: req.user.id,
          action: "DEAL_ARCHIVE",
          message: `Lưu trữ (hủy) chương trình khuyến mãi "${deal.name}" (${deal.code}) do đã có ${usedCount} lượt sử dụng.`,
        }).catch(() => {});
      }
      return res.json({
        success: true,
        archived: true,
        message: `Chương trình đã có ${usedCount} lượt sử dụng nên được chuyển vào lưu trữ (Đã hủy) để bảo toàn báo cáo doanh thu.`,
      });
    }

    const [result] = await db.query(
      `
      DELETE FROM deals
      WHERE id = ?
      `,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi.",
      });
    }

    if (req.user?.id) {
      await createActivityLog({
        targetUserId: req.user.id,
        actorUserId: req.user.id,
        action: "DEAL_DELETE",
        message: `Xóa chương trình khuyến mãi "${deal.name}" (${deal.code})`,
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: `Đã xóa khuyến mãi "${deal.name}".`,
    });
  } catch (error) {
    console.error("Lỗi xóa khuyến mãi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xóa khuyến mãi.",
      error: error.message,
    });
  }
};

exports.recalculateStats = async (req, res) => {
  try {
    const [deals] = await db.query(`
      SELECT *
      FROM deals
    `);

    const [orders] = await db.query(`
      SELECT 
        order_code,
        applied_coupon,
        coupon_discount_total,
        created_at,
        updated_at
      FROM orders
    `);

    for (const deal of deals) {
      const dealCode = String(deal.code || "").toUpperCase();

      const matchedOrders = orders.filter((order) => {
        const appliedCoupon = parseJsonValue(order.applied_coupon, {});
        const couponCode = String(appliedCoupon?.code || "").toUpperCase();
        const discount = Number(order.coupon_discount_total || 0);
        return couponCode === dealCode && discount > 0;
      });

      const usageHistoryMap = {};

      matchedOrders.forEach((order) => {
        const date = formatDateOnly(order.created_at || order.updated_at);
        const discount = Number(order.coupon_discount_total || 0);

        if (!usageHistoryMap[date]) {
          usageHistoryMap[date] = {
            date,
            count: 0,
            discountTotal: 0,
          };
        }

        usageHistoryMap[date].count += 1;
        usageHistoryMap[date].discountTotal += discount;
      });

      const usageHistory = Object.values(usageHistoryMap).sort((a, b) =>
        String(a.date).localeCompare(String(b.date)),
      );

      const totalDiscount = matchedOrders.reduce(
        (sum, order) => sum + Number(order.coupon_discount_total || 0),
        0,
      );

      await db.query(
        `
        UPDATE deals
        SET
          used_count = ?,
          total_discount = ?,
          usage_history = ?,
          updated_at = NOW()
        WHERE id = ?
        `,
        [
          matchedOrders.length,
          totalDiscount,
          toJsonString(usageHistory, []),
          deal.id,
        ],
      );
    }

    const [rows] = await db.query(`
      SELECT *
      FROM deals
      ORDER BY created_at DESC, id DESC
    `);

    res.json({
      success: true,
      message: "Đã tính lại thống kê khuyến mãi từ đơn hàng.",
      deals: rows.map(mapDeal),
    });
  } catch (error) {
    console.error("Lỗi tính lại thống kê:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tính lại thống kê khuyến mãi.",
      error: error.message,
    });
  }
};
