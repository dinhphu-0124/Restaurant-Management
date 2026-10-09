# 07. PERFORMANCE & SCALABILITY RULES

---

## 1. BACKEND PERFORMANCE RULES

1. **Tránh N+1 Queries**:
   - Sử dụng `JOIN` hoặc truy vấn tập hợp với `WHERE id IN (?)` thay vì chạy vòng lặp `for` để query từng bản ghi con.
2. **Quản lý Bộ nhớ (Heap Memory Safety)**:
   - Không nạp mảng dữ liệu lớn không giới hạn vào Node.js heap memory.
   - Luôn sử dụng Stream hoặc Phân trang đối với các tập dữ liệu báo cáo/doanh thu lớn.
3. **Tách biệt Tác vụ Bất đồng bộ (Background Workers)**:
   - Không đặt các cron jobs nặng kéo dài trực tiếp trong event loop của tiến trình HTTP server chính.

---

## 2. FRONTEND PERFORMANCE RULES

1. **Lazy Loading Route**: Giảm Initial Bundle Size bằng `React.lazy()` và `Suspense`.
2. **Tối ưu Hình ảnh**: Đảm bảo hình ảnh món ăn được lazy-load (`loading="lazy"`) và có kích thước hiển thị phù hợp.
3. **Tránh Re-render thừa**: Sử dụng `useMemo` và `useCallback` cho các phép tính toán phức tạp hoặc hàm truyền vào component con lớn.
