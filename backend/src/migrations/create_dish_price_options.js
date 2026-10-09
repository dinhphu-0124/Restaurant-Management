require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const db = require('../config/db');

async function migrate() {
  const connection = await db.getConnection();
  try {
    console.log('🚀 Starting Migration: Dish Price Options...');
    await connection.beginTransaction();

    // 1. Create table dish_price_options
    console.log('1. Creating table dish_price_options if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS dish_price_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_item_id INT NOT NULL,
        menu_item_code VARCHAR(100) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        cost_price DECIMAL(15,2) DEFAULT 0.00,
        note VARCHAR(255) DEFAULT '',
        display_order INT DEFAULT 1,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_menu_item_id (menu_item_id),
        INDEX idx_menu_item_code (menu_item_code),
        CONSTRAINT fk_dish_price_options_menu_item
          FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Add columns to order_items if not present
    console.log('2. Checking and updating order_items table columns...');
    const [orderItemCols] = await connection.query(`DESCRIBE order_items`);
    const colNames = orderItemCols.map(c => c.Field);

    if (!colNames.includes('price_option_id')) {
      console.log('   - Adding price_option_id to order_items...');
      await connection.query(`ALTER TABLE order_items ADD COLUMN price_option_id INT NULL AFTER menu_item_code`);
    }

    if (!colNames.includes('price_option_note')) {
      console.log('   - Adding price_option_note to order_items...');
      await connection.query(`ALTER TABLE order_items ADD COLUMN price_option_note VARCHAR(255) NULL AFTER name`);
    }

    // 3. Migrate existing menu_items into dish_price_options if empty
    console.log('3. Checking existing dish_price_options data...');
    const [existingOptions] = await connection.query(`SELECT COUNT(*) AS count FROM dish_price_options`);
    const count = existingOptions[0].count;

    if (count === 0) {
      console.log('   - Migrating existing menu_items into dish_price_options...');
      const [dishes] = await connection.query(`SELECT id, code, price, cost_price, portion FROM menu_items`);
      console.log(`   - Found ${dishes.length} menu items to migrate.`);

      for (const dish of dishes) {
        const dishPrice = Number(dish.price || 0);
        const dishCost = Number(dish.cost_price || 0);
        const dishNote = dish.portion || 'Tiêu chuẩn';

        await connection.query(`
          INSERT INTO dish_price_options (
            menu_item_id, menu_item_code, price, cost_price, note, display_order, is_active
          ) VALUES (?, ?, ?, ?, ?, 1, 1)
        `, [dish.id, dish.code, dishPrice, dishCost, dishNote]);
      }
      console.log(`   - Successfully migrated ${dishes.length} dishes to dish_price_options.`);
    } else {
      console.log(`   - dish_price_options already contains ${count} records. Skipping data insertion.`);
    }

    await connection.commit();
    console.log('✅ Migration COMPLETED successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  migrate().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = migrate;
