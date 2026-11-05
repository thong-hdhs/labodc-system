# Ngày D14 — Quản trị Cấu hình Vận hành Hệ thống, Quản lý Trạng thái Tài khoản, Bảo vệ Bất biến 70/20/10 & Kiểm toán Liên thông Sprint 2 (`REQ-SYS-01`, `REQ-AUTH-01`, `REQ-FIN-03`, `REQ-NFR-03`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS) phối hợp đồng bộ với Sinh viên B (`TalentModule`, `ApplicationsModule`, `MentorInvitation`, `MentorReview`)  
> **Giai đoạn:** Giai đoạn 2 — Mentor, Vận hành Dự án & Tài chính Ký quỹ (Ngày D14 / Sprint 2: D11–D16)  
> **Đầu vào:** Module Đối soát Tự động Ký quỹ PayOS Webhook & Hoàn trả Ký quỹ (`007_a_escrow_reconciliation_and_refunds.sql` ở D13 của Sinh viên A) và `SystemAdminModule` (`system-admin.service.ts` ở D10).  
> **Đầu ra:** Migration `008_a_system_governance_and_sprint2_audit.sql`, `SystemGovernanceService` & `SystemGovernanceController` (`apps/api/src/system-admin/*`), Component `SystemGovernancePanel.tsx`, Unit Test `system-governance.service.spec.ts` và E2E Test `d14-system-governance-audit.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D14 (Của Sinh viên A)

| Mã Req / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-SYS-01** *(DB Migration)* | Thiết kế Migration `008_a_system_governance_and_sprint2_audit.sql` (`system_configurations`, `system_governance_logs`) | `apps/api/src/database/migrations/008_a_system_governance_and_sprint2_audit.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **REQ-SYS-01**<br>**REQ-FIN-03** | Xây dựng API Quản trị cấu hình vận hành hệ thống (`GET/PATCH /api/v1/system-admin/governance/config`) và khóa bất biến tỷ lệ chia doanh thu `70% SV / 20% Mentor / 10% Lab` (`409 Conflict` nếu cố sửa) | `apps/api/src/system-admin/system-governance.types.ts`<br>`apps/api/src/system-admin/system-governance.service.ts`<br>`apps/api/src/system-admin/system-governance.controller.ts` | **Hoàn thành (100%)** | Pass Unit Test `system-governance.service.spec.ts` & E2E `TC-SYS-D14-01` |
| **REQ-AUTH-01**<br>**REQ-NFR-03** | Xây dựng API Khóa / Mở khóa tài khoản người dùng (`POST /api/v1/system-admin/governance/users/:userId/status`), chặn tự khóa `SYSTEM_ADMIN` và lưu vết `system_governance_logs` | `apps/api/src/system-admin/system-governance.service.ts`<br>`apps/api/src/system-admin/system-governance.controller.ts` | **Hoàn thành (100%)** | Pass E2E `TC-SYS-D14-02` |
| **REQ-SYS-01**<br>**REQ-LAB-02** | Xây dựng Báo cáo Kiểm toán Liên thông Sprint 2 (`GET /api/v1/system-admin/governance/sprint2-readiness`) và Component `SystemGovernancePanel.tsx` | `apps/api/src/system-admin/system-admin.module.ts`<br>`apps/web/src/features/system-admin/SystemGovernancePanel.tsx` | **Hoàn thành (100%)** | Pass E2E `TC-SYS-D14-02` & `npm run typecheck` |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D14

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Quản trị Hệ thống | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/system-admin/governance/config` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Xem cấu hình vận hành hệ thống và chính sách chia doanh thu bất biến 70/20/10. | `200 OK`<br>`403 Forbidden` |
| `PATCH /api/v1/system-admin/governance/config` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN)` | Cập nhật tham số vận hành hệ thống; chặn `409 Conflict` (`IMMUTABLE_REVENUE_SPLIT_POLICY`) nếu cố thay đổi tỷ lệ 70/20/10. | `200 OK`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `POST /api/v1/system-admin/governance/users/:userId/status` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN)` | Khóa (`LOCKED`) hoặc mở khóa (`ACTIVE`) tài khoản người dùng kèm lý do bắt buộc; chặn tự khóa `SYSTEM_ADMIN`. | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |
| `GET /api/v1/system-admin/governance/logs` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN)` | Tra cứu toàn bộ nhật ký quản trị cấu hình và khóa/mở tài khoản (`system_governance_logs`). | `200 OK`<br>`403 Forbidden` |
| `GET /api/v1/system-admin/governance/sprint2-readiness` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Tổng hợp báo cáo kiểm toán liên thông Vòng đời Dự án, Cột mốc Ký quỹ và Bất biến Sổ cái 70/20/10 trong Sprint 2. | `200 OK`<br>`403 Forbidden` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D14 (`system-governance.service.spec.ts` & `d14-system-governance-audit.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-SYS-01** | *Given* `SYSTEM_ADMIN` gọi `updateRuntimeConfig` với tỷ lệ khác `70/20/10` hoặc tự khóa tài khoản của chính mình, *Then* hệ thống ném ngoại lệ `ConflictException`. | `409 Conflict` | **PASS** |
| **TC-SYS-D14-01** | *Given* `ENTERPRISE` hoặc `LAB_ADMIN` gọi `PATCH /governance/config`, *Then* bị chặn `403 Forbidden`; *When* `SYSTEM_ADMIN` cập nhật khung tuần dự án `6–20 tuần`, *Then* thành công và ghi Audit Log. | `200 OK` + Ghi nhận Audit Log | **PASS** |
| **TC-SYS-D14-02** | *Given* Luồng dự án D14 hoàn tất ký quỹ, bàn giao và giải ngân `10,000,003` VND, *When* gọi `GET /governance/sprint2-readiness`, *Then* `ledgerInvariantHold === true`, `completed === 1` và `governanceAuditCount === 3`. | `200 OK` + Đối soát khớp 100% | **PASS** |

---

## 4. Phần Sinh viên B — Template metadata và lập kế hoạch Task/Milestone (`REQ-OPS-01..02`)

> **Phân công:** B sở hữu luồng sử dụng template, tạo kế hoạch Task/Milestone và màn hình Mentor/Talent; System Admin và template catalog governance ở phần A vẫn nguyên trạng.
> **Quyết định:** Chỉ Mentor được phân công xem/chọn template. Hiện chỉ có metadata demo version `1.0.0-demo` với trạng thái `DEMO/NOT_APPROVED`; không giả lập file Lab chính thức. API không trả URL/credential; `fileReference` hiện null. Chỉ tích hợp file thật sau khi Lab cung cấp.
> **Task scope:** D14 chỉ tạo Task/Milestone ở `PLANNED`, chưa gán người thực hiện; việc giao Task thuộc D15. Task chỉ hiển thị cho Mentor phụ trách và thành viên Team.
> **Persistence:** Task/Template runtime đang in-memory; `010_b_task_template_setup.sql` là migration draft, chưa chạy trên PostgreSQL.

### API và quyền truy cập

| Endpoint | Quyền | Hành vi |
|---|---|---|
| `GET /api/v1/mentor/projects/:projectId/templates` | Mentor được phân công | Trả metadata version/kind/approval/required fields; không có URL/file download. |
| `GET /api/v1/mentor/projects/:projectId/tasks` | Mentor được phân công | Chỉ trả Task của Team thuộc Project đó. |
| `POST /api/v1/mentor/projects/:projectId/tasks` | Mentor được phân công | Tạo Task `PLANNED`, gắn template ID/version hợp lệ, không gán assignee. Team cần ở `ACTIVE`. |
| `POST /api/v1/mentor/tasks/:taskId/milestones` | Mentor được phân công | Tạo Milestone `PLANNED` với template/version loại Milestone chính xác. |
| `GET /api/v1/talent/me/tasks` | Talent/Talent Leader | Chỉ trả kế hoạch của Team mà người dùng thuộc về. |

Các template seed demo: `TASK-PLAN@1.0.0-demo` và `MILESTONE-PLAN@1.0.0-demo`. Backend kiểm tra chính xác template ID, kind và version; version không tồn tại/bị cũ bị từ chối. State type được khai báo theo D3, nhưng chuyển trạng thái/giao việc không thuộc D14 và chưa được mở ở API này.

### Kiểm thử D14 B

`d13-d14-team-task-setup.e2e-spec.ts` kiểm tra Mentor scope, metadata demo và không có file URL/credential, template version sai bị từ chối, Task/Milestone được lưu đúng version ở `PLANNED`, assignee rỗng và thành viên Team đọc được đúng Task. Kết quả toàn file: **4/4 E2E cases PASS**; riêng luồng D14 nằm trong case Task/Template cuối.

## 5. Cùng chốt D14 (A + B)

- [x] Giữ nguyên System Governance/Finance của A; B chỉ sử dụng template catalog qua metadata contract.
- [x] Không phát hành hoặc mô tả file demo như template chính thức; không có API download URL/credential.
- [x] Task/Milestone được tạo `PLANNED`; phần assignment và chuyển trạng thái được để cho D15 trở đi.
- [x] Kiểm tra backend scope theo Mentor assignment và Team membership.