# 02. BACKEND CODING & API RULES

---

## 1. QUY CHUẨN THIẾT KẾ RESTFUL API

* **URI Resource-oriented**: Sử dụng danh từ số nhiều (ví dụ: `/api/orders`, `/api/bookings`, `/api/tables`, `/api/deals`).
* **HTTP Methods đúng chuẩn**:
  * `GET`: Truy vấn dữ liệu (Idempotent, Safe).
  * `POST`: Tạo mới tài nguyên.
  * `PUT` / `PATCH`: Cập nhật toàn phần / một phần tài nguyên.
  * `DELETE`: Xóa (hoặc Soft Delete cập nhật `deleted_at = NOW()`).
* **HTTP Status Codes chính xác**:
  * `200 OK`: Thành công với dữ liệu trả về.
  * `201 Created`: Tạo mới thành công.
  * `400 Bad Request`: Dữ liệu đầu vào sai định dạng hoặc vi phạm ràng buộc nghiệp vụ.
  * `401 Unauthorized`: Chưa đăng nhập hoặc Token hết hạn/không hợp lệ.
  * `403 Forbidden`: Đã đăng nhập nhưng không đủ quyền hạn Role.
  * `404 Not Found`: Không tìm thấy tài nguyên.
  * `409 Conflict`: Xung đột dữ liệu (ví dụ: trùng lịch bàn, trùng email).
  * `500 Internal Server Error`: Lỗi máy chủ không mong muốn (phải ẩn chi tiết nhạy cảm).

---

## 2. CHUẨN CẤU TRÚC PHẢN HỒI JSON (API RESPONSE CONTRACT)

### 2.1. Phản hồi Thành công (Success Response)
```json
{
  "success": true,
  "message": "Thông điệp mô tả kết quả (tùy chọn)",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### 2.2. Phản hồi Thất bại (Error Response)
```json
{
  "success": false,
  "message": "Thông báo lỗi thân thiện cho người dùng",
  "code": "INVALID_INPUT_DATA"
}
```

> [!CAUTION]
> **Tuyệt đối không trả về `error.message` raw của MySQL** (ví dụ: `ER_PARSE_ERROR`, `ER_NO_SUCH_TABLE`, syntax details) ra client. Tất cả lỗi kỹ thuật phải được log tại server và trả về message an toàn cho client.

---

## 3. PHÂN TRANG (PAGINATION) BẮT BUỘC

Mọi API danh sách (`GET /api/orders`, `GET /api/bookings`, `GET /api/users`, `GET /api/activity-logs`) **BẮT BUỘC** phải hỗ trợ tham số `page` và `limit`:
* Mặc định `page = 1`, `limit = 10` (hoặc 20).
* Giới hạn tối đa `limit <= 100` để tránh làm kiệt quệ tài nguyên máy chủ.
* Câu lệnh SQL phải luôn có `LIMIT ? OFFSET ?`.
