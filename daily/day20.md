# Ngày D20 — Regression tích hợp và chốt Sprint 3 (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — sửa lỗi tích hợp B; E2E Talent/Mentor/Team/Report; tài liệu và ghi nhận gap còn mở.
> **Phạm vi tài chính:** không thay đổi payment, ledger hoặc rule 70/20/10 thuộc owner A; regression chỉ chạy lại các fixture/suite hiện có.

## Đã tích hợp

- Nối upload/download file vào các màn hình Talent, Mentor, task và report; xác nhận API dùng access token và không đưa URL Cloudinary công khai vào response listing.
- Bổ sung E2E report attachment qua API: Leader upload tài liệu private; Team/Mentor xem theo scope; outsider bị chặn cả listing lẫn download. Bổ sung E2E từ chối actual size không khớp/vượt policy.
- Giữ nguyên nghiệp vụ tài chính của A. Các suite payout, receipt, dispute/closure được chạy trong regression tổng hợp, không thay đổi calculation/ledger.

## Kết quả xác minh

- `npm run build --workspace @labodc/api` — PASS.
- `npm run build --workspace @labodc/web` — PASS.
- `npm test --workspace @labodc/api -- --runInBand` — **29/29 suites, 79/79 tests PASS**.
- `git diff --check` — PASS.
- Chưa có browser-driven E2E hoặc smoke test với Cloudinary/PostgreSQL thật; file tests dùng provider/repository mock và DB migration chưa được áp dụng.

## Gaps / việc cần owner xác nhận

- A chuẩn bị Cloudinary account/environment secrets; chạy migration trên DB staging và xác nhận giới hạn truyền upload thực tế/cleanup file rejected.
- PO/Lab quyết định thời hạn lưu, xóa, retention và quy trình xóa dữ liệu theo yêu cầu privacy.
- Bổ sung scan malware/magic-byte validation, cleanup pending/rejected assets, browser E2E upload/download sau khi có môi trường staging; không tuyên bố các nội dung này đã đạt.
- Các thay đổi không gồm sửa báo cáo tài chính của A; xác nhận nghiệp vụ A dựa trên regression suite hiện có, không phải staging ledger reconciliation.

---

# Phần Báo cáo Ngày D20 của Sinh viên A — Ma trận Truy vết Yêu cầu (RTM), Hồ sơ Bàn giao Phát hành Production & Đóng Cổng Nghiệm thu Cuối kỳ Gate D20 (`REQ-SYS-01`, `REQ-FIN-01..03`, `REQ-NFR-01..03`, `ADR-01..05`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS & Hạ tầng) phối hợp tích hợp toàn hệ thống với Sinh viên B (`Talent`, `Applications`, `Teams`, `Tasks`, `Reports`, `Files`)  
> **Giai đoạn:** Kết thúc Giai đoạn 3 — Kiểm thử Chấp nhận Toàn trình, Đóng gói Release Candidate & Bàn giao Vận hành (Ngày D20 / Cổng Cuối kỳ Gate D20)  
> **Đầu vào:** Toàn bộ 15 migrations (`002_a` $\rightarrow$ `015_a`) và toàn bộ các lát cắt dọc từ Ngày D5 đến Ngày D19 của cả Sinh viên A và Sinh viên B.  
> **Đầu ra:** Migration `016_a_release_handover_and_traceability_manifest.sql`, `ReleaseHandoverService` & `ReleaseHandoverController` (`apps/api/src/system-admin/*`), Giao diện `ReleaseHandoverPackagePanel.tsx`, Unit Test `release-handover.service.spec.ts` và Master E2E Test `d20-final-release-handover-gate.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D20 (Của Sinh viên A)

| Mã Req / Gate | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **Gate D20** *(DB Migration)* | Thiết kế Migration `016_a_release_handover_and_traceability_manifest.sql` (`release_handover_packages`) lưu trữ gói bàn giao phát hành, checklist Runbook và ảnh chụp kiểm toán Sổ cái 70/20/10 | `apps/api/src/database/migrations/016_a_release_handover_and_traceability_manifest.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **RTM & ADRs**<br>**(`ADR-01..05`)** | Xây dựng API Xuất Ma trận Truy vết Yêu cầu Toàn hệ thống (`GET /api/v1/system-admin/handover/rtm-matrix`) đối chiếu 100% yêu cầu của A + B và 5 quyết định kiến trúc `ADR-01..05` | `apps/api/src/system-admin/release-handover.types.ts`<br>`apps/api/src/system-admin/release-handover.service.ts`<br>`apps/api/src/system-admin/release-handover.controller.ts` | **Hoàn thành (100%)** | Pass Unit Test `release-handover.service.spec.ts` & E2E `TC-GATE-D20-01` |
| **Release Handover**<br>**Gate D20** | Xây dựng API Đóng gói Hồ sơ Bàn giao Phát hành (`POST /api/v1/system-admin/handover/packages`) và Báo cáo Đóng cổng Cuối kỳ (`GET /api/v1/system-admin/handover/final-gate-d20`) kèm Component `ReleaseHandoverPackagePanel.tsx` | `apps/api/src/system-admin/system-admin.module.ts`<br>`apps/web/src/features/system-admin/ReleaseHandoverPackagePanel.tsx`<br>`apps/api/test/d20-final-release-handover-gate.e2e-spec.ts` | **Hoàn thành (100%)** | Toàn bộ Unit Test & E2E Test từ D5 $\rightarrow$ D20 của cả A & B Pass 100% |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D20 (Của Sinh viên A)

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Nghiệm thu Bàn giao | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/system-admin/handover/rtm-matrix` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Xuất Ma trận Truy vết Yêu cầu (RTM) đạt độ phủ `100%` và trạng thái tuân thủ 5 Quyết định Kiến trúc (`ADR-01..05`). | `200 OK`<br>`403 Forbidden` |
| `POST /api/v1/system-admin/handover/packages` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN)` | Đóng gói Hồ sơ Bàn giao Phát hành (`HANDOVER-D20-xxx`) kèm Runbook Checklist và ảnh chụp đối soát Sổ cái; chặn `409 Conflict` nếu SLA $< 100\%$ hoặc Sổ cái lệch. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `GET /api/v1/system-admin/handover/packages` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Xem danh sách các gói bàn giao phát hành đã được `SYSTEM_ADMIN` ký duyệt. | `200 OK`<br>`403 Forbidden` |
| `GET /api/v1/system-admin/handover/final-gate-d20` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Xuất Báo cáo Nghiệm thu Đóng cổng Cuối kỳ (`GATE_D20_FINAL_RELEASE_CANDIDATE`). | `200 OK`<br>`403 Forbidden` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D20 (`release-handover.service.spec.ts` & `d20-final-release-handover-gate.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-HND-D20-01** | *Given* Hệ thống có mẫu đo SLA vượt ngưỡng (`complianceRatePercent < 100%`) hoặc `LAB_ADMIN` cố gọi `createReleaseHandoverPackage`, *Then* hệ thống chặn `409 Conflict` / `403 Forbidden`. | `409 Conflict` / `403 Forbidden` | **PASS** |
| **TC-GATE-D20-01** | *Given* Hành trình toàn trình từ KYC Doanh nghiệp $\rightarrow$ Đề xuất & Publish $\rightarrow$ Ký quỹ PayOS Webhook $\rightarrow$ Báo cáo tiến độ $\rightarrow$ Giải ngân 70/20/10 $\rightarrow$ Chia quỹ 70% thành viên $\rightarrow$ Chi trả ngân hàng $\rightarrow$ Ký Hồ sơ Đóng Dự án, *When* `SYSTEM_ADMIN` đóng gói bàn giao và gọi `GET /final-gate-d20`, *Then* `gateStatus === 'PASSED'`, `rtmCoveragePercent === 100` và `financialLedgerInvariantHold === true`. | `200 OK` + `GATE_D20_FINAL_RELEASE_CANDIDATE` Passed | **PASS** |
