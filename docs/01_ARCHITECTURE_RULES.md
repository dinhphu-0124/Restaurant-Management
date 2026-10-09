# 01. ARCHITECTURE RULES & PATTERNS

---

## 1. MÔ HÌNH KIẾN TRÚC TỔNG THỂ

### 1.1. Backend Architecture Flow
```text
HTTP Request
     ↓
[Route] (Chỉ routing, gắn Auth/Validation/RateLimit Middleware)
     ↓
[Controller] (Nhận req, trích xuất DTO/Params, gọi Service, trả res HTTP)
     ↓
[Service] (Chứa Business Logic, Quản lý Transaction, Phát sự kiện Socket/Mail)
     ↓
[Data Access / DB Pool] (Thực thi Prepared Statement SQL trên MySQL)
```

### 1.2. Frontend Architecture Flow
```text
User Interaction
     ↓
[Page] (Bố cục chính, quản lý URL params, phối hợp components)
     ↓
[Component / Modals] (Hiển thị UI, xử lý tương tác cục bộ, tiếp nhận props)
     ↓
[Custom Hook / State] (Quản lý trạng thái, memoize, debounce, side-effects)
     ↓
[API Service] (Đóng gói fetch/axios, xử lý token auth, format dữ liệu)
```

---

## 2. QUY TẮC PHÂN TẦNG VÀ TRÁCH NHIỆM (SEPARATION OF CONCERNS)

1. **Route không chứa Business Logic & SQL**:
   - Cấm viết `db.query(...)` trực tiếp trong file Route.
   - Route chỉ đóng vai trò định nghĩa đường dẫn HTTP, middleware bảo vệ và chuyển tiếp đến Controller.
2. **Controller không trở thành God Controller**:
   - Controller chỉ xử lý HTTP I/O (lấy `req.body`, `req.params`, `req.query`, `req.user` và trả về `res.status().json()`).
   - Không chứa thuật toán tính toán tiền, xử lý giảm giá hoặc câu lệnh SQL phức tạp kéo dài hàng chục dòng.
3. **Service đảm nhiệm toàn bộ Nghiệp vụ Cốt lõi**:
   - Quản lý Database Transaction (`beginTransaction`, `commit`, `rollback`).
   - Kiểm tra ràng buộc kinh doanh (sức chứa bàn, mã giảm giá, tính tiền, trừ tồn kho).
4. **Không tạo Component & Module khổng lồ**:
   - Một Component không được vượt quá 1000 dòng code.
   - Tách biệt rõ ràng giữa Presentational UI và Business State.
