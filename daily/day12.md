# Ngày D12 — Cột mốc Ký quỹ PayOS, Nghiệm thu Bàn giao (`IN_PROGRESS -> COMPLETED`), Sổ cái Bất biến & Chia Doanh thu Tự động 70/20/10 (`REQ-FIN-01`, `REQ-FIN-02`, `REQ-FIN-03`, `REQ-LAB-02`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS) phối hợp đồng bộ với Sinh viên B (`TalentModule`, `ApplicationsModule`, `MentorReview`)  
> **Giai đoạn:** Giai đoạn 2 — Mentor, Vận hành Dự án & Tài chính Ký quỹ (Ngày D12 / Sprint 2: D11–D16)  
> **Đầu vào:** Luồng Thay đổi phạm vi & Hủy dự án (`REQ-ENT-03` ở D11 của Sinh viên A), Luồng Mentor xét duyệt ứng tuyển & phỏng vấn (`005_b_mentor_reviews.sql`, `mentor-review.e2e-spec.ts` của Sinh viên B), và Spike PayOS Sandbox (`004_a_payos_webhook_spike.sql` ở D9).  
> **Đầu ra:** Migration `006_a_project_milestones_and_ledger.sql`, `FinanceEscrowService` & `FinanceEscrowController` (`apps/api/src/payments/*`), giao diện Sổ cái 70/20/10 trên `PayosSandboxSpikePage.tsx`, Unit Test `finance-escrow.service.spec.ts` và E2E Test `d12-finance-escrow-split.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D12 (Của Sinh viên A)

| Mã Req / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-FIN-01**<br>**REQ-FIN-02** | Thiết kế Migration `006_a_project_milestones_and_ledger.sql` (`project_milestones`, `ledger_entries` chỉ ghi thêm, `disbursements` kiểu số nguyên `BIGINT` VND) | `apps/api/src/database/migrations/006_a_project_milestones_and_ledger.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 & `ADR-04` |
| **REQ-LAB-02**<br>**REQ-FIN-01** | Xây dựng API Khởi tạo cột mốc ký quỹ (`PLANNED`), Xác nhận nạp tiền ký quỹ (`ESCROW_PAID`), ghi bút toán `ESCROW_DEPOSIT` và tự động kích hoạt dự án sang `IN_PROGRESS` | `apps/api/src/payments/finance-escrow.types.ts`<br>`apps/api/src/payments/finance-escrow.service.ts`<br>`apps/api/src/payments/finance-escrow.controller.ts` | **Hoàn thành (100%)** | Pass E2E `TC-FIN-D12-01` |
| **REQ-FIN-03**<br>**DEC-05** | Xây dựng thuật toán Chia doanh thu Tự động **70% Nhóm sinh viên / 20% Mentor / 10% Quỹ Lab** (xử lý phần dư `remainder` cộng vào Quỹ Lab bảo toàn tổng 100%) & Chuyển dự án sang `COMPLETED` khi nghiệm thu | `apps/api/src/payments/finance-escrow.service.ts`<br>`apps/api/src/payments/payments.module.ts` | **Hoàn thành (100%)** | Pass Unit Test `finance-escrow.service.spec.ts` & E2E `TC-FIN-D12-02` |
| **REQ-FIN-03** *(Frontend Web)* | Nâng cấp giao diện `PayosSandboxSpikePage.tsx` hiển thị bảng tính toán & đối soát Sổ cái Phân bổ Doanh thu 70/20/10 | `apps/web/src/features/finance/PayosSandboxSpikePage.tsx` | **Hoàn thành (100%)** | `npm run typecheck --workspace=apps/web` Pass |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D12

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Bất biến Sổ cái | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/payments/milestones` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Tạo cột mốc nghiệm thu & ký quỹ cho dự án (`status = PLANNED`), kiểm tra số tiền nguyên dương VND (`BIGINT`). | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `POST /api/v1/payments/milestones/:id/confirm-escrow` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Xác nhận tiền ký quỹ đã nạp (`PLANNED -> ESCROW_PAID`), ghi bút toán `ESCROW_DEPOSIT` (`CREDIT`) và tự động chuyển dự án sang `IN_PROGRESS`. | `200 OK`<br>`403 Forbidden`<br>`409 Conflict` |
| `POST /api/v1/payments/milestones/:id/submit-deliverable` | `JwtAuthGuard`, `RolesGuard`, `@Roles(TALENT, TALENT_LEADER, MENTOR, LAB_ADMIN)` | Nhóm sinh viên hoặc Mentor nộp đường dẫn sản phẩm bàn giao (`ESCROW_PAID -> SUBMITTED`). | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |
| `POST /api/v1/payments/milestones/:id/accept-and-split` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Nghiệm thu cột mốc (`SUBMITTED -> DISBURSED`), tự động sinh 3 bút toán `SPLIT_TEAM_70`, `SPLIT_MENTOR_20`, `SPLIT_LAB_10` và chuyển dự án sang `COMPLETED` nếu hoàn tất. | `200 OK`<br>`403 Forbidden`<br>`409 Conflict` |
| `GET /api/v1/payments/projects/:projectId/ledger` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN, MENTOR, TALENT_LEADER)` | Tra cứu sổ cái bất biến, số dư ký quỹ (`escrowBalance`) và lịch sử giải ngân 70/20/10 của dự án. Chặn `403` nếu Doanh nghiệp khác cố truy cập. | `200 OK`<br>`403 Forbidden`<br>`404 Not Found` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D12 (`finance-escrow.service.spec.ts` & `d12-finance-escrow-split.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-FIN-01** | *Given* Số tiền cột mốc chẵn `100,000,000` VND hoặc lẻ `10,000,003` VND, *When* gọi `calculateRevenueSplit`, *Then* phần dư `1` VND được cộng vào `LAB_FUND` (10%) và tổng `70% + 20% + 10%` khớp tuyệt đối 100%. | `invariantHold === true` | **PASS** |
| **TC-FIN-D12-01** | *Given* Dự án đã được duyệt, *When* Doanh nghiệp tạo cột mốc và xác nhận ký quỹ (`confirm-escrow`), *Then* cột mốc chuyển sang `ESCROW_PAID`, sổ cái ghi `ESCROW_DEPOSIT` và dự án chuyển sang `IN_PROGRESS`. | `200 OK` + `projectStatus === 'IN_PROGRESS'` | **PASS** |
| **TC-FIN-D12-02** | *Given* Nhóm trưởng nộp bàn giao (`SUBMITTED`), *When* Doanh nghiệp bấm `accept-and-split` kèm `markProjectCompleted: true`, *Then* hệ thống tạo đủ 3 khoản giải ngân `7,000,002` / `2,000,000` / `1,000,001` VND, số dư ký quỹ về `0` và dự án sang `COMPLETED`. | `200 OK` + `escrowBalance === 0` + `COMPLETED` | **PASS** |
| **TC-FIN-D12-03** | *Given* Tài khoản `TALENT_LEADER` cố gọi `accept-and-split` hoặc Doanh nghiệp B cố gọi `GET /ledger` của Doanh nghiệp A, *Then* hệ thống từ chối truy cập. | `403 Forbidden` | **PASS** |