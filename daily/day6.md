# Ngày D6 — Lát cắt dọc Hồ sơ Doanh nghiệp `REQ-ENT-01` (Sinh viên A) & Hồ sơ Sinh viên `REQ-TAL-01` (Sinh viên B)

> **Giai đoạn:** Giai đoạn 1 — Nền tảng và lát cắt MVP đầu tiên (Ngày D6 / Sprint 1: D5–D10)  
> **Người phụ trách:**  
> - **Sinh viên A:** `REQ-ENT-01` (Đăng ký & Quản lý Hồ sơ Pháp nhân Doanh nghiệp, Xác thực `VERIFIED` bởi Lab Admin & Kiểm thử Cách ly dữ liệu `TC-ENT-01`, `TC-ENT-02`)  
> - **Sinh viên B:** `REQ-TAL-01` (Quản lý Hồ sơ Sinh viên, Kỹ năng, Chứng chỉ & Portfolio `TC-TAL-01`, `TC-TAL-02`)

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D6 (Sinh viên A)

| Mã Req | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-ENT-01** *(DB Migration)* | Thiết kế bảng `enterprise_profiles` & enum `enterprise_verification_status` (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`) | `apps/api/src/database/migrations/002_a_enterprise_profiles.sql` | **Hoàn thành (100%)** | Khớp chuẩn schema D3 & Q-A02 |
| **REQ-ENT-01** *(Backend API)* | Xây dựng CRUD Hồ sơ Doanh nghiệp, kiểm tra trùng Mã số thuế (`409 Conflict`), kiểm tra quyền sở hữu (`Data Isolation`) & API Lab Admin xác thực doanh nghiệp (`PATCH /api/v1/enterprises/:id/verify`) | `apps/api/src/enterprise/enterprise-profile.types.ts`<br>`apps/api/src/enterprise/enterprise-profile.repository.ts`<br>`apps/api/src/enterprise/enterprise.service.ts`<br>`apps/api/src/enterprise/enterprise.controller.ts`<br>`apps/api/src/enterprise/enterprise.module.ts` | **Hoàn thành (100%)** | Unit Test `enterprise.service.spec.ts` & E2E Test `enterprise.e2e-spec.ts` Pass |
| **REQ-ENT-01** *(Frontend Web)* | Xây dựng màn hình Quản lý Hồ sơ Pháp nhân Doanh nghiệp & hiển thị trạng thái xác thực của Lab Admin | `apps/web/src/features/enterprise/EnterpriseProfilePage.tsx`<br>`apps/web/src/App.tsx` | **Hoàn thành (100%)** | `npm run typecheck` Pass (0 errors) |

---

## 2. Danh sách API Endpoints Miền Enterprise Đã Triển khai trong Ngày D6

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Bảo mật | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/enterprises/profile`<br>`PUT /api/v1/enterprises/profile/me` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Tạo mới hoặc cập nhật hồ sơ pháp nhân của chính doanh nghiệp đang đăng nhập; kiểm tra định dạng & chống trùng `taxCode`. | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |
| `GET /api/v1/enterprises/profile/me` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Lấy thông tin hồ sơ pháp nhân và trạng thái xác thực (`PENDING_VERIFICATION` / `VERIFIED` / `REJECTED`) của doanh nghiệp hiện tại. | `200 OK`<br>`404 Not Found` |
| `GET /api/v1/enterprises/:id` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Xem chi tiết hồ sơ theo ID. Nếu là `ENTERPRISE`, chỉ cho phép khi `ownerUserId === user.sub` (chặn xem chéo giữa 2 công ty). | `200 OK`<br>`403 Forbidden`<br>`404 Not Found` |
| `PATCH /api/v1/enterprises/:id` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Cập nhật hồ sơ theo ID, bắt buộc kiểm tra `ownerUserId === user.sub` (`TC-ENT-02`). | `200 OK`<br>`403 Forbidden` |
| `GET /api/v1/enterprises` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Lab Admin xem danh sách toàn bộ hồ sơ doanh nghiệp để xét duyệt pháp nhân. | `200 OK`<br>`403 Forbidden` |
| `PATCH /api/v1/enterprises/:id/verify` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Lab Admin duyệt chuyển trạng thái doanh nghiệp sang `VERIFIED` hoặc `REJECTED` (bắt buộc kèm lý do tối thiểu 10 ký tự khi từ chối). | `200 OK`<br>`400 Bad Request`<br>`403 Forbidden` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D6 (`TC-ENT-01` & `TC-ENT-02`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **TC-ENT-01** | *Given* Doanh nghiệp A đăng nhập hợp lệ, *When* gửi `POST /api/v1/enterprises/profile` với đầy đủ thông tin pháp nhân và Lab Admin gọi `PATCH /api/v1/enterprises/:id/verify`, *Then* hồ sơ được tạo ở `PENDING_VERIFICATION` và chuyển sang `VERIFIED` thành công. | `200 OK` + `verificationStatus === 'VERIFIED'` | **PASS** |
| **TC-ENT-02a** | *Given* Hồ sơ thuộc sở hữu của Doanh nghiệp A, *When* Doanh nghiệp B (`enterprise2@company.vn`) gọi `GET` hoặc `PATCH /api/v1/enterprises/:id` của Doanh nghiệp A, *Then* hệ thống từ chối truy cập. | `403 Forbidden` | **PASS** |
| **TC-ENT-02b** | *Given* Người dùng có vai trò `TALENT`, *When* cố tình gọi `POST /api/v1/enterprises/profile`, *Then* `RolesGuard` chặn ở tầng server. | `403 Forbidden` | **PASS** |
| **TC-ENT-02c** | *Given* Doanh nghiệp A đang ở `PENDING_VERIFICATION`, *When* tự gọi `PATCH /api/v1/enterprises/:id/verify` để tự duyệt mình, *Then* hệ thống từ chối. | `403 Forbidden` | **PASS** |

---

## 4. Điểm chốt Cuối Ngày D6 (Checkpoint A + B) & Chuẩn bị Ngày D7

- [x] **Hoàn thành song song 2 lát cắt hồ sơ:** Sinh viên A hoàn tất `REQ-ENT-01` (`apps/api/src/enterprise`, `apps/web/src/features/enterprise`); Sinh viên B hoàn tất `REQ-TAL-01` (`apps/api/src/talent`, `apps/web/src/features/talent`).
- [x] **Không xung đột mã nguồn (Zero Merge Conflict):** Cả 2 module cùng tích hợp vào `AppModule` và `App.tsx` sạch sẽ.
- [x] **Sẵn sàng cho Ngày D7:** `EnterpriseService` đã được export từ `EnterpriseModule` để Ngày D7 Sinh viên A triển khai `REQ-ENT-02` (**Tạo bản nháp `DRAFT` & Gửi đề xuất dự án `SUBMITTED` — kiểm tra điều kiện doanh nghiệp đã `VERIFIED`**).