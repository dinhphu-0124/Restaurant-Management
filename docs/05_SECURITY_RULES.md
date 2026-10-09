# 05. SECURITY & HARDENING RULES

---

## 1. BẢO VỆ CÁC CỔNG THANH TOÁN & WEBHOOK (PAYMENT SECURITY)

> [!CAUTION]
> **Không tin bất kỳ Webhook nào từ Internet mà không qua xác thực chữ ký (Signature/API Key)**.

### Quy chuẩn xác thực Webhook SePay:
```javascript
const webhookApiKey = req.headers["authorization"] || req.headers["x-sepay-key"];
const expectedSecret = `Apikey ${process.env.SEPAY_WEBHOOK_SECRET}`;

if (!webhookApiKey || webhookApiKey !== expectedSecret) {
  return res.status(401).json({ success: false, message: "Unauthorized webhook." });
}
```

---

## 2. PHÒNG CHỐNG BRUTE-FORCE & DDOS (RATE LIMITING)

* Bắt buộc áp dụng giới hạn tần suất request (Rate Limiting) cho các endpoints nhạy cảm:
  * `/api/auth/login`: Tối đa 5 lần thử sai / phút trên mỗi địa chỉ IP.
  * `/api/auth/register`, `/api/auth/forgot-password`: Tối đa 3 requests / 5 phút.
  * `/api/bookings`, `/api/orders`: Tối đa 20 requests / phút.

---

## 3. BẢO VỆ DỮ LIỆU & QUYỀN HẠN (AUTHORIZATION & DATA INTEGRITY)

1. **Chống IDOR (Insecure Direct Object References)**:
   * Khi người dùng xem/sửa chi tiết đơn hàng hoặc lịch đặt bàn, hệ thống phải đối chiếu quyền sở hữu:
     `order.user_id === req.user.id || ['admin', 'manager', 'staff'].includes(req.user.role)`
2. **Không commit bí mật (No Secrets in Git)**:
   * File `.env` và các tệp JSON private key (như Firebase Service Account) bắt buộc nằm trong `.gitignore`.
3. **Mã hóa Mật khẩu**:
   * Mật khẩu người dùng phải được băm bằng `bcryptjs` với salt rounds tối thiểu là `10`.
