# Ngày D7 — Lát cắt dọc Đề xuất Dự án Doanh nghiệp `REQ-ENT-02` (Sinh viên A) & Hợp đồng Dự án Công khai cho Sinh viên B

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Proposal Lifecycle, Lab Admin, System Admin, Finance/PayOS)  
> **Giai đoạn:** Giai đoạn 1 — Nền tảng và lát cắt MVP đầu tiên (Ngày D7 / Sprint 1: D5–D10)  
> **Đầu vào:** Module Hồ sơ & Xác thực Doanh nghiệp (`REQ-ENT-01` ở D6), Máy trạng thái `ProjectStatus` và Quy tắc nghiệp vụ Q-A02 tại `day1.md` & `day3.md`.  
> **Đầu ra:** Migration `003_a_projects_proposals.sql`, Shared Contract `ProjectStatus` & `PublicProjectSummaryDto`, Backend `ProjectsModule` (`apps/api/src/projects/*`), Giao diện `EnterpriseProposalPage.tsx`, và bộ kiểm thử tự động `TC-PRJ-01`, `TC-PRJ-02` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D7 (Của Sinh viên A)

| Mã Req / Contract | Hạng mục công việc Full-Stack của Sinh viên A | Module / Đường dẫn thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **Shared Contract** | Định nghĩa enum `ProjectStatus` (11 trạng thái chuẩn), `ProposalRejectionReasonCode` & `PublicProjectSummaryDto` | `packages/shared-types/src/index.ts` | **Hoàn thành (100%)** | `npm run typecheck` Pass trên cả 3 workspaces |
| **REQ-ENT-02** *(DB Migration)* | Thiết kế bảng `projects` và bảng lưu vết lịch sử trạng thái `project_audit_logs` | `apps/api/src/database/migrations/003_a_projects_proposals.sql` | **Hoàn thành (100%)** | Đồng bộ 100% với thiết kế D3 |
| **REQ-ENT-02** *(Backend API)* | Xây dựng API Tạo bản nháp (`DRAFT`), Chỉnh sửa bản nháp, Gửi xét duyệt (`SUBMITTED` — kiểm tra điều kiện doanh nghiệp `VERIFIED`), Khóa sửa sau khi gửi (`409 Conflict`) & API đọc danh sách dự án `PUBLISHED` | `apps/api/src/projects/project-proposal.types.ts`<br>`apps/api/src/projects/project-proposal.repository.ts`<br>`apps/api/src/projects/projects.service.ts`<br>`apps/api/src/projects/projects.controller.ts`<br>`apps/api/src/projects/projects.module.ts` | **Hoàn thành (100%)** | Unit Test `projects.service.spec.ts` & E2E Test `projects-proposal.e2e-spec.ts` Pass |
| **REQ-ENT-02** *(Frontend Web)* | Xây dựng màn hình Tạo/Chỉnh sửa Bản nháp, Gửi duyệt Đề xuất Dự án và theo dõi trạng thái xử lý | `apps/web/src/features/enterprise/EnterpriseProposalPage.tsx`<br>`apps/web/src/App.tsx` | **Hoàn thành (100%)** | `npm run typecheck --workspace=apps/web` Pass |

---

## 2. Danh sách API Endpoints Miền Project Proposal Đã Triển khai trong Ngày D7

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Máy trạng thái (State Machine) | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/projects/proposals` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Doanh nghiệp khởi tạo bản nháp đề xuất dự án (`status = DRAFT`), sinh mã dự án tự động (`ODC-2026-xxx`) và ghi `CREATE_DRAFT` vào `project_audit_logs`. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden` |
| `PATCH /api/v1/projects/proposals/:id` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Cập nhật nội dung đề xuất của chính doanh nghiệp sở hữu. Chỉ cho phép khi `status` là `DRAFT` hoặc `CHANGES_REQUESTED`; trả về `409 Conflict` nếu đã `SUBMITTED`/`APPROVED`. | `200 OK`<br>`403 Forbidden`<br>`409 Conflict` |
| `POST /api/v1/projects/proposals/:id/submit` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Kiểm tra hồ sơ doanh nghiệp đã `VERIFIED` (`ENTERPRISE_NOT_VERIFIED` nếu chưa) và kiểm tra đủ trường bắt buộc, chuyển trạng thái sang `SUBMITTED` + ghi Audit Log. | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |
| `GET /api/v1/projects/proposals/me` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Lấy danh sách toàn bộ đề xuất dự án do doanh nghiệp đang đăng nhập sở hữu. | `200 OK` |
| `GET /api/v1/projects/proposals/:id` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Xem chi tiết đề xuất kèm lịch sử `auditLogs`. Chặn `403 Forbidden` nếu Doanh nghiệp B cố xem đề xuất của Doanh nghiệp A. | `200 OK`<br>`403 Forbidden`<br>`404 Not Found` |
| `GET /api/v1/projects/public` | Public / Shared Read Contract | Chỉ trả về các dự án có `status === 'PUBLISHED'` để phục vụ module Khám phá & Ứng tuyển dự án (`REQ-TAL-02`) của Sinh viên B. | `200 OK` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D7 (`TC-PRJ-01` & `TC-PRJ-02`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **TC-PRJ-01a** | *Given* Doanh nghiệp A mới tạo hồ sơ ở trạng thái `PENDING_VERIFICATION`, *When* tạo bản nháp `DRAFT` thì thành công (`201 Created`), nhưng *When* bấm `POST /api/v1/projects/proposals/:id/submit`, *Then* hệ thống từ chối gửi. | `400 Bad Request` (`ENTERPRISE_NOT_VERIFIED`) | **PASS** |
| **TC-PRJ-01b** | *Given* Hồ sơ Doanh nghiệp A đã được Lab Admin duyệt sang `VERIFIED` và bản nháp đã điền đủ thông tin, *When* gọi `POST /api/v1/projects/proposals/:id/submit`, *Then* đề xuất chuyển sang `SUBMITTED` và ghi nhận Audit Trail. | `200 OK` + `status === 'SUBMITTED'` | **PASS** |
| **TC-PRJ-02a** | *Given* Đề xuất dự án đang ở trạng thái `SUBMITTED`, *When* Doanh nghiệp A gọi `PATCH /api/v1/projects/proposals/:id` để sửa nội dung, *Then* hệ thống khóa chỉnh sửa và trả lỗi chuyển trạng thái. | `409 Conflict` (`INVALID_STATE_TRANSITION`) | **PASS** |
| **TC-PRJ-02b** | *Given* Đề xuất thuộc Doanh nghiệp A, *When* Doanh nghiệp B gọi `GET`/`PATCH` vào đề xuất đó hoặc `TALENT` gọi `POST /api/v1/projects/proposals`, *Then* hệ thống từ chối truy cập. | `403 Forbidden` | **PASS** |

---

## 4. Điểm chốt Cuối Ngày D7 (Checkpoint A + B) & Chuẩn bị Ngày D8

- [x] **Hoàn tất lát cắt dọc `REQ-ENT-02`:** Doanh nghiệp tạo nháp, sửa nháp, kiểm tra điều kiện xác thực pháp nhân `VERIFIED` trước khi gửi duyệt và khóa chỉnh sửa khi đã `SUBMITTED`.
- [x] **Đồng bộ Contract với Sinh viên B:** Đã xuất bản `ProjectStatus` và endpoint `GET /api/v1/projects/public` để Sinh viên B kết nối module Danh sách dự án công khai (`REQ-TAL-02`).
- [x] **Sẵn sàng cho Ngày D8–D9 (`REQ-LAB-01`):** `ProjectProposalRepository` và `ProjectsService` đã sẵn sàng để Ngày D8 Sinh viên A xây dựng **Hàng đợi Lab Admin xét duyệt đề xuất (`APPROVE` / `REJECT` / `REQUEST_INFO` kèm Reason Code bắt buộc) và Công bố dự án (`PUBLISH`)**.