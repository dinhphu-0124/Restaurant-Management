const db = require("../config/db");

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

function mapMenuItem(row, priceOptions = []) {
  const images = parseImages(row.images);
  const options = (priceOptions || [])
    .sort((a, b) => (Number(a.display_order) - Number(b.display_order)) || (Number(a.id) - Number(b.id)))
    .map((opt) => ({
      id: opt.id,
      menuItemId: opt.menu_item_id,
      menuItemCode: opt.menu_item_code,
      price: Number(opt.price || 0),
      costPrice: Number(opt.cost_price || 0),
      note: opt.note || "",
      displayOrder: Number(opt.display_order || 1),
      isActive: Boolean(opt.is_active === 1 || opt.is_active === true),
    }));

  const activeOptions = options.filter((opt) => opt.isActive);
  const prices =
    activeOptions.length > 0
      ? activeOptions.map((o) => o.price)
      : [Number(row.price || 0)];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const costPrices =
    activeOptions.length > 0
      ? activeOptions.map((o) => o.costPrice)
      : [Number(row.cost_price || 0)];
  const minCostPrice = Math.min(...costPrices);

  return {
    id: row.code,
    dbId: row.id,
    name: row.name,
    image: row.image || images[0] || DEFAULT_IMAGE,
    images: images.length > 0 ? images : [row.image || DEFAULT_IMAGE],
    category:
      row.category_name || row.sub_category || row.parent_category || "",
    parentCategory: row.parent_category || row.category_name || "",
    subCategory: row.sub_category || "",
    price: minPrice,
    maxPrice: maxPrice,
    hasMultiplePrices: options.length > 1,
    costPrice: minCostPrice,
    priceOptions: options,
    type: row.type || "Món chính",
    status: row.status || "selling",
    badge: row.badge || "",
    sold: Number(row.sold || 0),
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    shortDescription: row.short_description || "",
    description: row.description || "",
    ingredients: row.ingredients || "",
    flavor: row.flavor || "",
    highlights: row.highlights || "",
    portion: row.portion || "",
    cooking: row.cooking || "",
    time: row.time || "",
    categoryDisplayOrder: Number(row.category_display_order ?? 999),
    parentDisplayOrder: Number(row.parent_display_order ?? row.category_display_order ?? 999),
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toLocaleDateString("vi-VN")
      : "",
  };
}

async function findOrCreateCategory(categoryName) {
  if (!categoryName) return null;
  const [rows] = await db.query(
    "SELECT id FROM categories WHERE name = ? LIMIT 1",
    [categoryName],
  );
  if (rows.length > 0) {
    return rows[0].id;
  }
  const [result] = await db.query(
    "INSERT INTO categories (name, status) VALUES (?, 'active')",
    [categoryName],
  );
  return result.insertId;
}

async function createNextCode() {
  const [rows] = await db.query(`
    SELECT code
    FROM menu_items
    WHERE code LIKE 'DE%'
    ORDER BY CAST(REPLACE(code, 'DE', '') AS UNSIGNED) DESC
    LIMIT 1
  `);
  if (rows.length === 0 || !rows[0].code) {
    return "DE001";
  }
  const currentNumber = Number(String(rows[0].code).replace("DE", ""));
  return `DE${String(currentNumber + 1).padStart(3, "0")}`;
}

exports.uploadImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Chưa có ảnh được upload",
      });
    }
    const imageUrls = req.files.map(
      (file) => `http://localhost:5001/uploads/menu/${file.filename}`,
    );
    res.json({
      success: true,
      images: imageUrls,
      image: imageUrls[0],
    });
  } catch (error) {
    console.error("Lỗi upload ảnh món ăn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi upload ảnh món ăn",
      error: error.message,
    });
  }
};

exports.getMenuItems = async (req, res) => {
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
      WHERE menu_items.status != 'deleted'
      ORDER BY 
        COALESCE(parent_cats.display_order, categories.display_order, 999) ASC,
        categories.display_order ASC,
        menu_items.id ASC
    `);

    const menuItemIds = rows.map((r) => r.id);
    let optionsByItem = {};

    if (menuItemIds.length > 0) {
      const [optionsRows] = await db.query(
        `SELECT * FROM dish_price_options WHERE menu_item_id IN (?) ORDER BY display_order ASC, id ASC`,
        [menuItemIds],
      );
      for (const opt of optionsRows) {
        if (!optionsByItem[opt.menu_item_id]) {
          optionsByItem[opt.menu_item_id] = [];
        }
        optionsByItem[opt.menu_item_id].push(opt);
      }
    }

    res.json({
      success: true,
      data: rows.map((row) => mapMenuItem(row, optionsByItem[row.id] || [])),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách món:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách món",
      error: error.message,
    });
  }
};

exports.createMenuItem = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const body = req.body;
    const realCategory =
      body.category === "Món khác" && body.subCategory
        ? body.subCategory
        : body.category;

    const categoryId = await findOrCreateCategory(realCategory);
    const code = await createNextCode();
    const image = body.image || body.images?.[0] || DEFAULT_IMAGE;
    const images = JSON.stringify(body.images?.length ? body.images : [image]);

    // Parse and sanitize priceOptions
    let rawOptions = Array.isArray(body.priceOptions) ? body.priceOptions : [];
    if (rawOptions.length === 0) {
      rawOptions = [
        {
          price: Number(body.price || 0),
          costPrice: Number(body.costPrice || 0),
          note: body.portion || "Tiêu chuẩn",
          displayOrder: 1,
          isActive: true,
        },
      ];
    }

    const validOptions = rawOptions
      .map((opt, index) => ({
        price: Number(opt.price || 0),
        costPrice: Number(opt.costPrice || 0),
        note: String(opt.note || "").trim(),
        displayOrder: Number(opt.displayOrder || index + 1),
        isActive: opt.isActive !== false && opt.is_active !== 0,
      }))
      .filter((opt) => opt.price > 0);

    if (validOptions.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Món ăn phải có ít nhất một mức giá hợp lệ lớn hơn 0",
      });
    }

    const minPrice = Math.min(...validOptions.map((o) => o.price));
    const minCostPrice = Math.min(...validOptions.map((o) => o.costPrice));

    const [insertResult] = await connection.query(
      `
      INSERT INTO menu_items (
        code,
        category_id,
        name,
        description,
        price,
        cost_price,
        image,
        images,
        type,
        status,
        badge,
        sold,
        rating,
        reviews,
        short_description,
        ingredients,
        flavor,
        highlights,
        portion,
        cooking,
        time,
        parent_category,
        sub_category
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        code,
        categoryId,
        body.name || "",
        body.description || "",
        minPrice,
        minCostPrice,
        image,
        images,
        body.type || "Món chính",
        body.status || "selling",
        body.badge || "",
        body.shortDescription || "",
        body.ingredients || "",
        body.flavor || "",
        body.highlights || "",
        body.portion || validOptions[0]?.note || "",
        body.cooking || "",
        body.time || "",
        body.category || realCategory,
        body.subCategory || "",
      ],
    );

    const menuItemId = insertResult.insertId;

    // Insert price options
    for (const opt of validOptions) {
      await connection.query(
        `
        INSERT INTO dish_price_options (
          menu_item_id, menu_item_code, price, cost_price, note, display_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          menuItemId,
          code,
          opt.price,
          opt.costPrice,
          opt.note,
          opt.displayOrder,
          opt.isActive ? 1 : 0,
        ],
      );
    }

    await connection.commit();

    const [rows] = await db.query(
      `
      SELECT menu_items.*, categories.name AS category_name
      FROM menu_items
      LEFT JOIN categories ON menu_items.category_id = categories.id
      WHERE menu_items.code = ?
      LIMIT 1
      `,
      [code],
    );

    const [optionsRows] = await db.query(
      `SELECT * FROM dish_price_options WHERE menu_item_id = ? ORDER BY display_order ASC, id ASC`,
      [rows[0].id],
    );

    res.status(201).json({
      success: true,
      data: mapMenuItem(rows[0], optionsRows),
    });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi thêm món:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm món",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

exports.updateMenuItem = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { code } = req.params;
    const body = req.body;
    const realCategory =
      body.category === "Món khác" && body.subCategory
        ? body.subCategory
        : body.category;

    const [dishRows] = await connection.query(
      "SELECT id FROM menu_items WHERE code = ? LIMIT 1",
      [code],
    );

    if (dishRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    const menuItemId = dishRows[0].id;
    const categoryId = await findOrCreateCategory(realCategory);
    const image = body.image || body.images?.[0] || DEFAULT_IMAGE;
    const images = JSON.stringify(body.images?.length ? body.images : [image]);

    // Handle priceOptions if provided
    let minPrice = Number(body.price || 0);
    let minCostPrice = Number(body.costPrice || 0);

    if (Array.isArray(body.priceOptions) && body.priceOptions.length > 0) {
      const validOptions = body.priceOptions
        .map((opt, index) => ({
          id: opt.id ? Number(opt.id) : null,
          price: Number(opt.price || 0),
          costPrice: Number(opt.costPrice || 0),
          note: String(opt.note || "").trim(),
          displayOrder: Number(opt.displayOrder || index + 1),
          isActive: opt.isActive !== false && opt.is_active !== 0,
        }))
        .filter((opt) => opt.price > 0);

      if (validOptions.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Món ăn phải có ít nhất một mức giá hợp lệ lớn hơn 0",
        });
      }

      minPrice = Math.min(...validOptions.map((o) => o.price));
      minCostPrice = Math.min(...validOptions.map((o) => o.costPrice));

      const submittedOptionIds = validOptions
        .filter((o) => o.id)
        .map((o) => o.id);

      // Check existing options in DB
      const [existingDbOptions] = await connection.query(
        "SELECT id FROM dish_price_options WHERE menu_item_id = ?",
        [menuItemId],
      );

      for (const dbOpt of existingDbOptions) {
        if (!submittedOptionIds.includes(dbOpt.id)) {
          // Deactivate or remove option
          await connection.query(
            "UPDATE dish_price_options SET is_active = 0 WHERE id = ?",
            [dbOpt.id],
          );
        }
      }

      // Upsert options
      for (const opt of validOptions) {
        if (opt.id) {
          await connection.query(
            `
            UPDATE dish_price_options
            SET price = ?, cost_price = ?, note = ?, display_order = ?, is_active = ?
            WHERE id = ? AND menu_item_id = ?
            `,
            [
              opt.price,
              opt.costPrice,
              opt.note,
              opt.displayOrder,
              opt.isActive ? 1 : 0,
              opt.id,
              menuItemId,
            ],
          );
        } else {
          await connection.query(
            `
            INSERT INTO dish_price_options (
              menu_item_id, menu_item_code, price, cost_price, note, display_order, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
              menuItemId,
              code,
              opt.price,
              opt.costPrice,
              opt.note,
              opt.displayOrder,
              opt.isActive ? 1 : 0,
            ],
          );
        }
      }
    }

    await connection.query(
      `
      UPDATE menu_items
      SET
        category_id = ?,
        name = ?,
        description = ?,
        price = ?,
        cost_price = ?,
        image = ?,
        images = ?,
        type = ?,
        status = ?,
        badge = ?,
        short_description = ?,
        ingredients = ?,
        flavor = ?,
        highlights = ?,
        portion = ?,
        cooking = ?,
        time = ?,
        parent_category = ?,
        sub_category = ?
      WHERE code = ?
      `,
      [
        categoryId,
        body.name || "",
        body.description || "",
        minPrice,
        minCostPrice,
        image,
        images,
        body.type || "Món chính",
        body.status || "selling",
        body.badge || "",
        body.shortDescription || "",
        body.ingredients || "",
        body.flavor || "",
        body.highlights || "",
        body.portion || "",
        body.cooking || "",
        body.time || "",
        body.category || realCategory,
        body.subCategory || "",
        code,
      ],
    );

    await connection.commit();

    const [rows] = await db.query(
      `
      SELECT menu_items.*, categories.name AS category_name
      FROM menu_items
      LEFT JOIN categories ON menu_items.category_id = categories.id
      WHERE menu_items.code = ?
      LIMIT 1
      `,
      [code],
    );

    const [optionsRows] = await db.query(
      `SELECT * FROM dish_price_options WHERE menu_item_id = ? ORDER BY display_order ASC, id ASC`,
      [menuItemId],
    );

    res.json({
      success: true,
      data: mapMenuItem(rows[0], optionsRows),
    });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi sửa món:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi sửa món",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

exports.updateMenuItemStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const { status } = req.body;
    await db.query("UPDATE menu_items SET status = ? WHERE code = ?", [
      status,
      code,
    ]);
    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    console.error("Lỗi đổi trạng thái:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đổi trạng thái",
      error: error.message,
    });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { code } = req.params;
    await db.query(
      "UPDATE menu_items SET status = 'deleted' WHERE code = ?",
      [code],
    );
    await db.query(
      "UPDATE dish_price_options SET is_active = 0 WHERE menu_item_code = ?",
      [code],
    );
    res.json({
      success: true,
      message: "Xóa món thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa món:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa món",
      error: error.message,
    });
  }
};

exports.bulkStopMenuItems = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách món không hợp lệ",
      });
    }
    await db.query(
      "UPDATE menu_items SET status = 'stopped' WHERE code IN (?)",
      [ids],
    );
    res.json({
      success: true,
      message: "Ngừng bán các món đã chọn thành công",
    });
  } catch (error) {
    console.error("Lỗi ngừng bán nhiều món:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi ngừng bán nhiều món",
      error: error.message,
    });
  }
};

exports.bulkDeleteMenuItems = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách món không hợp lệ",
      });
    }
    await db.query(
      "UPDATE menu_items SET status = 'deleted' WHERE code IN (?)",
      [ids],
    );
    await db.query(
      "UPDATE dish_price_options SET is_active = 0 WHERE menu_item_code IN (?)",
      [ids],
    );
    res.json({
      success: true,
      message: "Xóa các món đã chọn thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa nhiều món:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa nhiều món",
      error: error.message,
    });
  }
};
