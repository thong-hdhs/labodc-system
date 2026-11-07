# Ngày D20 — Regression tích hợp và chốt Sprint 3 (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — sửa lỗi tích hợp B; E2E Talent/Mentor/Team/Report; tài liệu và ghi nhận gap còn mở.
> **Phạm vi tài chính:** không thay đổi payment, ledger hoặc rule 70/20/10 thuộc owner A; regression chỉ chạy lại các fixture/suite hiện có.

## Đã tích hợp

- Nối upload/download file vào các màn hình Talent, Mentor, task và report; xác nhận API dùng access token và không đưa URL Cloudinary công khai vào response listing.
- Bổ sung E2E report attachment qua API: Leader upload tài liệu private; Team/Mentor xem theo scope; outsider bị chặn cả listing lẫn download. Bổ sung E2E từ chối actual size không khớp/vượt policy.
- Giữ nguyên nghiệp vụ tài chính của A. Các suite payout, receipt, dispute/closure được chạy trong regression tổng hợp, không thay đổi calculation/ledger.

## Kết quả xác minh

- `npm run build --workspace @labodc/api` — PASS.
- `npm run build --workspace @labodc/web` — PASS.
- `npm test --workspace @labodc/api -- --runInBand` — **29/29 suites, 79/79 tests PASS**.
- `git diff --check` — PASS.
- Chưa có browser-driven E2E hoặc smoke test với Cloudinary/PostgreSQL thật; file tests dùng provider/repository mock và DB migration chưa được áp dụng.

## Gaps / việc cần owner xác nhận

- A chuẩn bị Cloudinary account/environment secrets; chạy migration trên DB staging và xác nhận giới hạn truyền upload thực tế/cleanup file rejected.
- PO/Lab quyết định thời hạn lưu, xóa, retention và quy trình xóa dữ liệu theo yêu cầu privacy.
- Bổ sung scan malware/magic-byte validation, cleanup pending/rejected assets, browser E2E upload/download sau khi có môi trường staging; không tuyên bố các nội dung này đã đạt.
- Các thay đổi không gồm sửa báo cáo tài chính của A; xác nhận nghiệp vụ A dựa trên regression suite hiện có, không phải staging ledger reconciliation.
