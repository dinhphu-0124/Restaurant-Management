# 03. FRONTEND ARCHITECTURE & UX/UI RULES

---

## 1. QUY TẮC PHÂN TẦNG COMPONENT & TỐI ƯU HIỆU NĂNG

### 1.1. Code-Splitting & Lazy Loading
* Bắt buộc sử dụng `React.lazy()` và `Suspense` cho tất cả các Route của trang quản trị (Admin) và các trang thứ cấp trên Client.
* Cung cấp Component hiển thị trạng thái chờ `PageLoadingSpinner` mượt mà trong lúc tải bundle chunk.

### 1.2. Phân tách Trách nhiệm (Component Responsibilities)
* **Pages**: Chỉ quản lý routing params, layout orchestration và top-level data fetching.
* **Modals & Dialogs**: Phải được tách thành các file component riêng biệt trong `src/components/...` (ví dụ: `AdminBillingModal.jsx`, `AdminAddBookingModal.jsx`).
* **Formatters & Pure Functions**: Không khai báo trực tiếp các hàm xử lý tiền tệ, ngày tháng trong thân component mà chuyển sang `src/utils/`.

---

## 2. TRẢI NGHIỆM NGƯỜI DÙNG & GIAO DIỆN (UX/UI EXCELLENCE)

1. **Trạng thái Tải (Loading State & Skeleton UI)**:
   * Khi tải dữ liệu danh sách (món ăn, đơn hàng, danh mục), sử dụng Skeleton Loader thay vì spinner chớp tắt để tránh giật bố cục (Cumulative Layout Shift - CLS).
2. **Trạng thái Trống (Empty State)**:
   * Mọi bảng dữ liệu hoặc danh sách phải có Empty State rõ ràng kèm hình minh họa và gợi ý hành động khi không có dữ liệu.
3. **Thông Báo Thân Thiện (Toast & Alerts)**:
   * Mọi hành động Create / Update / Delete phải kích hoạt Toast notification thông báo thành công hoặc giải thích lỗi cụ thể.
4. **Tiêu Chuẩn Truy Cập (Accessibility - a11y)**:
   * Tất cả các nút bấm icon phải có thuộc tính `aria-label` hoặc `title`.
   * Các trường nhập liệu form phải có `id` tương ứng với `htmlFor` của thẻ `<label>`.

---

## 3. QUY CHUẨN THIẾT KẾ RESPONSIVE & MOBILE-FIRST
* Toàn bộ quy tắc chi tiết về Responsive Breakpoints, Touch Targets (≥ 44×44px), Mobile Navigation/Drawer, Responsive Table (Card View), Form 1 cột và Test Matrix được quy định tại: [docs/MOBILE_FIRST_UI_UX_SPEC.md](file:///Users/nguyendinhphu/restaurant-management/docs/MOBILE_FIRST_UI_UX_SPEC.md).
