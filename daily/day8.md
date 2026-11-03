# Ngày D8 — Hàng đợi Lab Admin Xét duyệt & Công bố Dự án `REQ-LAB-01` + Kiểm thử Phân quyền Âm tính `REQ-NFR-03` (Sinh viên A)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS)  
> **Giai đoạn:** Giai đoạn 1 — Nền tảng và lát cắt MVP đầu tiên (Ngày D8 / Sprint 1: D5–D10)  
> **Đầu vào:** Module Đề xuất dự án (`REQ-ENT-02` ở D7), Máy trạng thái `ProjectStatus`, Danh mục mã lý do `ProposalRejectionReasonCode` và Quy tắc Q-A03 tại `day1.md` & `day3.md`.  
> **Đầu ra:** Module Backend `LabAdminModule` (`apps/api/src/lab-admin/*`), Màn hình quản trị `LabReviewQueuePage.tsx` (`apps/web/src/features/project-admin/*`), Unit Test `lab-admin.service.spec.ts` và E2E Test `lab-admin-review.e2e-spec.ts` (`TC-LAB-01`, `TC-LAB-02`) Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D8 (Của Sinh viên A)

| Mã Req | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-LAB-01** *(Review Queue & Decision)* | Xây dựng API Hàng đợi xét duyệt đề xuất của Lab Admin: lọc theo trạng thái, xem chi tiết kèm `auditLogs`, Phê duyệt (`APPROVED`), Yêu cầu bổ sung (`CHANGES_REQUESTED`) và Từ chối (`REJECTED`) kèm bắt buộc `reasonCode` + `reasonNote >= 15 ký tự` | `apps/api/src/lab-admin/lab-admin.types.ts`<br>`apps/api/src/lab-admin/lab-admin.service.ts`<br>`apps/api/src/lab-admin/lab-admin.controller.ts`<br>`apps/api/src/lab-admin/lab-admin.module.ts` | **Hoàn thành (100%)** | Pass Unit Test `lab-admin.service.spec.ts` & E2E `TC-LAB-01` |
| **REQ-LAB-01** *(Publish & Lifecycle Controls)* | Xây dựng bộ điều khiển Công bố dự án (`PUBLISHED` kèm kiểm tra `registrationCloseAt` hợp lệ), Tạm ẩn (`UNPUBLISHED`) và Đóng nhận đơn (`RECRUITMENT_CLOSED`) + đồng bộ kết quả sang `GET /api/v1/projects/public` | `apps/api/src/lab-admin/lab-admin.service.ts`<br>`apps/api/src/projects/projects.service.ts` | **Hoàn thành (100%)** | Pass E2E `TC-LAB-02` |
| **REQ-NFR-03** *(Negative Auth & Audit)* | Kiểm thử phân quyền âm tính phía Server (`403 Forbidden` khi `ENTERPRISE` hoặc `TALENT` gọi API của `LAB_ADMIN`) và lưu vết đầy đủ vào `project_audit_logs` | `apps/api/test/lab-admin-review.e2e-spec.ts` | **Hoàn thành (100%)** | Pass E2E `TC-LAB-02` |
| **REQ-LAB-01** *(Frontend Web)* | Xây dựng giao diện `LabReviewQueuePage` cho phép Lab Admin xác thực doanh nghiệp, xét duyệt đề xuất dự án và công bố/đóng nhận đơn trên Web Portal | `apps/web/src/features/project-admin/LabReviewQueuePage.tsx`<br>`apps/web/src/App.tsx` | **Hoàn thành (100%)** | `npm run typecheck --workspace=apps/web` Pass |

---

## 2. Danh sách API Endpoints Miền Lab Admin Đã Triển khai trong Ngày D8

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Kiểm soát Trạng thái | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/lab-admin/proposals` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Xem hàng đợi toàn bộ đề xuất dự án, hỗ trợ lọc theo `?status=SUBMITTED`, `APPROVED`, `PUBLISHED`... | `200 OK`<br>`403 Forbidden` |
| `GET /api/v1/lab-admin/proposals/:id` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Xem chi tiết đề xuất dự án cùng toàn bộ lịch sử chuyển trạng thái `auditLogs`. | `200 OK`<br>`404 Not Found` |
| `POST /api/v1/lab-admin/proposals/:id/approve` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Duyệt đề xuất từ `SUBMITTED` sang `APPROVED`, lưu `approvedBy`, `approvedAt` và ghi Audit Log `APPROVE_PROPOSAL`. | `200 OK`<br>`409 Conflict` |
| `POST /api/v1/lab-admin/proposals/:id/request-info` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Yêu cầu doanh nghiệp bổ sung thông tin (`SUBMITTED -> CHANGES_REQUESTED`). Bắt buộc chọn `reasonCode` chuẩn và `reasonNote >= 15 ký tự`. | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |
| `POST /api/v1/lab-admin/proposals/:id/reject` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Từ chối đề xuất (`SUBMITTED -> REJECTED`). Bắt buộc chọn `reasonCode` chuẩn và `reasonNote >= 15 ký tự`. | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |
| `POST /api/v1/lab-admin/projects/:id/publish` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Công bố dự án (`APPROVED / UNPUBLISHED -> PUBLISHED`) kèm kiểm tra `registrationCloseAt > now()`. Dự án xuất hiện ngay trên `GET /api/v1/projects/public`. | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |
| `POST /api/v1/lab-admin/projects/:id/unpublish` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Tạm ẩn dự án đang `PUBLISHED` sang `UNPUBLISHED` (ẩn khỏi danh sách công khai của sinh viên). | `200 OK`<br>`409 Conflict` |
| `POST /api/v1/lab-admin/projects/:id/close-recruitment` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Đóng nhận đơn ứng tuyển (`PUBLISHED -> RECRUITMENT_CLOSED`). | `200 OK`<br>`409 Conflict` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D8 (`TC-LAB-01` & `TC-LAB-02`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **TC-LAB-01a** | *Given* Đề xuất đang ở trạng thái `SUBMITTED`, *When* Lab Admin gọi `request-info` hoặc `reject` nhưng `reasonNote < 15 ký tự`, *Then* hệ thống từ chối xử lý. | `400 Bad Request` | **PASS** |
| **TC-LAB-01b** | *Given* Đề xuất ở `SUBMITTED`, *When* Lab Admin gọi `request-info` hợp lệ (`SUBMITTED -> CHANGES_REQUESTED`), Doanh nghiệp sửa & gửi lại (`CHANGES_REQUESTED -> SUBMITTED`) và Lab Admin bấm `approve`, *Then* chuyển sang `APPROVED`. | `200 OK` + `status === 'APPROVED'` | **PASS** |
| **TC-LAB-02a** | *Given* Dự án đã ở `APPROVED`, *When* Lab Admin gọi `POST /api/v1/lab-admin/projects/:id/publish` với `registrationCloseAt` hợp lệ, *Then* chuyển sang `PUBLISHED`, xuất hiện trên `GET /api/v1/projects/public` và lưu đủ 6 bản ghi `auditLogs`. | `200 OK` + Hiển thị trên API Public | **PASS** |
| **TC-LAB-02b** | *Given* Người dùng có vai trò `ENTERPRISE` hoặc `TALENT`, *When* cố tình gọi các endpoint `/api/v1/lab-admin/*`, *Then* `RolesGuard` chặn hoàn toàn ở tầng server. | `403 Forbidden` | **PASS** |

---

## 4. Trạng thái Phối hợp A + B Cuối Ngày D8

- [x] **Phần việc của Sinh viên A (D5 -> D8):** Đã hoàn thành 100% và vượt qua toàn bộ Unit Test + E2E Test (`REQ-AUTH-01`, `REQ-ENT-01`, `REQ-ENT-02`, `REQ-LAB-01`, `REQ-NFR-03`).

## 5. Phần Sinh viên B — Nộp/rút Application (`REQ-TAL-03`)

### API và state

| Method / endpoint | Hành vi |
|---|---|
| `POST /api/v1/projects/:projectId/applications` | Talent/Talent Leader nộp đơn; backend xác minh Project eligibility bằng `ProjectsService` của A, tạo `SUBMITTED`, từ chối project đóng/ẩn/ngoài thời gian và active application trùng. |
| `GET /api/v1/talent/me/applications` | Chỉ trả đơn của actor hiện tại, gồm trạng thái hiện tại, Project summary được giới hạn và state history. |
| `POST /api/v1/applications/:applicationId/withdraw` | Chỉ chủ đơn được rút trước `ACCEPTED`; lưu `WITHDRAWN` và history; actor khác bị từ chối. |

Migration dự thảo B: `apps/api/src/database/migrations/003_b_applications.sql` — Application, unique partial index cho đơn active theo `(project_id, applicant_user_id)` và `application_state_history`. API runtime hiện dùng in-memory repository cùng pattern các module Project/Auth của checkout; migration chưa được áp dụng và không được xem là persistent storage.

### Kiểm thử B

| Test ID | Kịch bản | Kết quả |
|---|---|---|
| `TC-B-APP-01` | Gửi đơn tạo trạng thái `SUBMITTED`; danh sách trả đơn cùng project/history. | **PASS** |
| `TC-B-APP-02` | Từ chối đơn active trùng; actor Talent khác chỉ thấy danh sách rỗng, Enterprise bị `403`. | **PASS** |
| `TC-B-APP-03` | Talent rút đơn trước quyết định; actor khác không thể rút; rút lần nữa bị từ chối. | **PASS** |
| `TC-B-APP-04` | Không thể nộp khi Lab đóng nhận đơn. | **PASS** |

Bằng chứng: `apps/api/src/applications/*`, `apps/api/test/applications.e2e-spec.ts`; candidate UX nằm ở `apps/web/src/features/talent/TalentProjectsPage.tsx`.

## 6. Cùng chốt D8 — A + B

- [x] A sở hữu review/publish/close lifecycle; B chỉ tiêu thụ `checkRecruitmentEligibility` và không sửa Project schema/state.
- [x] B đã nối flow discovery → application; kiểm tra role, owner, duplicate active application, withdraw và project closed ở HTTP E2E.
- [x] Các quyết định D2 về `SUBMITTED`, withdraw trước accepted và Mentor là người quyết định cuối được giữ nguyên.
- [ ] Mentor review/decision endpoint chưa thuộc D8 của B; được lên kế hoạch ở D11, do đó chưa có cách chuyển Application khỏi `SUBMITTED` trong slice hiện tại.
- [ ] Application API runtime hiện in-memory; migration SQL mới là draft, chưa có migration runner/DB-backed behavior.

**Trạng thái D8 A+B:** A review queue và B candidate apply/withdraw slices có trong checkout, API tests pass. Không tuyên bố durability/production DB integration cho đến khi migration stack được hòa giải.