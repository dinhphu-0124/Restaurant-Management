# 04. DATABASE INTEGRITY & QUERY OPTIMIZATION RULES

---

## 1. NGUYÊN TẮC THIẾT KẾ CSDL (DATABASE DESIGN)

* **Engine**: MySQL 8.0+ (InnoDB) hỗ trợ đầy đủ ACID Transactions và Foreign Keys.
* **Quy ước đặt tên**:
  * Tên bảng số nhiều, chữ thường: `orders`, `bookings`, `restaurant_tables`, `menu_items`.
  * Cột khóa chính: `id INT AUTO_INCREMENT PRIMARY KEY` hoặc `BIGINT`.
  * Cột khóa ngoại: `[singular_table]_id` (ví dụ: `user_id`, `area_id`, `order_id`).
  * Cột thời gian chuẩn: `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, `updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP`.
  * Cột Soft-Delete: `deleted_at DATETIME DEFAULT NULL`.

---

## 2. QUY TẮC TRUY VẤN & CHỈ MỤC (INDEXING & QUERY RULES)

> [!IMPORTANT]
> **CẤM KÉO TOÀN BỘ BẢNG VÀO RAM RỒI FILTER BẰNG JAVASCRIPT**:
> Mọi bộ lọc (`WHERE`), sắp xếp (`ORDER BY`), phân trang (`LIMIT ... OFFSET`) và tổng hợp dữ liệu (`COUNT`, `SUM`, `AVG`) **BẮT BUỘC** phải được thực thi trực tiếp bằng câu lệnh SQL tại Database Engine.

### Danh mục các trường bắt buộc phải có INDEX:
* `orders`: `(user_id)`, `(status)`, `(payment_status)`, `(created_at)`.
* `bookings`: `(user_id)`, `(booking_date, selected_table, status)`, `(deleted_at)`.
* `restaurant_tables`: `(table_code)`, `(area_id)`, `(status)`.
* `deals`: `(code)`, `(status)`.
* `users`: `(email)`, `(phone)`, `(role)`.

---

## 3. QUY TẮC GIAO DỊCH (DATABASE TRANSACTIONS)

Mọi thao tác ghi dữ liệu liên quan đến nhiều bảng hoặc cập nhật trạng thái đồng thời (ví dụ: Tạo đơn hàng + lưu chi tiết món + trừ lượt dùng coupon; hoặc Tạo booking + kiểm tra khóa bàn) **BẮT BUỘC** phải được bao bọc trong Transaction:
```javascript
const conn = await db.getConnection();
try {
  await conn.beginTransaction();
  // ... Thực thi các câu lệnh SQL với [conn] ...
  await conn.commit();
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  conn.release();
}
```
