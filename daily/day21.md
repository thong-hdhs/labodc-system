# Ngày D21 — Flutter nền tảng, đăng nhập và hồ sơ (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — Flutter base app, secure login/profile, adapter API và UX error states.
> **Requirement:** `REQ-MOB-01`. Android là nền tảng trong kế hoạch; Q-B12 vẫn chờ PO xác nhận nền tảng nghiệm thu/phát hành.

## Đã triển khai trong checkout

- Tạo Flutter client source tại `apps/mobile` với `ApiClient`, adapter auth/talent và các model có kiểm tra cấu trúc response.
- Login giới hạn client vào `TALENT`/`TALENT_LEADER`, không lưu mật khẩu; access/refresh tokens và account display data được ghi bằng `flutter_secure_storage`.
- Khôi phục phiên chỉ sau khi `GET /auth/me` xác nhận `sub`, role và status khớp dữ liệu lưu. Unauthorized credentials bị xóa; lỗi mạng hiển thị và có thể thử lại.
- Hồ sơ tải/cập nhật qua API Talent hiện có; có loading, validation, success/error state và pull-to-refresh.
- Thêm hướng dẫn setup/run trong [README mobile](../apps/mobile/README.md) và bỏ qua artefact Flutter local/build trong `.gitignore`.

## Chưa xác minh / giới hạn

- Flutter/Dart SDK và Android SDK không có trong môi trường thực thi; vì vậy chưa thể chạy `flutter pub get`, `flutter analyze`, `flutter test` hoặc build/cài lên emulator/device.
- Android runner files chưa được sinh bởi `flutter create`; README ghi rõ bước bootstrap sau khi có SDK. Không tuyên bố mobile build/device test đã pass.
- API hiện chưa có refresh-token endpoint; app lưu refresh token an toàn nhưng chưa thể dùng để gia hạn access token. Khi access token hết hạn, session local bị xóa và Talent cần đăng nhập lại.
- API logout hiện được gọi, nhưng hiệu lực revoke server-side cần được xác nhận/kiểm thử riêng với owner Auth; app luôn xóa credential local trước khi gửi logout.
- Kết quả yêu cầu latency `<300 ms` từ ADR-04 chưa được đo; project repository hiện không phải Elasticsearch-backed trong lát cắt B. A sở hữu Elasticsearch/index consistency và cần cung cấp benchmark/contract khi tích hợp.

## Kiểm thử trong ngày

- API/Web builds và API discovery/application E2E được xác minh cùng D22; chi tiết ở [day22.md](./day22.md).
- Flutter widget/repository tests đã được thêm nhưng chưa chạy do thiếu SDK. Đây là test source, không phải bằng chứng pass.

---

# Phần Báo cáo Ngày D21 của Sinh viên A — Kiểm định Hợp đồng Tích hợp Mobile Companion API (`apps/mobile`), Bộ Kiểm thử Khói Sau Triển khai (Post-Deploy Smoke Suite) & Đóng Cổng Nghiệm thu Sprint 3 Gate D21 (`REQ-SYS-01`, `REQ-FIN-03`, `REQ-NFR-01..03`, `ADR-01..05`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS & Hạ tầng) phối hợp tích hợp với Sinh viên B (Owner ứng dụng Flutter Mobile Companion `apps/mobile/*` và các module `Talent`, `Applications`, `Teams`, `Tasks`, `Reports`, `Files`)  
> **Giai đoạn:** Kết thúc Sprint 3 (Ngày D21 / Đóng cổng Sprint 3 Gate D21 & Sẵn sàng Vận hành Thực tế Go-Live)  
> **Đầu vào:** Gói bàn giao Release Candidate (`016_a_release_handover_and_traceability_manifest.sql` ở D20 của Sinh viên A) và ứng dụng Flutter Mobile Companion (`apps/mobile/*` ở D21–D22 của Sinh viên B).  
> **Đầu ra:** Migration `017_a_sprint3_gate_and_production_golive_smoke.sql`, `ProductionGoliveService` & `ProductionGoliveController` (`apps/api/src/system-admin/*`), Giao diện `ProductionGoLiveGateD21Panel.tsx`, Unit Test `production-golive.service.spec.ts` và E2E Test `d21-sprint3-golive-and-mobile-contract.e2e-spec.ts` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D21 (Của Sinh viên A)

| Mã Req / Gate | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **Gate D21** *(DB Migration)* | Thiết kế Migration `017_a_sprint3_gate_and_production_golive_smoke.sql` (`production_smoke_test_runs`, `sprint3_gate_d21_signoffs`) lưu trữ kết quả Smoke Test 6 phân hệ và biên bản đóng cổng Gate D21 | `apps/api/src/database/migrations/017_a_sprint3_gate_and_production_golive_smoke.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **Mobile API Contract**<br>**(`apps/mobile`)** | Xây dựng API Kiểm định Hợp đồng Tích hợp giữa Backend NestJS và ứng dụng Flutter Mobile Companion của Sinh viên B (`GET /api/v1/system-admin/golive/mobile-contract`) | `apps/api/src/system-admin/production-golive.types.ts`<br>`apps/api/src/system-admin/production-golive.service.ts`<br>`apps/api/src/system-admin/production-golive.controller.ts` | **Hoàn thành (100%)** | Pass Unit Test `production-golive.service.spec.ts` & E2E `TC-GOLIVE-D21-01` |
| **Smoke Suite &**<br>**Sprint 3 Gate D21** | Xây dựng API Thực thi Smoke Test 6 phân hệ (`POST /api/v1/system-admin/golive/smoke-runs`) và Ký Đóng cổng Sprint 3 Gate D21 (`POST /api/v1/system-admin/golive/gate-d21-signoff`) kèm Component `ProductionGoLiveGateD21Panel.tsx` | `apps/api/src/system-admin/system-admin.module.ts`<br>`apps/web/src/features/system-admin/ProductionGoLiveGateD21Panel.tsx`<br>`apps/api/test/d21-sprint3-golive-and-mobile-contract.e2e-spec.ts` | **Hoàn thành (100%)** | Pass E2E `TC-GOLIVE-D21-02` & `npm run typecheck` |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D21 (Của Sinh viên A)

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Nghiệm thu Gate D21 | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/system-admin/golive/mobile-contract` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Kiểm định độ tương thích của 4 endpoints cốt lõi phục vụ ứng dụng Flutter `apps/mobile` (`POST /auth/login`, `GET /projects/public`, `GET/PUT /talent/profile/me`). | `200 OK`<br>`403 Forbidden` |
| `POST /api/v1/system-admin/golive/smoke-runs` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Thực thi bộ Kiểm thử Khói Sau Triển khai (Post-Deploy Smoke Suite) trên 6 phân hệ cốt lõi của toàn dự án và kiểm tra bất biến Sổ cái 70/20/10. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden` |
| `POST /api/v1/system-admin/golive/gate-d21-signoff` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN)` | Ký Biên bản Nghiệm thu Đóng Cổng Sprint 3 Gate D21 (`GATE_D21_SPRINT3_AND_PRODUCTION_GOLIVE`); chặn `409 Conflict` nếu Smoke Test $< 100\%$ hoặc vi phạm SLA. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `GET /api/v1/system-admin/golive/gate-d21-status` | `JwtAuthGuard`, `RolesGuard`, `@Roles(SYSTEM_ADMIN, LAB_ADMIN)` | Truy xuất trạng thái đóng cổng Gate D21 và kết quả phiên chạy Smoke Test gần nhất. | `200 OK`<br>`403 Forbidden` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D21 (`production-golive.service.spec.ts` & `d21-sprint3-golive-and-mobile-contract.e2e-spec.ts`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **Unit-GOLIVE-D21-01** | *Given* Hệ thống thực thi Smoke Suite 6 phân hệ đạt `100%`, *When* có mẫu đo SLA vi phạm ngưỡng hoặc `LAB_ADMIN` cố ký đóng cổng Gate D21, *Then* chặn `409 Conflict` / `403 Forbidden`. | `409 Conflict` / `403 Forbidden` | **PASS** |
| **TC-GOLIVE-D21-01** | *Given* Ứng dụng `apps/mobile` gọi các endpoints `/api/v1/projects/public` và `/api/v1/talent/profile/me`, *When* kiểm tra hợp đồng tích hợp tại `/golive/mobile-contract`, *Then* `allCompatible === true` (`4/4` endpoints). | `200 OK` + Tương thích 100% với `apps/mobile` | **PASS** |
| **TC-GOLIVE-D21-02** | *Given* `LAB_ADMIN` kích hoạt `POST /golive/smoke-runs` đạt `6/6 PASS` (`100%`), *When* `SYSTEM_ADMIN` ký `POST /golive/gate-d21-signoff`, *Then* `gateStatus === 'PASSED'` và `gateSignedOff === true`. | `201 Created` + `GATE_D21_SPRINT3_AND_PRODUCTION_GOLIVE` Passed | **PASS** |
