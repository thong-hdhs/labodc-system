# Giai đoạn 1 — Nền tảng, bảo mật và danh tính

**Thời hạn:** D5–D10  
**Mục tiêu:** tạo nền tảng tích hợp được cho portal web, admin dashboard, Flutter và backend; triển khai xác thực/phân quyền server-side và tạo staging chạy được.

**Giới hạn nguồn lực:** với 2 sinh viên, triển khai theo lát cắt nhỏ; bootstrap Web/Flutter và dịch vụ theo thứ tự rủi ro/critical path, không xây nhiều phần rời song song. Sinh viên A ưu tiên API/data/auth; sinh viên B ưu tiên client; mỗi story phải được người còn lại review. Đo actual capacity và báo đỏ nếu estimate không khớp; baseline hiện vẫn giữ full scope/D40.

## Đầu vào

- Baseline, traceability matrix, state machine và permission matrix đã duyệt ở phase 0.
- ADR, API conventions, data classification/privacy decisions.
- Repo và quyền AWS/cloud, domain, CI/CD, PayOS sandbox, Cloudinary, Flutter toolchain.
- Quyết định JWT/session, password policy, email/OTP nếu có, cách bootstrap System Admin.

## Công việc và thời hạn

| Ngày | Công việc/đầu ra trung gian |
|---|---|
| D5 | Tạo repo, branch/PR rules, lint/format/test CI, Docker local, PostgreSQL migration, staging skeleton |
| D6 | NestJS modules, health/readiness endpoints, config validation, structured logging, API error contract, OpenAPI |
| D7 | User/account/role schema, JWT access/refresh policy, password hashing, login/logout/refresh, seed admin an toàn |
| D8 | Authorization guards/policies, role + resource ownership checks, audit event foundation, negative authorization tests |
| D9 | React app shell, route guards, API client/error handling; Flutter app shell và API client; Cloudinary/PayOS connectivity spike |
| D10 | Vertical slice auth trên web/mobile; integration test; deploy staging; backup baseline; sprint review và cập nhật forecast |

Chi tiết ai làm gì từng ngày nằm trong [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md). Hai sinh viên làm hai vertical slice độc lập (auth/admin và talent profile), mỗi slice có UI + API + data + test; API contract/mocks cho shared User/Auth được chốt trước, không phân một người backend và người kia frontend.

## Đầu ra

- Repo có quy ước làm việc, CI bắt buộc và branch protection theo năng lực nhóm.
- Docker local và môi trường staging; PostgreSQL migrations/versioning.
- NestJS API skeleton, health checks, validation, error responses, OpenAPI.
- Tài khoản người dùng, đăng nhập JWT, refresh/revoke theo chính sách, RBAC/ownership.
- Tài khoản System Admin được bootstrap an toàn; cấu hình vai trò/quyền và technical users theo phạm vi đã duyệt.
- React shell cho portal/admin và Flutter shell cho platform đã xác nhận ở D4.
- Ma trận quyền được thực thi ở API, có test cho allow/deny.
- Config/secrets không nằm trong source; log không ghi password/token/secret/payment data.
- Kết quả spike PayOS/Cloudinary và danh sách rủi ro xử lý tiếp.
- SAD/DDD được cập nhật; runbook deploy staging tối thiểu.

## Chia việc với 2 sinh viên

- **Sinh viên A:** vertical slice auth/RBAC full-stack (API, data, login/admin UI, authorization tests); là owner shared auth contract.
- **Sinh viên B:** vertical slice talent profile full-stack (profile API/schema riêng, profile UI, validation/tests); tiêu thụ auth qua contract, không chờ giao việc frontend.
- **Cả hai:** tích hợp contract, CI/staging, negative tests và review chéo; bootstrap Flutter theo ngày phân công trong [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md).
- Tránh cùng sửa shared auth/schema file; B mở PR/contract request nếu cần thay đổi; A owner merge shared auth.
- **PO/khách hàng:** duyệt vai trò/login/bootstrap account và cung cấp tài khoản dịch vụ.
- **Mentor bên ngoài (nếu có):** review security/deployment decisions.

## Gate kết thúc D10

- Người dùng từng vai trò có thể login trên các client thuộc baseline.
- Backend từ chối truy cập sai vai trò/khác resource; test chứng minh điều đó.
- Staging deploy lặp lại được bằng pipeline; có health check và migration path.
- Không commit secrets; log/config đã được kiểm tra.
- API contract đủ để các phase tính năng phát triển song song.

## Definition of Done

CI pass; auth/RBAC test pass; staging smoke test pass; web/mobile shell build được; migration/recovery và tài liệu kiến trúc được cập nhật. Nếu D10 chưa đạt, xử lý nền tảng trước khi tăng số luồng tính năng.
