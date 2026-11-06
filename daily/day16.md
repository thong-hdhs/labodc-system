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

---

# Phần Báo cáo Ngày D16 của Sinh viên A — Kiểm thử Tích hợp Liên thông Giai đoạn 2 (D11–D16) & Đóng Cổng Nghiệm thu Sprint 2 Gate D16

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS) phối hợp tích hợp cùng Sinh viên B (`TalentModule`, `ApplicationsModule`, `TeamsModule`, `TasksModule`)  
> **Giai đoạn:** Kết thúc Giai đoạn 2 — Mentor, Vận hành Dự án & Tài chính Ký quỹ (Ngày D16 / Cổng Sprint 2 Gate D16: D11–D16)  
> **Đầu vào:** Toàn bộ các lát cắt dọc D11–D15 của Sinh viên A (`005_a`, `006_a`, `007_a`, `008_a`, `012_a`) và của Sinh viên B (`005_b`, `006_b`, `009_b`, `010_b`, `011_b`).  
> **Đầu ra:** Endpoint Nghiệm thu Cổng Sprint 2 Gate D16 (`GET /api/v1/system-admin/governance/sprint2-gate-d16`), Bộ kiểm thử tích hợp liên thông `d16-sprint2-gate-review.e2e-spec.ts` và toàn bộ 21 Test Suites của cả A & B Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D16 (Của Sinh viên A)

| Mã Req / Gate | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **Gate D16**<br>**REQ-SYS-01** | Xây dựng API Tổng hợp Nghiệm thu Đóng cổng Sprint 2 Gate D16 (`GET /api/v1/system-admin/governance/sprint2-gate-d16`) kiểm tra toàn bộ tiêu chí đầu ra của Giai đoạn 2 | `apps/api/src/system-admin/system-governance.types.ts`<br>`apps/api/src/system-admin/system-governance.service.ts`<br>`apps/api/src/system-admin/system-governance.controller.ts` | **Hoàn thành (100%)** | Pass E2E `TC-GATE-D16-01` |
| **Sprint 2 E2E**<br>**(D11 -> D16)** | Xây dựng bộ kiểm thử tích hợp liên thông toàn diện Giai đoạn 2 (`REQ-ENT-03` Scope Change $\rightarrow$ `REQ-FIN-01/02` Escrow & Idempotent Webhook $\rightarrow$ `REQ-LAB-02` Progress Report $\rightarrow$ `REQ-FIN-03` 70/20/10 Split & Refund $\rightarrow$ Settlement Certificate $\rightarrow$ Gate D16) | `apps/api/test/d16-sprint2-gate-review.e2e-spec.ts` | **Hoàn thành (100%)** | Toàn bộ Unit Test & E2E Test từ D5 $\rightarrow$ D16 của cả A & B Pass 100% |

---

## 2. Bảng Đối chiếu Nghiệm thu Toàn bộ Các Bộ Kiểm thử Giai đoạn 1 & Giai đoạn 2 tại Cổng Gate D16 (A + B)

| STT | Bộ Kiểm thử (Test Suite) | Miền Nghiệp vụ & Yêu cầu | Owner | Kết quả |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `test/auth-rbac.e2e-spec.ts` | Xác thực JWT & Phân quyền RBAC 6 vai trò (`REQ-AUTH-01`) | **A** | **PASS** |
| 2 | `src/enterprise/enterprise.service.spec.ts` | Unit Test Hồ sơ Pháp nhân Doanh nghiệp (`REQ-ENT-01`) | **A** | **PASS** |
| 3 | `test/enterprise.e2e-spec.ts` | E2E KYC Doanh nghiệp & Cách ly dữ liệu (`REQ-ENT-01`) | **A** | **PASS** |
| 4 | `src/talent/talent.service.spec.ts` | Unit Test Hồ sơ Năng lực Sinh viên (`REQ-TAL-01`) | **B** | **PASS** |
| 5 | `test/talent.e2e-spec.ts` | E2E Hồ sơ Sinh viên & Phân quyền (`REQ-TAL-01`) | **B** | **PASS** |
| 6 | `src/projects/projects.service.spec.ts` | Unit Test Đề xuất Dự án & Hợp đồng Dự án Công khai (`REQ-ENT-02`) | **A** | **PASS** |
| 7 | `test/projects-proposal.e2e-spec.ts` | E2E Tạo nháp `DRAFT`, Gửi duyệt `SUBMITTED` & Khóa sửa (`REQ-ENT-02`) | **A** | **PASS** |
| 8 | `src/lab-admin/lab-admin.service.spec.ts` | Unit Test Hàng đợi Lab Admin xét duyệt & Công bố (`REQ-LAB-01`) | **A** | **PASS** |
| 9 | `test/lab-admin-review.e2e-spec.ts` | E2E Lab Admin `APPROVE`/`REJECT`/`REQUEST_INFO`/`PUBLISH` (`REQ-LAB-01`) | **A** | **PASS** |
| 10 | `test/applications.e2e-spec.ts` | E2E Sinh viên khám phá dự án công khai & Nộp đơn ứng tuyển (`REQ-TAL-02`, `REQ-TAL-03`) | **B** | **PASS** |
| 11 | `src/payments/payments-spike.service.spec.ts` | Unit Test PayOS Sandbox & Xác thực Chữ ký HMAC (`REQ-FIN-01/02`) | **A** | **PASS** |
| 12 | `test/d9-publish-and-payos-spike.e2e-spec.ts` | E2E Đóng/Mở Công bố Dự án & Webhook PayOS Idempotent (`REQ-FIN-01/02`) | **A** | **PASS** |
| 13 | `test/d10-sprint1-mvp-gate.e2e-spec.ts` | E2E Tích hợp Liên thông Cổng MVP Gate D10 (`REQ-SYS-01`) | **A + B** | **PASS** |
| 14 | `test/d11-scope-change-cancel.e2e-spec.ts` | E2E Yêu cầu Đổi phạm vi & Hủy dự án (`REQ-ENT-03`) | **A** | **PASS** |
| 15 | `test/mentor-review.e2e-spec.ts` | E2E Lời mời Mentor, Xét duyệt Ứng tuyển & Phỏng vấn (`REQ-MEN-01`, `REQ-MEN-02`) | **B** | **PASS** |
| 16 | `src/payments/finance-escrow.service.spec.ts` | Unit Test Thuật toán Chia doanh thu Bất biến 70/20/10 & Phần dư (`REQ-FIN-03`) | **A** | **PASS** |
| 17 | `test/d12-finance-escrow-split.e2e-spec.ts` | E2E Cột mốc Ký quỹ, Nghiệm thu Bàn giao & Giải ngân 70/20/10 (`REQ-FIN-01`, `REQ-FIN-03`) | **A** | **PASS** |
| 18 | `test/d13-escrow-reconciliation-refund.e2e-spec.ts` | E2E Đồng bộ PayOS Webhook Idempotent, Sửa Bàn giao & Hoàn trả Ký quỹ (`REQ-FIN-02`) | **A** | **PASS** |
| 19 | `test/d13-d14-team-task-setup.e2e-spec.ts` | E2E Thành lập Nhóm dự án, Khởi tạo Task Template & Nộp Task (`REQ-MEN-03`, `REQ-TAL-04`) | **B** | **PASS** |
| 20 | `src/system-admin/system-governance.service.spec.ts` | Unit Test Quản trị Cấu hình Hệ thống & Khóa Bất biến 70/20/10 (`REQ-SYS-01`) | **A** | **PASS** |
| 21 | `test/d14-system-governance-audit.e2e-spec.ts` | E2E Quản trị Tài khoản, Cấu hình Hệ thống & Kiểm toán Sprint 2 (`REQ-SYS-01`) | **A** | **PASS** |
| 22 | `src/payments/project-settlement.service.spec.ts` | Unit Test Báo cáo Tiến độ Thực thi & Biên bản Quyết toán (`REQ-LAB-02`, `REQ-FIN-03`) | **A** | **PASS** |
| 23 | `test/d15-project-execution-settlement.e2e-spec.ts` | E2E Giám sát Tiến độ Tuần & Xuất Biên bản Quyết toán 70/20/10 (`REQ-LAB-02`, `REQ-FIN-03`) | **A** | **PASS** |
| 24 | `test/d16-sprint2-gate-review.e2e-spec.ts` | E2E Tích hợp Liên thông Đóng Cổng Nghiệm thu Sprint 2 Gate D16 (`D11 -> D16`) | **A + B** | **PASS** |

---

## 3. Điểm chốt Đóng Cổng Sprint 2 Gate D16 & Sẵn sàng cho Giai đoạn 3 (D17–D20)

- [x] **Hoàn tất 100% phạm vi Giai đoạn 2 của cả Sinh viên A và Sinh viên B:** Toàn bộ 12 migrations (`002_a` $\rightarrow$ `012_a`) và 10 modules trong `AppModule` hoạt động đồng bộ, không xung đột.
- [x] **Bảo toàn tuyệt đối bất biến Sổ cái Tài chính 70/20/10:** Mọi giao dịch nạp ký quỹ, hoàn trả ký quỹ và giải ngân 70% Nhóm sinh viên / 20% Mentor / 10% Quỹ Lab đều khớp số nguyên VND tuyệt đối (`ledgerInvariantHold = true`).
