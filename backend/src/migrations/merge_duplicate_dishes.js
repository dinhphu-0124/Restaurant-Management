const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/../../.env" });

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "restaurant_management",
  port: Number(process.env.DB_PORT || 3307),
};

function getCleanBaseName(name) {
  let clean = name.trim();
  clean = clean.replace(/\s*[\(\-]?\s*size\s*\d+k?[\)]?/gi, "");
  clean = clean.replace(/\s*[\(\-]?\s*size\s*[smlxl]+[\)]?/gi, "");
  clean = clean.replace(/\s*[\(\-]?\s*\d+k[\)]?/gi, "");
  clean = clean.replace(/\s*[\(\-]?\s*\d+\/\d+\s*kg[\)]?/gi, "");
  clean = clean.replace(/\s*[\(\-]?\s*\d+\s*kg[\)]?/gi, "");
  clean = clean.replace(/\s*[\(\-]?\s*(nhỏ|vừa|lớn|phần nhỏ|phần lớn)[\)]?/gi, "");
  return clean.trim();
}

function extractOptionNote(name, portion) {
  const m =
    name.match(/size\s+\d+k?/i) ||
    name.match(/\d+k/i) ||
    name.match(/\d+\/\d+\s*kg/i) ||
    name.match(/\d+\s*kg/i);
  if (m) {
    let sizeStr = m[0];
    // Capitalize: size 400k -> Size 400k
    sizeStr = sizeStr.charAt(0).toUpperCase() + sizeStr.slice(1);
    return portion && !portion.toLowerCase().includes("size")
      ? `${sizeStr} (${portion})`
      : sizeStr;
  }
  return portion ? portion : "Tiêu chuẩn";
}

async function mergeDuplicateDishes() {
  console.log("=== STARTING SMART DISH MERGE MIGRATION ===");
  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.beginTransaction();

    const [allDishes] = await connection.query(
      "SELECT id, code, name, price, cost_price, description, short_description, ingredients, flavor, highlights, portion, cooking, time, image, images, category_id, parent_category, sub_category, badge FROM menu_items ORDER BY id ASC",
    );

    console.log(`Initial total dishes in database: ${allDishes.length}`);

    const groupMap = {};
    for (const r of allDishes) {
      const base = getCleanBaseName(r.name);
      const key = base.toLowerCase();
      if (!groupMap[key]) {
        groupMap[key] = { baseName: base, items: [] };
      }
      groupMap[key].items.push(r);
    }

    const multiGroups = Object.values(groupMap).filter(
      (g) => g.items.length > 1,
    );
    console.log(`Found ${multiGroups.length} groups of dishes with same/variant names to merge.\n`);

    let mergedCount = 0;
    let removedDishesCount = 0;

    for (const g of multiGroups) {
      // Find the best master dish
      const nonSuffix = g.items.find((i) => !i.name.match(/size/i));
      const master = nonSuffix || g.items[0];
      const duplicates = g.items.filter((i) => i.id !== master.id);

      console.log(`\n➡️ Merging Group: "${g.baseName}"`);
      console.log(`   Master Dish: ID ${master.id} [${master.code}] ("${master.name}")`);
      console.log(`   Duplicate Variants to merge (${duplicates.length}): ${duplicates.map((d) => d.name).join(", ")}`);

      // Update master dish name to clean base name
      await connection.query(
        "UPDATE menu_items SET name = ?, short_description = COALESCE(NULLIF(short_description, ''), ?) WHERE id = ?",
        [g.baseName, master.short_description || `${g.baseName} đặc sản Hương Sơn`, master.id],
      );

      // Collect all distinct price options across all items in group
      // Build options map by price
      const optionMap = new Map();

      // Sort items by price ascending
      const sortedGroupItems = [...g.items].sort(
        (a, b) => Number(a.price) - Number(b.price),
      );

      for (const item of sortedGroupItems) {
        const itemPrice = Number(item.price || 0);
        const itemCost = Number(item.cost_price || 0);
        const note = extractOptionNote(item.name, item.portion);

        if (!optionMap.has(itemPrice)) {
          optionMap.set(itemPrice, {
            price: itemPrice,
            costPrice: itemCost,
            note: note,
            sourceCode: item.code,
            sourceId: item.id,
          });
        }
      }

      // Clear existing options for master dish and all duplicates in group
      const allGroupIds = g.items.map((i) => i.id);
      await connection.query(
        "DELETE FROM dish_price_options WHERE menu_item_id IN (?)",
        [allGroupIds],
      );

      // Insert fresh, consolidated dish_price_options for master dish
      let orderIndex = 1;
      const insertedOptions = [];

      for (const [price, optData] of optionMap.entries()) {
        const [insertRes] = await connection.query(
          `INSERT INTO dish_price_options (
            menu_item_id, menu_item_code, price, cost_price, note, display_order, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            master.id,
            master.code,
            optData.price,
            optData.costPrice,
            optData.note,
            orderIndex++,
          ],
        );
        insertedOptions.push({
          id: insertRes.insertId,
          price: optData.price,
          note: optData.note,
          sourceCode: optData.sourceCode,
          sourceId: optData.sourceId,
        });
        console.log(`   + Created Option: ${optData.note} — ${optData.price.toLocaleString("vi-VN")}đ (Option ID: ${insertRes.insertId})`);
      }

      // Update historical order_items referencing duplicate dishes in this group
      for (const dup of duplicates) {
        // Find matching option for this duplicate by price
        const matchedOption =
          insertedOptions.find((o) => o.price === Number(dup.price)) ||
          insertedOptions[0];

        const [affectedOrders] = await connection.query(
          `UPDATE order_items 
           SET menu_item_code = ?, price_option_id = ?, price_option_note = COALESCE(NULLIF(price_option_note, ''), ?)
           WHERE menu_item_code = ?`,
          [
            master.code,
            matchedOption.id,
            matchedOption.note,
            dup.code,
          ],
        );
        if (affectedOrders.affectedRows > 0) {
          console.log(`   📦 Updated ${affectedOrders.affectedRows} past order_items from code "${dup.code}" to master code "${master.code}"`);
        }

        // Delete the duplicate dish record from menu_items
        await connection.query("DELETE FROM menu_items WHERE id = ?", [dup.id]);
        removedDishesCount++;
      }

      // Update master dish price to min price
      const minPrice = Math.min(...insertedOptions.map((o) => o.price));
      await connection.query(
        "UPDATE menu_items SET price = ? WHERE id = ?",
        [minPrice, master.id],
      );

      mergedCount++;
    }

    await connection.commit();

    const [finalDishes] = await connection.query("SELECT COUNT(*) as c FROM menu_items");
    const [finalOptions] = await connection.query("SELECT COUNT(*) as c FROM dish_price_options");

    console.log("\n============================================================");
    console.log(`MIGRATION COMPLETED SUCCESSFULLY!`);
    console.log(`- Merged groups: ${mergedCount}`);
    console.log(`- Redundant duplicate dish records removed: ${removedDishesCount}`);
    console.log(`- Final unique dishes: ${finalDishes[0].c}`);
    console.log(`- Total price options: ${finalOptions[0].c}`);
    console.log("============================================================");

  } catch (err) {
    await connection.rollback();
    console.error("Migration failed, rolled back:", err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

mergeDuplicateDishes();
