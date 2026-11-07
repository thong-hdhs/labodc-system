# Ngày D17 — Mentor evaluation, feedback và contribution records (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — Mentor evaluation/feedback/contribution: API + UI + rubric/visibility tests.
> **Input:** Team và Mentor assignment D13; evaluation decisions được người dùng xác nhận trong phiên làm việc.

## Quyết định nghiệp vụ áp dụng

- Rubric được ghi rõ theo từng đánh giá; mỗi tiêu chí có feedback, không có điểm số hoặc công thức tự động.
- Chỉ Mentor phụ trách được tạo/chốt đánh giá trong dự án được giao.
- Talent chỉ xem đánh giá cá nhân của mình khi đã ở trạng thái `EVALUATION_FINAL`; Enterprise không có API xem evaluation cá nhân.
- Contribution record là ghi nhận mô tả theo kỳ, gắn với một thành viên trong Team; không quy đổi thành tiền, điểm hoặc phân phối quỹ.

## Đã triển khai

- `POST /api/v1/mentor/projects/:projectId/evaluations` tạo evaluation draft; `POST /api/v1/mentor/evaluations/:evaluationId/finalize` chốt evaluation.
- `GET /api/v1/mentor/projects/:projectId/evaluations`, `GET /api/v1/lab-admin/evaluations` và `GET /api/v1/talent/me/evaluations` có scope riêng; Talent chỉ nhận evaluation FINAL của chính mình.
- `POST/GET /api/v1/mentor/projects/:projectId/contributions` ghi và đọc contribution theo project/Team; `GET /api/v1/lab-admin/contributions` dành cho Lab; Talent chỉ đọc contribution gắn với user của mình.
- Rubric chấp nhận 1–30 tiêu chí gồm tên tiêu chí + feedback; API từ chối trường điểm số hoặc field ngoài contract. Evaluation đã chốt không thể finalize lại hoặc sửa.
- UI tại `apps/web/src/features/reports/ProgressReportsPage.tsx` cho Mentor ghi evaluation/contribution, Lab xem theo quyền và Talent xem feedback cuối.
- Migration dự thảo `012_b_reports_evaluations_and_contributions.sql`; repository hiện theo pattern in-memory của các module B trước đó nên migration chưa tự động áp dụng.

## Kiểm thử nghiệm thu

- Kiểm tra Mentor được/không được phân công; chặn target ngoài Team và người không phải Mentor.
- Evaluation draft không hiển thị cho Talent; chỉ finalized evaluation của đúng Talent được trả về.
- Chặn finalize nếu thiếu rubric/feedback; evaluation finalized không thể finalize lại hoặc sửa.
- Contribution chỉ gắn với thành viên đúng Team; người khác không đọc được hồ sơ đóng góp cá nhân.
- E2E kiểm tra draft privacy, chỉ hiện FINAL cho đúng Talent, chặn Mentor chưa được gán, rubric thiếu/score, target ngoài Team và contribution visibility.
- Kết quả cùng xác minh D18: API E2E D17–D18 **7/7 PASS**; toàn bộ API **25/25 suites, 70/70 tests PASS**; API/Web build và `git diff --check` thành công.

## Giới hạn và việc còn lại

- Rubric chưa có tiêu chí chuẩn do Lab phê duyệt; dữ liệu hiện được Mentor cung cấp tường minh, không suy diễn thành điểm số.
- Chưa có cơ chế sửa/thay thế evaluation đã chốt; cần quy trình audit/supersede được PO xác nhận.
- Lưu trữ runtime còn in-memory; cần tích hợp repository PostgreSQL và chạy migration trước khi dùng dữ liệu bền vững.

---

# Phần Báo cáo Ngày D17 của Sinh viên A — Phân bổ Chi tiết Quỹ 70% Nhóm Sinh viên Theo Tỷ lệ Đóng góp, Lệnh Chi trả Giải ngân Ngân hàng & Biên lai Tài chính Doanh nghiệp (`REQ-FIN-03`, `REQ-FIN-02`, `REQ-LAB-02`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS) phối hợp đồng bộ với Sinh viên B (`ReportsModule` — Đánh giá & Tỷ lệ đóng góp thành viên `012_b_reports_evaluations_and_contributions.sql`)  
> **Giai đoạn:** Giai đoạn 3 — Báo cáo, Đánh giá, Giải ngân Chi tiết & Hoàn thiện Production (Ngày D17 / Sprint 3: D17–D21)  
> **Đầu vào:** Biên bản Quyết toán & Sổ cái 70/20/10 (`012_a_project_execution_and_settlement_statements.sql` của Sinh viên A) và Module Báo cáo & Đánh giá Đóng góp Thành viên (`012_b_reports_evaluations_and_contributions.sql`, `apps/api/src/reports/*` của Sinh viên B).  
> **Đầu ra:** Migration `013_a_member_payouts_and_financial_receipts.sql`, `TeamPayoutService` & `TeamPayoutController` (`apps/api/src/payments/*`), Giao diện `TeamPayoutDistributionPanel.tsx`, Unit Test `team-payout.service.spec.ts` và E2E Test `d17-team-payout-and-receipts.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D17 (Của Sinh viên A)

| Mã Req / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-FIN-03** *(DB Migration)* | Thiết kế Migration `013_a_member_payouts_and_financial_receipts.sql` (`team_member_payout_allocations`, `disbursement_payout_orders`, `enterprise_financial_receipts`) | `apps/api/src/database/migrations/013_a_member_payouts_and_financial_receipts.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **REQ-FIN-03**<br>**DEC-05** | Xây dựng thuật toán & API Phân bổ Quỹ 70% của Nhóm sinh viên cho từng thành viên theo `% đóng góp` (`POST /api/v1/payments/milestones/:id/distribute-team-pool`), cộng phần dư phép chia nguyên cho `TALENT_LEADER` bảo toàn tổng 100% | `apps/api/src/payments/team-payout.types.ts`<br>`apps/api/src/payments/team-payout.service.ts`<br>`apps/api/src/payments/team-payout.controller.ts` | **Hoàn thành (100%)** | Pass Unit Test `team-payout.service.spec.ts` & E2E `TC-FIN-D17-01` |
| **REQ-FIN-02**<br>**REQ-LAB-02** | Xây dựng API Thực thi Lệnh Chi trả Giải ngân Ngân hàng (`POST /api/v1/payments/milestones/:id/execute-payouts`) và Xuất Biên lai Tài chính Doanh nghiệp (`GET /api/v1/payments/milestones/:id/financial-receipt`) | `apps/api/src/payments/payments.module.ts`<br>`apps/web/src/features/finance/TeamPayoutDistributionPanel.tsx`<br>`apps/api/test/d17-team-payout-and-receipts.e2e-spec.ts` | **Hoàn thành (100%)** | Pass E2E `TC-FIN-D17-02` & `npm run typecheck` |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D17 (Của Sinh viên A)

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Bất biến | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/payments/milestones/:id/distribute-team-pool` | `JwtAuthGuard`, `RolesGuard`, `@Roles(MENTOR, LAB_ADMIN, SYSTEM_ADMIN, TALENT_LEADER)` | Chia gói thù lao 70% của nhóm cho từng thành viên theo `contributionPercentage` (tổng = 100%), phần dư cộng vào `TALENT_LEADER` để tổng tiền khớp tuyệt đối `teamAmount70`. | `200 OK`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `POST /api/v1/payments/milestones/:id/execute-payouts` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Thực thi 3 lệnh ủy nhiệm chi ngân hàng (`TEAM_LEADER` 70%, `MENTOR` 20%, `LAB_FUND` 10%) kèm mã `bankTransferRef`; chặn chi trả trùng lặp lần 2 (`409 Conflict`). | `200 OK`<br>`403 Forbidden`<br>`409 Conflict` |
| `GET /api/v1/payments/milestones/:id/financial-receipt` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN, MENTOR, TALENT_LEADER)` | Xuất Biên lai Tài chính & Sao kê phân bổ thù lao của cột mốc cho Doanh nghiệp tài trợ; chặn `403 Forbidden` nếu Doanh nghiệp khác truy cập trái phép. | `200 OK`<br>`403 Forbidden`<br>`409 Conflict` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D17 (`team-payout.service.spec.ts` & `d17-team-payout-and-receipts.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-PAY-D17-01** | *Given* Quỹ 70% của nhóm là `7,000,002` VND và 3 thành viên có tỷ lệ đóng góp `34% / 33% / 33%`, *When* gọi `calculateTeam70MemberSplit`, *Then* phần dư `2` VND cộng cho `TALENT_LEADER` (`2,380,002` / `2,310,000` / `2,310,000` VND) và `invariantHold === true`. | `invariantHold === true` | **PASS** |
| **TC-FIN-D17-01** | *Given* Cột mốc `10,000,003` VND đã `DISBURSED`, *When* `MENTOR` gọi `distribute-team-pool` và `LAB_ADMIN` gọi `execute-payouts`, *Then* tạo đủ 3 khoản phân bổ thành viên và 3 lệnh chi trả ngân hàng; gọi lặp lần 2 bị chặn `409 Conflict`. | `200 OK` + Chống chi trả trùng lặp | **PASS** |
| **TC-FIN-D17-02** | *Given* Cột mốc đã chi trả hoàn tất, *When* Doanh nghiệp A gọi `GET /financial-receipt` (và Doanh nghiệp B gọi thử), *Then* Doanh nghiệp B bị chặn `403`, Doanh nghiệp A nhận biên lai `PAID_OUT_COMPLETED` khớp 100%. | `200 OK` + Cách ly dữ liệu Doanh nghiệp | **PASS** |
