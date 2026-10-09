# TÀI LIỆU YÊU CẦU HỆ THỐNG: TÁC NHÂN, CHỨC NĂNG & PHI CHỨC NĂNG
**Hệ thống Quản lý Nhà hàng (Restaurant Management System)**

---

## 1. DANH SÁCH CÁC TÁC NHÂN (ACTORS)

Hệ thống phân cấp quyền truy cập và thao tác thông qua các vai trò (Roles) cụ thể của người dùng và các hệ thống bên ngoài:

| Tác nhân (Actor) | Mô tả |
| :--- | :--- |
| **Khách vãng lai** *(Guest)* | Người dùng chưa đăng ký hoặc chưa đăng nhập. Chỉ có quyền xem thông tin cơ bản của nhà hàng, thực đơn công khai và các chương trình khuyến mãi đang chạy. |
| **Khách hàng** *(Customer)* | Người dùng đã đăng ký tài khoản và đăng nhập. Có đầy đủ quyền đặt bàn, đặt món ăn trực tuyến (giao hàng, ăn tại quầy, đến lấy), quản lý giỏ hàng cá nhân, xem lịch sử đặt bàn/đơn hàng và theo dõi phân nhóm thành viên. |
| **Nhân viên Phục vụ** *(Waiter)* | Nhân viên trực tiếp đón khách, xếp khách vào bàn ăn (`serving`), hỗ trợ khách gọi thêm món ăn trực tiếp tại bàn. |
| **Nhân viên Bếp** *(Chef)* | Nhân viên tiếp nhận danh sách món ăn từ đơn hàng trực tuyến hoặc đơn đặt bàn trực tiếp để chế biến. |
| **Nhân viên Thu ngân** *(Cashier)* | Nhân viên thanh toán hóa đơn, ghi nhận tiền mặt trực tiếp từ khách hàng hoặc xác nhận các khoản thanh toán từng phần/chia hóa đơn. |
| **Quản lý** *(Manager)* | Người giám sát hoạt động kinh doanh. Có quyền quản lý thực đơn, danh mục món ăn, sơ đồ bàn, khu vực, cấu hình mã voucher/khuyến mãi và xem báo cáo thống kê doanh thu. |
| **Quản trị viên** *(Admin)* | Người có quyền hạn cao nhất trong hệ thống. Quản lý tài khoản toàn bộ nhân viên, cấu hình phân quyền (Roles), giám sát nhật ký hoạt động (User Activity Logs), khóa/mở khóa tài khoản người dùng. |
| **Hệ thống SePay** *(External System)* | Cổng thanh toán tự động gửi dữ liệu biến động số dư ngân hàng qua Webhook để hệ thống tự đối soát hóa đơn chuyển khoản. |
| **Hệ thống Email** *(External System)* | Dịch vụ SMTP/Nodemailer chịu trách nhiệm gửi email xác minh tài khoản hoặc đặt lại mật khẩu cho khách hàng. |

---

## 2. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

Dưới đây là các yêu cầu chức năng chính được phân chia theo nhóm nghiệp vụ trong dự án:

### 2.1. Phân hệ Xác thực & Tài khoản
* **Đăng ký/Đăng nhập**: Cho phép khách đăng ký bằng Họ tên, Email, Số điện thoại và Mật khẩu. Hỗ trợ đăng nhập bằng Email/SĐT kèm mật khẩu.
* **Xác thực tài khoản qua Email**: Tự động gửi email chứa link kích hoạt sau khi đăng ký thành công. Kích hoạt tài khoản khi người dùng nhấp vào link.
* **Bảo vệ tài khoản**: Chặn đăng nhập đối với các tài khoản bị khóa (`status = 'locked'`).
* **Quản lý hồ sơ cá nhân**: Người dùng cập nhật họ tên, địa chỉ, avatar, mật khẩu mới.
* **Tự động phân nhóm Khách hàng**: Hệ thống tự động tính toán tổng chi tiêu và lượt giao dịch để phân hạng: `VIP`, `Regular` (Thân thiết), hoặc `New` (Khách mới).

### 2.2. Phân hệ Phục vụ & Đặt món Trực tuyến (Khách hàng)
* **Khám phá thực đơn**: Lọc món ăn theo danh mục, tìm kiếm món ăn theo tên, xem giá và trạng thái (Còn hàng/Hết hàng).
* **Quản lý giỏ hàng**: Thêm món ăn vào giỏ hàng, cập nhật số lượng món, ghi chú riêng cho từng món ăn.
* **Đặt hàng trực tuyến**: 
  * Chọn hình thức: Ăn tại bàn (`dinein`), Giao tận nơi (`delivery`), Đến lấy (`pickup`).
  * Áp dụng mã voucher giảm giá (nếu có hợp lệ).
  * Lựa chọn hình thức thanh toán: Tiền mặt (`cash`) hoặc Chuyển khoản VietQR (`bank`).
* **Đặt bàn trực tuyến**:
  * Đặt trước bàn ăn theo Ngày, Giờ, Số lượng khách, Khu vực mong muốn.
  * Chọn đặt trước các món ăn (Pre-order) đi kèm.
  * Tự động kiểm tra sức chứa bàn ăn và chống trùng lịch đặt.
  * **Tự động gửi email thông báo**: Hệ thống gửi email tự động xác nhận trạng thái đặt bàn (Đang chờ xử lý `pending` ngay khi đặt thành công, và Đã xác nhận `confirmed` hoặc Đã hủy `cancelled` khi quản trị viên cập nhật trạng thái).

### 2.3. Phân hệ Vận hành & Thanh toán tại Bàn (Admin/BackOffice)
* **Xếp bàn & Nhận bàn**: Xác nhận thông tin phiếu đặt bàn, chọn xếp bàn trống khả dụng trên sơ đồ và chuyển trạng thái sang `serving` khi khách đến.
* **Gọi thêm món tại bàn**: Nhân viên cập nhật thêm món ăn trực tiếp vào hóa đơn của khách đang ngồi ăn tại chỗ. Hệ thống tự động gộp và tính toán lại tiền.
* **Thanh toán hóa đơn tại chỗ**:
  * Hỗ trợ thanh toán tiền mặt (nhập tiền khách đưa, tính tiền thừa) hoặc chuyển khoản.
  * Áp dụng mã giảm giá trực tiếp cho hóa đơn tại bàn.
  * Thanh toán tự động SePay: Sinh VietQR kèm nội dung `DB{booking_id}`. Client tự động nhận diện thanh toán thành công (phát âm thanh "Ding-dong" và hiển thị Toast) ngay khi Webhook SePay ghi nhận giao dịch.
* **Dọn dẹp bàn ăn hằng ngày**: Cơ chế tự động dọn các bàn phục vụ dở dang của ngày hôm trước và giải phóng bàn trống vào lúc 00:00 hằng ngày.

### 2.4. Phân hệ Quản trị & Điều hành (Admin/Manager)
* **Dashboard Thống kê**: Xem tổng doanh thu, biểu đồ doanh thu, số lượng đơn hàng theo trạng thái, số lượt đặt bàn và lịch sử giao dịch mới nhất.
* **Quản lý Thực đơn & Danh mục**: Thêm/sửa/xóa món ăn và các nhóm danh mục món ăn. Hỗ trợ tải lên hình ảnh món ăn lên máy chủ.
* **Quản lý Sơ đồ bàn**: Thêm/sửa/xóa khu vực và các bàn ăn tương ứng. Tự động sinh mã bàn thông minh theo tên khu vực được chọn.
* **Quản lý Voucher & Khuyến mãi**: Tạo mã giảm giá theo %, số tiền cố định, cấu hình thời hạn hiệu lực, điều kiện áp dụng (giá trị đơn tối thiểu, số lượng giới hạn) và ghi nhận vết lịch sử sử dụng.
* **Quản lý Người dùng & Phân quyền**: Quản lý thông tin tất cả người dùng, phân vai trò cụ thể cho nhân viên nội bộ, khóa/mở khóa tài khoản hoặc reset mật khẩu.
* **Xem Nhật ký hoạt động**: Hiển thị chi tiết thời gian, người thực hiện, hành động thay đổi nhạy cảm (như đổi quyền, khóa tài khoản).

---

## 3. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 3.1. Hiệu năng & Tốc độ Phản hồi (Performance)
* **Thời gian phản hồi**: Các API lấy thông tin thực đơn, trạng thái bàn phải phản hồi nhanh (dưới 500ms ở điều kiện mạng bình thường).
* **Đồng bộ hóa SePay**: Polling kiểm tra trạng thái thanh toán chuyển khoản tại bàn ở frontend hoạt động đều đặn mỗi 2.5 giây để đảm bảo hóa đơn được cập nhật gần như lập tức sau khi khách chuyển tiền.

### 3.2. Tính Khả dụng & Vận hành (Availability & Operations)
* **Hoạt động liên tục**: Hệ thống phải hoạt động liên tục 24/7 để tiếp nhận các yêu cầu đặt bàn/đặt món trực tuyến của khách hàng.
* **Tự động dọn dẹp bộ nhớ/dữ liệu rác**: Cron-job tự động reset bàn rác và bàn mồ côi giúp sơ đồ bàn ăn trên hệ thống luôn luôn đồng nhất với thực tế tại nhà hàng, tránh tình trạng "bàn ảo" chiếm dụng chỗ ngồi.

### 3.3. Bảo mật & Xác thực (Security)
* **Mã hóa mật khẩu**: Mật khẩu của mọi tài khoản người dùng phải được băm một chiều bằng thư viện `bcryptjs` trước khi lưu vào cơ sở dữ liệu.
* **Phân quyền API (Authorization)**: Toàn bộ API nghiệp vụ nhạy cảm phải được bảo vệ bởi middleware xác thực JWT. Các route quản trị bắt buộc phải kiểm tra quyền vai trò của tài khoản (`requireRoles`).
* **Chống giả mạo request**: Sử dụng CORS để giới hạn các domain bên ngoài truy cập trái phép vào API backend.

### 3.4. Khả năng Mở rộng (Scalability)
* **Kết nối cơ sở dữ liệu**: Sử dụng Pool Connection của thư viện `mysql2` để quản lý các kết nối đồng thời một cách tối ưu, tránh nghẽn database.
* **Giao tiếp Real-time**: Socket.io hoạt động song song giúp phân phối tin nhắn cập nhật trạng thái đơn hàng tới nhiều client cùng lúc mà không gây quá tải cho máy chủ HTTP truyền thống.

### 3.5. Trải nghiệm Người dùng (UX/UI & Compatibility)
* **Tương thích thiết bị**: Giao diện website (Frontend) phải được thiết kế responsive hoạt động tốt trên cả máy tính (cho quản lý/thu ngân) và điện thoại di động (cho khách hàng đặt món và nhân viên phục vụ tại bàn).
* **Tín hiệu phản hồi**: Khi thực hiện thanh toán tự động thành công, hệ thống phải phát âm thanh thông báo sinh động và Toast trực quan cho thu ngân dễ dàng nhận biết trong môi trường ồn ào của nhà hàng.
