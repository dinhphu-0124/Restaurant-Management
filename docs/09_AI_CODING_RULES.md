# 09. AI CODING RULES & PROTOCOLS

---

> [!IMPORTANT]
> **TÀI LIỆU BẮT BUỘC ĐỐI VỚI MỌI AI AGENT PHÁT TRIỂN DỰ ÁN**.
> Bất kỳ AI Coding Assistant nào làm việc trên repository này **BẮT BUỘC** phải tuân thủ nghiêm ngặt chu trình 7 bước sau:

```text
    READ (Đọc docs & source code thực tế)
      ↓
UNDERSTAND (Hiểu rõ kiến trúc, dependencies & side-effects)
      ↓
    PLAN (Lập kế hoạch chi tiết, đánh giá rủi ro)
      ↓
 IMPLEMENT (Triển khai code sạch theo đúng quy chuẩn)
      ↓
    TEST (Viết và chạy test tự động kiểm chứng)
      ↓
   VERIFY (Kiểm tra build, syntax, regressions)
      ↓
  REPORT (Báo cáo minh bạch kết quả và cập nhật docs)
```

---

## 1. NGUYÊN TẮC CẤM ĐỐI VỚI AI CODING

1. **CẤM sửa code mù quáng**: Không sửa code khi chưa đọc hiểu source code thực tế và các file liên quan.
2. **CẤM phá vỡ Business Logic & UI/UX**: Không tự ý đổi cách tính tiền, logic đặt bàn hay giao diện người dùng nếu không có yêu cầu cụ thể.
3. **CẤM tự ý cài thư viện bừa bãi**: Nếu các dependencies hiện có đã giải quyết được vấn đề, không được cài thêm package mới.
4. **CẤM bỏ qua bước Verify**: Không bao giờ trả lời `ĐÃ XONG / DONE` khi chưa chạy kiểm tra build, lint và test thực tế.
5. **CẤM over-engineering**: Không tạo abstraction/wrapper vô nghĩa nếu không phục vụ mục đích mở rộng hoặc kiểm thử.
