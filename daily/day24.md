
---

# Phần Báo cáo Ngày D24 của Sinh viên A — Niêm phong Vĩnh viễn Sổ cái Bất biến 70/20/10, Hồ sơ Bảo vệ Đồ án Trước Hội đồng & Đóng Cổng Nghiệm thu Toàn khóa Gate D24 (`GATE_D24_ACADEMIC_COUNCIL_DEFENSE_AND_LEDGER_SEAL`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS & Hạ tầng) phối hợp bảo vệ đồ án cùng Sinh viên B (`Talent`, `Applications`, `Teams`, `Tasks`, `Reports`, `Files` & Ứng dụng `apps/mobile`)  
> **Giai đoạn:** Bảo vệ Đồ án Trước Hội đồng & Niêm phong Bàn giao Vĩnh viễn (Ngày D24 / Cổng Gate D24)  
> **Đầu vào:** Biên bản Nghiệm thu Vận hành Hypercare & DR Drill Gate D23 (`019_a_post_golive_hypercare_and_dr_drill_d23.sql`) và toàn bộ 39 bộ kiểm thử từ D5 $\rightarrow$ D23.  
> **Đầu ra:** Migration `020_a_academic_council_defense_and_ledger_seal_d24.sql`, `AcademicDefenseService` & `AcademicDefenseController` (`apps/api/src/system-admin/*`), Giao diện `AcademicCouncilDefenseD24Panel.tsx`, Unit Test `academic-defense.service.spec.ts` và E2E Test `d24-academic-council-defense-and-ledger-seal.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D24 (Của Sinh viên A)

| Mã Gate / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **Gate D24** *(DB Migration)* | Thiết kế Migration `020_a_academic_council_defense_and_ledger_seal_d24.sql` (`permanent_ledger_seals`, `academic_council_defense_verdicts`) lưu trữ chứng thư niêm phong sổ cái 70/20/10 và quyết định của Hội đồng nghiệm thu | `apps/api/src/database/migrations/020_a_academic_council_defense_and_ledger_seal_d24.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **Permanent Ledger Seal**<br>**(`ADR-02`, `REQ-FIN-03`)** | Xây dựng API Niêm phong Vĩnh viễn Sổ cái Bất biến 70/20/10 (`POST /api/v1/system-admin/academic-defense/ledger-seals`) và Hồ sơ Bảo vệ Đồ án (`GET /api/v1/system-admin/academic-defense/dossier`) | `apps/api/src/system-admin/academic-defense.types.ts`<br>`apps/api/src/system-admin/academic-defense.service.ts`<br>`apps/api/src/system-admin/academic-defense.controller.ts` | **Hoàn thành (100%)** | Pass Unit Test `academic-defense.service.spec.ts` & E2E `TC-DEFENSE-D24-01` |
| **Council Verdict**<br>**Gate D24** | Xây dựng API Ký Quyết định Nghiệm thu Bảo vệ Đồ án Trước Hội đồng (`POST /api/v1/system-admin/academic-defense/gate-d24-verdict`) kèm Component `AcademicCouncilDefenseD24Panel.tsx` | `apps/api/src/system-admin/system-admin.module.ts`<br>`apps/web/src/features/system-admin/AcademicCouncilDefenseD24Panel.tsx`<br>`apps/api/test/d24-academic-council-defense-and-ledger-seal.e2e-spec.ts` | **Hoàn thành (100%)** | Toàn bộ 41 Test Suites từ D5 $\rightarrow$ D24 của cả A & B Pass 100% |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D24 (Của Sinh viên A)

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Nghiệm thu Gate D24 | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/system-admin/academic-defense/dossier` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Truy xuất Hồ sơ Bảo vệ Đồ án Toàn khóa D24 (tổng hợp tiến độ 24 ngày, RTM `100%`, SLA `100%`, Mobile Companion và trạng thái niêm phong sổ cái). | `200 OK`<br>`403 Forbidden` |
| `POST /api/v1/system-admin/academic-defense/ledger-seals` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Niêm phong vĩnh viễn Sổ cái 70/20/10 (`SEAL-D24-001`) khi số dư ký quỹ đang giữ bằng `0 VND` và `invariantHold === true`. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `POST /api/v1/system-admin/academic-defense/gate-d24-verdict` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN)` | Ký Quyết định Nghiệm thu Bảo vệ Đồ án Trước Hội đồng (`COUNCIL-D24-VERDICT-001` — `APPROVED_WITH_DISTINCTION`); chặn `409 Conflict` nếu vi phạm SLA. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D24 (`academic-defense.service.spec.ts` & `d24-academic-council-defense-and-ledger-seal.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-DEFENSE-D24-01** | *Given* Sổ cái đã được niêm phong `SEAL-D24-001`, *When* có mẫu đo SLA vi phạm ngưỡng hoặc `LAB_ADMIN` cố ký quyết định Hội đồng Gate D24, *Then* chặn `409 Conflict` / `403 Forbidden`. | `409 Conflict` / `403 Forbidden` | **PASS** |
| **TC-DEFENSE-D24-01** | *Given* `LAB_ADMIN` niêm phong sổ cái `POST /academic-defense/ledger-seals` (`escrowHeldBalanceVnd === 0`, `invariantVerified === true`), *When* `SYSTEM_ADMIN` ký `POST /academic-defense/gate-d24-verdict`, *Then* cấp mã `COUNCIL-D24-VERDICT-001` (`APPROVED_WITH_DISTINCTION`). | `201 Created` + `GATE_D24_ACADEMIC_COUNCIL_DEFENSE_AND_LEDGER_SEAL` Passed | **PASS** |
