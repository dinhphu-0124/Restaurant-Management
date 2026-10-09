# KẾ HOẠCH TÁI CẤU TRÚC VÀ CHUẨN HÓA MÃ NGUỒN (REFACTOR PLAN)
## Dự án: Hệ thống Quản lý Nhà hàng Dê Hương Sơn

---

## 1. TỔNG QUAN CHIẾN LƯỢC (EXECUTIVE SUMMARY)

Kế hoạch tái cấu trúc này nhằm giải quyết triệt để các rủi ro bảo mật (Insecure Webhook, Error Exposure), hiệu năng (OOM Query, Bundle Size), kiến trúc (Fat Routes, DRY violations) và thiết lập hệ thống kiểm thử tự động, **tuyệt đối bảo toàn 100% giao diện và nghiệp vụ hiện tại**.

---

## 2. BIỂU ĐỒ PHỤ THUỘC CÁC BƯỚC THỰC HIỆN (DEPENDENCY GRAPH)

```text
PHASE 0: Ghi nhận Baseline (Build, Lint, Tests)
   ↓
PHASE 1: Bảo mật & Lỗi Nghiêm Trọng (Fix Webhook Secret, Rate Limit, Safe Errors)
   ↓
PHASE 2: Cơ sở dữ liệu & Hiệu năng Backend (Fix In-memory Query OOM, Phân trang SQL)
   ↓
PHASE 3: Kiến trúc Backend (Tách Fat Route Dashboard thành Controller/Service)
   ↓
PHASE 4: Kiến trúc Frontend & Lazy Loading (AppRoutes Code-splitting, Helper DRY, a11y)
   ↓
PHASE 5: Tối ưu Hóa Hiệu Năng & Background Jobs Safety
   ↓
PHASE 6: Viết Bộ Kiểm Thử Tự Động (Automated Testing Suite)
   ↓
PHASE 7: Final Audit, Verification & Cập Nhật Documentation
```

---

## 3. CHI TIẾT TỪNG GIAI ĐOẠN (IMPLEMENTATION PHASES)

### 🔴 P0 — Critical (Phase 1 & Phase 2)
* **SEC-01**: Thêm xác thực Authorization/Secret Header cho SePay Webhook tại `server.js`.
* **PERF-01**: Viết lại hàm `getMyOrders` trong `orderController.js` sử dụng câu truy vấn SQL có điều kiện `WHERE (user_id = ? OR email = ? OR phone = ?) LIMIT ? OFFSET ?`.
* **SEC-02**: Chuẩn hóa thông báo lỗi trả về tại `authController.js` và `server.js` (không trả raw `error.message` của DB).

### 🟡 P1 — High (Phase 3 & Phase 4)
* **ARCH-01**: Tách logic truy vấn trong `dashboardRoutes.js` sang `dashboardController.js` và `dashboardService.js`.
* **PERF-02**: Áp dụng `React.lazy()` và `Suspense` cho toàn bộ các trang Admin trong `AppRoutes.jsx`.

### 🟢 P2 — Medium & P3 — Low (Phase 4 & Phase 5)
* **CODE-01**: Gom các hàm helper tiện ích (`parseJson`, `removeVietnameseTones`, `formatDateTime`) vào `utils/` dùng chung.
* **UX-01**: Bổ sung `aria-label` cho các nút bấm điều khiển và cải thiện loading state.

---

## 4. CHIẾN LƯỢC KIỂM THỬ & ROLLBACK (TESTING & ROLLBACK STRATEGY)

* **Testing Strategy**:
  * Chạy unit/integration test sau mỗi Phase.
  * Kiểm tra build frontend (`npm run build`).
  * Kiểm tra runtime backend kết nối database.
* **Rollback Strategy**:
  * Mỗi Phase được commit/verify độc lập, cho phép hoàn tác an toàn nếu phát hiện lỗi hồi quy.
