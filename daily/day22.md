# Ngày D22 — Khám phá dự án trên mobile và hợp đồng lọc (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — Flutter project discovery/detail và refinement search/filter API thuộc miền B; đối chiếu hành vi Web/mobile.

## API discovery B

- Thêm `GET /api/v1/talent/discovery/projects` và `GET /api/v1/talent/discovery/projects/:projectId` trong Talent module, tiêu thụ `ProjectsService` contract của A; không sửa Project lifecycle/schema.
- Tìm kiếm `keyword` không phân biệt hoa/thường theo title, summary, company name và code; `skill` so khớp chính xác, không phân biệt hoa/thường.
- Kết quả chỉ gồm project PUBLISHED đang trong thời gian nhận đơn. Detail ngoài trạng thái eligible trả 404 để không quảng bá/cho xem dự án đóng hoặc chưa mở nhận đơn.
- Hỗ trợ `page` (mặc định 1), `pageSize` (mặc định 20, tối đa 50); trả `items` và metadata tổng số kết quả/trang. Query không hợp lệ trả 400.
- Web discovery chuyển sang API contract mới, loại bỏ request eligibility riêng cho từng project và thêm pagination. Flutter repository/screen sử dụng cùng endpoint, filter, detail và pagination.

## Kiểm thử và kết quả

- E2E kiểm tra keyword + skill, page/pageSize, detail public, query sai, loại project sau khi đóng nhận đơn khỏi discovery và từ chối detail khi đã đóng.
- `npm run build --workspace @labodc/api` — PASS.
- `npm run build --workspace @labodc/web` — PASS.
- `npm test --workspace @labodc/api -- --runInBand test/applications.e2e-spec.ts` — **1 suite, 5 tests PASS**.
- `npm test --workspace @labodc/api -- --runInBand` — **33 suites, 87 tests PASS**.
- E2E includes repeated filter-query rejection, out-of-range page clamping, and exclusion of projects that stop accepting applications.
- `git diff --check` — PASS.
- Flutter repository/widget/auth tests đã được thêm nhưng không thể chạy vì máy không cài Flutter/Dart SDK; chưa có emulator/device build.

## Cùng chốt / phụ thuộc còn mở

- `pageSize` có upper bound 50; đây là giới hạn API, không phải xác nhận tiêu chí tuyển chọn hay chính sách số đơn. Q-B02 vẫn chờ PO/Lab.
- A sở hữu Elasticsearch/indexing, API performance target và consistency khi publish/close. B API discovery hiện dùng Project service contract hiện có; không tuyên bố đã đạt latency 300 ms hay đã tích hợp Elasticsearch.
- Redis/cache/session use case do A đánh giá theo baseline; B không thêm Redis hoặc cache client-side để tránh giữ project state cũ.
- Q-B12 về platform chính thức, phát hành APK/Play Store và phạm vi actor/luồng nghiệm thu vẫn chờ PO; implementation theo Android/Flutter hiện được nêu trong kế hoạch nhưng chưa có build evidence.

---

# Phần Báo cáo Ngày D22 của Sinh viên A — Tổng Nghiệm thu Cuối khóa 22 Ngày (`D1 -> D22`), Lưu trữ Hồ sơ Bàn giao Vận hành & Đóng Cổng Tổng kết Dự án Gate D22 (`GATE_D22_FINAL_PROJECT_COMPLETION_AND_ARCHIVAL`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS & Hạ tầng) phối hợp tổng kết toàn khóa cùng Sinh viên B (`Talent`, `Applications`, `Teams`, `Tasks`, `Reports`, `Files` & Ứng dụng `apps/mobile`)  
> **Giai đoạn:** Ngày Cuối khóa (Ngày D22 / Đóng Cổng Tổng kết Dự án Gate D22 & Lưu trữ Hồ sơ Vận hành Chính thức)  
> **Đầu vào:** Toàn bộ kết quả đóng cổng Gate D10, Gate D16, Gate D20 và Gate D21 của cả Sinh viên A và Sinh viên B.  
> **Đầu ra:** Migration `018_a_final_project_completion_and_archival_d22.sql`, `FinalArchivalService` & `FinalArchivalController` (`apps/api/src/system-admin/*`), Giao diện `FinalProjectCompletionD22Panel.tsx`, Unit Test `final-archival.service.spec.ts` và E2E Test `d22-final-project-completion-and-archival.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D22 (Của Sinh viên A)

| Mã Gate / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **Gate D22** *(DB Migration)* | Thiết kế Migration `018_a_final_project_completion_and_archival_d22.sql` (`final_project_completion_certificates`) lưu trữ Chứng nhận Hoàn thành Dự án 22 Ngày và Runbook Vận hành | `apps/api/src/database/migrations/018_a_final_project_completion_and_archival_d22.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **Master Summary**<br>**(`D1 -> D22`)** | Xây dựng API Tổng hợp Báo cáo Nghiệm thu 4 Giai đoạn (`GET /api/v1/system-admin/final-archival/master-summary`) kiểm chứng 100% sản phẩm bàn giao của cả Sinh viên A và Sinh viên B | `apps/api/src/system-admin/final-archival.types.ts`<br>`apps/api/src/system-admin/final-archival.service.ts`<br>`apps/api/src/system-admin/final-archival.controller.ts` | **Hoàn thành (100%)** | Pass Unit Test `final-archival.service.spec.ts` & E2E `TC-ARCHIVAL-D22-01` |
| **Final Certificate**<br>**Gate D22** | Xây dựng API Cấp Chứng nhận Hoàn thành Dự án & Lưu trữ Hồ sơ Cuối khóa (`POST /api/v1/system-admin/final-archival/certificates`) kèm Component `FinalProjectCompletionD22Panel.tsx` | `apps/api/src/system-admin/system-admin.module.ts`<br>`apps/web/src/features/system-admin/FinalProjectCompletionD22Panel.tsx`<br>`apps/api/test/d22-final-project-completion-and-archival.e2e-spec.ts` | **Hoàn thành (100%)** | Toàn bộ 37 Test Suites từ D5 $\rightarrow$ D22 của cả A & B Pass 100% |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D22 (Của Sinh viên A)

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Đóng Cổng Gate D22 | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/system-admin/final-archival/master-summary` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Xuất báo cáo tổng kết toàn trình 22 ngày (`D1 -> D22`) qua 4 giai đoạn, đối chiếu RTM `100%`, 5 ADRs, SLA `100%`, Hợp đồng Mobile Companion và Sổ cái 70/20/10. | `200 OK`<br>`403 Forbidden` |
| `POST /api/v1/system-admin/final-archival/certificates` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN)` | Cấp Chứng nhận Hoàn thành Dự án (`CERT-D22-FINAL-001`) kèm Runbook vận hành chính thức; chặn `409 Conflict` nếu bất kỳ cổng kiểm soát nào chưa đạt `100%`. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `GET /api/v1/system-admin/final-archival/certificates` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Truy xuất danh sách Chứng nhận Hoàn thành Dự án và Hồ sơ Lưu trữ Cuối khóa D22. | `200 OK`<br>`403 Forbidden` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D22 (`final-archival.service.spec.ts` & `d22-final-project-completion-and-archival.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-ARCHIVAL-D22-01** | *Given* Lộ trình 22 ngày hoàn tất 4 giai đoạn, *When* có mẫu đo SLA vi phạm ngưỡng hoặc `LAB_ADMIN` cố cấp chứng nhận D22, *Then* chặn `409 Conflict` / `403 Forbidden`. | `409 Conflict` / `403 Forbidden` | **PASS** |
| **TC-ARCHIVAL-D22-01** | *Given* `LAB_ADMIN` gọi `GET /final-archival/master-summary`, *Then* trả về `totalDaysCompleted === 22`, `allGatesPassed === true`, `phases.length === 4` và `rtmCoveragePercent === 100`. | `200 OK` + Tổng kết 22 ngày đầy đủ | **PASS** |
| **TC-ARCHIVAL-D22-02** | *Given* `SYSTEM_ADMIN` gọi `POST /final-archival/certificates`, *Then* cấp mã chứng nhận `CERT-D22-FINAL-001` (`COMPLETED_AND_ARCHIVED`) với `17` migrations của A và `9` migrations của B đồng bộ 100%. | `201 Created` + `GATE_D22_FINAL_PROJECT_COMPLETION_AND_ARCHIVAL` Passed | **PASS** |
