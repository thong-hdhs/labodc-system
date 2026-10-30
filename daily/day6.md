# Ngày D6 — Hồ sơ Doanh nghiệp và Talent

> **Phân công:** A sở hữu Enterprise profile; B sở hữu Talent profile.  
> **Nguồn phân công:** [Phân công từng ngày](../implementation-plan/07-phan-cong-tung-ngay.md) và [Nền tảng & định danh](../implementation-plan/02-nen-tang-va-danh-tinh.md).  
> **Trạng thái tài liệu:** Phần profile cơ bản thuộc lát cắt D5 của B; D6 mở rộng skills/certifications và portfolio metadata. Phần B được triển khai trong checkout hiện tại. Người dùng xác nhận A đã hoàn thành D6; mã nguồn/bằng chứng Enterprise của A chưa xuất hiện trong checkout để review hoặc chạy E2E chung.

## 1. Mục tiêu D6

- Hoàn thiện hồ sơ Talent: thông tin cơ bản, kỹ năng, chứng chỉ và portfolio.
- Tích hợp API NestJS, schema PostgreSQL và giao diện React trên shared Auth context.
- Kiểm tra owner/data isolation; không để client tự quyết định quyền truy cập.
- Enterprise profile do A sở hữu; xác nhận luồng end-to-end hai miền sau khi có API/schema của A trong cùng checkout.

## 2. Bàn giao Sinh viên B

### API và schema

| Hạng mục | Kết quả | Tệp |
|---|---|---|
| Talent module/controller | Thêm module vào `AppModule`; bảo vệ API bằng `JwtAuthGuard` + `RolesGuard`; actor ID/email lấy từ JWT, không từ request body. | `apps/api/src/talent/talent.module.ts`, `talent.controller.ts` |
| Self-service profile | Talent/Talent Leader chỉ đọc/cập nhật `/api/v1/talent/me/profile`; Lab Admin/System Admin có endpoint đọc profile theo user ID. | `apps/api/src/talent/talent.controller.ts` |
| Profile service | Validate trường bắt buộc/giới hạn độ dài, chuẩn hóa skills/certifications, chống trùng student ID, báo lỗi rõ ràng. | `apps/api/src/talent/talent.service.ts` |
| PostgreSQL repository | Đọc/ghi profile, lấy email từ bảng `users`, cập nhật portfolio metadata theo user ID. | `apps/api/src/talent/talent-profile.repository.ts` |
| Migration B | Bảng `talent_profiles`, user ownership, student ID unique, JSONB arrays có constraint kiểu array. Migration tham chiếu `users(id)` của Auth shared. | `apps/api/src/database/migrations/002_b_talent_profiles.sql` |
| Upload stub | API chỉ ghi metadata portfolio ở trạng thái `PENDING_UPLOAD`; allowlist PDF/JPEG/PNG, giới hạn kỹ thuật 10 MiB. Không nhận/lưu bytes hoặc tạo URL public. | `POST /api/v1/talent/me/portfolio` |

### Web và trải nghiệm người dùng

- Tạo form profile có trường bắt buộc student ID/họ tên; trường tùy chọn khoa, ngành, khóa/năm học, giới thiệu, skills, certifications.
- Dùng shared Auth access token; route `/talent` (đích login hiện tại) và `/talent/profile` chỉ cho Talent/Talent Leader.
- Có loading, empty, success và error states; hiển thị rõ upload hiện chỉ lưu metadata.
- File `accept` phía trình duyệt chỉ hỗ trợ UX; API vẫn tự kiểm tra MIME type và kích thước.

Tệp: `apps/web/src/features/talent/TalentProfilePage.tsx`, `apps/web/src/App.tsx`.

### Kiểm thử

- Thêm unit + HTTP E2E test cho lưu profile/chuẩn hóa dữ liệu, trùng mã sinh viên, role denial, owner lấy từ JWT, upload metadata validation và thêm portfolio khi chưa có profile.
- Mã kiểm thử: `TC-B-TAL-01`, `TC-B-TAL-02`, `TC-B-FILE-STUB-01`.
- API typecheck và toàn bộ API test pass: **3 suites / 9 tests**. Web typecheck/Vite production build pass.
- `apps/web/index.html` và `apps/web/src/main.tsx` được bổ sung vì Web workspace trong checkout chưa có Vite entry point; đây là wiring cần thiết để route Talent build/chạy được.

## 3. Contract và quyền dữ liệu

- Identity user ID/email lấy từ JWT do Auth của A cấp; profile không nhận user ID từ client.
- Talent chỉ thao tác hồ sơ gắn với actor hiện tại; request không thể ghi đè owner.
- Lab Admin/System Admin có thể đọc profile theo endpoint quản trị có RBAC.
- Các endpoint đọc profile theo project cho Mentor/Enterprise chưa mở trong D6: hiện checkout chưa có Application/Project assignment service để chứng minh quan hệ project và lọc field. Mặc định từ chối truy cập chéo thay vì trả profile không kiểm soát; sẽ mở sau khi có shared authorization contract.
- `fullName` là dữ liệu profile B trong migration hiện tại; đồng bộ với shared User/Auth profile chưa có API contract triển khai trong checkout, cần review với A trước khi coi đây là nguồn identity chính thức.
- Upload chỉ nhận metadata do client khai báo nên chưa xác thực nội dung tệp thật. Cloudinary upload, malware/content validation, visibility, retention và delete policy tiếp tục là việc cần làm trước khi cho phép chia sẻ file thực tế.
- 10 MiB và PDF/JPEG/PNG là giới hạn kỹ thuật tạm thời cho stub, không thay thế policy file được PO/Lab phê duyệt.

## 4. Cùng chốt cuối ngày D6 (A + B)

| Checkpoint | Trạng thái | Ghi chú |
|---|---|---|
| Enterprise profile API/schema/UI do A sở hữu | **A báo hoàn thành** | Người dùng xác nhận A đã xong D6; trong checkout hiện tại chưa có module/tệp để review hoặc xác minh bằng test. |
| Talent profile API/schema/UI do B sở hữu | **Đã triển khai; kiểm tra API/Web pass** | Module, migration, form, validation, metadata-upload stub; API 3 suites/9 tests pass và Web production build pass. |
| Auth/RBAC và ownership | **API E2E pass** | Tạo/đọc self profile theo JWT; role Enterprise bị 403; user ID gửi trong body không ghi đè owner. |
| Tích hợp hai loại hồ sơ E2E | **Chưa xác minh** | Thiếu phần Enterprise của A trong checkout; chưa thể chạy E2E chéo. |
| Data isolation Talent | **HTTP E2E pass với repository test double; DB integration pending** | Xác minh route/role ownership; cần integration test trên PostgreSQL sau khi migration/shared Auth schema được áp dụng. |

### Việc cần phối hợp trước khi đóng checkpoint đầy đủ

1. A đưa Enterprise changes và shared `users` schema/migration vào cùng branch/checkout để review.
2. Xác nhận thứ tự migration: Auth `users` trước `002_b_talent_profiles.sql`; hiện repo chưa có migration runner hoặc Auth migration thực tế dù D5 document mô tả migration 001.
3. Chốt với A việc `fullName` là profile field B hay lấy từ User profile shared; migration hiện giữ field trong Talent profile để phù hợp API profile riêng.
4. Chạy kiểm thử integration trên PostgreSQL có migration; typecheck/API tests/Web build hiện đã pass, nhưng test không áp dụng migration thật.
5. Hoàn thiện assignment-based Mentor/Enterprise views và Cloudinary upload sau khi Project/Application access policy được triển khai.
6. Người dùng xác nhận giữ ADR-06 D4 `pnpm + Prisma`; A cần căn chỉnh skeleton/migration path hiện dùng npm workspaces + `pg` trước khi mở rộng persistence. D6 không tự ý đổi root package manager/ORM.

## 5. Kết luận D6

Phần B có implementation nền tảng cho Talent profile và metadata portfolio, với quyền tự phục vụ được giới hạn theo JWT; API typecheck/tests và Web production build đều pass. **Không đánh dấu D6 A+B hoặc E2E/data isolation toàn nhóm là pass** cho đến khi có code/bằng chứng Enterprise của A trong cùng checkout và chạy được migration/test tích hợp PostgreSQL. Các quyết định về file policy và field visibility chưa được suy diễn thành policy đã duyệt.
