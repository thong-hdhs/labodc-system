# Ngày D13 — Đối soát Tự động Ký quỹ PayOS Webhook (Idempotent Ledger), Yêu cầu Sửa lại Bàn giao Cột mốc, Hoàn trả Ký quỹ (`ESCROW_REFUND`) & Báo cáo Đối soát Toàn cục (`REQ-FIN-02`, `REQ-FIN-03`, `REQ-LAB-02`, `ADR-04`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS) phối hợp đồng bộ với Sinh viên B (`TalentModule`, `ApplicationsModule`, `MentorInvitation`, `MentorReview`)  
> **Giai đoạn:** Giai đoạn 2 — Mentor, Vận hành Dự án & Tài chính Ký quỹ (Ngày D13 / Sprint 2: D11–D16)  
> **Đầu vào:** Module Cột mốc Ký quỹ & Chia doanh thu 70/20/10 (`006_a_project_milestones_and_ledger.sql` ở D12 của Sinh viên A) và Luồng Lời mời & Phân công Mentor (`006_b_mentor_invitations.sql`, `mentor-invitation.repository.ts` ở D12 của Sinh viên B).  
> **Đầu ra:** Migration `007_a_escrow_reconciliation_and_refunds.sql`, mở rộng `FinanceEscrowService` & `FinanceEscrowController` (`apps/api/src/payments/*`), nâng cấp `PayosSandboxSpikePage.tsx`, và bộ kiểm thử E2E `d13-escrow-reconciliation-refund.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D13 (Của Sinh viên A)

| Mã Req / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-FIN-02**<br>**ADR-04** | Thiết kế Migration `007_a_escrow_reconciliation_and_refunds.sql` bổ sung trạng thái `REFUNDED`, loại bút toán `ESCROW_REFUND`, bảng `milestone_review_logs` và `escrow_refunds` | `apps/api/src/database/migrations/007_a_escrow_reconciliation_and_refunds.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 & `ADR-04` |
| **REQ-FIN-01**<br>**REQ-FIN-02**<br>**ADR-04** | Xây dựng API Đồng bộ tự động PayOS Webhook HMAC vào Cột mốc Ký quỹ (`POST /api/v1/payments/milestones/:id/sync-payos-webhook`) bảo đảm tính Idempotent (không cộng trùng Sổ cái khi Replay) | `apps/api/src/payments/finance-escrow.types.ts`<br>`apps/api/src/payments/finance-escrow.service.ts`<br>`apps/api/src/payments/finance-escrow.controller.ts` | **Hoàn thành (100%)** | Pass E2E `TC-FIN-D13-01` |
| **REQ-LAB-02**<br>**REQ-FIN-02** | Xây dựng API Yêu cầu chỉnh sửa lại bàn giao cột mốc (`POST /api/v1/payments/milestones/:id/request-revision`: `SUBMITTED -> ESCROW_PAID`) và Hoàn trả ký quỹ (`POST /api/v1/payments/milestones/:id/refund-escrow`: `ESCROW_REFUND`) | `apps/api/src/payments/finance-escrow.service.ts`<br>`apps/api/src/payments/finance-escrow.controller.ts` | **Hoàn thành (100%)** | Pass E2E `TC-FIN-D13-02` & `TC-FIN-D13-03` |
| **REQ-FIN-03**<br>**REQ-SYS-01** | Xây dựng API Báo cáo Đối soát Tổng hợp Sổ cái & Quỹ Lab 70/20/10 Toàn hệ thống (`GET /api/v1/payments/reconciliation/summary`) và tích hợp lên `PayosSandboxSpikePage.tsx` | `apps/api/src/payments/finance-escrow.service.ts`<br>`apps/web/src/features/finance/PayosSandboxSpikePage.tsx` | **Hoàn thành (100%)** | Pass E2E `TC-FIN-D13-03` & `npm run typecheck` |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D13

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Bất biến Sổ cái | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/payments/milestones/:id/sync-payos-webhook` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Xác thực chữ ký PayOS Webhook HMAC-SHA256, chuyển cột mốc `PLANNED -> ESCROW_PAID` và ghi bút toán `ESCROW_DEPOSIT`. Nếu gọi lặp lần 2 trả về `idempotentReplay: true` và không ghi trùng Sổ cái. | `200 OK`<br>`403 Forbidden`<br>`404 Not Found` |
| `POST /api/v1/payments/milestones/:id/request-revision` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Yêu cầu Nhóm sinh viên chỉnh sửa/bổ sung gói bàn giao (`SUBMITTED -> ESCROW_PAID`), tăng `revisionCount` và giữ nguyên tiền ký quỹ trong két. | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |
| `POST /api/v1/payments/milestones/:id/refund-escrow` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Hoàn trả 100% tiền ký quỹ của cột mốc chưa giải ngân (`ESCROW_PAID / SUBMITTED -> REFUNDED`), ghi bút toán `ESCROW_REFUND` (`DEBIT`) đưa số dư ký quỹ về `0`. | `200 OK`<br>`403 Forbidden`<br>`409 Conflict` |
| `GET /api/v1/payments/reconciliation/summary` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Đối soát toàn bộ tiền ký quỹ, giải ngân 70% SV / 20% Mentor / 10% Lab, hoàn trả doanh nghiệp và kiểm tra bất biến cân bằng Sổ cái (`invariantHold: true`). | `200 OK`<br>`403 Forbidden` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D13 (`d13-escrow-reconciliation-refund.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **TC-FIN-D13-01** | *Given* Cột mốc 1 ở trạng thái `PLANNED`, *When* gọi `sync-payos-webhook` 2 lần liên tiếp với cùng mã tham chiếu, *Then* lần 1 chuyển sang `ESCROW_PAID`, lần 2 trả `idempotentReplay: true` và chỉ có đúng 1 bút toán `ESCROW_DEPOSIT`. | `200 OK` + Không cộng trùng Sổ cái | **PASS** |
| **TC-FIN-D13-02** | *Given* Sinh viên nộp bàn giao v1 (`SUBMITTED`), *When* Doanh nghiệp gọi `request-revision`, Sinh viên nộp lại v2 và Doanh nghiệp nghiệm thu `accept-and-split`, *Then* `revisionCount === 1` và chia doanh thu 70/20/10 chính xác tuyệt đối. | `200 OK` + `status === 'DISBURSED'` | **PASS** |
| **TC-FIN-D13-03** | *Given* Cột mốc 2 đã nạp ký quỹ `15,000,000` VND, *When* Lab Admin gọi `refund-escrow` và kiểm tra `GET /reconciliation/summary`, *Then* cột mốc sang `REFUNDED`, `escrowHeldBalance === 0` và `invariantHold === true`. | `200 OK` + Bất biến Sổ cái cân bằng 100% | **PASS** |