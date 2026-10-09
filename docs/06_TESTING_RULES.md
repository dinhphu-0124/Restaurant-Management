# 06. TESTING & QUALITY ASSURANCE RULES

---

## 1. MỤC TIÊU KIỂM THỬ (TESTING TARGETS)

1. **Mọi luồng cốt lõi (Critical Flows) bắt buộc phải có kiểm thử**:
   * Xác thực tài khoản (Register, Login, Token validation).
   * Đặt bàn & Chống trùng lịch đặt (Booking concurrency & Table conflict).
   * Tạo đơn hàng & Áp dụng coupon (Order creation & Discount validation).
   * Xử lý webhook thanh toán (Payment webhook verification).
2. **Nguyên tắc kiểm thử**:
   * Không bao giờ báo cáo `FIXED` nếu chưa có bài kiểm thử thực tế (Automated Test hoặc Script Verification) chứng minh tính đúng đắn.

---

## 2. QUY TRÌNH CHẠY TEST TRƯỚC KHI COMMIT
```bash
# 1. Chạy linter & kiểm tra cú pháp
npm run lint (ở frontend & backend)

# 2. Chạy bộ kiểm thử tự động
npm test (ở backend)

# 3. Kiểm tra build frontend
npm run build (ở frontend)
```
