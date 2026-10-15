# 📖 CẨM NANG QUẢN LÝ VÀ VẬN HÀNH HỆ THỐNG DÊ HƯƠNG SƠN (PRODUCTION)

Tài liệu này tổng hợp toàn bộ kiến trúc, các đường link quản trị, thông số cấu hình và quy trình vận hành giúp bạn quản lý dự án **Nhà Hàng Dê Hương Sơn** trên môi trường thực tế 24/7 với chi phí **$0.00 trọn đời**.

---

## 🏗️ 1. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống được thiết kế theo mô hình tách biệt 3 tầng hiện đại (3-Tier Cloud Architecture):

- **FRONTEND (Giao diện người dùng)**: Triển khai trên **Vercel** (`https://dehuongson.vercel.app`), kết nối nhánh `deploy-production`.
- **BACKEND (Máy chủ API & Socket)**: Triển khai trên **Render** (`https://de-huong-son-api.onrender.com`), kết nối nhánh `deploy-production`.
- **DATABASE (Cơ sở dữ liệu MySQL)**: Triển khai trên **TiDB Cloud Serverless** (Khu vực Singapore AWS `ap-southeast-1`), kết nối SSL bảo mật.
- **MÃ NGUỒN (GitHub)**: `dinhphu-0124/Restaurant-Management` & `dinhphu-3564/Restaurant-Management`.

---

## 🌐 2. TỔNG HỢP CÁC ĐƯỜNG LINK QUẢN LÝ QUAN TRỌNG

| Thành phần | Đường link truy cập | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Website Chính Thức** | [https://dehuongson.vercel.app](https://dehuongson.vercel.app) | Trang chủ khách hàng xem menu, đặt bàn, gọi món |
| **Trang Quản Trị (Admin)** | [https://dehuongson.vercel.app/admin/login](https://dehuongson.vercel.app/admin/login) | Bảng điều khiển quản lý đơn hàng, bàn, món ăn, doanh thu |
| **API Backend (Render)** | [https://de-huong-son-api.onrender.com](https://de-huong-son-api.onrender.com) | Máy chủ xử lý dữ liệu (Kiểm tra: `/api/health`) |
| **Bảng Điều Khiển Render** | [https://dashboard.render.com](https://dashboard.render.com) | Quản lý máy chủ Backend, xem log hệ thống, biến môi trường |
| **Bảng Điều Khiển Vercel** | [https://vercel.com/dinh-phuu/restaurant-management](https://vercel.com/dinh-phuu/restaurant-management) | Quản lý Frontend, tên miền (Domains), lịch sử triển khai |
| **Cơ Sở Dữ Liệu TiDB** | [https://tidbcloud.com](https://tidbcloud.com) | Quản lý cơ sở dữ liệu MySQL, SQL Editor, sao lưu dữ liệu |
| **Mã Nguồn GitHub** | [https://github.com/dinhphu-0124/Restaurant-Management](https://github.com/dinhphu-0124/Restaurant-Management) | Kho mã nguồn liên kết tự động triển khai |

---

## ⚙️ 3. BẢNG THÔNG SỐ CẤU HÌNH & BIẾN MÔI TRƯỜNG

### 3.1. Cơ sở dữ liệu TiDB Cloud (MySQL 8.0)
- **Host**: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
- **Port**: `4000`
- **Username**: `2uqNbf2QxHJ2qaD.root`
- **Password**: `Xd6LSGYjGmKbdkGg`
- **Database Name**: `restaurant_db`
- **SSL**: Bắt buộc bật (`TLSv1.2`)

### 3.2. Biến môi trường Backend (Render)
Cấu hình tại: `Render Dashboard` ➔ `de-huong-son-api` ➔ `Environment`:

| Biến | Giá trị |
| :--- | :--- |
| `PORT` | `10000` |
| `DB_HOST` | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| `DB_PORT` | `4000` |
| `DB_USER` | `2uqNbf2QxHJ2qaD.root` |
| `DB_PASSWORD` | `Xd6LSGYjGmKbdkGg` |
| `DB_NAME` | `restaurant_db` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | `nhahangdehuongson2026secretkey` |

### 3.3. Biến môi trường Frontend (Vercel)
Cấu hình tại: `Vercel Dashboard` ➔ `Project Settings` ➔ `Environment Variables`:

| Biến | Giá trị |
| :--- | :--- |
| `VITE_API_URL` | `https://de-huong-son-api.onrender.com` |
| `VITE_FIREBASE_API_KEY` | `AIzaSyByzcgskEo-Vxn2csFe0nJTAtvrVw0wSqM` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `de-huong-son-restaurant.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `de-huong-son-restaurant` |
| `VITE_FIREBASE_APP_ID` | `1:282652153251:web:e693f898505781a81f7616` |

---

## 🚀 4. QUY TRÌNH TRIỂN KHAI CẬP NHẬT CODE (DEPLOYMENT WORKFLOW)

Theo đúng quy tắc phân nhánh của bạn:
- Nhánh **`main`**: Dùng để bạn code ở máy, thử nghiệm và lưu trữ lịch sử mã nguồn an toàn.
- Nhánh **`deploy-production`**: Chỉ đưa code lên khi bạn đã sẵn sàng xuất bản ra web thực tế.

### Quy trình 3 bước khi có tính năng mới:

#### Bước 1: Lập trình và kiểm tra trên máy (Local)
Bạn chỉnh sửa code và test tại máy tính của mình như bình thường:
```bash
# Đang ở nhánh main hoặc nhánh tính năng
git add .
git commit -m "feat: thêm tính năng mới"
git push origin main
```
> Các commit vào `main` này hoàn toàn không làm ảnh hưởng đến website đang chạy trên Vercel và Render.

#### Bước 2: Đẩy sang nhánh Production khi muốn cập nhật lên Web thực tế
Khi đã kiểm tra code mượt mà và muốn web thực tế cập nhật:
```bash
# 1. Chuyển sang nhánh deploy-production
git checkout deploy-production

# 2. Đồng bộ các thay đổi mới nhất từ nhánh main
git merge main

# 3. Đẩy lên GitHub của dinhphu-0124 (repo kết nối với Vercel & Render)
git push https://github.com/dinhphu-0124/Restaurant-Management.git deploy-production
```

#### Bước 3: Tự động hóa hoàn toàn (Zero-Click)
Ngay khi bạn thực hiện lệnh `git push` ở Bước 2:
1. **Vercel** sẽ tự động nhận diện commit mới, chạy `npm run build` và cập nhật trang web trong ~30 giây.
2. **Render** sẽ tự động nhận diện và khởi động lại Backend trong ~1-2 phút.
3. Không cần bấm thêm bất kỳ nút nào trên trình duyệt!

---

## 💾 5. HƯỚNG DẪN SAO LƯU DỮ LIỆU (BACKUP & RESTORE)

Dữ liệu của toàn bộ 145 món ăn, tài khoản, không gian và bàn ăn hiện đang được lưu an toàn tại file:
📁 `database/init_schema_and_data.sql`

- **Nếu muốn xuất bản sao lưu mới từ Cloud về máy tính**: Vào [tidbcloud.com](https://tidbcloud.com) ➔ chọn cụm `restaurant-db` ➔ vào mục **Backups** để tải file snapshot.
- **Nếu muốn khôi phục dữ liệu**: Chỉ cần chạy file dump `database/init_schema_and_data.sql` vào database là hệ thống được phục hồi nguyên vẹn.
