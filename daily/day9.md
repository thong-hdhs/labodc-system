# Ngày D9 — Điều khiển Đóng/Mở Công bố Dự án (`REQ-LAB-01`) & Spike Kỹ thuật PayOS Sandbox + Webhook HMAC (`REQ-FIN-01`, `REQ-FIN-02`) (Sinh viên A)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS)  
> **Giai đoạn:** Giai đoạn 1 — Nền tảng và lát cắt MVP đầu tiên (Ngày D9 / Sprint 1: D5–D10)  
> **Đầu vào:** Hàng đợi Lab Admin xét duyệt (`REQ-LAB-01` ở D8), Quyết định kiến trúc `ADR-04` (PayOS Webhook HMAC & Idempotency), `DEC-04` (Không tin cậy Client Redirect), `DEC-07` (`PAYMENT_MODE=SANDBOX`).  
> **Đầu ra:** Bộ lọc tìm kiếm dự án công khai & API kiểm tra điều kiện ứng tuyển (`GET /api/v1/projects/:id/recruitment-eligibility`), Migration `004_a_payos_webhook_spike.sql`, Module `PaymentsModule` (`apps/api/src/payments/*`), Giao diện `PayosSandboxSpikePage.tsx`, và bộ kiểm thử `TC-LAB-03`, `TC-FIN-SPIKE-01`, `TC-FIN-SPIKE-02` Pass 100%.

---

## 1. Bảng Tổng hợp Hạng mục Công việc Đã Hoàn thành trong Ngày D9 (Của Sinh viên A)

| Mã Req / ADR | Hạng mục công việc Full-Stack của Sinh viên A | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-LAB-01**<br>**DEC-A03** | Hoàn thiện điều khiển `Publish / Unpublish / Re-Publish / Close Recruitment`, bộ lọc tìm kiếm dự án công khai (`keyword`, `skill`) & API kiểm tra điều kiện mở nhận đơn ứng tuyển cho Sinh viên B | `apps/api/src/projects/projects.service.ts`<br>`apps/api/src/projects/projects.controller.ts`<br>`apps/api/src/lab-admin/lab-admin.service.ts` | **Hoàn thành (100%)** | Pass E2E `TC-LAB-03` |
| **REQ-FIN-01**<br>**REQ-FIN-02**<br>**ADR-04** | Thiết kế Migration `004_a_payos_webhook_spike.sql` (`payment_orders`, `payment_webhook_events` với khóa `UNIQUE(provider, idempotency_key)`) | `apps/api/src/database/migrations/004_a_payos_webhook_spike.sql` | **Hoàn thành (100%)** | Khớp chuẩn Schema D3 & `ADR-04` |
| **REQ-FIN-01**<br>**DEC-04, DEC-07** | Xây dựng Spike kết nối PayOS Sandbox (`PAYMENT_MODE=SANDBOX`), tạo chữ ký `HMAC-SHA256`, chặn giả mạo trạng thái từ Client Redirect và xử lý Webhook Idempotent | `apps/api/src/payments/payos-spike.types.ts`<br>`apps/api/src/payments/payos-signature.util.ts`<br>`apps/api/src/payments/payments-spike.service.ts`<br>`apps/api/src/payments/payments-spike.controller.ts`<br>`apps/api/src/payments/payments.module.ts` | **Hoàn thành (100%)** | Pass Unit Test `payments-spike.service.spec.ts` & E2E `TC-FIN-SPIKE-01`, `TC-FIN-SPIKE-02` |
| **REQ-FIN-01** *(Frontend Web)* | Xây dựng màn hình `PayosSandboxSpikePage.tsx` tạo lệnh thanh toán Sandbox và mô phỏng xác thực Webhook HMAC + Idempotency | `apps/web/src/features/finance/PayosSandboxSpikePage.tsx`<br>`apps/web/src/App.tsx` | **Hoàn thành (100%)** | `npm run typecheck --workspace=apps/web` Pass |

---

## 2. Danh sách API Endpoints Mới Đã Triển khai trong Ngày D9

| Phương thức & Endpoint | Guards & Roles được phép | Mô tả Nghiệp vụ & Quy tắc Bảo mật | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/projects/public?keyword=&skill=` | Public / Shared Read Contract | Tìm kiếm và lọc danh sách các dự án đang ở trạng thái `PUBLISHED` theo từ khóa hoặc kỹ năng yêu cầu. | `200 OK` |
| `GET /api/v1/projects/public/:id` | Public / Shared Read Contract | Xem chi tiết thông tin dự án đang ở trạng thái `PUBLISHED`. | `200 OK`<br>`404 Not Found` |
| `GET /api/v1/projects/:id/recruitment-eligibility` | Public / Shared Guard Contract | Kiểm tra bất biến dự án có đang `PUBLISHED` và nằm trong khung giờ `[registrationOpenAt, registrationCloseAt]` để cho phép Sinh viên B nộp đơn ứng tuyển hay không. | `200 OK`<br>`404 Not Found` |
| `POST /api/v1/payments/orders` | `JwtAuthGuard`, `RolesGuard`, `@Roles(ENTERPRISE, LAB_ADMIN, SYSTEM_ADMIN)` | Khởi tạo đơn hàng thanh toán trên PayOS Sandbox (`PAYMENT_MODE=SANDBOX`), sinh `orderCode`, `checkoutUrl`, `qrCode` và chữ ký `HMAC-SHA256`. | `201 Created`<br>`400 Bad Request`<br>`403 Forbidden` |
| `GET /api/v1/payments/orders/:orderCode/return-check` | Public | Kiểm tra trạng thái đơn hàng khi trình duyệt redirect về; tuyệt đối không tự chuyển sang `PAID` nếu chưa có Webhook (`DEC-04`). | `200 OK`<br>`404 Not Found` |
| `POST /api/v1/payments/webhooks/payos` | Public Webhook (Xác thực HMAC-SHA256) | Xác thực chữ ký `HMAC-SHA256`, kiểm tra khóa chống trùng `idempotencyKey`, chuyển đơn sang `PAID` và trả về `idempotentReplay: true` nếu gọi lặp. | `200 OK`<br>`400 Bad Request` |

---

## 3. Kết quả Kiểm thử Tự động Ngày D9 (`TC-LAB-03`, `TC-FIN-SPIKE-01`, `TC-FIN-SPIKE-02`)

| Mã Test Case | Kịch bản kiểm thử (Given / When / Then) | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :---: |
| **TC-LAB-03** | *Given* Dự án đã `APPROVED`, *When* Lab Admin thực hiện chuỗi `Publish -> Unpublish -> Re-Publish -> Close Recruitment` và gọi API `recruitment-eligibility`, *Then* cờ `isOpenForApplications` bật/tắt chính xác theo từng trạng thái. | `200 OK` + Bất biến trạng thái chính xác 100% | **PASS** |
| **TC-FIN-SPIKE-01** | *Given* Đơn thanh toán PayOS Sandbox vừa tạo (`PENDING_PAYMENT`), *When* trình duyệt gọi `GET /return-check` trước khi có Webhook, *Then* trạng thái vẫn giữ nguyên `PENDING_PAYMENT`. | `200 OK` + `status === 'PENDING_PAYMENT'` | **PASS** |
| **TC-FIN-SPIKE-02a** | *Given* Payload Webhook có chữ ký HMAC bị thay đổi trái phép, *When* gửi tới `POST /api/v1/payments/webhooks/payos`, *Then* hệ thống từ chối ngay lập tức. | `400 Bad Request` (`INVALID_PAYOS_SIGNATURE`) | **PASS** |
| **TC-FIN-SPIKE-02b** | *Given* Payload Webhook có chữ ký HMAC-SHA256 hợp lệ được gửi 2 lần liên tiếp (Replay), *When* xử lý tại Backend, *Then* lần 1 chuyển đơn sang `PAID`, lần 2 trả `200 OK` với `idempotentReplay: true`. | `200 OK` + Không xử lý trùng giao dịch | **PASS** |

---

## 4. Điểm chốt Cuối Ngày D9 & Chuẩn bị Cổng Nghiệm thu Sprint 1 (MVP Gate D10)

- [x] **Hoàn tất trọn vẹn phạm vi Kỹ thuật Sprint 1 của Sinh viên A:** Từ `REQ-AUTH-01` (D5) $\rightarrow$ `REQ-ENT-01` (D6) $\rightarrow$ `REQ-ENT-02` (D7) $\rightarrow$ `REQ-LAB-01` (D8–D9) và Spike thành công PayOS Sandbox + Webhook HMAC.
- [x] **Sẵn sàng cho Ngày D10 (Sprint 1 Review & MVP Gate 1):** Tích hợp kiểm thử End-to-End toàn luồng Giai đoạn 1 và đóng cổng nghiệm thu Sprint 1.

---

## 5. Phần Sinh viên B — Trạng thái đơn ứng tuyển (`REQ-TAL-03`)

### Đầu ra

- Candidate page `/talent/applications` đọc `GET /api/v1/talent/me/applications` với Auth token; backend chỉ truy xuất theo JWT subject.
- Hiển thị project, ngày gửi, trạng thái application và nút rút khi còn `SUBMITTED`, `UNDER_REVIEW` hoặc `INTERVIEW`.
- Nút làm mới giúp Talent kiểm tra quyết định mới; quyết định ACCEPT/REJECT vẫn do Mentor được phân công và chưa được triển khai ở D9 (theo lịch ở D11).
- Khi Project đã đóng/ẩn khỏi public list, Talent vẫn xem status history và thông tin project summary ở hồ sơ ứng tuyển; public listing vẫn ẩn project.

### Kiểm thử / bằng chứng

| Test ID | Kịch bản | Kết quả |
|---|---|---|
| `TC-B-APP-STATUS-01` | Talent chỉ xem application của mình; test đối chiếu profile/app list owner theo JWT. | **PASS** |
| `TC-B-APP-STATUS-02` | Application history có trạng thái ban đầu và transition `WITHDRAWN`; list vẫn truy xuất Project summary sau khi đóng tuyển. | **PASS** |
| `TC-B-APP-STATUS-03` | Người dùng không phải Talent gọi endpoint application bị từ chối ở server. | **PASS** |

Bằng chứng: `apps/web/src/features/talent/TalentApplicationsPage.tsx`, `apps/api/src/applications/*`, `apps/api/test/applications.e2e-spec.ts`. Project summary cho application được giới hạn ở `ProjectsService.getApplicationProjectSummary`; không trả full proposal cho candidate status view.

## 6. Cùng chốt D9 — A + B

- [x] A cung cấp public discovery, project detail, recruitment eligibility và publish/unpublish/close; B dùng đúng các contract đó.
- [x] B hoàn thành D7 discovery, D8 submit/withdraw Application và D9 candidate status view; không ghi/xây project lifecycle của A.
- [x] API tests bao phủ visibility, filter, active duplicate, đóng tuyển, actor ownership và withdraw history; Web production build pass.
- [ ] Mentor review/accept/reject được giữ cho D11; hiện Application status chỉ có `SUBMITTED`/`WITHDRAWN` từ các flow B đã triển khai.
- [ ] Application runtime/data và Project runtime hiện in-memory; SQL migration chưa được áp dụng vào PostgreSQL. Stack persistence và migration runner còn cần chốt theo ADR-06 `pnpm + Prisma`.

**Kết luận D9:** Các lát cắt A/B có thể tích hợp qua HTTP/API contracts và test E2E. D9 logic/UI đã hoàn tất ở mức hiện tại; chưa đánh dấu toàn bộ sprint persistence hoặc Gate D10 là pass chỉ dựa trên các test in-memory.