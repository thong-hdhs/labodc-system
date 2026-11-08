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

---

# Phần Báo cáo Ngày D19 của Sinh viên A — Kiểm định Phi chức năng (`REQ-NFR-01`, `REQ-NFR-02`, `REQ-NFR-03`), Đo kiểm SLA P95, Ma trận Bảo mật RBAC 6 Vai trò & Chứng nhận Sẵn sàng Production (`ADR-05`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS & Hạ tầng) phối hợp đồng bộ với Sinh viên B (`FilesModule` — Quản lý tệp tin Cloudinary `013_b_private_cloudinary_files.sql`)  
> **Giai đoạn:** Giai đoạn 3 — Báo cáo, Đánh giá, Giải ngân Chi tiết & Hoàn thiện Production (Ngày D19 / Sprint 3: D17–D21)  
> **Đầu vào:** Toàn bộ các module nghiệp vụ D5–D18 của Sinh viên A (`Auth`, `Enterprise`, `Projects`, `LabAdmin`, `Payments`, `SystemAdmin`) và của Sinh viên B (`Talent`, `Applications`, `Teams`, `Tasks`, `Reports`, `Files`).  
> **Đầu ra:** Migration `015_a_production_sla_and_security_audit.sql`, `ProductionReadinessService` & `ProductionReadinessController` (`apps/api/src/system-admin/*`), Giao diện `ProductionReadinessChecklistPanel.tsx`, Unit Test `production-readiness.service.spec.ts` và E2E Test `d19-nfr-performance-security-readiness.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D19 (Của Sinh viên A)

| Mã Req / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-NFR-01**<br>**REQ-NFR-02**<br>**ADR-05** | Thiết kế Migration `015_a_production_sla_and_security_audit.sql` (`system_sla_benchmarks`, `production_readiness_signoffs`) | `apps/api/src/database/migrations/015_a_production_sla_and_security_audit.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 & `ADR-05` |
| **REQ-NFR-01**<br>**REQ-NFR-02** | Xây dựng API Liveness/Readiness Probes (`GET /api/v1/system-admin/readiness/probes`) và Đo kiểm SLA Thời gian phản hồi P95 (`POST/GET /api/v1/system-admin/readiness/sla-benchmarks`: $\le 500\text{ ms}$ cho API chuẩn, $\le 1000\text{ ms}$ cho API Sổ cái tài chính) | `apps/api/src/system-admin/production-readiness.types.ts`<br>`apps/api/src/system-admin/production-readiness.service.ts`<br>`apps/api/src/system-admin/production-readiness.controller.ts` | **Hoàn thành (100%)** | Pass Unit Test `production-readiness.service.spec.ts` & E2E `TC-NFR-D19-01` |
| **REQ-NFR-03**<br>**ADR-05** | Xây dựng API Kiểm toán Ma trận Bảo mật RBAC 6 Vai trò (`GET /api/v1/system-admin/readiness/security-matrix`) và Ký Chứng nhận Sẵn sàng Production (`POST /api/v1/system-admin/readiness/sign-off`) | `apps/api/src/system-admin/system-admin.module.ts`<br>`apps/web/src/features/system-admin/ProductionReadinessChecklistPanel.tsx`<br>`apps/api/test/d19-nfr-performance-security-readiness.e2e-spec.ts` | **Hoàn thành (100%)** | Pass E2E `TC-NFR-D19-02` & `npm run typecheck` |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D19 (Của Sinh viên A)

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Phi chức năng | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/system-admin/readiness/probes` | Public Probe (`ADR-05`) | Trả về trạng thái `liveness: ALIVE`, `readiness: READY`, `uptimeTargetPercent: 99.0` và `paymentGatewayMode`. | `200 OK` |
| `POST /api/v1/system-admin/readiness/sla-benchmarks` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Ghi nhận kết quả đo thời gian phản hồi P95 và tự động đối chiếu ngưỡng SLA ($\le 500\text{ ms}$ hoặc $\le 1000\text{ ms}$). | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden` |
| `GET /api/v1/system-admin/readiness/security-matrix` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Xuất báo cáo kiểm toán toàn bộ 6 vai trò RBAC và 6 chốt chặn bảo mật (JWT, RolesGuard, Tenant Isolation, PayOS HMAC-SHA256, Idempotency Key, Immutable 70/20/10). | `200 OK`<br>`403 Forbidden` |
| `POST /api/v1/system-admin/readiness/sign-off` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN)` | Ký Chứng nhận Sẵn sàng Production (`PROD-READY-D19-xxx`); chặn `409 Conflict` nếu có bất kỳ chỉ số SLA nào vượt ngưỡng hoặc Sổ cái không cân bằng. | `201 Created`<br>`403 Forbidden`<br>`409 Conflict` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D19 (`production-readiness.service.spec.ts` & `d19-nfr-performance-security-readiness.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-NFR-D19-01** | *Given* Mẫu đo `STANDARD_API` vượt ngưỡng `500ms` (`650ms`), *When* `SYSTEM_ADMIN` gọi `signOffProductionReadiness`, *Then* hệ thống chặn `409 Conflict` (`SLA_THRESHOLD_VIOLATION`). | `409 Conflict` | **PASS** |
| **TC-NFR-D19-01** | *Given* Đo thời gian phản hồi thực tế của `/readiness/probes` và `/payments/reconciliation/summary`, *When* ghi nhận vào `POST /sla-benchmarks`, *Then* cả 2 đạt ngưỡng SLA (`withinSla === true`, `complianceRatePercent === 100`). | `201 Created` + `100% SLA` | **PASS** |
| **TC-NFR-D19-02** | *Given* Kiểm toán Ma trận RBAC 6 vai trò đạt `VERIFIED_PASS` và chặn `403` với `ENTERPRISE` / `TALENT` / `LAB_ADMIN`, *When* `SYSTEM_ADMIN` gọi `POST /readiness/sign-off`, *Then* cấp chứng nhận `PROD-READY-D19-001`. | `201 Created` + `allNfrGatesPassed === true` | **PASS** |
