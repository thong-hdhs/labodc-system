# Ngày D2 — Workshop Luồng Nghiệp vụ, Kiểm tra Hạ tầng & Decision Log (Sinh viên A)

> **Người phụ trách:** Sinh viên A (Owner miền Auth, Enterprise, Lab Admin, System Admin, Project Lifecycle, Finance/PayOS & Hạ tầng)  
> **Giai đoạn:** Giai đoạn 0 — Khởi động và chốt baseline (Ngày D2)  
> **Đầu vào:** Danh sách Requirement IDs và phản hồi câu hỏi PO từ `day1.md`.  
> **Đầu ra:** Sơ đồ chi tiết 4 luồng nghiệp vụ miền A, Nhật ký quyết định (Decision Log) và Biên bản xác nhận quyền truy cập tài khoản/hạ tầng.

---

## 1. Sơ đồ 4 Luồng Nghiệp vụ Cốt lõi của Sinh viên A

### 1.1. Luồng A1: Xác thực Doanh nghiệp & Đề xuất $\rightarrow$ Xét duyệt $\rightarrow$ Công bố Dự án (`REQ-ENT-01`, `REQ-ENT-02`, `REQ-LAB-01`)

```mermaid
sequenceDiagram
    autonumber
    actor ENT as Doanh nghiệp (Enterprise)
    participant WEB as React Web Portal
    participant API as NestJS Backend (A)
    participant DB as PostgreSQL / Redis / ES
    actor LAB as Lab Administrator

    ENT->>WEB: Đăng ký & Cập nhật Hồ sơ Doanh nghiệp (MST, Pháp nhân)
    WEB->>API: POST /api/v1/enterprises/profile
    API->>DB: Lưu trạng thái PENDING_VERIFICATION
    LAB->>API: PATCH /api/v1/lab-admin/enterprises/:id/verify
    API->>DB: Cập nhật VERIFIED + Ghi Audit Log

    ENT->>WEB: Tạo bản nháp Đề xuất dự án (Draft)
    WEB->>API: POST /api/v1/projects/proposals (status = DRAFT)
    ENT->>WEB: Bấm Gửi đề xuất (Submit)
    WEB->>API: POST /api/v1/projects/proposals/:id/submit
    API->>DB: Kiểm tra Enterprise == VERIFIED -> Chuyển SUBMITTED

    LAB->>WEB: Xem Hàng đợi xét duyệt (Lab Review Queue)
    alt Yêu cầu bổ sung thông tin (Request More Info)
        LAB->>API: POST /api/v1/lab-admin/proposals/:id/request-info (reason_code, reason_note)
        API->>DB: Chuyển trạng thái -> CHANGES_REQUESTED + Audit Log
        ENT->>API: Sửa đề xuất & Submit lại -> SUBMITTED
    else Từ chối đề xuất (Reject)
        LAB->>API: POST /api/v1/lab-admin/proposals/:id/reject (reason_code, reason_note)
        API->>DB: Chuyển trạng thái -> REJECTED + Audit Log
    else Phê duyệt đề xuất (Approve)
        LAB->>API: POST /api/v1/lab-admin/proposals/:id/approve
        API->>DB: Chuyển trạng thái -> APPROVED + Khởi tạo khung Project Budget
        LAB->>API: POST /api/v1/lab-admin/projects/:id/publish (open_at, close_at)
        API->>DB: Chuyển trạng thái -> PUBLISHED + Đồng bộ Elasticsearch & Xóa cache Redis
    end
```

---

### 1.2. Luồng A2: Yêu cầu Đổi phạm vi (Scope Change) hoặc Hủy dự án (`REQ-ENT-03`, `REQ-LAB-02`)

```mermaid
sequenceDiagram
    autonumber
    actor ENT as Doanh nghiệp (Enterprise)
    participant API as NestJS Backend (A)
    participant DB as PostgreSQL (Project & Ledger)
    actor MEN as Mentor (Tham vấn)
    actor LAB as Lab Administrator

    ENT->>API: POST /api/v1/projects/:id/change-requests (type: SCOPE_CHANGE | CANCEL, reason, impact)
    API->>DB: Kiểm tra trạng thái dự án hợp lệ -> Lưu PENDING_LAB_REVIEW
    opt Nếu dự án đang IN_PROGRESS
        MEN->>API: Ghi nhận đánh giá khối lượng công việc đã thực hiện (Mentor Assessment Note)
    end
    LAB->>API: Xem xét yêu cầu đổi phạm vi / hủy dự án
    alt Từ chối yêu cầu (Reject Request)
        LAB->>API: POST /api/v1/lab-admin/change-requests/:reqId/reject (reason_note)
        API->>DB: Chuyển Request -> REJECTED (Giữ nguyên trạng thái Project)
    else Phê duyệt Đổi phạm vi (Approve Scope Change)
        LAB->>API: POST /api/v1/lab-admin/change-requests/:reqId/approve
        API->>DB: Tăng scope_version, cập nhật mô tả/ngân sách dự án + Ghi Audit Trail
    else Phê duyệt Hủy dự án (Approve Cancellation)
        LAB->>API: POST /api/v1/lab-admin/change-requests/:reqId/approve-cancel
        API->>DB: Chuyển Project -> CANCELLED + Khóa ứng tuyển/nhiệm vụ mới
        API->>DB: Quyết toán theo giai đoạn đã nghiệm thu (ưu tiên thu hồi tạm ứng Lab) & ghi nhận REFUND phần dư
    end
```

---

### 1.3. Luồng A3: Thanh toán PayOS $\rightarrow$ Xác thực Webhook $\rightarrow$ Sổ cái Ledger $\rightarrow$ Phân bổ 70/20/10 (`REQ-FIN-01`, `REQ-FIN-02`, `REQ-FIN-03`)

```mermaid
sequenceDiagram
    autonumber
    actor ENT as Doanh nghiệp
    participant API as NestJS Payment Module (A)
    participant PAYOS as Cổng PayOS (Sandbox/Prod)
    participant DB as PostgreSQL (Payment & Immutable Ledger)
    actor LAB as Lab Administrator

    ENT->>API: POST /api/v1/payments/orders (projectId, milestoneId, idempotencyKey)
    API->>DB: Tạo PaymentOrder (status = PENDING_PAYMENT)
    API->>PAYOS: Gọi API tạo Payment Link (kèm orderCode, checksum)
    PAYOS-->>ENT: Hiển thị QR / Checkout Page (Tuyệt đối không dùng redirect URL để xác nhận PAID)

    PAYOS->>API: POST /api/v1/payments/webhooks/payos (payload + signature)
    API->>API: Xác thực HMAC-SHA256 Checksum & Kiểm tra Idempotency (webhook_event_id)
    alt Chữ ký sai hoặc Event đã xử lý trước đó
        API-->>PAYOS: Trả về 200/400 Idempotent Response (Không ghi trùng Ledger)
    else Hợp lệ & Thanh toán thành công
        API->>DB: Transaction: Cập nhật PaymentOrder = PAID_ESCROW + Ghi bút toán CREDIT vào Ledger
        API-->>PAYOS: 200 OK
    end

    Note over LAB,DB: Sau khi Giai đoạn/Báo cáo được nghiệm thu (Phase Acceptance)
    LAB->>API: POST /api/v1/finance/allocations/:paymentId/approve
    API->>DB: Tính FLOOR: 70% Team, 20% Mentor, Phần còn lại (10% + lẻ làm tròn) -> Lab
    API->>DB: Ghi 3 bút toán phân bổ bất biến vào Ledger (status = ALLOCATED_70_20_10)
```

---

### 1.4. Luồng A4: Chậm thanh toán (Delayed Payment) $\rightarrow$ Lab tạm ứng (Hybrid Fund) $\rightarrow$ Thu hồi nợ tạm ứng (`REQ-FIN-04`, `REQ-FIN-05`)

```mermaid
sequenceDiagram
    autonumber
    participant CRON as Scheduler / Admin Check (A)
    participant API as NestJS Finance Module (A)
    participant DB as PostgreSQL (Advance & Ledger)
    actor LAB as Lab Administrator
    actor ENT as Doanh nghiệp

    CRON->>API: Kiểm tra các đợt thanh toán quá hạn > 7 ngày (due_date + 7d < now)
    API->>DB: Chuyển trạng thái đợt thanh toán -> OVERDUE (DELAYED_PAYMENT)
    API->>ENT: Gửi thông báo nhắc nợ (Payment Delay Notice)

    LAB->>API: POST /api/v1/finance/advances (Yêu cầu Lab tạm ứng <= 90% đợt thanh toán)
    LAB->>API: POST /api/v1/finance/advances/:advId/approve (Đính kèm mã chứng từ nội bộ)
    API->>DB: Ghi bút toán ADVANCE_DISBURSED từ Quỹ dự phòng Lab -> Phân bổ 70% Team & 20% Mentor đúng hạn

    Note over ENT,DB: Khi Doanh nghiệp thanh toán bù qua PayOS
    ENT->>API: Thanh toán đợt OVERDUE thành công qua Webhook PayOS
    API->>DB: Tự động tạo bút toán ADVANCE_REPAYMENT hoàn trả Quỹ dự phòng Lab trước (90%)
    API->>DB: Ghi nhận 10% còn lại vào Lab Share + Cập nhật Transparency Report
```

---

## 2. Nhật ký Quyết định Nghiệp vụ & Kỹ thuật (Decision Log — Chốt Ngày D2)

| Mã QĐ | Ngày chốt | Hạng mục quyết định | Nội dung quyết định chính thức | Người phê duyệt | Ảnh hưởng tới Module của A |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **DEC-01** | D2 | Nguồn lịch chuẩn của dự án | Lấy file `07-phan-cong-tung-ngay.md` làm nguồn chuẩn duy nhất cho tiến độ từng ngày từ D1–D40. | PO & Nhóm A+B | Toàn bộ lộ trình của A |
| **DEC-02** | D2 | Ranh giới Shared Project vs Application | **A** sở hữu toàn bộ bảng `projects`, `project_proposals`, `project_change_requests` và trạng thái vòng đời dự án. **B** sở hữu bảng `applications` và chỉ đọc trạng thái dự án qua contract của A. | Sinh viên A & B | `apps/api/src/projects` |
| **DEC-03** | D2 | Quy tắc xác thực Doanh nghiệp trước khi gửi đề xuất | Doanh nghiệp mới đăng ký (`PENDING_VERIFICATION`) được tạo nháp `DRAFT` nhưng phải được Lab Admin duyệt `VERIFIED` mới được gọi API `submit` đề xuất. | PO / Lab Admin | `REQ-ENT-01`, `REQ-ENT-02` |
| **DEC-04** | D2 | Không tin cậy Client Redirect khi thanh toán | Trạng thái thanh toán `PAID_ESCROW` chỉ được phép cập nhật thông qua **PayOS Webhook đã xác thực chữ ký HMAC-SHA256** hoặc API đối soát server-to-server của Admin. | PO / Finance | `REQ-FIN-01`, `REQ-FIN-02` |
| **DEC-05** | D2 | Quy tắc làm tròn $70/20/10$ trên sổ cái VNĐ | Mọi số tiền lưu kiểu `BIGINT` (đơn vị: VNĐ). Chia $\text{team} = \lfloor \text{net} \times 0.70 \rfloor$, $\text{mentor} = \lfloor \text{net} \times 0.20 \rfloor$, $\text{lab} = \text{net} - \text{team} - \text{mentor}$. Không để thất thoát hoặc lệch $1\text{ VNĐ}$ trên sổ cái. | PO / Finance | `REQ-FIN-03` |
| **DEC-06** | D2 | Cơ chế Quỹ tạm ứng (Hybrid Fund Support) | Xử lý dưới dạng Sổ cái tạm ứng nội bộ (`Advance Ledger`) có phê duyệt của Lab Admin (tối đa $90\%$ đợt trễ hạn $> 7$ ngày) và tự động khấu trừ hoàn quỹ Lab khi doanh nghiệp đóng tiền bù. | PO / Finance | `REQ-FIN-04` |
| **DEC-07** | D2 | Chế độ cổng PayOS khi nghiệm thu D40 | Nghiệm thu đầy đủ trên **PayOS Sandbox**. Trên Production giữ biến môi trường `PAYMENT_MODE=SANDBOX` cho đến khi có biên bản sign-off tài chính riêng. | PO / Finance | `REQ-FIN-01`..`04` |

---

## 3. Biên bản Kiểm tra Quyền truy cập Hạ tầng & Tài khoản Dịch vụ (Cuối Ngày D2)

| STT | Dịch vụ / Tài khoản | Mục đích sử dụng | Trạng thái cuối D2 | Owner quản lý |
| :---: | :--- | :--- | :---: | :---: |
| 1 | **GitHub Repository & Projects** | Quản lý source code Monorepo (`apps/api`, `apps/web`, `apps/mobile`), CI/CD và Kanban Board. | **Đã sẵn sàng (Verified)** | Sinh viên A (Admin) & B |
| 2 | **PayOS Sandbox Account** | Cấp `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` để spike và tích hợp D9/D15. | **Đã nhận khóa Sandbox** | Sinh viên A |
| 3 | **Cloudinary Account** | Lưu trữ avatar, tài liệu biểu mẫu Excel/Docs và portfolio. | **Đã nhận khóa API** | A (Hạ tầng) & B (Workflow) |
| 4 | **AWS Staging / Production & Domain** | Triển khai Docker, PostgreSQL, Redis, Elasticsearch và cấu hình HTTPS. | **Đã xác nhận IAM & Subdomain** | Sinh viên A (Server/DB Owner) |
| 5 | **Biểu mẫu Excel/Docs chuẩn của Lab** | Dùng cho cấu hình danh mục mẫu của System Admin (D14) và luồng task/report của B. | **Đã nhận bộ mẫu v1.0** | A (Danh mục) & B (Sử dụng) |

---

## 4. Kết quả Cùng chốt Cuối Ngày D2 (Checkpoint A + B)

- [x] PO đã xác nhận toàn bộ sơ đồ luồng nghiệp vụ của Sinh viên A và Sinh viên B; không còn luồng nào thiếu người phê duyệt.
- [x] Đã kiểm tra thực tế quyền truy cập vào các tài khoản dịch vụ (Git, AWS, PayOS Sandbox, Cloudinary) — không có blocker cấp dự án ở cổng D2.