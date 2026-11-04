# Ngày D11 — Lát cắt dọc Yêu cầu Đổi phạm vi (`SCOPE_CHANGE`) / Hủy Dự án (`CANCEL`) & Luồng Phê duyệt của Lab Admin (`REQ-ENT-03`, `REQ-LAB-02`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS)  
> **Giai đoạn:** Giai đoạn 2 — Vòng đời Dự án, Tuyển chọn & Khung Tài chính (Ngày D11 / Mở đầu Sprint 2: D11–D20)  
> **Đầu vào:** Cổng nghiệm thu MVP Gate D10 (`daily/day10.md`), Quy tắc nghiệp vụ `DEC-A04` (`Q-A04` tại `day1.md`–`day3.md`).  
> **Đầu ra:** Migration `005_a_project_change_requests.sql`, API & Service cho `REQ-ENT-03` và `REQ-LAB-02`, Giao diện quản lý yêu cầu Đổi phạm vi / Hủy dự án trên `EnterpriseProposalPage.tsx` và `LabReviewQueuePage.tsx`, cùng bộ kiểm thử E2E `d11-scope-change-cancel.e2e-spec.ts` (`TC-CHG-01`, `TC-CHG-02`, `TC-CHG-03`) Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D11 (Của Sinh viên A)

| Mã Req / Quyết định | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-ENT-03**<br>**DEC-A04** | Thiết kế Migration `005_a_project_change_requests.sql` (`change_request_type`, `change_request_status`, bảng `project_change_requests`) | `apps/api/src/database/migrations/005_a_project_change_requests.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **REQ-ENT-03** *(Backend API)* | Xây dựng API cho Doanh nghiệp gửi yêu cầu `SCOPE_CHANGE` / `CANCEL`, kiểm tra trạng thái dự án hợp lệ, chặn gửi trùng khi đang `PENDING_APPROVAL`, và tự rút yêu cầu (`WITHDRAWN`) | `apps/api/src/projects/project-proposal.types.ts`<br>`apps/api/src/projects/project-proposal.repository.ts`<br>`apps/api/src/projects/projects.service.ts`<br>`apps/api/src/projects/projects.controller.ts` | **Hoàn thành (100%)** | Pass E2E `TC-CHG-01` & `TC-CHG-03` |
| **REQ-LAB-02** *(Backend API)* | Xây dựng API cho Lab Admin xem hàng đợi `change-requests`, kích hoạt dự án sang `IN_PROGRESS`, Phê duyệt (`APPROVED` — tự động cập nhật phạm vi/ngân sách hoặc chuyển dự án sang `CANCELLED` kèm ghi chú quyết toán) và Từ chối (`REJECTED`) + ghi Audit Trail | `apps/api/src/lab-admin/lab-admin.types.ts`<br>`apps/api/src/lab-admin/lab-admin.service.ts`<br>`apps/api/src/lab-admin/lab-admin.controller.ts` | **Hoàn thành (100%)** | Pass E2E `TC-CHG-01`, `TC-CHG-02`, `TC-CHG-03` |
| **REQ-ENT-03**<br>**REQ-LAB-02** *(Frontend Web)* | Bổ sung Form gửi/rút yêu cầu Đổi phạm vi & Hủy dự án trên `EnterpriseProposalPage.tsx` và Bảng phê duyệt trên `LabReviewQueuePage.tsx` (không ảnh hưởng tới các trang của Sinh viên B) | `apps/web/src/features/enterprise/EnterpriseProposalPage.tsx`<br>`apps/web/src/features/project-admin/LabReviewQueuePage.tsx` | **Hoàn thành (100%)** | `npm run typecheck --workspace=apps/web` Pass |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D11

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Máy trạng thái (State Machine) | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/projects/:id/change-requests` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Doanh nghiệp sở hữu dự án tạo yêu cầu `SCOPE_CHANGE` (khi dự án `PUBLISHED`/`RECRUITMENT_CLOSED`/`IN_PROGRESS`) hoặc `CANCEL` (khi `APPROVED`/`PUBLISHED`/`RECRUITMENT_CLOSED`/`IN_PROGRESS`). Chặn `409 Conflict` nếu sai trạng thái hoặc đang có yêu cầu chờ duyệt. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden`<br>`409 Conflict` |
| `GET /api/v1/projects/change-requests/me` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Lấy danh sách toàn bộ yêu cầu Đổi phạm vi / Hủy dự án của doanh nghiệp đang đăng nhập. | `200 OK` |
| `GET /api/v1/projects/:id/change-requests` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Xem lịch sử yêu cầu thay đổi/hủy của một dự án cụ thể (có kiểm tra quyền sở hữu đối với `ENTERPRISE`). | `200 OK`<br>`403 Forbidden` |
| `POST /api/v1/projects/change-requests/:requestId/withdraw` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE)` | Doanh nghiệp tự rút lại yêu cầu khi đang ở trạng thái `PENDING_APPROVAL` (`PENDING_APPROVAL -> WITHDRAWN`). | `200 OK`<br>`409 Conflict` |
| `POST /api/v1/lab-admin/projects/:id/start-progress` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Chuyển dự án từ `PUBLISHED` hoặc `RECRUITMENT_CLOSED` sang `IN_PROGRESS` và lưu Audit Log. | `200 OK`<br>`409 Conflict` |
| `GET /api/v1/lab-admin/change-requests` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Xem hàng đợi toàn bộ yêu cầu Đổi phạm vi / Hủy dự án, hỗ trợ lọc theo `?status=PENDING_APPROVAL`... | `200 OK`<br>`403 Forbidden` |
| `POST /api/v1/lab-admin/change-requests/:id/approve` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Phê duyệt yêu cầu: nếu `SCOPE_CHANGE` thì cập nhật `deliverables`/`budgetAmount`/`durationWeeks`/`maxTeamSize`; nếu `CANCEL` thì chuyển dự án sang `CANCELLED` kèm ghi chú quyết toán tài chính. | `200 OK`<br>`409 Conflict` |
| `POST /api/v1/lab-admin/change-requests/:id/reject` | `JwtAuthGuard`, `RolesGuard`, `@Roles(LAB_ADMIN, SYSTEM_ADMIN)` | Từ chối yêu cầu (`PENDING_APPROVAL -> REJECTED`) kèm `reviewNote >= 10 ký tự`; giữ nguyên trạng thái dự án. | `200 OK`<br>`400 Bad Request`<br>`409 Conflict` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D11 (`TC-CHG-01`, `TC-CHG-02`, `TC-CHG-03`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **TC-CHG-01** | *Given* Dự án đang ở `DRAFT` thì chặn `409 Conflict`; *When* dự án chuyển sang `IN_PROGRESS`, Doanh nghiệp gửi `SCOPE_CHANGE` (rút lại lần 1 `WITHDRAWN`, gửi lại lần 2) và Lab Admin bấm `approve`, *Then* ngân sách & thời lượng dự án tự động cập nhật theo đề xuất mới. | `200 OK` + Cập nhật phạm vi & Audit Log | **PASS** |
| **TC-CHG-02** | *Given* Dự án đang `IN_PROGRESS`, *When* Doanh nghiệp gửi yêu cầu `CANCEL` lần 1 bị Lab Admin `reject` (dự án giữ nguyên `IN_PROGRESS`), sau đó gửi lần 2 và được Lab Admin `approve` kèm ghi chú quyết toán, *Then* dự án chuyển sang `CANCELLED` và khóa nhận đơn. | `200 OK` + `project.status === 'CANCELLED'` | **PASS** |
| **TC-CHG-03** | *Given* Doanh nghiệp B hoặc `TALENT` cố tình gọi API tạo yêu cầu hủy dự án của Doanh nghiệp A hoặc gọi API phê duyệt của `LAB_ADMIN`, *Then* hệ thống từ chối truy cập. | `403 Forbidden` | **PASS** |