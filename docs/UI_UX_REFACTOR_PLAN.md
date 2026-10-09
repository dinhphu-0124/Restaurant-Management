# KẾ HOẠCH TÁI CẤU TRÚC VÀ NÂNG CẤP TOÀN DIỆN GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX REFACTOR PLAN)
## Dự án: Hệ thống Quản lý Nhà hàng Dê Hương Sơn (Restaurant Management System)
**Vai trò:** Lead UI/UX Designer & Principal Frontend Architect  
**Nguyên tắc cốt lõi:** Tuyệt đối chỉ thay đổi UI/UX, Typography, Colors, Spacing, Components; **Bảo toàn 100% Business Logic, API Contract và Database**.

---

## 1. TỔNG QUAN HIỆN TRẠNG GIAO DIỆN (CURRENT UI STATUS)

Hệ thống hiện sở hữu **32 trang giao diện** (19 trang Client và 13 trang Admin). Mặc dù đã có định hình phong cách nhà hàng ẩm thực truyền thống kết hợp hiện đại, giao diện hiện tại gặp tình trạng phân mảnh thiết kế (Design Fragmentation), thiếu hệ thống Design System nhất quán giữa các trang, và một số rào cản về trải nghiệm tương tác (UX friction).

### Thống kê quy mô trang giao diện thực tế:
* **Khách hàng (Client Pages - 19 trang):**
  1. `Home.jsx` — Trang chủ
  2. `MenuPage.jsx` — Thực đơn món ăn
  3. `CartPage.jsx` — Giỏ hàng
  4. `CheckoutPage.jsx` — Đặt đơn & phương thức phục vụ
  5. `PaymentQRPage.jsx` — Thanh toán chuyển khoản VietQR
  6. `OrderSuccessPage.jsx` — Đặt đơn thành công
  7. `OrderDetailPage.jsx` — Chi tiết đơn hàng cá nhân
  8. `BookingPage.jsx` — Đặt bàn ăn trực tuyến
  9. `BookingSuccessPage.jsx` — Đặt bàn thành công
  10. `BookingDetailPage.jsx` — Chi tiết phiếu đặt bàn
  11. `DealsPage.jsx` — Danh sách ưu đãi khuyến mãi
  12. `DealDetailPage.jsx` — Chi tiết khuyến mãi
  13. `AboutPage.jsx` — Giới thiệu thương hiệu
  14. `ContactPage.jsx` — Liên hệ & hỗ trợ
  15. `ProfilePage.jsx` — Trang cá nhân
  16. `Login.jsx` — Đăng nhập người dùng
  17. `Register.jsx` — Đăng ký tài khoản
  18. `VerifyEmailPage.jsx` — Xác thực email
  19. `NotFoundPage.jsx` — Trang 404
* **Quản trị (Admin BackOffice Pages - 13 trang):**
  1. `AdminDashboardPage.jsx` — Tổng quan kinh doanh
  2. `AdminOrdersPage.jsx` — Quản lý đơn hàng
  3. `AdminBookingsPage.jsx` — Quản lý lịch đặt bàn
  4. `AdminTablesPage.jsx` — Sơ đồ bàn ăn & vận hành tại chỗ
  5. `AdminSpacesPage.jsx` — Quản lý không gian & khu vực
  6. `AdminMenuPage.jsx` — Quản lý thực đơn & danh mục
  7. `AdminDealsPage.jsx` — Quản lý khuyến mãi
  8. `AdminUsersPage.jsx` — Quản lý khách hàng
  9. `AdminRevenuePage.jsx` — Báo cáo doanh thu & biểu đồ
  10. `AdminReportPage.jsx` — Báo cáo chi tiết & xuất Excel
  11. `AdminRolesPage.jsx` — Phân quyền nhân sự
  12. `AdminActivityLogsPage.jsx` — Nhật ký kiểm toán
  13. `AdminLoginPage.jsx` — Đăng nhập Admin

---

## 2. CÁC VẤN ĐỀ VÀ BẤT CẬP HIỆN TẠI (CURRENT UI/UX PROBLEMS)

### 2.1. Phân mảnh Bảng màu & Token (Color Inconsistency)
* Bảng màu sử dụng lẫn lộn giữa `emerald-600`, `green-700`, `amber-500`, `orange-600` và `yellow-500` không có quy chuẩn phân cấp (Primary vs Accent).
* Màu nền (Background) giữa các trang thay đổi tùy tiện từ `bg-gray-50`, `bg-stone-50`, `bg-zinc-50` đến `bg-white`.

### 2.2. Bất đồng bộ Component & Nút bấm (Button & Input Inconsistency)
* Nút bấm có ít nhất 4 kiểu bo góc khác nhau (`rounded-full`, `rounded-2xl`, `rounded-lg`, `rounded-md`).
* Form Input có chỗ dùng viền xanh (`focus:ring-emerald-500`), chỗ dùng viền cam (`focus:ring-amber-500`), chỗ không có hiệu ứng focus rõ ràng.

### 2.3. Bất đồng bộ Bảng dữ liệu (Table Fragmentation in Admin)
* Các bảng danh sách (`AdminOrdersPage`, `AdminBookingsPage`, `AdminFoodTable`, `AdminDealTable`, `AdminRoleTable`) mỗi bảng có cấu trúc header, padding cột (`py-2` vs `py-4`) và hiệu ứng hover khác nhau.

### 2.4. Trải nghiệm Tải & Trạng thái Trống (Loading & Empty States)
* Thiếu Skeleton Loader đồng bộ cho thẻ món ăn, bảng đơn hàng và thẻ KPI tổng quan.
* Trạng thái rỗng (Empty State) ở một số danh mục hoặc trang tìm kiếm chỉ là dòng chữ xám đơn điệu, thiếu minh họa và nút điều hướng gợi ý.

### 2.5. Vấn đề Tiếp cận (Accessibility - a11y)
* File `index.css` vô hiệu hóa `outline: none` trên thẻ focus mà không cung cấp focus-ring tùy biến, vi phạm nghiêm trọng tiêu chuẩn WCAG 2.1 AA.
* Nhiều icon button thao tác nhanh (Sửa, Xóa, Xem chi tiết, In hóa đơn) thiếu thuộc tính `aria-label`.

---

## 3. ĐỀ XUẤT DESIGN SYSTEM THỐNG NHẤT (PROPOSED DESIGN SYSTEM)

Nhằm tạo nên diện mạo **Hiện Đại - Sang Trọng - Tối Giản - Đậm Chất Ẩm Thực Cao Cấp**, hệ thống Design System được thiết lập như sau:

### 3.1. Bảng Màu Thống Nhất (Color Palette Tokens)
* **Primary (Chủ đạo ẩm thực/ấm cúng):**
  * `Primary-900`: `#14532d` (Xanh lá sẫm sang trọng)
  * `Primary-800`: `#166534` (Xanh ngọc bích đậm)
  * `Primary-600`: `#15803d` (Xanh tương tác chính)
  * `Primary-50`: `#f0fdf4` (Nền badge/thẻ xanh nhạt)
* **Accent & Gold (Tạo điểm nhấn đẳng cấp):**
  * `Gold-600`: `#d97706` / `#b45309` (Vàng hoàng gia / Hổ phách)
  * `Gold-500`: `#f59e0b` (Màu sao đánh giá, điểm nhấn món đặc sắc)
  * `Gold-50`: `#fffbeb` (Nền badge ưu đãi)
* **Neutral & Surfaces:**
  * `Surface-0` (App Background): `#f8fafc` (Slate-50 sáng sạch)
  * `Surface-Card` (Thẻ & Bảng): `#ffffff` (Trắng tinh tế)
  * `Surface-Sidebar`: `#0f172a` (Slate-900 bóng bẩy cho Admin Sidebar)
  * `Border-Default`: `#e2e8f0` (Slate-200 mảnh sắc nét)
* **Feedback States:**
  * `Success`: `#10b981` (Xanh lục hoàn tất/Đã thanh toán)
  * `Warning`: `#f59e0b` (Vàng cam chờ duyệt/Đang chuẩn bị)
  * `Danger`: `#ef4444` (Đỏ từ chối/Đã hủy/Xóa)
  * `Info`: `#3b82f6` (Xanh lam thông tin/Giao hàng)

### 3.2. Hệ Thống Typography
* **Font chữ chính (Sans-serif):** `Inter`, `-apple-system`, `sans-serif` (Rõ ràng, dễ đọc trên mọi độ phân giải).
* **Font chữ tiêu đề trang trọng (Serif):** `Playfair Display`, `Cormorant Garamond` (Chỉ dùng cho Banner tiêu đề món ăn & câu chuyện thương hiệu).
* **Scale phân cấp:**
  * `Display-1`: `text-4xl md:text-5xl font-extrabold tracking-tight`
  * `Heading-1`: `text-2xl md:text-3xl font-bold tracking-tight text-slate-900`
  * `Heading-2`: `text-xl md:text-2xl font-semibold text-slate-800`
  * `Heading-3`: `text-lg font-semibold text-slate-800`
  * `Body-Default`: `text-sm md:text-base font-normal text-slate-600 leading-relaxed`
  * `Caption / Small`: `text-xs font-medium text-slate-500`

### 3.3. Bo Góc & Đổ Bóng (Radius & Shadows)
* **Radius Tokens:**
  * Nút bấm, Ô nhập liệu, Badge: `rounded-lg` (8px) hoặc `rounded-xl` (12px).
  * Thẻ Card, Modal, Panel: `rounded-2xl` (16px).
  * Avatar, Icon Badge tròn: `rounded-full`.
* **Shadow Tokens:**
  * `shadow-card`: `0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)`
  * `shadow-hover`: `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)`
  * `shadow-modal`: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`

---

## 4. BỘ COMPONENT DÙNG CHUNG CẦN CHUẨN HÓA (SHARED UI LIBRARY)

Để loại bỏ code trùng lặp và đồng bộ 100% diện mạo, xây dựng bộ component dùng chung tại `src/components/ui/`:

1. **`AppButton.jsx`**: Nút bấm chuẩn với các biến thể (`primary`, `secondary`, `outline`, `danger`, `ghost`), hỗ trợ `isLoading`, `iconLeading`, `iconTrailing`.
2. **`AppInput.jsx`**: Ô nhập liệu chuẩn kèm nhãn label, thông báo lỗi (`errorMessage`), icon hỗ trợ, focus-ring sắc nét.
3. **`AppSelect.jsx`**: Hộp chọn thả xuống với giao diện thanh lịch.
4. **`AppBadge.jsx`**: Thẻ trạng thái chuẩn (`pending`, `confirmed`, `serving`, `completed`, `cancelled`, `paid`, `unpaid`).
5. **`AppCard.jsx`**: Khung chứa nội dung đồng bộ viền, màu nền và đổ bóng.
6. **`AppModal.jsx`**: Khung hộp thoại popup chuẩn với backdrop blur mượt, animation scale-in và nút đóng chuẩn a11y.
7. **`AppTable.jsx`**: Khung bảng dữ liệu chuẩn cho Admin (Header cố định, hover hàng mượt, phân trang tích hợp).
8. **`AppSkeleton.jsx`**: Hiệu ứng placeholder nhấp nháy cho Card món ăn, Bảng dữ liệu và Thẻ KPI.
9. **`AppEmptyState.jsx`**: Giao diện hiển thị khi không có dữ liệu kèm hình vẽ vector và nút hành động.

---

## 5. DANH MỤC VẤN ĐỀ & KẾ HOẠCH NÂNG CẤP CHI TIẾT

| ID | Nhóm / Trang | Vấn Đề Hiện Tại | Đề Xuất Cải Tiến | Rủi Ro | Mức Độ (Priority) |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **UI-01** | **Global CSS & a11y** | Vô hiệu hóa outline toàn cục gây mất khả năng điều hướng bàn phím | Bật custom `focus-visible:ring-2 focus-visible:ring-emerald-500` cho tất cả button/input | Thấp | **P0** |
| **UI-02** | **BookingPage.jsx** | Form đặt bàn dài, chọn bàn và chọn món dễ rối trên Mobile | Tái cấu trúc thành 3 bước Wizard trực quan (1. Thông tin hẹn -> 2. Chọn không gian/bàn -> 3. Đặt món trước) | Thấp | **P0** |
| **UI-03** | **MenuPage.jsx & DishCard.jsx** | Thiếu Skeleton khi tải danh mục món, ảnh món chưa có aspect ratio chuẩn | Thêm Skeleton grid 4-6 món, cố định tỷ lệ ảnh `aspect-4/3` chống giật layout | Thấp | **P0** |
| **UI-04** | **PaymentQRPage.jsx** | Bố cục quét mã QR chưa làm nổi bật số tiền và nội dung chuyển khoản | Thiết kế lại Card thanh toán sang trọng, nút Copy 1-chạm kèm toast phản hồi | Rất thấp | **P1** |
| **UI-05** | **CartPage & CheckoutPage** | Bảng tóm tắt tiền và voucher chưa có phân cấp thị giác mạnh | Tách biệt rõ ràng Subtotal, Giảm giá voucher, Phí ship và Tổng thanh toán nổi bật | Rất thấp | **P1** |
| **UI-06** | **Admin Dashboard** | Biểu đồ và thẻ KPI chưa đồng bộ khoảng cách và màu sắc | Chuẩn hóa StatCard, thêm tooltip chi tiết và bảng cơ cấu doanh thu sắc nét | Thấp | **P1** |
| **UI-07** | **Admin Tables & Spaces** | Sơ đồ bàn ăn nhồi nhét nhiều thông tin, khó nhìn trạng thái bàn | Tối ưu thẻ bàn ăn dạng lưới trực quan, mã PIN nổi bật, màu trạng thái rõ ràng | Rất thấp | **P1** |
| **UI-08** | **Admin Orders & Bookings** | Bảng danh sách tràn chữ, nút thao tác icon thiếu tooltip/aria-label | Chuẩn hóa bảng với `AppTable`, badge trạng thái đồng màu, icon có tooltip rõ nghĩa | Rất thấp | **P1** |
| **UI-09** | **Client Header & Footer** | Menu trượt mobile chưa mượt mà, dropdown tài khoản chưa đóng mở tinh tế | Tối ưu drawer menu mobile, dropdown tài khoản có hiệu ứng mờ kính (glassmorphism) | Rất thấp | **P2** |
| **UI-10** | **DealsPage & ProfilePage** | Thẻ coupon giảm giá và lịch sử đơn hàng chưa hấp dẫn | Thiết kế vé Coupon có đường răng cưa (ticket cutout effect) và badge hạn dùng | Rất thấp | **P2** |

---

## 6. LỘ TRÌNH THỰC THI (IMPLEMENTATION ROADMAP)

Để đảm bảo không làm gián đoạn hệ thống, quá trình refactor UI/UX sẽ chia thành 4 chặng:

```text
GIAI ĐOẠN 1: Nền tảng Design System & Components Dùng Chung [✅ HOÀN THÀNH]
├── [x] Tạo thư mục src/components/ui/ (AppButton, AppInput, AppSelect, AppBadge, AppCard, AppModal, AppTable, AppSkeleton, AppEmptyState, index.js)
└── [x] Chuẩn hóa CSS Tokens và Focus-visible States chuẩn WCAG trong index.css

GIAI ĐOẠN 2: Nâng cấp Giao diện Khách hàng Cốt lõi (Client Core) [✅ HOÀN THÀNH]
├── [x] Refactor MenuPage & DishCard (AppSkeleton loading grid, AppEmptyState, AppBadge, responsive card layout)
├── [x] Refactor BookingPage, BookingSuccessPage & BookingDetailPage (Visual hierarchy, AppBadge status, AppCard info blocks)
└── [x] Refactor CartPage, CheckoutPage & PaymentQRPage (AppEmptyState, clear discount hierarchy, high-contrast QR card, 1-click copy feedback)

GIAI ĐOẠN 3: Nâng cấp Giao diện Quản trị Vận hành (Admin BackOffice) [⏳ CHỜ TRIỂN KHAI]
├── Chuẩn hóa AdminLayout, AdminSidebar & AdminHeader
├── Refactor AdminDashboardPage & AdminRevenuePage (KPI cards, biểu đồ doanh thu sắc nét)
├── Refactor AdminTablesPage & AdminSpacesPage (Sơ đồ bàn ăn trực quan, thao tác nhanh)
└── Refactor AdminOrdersPage, AdminBookingsPage, AdminMenuPage (Bảng chuẩn hóa, Modal chuẩn hóa)

GIAI ĐOẠN 4: Hoàn thiện Trang Thứ Cấp, Visual Polish & Kiểm Thử Toàn Diện [⏳ CHỜ TRIỂN KHAI]
├── Refactor ProfilePage, DealsPage, AboutPage, ContactPage, Login/Register
└── Kiểm thử Responsive trên Mobile / Tablet / Desktop + Kiểm thử Accessibility WCAG
```

---

## 7. CHIẾN LƯỢC KIỂM THỬ HỒI QUY (REGRESSION TESTING STRATEGY)

1. **Kiểm thử Luồng Nghiệp Vụ (Functional Integrity):**
   * Sau khi nâng cấp UI, chạy toàn bộ bộ test tự động `npm test` ở backend để đảm bảo không có API nào bị thay đổi.
   * Thao tác thử toàn bộ quy trình: Đặt bàn -> Đặt món -> Quét mã QR -> Xem lịch sử đơn trên Profile -> Xem đơn trên Admin.
2. **Kiểm thử Giao diện & Độ phản hồi (Responsive Verification):**
   * Kiểm tra trên 3 độ phân giải tiêu chuẩn: Mobile (375px - iPhone), Tablet (768px - iPad), Desktop (1440px).
   * Đảm bảo không bị vỡ layout ngang (No horizontal scrollbar on body).
