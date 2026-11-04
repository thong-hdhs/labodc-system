# Ngày D11 — Đổi phạm vi/hủy dự án và Mentor review/phỏng vấn (A + B)

> **Phân công:** A sở hữu luồng yêu cầu đổi phạm vi/hủy dự án và phê duyệt Lab Admin (`REQ-ENT-03`, `REQ-LAB-02`). B sở hữu Mentor review/Application review API và Mentor UI (`REQ-MEN-02`). Các contract Project dùng chung được tích hợp giữa hai phần.
> **Nguồn:** [07-phan-cong-tung-ngay.md](../implementation-plan/07-phan-cong-tung-ngay.md), D11; quyết định/state baseline ở [day2.md](./day2.md) và [day3.md](./day3.md).
> **Trạng thái persistence:** runtime Project/Application, assignment, change request và review event hiện còn in-memory; các SQL migration là bản nháp, chưa được áp dụng bởi migration runner.

## Phần B — Mentor review và phỏng vấn ứng viên

### Quyết định nghiệp vụ đã chốt

| Chủ đề | Quyết định |
|---|---|
| Mentor assignment | Mỗi project có **một Mentor phụ trách chính tại một thời điểm**. Lab Admin/System Admin gán hoặc đổi Mentor qua API; lịch sử assignment lưu lại. Chỉ Mentor hiện tại được gán mới xem/xử lý đơn. |
| Cấu hình phỏng vấn | Doanh nghiệp chọn `requiresInterview` trong proposal draft. Mặc định `false`; field được giữ trong Project public read contract. |
| Phạm vi interview | Không lập lịch hoặc lưu link/địa điểm. Mentor ghi kết quả `PASS`/`FAIL` và ghi chú nội bộ, không có điểm rubric ở D11. |
| State và quyết định | `SUBMITTED -> UNDER_REVIEW`; project yêu cầu interview thì bắt buộc ghi kết quả để chuyển `INTERVIEW` trước `ACCEPTED`/`REJECTED`. Nếu không yêu cầu, Mentor quyết định từ `UNDER_REVIEW`. Mentor là người quyết định cuối theo project assignment. |
| Quyền riêng tư | Mentor được gán xem candidate identity/profile và review events. Candidate chỉ xem trạng thái/history ứng tuyển; không nhận `reviewEvents`, interview outcome note hoặc decision note. Enterprise không có endpoint xem application review notes. |

Chi tiết tiêu chí định tính có thể được PO/Mentor bổ sung sau; D11 không suy diễn thành thang điểm.

### Đầu ra thực hiện

| Hạng mục | Kết quả | Tệp chính |
|---|---|---|
| Gán Mentor chính | Lab Admin/System Admin gán Mentor active cho project đã `PUBLISHED`, `RECRUITMENT_CLOSED` hoặc `IN_PROGRESS`; thay assignment tạo lịch sử. Tài khoản không phải Mentor bị từ chối. | `apps/api/src/applications/mentor-assignment.repository.ts`, `applications.service.ts`, `applications.controller.ts` |
| Hàng đợi Mentor | Mentor chỉ nhận applications thuộc project đang được gán; trả profile candidate cần cho review cùng state/review history. | `GET /api/v1/mentor/me/applications` |
| State review và decision | Bắt đầu review, ghi interview result nếu project yêu cầu, quyết định `ACCEPTED`/`REJECTED` theo state hợp lệ. | `POST /api/v1/mentor/applications/:id/start-review`, `interview-result`, `decision` |
| Ghi chú nội bộ | Lưu review events tách khỏi candidate state history; giới hạn ghi chú 2.000 ký tự; API Candidate không trả nội dung. | `application.repository.ts`, `application_review_events` trong migration draft |
| Project contract | Proposal create/update nhận boolean `requiresInterview`; Enterprise form cho phép chọn; public summary/detail trả field. | `apps/api/src/projects/*`, `apps/web/src/features/enterprise/EnterpriseProposalPage.tsx`, `packages/shared-types/src/index.ts` |
| Mentor UI | Route `/mentor/applications`; xem candidate/project, bắt đầu review, ghi PASS/FAIL + private note và ra quyết định. Login Mentor điều hướng tới route này. | `apps/web/src/features/mentor/MentorApplicationsPage.tsx`, `mentor-applications.css`, `apps/web/src/App.tsx`, `LoginPage.tsx` |

### API contract

| Method / endpoint | Quyền | Hành vi |
|---|---|---|
| `POST /api/v1/lab-admin/projects/:projectId/mentor-assignment` | `LAB_ADMIN`, `SYSTEM_ADMIN` | Body `{ "mentorUserId": "<user-id>" }`; gán/đổi primary Mentor, trả assignment và lịch sử. |
| `GET /api/v1/mentor/me/applications` | `MENTOR` đã đăng nhập | Trả đơn thuộc các project hiện được gán; mỗi item có candidate profile scoped và review events nội bộ. |
| `POST /api/v1/mentor/applications/:applicationId/start-review` | Mentor đang được gán | Chỉ `SUBMITTED -> UNDER_REVIEW`. |
| `POST /api/v1/mentor/applications/:applicationId/interview-result` | Mentor đang được gán | Chỉ khi `requiresInterview=true` và state `UNDER_REVIEW`; body `{ "outcome": "PASS|FAIL", "internalNote": "..." }`; chuyển sang `INTERVIEW`. |
| `POST /api/v1/mentor/applications/:applicationId/decision` | Mentor đang được gán | Body `{ "status": "ACCEPTED|REJECTED", "internalNote": "..." }`; state phải là `INTERVIEW` nếu project yêu cầu interview, nếu không phải `UNDER_REVIEW`. |

Endpoint assignment kiểm tra project tồn tại/trạng thái và xác minh target user là Mentor active qua Auth service. Assignment hiện không có Lab Admin UI; gán qua API. Mentor invitation/accept/decline thuộc D12.

### Schema/migration

- **A/shared Project contract:** `apps/api/src/database/migrations/005_a_project_interview_requirement.sql` thêm `projects.requires_interview BOOLEAN NOT NULL DEFAULT FALSE`.
- **B:** `apps/api/src/database/migrations/005_b_mentor_reviews.sql` định nghĩa `project_mentor_assignments`, `mentor_assignment_history` và `application_review_events` với trạng thái/kết quả/ghi chú.
- Migration files chưa chạy trên database; không coi đây là persistence đã nghiệm thu. Migration runner, Auth base schema và PostgreSQL integration test còn là blocker từ D10.

### Kiểm thử D11

E2E `apps/api/test/mentor-review.e2e-spec.ts` kiểm tra:

| Test | Kịch bản | Kết quả |
|---|---|---|
| `TC-B-MEN-02` | Lab Admin gán Mentor; actor không phải Admin bị từ chối; target không phải Mentor bị từ chối; Mentor ngoài project không thể truy cập/review. | **PASS** |
| `TC-B-MEN-03` | Required interview chặn quyết định sớm; Mentor bắt đầu review, ghi `PASS`, quyết định cuối; non-required project cho phép quyết định trực tiếp và từ chối interview result. | **PASS** |
| `TC-B-MEN-04` | Mentor được gán thấy candidate profile và private review note; Talent chỉ thấy trạng thái, không nhận note/reviewEvents. | **PASS** |

Kiểm thử dùng in-memory Application/assignment repositories và test Talent profile repository; không xác nhận PostgreSQL hoặc migration.

Lần xác minh đầy đủ sau thay đổi D11: API **14/14 suites, 38/38 tests PASS**; API TypeScript build và Web TypeScript/Vite production build PASS. `git diff --check` PASS.

### Cùng chốt B

- [x] A-side Project contract cho phép Enterprise khai báo `requiresInterview`; cờ được truyền qua public project DTO.
- [x] B-side Mentor review/interview/decision API và route UI được tích hợp.
- [x] Assignment một primary Mentor, thay assignment có history; role và project scope được kiểm tra server-side.
- [x] Candidate profile/review data chỉ trả cho Mentor đang phụ trách; private notes không xuất hiện trong Talent application endpoint.
- [ ] Chưa có assignment UI cho Lab Admin; thao tác assignment dùng API.
- [ ] Chưa có lịch phỏng vấn, rubric điểm số, Mentor invitation/accept lifecycle (D12), PostgreSQL persistence, migration execution hoặc staging.

## Phần A — Yêu cầu đổi phạm vi/hủy dự án và phê duyệt Lab Admin

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS)
> **Giai đoạn:** Giai đoạn 2 — Vòng đời Dự án, Tuyển chọn & Khung Tài chính (Ngày D11 / Mở đầu Sprint 2: D11–D20)
> **Đầu vào:** Cổng nghiệm thu MVP Gate D10 (`daily/day10.md`), Quy tắc nghiệp vụ `DEC-A04` (`Q-A04` tại `day1.md`–`day3.md`).
> **Đầu ra:** Migration `005_a_project_change_requests.sql`, API & Service cho `REQ-ENT-03` và `REQ-LAB-02`, Giao diện quản lý yêu cầu Đổi phạm vi / Hủy dự án trên `EnterpriseProposalPage.tsx` và `LabReviewQueuePage.tsx`, cùng bộ kiểm thử E2E `d11-scope-change-cancel.e2e-spec.ts` (`TC-CHG-01`, `TC-CHG-02`, `TC-CHG-03`) Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D11 (Của Sinh viên A)

| Mã Req / Quyết định | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-ENT-03**<br>**DEC-A04** | Thiết kế Migration `005_a_project_change_requests.sql` (`change_request_type`, `change_request_status`, bảng `project_change_requests`) | `apps/api/src/database/migrations/005_a_project_change_requests.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **REQ-ENT-03** *(Backend API)* | Xây dựng API cho Doanh nghiệp gửi yêu cầu `SCOPE_CHANGE` / `CANCEL`, kiểm tra trạng thái dự án hợp lệ, chặn gửi trùng khi đang `PENDING_APPROVAL`, và tự rút yêu cầu (`WITHDRAWN`) | `apps/api/src/projects/project-proposal.types.ts`<br>`apps/api/src/projects/project-proposal.repository.ts`<br>`apps/api/src/projects/projects.service.ts`<br>`apps/api/src/projects/projects.controller.ts` | **Hoàn thành (100%)** | Pass E2E `TC-CHG-01` & `TC-CHG-03` |
| **REQ-LAB-02** *(Backend API)* | Xây dựng API cho Lab Admin xem hàng đợi `change-requests`, kích hoạt dự án sang `IN_PROGRESS`, Phê duyệt (`APPROVED` — tự động cập nhật phạm vi/ngân sách hoặc chuyển dự án sang `CANCELLED` kèm ghi chú quyết toán) và Từ chối (`REJECTED`) + ghi Audit Trail | `apps/api/src/lab-admin/lab-admin.types.ts`<br>`apps/api/src/lab-admin/lab-admin.service.ts`<br>`apps/api/src/lab-admin/lab-admin.controller.ts` | **Hoàn thành (100%)** | Pass E2E `TC-CHG-01`, `TC-CHG-02`, `TC-CHG-03` |
| **REQ-ENT-03**<br>**REQ-LAB-02** *(Frontend Web)* | Bổ sung Form gửi/rút yêu cầu Đổi phạm vi & Hủy dự án trên `EnterpriseProposalPage.tsx` và Bảng phê duyệt trên `LabReviewQueuePage.tsx` (không ảnh hưởng tới các trang của Sinh viên B) | `apps/web/src/features/enterprise/EnterpriseProposalPage.tsx`<br>`apps/web/src/features/project-admin/LabReviewQueuePage.tsx` | **Hoàn thành (100%)** | `npm run typecheck --workspace=apps/web` Pass |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D11

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Máy trạng thái (State Machine) | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/projects/:id/change-requests` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Doanh nghiệp sở hữu dự án tạo yêu cầu `SCOPE_CHANGE` (khi dự án `PUBLISHED`/`RECRUITMENT_CLOSED`/`IN_PROGRESS`) hoặc `CANCEL` (khi `APPROVED`/`PUBLISHED`/`RECRUITMENT_CLOSED`/`IN_PROGRESS`). Chặn `409 Conflict` nếu sai trạng thái hoặc đang có yêu cầu chờ duyệt. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `GET /api/v1/projects/change-requests/me` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Lấy danh sách toàn bộ yêu cầu Đổi phạm vi / Hủy dự án của doanh nghiệp đang đăng nhập. | `200 OK` |
| `GET /api/v1/projects/:id/change-requests` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Xem lịch sử yêu cầu thay đổi/hủy của một dự án cụ thể (có kiểm tra quyền sở hữu đối với `ENTERPRISE`). | `200 OK`<br>`403 Forbidden` |
| `POST /api/v1/projects/change-requests/:requestId/withdraw` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Doanh nghiệp tự rút lại yêu cầu khi đang ở trạng thái `PENDING_APPROVAL` (`PENDING_APPROVAL -> WITHDRAWN`). | `200 OK`<br>`409 Conflict` |
| `POST /api/v1/lab-admin/projects/:id/start-progress` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Chuyển dự án từ `PUBLISHED` hoặc `RECRUITMENT_CLOSED` sang `IN_PROGRESS` và lưu Audit Log. | `200 OK`<br>`409 Conflict` |
| `GET /api/v1/lab-admin/change-requests` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Xem hàng đợi toàn bộ yêu cầu Đổi phạm vi / Hủy dự án, hỗ trợ lọc theo `?status=PENDING_APPROVAL`... | `200 OK`<br>`403 Forbidden` |
| `POST /api/v1/lab-admin/change-requests/:id/approve` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Phê duyệt yêu cầu: nếu `SCOPE_CHANGE` thì cập nhật `deliverables`/`budgetAmount`/`durationWeeks`/`maxTeamSize`; nếu `CANCEL` thì chuyển dự án sang `CANCELLED` kèm ghi chú quyết toán tài chính. | `200 OK`<br>`409 Conflict` |
| `POST /api/v1/lab-admin/change-requests/:id/reject` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Từ chối yêu cầu (`PENDING_APPROVAL -> REJECTED`) kèm `reviewNote >= 10 ký tự`; giữ nguyên trạng thái dự án. | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D11 (`TC-CHG-01`, `TC-CHG-02`, `TC-CHG-03`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **TC-CHG-01** | *Given* Dự án đang ở `DRAFT` thì chặn `409 Conflict`; *When* dự án chuyển sang `IN_PROGRESS`, Doanh nghiệp gửi `SCOPE_CHANGE` (rút lại lần 1 `WITHDRAWN`, gửi lại lần 2) và Lab Admin bấm `approve`, *Then* ngân sách & thời lượng dự án tự động cập nhật theo đề xuất mới. | `200 OK` + Cập nhật phạm vi & Audit Log | **PASS** |
| **TC-CHG-02** | *Given* Dự án đang `IN_PROGRESS`, *When* Doanh nghiệp gửi yêu cầu `CANCEL` lần 1 bị Lab Admin `reject` (dự án giữ nguyên `IN_PROGRESS`), sau đó gửi lần 2 và được Lab Admin `approve` kèm ghi chú quyết toán, *Then* dự án chuyển sang `CANCELLED` và khóa nhận đơn. | `200 OK` + `project.status === 'CANCELLED'` | **PASS** |
| **TC-CHG-03** | *Given* Doanh nghiệp B hoặc `TALENT` cố tình gọi API tạo yêu cầu hủy dự án của Doanh nghiệp A hoặc gọi API phê duyệt của `LAB_ADMIN`, *Then* hệ thống từ chối truy cập. | `403 Forbidden` | **PASS** |

## Cùng chốt D11 — A + B

- [x] A-side change/cancel request, Lab review API/UI và audit tests được thêm vào slice D11.
- [x] A-side Project contract cho phép Enterprise khai báo `requiresInterview`; cờ được truyền qua public project DTO.
- [x] B-side Mentor review/interview/decision API và route UI được tích hợp.
- [x] Assignment một primary Mentor, thay assignment có history; role và project scope được kiểm tra server-side.
- [x] Candidate profile/review data chỉ trả cho Mentor đang phụ trách; private notes không xuất hiện trong Talent application endpoint.
- [ ] Chưa có assignment UI cho Lab Admin; thao tác assignment dùng API.
- [ ] Chưa có lịch phỏng vấn, rubric điểm số, Mentor invitation/accept lifecycle (D12), PostgreSQL persistence, migration execution hoặc staging.

**Kết luận D11:** Cả hai lát cắt D11 đã được gộp ở mức source/API/UI và test. Mentor review có E2E evidence; change/cancel tests được ghi nhận trong bộ test D11. Dữ liệu runtime hiện vẫn in-memory, các migration chưa chạy; do đó chưa nghiệm thu persistence PostgreSQL/staging. Mentor invitation/acceptance thuộc D12.
