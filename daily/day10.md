# Ngày D10 — Tích hợp Sprint 1 và đánh giá MVP Gate 1

> **Phạm vi:** D5–D10; tích hợp các lát cắt Auth, Enterprise, Project/Lab và Talent/Application.
> **Nguồn phân công:** [07-phan-cong-tung-ngay.md](../implementation-plan/07-phan-cong-tung-ngay.md), mục D10; tiêu chí gate đối chiếu [02-nen-tang-va-danh-tinh.md](../implementation-plan/02-nen-tang-va-danh-tinh.md) và [03-du-an-va-tuyen-chon.md](../implementation-plan/03-du-an-va-tuyen-chon.md).
> **Nguyên tắc nghiệm thu:** phân biệt test chạy trên test doubles/in-memory với PostgreSQL, staging và PO review; không xem kết quả local là sign-off production.

## 1. Mục tiêu D10

- **A:** tích hợp các lát cắt A, xử lý lỗi liên thông, bổ sung E2E và ghi rõ tình trạng migration/seed/run.
- **B:** tích hợp discovery/application/status, kiểm tra lỗi UI và responsive ở viewport nhỏ.
- **Cùng chốt:** kiểm thử luồng doanh nghiệp → Lab → công bố → Talent ứng tuyển/xem trạng thái; ghi forecast và các blocker của MVP gate.

## 2. Kết quả triển khai trong checkout

| Hạng mục | Kết quả hiện tại | Bằng chứng |
|---|---|---|
| Tích hợp API | `AppModule` đăng ký Auth, Talent, Enterprise, Projects, Lab Admin, Payments, Applications và System Admin. | `apps/api/src/app.module.ts` |
| Health check | `GET /api/v1/health` trả trạng thái ứng dụng, payment mode, uptime và timestamp. Đây là liveness check; chưa chứng minh PostgreSQL hoặc các phụ thuộc downstream sẵn sàng. | `apps/api/src/system-admin/system-admin.controller.ts` |
| System Admin | Dashboard tổng hợp chỉ số gate và audit log, có role protection; lỗi tải summary hoặc audit log được hiển thị. | `apps/api/src/system-admin/*`, `apps/web/src/features/system-admin/SystemAdminDashboardPage.tsx` |
| Luồng B trong E2E tích hợp | E2E D10 đi từ KYC, tạo/gửi proposal, Lab approve/publish, Talent tìm dự án, xác minh eligibility, nộp application, đọc application status/history tới Gate Summary. | `apps/api/test/d10-sprint1-mvp-gate.e2e-spec.ts` |
| Kiểm tra RBAC | D10 kiểm tra actor không đủ quyền bị chặn khỏi các API quản trị; các E2E D5–D9 tiếp tục kiểm tra owner, role, duplicate application và project đóng tuyển. | D10 E2E và các test suites D5–D9 |
| Responsive Web | Bổ sung layout một cột cho Talent ở màn hình hẹp; System Admin chuyển 4 → 2 → 1 cột và audit table cuộn ngang trong vùng riêng. | `apps/web/src/features/talent/talent-pages.css`, `apps/web/src/features/system-admin/system-admin-dashboard.css` |

### Kiểm tra giao diện bằng browser

| Màn hình | Viewport kiểm tra | Kết quả |
|---|---:|---|
| Talent project discovery | 390 px | Form một cột; `document.scrollWidth` bằng viewport; không tràn ngang trang. |
| Talent application status | 390 px | Nội dung/navigation hiển thị; `document.scrollWidth` bằng viewport. |
| System Admin dashboard | 360 px | Lưới một cột; `document.scrollWidth` bằng viewport; audit table cuộn trong container, không làm tràn trang. |

Đây là smoke check thủ công trên local browser, không thay thế kiểm thử thiết bị thật hoặc UAT responsive.

## 3. Kiểm thử tự động

Lệnh kiểm chứng tại repo root:

```powershell
npm test --workspace=apps/api -- --runInBand
npm run build --workspace=apps/api
npm run build --workspace=apps/web
git diff --check
```

Kết quả lần chạy cuối: **13/13 suites, 36/36 tests PASS**; API build, Web typecheck/production build và `git diff --check` PASS.

| Test suite | Phạm vi | Trạng thái lần nghiệm thu |
|---|---|---|
| `test/auth-rbac.e2e-spec.ts` | JWT/RBAC | **PASS** |
| `src/enterprise/enterprise.service.spec.ts`, `test/enterprise.e2e-spec.ts` | Enterprise profile, verification, ownership | **PASS** |
| `src/talent/talent.service.spec.ts`, `test/talent.e2e-spec.ts` | Talent profile, validation, metadata và role | **PASS** |
| `src/projects/projects.service.spec.ts`, `test/projects-proposal.e2e-spec.ts` | Proposal state, ownership và public contract | **PASS** |
| `src/lab-admin/lab-admin.service.spec.ts`, `test/lab-admin-review.e2e-spec.ts` | Review, publish và authorization | **PASS** |
| `test/applications.e2e-spec.ts` | Discovery, application, duplicate, withdraw, đóng tuyển | **PASS** |
| `src/payments/payments-spike.service.spec.ts`, `test/d9-publish-and-payos-spike.e2e-spec.ts` | PayOS spike, chữ ký, idempotency và project lifecycle | **PASS** |
| `test/d10-sprint1-mvp-gate.e2e-spec.ts` | Tích hợp D10, apply/status, dashboard/RBAC | **PASS** |

E2E API hiện chạy trong test process, phần lớn repository dùng in-memory/test doubles; kết quả không phải PostgreSQL integration test.

## 4. Đối chiếu Gate D10

| Tiêu chí gate | Kết luận | Bằng chứng / blocker |
|---|---|---|
| E2E doanh nghiệp → Lab → publish → Talent đăng ký và xem trạng thái | **Đạt ở API E2E local** | D10 E2E xác minh application `SUBMITTED` xuất hiện trong danh sách của đúng Talent. Chưa chạy trên staging. |
| Chặn role sai, application trùng, project không nhận đơn | **Có test API** | RBAC D10 và application E2E D7–D9. |
| API/Web build và CI | **Local build có thể xác minh; CI chưa có bằng chứng** | Chưa có workflow CI trong checkout. |
| Migration/seed chạy lặp lại từ database trống | **Chưa đạt** | Không có Auth `001_init_auth.sql`, migration runner hoặc seed PostgreSQL dùng cho các module; các file migration miền khác nhau có tiền tố trùng. |
| API/UI/data dùng PostgreSQL thống nhất | **Chưa đạt** | Auth, Enterprise, Project, Application và PayOS runtime hiện giữ dữ liệu trong memory; Talent dùng PostgreSQL repository nhưng schema/DB chưa được dựng. |
| Staging demo có thể tái tạo | **Chưa xác minh / blocker** | Không có cấu hình staging/compose/CI trong checkout. Local browser smoke cho thấy Talent profile API trả HTTP 500 khi không có PostgreSQL sẵn sàng. |
| PO review/sign-off | **Chưa có bằng chứng** | Cần ghi nhận kết quả demo, ý kiến và quyết định của PO trước khi đóng gate. |
| Forecast và actual capacity | **Chưa thể chốt** | D4 ghi estimate A 215 giờ, estimate sơ bộ B 269 giờ; đây không phải actuals, shared effort chưa reconcile và capacity thực tế chưa xác nhận. D10 không có actual hours mới; không tự điền số giờ giả định. |

### Migration và seed handoff

Các SQL hiện có trong `apps/api/src/database/migrations/` gồm:

- `002_a_enterprise_profiles.sql`
- `002_b_talent_profiles.sql`
- `003_a_projects_proposals.sql`
- `003_b_applications.sql`
- `004_a_payos_webhook_spike.sql`

Chưa có migration tạo bảng `users` được xác nhận trong checkout, runner quản lý thứ tự/idempotency, seed PostgreSQL hoặc lệnh reset database an toàn. Do đó **không chạy SQL thủ công theo tên file và không tuyên bố có thể migrate từ DB trống**. Trước khi staging demo, A cần thống nhất theo ADR-06 (`pnpm + Prisma` đã được ghi ở D5) hoặc chốt lại migration approach, bổ sung Auth schema + runner + seed; B cần tích hợp Application repository với cùng DB path.

## 5. Hướng dẫn kiểm tra local hiện có

```powershell
# Chạy API unit/E2E (không cần PostgreSQL; dữ liệu test không persistent)
npm test --workspace=apps/api -- --runInBand

# Build API và Web
npm run build --workspace=apps/api
npm run build --workspace=apps/web

# Chạy API và Web local trong hai terminal riêng
npm run dev:api
npm run dev --workspace=apps/web -- --host 127.0.0.1
```

Tài khoản demo mặc định và password nằm trong `AuthService`; phải đổi password qua `INITIAL_SYSADMIN_PASSWORD` ở môi trường local chia sẻ. Web Talent profile cần PostgreSQL/schema Talent sẵn sàng; các API test dùng test repository nên không thay thế bước đó.

## 6. Cùng chốt D10 và quyết định tiếp theo

- [x] Luồng API chính của MVP được ghép thành một E2E D10; Talent application/status được kiểm tra trong cùng luồng.
- [x] Responsive smoke check cho Talent discovery/status và System Admin dashboard ở viewport nhỏ.
- [ ] Không đánh dấu MVP Gate D10 “đạt hoàn toàn”: còn DB/migration/seed, staging và CI.
- [ ] PO review, cập nhật actual capacity/forecast và quyết định về persistence chưa có bằng chứng trong checkout.

**Kết luận:** D10 hoàn thành phần tích hợp code, API E2E local và responsive smoke check. Gate nghiệm thu MVP D10 vẫn **MỞ/BLOCKED**, không phải pass staging hay production. Chỉ đóng gate sau khi các blocker ở mục 4 được xử lý và PO review xác nhận.
