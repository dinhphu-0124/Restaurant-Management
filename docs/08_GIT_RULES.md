# 08. GIT WORKFLOW & RELEASE RULES

---

## 1. QUY TẮC PHÂN NHÁNH & COMMIT

* **Quy chuẩn tên nhánh**:
  * `main`: Nhánh production ổn định, chỉ merge code đã qua test đầy đủ.
  * `develop`: Nhánh tích hợp tính năng.
  * `feature/[ten-tinh-nang]`: Nhánh phát triển tính năng mới.
  * `fix/[ten-loi]`: Nhánh sửa lỗi nóng hoặc refactor.
* **Quy chuẩn thông điệp Commit (Conventional Commits)**:
  * `feat:` Tính năng mới.
  * `fix:` Sửa lỗi.
  * `refactor:` Tái cấu trúc mã nguồn không đổi business logic.
  * `docs:` Cập nhật tài liệu.
  * `perf:` Cải thiện hiệu năng.
  * `test:` Bổ sung hoặc sửa đổi bài test.

---

## 2. AN TOÀN BÍ MẬT & BẢO MẬT COMMIT

* Cấm commit file `.env`, file cấu hình chứa private keys hoặc token cá nhân.
* Trước khi push code, chạy kiểm tra `git status` và `git diff` để đảm bảo không lọt file rác hay credential.
