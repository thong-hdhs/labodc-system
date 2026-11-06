# Ngày D15 — Giao Task/Milestone cho Team (`REQ-TAL-04`, `REQ-OPS-01`)

> **Người phụ trách:** Sinh viên B — API assignment và Mentor/Leader UI; A sở hữu Auth/RBAC identity source.
> **Giai đoạn:** Giai đoạn 2 — Vận hành dự án (Sprint 2: D11–D16).
> **Đầu vào:** Team/Leader D13, Task/Template D14, Project/Mentor assignment contract.
> **Đầu ra:** Giao Task/Milestone cho cá nhân hoặc cả Team, chuyển trạng thái `PLANNED -> ASSIGNED`; phạm vi quyền của người thực hiện phụ thuộc loại assignment. Có kiểm soát vai trò/phạm vi và audit history.

## 1. Quy tắc thực hiện

- Người dùng chốt hỗ trợ cả assignment cá nhân và assignment Team.
- Mentor được phân công hoặc Leader hiện tại có thể giao cho một thành viên thuộc Team hoặc giao cho toàn Team.
- Với assignment cá nhân, chỉ assignee bắt đầu/nộp. Với assignment Team, mọi thành viên Team có thể bắt đầu/nộp.
- Không thể giao cho người ngoài Team, giao lại một Task/Milestone đã được phân công hoặc sửa việc sau khi đã sang trạng thái khác `PLANNED`.
- Trạng thái `CHANGES_REQUESTED` cho phép đúng assignee (cá nhân) hoặc một thành viên Team (assignment Team) tiếp tục chỉnh sửa về `IN_PROGRESS`.
- Kiểm tra quyền thực hiện ở backend; không tin role hoặc Team ID do Client gửi.
- Mọi thay đổi trạng thái lưu actor, thời gian, trạng thái trước/sau và action history.

## 2. API D15

| Phương thức & Endpoint | Quyền | Hành vi |
|---|---|---|
| `POST /api/v1/mentor/tasks/:taskId/assignment` | Mentor được phân công | Nhận `assignmentType=INDIVIDUAL` + `userId`, hoặc `assignmentType=TEAM`; `PLANNED -> ASSIGNED`. |
| `POST /api/v1/talent/me/team/tasks/:taskId/assignment` | Talent/Talent Leader đang là Leader của Team | Leader có thể giao cho member cụ thể hoặc toàn Team. |
| `POST /api/v1/mentor/tasks/:taskId/milestones/:milestoneId/assignment` | Mentor được phân công | Giao Milestone cho member cụ thể hoặc toàn Team. |
| `POST /api/v1/talent/me/team/tasks/:taskId/milestones/:milestoneId/assignment` | Leader hiện tại | Giao Milestone trong Team cho member hoặc toàn Team. |
| `POST /api/v1/talent/tasks/:taskId/start` | Assignee cá nhân hoặc thành viên Team được giao | Bắt đầu hoặc tiếp tục chỉnh sửa Task. |
| `POST /api/v1/talent/tasks/:taskId/milestones/:milestoneId/start` | Assignee cá nhân hoặc thành viên Team được giao | Bắt đầu hoặc tiếp tục chỉnh sửa Milestone. |

## 3. Kiểm thử D15

`d13-d14-team-task-setup.e2e-spec.ts` xác minh:

- Assignee phải là thành viên Team; giao cho người ngoài bị từ chối.
- Mentor không được phân công không có quyền trên Task.
- Leader hiện tại giao được việc; Talent member không thể dùng endpoint của Leader.
- Cả assignment cá nhân và assignment Team được ghi nhận rõ; TEAM không gắn userId cá nhân.
- Giao lần hai bị từ chối; lịch sử ghi trạng thái và actor chính xác.
- Milestone assignment có cùng giới hạn Team.

Kết quả: **D15 E2E case PASS**. Bộ API đầy đủ tại lần chạy cuối: **21/21 suites, 59/59 tests PASS**.

## 4. Cùng chốt D15 (A + B)

- [x] Chỉ giao việc cho thành viên Team và chỉ Mentor được phân công/Leader hiện tại thực hiện.
- [x] Assignment tạo state history; không dùng client redirect hay thông tin client gửi làm nguồn phân quyền.
- [x] Mỗi Task/Milestone chỉ giao một lần trong trạng thái `PLANNED`; thay đổi workflow phải qua transition nghiệp vụ.
- [x] Runtime repository vẫn in-memory; schema persistence draft được bổ sung trong migration `011_b_task_assignment_and_submissions.sql`, chưa chạy trên PostgreSQL.
