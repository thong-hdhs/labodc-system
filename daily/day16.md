# Ngày D16 — Nộp đầu ra, phiên bản và Mentor review (`REQ-TAL-04`, `REQ-OPS-01`, `REQ-REP-01`)

> **Người phụ trách:** Sinh viên B — nộp đầu ra Task/Milestone, lịch sử phiên bản và review UI/API; A sở hữu Auth/RBAC identity source và payment/webhook.
> **Giai đoạn:** Giai đoạn 2 — Vận hành dự án (Sprint 2: D11–D16).
> **Đầu vào:** Task assignment D15; template ID/version D14; state machine đã chốt.
> **Đầu ra:** Assignee nộp nội dung đầu ra có version và template version; Mentor được phân công duyệt hoàn thành hoặc yêu cầu chỉnh sửa; có lịch sử trạng thái và bản nộp.

## 1. State machine và giới hạn dữ liệu

`PLANNED -> ASSIGNED -> IN_PROGRESS -> SUBMITTED_FOR_REVIEW -> COMPLETED`; Mentor có thể chuyển `SUBMITTED_FOR_REVIEW -> CHANGES_REQUESTED`, sau đó assignee tiếp tục `CHANGES_REQUESTED -> IN_PROGRESS`. Với assignment cá nhân, chỉ assignee có quyền nộp; với assignment Team, bất kỳ thành viên Team nào cũng có thể bắt đầu/nộp thay mặt nhóm. Hủy chỉ cho Mentor và các state được policy cho phép: `PLANNED`, `ASSIGNED`, `IN_PROGRESS`.

Mỗi lần nộp tạo submission bất biến với version tăng dần, nội dung, actor, timestamp và template version của Task/Milestone. Server từ chối nội dung rỗng/quá giới hạn, version template không khớp, người nộp không phải assignee và transition sai state. Bản nộp hiện là nội dung văn bản; upload/download tệp nhị phân thuộc D19 theo phân công, không dựng URL lưu trữ giả.

## 2. API D16

| Phương thức & Endpoint | Quyền | Hành vi |
|---|---|---|
| `POST /api/v1/talent/tasks/:taskId/submissions` | Assignee hoặc thành viên Team được giao | Nộp nội dung Task; yêu cầu `templateVersion` khớp version đã gắn với Task. |
| `POST /api/v1/talent/tasks/:taskId/milestones/:milestoneId/submissions` | Assignee hoặc thành viên Team được giao | Nộp nội dung Milestone theo template version của Milestone. |
| `POST /api/v1/mentor/tasks/:taskId/review` | Mentor được phân công | `APPROVE`, `REQUEST_CHANGES` hoặc `CANCEL` theo state; note bắt buộc khi sửa/hủy. |
| `POST /api/v1/mentor/tasks/:taskId/milestones/:milestoneId/review` | Mentor được phân công | Review đầu ra Milestone và audit transition tương ứng. |
| `GET /api/v1/talent/me/tasks` | Thành viên Team | Đọc Task/Milestone, các phiên bản đầu ra và lịch sử trong Team mình. |
| `GET /api/v1/mentor/projects/:projectId/tasks` | Mentor được phân công | Đọc Task/Milestone và các submission thuộc Project được giao. |

## 3. Giao diện

- Mentor: [MentorTeamsPage.tsx](../apps/web/src/features/mentor/MentorTeamsPage.tsx) hiển thị assignee, nội dung từng version, lịch sử trạng thái, duyệt hoặc yêu cầu sửa.
- Talent/Leader: [TalentTeamTasksPage.tsx](../apps/web/src/features/talent/TalentTeamTasksPage.tsx) cho Leader giao việc theo Team; assignee bắt đầu, nộp nội dung và xem lịch sử.
- Không cung cấp luồng upload file trong D16; bước tích hợp file thuộc D19.

## 4. Kiểm thử và cùng chốt D16

`d13-d14-team-task-setup.e2e-spec.ts` kiểm tra:

- Không nộp trước khi bắt đầu; member khác bị từ chối với assignment cá nhân; member ngoài Team bị từ chối với assignment Team; không thuộc scope Mentor không review được.
- Thành viên Team nộp thay mặt nhóm được khi assignmentType là `TEAM`.
- Nộp rỗng hoặc sai template version bị từ chối.
- `REQUEST_CHANGES` bắt buộc note; assignee tiếp tục và nộp bản v2; Mentor duyệt thành `COMPLETED`.
- Milestone cũng có assignment, submission version và review state.
- Audit thể hiện đầy đủ các transition theo thứ tự.

Kết quả: **2/2 D16 E2E cases PASS**. Kiểm chứng lần cuối: API build thành công, Web build thành công, API suite **21/21 suites, 59/59 tests PASS**, `git diff --check` sạch.

## 5. Cùng chốt D16 (A + B)

- [x] B quản lý workflow/task submission; không ghi ledger hoặc xử lý giao dịch của A.
- [x] Mỗi submission lưu template version được giao và version bản nộp tăng dần; không ghi đè lịch sử bản trước.
- [x] Mentor review bị giới hạn theo assignment; Talent bị giới hạn theo assignee/Team.
- [x] D16 lưu nội dung văn bản; file upload/download và policy lưu trữ được để cho D19.
- [x] `011_b_task_assignment_and_submissions.sql` là migration draft; chưa triển khai PostgreSQL persistence.
