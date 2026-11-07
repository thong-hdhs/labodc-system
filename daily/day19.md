# Ngày D19 — Tệp private Cloudinary (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — upload/download avatar, portfolio, tài liệu task; kiểm thử quyền và kích thước. Lát cắt báo cáo cũng dùng chung policy file.
> **Policy Q-B13:** người dùng xác nhận trong phiên làm việc D19; quyết định đã được cập nhật tại `daily/day1.md`.

## Quyết định và phạm vi

- Avatar: PNG/JPEG, tối đa 5 MiB.
- Portfolio: PDF/JPEG/PNG, tối đa 10 MiB.
- Tài liệu Task/Report: PDF/DOCX/XLSX/CSV, tối đa 20 MiB.
- Tệp private; API chỉ cấp URL tải có chữ ký, hiệu lực 60 giây. Browser gửi trực tiếp lên Cloudinary bằng signed upload fields; không công khai URL/tên định danh nội bộ.
- Quyền được kiểm tra server-side: owner hồ sơ; thành viên cùng Team và assignee theo task; tác giả Leader, Mentor được giao hoặc Lab Admin theo report/resource scope.
- Chính sách retention/xóa dữ liệu chưa có quyết định; không tự đặt thời hạn lưu.

## Đã triển khai

- Thêm Cloudinary SDK và module `apps/api/src/files/` gồm policy MIME/extension/size, signed authenticated upload, xác minh metadata Cloudinary, Postgres/InMemory repositories, access history, endpoint listing/complete/download và kiểm tra quyền theo service Talent/Team/Task/Report.
- Thêm migration `apps/api/src/database/migrations/013_b_private_cloudinary_files.sql` cho metadata, liên kết avatar và lịch sử cấp URL.
- Gắn portfolio chỉ sau khi upload được xác minh; gắn avatar vào hồ sơ. Tệp task/report liên kết resource ID đã được API xác nhận.
- Thêm component UI dùng lại cho upload, danh sách và tải xuống; tích hợp vào [TalentProfilePage](../apps/web/src/features/talent/TalentProfilePage.tsx), [TalentTeamTasksPage](../apps/web/src/features/talent/TalentTeamTasksPage.tsx), [MentorTeamsPage](../apps/web/src/features/mentor/MentorTeamsPage.tsx) và [ProgressReportsPage](../apps/web/src/features/reports/ProgressReportsPage.tsx).
- Bỏ luồng portfolio cũ chỉ lưu metadata, không truyền nội dung.

## Kiểm thử

- E2E Talent kiểm tra hồ sơ phải tồn tại, MIME/size bị từ chối, hoàn tất upload, gắn portfolio/avatar, owner isolation và từ chối khi bytes thực tế Cloudinary vượt policy.
- E2E Report kiểm tra Leader upload, Team/Mentor được đọc theo scope, outsider không đọc/list/download chéo.
- Mock Cloudinary; không thực hiện request tới tài khoản dịch vụ thật. Toàn bộ API: 29 suites / 79 tests PASS; API build, Web build và `git diff --check` PASS.

## Giới hạn trước khi bật production

- Migration chưa được chạy trên PostgreSQL; môi trường hiện tại không có DB để kiểm chứng schema/foreign keys.
- Chưa có Cloudinary credentials/config trong môi trường; cần A cung cấp secrets qua environment/secret manager, không commit vào source.
- Server từ chối complete nếu Cloudinary báo bytes khác claim hoặc vượt giới hạn, nhưng signed direct upload gửi bytes tới Cloudinary trước bước kiểm tra. Vì vậy giới hạn hiện tại chặn chấp nhận/cấp quyền truy cập, chưa chặn truyền một payload quá cỡ trước khi upload; tệp bị từ chối có thể còn private trên Cloudinary và cần cleanup. Cần xác nhận giới hạn account/provider hoặc bổ sung cơ chế cleanup/ingress cap trước production.
- MIME/format được đối chiếu với intent và metadata Cloudinary; chưa đọc magic bytes/nội dung container để xác thực định dạng thực.
- Chưa có retention, xóa tệp, cleanup job cho upload dở dang hoặc scan malware; không được coi module là production-ready cho dữ liệu nhạy cảm cho tới khi các quyết định/controls này được chốt.
