# PROMPT & QUY CHUẨN — MOBILE-FIRST UI/UX REDESIGN TOÀN BỘ HỆ THỐNG

> **Vai trò**: Senior Product Designer + UI/UX Designer + Senior Frontend Engineer (20+ năm kinh nghiệm) chuyên sâu về Responsive Web Design, Mobile-First Design, Touch Interaction & Design System.
> **Tài liệu tham chiếu**: Lưu trữ tại `docs/MOBILE_FIRST_UI_UX_SPEC.md` để tái sử dụng và làm kim chỉ nam kiểm thử/thiết kế responsive cho toàn bộ dự án.

---

# 1. BỐI CẢNH HIỆN TẠI

- **Desktop**: Đã hoàn thiện thẩm mỹ cao, trực quan và đạt chuẩn yêu cầu.
- **Mobile**: Cần thiết kế lại toàn diện theo tư duy Mobile-First chuyên nghiệp.
- **Tablet**: Cần kiểm tra, cân đối bố cục trung gian.
- **Các kích thước màn hình trung gian**: Responsive mượt mà, không vỡ layout.

> **Mục tiêu cốt lõi**: Giữ nguyên vẹn chất lượng và tính thẩm mỹ của giao diện Desktop hiện tại, đồng thời xây dựng hệ thống Responsive chuẩn mực để Mobile và Tablet có trải nghiệm đẳng cấp, tinh gọn, dễ hiểu và thao tác ngón tay mượt mà.

---

# 2. YÊU CẦU QUAN TRỌNG NHẤT: KHÔNG SỬA LOGIC CHỨC NĂNG

Đây là nguyên tắc bất khả xâm phạm.

### Tuyệt đối KHÔNG được thay đổi:
* Business logic & Nghiệp vụ hệ thống
* API request / response / endpoints
* Database schema & dữ liệu
* Backend services & controllers
* Authentication & Authorization
* Validation nghiệp vụ
* Cart / Checkout / Order / Payment logic
* Reservation & Booking logic
* State management hiện tại
* Data models & Data structures
* Routing & Navigation flow
* Permissions & Role guards
* Calculations, Pricing, Discount & Revenue algorithms

> [!CAUTION]
> Tuyệt đối không tự ý refactor logic chức năng chỉ vì thấy code chưa vừa mắt.

---

# 3. PHẠM VI ĐƯỢC PHÉP THAY ĐỔI

Chỉ tập trung vào **Giao diện (UI)** và **Trải nghiệm người dùng (UX)**:

### UI (User Interface)
- Layout, Grid, Flexbox, Positioning, Visibility
- Spacing & Rhythm (Padding, Margin, Gap)
- Typography (Font size, Font weight, Line height)
- Colors, Border, Radius, Shadow, Backdrop blur
- Components: Button, Input, Card, Modal, Drawer, Tabs, Filter, Search, Table presentation
- Navigation: Header, Footer, Sidebar presentation, Bottom navigation
- Pagination & Action buttons presentation
- Touch targets & Touch interaction areas

### UX (User Experience)
- Information hierarchy & Visual hierarchy
- Mobile navigation & Drawer transitions
- Touch usability (vùng chạm ngón tay tối thiểu 44×44px)
- Form usability & Keyboard-friendly behavior
- Modal / Bottom sheet usability & Scrolling độc lập
- Content density & Readability
- Error, Loading & Empty state presentation

---

# 4. NGUYÊN TẮC THIẾT KẾ: KHÔNG THU NHỎ DESKTOP

Không được thiết kế theo tư duy:
```text
Desktop ──(thu nhỏ toàn bộ)──> Mobile (Vỡ layout / Chữ bé li ti)
```

Mà phải áp dụng kiến trúc:
```text
Desktop UX
        ↘
          Responsive Design System
        ↗
Mobile UX
```

* Mobile **không phải** là Desktop phiên bản thu nhỏ.
* Mobile sở hữu: Layout riêng, Navigation riêng, Spacing riêng, Typography riêng, Interaction riêng và Content Density riêng nhưng dùng chung dữ liệu và business logic.

---

# 5. MOBILE-FIRST BREAKPOINT FLOW

Ưu tiên luồng thiết kế:
```text
Mobile Small ➔ Mobile Large ➔ Tablet ➔ Small Desktop ➔ Desktop ➔ Large Desktop
```

### Hệ thống Breakpoints Tiêu chuẩn:
| Breakpoint | Khoảng kích thước | Thiết bị / Mục tiêu |
| :--- | :--- | :--- |
| **Mobile Small** | `< 480px` (320px, 360px, 375px, 390px, 414px, 430px) | iPhone nhỏ, Android nhỏ & vừa |
| **Mobile Large** | `480px – 767px` | Màn hình gập, điện thoại xoay ngang |
| **Tablet** | `768px – 1023px` (iPad, Tablet 8–11") | Layout 2 cột, collapsed sidebar / drawer |
| **Small Desktop** | `1024px – 1279px` (Laptop 13–14") | Layout 3 cột vừa |
| **Desktop** | `1280px – 1535px` (Màn hình chuẩn) | Giữ nguyên vẹn thiết kế gốc |
| **Large Desktop** | `≥ 1536px` (2K, 4K, UltraWide) | `max-width` giới hạn nội dung, căn giữa |

---

# 6. MỤC TIÊU UX TRÊN MOBILE

> Người dùng phải hiểu ngay màn hình đang phục vụ điều gì chỉ trong 3 giây đầu tiên.

### Tránh triệt để:
- Quá nhiều thông tin chen chúc cùng lúc
- Chữ quá bé (< 12px cho body/action)
- Nút bấm quá nhỏ (< 44px)
- Card quá dày chiếm hết màn hình
- Table bị ép nén ngang 8-10 cột
- Sidebar đè che khuất nội dung
- Header quá cao chiếm viewport
- Xuất hiện thanh cuộn ngang (horizontal overflow) không chủ đích

---

# 7. QUY CHUẨN CHI TIẾT THEO TỪNG THÀNH PHẦN

### 1. Touch Target
- Vùng chạm tối thiểu **44 × 44px** cho mọi phần tử tương tác (Button, Checkbox, Radio, Tab, Quantity +/-, Close, Back).
- Icon có thể nhỏ tinh tế nhưng vùng bấm (`padding` / `hitbox`) phải đủ 44px.

### 2. Typography Mobile
- Phân cấp rõ ràng: `Page Title` (18–20px bold) > `Section Title` (15–16px bold) > `Card Title` (14–15px bold) > `Body` (13–14px regular) > `Caption/Metadata` (11–12px).
- Xử lý tên món dài/tiêu đề dài bằng `line-clamp-2` hoặc `break-words`, không để text tràn viền.

### 3. Spacing System
- Sử dụng thang đo nhất quán: `4px, 8px, 12px, 16px, 20px, 24px, 32px`.
- Mobile ưu tiên: **Gọn gàng (Compact), Tinh tế (Clean), Thông thoáng (Breathable)**.

### 4. Header & Navigation Mobile
- Header Mobile tinh gọn: `[Logo] ──── [Cart Badge] [Hamburger/Menu]`.
- Desktop Sidebar chuyển hóa thành **Drawer trượt mượt mà** hoặc **Bottom Navigation Bar** trên Mobile.

### 5. Card & Grid Layout
- **Mobile**: 1 – 2 cột tùy loại dữ liệu (Món ăn: 2 cột gọn; Đơn hàng/Bàn/Lịch hẹn: 1 cột card).
- **Tablet**: 2 – 3 cột.
- **Desktop**: 3 – 4+ cột (Giữ nguyên).
- Hình ảnh món/banner giữ đúng tỉ lệ khung hình (`aspect-ratio`, `object-cover`), không méo mó.

### 6. Form Mobile
- Chuyển layout đa cột Desktop thành **1 cột duy nhất** trên Mobile.
- Input cao tối thiểu `42–46px`, font chữ input `≥ 16px` (hoặc cấu hình chuẩn) để tránh iOS tự động zoom.
- Label đặt trên input rõ ràng, hiển thị lỗi ngay dưới trường vi phạm.

### 7. Modal & Bottom Sheet
- Mobile Modal: Chiếm `w-[calc(100%-24px)]` hoặc chuyển đổi thành **Bottom Sheet** bo góc trên.
- Nội dung modal có vùng scroll riêng (`max-h-[85vh] overflow-y-auto`), header và nút CTA cố định ở đáy.

### 8. Table Presentation
- Không ép bảng 8-10 cột trên màn hình 375px.
- **Giải pháp ưu tiên**: Chuyển thành **Card View / List View** trên Mobile hiển thị các thông tin cốt lõi (ID, Tên, Trạng thái, Tổng tiền, Nút xem chi tiết).
- Với bảng nghiệp vụ phức tạp: Áp dụng Horizontal Scroll có hiển thị thanh chỉ dẫn rõ ràng.

### 9. Filter & Search
- Chuyển cụm 5-10 dropdown filter nằm ngang thành thanh tìm kiếm + Nút **[Bộ lọc]** mở Modal/Drawer lọc chi tiết.

### 10. Safe Area Inset
- Luôn bao bọc các thanh fixed đáy (Bottom Nav, Sticky Checkout Bar, Action Bar) bằng `pb-[env(safe-area-inset-bottom)]`.

---

# 8. BẢNG KIỂM TRA RESPONSIVE (TEST MATRIX)

| Kích thước | Nhóm thiết bị | Trạng thái bắt buộc |
| :--- | :--- | :--- |
| **320px** | iPhone SE đời cũ, màn hình cực nhỏ | Không tràn ngang, nút bấm không đè nhau |
| **360px** | Android phổ thông (Samsung A series) | Bố cục liền mạch, font đọc rõ |
| **375px** | iPhone 8 / SE 2020 / iPhone X/11 Pro | Chuẩn mực Mobile UX |
| **390px** | iPhone 12 / 13 / 14 / 15 / 16 | Chuẩn mực Mobile phổ biến |
| **414px / 430px** | iPhone Plus / Pro Max | Không bị vỡ card, giãn layout hợp lý |
| **768px / 820px** | iPad Mini / iPad Air | Bố cục 2 cột cân xứng, menu drawer/sidebar |
| **1024px** | iPad Pro / Laptop 13" nhỏ | Bố cục trung gian hoàn hảo |
| **1280px / 1440px**| Desktop chuẩn | **Giữ nguyên 100% vẻ đẹp hiện tại** |
| **1920px+** | Desktop lớn / 2K | Giới hạn max-width, căn giữa trang nhã |

---

# 9. QUY TRÌNH THỰC HIỆN 4 GIAI ĐOẠN

```text
PHASE 1: AUDIT TOÀN BỘ CODEBASE
  ➔ Quét toàn bộ pages, components, modals, tables, forms, headers
  ➔ Lập danh sách lỗi vỡ layout, tràn ngang, touch target nhỏ

PHASE 2: PHÂN CẤP ƯU TIÊN
  ➔ P0: Critical (Tràn ngang, không bấm được, che khuất nội dung)
  ➔ P1: Major (Table nén chữ, form khó nhập, navigation bất tiện)
  ➔ P2: Minor (Spacing, typography hierarchy, visual polish)

PHASE 3: IMPLEMENTATION (THEO NHÓM COMPONENT DÙNG CHUNG TRƯỚC)
  ➔ Global Container & Breakpoint Rules
  ➔ Layout & Navigation (Header, Drawer, Bottom Nav)
  ➔ Component Foundations (Cards, Tables ➔ Card-view, Forms, Modals)
  ➔ Từng trang nghiệp vụ cụ thể (Menu, Booking, Cart, Checkout, Profile, Admin Pages)

PHASE 4: VERIFICATION & REGRESSION TESTING
  ➔ Kiểm thử trên toàn bộ Test Matrix (320px ➔ 1920px)
  ➔ Xác nhận 100% Desktop không bị ảnh hưởng
  ➔ Xác nhận 100% Business Logic, API, State giữ nguyên
```

---

# 10. MẪU BÁO CÁO KHI HOÀN THÀNH

Sau khi thực hiện cải tiến, lập báo cáo chi tiết theo cấu trúc:
1. **Danh sách Files thay đổi** (Kèm link markdown `file:///...`).
2. **Chi tiết cải tiến UI/UX** (Header, Navigation, Cards, Tables, Forms, Modals).
3. **Bảng đánh giá Responsive** (Pass/Fail cho từng breakpoint từ 320px đến 1920px).
4. **Cam kết an toàn chức năng**:
   - `Business logic`: **NOT CHANGED**
   - `API & Database`: **NOT CHANGED**
   - `State & Flow`: **NOT CHANGED**
   - `Desktop UI`: **PRESERVED & INTACT**
