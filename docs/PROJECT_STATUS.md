# PROJECT STATUS REPORT: SINGLE SOURCE OF TRUTH
## Dự án: Hệ thống Quản lý Nhà hàng Dê Hương Sơn (Restaurant Management System)
**Ngày cập nhật:** 2026-09-08  
**Trạng thái tổng thể:** Đang trong giai đoạn hoàn thiện & chuẩn bị Go-Live (Verification & Optimization Complete)

---

## 1. PROJECT OVERVIEW

Hệ thống Quản lý Nhà hàng Dê Hương Sơn là giải pháp chuyển đổi số toàn diện cho nhà hàng ăn uống, bao gồm:
* **Giao diện Khách hàng (Web Client):** Xem thực đơn trực quan, giỏ hàng, đặt món trước (Pre-order), đặt bàn ăn thông minh (chống trùng lịch, chọn khu vực/bàn, quét mã PIN bàn), áp dụng mã giảm giá, thanh toán chuyển khoản qua mã VietQR (SePay webhook) và tra cứu lịch sử đơn hàng.
* **Giao diện Quản trị & Vận hành (Admin BackOffice):** Quản lý sơ đồ bàn trực quan theo khu vực/không gian (Tầng 1, Tầng 2, Phòng VIP, Sân vườn), tiếp nhận & xếp bàn tự động/thủ công, quản lý trạng thái đơn hàng thời gian thực (Socket.IO), quản trị thực đơn món ăn, chương trình ưu đãi, phân quyền nhân sự (Admin, Manager, Staff, Cashier, Waiter, Chef), nhật ký hoạt động (Audit logs), và báo cáo thống kê doanh thu - lợi nhuận chi tiết.

---

## 2. CURRENT ARCHITECTURE

* **Frontend:**
  * Framework: React 19 + Vite 8.
  * Styling: Tailwind CSS v4 + Vanilla CSS + Glassmorphism / Sleek Dark Theme.
  * Routing: `react-router-dom` v7 có cấu hình **Code-Splitting / Lazy Loading** (`React.lazy` + `Suspense`) giảm 92.5% initial bundle.
  * State & Network: Axios/Fetch API Services, React Context, Custom Hooks, Socket.IO Client v4.
* **Backend:**
  * Runtime: Node.js (CommonJS) + Express 5.
  * Entry point: [backend/server.js](file:///Users/nguyendinhphu/restaurant-management/backend/server.js).
  * Layered Architecture: `Route -> Controller -> (Service/Helper) -> Database Pool`.
  * Realtime: Socket.IO v4 (đồng bộ sự kiện `order_updated`, `booking_updated`, `table_updated`).
  * Email Service: Nodemailer gửi email tự động xác nhận đặt bàn (`pending`), duyệt bàn (`confirmed`), hủy bàn (`cancelled`) và email nhắc lịch hẹn tự động.
* **Database:**
  * Engine: MySQL 8.4 (InnoDB, Character set utf8mb4, Timezone `+07:00`).
  * Quản trị: phpMyAdmin (Container Docker trên cổng `8080`).
  * Kết nối: `mysql2/promise` Connection Pool.
* **Authentication & Authorization:**
  * Đăng nhập chuẩn: JWT (JSON Web Token) với `bcryptjs` hashing.
  * Đăng nhập xã hội: Firebase Admin SDK.
  * RBAC (Role-Based Access Control): Hỗ trợ các role `user`, `staff`, `cashier`, `waiter`, `chef`, `manager`, `admin` qua middleware [authMiddleware.js](file:///Users/nguyendinhphu/restaurant-management/backend/src/middleware/authMiddleware.js).
* **Payment Integration:**
  * Cổng thanh toán: VietQR & SePay Webhook tự động khớp giao dịch chuyển khoản ngân hàng qua nội dung đơn hàng (`DH...`) và đặt cọc (`DB...`).
* **Background Jobs:**
  * Quét lịch đặt bàn sắp diễn ra trong 120 phút và gửi email nhắc hẹn định kỳ mỗi 15 phút với cơ chế **Atomic Update Lock Claim** chống duplicate email.

---

## 3. COMPLETED FEATURES

### 3.1. Phân hệ Khách hàng (Client)
* [x] **Trang chủ & Giới thiệu:** Banner, câu chuyện thương hiệu, danh mục món ăn tiêu biểu, không gian nhà hàng.
* [x] **Thực đơn (MenuPage):** Danh mục món ăn phân cấp, lọc theo nhóm, tìm kiếm, xem chi tiết món & đánh giá món ăn (`food_reviews`).
* [x] **Giỏ hàng & Checkout:** Thêm/sửa/xóa giỏ hàng, chọn phương thức (Dine-in, Takeaway, Delivery), nhập thông tin người nhận.
* [x] **Đặt bàn thông minh (BookingPage):** Chọn ngày, giờ, số lượng khách, không gian mong muốn; tự động kiểm tra sức chứa bàn ăn, nhập mã PIN bàn đang phục vụ, đặt kèm món ăn trước (Pre-order).
* [x] **Thanh toán VietQR (PaymentQRPage):** Sinh mã QR động chuẩn Napas, hiển thị số tài khoản, số tiền và nội dung chuyển khoản tự động.
* [x] **Tài khoản cá nhân (ProfilePage):** Cập nhật thông tin, xem lịch sử đơn hàng, xem chi tiết phiếu đặt bàn, mã giảm giá của tôi.

### 3.2. Phân hệ Quản trị (Admin BackOffice)
* [x] **Tổng quan (AdminDashboardPage):** Số liệu tổng người dùng, đơn hàng, doanh thu, lịch đặt hôm nay, biểu đồ doanh thu & cơ cấu bán hàng theo mốc thời gian (`today`, `yesterday`, `week`, `month`, `year`).
* [x] **Quản lý Đơn hàng (AdminOrdersPage):** Danh sách đơn hàng, lọc theo trạng thái (`pending`, `processing`, `completed`, `cancelled`), cập nhật thanh toán và in hóa đơn.
* [x] **Quản lý Đặt bàn (AdminBookingsPage):** Danh sách phiếu đặt bàn, duyệt xếp bàn, đổi trạng thái (`pending` -> `confirmed` -> `serving` -> `completed` -> `cancelled`), gửi email tự động tương ứng.
* [x] **Sơ đồ bàn ăn (AdminTablesPage):** Trực quan hóa bàn ăn theo từng khu vực, chuyển trạng thái bàn (Trống, Đang phục vụ, Đã đặt, Bảo trì), gán mã PIN 4 số tại bàn.
* [x] **Quản lý Không gian (AdminSpacesPage):** Thêm/sửa/xóa khu vực và không gian nhà hàng kèm tải ảnh trực quan.
* [x] **Quản lý Món ăn (AdminMenuPage):** Thêm/sửa/xóa món ăn, điều chỉnh giá bán, giá vốn, hình ảnh, danh mục.
* [x] **Chương trình Ưu đãi (AdminDealsPage):** Tạo mã coupon giảm giá (theo % hoặc số tiền cố định), thiết lập hạn mức sử dụng và ngày hết hạn.
* [x] **Phân quyền & Người dùng (AdminUsersPage, AdminRolesPage):** Quản lý danh sách thành viên, khóa/mở khóa tài khoản, phân quyền Role chuyên biệt.
* [x] **Báo cáo & Doanh thu (AdminRevenuePage, AdminReportPage):** Thống kê chi tiết doanh thu, lợi nhuận gộp, xuất file báo cáo Excel (`xlsx-js-style`).
* [x] **Nhật ký Hoạt động (AdminActivityLogsPage):** Ghi lại toàn bộ thao tác thêm/sửa/xóa của quản trị viên và nhân viên.

---

## 4. CURRENT ROUTES / PAGES (FRONTEND)

Toàn bộ các route dưới đây được khai báo thực tế tại [frontend/src/routes/AppRoutes.jsx](file:///Users/nguyendinhphu/restaurant-management/frontend/src/routes/AppRoutes.jsx):

| Path | Component | Quyền Truy Cập | Mục Đích |
| :--- | :--- | :---: | :--- |
| `/` & `/home` | `Home.jsx` | Public | Trang chủ giới thiệu nhà hàng |
| `/menu` | `MenuPage.jsx` | Public | Xem thực đơn & danh mục món ăn |
| `/cart` | `CartPage.jsx` | Public | Xem và chỉnh sửa giỏ hàng |
| `/checkout` | `CheckoutPage.jsx` | Public | Điền thông tin đặt món & hình thức phục vụ |
| `/payment-qr` | `PaymentQRPage.jsx` | Public | Trang quét mã QR thanh toán chuyển khoản |
| `/order-success` | `OrderSuccessPage.jsx` | Public | Thông báo đặt đơn hàng thành công |
| `/booking` | `BookingPage.jsx` | Public | Đặt bàn ăn trực tuyến |
| `/booking-success`| `BookingSuccessPage.jsx`| Public | Thông báo đặt bàn thành công |
| `/deals` | `DealsPage.jsx` | Public | Danh sách mã ưu đãi khuyến mãi |
| `/deals/:dealId` | `DealDetailPage.jsx` | Public | Chi tiết mã ưu đãi |
| `/about` | `AboutPage.jsx` | Public | Giới thiệu câu chuyện nhà hàng |
| `/contact` | `ContactPage.jsx` | Public | Thông tin liên hệ & bản đồ |
| `/login` | `Login.jsx` | Public | Đăng nhập tài khoản khách hàng |
| `/register` | `Register.jsx` | Public | Đăng ký tài khoản mới |
| `/verify-email` | `VerifyEmailPage.jsx` | Public | Xác thực email đăng ký |
| `/profile` | `ProfilePage.jsx` | Auth (`user`) | Trang cá nhân & lịch sử hoạt động |
| `/profile/order-detail/:id` | `OrderDetailPage.jsx` | Auth (`user`) | Xem chi tiết đơn hàng cá nhân |
| `/profile/booking-detail/:id` | `BookingDetailPage.jsx` | Auth (`user`) | Xem chi tiết phiếu đặt bàn |
| `/admin/login` | `AdminLoginPage.jsx` | Public | Trang đăng nhập Quản trị viên |
| `/admin/dashboard` | `AdminDashboardPage.jsx` | Auth (`BackOffice`) | Bảng điều khiển số liệu kinh doanh |
| `/admin/orders` | `AdminOrdersPage.jsx` | Auth (`BackOffice`) | Quản lý danh sách đơn hàng |
| `/admin/bookings` | `AdminBookingsPage.jsx` | Auth (`BackOffice`) | Quản lý lịch đặt bàn |
| `/admin/tables` | `AdminTablesPage.jsx` | Auth (`BackOffice`) | Sơ đồ bàn & vận hành tại chỗ |
| `/admin/spaces` | `AdminSpacesPage.jsx` | Auth (`BackOffice`) | Quản lý không gian & khu vực |
| `/admin/menu` | `AdminMenuPage.jsx` | Auth (`BackOffice`) | Quản lý danh mục & món ăn |
| `/admin/deals` | `AdminDealsPage.jsx` | Auth (`BackOffice`) | Quản lý khuyến mãi |
| `/admin/users` | `AdminUsersPage.jsx` | Auth (`Admin/Manager`) | Quản lý tài khoản người dùng |
| `/admin/revenue` | `AdminRevenuePage.jsx` | Auth (`Admin/Manager`) | Báo cáo doanh thu & biểu đồ |
| `/admin/reports` | `AdminReportPage.jsx` | Auth (`Admin/Manager`) | Báo cáo chi tiết & xuất Excel |
| `/admin/roles` | `AdminRolesPage.jsx` | Auth (`Admin`) | Phân quyền nhân sự |
| `/admin/logs` | `AdminActivityLogsPage.jsx` | Auth (`Admin`) | Nhật ký hoạt động hệ thống |
| `*` | `NotFoundPage.jsx` | Public | Trang 404 Không tìm thấy |

---

## 5. BACKEND API ENDPOINTS

### 5.1. Authentication (`/api/auth`)
* `POST /api/auth/register` — Đăng ký tài khoản (Public).
* `POST /api/auth/login` — Đăng nhập JWT (Public).
* `POST /api/auth/social-login` — Đăng nhập Google qua Firebase (Public).
* `GET /api/auth/me` — Lấy thông tin tài khoản hiện tại (`requireAuth`).
* `GET /api/auth/verify-email` — Kích hoạt tài khoản qua email token (Public).

### 5.2. Đơn hàng (`/api/orders`)
* `POST /api/orders` — Tạo đơn hàng mới (`requireAuth`).
* `GET /api/orders/me` — Lịch sử đơn hàng của tôi (`requireAuth`).
* `GET /api/orders/me/:id` — Chi tiết đơn hàng của tôi (`requireAuth`).
* `GET /api/orders` — Danh sách tất cả đơn hàng (`requireAuth`, `requireStaffOrHigher`).
* `GET /api/orders/:id` — Chi tiết đơn hàng cho quản trị (`requireAuth`, `requireStaffOrHigher`).
* `PATCH /api/orders/:id/status` — Cập nhật trạng thái đơn hàng (`requireAuth`, `requireStaffOrHigher`).
* `POST /api/orders/:id/payments` — Ghi nhận thanh toán thủ công (`requireAuth`, `requireStaffOrHigher`).

### 5.3. Đặt bàn (`/api/bookings`)
* `POST /api/bookings` — Tạo phiếu đặt bàn (`requireAuth`).
* `GET /api/bookings/me` — Lịch sử đặt bàn của tôi (`requireAuth`).
* `GET /api/bookings/me/:id` — Chi tiết phiếu đặt bàn của tôi (`requireAuth`).
* `GET /api/bookings/availability` — Kiểm tra bàn trống theo ngày giờ (Public).
* `GET /api/bookings` — Danh sách tất cả phiếu đặt bàn (`requireAuth`, `requireStaffOrHigher`).
* `PATCH /api/bookings/:id/status` — Cập nhật trạng thái duyệt/hủy/phục vụ (`requireAuth`, `requireStaffOrHigher`).
* `PATCH /api/bookings/:id/assign-table` — Gán bàn cụ thể cho đơn đặt (`requireAuth`, `requireStaffOrHigher`).
* `DELETE /api/bookings/:id` — Xóa/Hủy phiếu đặt bàn (`requireAuth`, `requireManagerOrAdmin`).

### 5.4. Bàn ăn & Khu vực (`/api/tables`)
* `GET /api/tables/areas` — Lấy danh sách khu vực bàn ăn (Public).
* `GET /api/tables` — Lấy danh sách tất cả bàn ăn (Public).
* `GET /api/tables/check/:code` — Kiểm tra trạng thái bàn theo mã (Public).
* `POST /api/tables` — Thêm bàn ăn mới (`requireAuth`, `requireManagerOrAdmin`).
* `PATCH /api/tables/:id` — Cập nhật thông tin bàn (`requireAuth`, `requireManagerOrAdmin`).
* `PATCH /api/tables/:id/status` — Đổi trạng thái bàn Trống/Phục vụ/Bảo trì (`requireAuth`, `requireStaffOrHigher`).
* `DELETE /api/tables/:id` — Xóa bàn ăn (`requireAuth`, `requireManagerOrAdmin`).

### 5.5. Dashboard & Báo cáo (`/api/admin/dashboard` & `/api/revenue`)
* `GET /api/admin/dashboard/stats` — Thống kê tổng quan & cơ cấu doanh thu (`requireAuth`, `requireBackOffice`).
* `GET /api/admin/dashboard/notifications` — Thông báo đơn mới & bàn cần xếp (`requireAuth`, `requireBackOffice`).
* `GET /api/revenue/dashboard` — Thống kê doanh thu chi tiết (`requireAuth`, `requireManagerOrAdmin`).
* `GET /api/revenue/chart` — Dữ liệu biểu đồ doanh thu theo ngày/tháng (`requireAuth`, `requireManagerOrAdmin`).
* `GET /api/revenue/report` — Báo cáo doanh thu xuất file (`requireAuth`, `requireManagerOrAdmin`).

### 5.6. Webhook Thanh toán (`/api/sepay`)
* `POST /api/sepay/webhook` — Nhận thông báo biến động số dư SePay (Xác thực `SEPAY_WEBHOOK_SECRET`).

---

## 6. DATABASE SCHEMA

CSDL `restaurant_db` gồm 14 bảng quan hệ InnoDB:
1. `users`: Tài khoản khách hàng & nhân sự (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `status`, `email_verified`, `deleted_at`).
2. `areas`: Danh mục khu vực (Tầng trệt, Tầng 2, VIP...).
3. `restaurant_spaces`: Quản lý không gian & hình ảnh nhà hàng.
4. `space_images`: Danh sách ảnh không gian chi tiết.
5. `restaurant_tables`: Bàn ăn vật lý (`id`, `table_code`, `seats`, `area_id`, `status`, `pin_code`, `deleted_at`).
6. `categories`: Danh mục thực đơn (`id`, `name`, `status`, `order_num`).
7. `menu_items`: Danh sách món ăn (`id`, `code`, `name`, `category_id`, `price`, `cost_price`, `status`, `sold`).
8. `deals`: Chương trình ưu đãi & mã giảm giá (`id`, `code`, `discount_percent`, `discount_amount`, `usage_limit`, `used_count`, `status`).
9. `orders`: Đơn hàng đặt món (`id`, `order_code`, `total`, `status`, `payment_status`, `payment_method`, `raw_data`, `created_at`).
10. `order_items`: Chi tiết món ăn trong đơn hàng (`id`, `order_id`, `menu_item_code`, `name`, `price`, `qty`, `unit_cost`).
11. `order_payments`: Lịch sử các lần giao dịch/chuyển khoản cho đơn hàng.
12. `bookings`: Phiếu đặt bàn ăn (`id`, `booking_code`, `user_id`, `customer_name`, `booking_date`, `booking_time`, `guests`, `selected_table`, `status`, `payment_status`, `deposit_amount`, `is_reminded`, `deleted_at`).
13. `food_reviews`: Đánh giá & bình luận món ăn của khách.
14. `user_activity_logs`: Nhật ký kiểm toán thao tác người dùng & admin.

---

## 7. SECURITY STATUS

| Hạng mục | Trạng thái | Ghi chú |
| :--- | :---: | :--- |
| **Webhook Signature Verification** | **VERIFIED** | Webhook SePay kiểm tra header bí mật `SEPAY_WEBHOOK_SECRET`. |
| **Authentication & JWT** | **VERIFIED** | Token kiểm tra chữ ký và role đầy đủ qua middleware. |
| **SQL Injection Prevention** | **VERIFIED** | 100% truy vấn sử dụng Prepared Statements tham số hóa. |
| **Database Schema Error Leaking** | **PARTIALLY VERIFIED** | Đã sửa các controller trọng yếu (`orderController`, `dashboardController`); các controller cũ vẫn còn nợ kỹ thuật trả về `error.message`. |
| **Rate Limiting** | **TECHNICAL DEBT** | Cần bổ sung middleware `express-rate-limit` trước khi công khai Internet. |

---

## 8. TESTING STATUS

* **Backend Test Suite:** 7/7 automated tests chạy pass 100% trong 149ms (kiểm thử auth, role authorization, JWT, webhook signature, order calculation).
* **Frontend Build:** `npm run build` thành công trong 975ms (81 chunks tách rời an toàn, 0 lỗi cú pháp).
* **Phần cần kiểm thử tự động bổ sung:** Booking concurrency conflict test, Deal discount limits test.

---

## 9. KNOWN ISSUES & TECHNICAL DEBT

* **BLOCKER (Khi Deploy Production):** Bắt buộc phải khai báo biến `SEPAY_WEBHOOK_SECRET` trong file `.env` trên môi trường Production.
* **NON-BLOCKER / TECHNICAL DEBT:**
  1. Các file router cũ ([spaceRoutes.js](file:///Users/nguyendinhphu/restaurant-management/backend/src/routes/spaceRoutes.js), [roleRoutes.js](file:///Users/nguyendinhphu/restaurant-management/backend/src/routes/roleRoutes.js)) còn chứa logic inline thay vì tách controller.
  2. Chưa có Global Error Handling Middleware bao bọc toàn bộ các controller còn lại.
  3. Cron job `checkAndSendBookingReminders` chạy trong tiến trình Express (mặc dù đã có Atomic Lock Claim).

---

## 10. MANUAL TEST STATUS (CẦN KIỂM THỬ TRỰC QUAN)

1. **Luồng Đặt bàn & Gửi Email:** Đặt thử 1 bàn trên UI -> Kiểm tra hộp thư nhận email pending -> Admin duyệt bàn -> Khách nhận email confirmed.
2. **Luồng Thanh toán VietQR:** Tạo đơn hàng -> Màn hình hiển thị mã QR -> Thử gọi webhook cập nhật trạng thái đơn thành processing.
3. **Sơ đồ bàn ăn:** Di chuyển giữa các tab không gian Tầng 1, Tầng 2, VIP để xác nhận sơ đồ bàn render tức thì.

---

## 11. PRODUCTION READINESS EVALUATION

* **ĐÁNH GIÁ:** **READY CHO STAGING & TESTING — CẦN CẤU HÌNH SECRET TRƯỚC KHI GO-LIVE CHÍNH THỨC**.
* **Lý do:** Mã nguồn hoạt động ổn định, hiệu năng query đã tối ưu, bundle frontend đã code-split hoàn chỉnh, test suite pass 100%. Chỉ cần điền đầy đủ biến môi trường Production (`SEPAY_WEBHOOK_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `JWT_SECRET`).

---

## 12. RECOMMENDED NEXT DEVELOPMENT

1. **Tính năng Quản lý Tồn kho Nguyên liệu (Inventory Management):**
   * *Độ ưu tiên:* Medium.
   * *Mô tả:* Trừ tồn kho nguyên liệu (thịt dê, rau, đồ uống) khi đơn hàng chuyển sang trạng thái `completed`.
2. **Tích hợp Thông báo đẩy Realtime (Push Notifications / Web Push):**
   * *Độ ưu tiên:* Medium.
   * *Mô tả:* Bắn chuông thông báo âm thanh nổi khi có đơn hàng mới hoặc khách vừa đặt bàn cho nhân viên thu ngân/bếp.
3. **Tích hợp In Hóa Đơn Trực Tiếp qua Máy In Nhiệt (Thermal Printer ESC/POS):**
   * *Độ ưu tiên:* High (Cho vận hành tại quán).
   * *Mô tả:* Xuất lệnh in phiếu order vào quầy bếp và hóa đơn thanh toán cho thu ngân khổ 80mm.

---

## 13. DEVELOPMENT RULES FOR FUTURE AI AGENTS

> [!IMPORTANT]
> **Mọi AI Agent trước khi sửa code BẮT BUỘC phải đọc tài liệu [09_AI_CODING_RULES.md](file:///Users/nguyendinhphu/restaurant-management/docs/09_AI_CODING_RULES.md) và các file quy tắc liên quan trong thư mục [docs/](file:///Users/nguyendinhphu/restaurant-management/docs).**
> Tuyệt đối tuân thủ chu trình: `READ → UNDERSTAND → PLAN → IMPLEMENT → TEST → VERIFY → REPORT`. Không tự ý thay đổi Business Logic, UI/UX hoặc phá vỡ cấu trúc CSDL hiện tại.
