# Ngày D5 — Nền tảng, Đăng nhập và Hồ sơ Talent (Sinh viên A + B)

> **Phân công:** A sở hữu monorepo/root config, Auth/User/RBAC; B sở hữu Talent profile API/schema/UI.
> **Nguồn chuẩn:** [Phân công từng ngày](../implementation-plan/07-phan-cong-tung-ngay.md), D5.
> **Nguyên tắc ghi nhận:** Tài liệu này phân biệt phần có trong checkout với các đầu ra chưa có bằng chứng. Không xem nội dung kế hoạch hoặc mô tả trước đó là bằng chứng tự thân.

## 1. Mục tiêu D5

- A dựng API NestJS/Web React skeleton và vertical slice Auth/User/Role.
- B tích hợp Talent profile API/schema/UI theo shared Auth contract; không sở hữu root config/Auth.
- Hai bên kiểm thử role/ownership và thống nhất migration/module ownership.

## 2. Sinh viên A — Shared skeleton và Auth

| Hạng mục | Trạng thái trong checkout hiện tại | Bằng chứng / ghi chú |
|---|---|---|
| Monorepo/workspaces | **Có** | `package.json`, `package-lock.json`, `apps/api`, `apps/web`, `packages/shared-types`; đang dùng npm workspaces. |
| NestJS API + React Web/Auth UI | **Có; kiểm tra pass** | Auth controller/guards/service, `AuthContext`, `ProtectedRoute`, `LoginPage`; API Auth E2E pass; Web typecheck/Vite build pass. |
| Shared role/JWT contract | **Có** | `packages/shared-types/src/index.ts`; B tiêu thụ `JwtPayload` và `UserRole`. |
| Auth database migration/seed persistence | **Chưa có bằng chứng** | `apps/api/src/database/migrations/001_init_auth.sql` không có; AuthService hiện giữ users/audit trong memory, không phải DB persistence. |
| Docker Compose local | **Chưa có trong checkout** | Không tìm thấy `docker-compose.yml`. |
| GitHub Actions CI | **Chưa có trong checkout** | Không tìm thấy `.github/workflows/ci.yml`. |
| System Admin UI | **Chưa hoàn chỉnh** | Route đang hiển thị placeholder, không coi là dashboard hoàn thiện. |

Tài liệu D5 trước đây mô tả migration `001_init_auth.sql`, Docker Compose và CI đã hoàn tất. Các artefact đó chưa hiện diện trong checkout hiện tại nên được đánh dấu **chưa xác minh/chưa có**, không dùng mô tả cũ làm bằng chứng.

## 3. Sinh viên B — REQ-TAL-01 Talent profile

> Phần B được bổ sung vào checkout hiện tại để hoàn thành đầu ra D5. Code Talent hiện cũng có các trường skills/certifications và portfolio metadata thuộc D6; không suy diễn rằng code đã được giao vào đúng ngày lịch sử D5.

| Hạng mục | Kết quả | Tệp / bằng chứng |
|---|---|---|
| API profile cá nhân | `GET /api/v1/talent/me/profile`, `PUT /api/v1/talent/me/profile`; actor lấy từ JWT, không nhận `userId` từ body. | `apps/api/src/talent/talent.controller.ts`, `talent.service.ts` |
| Schema/migration riêng B | `talent_profiles` gắn `user_id`, `student_id` unique; migration B riêng, tham chiếu shared `users`. | `apps/api/src/database/migrations/002_b_talent_profiles.sql` |
| Web form | Dùng Auth access token; route `/talent` và `/talent/profile` giới hạn Talent/Talent Leader; có loading, error, success, empty state. | `apps/web/src/features/talent/TalentProfilePage.tsx`, `apps/web/src/App.tsx` |
| Test ownership và validation | API E2E kiểm tra owner từ JWT, profile self-service, Talent khác không xem được profile, role Enterprise bị 403. Unit test validation/trùng student ID. | `apps/api/test/talent.e2e-spec.ts`, `apps/api/src/talent/talent.service.spec.ts` |
| Khả năng build/chạy Web | Bổ sung entry point còn thiếu để Web workspace build được. | `apps/web/index.html`, `apps/web/src/main.tsx` |
| D6 mở rộng dùng chung | Skills/certifications và portfolio metadata stub có sẵn; chưa upload file bytes hoặc tạo URL public. | `POST /api/v1/talent/me/portfolio` |

### Contract D5 của B

- Talent/Talent Leader chỉ truy cập profile của actor hiện tại; backend lấy identity từ JWT.
- `studentId` và `fullName` bắt buộc ở form; khoa, ngành, khóa/năm học, giới thiệu, skills, certifications là tùy chọn.
- B không sửa Auth, roles hoặc root package/workspace config.
- Migration B chạy sau migration tạo `users`; hiện Auth migration/runner của A chưa có nên chưa thể apply migration này trên PostgreSQL thật.

### Chạy kiểm thử

```powershell
npm run typecheck --workspace=apps/api
npm test --workspace=apps/api -- --runInBand
npm run build --workspace=apps/web
```

Kết quả: API typecheck pass; API **3/3 suites, 9/9 tests pass**; Web TypeScript check và Vite production build pass. HTTP E2E dùng repository test double, chưa phải PostgreSQL integration test.

## 4. Cùng chốt D5 — A + B

| Hạng mục | Trạng thái | Kết luận |
|---|---|---|
| Ownership | **Đã chốt** | A sở hữu shared Auth/User/root config; B sở hữu Talent profile và migration miền B. |
| Auth → Talent integration | **Đạt ở HTTP level** | Talent API dùng JWT actor context và shared roles; tests kiểm tra role denial và data isolation giữa actor. |
| B hoàn thành D5 Talent slice | **Đạt ở API/Web mức code và tests** | Profile API/form/schema có trong checkout; typecheck, API tests và Web build pass. |
| A hoàn thành Auth vertical slice | **Có code/tests; DB persistence chưa đạt/xác minh** | API Auth/RBAC có; users/audit đang in-memory, Auth DB migration không có. |
| Auth migration, migration runner, PostgreSQL E2E | **Chưa đạt/chưa xác minh** | Không thể xác nhận migration `002_b_talent_profiles.sql` chạy trên schema Auth thật. |
| Docker Compose và CI | **Chưa có bằng chứng trong checkout** | Không có hai file được nêu trong tài liệu D5 trước đây. |
| Package manager/ORM | **Quyết định chuẩn đã xác nhận; checkout đang lệch** | Người dùng xác nhận giữ ADR-06 D4 `pnpm + Prisma`. D5 checkout hiện dùng npm workspaces + `pg`, không có Prisma; A cần điều chỉnh skeleton/config hoặc thống nhất migration path theo ADR trước khi mở rộng persistence D7. B không tự ý đổi root toolchain. |

### Kết luận checkpoint

**D5 B đã hoàn thành và kiểm thử ở mức API/Web; contract ownership với A được nối ở HTTP level. Người dùng xác nhận giữ ADR-06 `pnpm + Prisma`. Checkpoint kỹ thuật D5 A+B được ghi nhận nhưng chưa thể đánh dấu “pass hoàn toàn”** vì thiếu Auth DB migration/runner, Docker/CI evidence, DB-backed E2E và skeleton hiện chưa tuân theo package manager/ORM đã chọn.

Kết luận này phản ánh checkout hiện tại, không phủ nhận báo cáo của A. Để đóng gate chung, A cần bổ sung artefact còn thiếu và căn chỉnh skeleton/migration path theo ADR-06 vào cùng branch trước khi mở rộng persistence ở D7.
