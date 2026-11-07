# Ngày D18 — Báo cáo tháng/giai đoạn và luồng review (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — Báo cáo theo tháng/giai đoạn: API + Mentor/Lab UI + submit/review tests.
> **Input:** Report lifecycle B4 trong `daily/day3.md`; người dùng xác nhận baseline fields và reviewer trong phiên làm việc.

## Quyết định nghiệp vụ áp dụng

- Báo cáo có kỳ `MONTH` hoặc `PHASE`, phạm vi project/Team, tóm tắt, tiến độ, vướng mắc và bước tiếp theo.
- Mentor phụ trách hoặc Lab Admin có thể tiếp nhận báo cáo để review; reviewer bắt đầu review là người duy nhất xử lý kết quả của lần review đó.
- Leader hiện tại có thể lập báo cáo Team; Mentor có thể lập báo cáo project hoặc báo cáo gắn Team.
- Thay đổi nội dung tạo version mới; lịch sử trạng thái và ghi chú trả chỉnh sửa được lưu riêng.

## Đã triển khai

- API lifecycle `DRAFT -> SUBMITTED -> IN_REVIEW -> APPROVED` hoặc `CHANGES_REQUESTED -> SUBMITTED`; trả chỉnh sửa bắt buộc có ghi chú và chỉ reviewer đã tiếp nhận được xử lý kết quả. Gửi lại xóa reviewer hiện hành để cần tiếp nhận review lại.
- Mentor phụ trách tạo báo cáo project/Team; chỉ Leader hiện tại tạo báo cáo Team và không thể tự chọn Team qua request body.
- `PATCH /api/v1/reports/:reportId` tạo version mới; `GET /api/v1/reports/:reportId/history` lưu/read state events theo quyền.
- Listing có scope Mentor/project, Lab Admin, và thành viên Talent/Leader thuộc Team; report khác project/Team không được đọc.
- UI báo cáo tại `apps/web/src/features/reports/ProgressReportsPage.tsx` dùng chung cho Mentor/Lab/Talent Leader/Talent: tạo, gửi, sửa khi được trả lại, xem trạng thái/lịch sử, tiếp nhận review, duyệt hoặc yêu cầu chỉnh sửa.
- Migration dự thảo `012_b_reports_evaluations_and_contributions.sql` chứa report, versions, state history, evaluation và contribution records.

## Kiểm thử nghiệm thu

- Validate kỳ/ngày và nội dung bắt buộc; chặn submit/review/approve sai trạng thái.
- Kiểm tra Mentor assignment, reviewer đã tiếp nhận, Lab Admin, Leader hiện tại và membership; ngăn truy cập chéo project/Team.
- Kiểm tra trả chỉnh sửa cần lý do, cập nhật tăng version, resubmit và state history giữ đầy đủ.
- Kết quả: D17–D18 E2E **7/7 PASS**; toàn bộ API **25/25 suites, 70/70 tests PASS**; API build, Web build và `git diff --check` thành công.

## Giới hạn và việc còn lại

- Các trường và quyền reviewer là baseline được PO/user xác nhận cho lát cắt này; mẫu báo cáo chính thức vẫn cần Lab cung cấp nếu có yêu cầu biểu mẫu.
- Runtime repository còn in-memory; migration là draft chưa được chạy trên PostgreSQL.
- Report file upload/download thuộc D19; D18 chỉ lưu metadata và nội dung văn bản, không phát sinh URL tệp giả.

---

# Phần Báo cáo Ngày D18 của Sinh viên A — Phân xử Khiếu nại Ký quỹ, Hồ sơ Nghiệm thu Đóng Dự án Tổng thể & Báo cáo Minh bạch Quỹ Vận hành LabOdc 10% (`REQ-FIN-02`, `REQ-FIN-03`, `REQ-LAB-02`, `REQ-SYS-01`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS) phối hợp đồng bộ với Sinh viên B (`ReportsModule` & `ProgressReportsPage.tsx`)  
> **Giai đoạn:** Giai đoạn 3 — Báo cáo, Đánh giá, Giải ngân Chi tiết & Hoàn thiện Production (Ngày D18 / Sprint 3: D17–D21)  
> **Đầu vào:** Module Phân bổ Quỹ 70% theo Đóng góp Thành viên & Biên lai Doanh nghiệp (`013_a_member_payouts_and_financial_receipts.sql` ở D17 của Sinh viên A) và Module Báo cáo / Đánh giá Đóng góp (`012_b_reports_evaluations_and_contributions.sql`, `d17-d18-evaluations-reports.e2e-spec.ts` của Sinh viên B).  
> **Đầu ra:** Migration `014_a_project_closure_and_lab_fund_transparency.sql`, `FinancialClosureService` & `FinancialClosureController` (`apps/api/src/payments/*`), Giao diện `FinancialClosureAndTransparencyPanel.tsx`, Unit Test `financial-closure.service.spec.ts` và E2E Test `d18-financial-dispute-closure-transparency.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D18 (Của Sinh viên A)

| Mã Req / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-FIN-02**<br>**REQ-LAB-02** | Thiết kế Migration `014_a_project_closure_and_lab_fund_transparency.sql` (`financial_dispute_tickets`, `project_closure_dossiers`) | `apps/api/src/database/migrations/014_a_project_closure_and_lab_fund_transparency.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **REQ-FIN-02**<br>**REQ-LAB-02** | Xây dựng API Mở phiếu khiếu nại/đối soát cột mốc (`POST /api/v1/payments/disputes`) và Lab Admin phân xử tự động kết nối giải ngân 70/20/10 hoặc hoàn trả ký quỹ (`POST /api/v1/payments/disputes/:disputeId/resolve`) | `apps/api/src/payments/financial-closure.types.ts`<br>`apps/api/src/payments/financial-closure.service.ts`<br>`apps/api/src/payments/financial-closure.controller.ts` | **Hoàn thành (100%)** | Pass Unit Test `financial-closure.service.spec.ts` & E2E `TC-FIN-D18-01` |
| **REQ-ENT-02**<br>**REQ-FIN-03**<br>**REQ-SYS-01** | Xây dựng API Ký Hồ sơ Nghiệm thu Đóng Dự án Tổng thể (`POST /api/v1/payments/projects/:projectId/closure-dossier`) và Báo cáo Minh bạch Quỹ Lab 10% (`GET /api/v1/payments/lab-fund/transparency-report`) | `apps/api/src/payments/payments.module.ts`<br>`apps/web/src/features/finance/FinancialClosureAndTransparencyPanel.tsx`<br>`apps/api/test/d18-financial-dispute-closure-transparency.e2e-spec.ts` | **Hoàn thành (100%)** | Pass E2E `TC-FIN-D18-02` & `npm run typecheck` |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D18 (Của Sinh viên A)

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Kiểm soát | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/payments/disputes` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, TALENT_LEADER, TALENT, MENTOR)` | Mở phiếu khiếu nại/đối soát trên cột mốc chưa giải ngân (`ESCROW_PAID` / `SUBMITTED`); chặn mở trùng phiếu `OPEN` (`409 Conflict`). | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `POST /api/v1/payments/disputes/:disputeId/resolve` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Phân xử phiếu khiếu nại: tự động giải ngân 70/20/10 (`RESOLVED_RELEASE_TO_TEAM`), hoàn trả 100% ký quỹ (`RESOLVED_REFUND_TO_ENTERPRISE`) hoặc bác bỏ (`REJECTED`). | `200 OK`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `POST /api/v1/payments/projects/:projectId/closure-dossier` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Ký Hồ sơ Nghiệm thu Đóng Dự án Tổng thể kèm điểm hài lòng (`1..5`) khi dự án đã tất toán 100% (`escrowRemainingBalanceVnd === 0`) và không còn khiếu nại `OPEN`. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `GET /api/v1/payments/lab-fund/transparency-report` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Xuất Báo cáo Minh bạch Quỹ Vận hành LabOdc 10%, đối soát phần dư phép chia nguyên, thống kê phân xử tranh chấp và điểm hài lòng trung bình của Doanh nghiệp. | `200 OK`<br>`403 Forbidden` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D18 (`financial-closure.service.spec.ts` & `d18-financial-dispute-closure-transparency.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-CLS-D18-01** | *Given* Dự án đang có phiếu khiếu nại `OPEN`, *When* cố gọi `createProjectClosureDossier`, *Then* chặn `409 Conflict`; sau khi Lab Admin phân xử `RESOLVED_RELEASE_TO_TEAM`, ký đóng dự án thành công. | `409 Conflict` $\rightarrow$ `201 Created` | **PASS** |
| **TC-FIN-D18-01** | *Given* Dự án có 2 cột mốc (`20,000,003` VND và `10,000,000` VND) đang có khiếu nại, *When* Lab Admin phân xử Giải ngân Cột mốc 1 và Hoàn trả Cột mốc 2, *Then* số dư ký quỹ về `0 VND` và dự án sang `COMPLETED`. | `200 OK` + Tất toán Sổ cái 100% | **PASS** |
| **TC-FIN-D18-02** | *Given* Doanh nghiệp A ký Hồ sơ Đóng Dự án (`satisfactionScore = 5`), *When* Lab Admin gọi `GET /lab-fund/transparency-report`, *Then* Quỹ Lab 10% thu `2,000,001` VND, `invariantHold === true` và `averageSatisfactionScore === 5`. | `200 OK` + Đối soát khớp 100% | **PASS** |
