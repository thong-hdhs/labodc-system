# Ngày D11 — Mentor xét duyệt và phỏng vấn ứng viên (`REQ-MEN-02`, Sinh viên B)

> **Phân công:** B sở hữu Mentor review/Application review API và Mentor UI. Project interview requirement là shared Project contract; B đã nối checkbox/API và migration bổ sung có phối hợp trên miền Project của A.
> **Nguồn:** [07-phan-cong-tung-ngay.md](../implementation-plan/07-phan-cong-tung-ngay.md), D11; quyết định/state baseline ở [day2.md](./day2.md) và [day3.md](./day3.md).
> **Trạng thái persistence:** runtime Application, assignment và review event còn in-memory; SQL là migration draft, chưa được áp dụng bởi migration runner.

## 1. Quyết định nghiệp vụ đã chốt cho D11

| Chủ đề | Quyết định |
|---|---|
| Mentor assignment | Mỗi project có **một Mentor phụ trách chính tại một thời điểm**. Lab Admin/System Admin gán hoặc đổi Mentor qua API; lịch sử assignment lưu lại. Chỉ Mentor hiện tại được gán mới xem/xử lý đơn. |
| Cấu hình phỏng vấn | Doanh nghiệp chọn `requiresInterview` trong proposal draft. Mặc định `false`; field được giữ trong Project public read contract. |
| Phạm vi interview | Không lập lịch hoặc lưu link/địa điểm. Mentor ghi kết quả `PASS`/`FAIL` và ghi chú nội bộ, không có điểm rubric ở D11. |
| State và quyết định | `SUBMITTED -> UNDER_REVIEW`; project yêu cầu interview thì bắt buộc ghi kết quả để chuyển `INTERVIEW` trước `ACCEPTED`/`REJECTED`. Nếu không yêu cầu, Mentor quyết định từ `UNDER_REVIEW`. Mentor là người quyết định cuối theo project assignment. |
| Quyền riêng tư | Mentor được gán xem candidate identity/profile và review events. Candidate chỉ xem trạng thái/history ứng tuyển; không nhận `reviewEvents`, interview outcome note hoặc decision note. Enterprise không có endpoint xem application review notes. |

Chi tiết tiêu chí định tính có thể được PO/Mentor bổ sung sau; D11 không suy diễn thành thang điểm.

## 2. Đầu ra thực hiện

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

## 3. Schema/migration

- **A/shared Project contract:** `apps/api/src/database/migrations/005_a_project_interview_requirement.sql` thêm `projects.requires_interview BOOLEAN NOT NULL DEFAULT FALSE`.
- **B:** `apps/api/src/database/migrations/005_b_mentor_reviews.sql` định nghĩa `project_mentor_assignments`, `mentor_assignment_history` và `application_review_events` với trạng thái/kết quả/ghi chú.
- Migration files chưa chạy trên database; không coi đây là persistence đã nghiệm thu. Migration runner, Auth base schema và PostgreSQL integration test còn là blocker từ D10.

## 4. Kiểm thử D11

E2E `apps/api/test/mentor-review.e2e-spec.ts` kiểm tra:

| Test | Kịch bản | Kết quả |
|---|---|---|
| `TC-B-MEN-02` | Lab Admin gán Mentor; actor không phải Admin bị từ chối; target không phải Mentor bị từ chối; Mentor ngoài project không thể truy cập/review. | **PASS** |
| `TC-B-MEN-03` | Required interview chặn quyết định sớm; Mentor bắt đầu review, ghi `PASS`, quyết định cuối; non-required project cho phép quyết định trực tiếp và từ chối interview result. | **PASS** |
| `TC-B-MEN-04` | Mentor được gán thấy candidate profile và private review note; Talent chỉ thấy trạng thái, không nhận note/reviewEvents. | **PASS** |

Kiểm thử dùng in-memory Application/assignment repositories và test Talent profile repository; không xác nhận PostgreSQL hoặc migration.

Lần xác minh đầy đủ sau thay đổi D11: API **14/14 suites, 38/38 tests PASS**; API TypeScript build và Web TypeScript/Vite production build PASS. `git diff --check` PASS.

## 5. Cùng chốt D11 — A + B

- [x] A-side Project contract cho phép Enterprise khai báo `requiresInterview`; cờ được truyền qua public project DTO.
- [x] B-side Mentor review/interview/decision API và route UI được tích hợp.
- [x] Assignment một primary Mentor, thay assignment có history; role và project scope được kiểm tra server-side.
- [x] Candidate profile/review data chỉ trả cho Mentor đang phụ trách; private notes không xuất hiện trong Talent application endpoint.
- [ ] Chưa có assignment UI cho Lab Admin; thao tác assignment dùng API.
- [ ] Chưa có lịch phỏng vấn, rubric điểm số, Mentor invitation/accept lifecycle (D12), PostgreSQL persistence, migration execution hoặc staging.

**Kết luận D11:** Mentor review slice hoàn thành và có E2E evidence ở mức local/API. D11 không đóng các blocker persistence/staging của D10; Mentor invitation lifecycle được để đúng phạm vi D12.
