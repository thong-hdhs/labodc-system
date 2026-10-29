# Ngày D3 — State Machines, Ma trận Phân quyền, Acceptance Criteria & API Contracts (Sinh viên A)

> **Người phụ trách:** Sinh viên A (Owner miền Auth, Enterprise, Lab Admin, System Admin, Project Lifecycle, Finance/PayOS & Hạ tầng)  
> **Giai đoạn:** Giai đoạn 0 — Khởi động và chốt baseline (Ngày D3)  
> **Đầu vào:** Sơ đồ luồng nghiệp vụ và Decision Log từ `day2.md`.  
> **Đầu ra:** State Machines miền A, Ma trận phân quyền RBAC/Ownership server-side, Acceptance Criteria (Given/When/Then), Shared Database/API Contracts và NFR Test Charter.

---

## 1. Máy Trạng Thái (State Machines) Miền Nghiệp vụ của Sinh viên A

### 1.1. State Machine 1: Vòng đời Đề xuất & Dự án (`Project & Proposal Lifecycle`)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Doanh nghiệp tạo mới
    DRAFT --> SUBMITTED : Doanh nghiệp gửi duyệt (Yêu cầu Enterprise == VERIFIED)
    SUBMITTED --> CHANGES_REQUESTED : Lab Admin yêu cầu bổ sung (kèm reason_code & note)
    CHANGES_REQUESTED --> SUBMITTED : Doanh nghiệp cập nhật & gửi lại
    SUBMITTED --> REJECTED : Lab Admin từ chối (kèm reason_code & note)
    SUBMITTED --> APPROVED : Lab Admin phê duyệt đề xuất
    APPROVED --> PUBLISHED : Lab Admin công bố (mở nhận đơn ứng tuyển)
    PUBLISHED --> UNPUBLISHED : Lab Admin tạm ẩn dự án
    UNPUBLISHED --> PUBLISHED : Lab Admin mở lại công bố
    PUBLISHED --> RECRUITMENT_CLOSED : Đóng nhận đơn / Đủ thành viên
    RECRUITMENT_CLOSED --> IN_PROGRESS : Đã lập nhóm & gán Mentor (Phối hợp module B)
    IN_PROGRESS --> COMPLETED : Lab Admin nghiệm thu hoàn tất dự án
    APPROVED --> CANCELLED : Phê duyệt yêu cầu Hủy dự án
    PUBLISHED --> CANCELLED : Phê duyệt yêu cầu Hủy dự án
    IN_PROGRESS --> CANCELLED : Phê duyệt yêu cầu Hủy dự án & Quyết toán quỹ
```

**Quy tắc bất biến (State Invariants) kiểm tra tại Backend của A:**
- Doanh nghiệp chỉ được phép `PATCH/PUT` nội dung đề xuất khi trạng thái hiện tại là `DRAFT` hoặc `CHANGES_REQUESTED`.
- Module `Talent/Application` của Sinh viên B chỉ được phép truy vấn danh sách dự án công khai hoặc tạo đơn ứng tuyển khi `project.status === 'PUBLISHED'` và thời gian hiện tại $t$ thỏa mãn $\text{registration\_open\_at} \le t \le \text{registration\_close\_at}$.

---

### 1.2. State Machine 2: Yêu cầu Đổi phạm vi / Hủy dự án (`Change / Cancellation Request`)

| Trạng thái nguồn | Hành động (Action) | Actor được phép | Trạng thái đích | Tác động phụ (Side Effects) |
| :--- | :--- | :--- | :--- | :--- |
| *(Khởi tạo)* | `createChangeRequest` | `ENTERPRISE` (Chủ dự án) | `PENDING_LAB_REVIEW` | Kiểm tra dự án đang `PUBLISHED` hoặc `IN_PROGRESS` (hoặc `APPROVED` nếu xin hủy); lưu vết người tạo. |
| `PENDING_LAB_REVIEW` | `withdrawRequest` | `ENTERPRISE` (Chủ dự án) | `WITHDRAWN` | Đóng yêu cầu khi Lab chưa xử lý. |
| `PENDING_LAB_REVIEW` | `approveRequest` | `LAB_ADMIN` | `APPROVED` | Nếu là `SCOPE_CHANGE`: tăng `scope_version`, cập nhật mô tả/ngân sách. Nếu là `CANCEL`: chuyển `Project.status = CANCELLED` và kích hoạt quy trình quyết toán/hoàn tiền. |
| `PENDING_LAB_REVIEW` | `rejectRequest` | `LAB_ADMIN` | `REJECTED` | Bắt buộc nhập `rejection_reason`; giữ nguyên trạng thái dự án. |

---

### 1.3. State Machine 3: Giao dịch Thanh toán, Sổ cái Phân bổ 70/20/10 & Quỹ Tạm ứng (`Payment, Allocation & Advance`)

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED : Khởi tạo đợt thanh toán theo Ngân sách dự án
    SCHEDULED --> PENDING_PAYMENT : Doanh nghiệp tạo lệnh PayOS (Payment Intent)
    PENDING_PAYMENT --> PAID_ESCROW : Webhook PayOS báo thành công (Xác thực HMAC + Idempotent)
    PENDING_PAYMENT --> FAILED : Thanh toán lỗi / Hết hạn link
    PENDING_PAYMENT --> CANCELLED : Doanh nghiệp hủy lệnh thanh toán
    FAILED --> PENDING_PAYMENT : Doanh nghiệp tạo lệnh thanh toán lại (Retry)

    SCHEDULED --> OVERDUE : Quá hạn > 7 ngày chưa thanh toán
    OVERDUE --> ADVANCE_REQUESTED : Lab Admin tạo đề xuất tạm ứng (<= 90%)
    ADVANCE_REQUESTED --> ADVANCE_DISBURSED : Lab Admin phê duyệt tạm ứng (Chi trả 70% Team + 20% Mentor)
    ADVANCE_DISBURSED --> ADVANCE_REPAID_AND_ALLOCATED : Doanh nghiệp thanh toán bù qua PayOS (Thu hồi 90% về Quỹ Lab + 10% Lab Share)

    PAID_ESCROW --> ALLOCATED_70_20_10 : Lab Admin duyệt nghiệm thu & phân bổ (70% Team / 20% Mentor / 10% Lab)
    PAID_ESCROW --> REFUNDED : Dự án hủy trước khi thực hiện giai đoạn
```

---

## 2. Ma trận Phân quyền Server-side (RBAC & Ownership Matrix của Sinh viên A)

| Tài nguyên / Hành động API | `SYSTEM_ADMIN` | `LAB_ADMIN` | `ENTERPRISE` | `MENTOR` | `TALENT_LEADER` | `TALENT` | Quy tắc kiểm tra Ownership ở Backend Guard |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| Quản lý cấu hình hệ thống, Roles, khóa User, danh mục mẫu Excel | **ALLOW** | DENY | DENY | DENY | DENY | DENY | Chỉ `SYSTEM_ADMIN` |
| Đăng ký / Cập nhật Hồ sơ Doanh nghiệp | DENY | Read/Verify | **ALLOW (Own)** | DENY | DENY | DENY | `enterprise.owner_user_id === currentUser.id` |
| Tạo / Sửa nháp / Gửi Đề xuất dự án (Proposal) | DENY | Read All | **ALLOW (Own)** | DENY | DENY | DENY | `project.enterprise_id === currentUser.enterpriseId` |
| Duyệt / Từ chối / Yêu cầu bổ sung / Công bố / Đóng dự án | DENY | **ALLOW** | Read (Own) | Read (Assigned) | Read (Published) | Read (Published) | Chỉ `LAB_ADMIN` được đổi trạng thái xét duyệt |
| Gửi yêu cầu Đổi phạm vi / Hủy dự án | DENY | Read All | **ALLOW (Own)** | Read (Assigned) | DENY | DENY | `project.enterprise_id === currentUser.enterpriseId` |
| Phê duyệt / Từ chối Đổi phạm vi hoặc Hủy dự án | DENY | **ALLOW** | Read (Own) | Comment (Assigned) | DENY | DENY | Chỉ `LAB_ADMIN` |
| Tạo lệnh thanh toán PayOS & Xem lịch sử đóng tiền dự án | DENY | Read All | **ALLOW (Own)** | DENY | DENY | DENY | `project.enterprise_id === currentUser.enterpriseId` |
| Duyệt phân bổ $70/20/10$, Duyệt Tạm ứng & Đối soát Sổ cái | DENY | **ALLOW** | Read (Own) | Read (Own Share) | Read (Team Share) | Read (Own Share) | Chỉ `LAB_ADMIN` được thực thi bút toán phân bổ/tạm ứng |
| Xem Báo cáo minh bạch tài chính (Tổng hợp / Chi tiết dự án) | Read Summary | **ALLOW (All)** | Read (Own Proj) | Read (Assigned) | Read (Assigned) | Read (Assigned) | Tầng chi tiết kiểm tra membership thuộc `project_id` |

---

## 3. Tiêu chí Nghiệm thu (Acceptance Criteria — Given/When/Then) cho các Story của A

1. **`REQ-AUTH-01` (Xác thực JWT & Phân quyền RBAC):**
   - *Given* người dùng có vai trò `TALENT` hoặc `ENTERPRISE` A, *When* gọi trực tiếp API `POST /api/v1/lab-admin/proposals/:id/approve` hoặc truy cập hồ sơ của `ENTERPRISE` B, *Then* Backend trả về `403 Forbidden` (kèm mã lỗi chuẩn), tuyệt đối không lộ dữ liệu và ghi nhận sự kiện vào bảng `audit_logs`.
2. **`REQ-ENT-01` & `REQ-ENT-02` (Hồ sơ Doanh nghiệp & Đề xuất dự án):**
   - *Given* doanh nghiệp mới đăng ký (`PENDING_VERIFICATION`), *When* tạo bản nháp đề xuất thì thành công (`201 Created`), nhưng *When* bấm gửi duyệt (`submit`) khi chưa được Lab xác thực hồ sơ, *Then* Backend từ chối với lỗi `400 Bad Request (ENTERPRISE_NOT_VERIFIED)`.
   - *Given* đề xuất đã ở trạng thái `SUBMITTED` hoặc `APPROVED`, *When* doanh nghiệp gọi API chỉnh sửa nội dung đề xuất, *Then* Backend từ chối `409 Conflict (INVALID_STATE_TRANSITION)`.
3. **`REQ-LAB-01` (Duyệt & Công bố dự án):**
   - *Given* đề xuất đang ở `SUBMITTED`, *When* Lab Admin chọn `REJECT` hoặc `REQUEST_INFO` mà không gửi kèm `reason_code` và `reason_note` có độ dài $\ge 15$ ký tự, *Then* Backend trả về `422 Unprocessable Entity`.
   - *Given* dự án được Lab Admin chuyển sang `PUBLISHED`, *When* hoàn tất transaction, *Then* bản ghi `audit_logs` phải lưu rõ `actor_id`, `old_state`, `new_state`, `timestamp`, đồng thời chỉ mục Elasticsearch được cập nhật và cache Redis của danh sách dự án được xóa.
4. **`REQ-FIN-01` & `REQ-FIN-02` (Thanh toán PayOS & Webhook Idempotency):**
   - *Given* người dùng giả lập gọi URL redirect `GET /payment/success?orderCode=123` trên trình duyệt, *When* chưa có Webhook hợp lệ từ PayOS, *Then* trạng thái đơn hàng vẫn giữ nguyên `PENDING_PAYMENT`.
   - *Given* PayOS gửi cùng một Webhook sự kiện thanh toán thành công 3 lần liên tiếp (retry/replay), *When* Backend xử lý, *Then* chữ ký HMAC được kiểm tra, chỉ tạo **duy nhất 1 bút toán CREDIT** trong bảng `ledger_entries`, và các lần gọi lặp lại trả về `200 OK` an toàn (idempotent).
5. **`REQ-FIN-03` & `REQ-FIN-04` (Chia quỹ 70/20/10 & Quỹ tạm ứng):**
   - *Given* khoản thanh toán $10,000,001\text{ VNĐ}$ được duyệt phân bổ, *When* chạy hàm tính $70/20/10$, *Then* $\text{team\_share} = 7,000,000\text{ VNĐ}$, $\text{mentor\_share} = 2,000,000\text{ VNĐ}$, $\text{lab\_share} = 1,000,001\text{ VNĐ}$ (tổng đúng bằng $10,000,001\text{ VNĐ}$).
   - *Given* dự án đã được Lab tạm ứng $9,000,000\text{ VNĐ}$ (trên đợt thanh toán $10,000,000\text{ VNĐ}$ bị trễ), *When* doanh nghiệp thanh toán bù $10,000,000\text{ VNĐ}$, *Then* hệ thống tự động ghi bút toán thu hồi $9,000,000\text{ VNĐ}$ hoàn trả Quỹ tạm ứng của Lab và cộng $1,000,000\text{ VNĐ}$ vào phần $10\%$ của Lab (không chi trùng lần 2 cho Team/Mentor).

---

## 4. Đặc tả Cơ sở dữ liệu & Shared API Contract (Chốt giữa A và B)

### 4.1. Các bảng Database thuộc quyền sở hữu Migration của Sinh viên A
- **Shared Auth & System (`001_auth_system`):** `users`, `roles`, `user_roles`, `refresh_tokens`, `system_settings`, `excel_templates_catalog`, `audit_logs`.
- **Enterprise & Project Lifecycle (`002_enterprise_projects`):** `enterprises`, `projects` *(gồm cả thông tin proposal và trạng thái vòng đời dự án)*, `project_change_requests`, `project_state_history`.
- **Finance & Ledger (`003_finance_payments`):** `project_budgets`, `payment_milestones`, `payment_orders`, `payment_webhook_events`, `ledger_entries` *(append-only, bất biến)*, `fund_allocations`, `advance_requests`.

### 4.2. Hợp đồng API (Shared Contract) Sinh viên A cung cấp cho Sinh viên B tiêu thụ
1. **Auth Context Payload (trích xuất từ JWT Guard của A):**
   ```json
   {
     "sub": "uuid-user-id",
     "email": "user@uth.edu.vn",
     "roles": ["TALENT", "TALENT_LEADER"],
     "enterpriseId": null
   }
   ```
2. **Project Summary & Visibility Contract (`GET /api/v1/projects/public` & Internal Service Method `ProjectContractService.getProjectStatus(projectId)`):**
   ```json
   {
     "id": "uuid-project-id",
     "code": "PRJ-2026-001",
     "title": "Hệ thống quản lý kho thông minh",
     "status": "PUBLISHED",
     "acceptingApplications": true,
     "registrationOpenAt": "2026-11-01T00:00:00Z",
     "registrationCloseAt": "2026-11-15T23:59:59Z",
     "maxTeamSize": 5,
     "requiredSkills": ["NestJS", "React", "PostgreSQL"],
     "enterprise": {
       "id": "uuid-ent-id",
       "name": "Công ty TNHH Công nghệ ABC",
       "isVerified": true
     }
   }
   ```
3. **Team Fund Pool Contract (`GET /api/v1/finance/projects/:projectId/team-pool` — dùng cho luồng Leader chia quỹ ở D26 của B):**
   ```json
   {
     "projectId": "uuid-project-id",
     "milestoneId": "uuid-milestone-id",
     "totalTeamPoolVnd": 7000000,
     "allocationStatus": "ALLOCATED",
     "isLockedForRedistribution": false
   }
   ```

---

## 5. Điều lệ Kiểm thử Phi chức năng (NFR Test Charter — Phần của A)

| Mã NFR | Chỉ số mục tiêu | Công cụ & Kịch bản đo (Ngày D34) | Điều kiện Pass nghiệm thu |
| :--- | :--- | :--- | :--- |
| **REQ-NFR-01a** | Tải danh sách dự án $< 5\text{s}$ | Dùng `k6` bắn tải vào `GET /api/v1/projects/public?page=1&limit=20&keyword=...` trên tập dữ liệu seed $1,000$ dự án với $200\text{ VUs}$. | Độ trễ phân vị **$P_{95} < 5,000\text{ ms}$** (mục tiêu nội bộ qua Redis/Elasticsearch: $P_{95} < 500\text{ ms}$), tỷ lệ lỗi $< 0.1\%$. |
| **REQ-NFR-01b** | Xử lý thanh toán $< 3\text{s}$ | Dùng `k6` đo thời gian xử lý API tạo lệnh `POST /api/v1/payments/orders` và API xử lý Webhook `POST /api/v1/payments/webhooks/payos`. | Thời gian xử lý nội bộ tại Backend + DB Transaction đạt **$P_{95} < 3,000\text{ ms}$**, đảm bảo $0\%$ lỗi race condition / duplicate ledger. |
| **REQ-NFR-02** | $99.0\%$ Uptime & $200\text{--}300\text{ VUs}$ | Chạy bài test chịu tải hỗn hợp $200\text{--}300\text{ VUs}$ trong 10 phút liên tục; theo dõi `/api/v1/health` (check DB, Redis, ES). | Không sập container, CPU/Memory ổn định, Uptime trong cửa sổ đo đạt $\ge 99.0\%$. |
| **REQ-NFR-03** | Bảo mật & Phân quyền Server-side | Bộ Integration Tests tự động bằng Jest/Supertest kiểm tra toàn bộ ma trận quyền ở Mục 2 và kiểm tra log redaction. | **$100\%$ Negative Auth Tests Pass**; không lộ token, mật khẩu hay `PAYOS_CHECKSUM_KEY` trong log/response. |

---

## 6. Kết quả Cùng chốt Cuối Ngày D3 (Checkpoint A + B)

- [x] Đã chốt Auth/Role JWT contract và Project/Application shared contract giữa Sinh viên A và Sinh viên B.
- [x] Đã thống nhất quy tắc Migration: mỗi người tạo file migration có prefix riêng (`001_a_...`, `002_b_...`), không sửa trực tiếp vào file migration của người kia.

---

## 7. State Machines, RBAC, Acceptance Criteria và Contract — Sinh viên B

> **Người phụ trách:** Sinh viên B (Owner miền Talent, Mentor, Team/Leader, Task/Template usage, Report/Evaluation và Flutter client).
> **Đầu vào:** Các luồng/DEC-B01..DEC-B07 được chốt ở [day2.md](./day2.md), Auth/Project/Finance contracts của A.
> **Trạng thái quyết định:** Các luồng đã được PO xác nhận theo D2 theo xác nhận của người dùng; bộ tài liệu làm việc không yêu cầu metadata tên/ngày. Các chi tiết liệt kê là câu hỏi mở sẽ không được coi là baseline cho đến khi được xác nhận.

### 7.1. State Machine B1: Application

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : Talent gửi đơn khi project đang nhận đơn
    SUBMITTED --> UNDER_REVIEW : Mentor được phân công bắt đầu xét
    SUBMITTED --> WITHDRAWN : Talent rút đơn trước khi được chấp nhận
    UNDER_REVIEW --> INTERVIEW : Project bật yêu cầu phỏng vấn
    UNDER_REVIEW --> ACCEPTED : Mentor quyết định không cần phỏng vấn và chấp nhận
    UNDER_REVIEW --> REJECTED : Mentor từ chối
    UNDER_REVIEW --> WITHDRAWN : Talent rút đơn trước khi được chấp nhận
    INTERVIEW --> ACCEPTED : Mentor quyết định chấp nhận
    INTERVIEW --> REJECTED : Mentor từ chối
    INTERVIEW --> WITHDRAWN : Talent rút đơn trước khi được chấp nhận
```

**Invariants:**

- Chỉ Talent hiện tại tạo hoặc đọc đơn của mình; mọi hành động review yêu cầu Mentor được phân công hoặc Lab Admin theo quyền.
- Tạo đơn chỉ hợp lệ khi Project Contract của A trả về `PUBLISHED`, `acceptingApplications=true` và thời gian nằm trong registration window.
- Một Talent chỉ có tối đa một đơn không kết thúc cho mỗi project; unique constraint/idempotency phải bảo vệ trường hợp request đồng thời.
- Interview là tùy chọn theo cấu hình project; Mentor được phân công là người quyết định cuối, Lab Admin giám sát và xử lý ngoại lệ.
- `WITHDRAWN`, `ACCEPTED` và `REJECTED` là trạng thái cuối; không cho phép rút sau khi đã `ACCEPTED`.
- Transition lưu actor, thời gian, trạng thái trước/sau và reason/note khi policy yêu cầu.

### 7.2. State Machine B2: Mentor Invitation, Team và Leader

```mermaid
stateDiagram-v2
    [*] --> INVITED : Lab gửi lời mời Mentor vào Project
    INVITED --> ACCEPTED : Mentor nhận lời
    INVITED --> DECLINED : Mentor từ chối
    INVITED --> EXPIRED : Hết hạn lời mời theo policy

    state TeamLifecycle {
        [*] --> FORMING : Tạo Team từ application ACCEPTED
        FORMING --> ACTIVE : Gán Mentor/Leader và kích hoạt
        ACTIVE --> COMPLETED : Project/team hoàn tất
        ACTIVE --> DISBANDED : Lab phê duyệt đóng/tách Team
    }

    state LeaderAppointment {
        [*] --> NOMINATION : Mentor chỉ định hoặc team bầu theo policy
        NOMINATION --> CONFIRMED : Mentor xác nhận
        CONFIRMED --> REPLACED : Thay Leader có audit
    }
```

**Invariants:** member phải có application `ACCEPTED`; giới hạn quy mô lấy từ Project Contract; mỗi Team chỉ có Leader hiện hành theo policy; Mentor chỉ được thao tác trên project được phân công; mọi thay đổi membership/Leader có audit. Policy về team size, election quorum, thời hạn invitation và quyền đại diện là câu hỏi cần PO xác nhận.

### 7.3. State Machine B3: Task/Milestone và template

```mermaid
stateDiagram-v2
    [*] --> PLANNED : Mentor tạo task/milestone theo template
    PLANNED --> ASSIGNED : Gán người hoặc Team
    ASSIGNED --> IN_PROGRESS : Người nhận bắt đầu
    IN_PROGRESS --> SUBMITTED_FOR_REVIEW : Nộp kết quả/tài liệu
    SUBMITTED_FOR_REVIEW --> CHANGES_REQUESTED : Mentor yêu cầu chỉnh sửa
    CHANGES_REQUESTED --> IN_PROGRESS : Thành viên cập nhật
    SUBMITTED_FOR_REVIEW --> COMPLETED : Mentor xác nhận hoàn thành
    PLANNED --> CANCELLED : Mentor/Lab hủy theo quyền
    ASSIGNED --> CANCELLED : Mentor/Lab hủy theo quyền
    IN_PROGRESS --> CANCELLED : Mentor/Lab hủy theo quyền
```

Lab Excel/Docs là mẫu chuẩn và file/version phải được nhận diện khi dùng. Ứng dụng ghi nhận metadata, assignment, trạng thái và tài liệu liên quan; không kết nối Jira/Trello. Các trạng thái task và hành động tương ứng cần được PO/Mentor xác nhận cùng template v1.0.

### 7.4. State Machine B4: Report, Evaluation và Team Redistribution

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Mentor tạo báo cáo kỳ / Leader tạo báo cáo Team
    DRAFT --> SUBMITTED : Gửi báo cáo
    SUBMITTED --> IN_REVIEW : Reviewer được phân công tiếp nhận
    IN_REVIEW --> CHANGES_REQUESTED : Reviewer trả lại kèm nhận xét
    CHANGES_REQUESTED --> SUBMITTED : Tác giả nộp lại
    IN_REVIEW --> APPROVED : Reviewer duyệt

    state Evaluation {
        [*] --> EVALUATION_DRAFT
        EVALUATION_DRAFT --> EVALUATION_FINAL : Mentor chốt đánh giá
        EVALUATION_FINAL --> EVALUATION_SUPERSEDED : Sửa theo quy trình có audit
    }

    state RedistributionProposal {
        [*] --> REDIST_DRAFT : Leader lập đề xuất từ Team Pool
        REDIST_DRAFT --> REDIST_SUBMITTED : Gửi Mentor
        REDIST_SUBMITTED --> MENTOR_CONFIRMED : Mentor xác nhận
        REDIST_SUBMITTED --> CHANGES_REQUESTED : Mentor trả lại
        MENTOR_CONFIRMED --> READY_FOR_FINANCE : Chuyển Finance API theo policy
    }
```

**Ranh giới tiền:** B quản lý workflow và proposal; không tạo bút toán Ledger. A cung cấp Team Pool contract; việc ghi nhận, kiểm duyệt tài chính cuối cùng và thanh toán thuộc Finance/Ledger của A theo rulebook. Có cần bước Lab Admin phê duyệt cuối sau Mentor confirmation hay không vẫn cần PO/Finance xác nhận nếu chưa được rulebook quy định.

### 7.5. Ma trận quyền miền B (Server-side)

| Tài nguyên / hành động | Talent | Talent Leader | Mentor được phân công | Lab Admin | Enterprise |
|---|---|---|---|---|---|
| Hồ sơ Talent | Đọc/sửa hồ sơ của mình | Đọc hồ sơ của mình | Đọc hồ sơ ứng viên thuộc project được giao | Quản lý theo quyền Lab | Chỉ đọc trường/portfolio được phép của người ứng tuyển vào project mình |
| Application | Tạo/xem/rút đơn của mình trước ACCEPTED | Như Talent; không thay đổi đơn thành viên khác | Xem/review/đưa ra ACCEPTED hoặc REJECTED trong project được giao | Giám sát/xem và xử lý ngoại lệ | Không xem đơn/hồ sơ ứng viên, trừ khi có quyết định nghiệp vụ riêng |
| Team/Membership | Xem Team mình | Xem/thao tác nghiệp vụ được cấp trong Team mình | Xem/quản lý Team thuộc project được giao | Xem/quản lý theo quyền Lab | Chỉ xem tiến độ/tổng hợp được phê duyệt |
| Leader appointment | Không tự bổ nhiệm | Có thể tham gia bầu nếu policy bật | Đề cử/xác nhận theo policy | Giám sát và xử lý ngoại lệ | DENY |
| Task/Template usage | Xem task được giao; cập nhật/nộp phần mình | Xem/cập nhật task Team theo quyền | Tạo/giao/review task thuộc project | Xem/quản trị theo quyền | Không xem file nội bộ, trừ deliverable đã được chấp thuận |
| Report | Xem báo cáo mình có quyền | Tạo/gửi báo cáo nhóm theo quyền | Tạo/gửi report, review theo assignment | Review/giám sát theo quyền | Xem báo cáo nghiệm thu/tổng hợp của project mình |
| Evaluation | Chỉ xem đánh giá đã chốt của mình | Chỉ xem đánh giá cá nhân của mình | Tạo/chốt đánh giá trong project được giao | Xem theo quyền quản trị | Chỉ xem đánh giá tổng hợp, không xem ghi chú cá nhân nội bộ |
| Redistribution proposal | DENY | Tạo/xem đề xuất Team mình theo policy | Xem/xác nhận/trả lại proposal Team được giao | Giám sát/finance approval nếu rulebook yêu cầu | DENY |

Mọi quyền được kiểm tra tại backend, không chỉ ẩn nút trên client. Tài khoản không có assignment/membership tương ứng phải bị từ chối và không được dò existence của resource ngoài phạm vi.

### 7.6. Acceptance Criteria của B (Given/When/Then)

1. **`REQ-TAL-03` — Gửi đơn:** *Given* Talent đã đăng nhập và project đang `PUBLISHED`, `acceptingApplications=true`, *When* gửi đơn trong registration window, *Then* hệ thống tạo đúng một `SUBMITTED` application và trả về ID/trạng thái.
2. **Project không nhận đơn:** *Given* project chưa công bố, đã đóng hoặc ngoài registration window, *When* Talent gửi đơn trực tiếp qua API, *Then* API từ chối với lỗi nghiệp vụ chuẩn và không tạo bản ghi application.
3. **Đăng ký đồng thời:** *Given* hai request cùng Talent/project đến đồng thời, *When* backend xử lý, *Then* chỉ một active application tồn tại; request lặp trả kết quả idempotent hoặc lỗi conflict đã định nghĩa.
4. **Rút đơn:** *Given* application chưa `ACCEPTED`, *When* chính Talent rút, *Then* trạng thái thành `WITHDRAWN` và có audit; người khác hoặc Talent đã accepted không thể rút thay.
5. **Mentor review:** *Given* Mentor được gán vào project, *When* duyệt application, *Then* chỉ các transition hợp lệ được phép; Mentor ngoài project nhận `403`/`404` theo error policy và dữ liệu không bị lộ.
6. **Phỏng vấn tùy chọn:** *Given* project bật interview, *When* application vào review, *Then* phải qua trạng thái interview trước quyết định; nếu project không bật, Mentor có thể quyết định trực tiếp theo flow đã duyệt.
7. **Team:** *Given* application `ACCEPTED`, *When* Lab tạo Team, *Then* chỉ member đủ điều kiện được thêm; vi phạm `maxTeamSize` hoặc trùng membership bị backend từ chối.
8. **Leader:** *Given* member được chỉ định/bầu theo policy và Mentor xác nhận, *When* thay Leader, *Then* chỉ có một Leader hiện hành theo policy và lịch sử appointment được lưu.
9. **Template/file:** *Given* Mentor/Leader truy cập tài liệu, *When* họ không thuộc project/team được gán hoặc version không còn hợp lệ, *Then* backend từ chối truy cập; file URL/credential không bị lộ rộng.
10. **Report:** *Given* report `DRAFT`, *When* tác giả gửi, *Then* chuyển `SUBMITTED`; reviewer trả lại thì phải có nhận xét và chuyển `CHANGES_REQUESTED`; chỉ reviewer có quyền mới có thể `APPROVED`.
11. **Evaluation privacy:** *Given* evaluation chưa chốt, *When* Talent/Enterprise gọi API xem, *Then* không trả về nội dung; Talent chỉ xem evaluation `FINAL` của mình, Enterprise chỉ xem phần tổng hợp/nghiệm thu.
12. **Redistribution:** *Given* Leader thuộc Team và Team Pool `ALLOCATED`, chưa bị khóa, *When* tạo proposal, *Then* proposal được lưu riêng, không tạo ledger entry; Mentor ngoài assignment không thể xác nhận.

### 7.7. Schema/API contracts thuộc B và shared contracts

**B sở hữu schema/migrations (`002_b_...` theo convention D3):**

- `talent_profiles` — hồ sơ nghiệp vụ B gắn 1:1 với `users` shared của A; họ tên/email lấy từ User contract, không tạo bản sao hoặc sửa bảng `users`. Baseline D5: `student_id` bắt buộc; `faculty`, `major`, `cohort`, `bio`, `skills`, `certifications` và portfolio references tùy chọn.
- `applications`, `application_state_history` — Application workflow do B sở hữu; tham chiếu `projects.id` do A sở hữu.
- `mentor_invitations`, `project_mentor_assignments` — lời mời và assignment Mentor theo Project.
- `teams`, `team_members`, `team_leader_history` — nhóm, membership và lịch sử bổ nhiệm/bầu.
- `tasks`, `task_milestones`, `task_attachments` — task/milestone và tham chiếu template/file.
- `progress_reports`, `report_state_history`, `evaluations`, `contribution_records`.
- `redistribution_proposals` — đề xuất của Leader; không thay thế `ledger_entries`/`fund_allocations` do A sở hữu.

**Contract cần thống nhất và test:**

- Talent profile: Talent tự đọc/tạo/cập nhật profile của mình; Lab Admin có quyền quản trị; Mentor được phân công xem profile ứng viên thuộc project; Enterprise chỉ đọc các trường cho phép của ứng viên thuộc project mình, không đọc thông tin liên hệ riêng. B không sửa identity/credentials/roles trong `users`.
- Tiêu thụ `ProjectSummary`/`ProjectContractService.getProjectStatus(projectId)` của A: `status`, `acceptingApplications`, registration window, `maxTeamSize`, `requiredSkills`.
- Application API B: `POST /api/v1/projects/:projectId/applications`, `GET /api/v1/talent/me/applications`, `POST /api/v1/applications/:id/withdraw`, `GET /api/v1/projects/:projectId/applications` (Mentor/Lab authorized), `PATCH /api/v1/applications/:id/decision` (Mentor assigned).
- Mentor/Team/Task/Report APIs phải nhận actor context từ Auth Guard của A; B không tạo lại auth hoặc tự quản lý role source-of-truth.
- Redistribution đọc `GET /api/v1/finance/projects/:projectId/team-pool` và gửi proposal/confirmation; chỉ Finance API của A ghi Ledger.
- Các cột trạng thái, time zone/registration close boundary, error codes, pagination, audit event shape và file access phải được ghi vào OpenAPI/shared types trước khi client phụ thuộc.

## 8. Kết quả Cùng chốt cuối ngày D3 (A + B)

- [x] Auth/JWT role context của A là shared identity source; B cung cấp action/resource permission cho Talent, Leader, Mentor và Team.
- [x] Project lifecycle/status và Project Contract thuộc A; Application workflow/schema và các bảng miền B thuộc B. Không sửa cùng migration/entity; dùng contract và review chéo.
- [x] Quy ước migration prefix A=`001_a_...`, B=`002_b_...`; shared entity thay đổi phải có owner được chỉ định.
- [x] Mentor được phân công là người quyết định cuối Application; interview theo cấu hình project; Lab Admin giám sát/ngoại lệ.
- [x] Leader do Mentor chỉ định hoặc nhóm bầu theo policy, Mentor xác nhận; Team Pool/API Ledger là ranh giới shared B/A.
- [x] Excel/Docs chuẩn của Lab vẫn là hồ sơ chuẩn; app giữ task/report metadata và workflow; không tích hợp Jira/Trello.
- [x] Quyền dữ liệu B giới hạn theo self/team/assigned project/own project; evaluation cá nhân không lộ cho Enterprise.
- [ ] PO/Mentor xác nhận các chi tiết còn mở: field/eligibility, các transition/withdraw edge cases, election quorum, task states, report reviewer theo loại, escalation criteria, registration close boundary/time zone và cấu hình interview.
- [ ] Cập nhật shared OpenAPI/types và test fixtures trước khi client phụ thuộc vào các contract tương ứng.