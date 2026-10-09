# 00. PROJECT RULES & GOVERNANCE
## Dự án: Hệ thống Quản lý Nhà hàng Dê Hương Sơn (Restaurant Management System)

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

1. **Tính Đúng Đắn & Toàn Vẹn Dữ Liệu là Số 1**: `Correctness > Security > Data Integrity > Compatibility > Maintainability > Performance > UX > Cosmetic Refactor`.
2. **Source Code là Sự Thật Duy Nhất**: Mọi tài liệu hoặc báo cáo audit chỉ là đầu vào. Bất kỳ quyết định refactor nào cũng phải được đối chiếu và xác minh trên mã nguồn thực tế.
3. **Không Phá Vỡ Tính Năng Đang Hoạt Động**: Tuyệt đối không tự ý thay đổi business logic, UI/UX, database schema hay API contract mà không có kế hoạch chuyển đổi (migration plan).
4. **Không Over-Engineering**: Giữ mã nguồn đơn giản, tường minh (`KISS`, `YAGNI`, `DRY`, `SOLID`). Tránh tạo layer/wrapper không cần thiết.

---

## 2. QUY CHUẨN ĐẶT TÊN & TỔ CHỨC THƯ MỤC (NAMING & FOLDER CONVENTIONS)

### 2.1. Cấu trúc thư mục chuẩn
```text
/restaurant-management
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình CSDL, Socket, Mail, Firebase
│   │   ├── controllers/     # Điều phối request/response HTTP
│   │   ├── middleware/      # Auth, Role, Validation, RateLimit, ErrorHandler
│   │   ├── migrations/      # Migration scripts có phiên bản
│   │   ├── routes/          # Định tuyến Endpoint API
│   │   ├── services/        # Nghiệp vụ cốt lõi (Business Logic & Transactions)
│   │   └── utils/           # Helper dùng chung (chuỗi, thời gian, logger)
│   ├── server.js            # Entry point Express Server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/          # Hình ảnh, icons tĩnh
│   │   ├── components/      # UI Components tái sử dụng & Layouts
│   │   ├── config/          # Cấu hình API, Firebase, Socket Client
│   │   ├── layouts/         # Layout chính (MainLayout, AdminLayout)
│   │   ├── pages/           # Pages định tuyến theo Route
│   │   ├── routes/          # Cấu hình AppRoutes (Hỗ trợ Lazy Loading)
│   │   ├── services/        # API Client Services
│   │   └── utils/           # Helpers định dạng, phân quyền, auth state
│   └── package.json
├── database/                # Scripts khởi tạo DB mẫu
├── docs/                    # Single Source of Truth Documentation
└── docker-compose.yml       # Docker container MySQL 8.4 & phpMyAdmin
```

### 2.2. Quy chuẩn đặt tên
* **Thư mục & Tệp backend**: `camelCase.js` (ví dụ: `orderController.js`, `authMiddleware.js`).
* **Component & Page frontend**: `PascalCase.jsx` (ví dụ: `BookingPage.jsx`, `AdminTablesPage.jsx`).
* **Hàm & Biến**: `camelCase` (ví dụ: `createBooking`, `formatDateTime`).
* **Hằng số**: `UPPER_SNAKE_CASE` (ví dụ: `ALLOWED_STATUSES`, `JWT_SECRET`).
* **Bảng & Cột Database**: `snake_case` (ví dụ: `restaurant_tables`, `payment_status`).

---

## 3. GIỚI HẠN ĐỘ DÀI FILE (FILE LENGTH LIMITS)

| Phân Loại File | Soft Limit | Hard Limit | Hành Động Khi Vượt Quá |
| :--- | :---: | :---: | :--- |
| **React Page / View** | 600 dòng | **1000 dòng** | Tách sub-components, modals và custom hooks. |
| **Express Route** | 100 dòng | **200 dòng** | Chuyển toàn bộ logic sang Controller & Service. |
| **Express Controller** | 250 dòng | **400 dòng** | Tách business logic/transactions sang Service layer. |
| **Services / Helpers** | 400 dòng | **600 dòng** | Chia nhỏ theo module nghiệp vụ. |

---

## 4. TÌNH TRẠNG DỰ ÁN (STATUS MAPPING)

* **CURRENT STATE**: Dự án hoạt động đủ tính năng nhưng tồn tại một số God Components (>1000 LOC), Fat Routes (`dashboardRoutes.js`), truy vấn database chưa tối ưu ở một số trang và thiếu Code Splitting.
* **REQUIRED RULE**: Mọi API query phải phân trang; mọi webhook phải xác thực secret; mọi route phải import lazy; không trả raw internal error ra client.
* **TARGET STATE**: Kiến trúc phân tầng rõ ràng (Route -> Controller -> Service -> DB), an toàn bảo mật, đạt 100% tiêu chuẩn Definition of Done.
