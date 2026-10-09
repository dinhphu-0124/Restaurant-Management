const express = require("express");
const db = require("../config/db");

const router = express.Router();

const DEFAULT_IMAGE = "/src/assets/images/Menu/default-food.png";

function parseImages(value) {
  if (!value) return [];

  try {
    if (Array.isArray(value)) return value;
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

function mapPublicMenuItem(row, priceOptions = []) {
  const images = parseImages(row.images);
  const image = row.image || images[0] || DEFAULT_IMAGE;

  const activeOptions = (priceOptions || [])
    .filter((opt) => opt.is_active === 1 || opt.is_active === true)
    .sort((a, b) => (a.display_order - b.display_order) || (a.id - b.id))
    .map((opt) => ({
      id: opt.id,
      price: Number(opt.price || 0),
      costPrice: Number(opt.cost_price || 0),
      note: opt.note || "",
      displayOrder: Number(opt.display_order || 1),
      isActive: Boolean(opt.is_active),
    }));

  const prices =
    activeOptions.length > 0
      ? activeOptions.map((o) => o.price)
      : [Number(row.price || 0)];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const formattedPrice =
    activeOptions.length > 1
      ? `Từ ${formatPrice(minPrice)}`
      : formatPrice(minPrice);

  return {
    id: row.code,
    dbId: row.id,
    name: row.name,
    image,
    images: images.length > 0 ? images : [image],
    category:
      row.category_name || row.sub_category || row.parent_category || "",
    parentCategory: row.parent_category || row.category_name || "",
    subCategory: row.sub_category || "",
    price: formattedPrice,
    formattedPrice: formattedPrice,
    priceNumber: minPrice,
    priceRange:
      activeOptions.length > 1
        ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
        : formatPrice(minPrice),
    priceOptions: activeOptions,
    hasMultiplePrices: activeOptions.length > 1,
    type: row.type || "Món chính",
    status: row.status,
    badge: row.badge || "",
    sold: Number(row.sold || 0),
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    shortDescription: row.short_description || "",
    description: row.description || row.short_description || "",
    ingredients: row.ingredients || "",
    flavor: row.flavor || "",
    highlights: row.highlights || "",
    portion: row.portion || "2 - 3 người",
    cooking: row.cooking || "Nóng hổi",
    time: row.time || "15 - 20 phút",
    categoryDisplayOrder: Number(row.category_display_order ?? 999),
    parentDisplayOrder: Number(row.parent_display_order ?? row.category_display_order ?? 999),
  };
}

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        menu_items.*,
        categories.name AS category_name,
        categories.display_order AS category_display_order,
        parent_cats.name AS parent_category_name,
        parent_cats.display_order AS parent_display_order
      FROM menu_items
      LEFT JOIN categories ON menu_items.category_id = categories.id
      LEFT JOIN categories parent_cats ON categories.parent_id = parent_cats.id
      WHERE menu_items.status IN ('selling', 'paused')
      ORDER BY 
        COALESCE(parent_cats.display_order, categories.display_order, 999) ASC,
        categories.display_order ASC,
        menu_items.id ASC
    `);

    const menuItemIds = rows.map((r) => r.id);
    let optionsByItem = {};

    if (menuItemIds.length > 0) {
      const [optionsRows] = await db.query(
        `SELECT * FROM dish_price_options WHERE menu_item_id IN (?) AND is_active = 1 ORDER BY display_order ASC, id ASC`,
        [menuItemIds],
      );
      for (const opt of optionsRows) {
        if (!optionsByItem[opt.menu_item_id]) {
          optionsByItem[opt.menu_item_id] = [];
        }
        optionsByItem[opt.menu_item_id].push(opt);
      }
    }

    const mapped = rows.map((row) => mapPublicMenuItem(row, optionsByItem[row.id] || []));

    res.json({
      success: true,
      data: mapped,
      items: mapped,
    });
  } catch (error) {
    console.error("Lỗi lấy menu người dùng:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy menu người dùng",
      error: error.message,
    });
  }
});
// API lấy đánh giá của món
router.get("/:code/reviews", async (req, res) => {
  try {
    const { code } = req.params;

    const [rows] = await db.query(
      `
      SELECT 
        id,
        menu_item_code,
        order_id,
        user_name,
        rating,
        comment,
        created_at
      FROM food_reviews
      WHERE menu_item_code = ?
      ORDER BY created_at DESC
      `,
      [code],
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Lỗi lấy đánh giá món:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đánh giá món",
      error: error.message,
    });
  }
});

//API gửi đánh giá món
router.post("/:code/reviews", async (req, res) => {
  try {
    const { code } = req.params;
    const { orderId, userEmail, userName, rating, comment } = req.body;

    const numericRating = Number(rating);

    if (!orderId || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin đơn hàng hoặc người dùng",
      });
    }

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Số sao đánh giá không hợp lệ",
      });
    }

    const [menuRows] = await db.query(
      "SELECT id, code FROM menu_items WHERE code = ? LIMIT 1",
      [code],
    );

    if (menuRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    const menuItem = menuRows[0];

    await db.query(
      `
      INSERT INTO food_reviews (
        menu_item_id,
        menu_item_code,
        order_id,
        user_email,
        user_name,
        rating,
        comment
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        menuItem.id,
        menuItem.code,
        orderId,
        userEmail,
        userName || "Khách hàng",
        numericRating,
        comment || "",
      ],
    );

    const [statsRows] = await db.query(
      `
      SELECT 
        ROUND(AVG(rating), 1) AS avg_rating,
        COUNT(*) AS total_reviews
      FROM food_reviews
      WHERE menu_item_id = ?
      `,
      [menuItem.id],
    );

    const avgRating = Number(statsRows[0].avg_rating || 0);
    const totalReviews = Number(statsRows[0].total_reviews || 0);

    await db.query(
      `
      UPDATE menu_items
      SET rating = ?, reviews = ?
      WHERE id = ?
      `,
      [avgRating, totalReviews, menuItem.id],
    );

    res.status(201).json({
      success: true,
      message: "Đánh giá món ăn thành công",
      data: {
        rating: avgRating,
        reviews: totalReviews,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Bạn đã đánh giá món này trong đơn hàng này rồi",
      });
    }

    console.error("Lỗi gửi đánh giá món:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi đánh giá món",
      error: error.message,
    });
  }
});

module.exports = router;
