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