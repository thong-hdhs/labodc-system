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

---

# Phần Báo cáo Ngày D15 của Sinh viên A — Giám sát Tiến độ Thực thi Dự án (`IN_PROGRESS`) & Biên bản Quyết toán Sổ cái 70/20/10 (`REQ-LAB-02`, `REQ-FIN-02`, `REQ-FIN-03`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS) phối hợp đồng bộ với Sinh viên B (`TalentModule`, `ApplicationsModule`, `TeamsModule`, `TasksModule`)  
> **Giai đoạn:** Giai đoạn 2 — Mentor, Vận hành Dự án & Tài chính Ký quỹ (Ngày D15 / Sprint 2: D11–D16)  
> **Đầu vào:** Module Quản trị Hệ thống & Kiểm toán Sprint 2 (`008_a_system_governance_and_sprint2_audit.sql` ở D14 của Sinh viên A) và Module Quản lý Nhóm & Công việc (`009_b_team_formation.sql`, `010_b_task_template_setup.sql`, `011_b_task_assignment_and_submissions.sql` của Sinh viên B).  
> **Đầu ra:** Migration `012_a_project_execution_and_settlement_statements.sql`, `ProjectSettlementService` & `ProjectSettlementController` (`apps/api/src/payments/*`), Giao diện `ProjectSettlementPanel.tsx`, Unit Test `project-settlement.service.spec.ts` và E2E Test `d15-project-execution-settlement.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D15 (Của Sinh viên A)

| Mã Req / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-LAB-02**<br>**REQ-FIN-03** | Thiết kế Migration `012_a_project_execution_and_settlement_statements.sql` (`project_progress_reports`, `project_settlement_certificates`) | `apps/api/src/database/migrations/012_a_project_execution_and_settlement_statements.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **REQ-LAB-02** *(Progress Monitoring)* | Xây dựng API Nộp báo cáo tiến độ thực thi dự án theo tuần (`POST /api/v1/payments/progress-reports`) và Đánh giá / Cảnh báo rủi ro tiến độ (`POST /api/v1/payments/progress-reports/:reportId/review`) | `apps/api/src/payments/project-settlement.types.ts`<br>`apps/api/src/payments/project-settlement.service.ts`<br>`apps/api/src/payments/project-settlement.controller.ts` | **Hoàn thành (100%)** | Pass Unit Test `project-settlement.service.spec.ts` & E2E `TC-EXEC-D15-01` |
| **REQ-FIN-02**<br>**REQ-FIN-03** | Xây dựng API Xuất Biên bản Quyết toán & Sao kê Thù lao 70/20/10 (`GET /api/v1/payments/projects/:projectId/settlement-certificate`) và Component `ProjectSettlementPanel.tsx` | `apps/api/src/payments/payments.module.ts`<br>`apps/web/src/features/finance/ProjectSettlementPanel.tsx` | **Hoàn thành (100%)** | Pass E2E `TC-EXEC-D15-02` & `npm run typecheck` |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D15 (Của Sinh viên A)

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Kiểm soát | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/payments/progress-reports` | `JwtAuthGuard`, `RolesGuard`, `@Roles(TALENT, TALENT_LEADER, MENTOR, LAB_ADMIN)` | Nộp báo cáo tiến độ tuần (`reportingWeek`, `completionPercentage`, `healthStatus: ON_TRACK / AT_RISK / DELAYED`, `summary >= 15 ký tự`) và ghi Audit Log. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `POST /api/v1/payments/progress-reports/:reportId/review` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN, ENTERPRISE)` | Lab Admin hoặc Doanh nghiệp sở hữu dự án thẩm định báo cáo tiến độ (`REVIEWED_OK` hoặc `FLAGGED_ACTION_REQUIRED` kèm `reviewNote >= 10 ký tự`). | `200 OK`<br>`400 Bad Request`<br>`403 Forbidden` |
| `GET /api/v1/payments/projects/:projectId/progress-reports` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN, MENTOR, TALENT_LEADER, TALENT)` | Tra cứu danh sách báo cáo tiến độ của dự án; chặn `403 Forbidden` nếu Doanh nghiệp khác cố xem trái phép. | `200 OK`<br>`403 Forbidden`<br>`404 Not Found` |
| `GET /api/v1/payments/projects/:projectId/settlement-certificate` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN, MENTOR, TALENT_LEADER)` | Xuất Biên bản Quyết toán dự án (`SETTLE-ODC-2026-xxx`), đối soát tổng nạp ký quỹ, tổng hoàn trả, sao kê 70% SV / 20% Mentor / 10% Lab và trạng thái `isFullySettled`. | `200 OK`<br>`403 Forbidden`<br>`404 Not Found` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D15 (`project-settlement.service.spec.ts` & `d15-project-execution-settlement.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-EXEC-01** | *Given* Doanh nghiệp cố tự nộp báo cáo tiến độ của sinh viên hoặc `summary < 15 ký tự`, *Then* hệ thống chặn `403 Forbidden` / `400 Bad Request`. | `403 Forbidden` / `400 Bad Request` | **PASS** |
| **TC-EXEC-D15-01** | *Given* Dự án đang `IN_PROGRESS`, *When* Sinh viên nộp báo cáo Tuần 1 (`50%`, `AT_RISK`) và Lab Admin đánh giá `FLAGGED_ACTION_REQUIRED`, sau đó nộp Tuần 2 (`100%`, `ON_TRACK`) được duyệt `REVIEWED_OK`, *Then* lưu vết đầy đủ tiến độ. | `200 OK` + Ghi nhận lịch sử đánh giá | **PASS** |
| **TC-EXEC-D15-02** | *Given* Cột mốc `30,000,003` VND đã nghiệm thu giải ngân 70/20/10 và dự án `COMPLETED`, *When* gọi `GET /settlement-certificate`, *Then* `isFullySettled === true`, `splitInvariantHold === true` (`21,000,002` / `6,000,000` / `3,000,001` VND). | `200 OK` + Quyết toán khớp 100% | **PASS** |
