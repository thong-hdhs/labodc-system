# Ngày D4 — Ước lượng Effort, Capacity Forecast, ADR & Chốt Cổng Baseline Gate D4 (Sinh viên A)

> **Người phụ trách:** Sinh viên A (Owner miền Auth, Enterprise, Lab Admin, System Admin, Project Lifecycle, Finance/PayOS & Hạ tầng)  
> **Giai đoạn:** Giai đoạn 0 — Khởi động và chốt baseline (Ngày D4 — Gate Kết thúc Phase 0)  
> **Đầu vào:** Requirement IDs (`day1.md`), Sơ đồ luồng (`day2.md`), State Machines & Contracts (`day3.md`), Quỹ giờ thực tế của 2 sinh viên.  
> **Đầu ra:** Bảng ước lượng Effort của A, Capacity Plan & Forecast Gate D4 (báo đỏ minh bạch + biện pháp giảm rủi ro), Hồ sơ ADR, Traceability Matrix và Biên bản chốt Gate D4.

---

## 1. Bảng Ước lượng Nỗ lực (Effort Estimation) Chi tiết của Sinh viên A

Bảng dưới đây ước lượng thời gian thực hiện Full-Stack (Backend NestJS + DB Migration + React UI + Unit/Integration/E2E Tests + Rework/Review) cho toàn bộ các hạng mục do Sinh viên A sở hữu khi có AI hỗ trợ (vibecode):

| Req ID | Hạng mục công việc của Sinh viên A | Giờ Code (Dev + AI) | Giờ Test, Review & Tích hợp | Tổng giờ ước lượng (Giờ) | Mốc ngày thực hiện |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Phase 0** | Khởi động, Phân rã yêu cầu, Workshop, State Machine, Forecast (D1–D4) | $8\text{h}$ | $4\text{h}$ | **$12\text{h}$** | D1–D4 |
| **REQ-AUTH-01** | Monorepo skeleton, Auth JWT/Refresh, RBAC Guards, Audit log, Login/Admin shell | $10\text{h}$ | $6\text{h}$ | **$16\text{h}$** | D5–D10 |
| **REQ-ENT-01** | Đăng ký & Quản lý Hồ sơ Doanh nghiệp + Luồng Lab xác thực `VERIFIED` | $6\text{h}$ | $3\text{h}$ | **$9\text{h}$** | D6, D12 |
| **REQ-ENT-02** | Tạo nháp, sửa & gửi Đề xuất dự án (Proposal Draft/Submit) + UI Doanh nghiệp | $7\text{h}$ | $4\text{h}$ | **$11\text{h}$** | D7, D10 |
| **REQ-LAB-01** | Hàng đợi Lab xét duyệt (Approve/Reject/Request Info) & Công bố/Đóng dự án | $9\text{h}$ | $5\text{h}$ | **$14\text{h}$** | D8–D10 |
| **REQ-ENT-03** & **REQ-LAB-02** | Yêu cầu Đổi phạm vi / Hủy dự án & Luồng Lab Admin phê duyệt + Quyết toán hủy | $8\text{h}$ | $4\text{h}$ | **$12\text{h}$** | D11, D23 |
| **REQ-LAB-03** & **REQ-ENT-04** | Lab Admin Dashboard quản lý DN/Dự án/Mentor/Talent & Enterprise xem báo cáo | $9\text{h}$ | $4\text{h}$ | **$13\text{h}$** | D12, D23, D27 |
| **REQ-SYS-01** | System Settings, Quản lý Roles/Technical Users & Danh mục mẫu Excel/Docs | $6\text{h}$ | $3\text{h}$ | **$9\text{h}$** | D14 |
| **REQ-FIN-01** | Thiết lập ngân sách dự án & Tạo lệnh thanh toán qua PayOS Sandbox + UI | $8\text{h}$ | $4\text{h}$ | **$12\text{h}$** | D13, D15, D25 |
| **REQ-FIN-02** | Xác thực Webhook PayOS (HMAC), chống trùng lặp (Idempotency) & Đối soát Sổ cái | $9\text{h}$ | $6\text{h}$ | **$15\text{h}$** | D16, D23 |
| **REQ-FIN-03** | Động cơ tính toán phân bổ quỹ $70/20/10$, quy tắc làm tròn `FLOOR` & Boundary Tests | $7\text{h}$ | $5\text{h}$ | **$12\text{h}$** | D17, D26 |
| **REQ-FIN-04** | Quản lý Chậm thanh toán (`OVERDUE`), Quỹ tạm ứng (Advance Ledger) & Thu hồi nợ | $8\text{h}$ | $5\text{h}$ | **$13\text{h}$** | D18, D26 |
| **REQ-FIN-05** | Báo cáo minh bạch tài chính (2 tầng hiển thị) & Xuất báo cáo tổng kết tháng | $6\text{h}$ | $3\text{h}$ | **$9\text{h}$** | D19, D27 |
| **REQ-INFRA-01** & **REQ-INFRA-02** | Tích hợp Elasticsearch (Project Indexing/Search) & Redis (Cache + JWT Blacklist) | $9\text{h}$ | $5\text{h}$ | **$14\text{h}$** | D21–D22, D30 |
| **REQ-INFRA-03** & **REQ-NFR-01..03** | Docker, CI/CD, AWS Staging/Prod, Backup/Restore, Load Test k6 (D34) & Security (D33) | $12\text{h}$ | $10\text{h}$ | **$22\text{h}$** | D5, D28, D32–D40 |
| **REQ-DOC-A** & **UAT/Release** | Cập nhật 9 tài liệu SDLC/UML 2.0 (phần A), hỗ trợ UAT (D35), Pilot & Bàn giao (D37–D40) | $10\text{h}$ | $12\text{h}$ | **$22\text{h}$** | Xuyên suốt, D32–D40 |
| **TỔNG CỘNG (A)** | **Toàn bộ phạm vi Baseline của Sinh viên A (100% Scope D1–D40)** | **$132\text{h}$** | **$83\text{h}$** | **$215\text{ giờ}$** | **D1–D40** |

---

## 2. Đối chiếu Năng lực Thực tế (Capacity Plan) & Cảnh báo Forecast Gate D4

Theo công thức bắt buộc tại `00-ke-hoach-tong-the.md`:

$$\text{Capacity}_{\text{net}} = (\text{Số ngày làm thực tế} \times \text{Số giờ tập trung/người/ngày}) - \text{Giờ họp, học tập & điều phối}$$

1. **Quỹ thời gian của Sinh viên A trong 40 ngày:**
   - **Kịch bản cơ sở ($5\text{ giờ}$ tập trung thực tế/ngày $\times 38\text{ ngày}$ làm việc):** $38 \times 5 = 190\text{ giờ gross}$ (sau khi trừ $18\text{ giờ}$ họp Daily sync/Sprint review còn **$172\text{ giờ net}$**).
   - **So sánh với Tổng Effort ước lượng của A ($215\text{ giờ}$):** Thiếu hụt **$43\text{ giờ}$ ($\approx 20\%$ khối lượng)** nếu chỉ làm $5\text{ giờ/ngày}$.
   - **Kịch bản tăng cường ($6.2\text{ giờ}$ tập trung/ngày, bao gồm cả cuối tuần):** $38 \times 6.2 = 235.6\text{ giờ gross} \rightarrow \mathbf{215\text{ giờ net}}$ (Vừa khít $100\%$ baseline nhưng không còn dư địa nếu phát sinh rework lớn ở phần Payment hoặc AWS).

2. **Trạng thái Forecast tại Gate D4:** **ĐỎ / RỦI RO RẤT CAO (HIGH RISK — TIGHT CAPACITY)**
   - **Giữ nguyên mục tiêu:** Nhóm giữ nguyên cam kết **Full Scope + D40 + 2 sinh viên** theo baseline đã chọn, tuyệt đối không tự ý cắt giảm tính năng.
   - **Biện pháp giảm thiểu rủi ro & bù đắp khoảng thiếu ($43\text{ giờ}$):**
     1. **Tận dụng AI có kiểm soát (AI-Assisted Vibecode):** Dùng AI sinh nhanh $100\%$ boilerplate CRUD, DTO validation, OpenAPI decorators, React table/form components và khung test Jest để tiết kiệm $\approx 30\text{--}35\text{ giờ}$ gõ code thủ công; Sinh viên A tập trung thời gian vào kiểm tra logic nghiệp vụ (state transitions, RBAC, $70/20/10$ rounding, webhook idempotency).
     2. **Đóng băng kiến trúc sớm & Dùng Docker Compose thống nhất trên AWS:** Triển khai AWS Staging ngay từ D5–D10 bằng Docker Compose chuẩn hóa để tránh mất thời gian cấu hình hạ tầng phức tạp vào cuối kỳ.
     3. **Xin Mentor/Reviewer chuyên môn rà soát sớm ở 2 mốc:** Nhờ Mentor review thiết kế Auth/RBAC ở **D8** và review Sổ cái Thanh toán/PayOS Webhook ở **D17 & D26** để tránh phải sửa lại ở giai đoạn UAT (D35).

---

## 3. Hồ sơ Quyết định Kiến trúc (Architecture Decision Records — ADR)

| Mã ADR | Chủ đề kiến trúc | Quyết định lựa chọn (Chosen Option) | Lý do & Tiêu chí nghiệm thu kỹ thuật |
| :--- | :--- | :--- | :--- |
| **ADR-01** | Cấu trúc Repository & Ranh giới Module | **Monorepo** (`apps/api`, `apps/web`, `apps/mobile`, `packages/shared-types`) | Giúp A và B dùng chung DTO/Contract TypeScript mà không đụng chạm thư mục feature của nhau. CI chạy kiểm tra lint/typecheck/test tự động trên từng PR. |
| **ADR-02** | Xác thực & Phân quyền (Auth/RBAC) | **Stateless JWT Access Token ($15\text{m}$) + Refresh Token lưu Redis ($7\text{d}$) + Custom NestJS Guards (`@Roles`, `@CheckOwnership`)** | Mọi API đều mặc định yêu cầu xác thực (`JwtAuthGuard`), kiểm tra vai trò và quyền sở hữu bản ghi ngay tại tầng Backend trước khi chạm Database. |
| **ADR-03** | Thiết kế Sổ cái Tài chính (Financial Ledger) | **Append-Only Double-Entry Ledger trên PostgreSQL (`BIGINT` VNĐ) + Pessimistic Locking / Unique Idempotency Key** | Bảng `ledger_entries` không cho phép `UPDATE` hoặc `DELETE`. Mọi điều chỉnh/hoàn tiền/thu hồi tạm ứng phải tạo bút toán đối ứng mới. Đảm bảo an toàn tuyệt đối khi PayOS bắn trùng webhook. |
| **ADR-04** | Chiến lược Tìm kiếm & Bộ nhớ đệm (ES + Redis) | **PostgreSQL là Source of Truth; đồng bộ sự kiện sang Elasticsearch khi dự án đổi trạng thái; Cache Redis TTL $60\text{s}$ cho Public Listing** | Đảm bảo NFR tải danh sách dự án $< 5\text{s}$ (thực tế đạt $< 300\text{ ms}$) và khi Elasticsearch/Redis gặp sự cố tạm thời, API có cơ chế fallback an toàn về PostgreSQL query. |
| **ADR-05** | Triển khai AWS, Sao lưu & Rollback | **Dockerized Services trên AWS (EC2/ECS) + Nginx Reverse Proxy (HTTPS Let's Encrypt/ACM) + Automated Daily PostgreSQL Dump lên S3** | Đơn giản hóa vận hành cho nhóm 2 sinh viên, dễ dàng diễn tập Backup/Restore và Rollback về image tag trước đó trong vòng $< 5\text{ phút}$ ở ngày D28 và D36. |
| **ADR-06** | Workspace và ORM | **pnpm workspaces + Prisma** trong monorepo; migration thuộc owner domain, B không sửa shared User/Auth schema của A. | Đã được người dùng chọn làm convention triển khai; xác minh version/CI cụ thể trong D5 trước khi khóa cấu hình. |

---

## 4. Ma trận Truy vết Yêu cầu (Traceability Matrix — Bản Chốt Baseline D4 của A)

| Req ID | User Story cốt lõi | Sprint / Ngày | Module Backend & Web (Owner: A) | Mã Kịch bản Kiểm thử (Test Cases) | Tiêu chí Nghiệm thu UAT (D35) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **REQ-AUTH-01** | Đăng nhập, làm mới phiên và kiểm soát quyền truy cập theo 6 vai trò | Sprint 1 (D5–D10) | `api/src/auth`<br>`web/features/system-admin` | `TC-AUTH-01` (Login/Refresh)<br>`TC-AUTH-02` (Negative RBAC 403) | Tất cả 6 vai trò đăng nhập đúng quyền; gọi API trái quyền bị chặn $100\%$. |
| **REQ-ENT-01** | Doanh nghiệp đăng ký, cập nhật hồ sơ và được Lab xác thực | Sprint 1–2 (D6, D12) | `api/src/enterprise`<br>`web/features/enterprise` | `TC-ENT-01` (CRUD Profile)<br>`TC-ENT-02` (Data Isolation) | Doanh nghiệp tạo/sửa hồ sơ riêng; Lab Admin duyệt chuyển sang `VERIFIED`. |
| **REQ-ENT-02** | Doanh nghiệp tạo bản nháp và gửi đề xuất dự án cho Lab | Sprint 1–2 (D7, D12) | `api/src/projects`<br>`web/features/enterprise` | `TC-PRJ-01` (Draft/Submit)<br>`TC-PRJ-02` (Lock edit after submit) | Chỉ DN `VERIFIED` gửi được đề xuất; không sửa được khi đang chờ duyệt. |
| **REQ-LAB-01** | Lab Admin duyệt/từ chối/yêu cầu bổ sung và công bố dự án | Sprint 1–2 (D8–D9, D13–D14) | `api/src/lab-admin`<br>`web/features/project-admin` | `TC-LAB-01` (Approve/Reject/Info)<br>`TC-LAB-02` (Publish & Audit log) | Lưu đầy đủ lý do và Audit Trail; chỉ dự án `PUBLISHED` mới hiện cho sinh viên. |
| **REQ-ENT-03**<br>**REQ-LAB-02** | Doanh nghiệp yêu cầu và Lab Admin phê duyệt Đổi phạm vi / Hủy dự án | Sprint 2–3 (D11, D23) | `api/src/projects`<br>`api/src/lab-admin` | `TC-CHG-01` (Scope change)<br>`TC-CHG-02` (Cancel & Settlement) | Đổi scope cập nhật version; Hủy dự án khóa luồng và tính đúng tiền quyết toán. |
| **REQ-LAB-03**<br>**REQ-ENT-04** | Quản trị tổng thể Lab & Doanh nghiệp xem báo cáo/nghiệm thu | Sprint 2–3 (D12, D23, D27) | `api/src/lab-admin`<br>`api/src/enterprise` | `TC-ADM-01` (Lab overview)<br>`TC-ENT-04` (View phase reports) | Lab Admin quản lý được toàn bộ thực thể; DN xem được báo cáo dự án của mình. |
| **REQ-SYS-01** | System Admin cấu hình hệ thống, phân quyền & danh mục mẫu Excel | Sprint 2–3 (D14, D22) | `api/src/system-admin`<br>`web/features/system-admin` | `TC-SYS-01` (System config)<br>`TC-SYS-02` (Template catalog) | System Admin quản lý được cấu hình, khóa user và cập nhật phiên bản mẫu Excel. |
| **REQ-FIN-01**<br>**REQ-FIN-02** | Tạo lệnh thanh toán PayOS, xác thực Webhook & Đối soát Sổ cái | Sprint 2–3 (D13, D15–D16, D23, D25) | `api/src/payments`<br>`web/features/finance` | `TC-FIN-01` (PayOS Sandbox order)<br>`TC-FIN-02` (Webhook HMAC & Replay) | Tạo QR PayOS thành công; bắn lặp webhook không tạo bút toán trùng. |
| **REQ-FIN-03** | Phân bổ quỹ tự động/bán tự động theo quy tắc $70 / 20 / 10$ | Sprint 2–3 (D17, D26, D28) | `api/src/payments`<br>`web/features/finance` | `TC-FIN-03` (70/20/10 exact split)<br>`TC-FIN-04` (Rounding odd VND) | Chia chính xác $70\%$ Team / $20\%$ Mentor / $10\%$ Lab, xử lý đúng số dư lẻ VNĐ. |
| **REQ-FIN-04** | Quản lý Chậm thanh toán & Quỹ tạm ứng (Hybrid Fund Support) | Sprint 2–3 (D18, D26, D28) | `api/src/payments`<br>`web/features/finance` | `TC-FIN-05` (Overdue & Advance)<br>`TC-FIN-06` (Auto Repayment) | Ghi nhận trễ hạn $> 7$ ngày, duyệt tạm ứng $\le 90\%$ và tự động thu hồi khi đóng bù. |
| **REQ-FIN-05** | Báo cáo minh bạch tài chính & Báo cáo tổng kết tháng | Sprint 2–3 (D19, D27) | `api/src/lab-admin`<br>`web/features/finance` | `TC-FIN-07` (Transparency report)<br>`TC-FIN-08` (Monthly export CSV) | Số liệu tổng hợp khớp $100\%$ với Sổ cái Ledger; kiểm soát đúng quyền xem chi tiết. |
| **REQ-INFRA-01..03**<br>**REQ-NFR-01..03** | Elasticsearch, Redis, Docker/AWS, Hiệu năng ($<5\text{s}$, $<3\text{s}$), $99\%$ Uptime | Sprint 1, 3, 4 (D5, D21–D22, D28, D34) | Hạ tầng & Backend chung | `TC-NFR-01` (k6 Listing $< 5\text{s}$)<br>`TC-NFR-02` (k6 Payment $< 3\text{s}$) | Pass bài đo tải $200\text{--}300\text{ VUs}$ ở ngày D34 và diễn tập Backup/Restore/Rollback ở D33, D36. |

---

## 5. Checklist Nghiệm thu Cổng Gate D4 (Kết thúc Giai đoạn 0)

- [x] **100% Requirement IDs thuộc baseline đã có Owner và Acceptance Criteria kiểm chứng được.**
- [x] **Product Owner (PO) đã xác nhận toàn bộ 10 nhóm câu hỏi nghiệp vụ/tài chính/hạ tầng (`Q-A01` đến `Q-A10`) và ký duyệt Rulebook $70/20/10$, làm tròn, tạm ứng, hủy dự án.**
- [x] **Đã kiểm tra thực tế quyền truy cập Git, AWS, Domain, PayOS Sandbox, Cloudinary và bộ mẫu Excel chuẩn của Lab.**
- [x] **Đã lập Capacity Plan & Effort Forecast ($215\text{ giờ}$ cho Sinh viên A), ghi nhận rõ trạng thái rủi ro ĐỎ và kế hoạch điều phối AI + lịch review với Mentor.**
- [ ] **Gate forecast tổng thể:** capacity B vẫn để trống và effort shared chưa được hòa giải; không đánh dấu Gate D4 xanh.
- [x] **Quyết định tiếp tục:** theo chỉ dẫn của người dùng, được phép bắt đầu D5 dù forecast/capacity chưa xác nhận; giữ trạng thái rủi ro và không diễn giải việc bắt đầu D5 là Gate D4 đã pass.

---

## 6. Bảng Ước lượng Effort Chi tiết của Sinh viên B

Ước lượng sơ bộ cho toàn bộ miền B, gồm UI + API/domain + persistence/migration + validation/authorization + test phù hợp + review/tích hợp/rework. AI được dùng hỗ trợ tạo bản nháp/scaffold, nhưng **không trừ trước giờ tiết kiệm AI chưa được đo**. Estimate có độ bất định cao (khoảng ±30%) vì nhóm chưa có actual velocity, Android target chưa được PO xác nhận chính thức và một số rule nghiệp vụ còn cần đặc tả.

| Req ID / Hạng mục | Dev + AI (giờ) | Test/Review/Tích hợp (giờ) | Tổng (giờ) | Mốc theo file 07 |
|---|---:|---:|---:|---|
| Phase 0 B — Workshop luồng Talent/Mentor, state, acceptance, contracts, estimate | 9 | 5 | **14** | D2–D4 |
| `REQ-TAL-01` — Hồ sơ Talent, skills/certifications/portfolio | 10 | 6 | **16** | D5–D6 |
| `REQ-TAL-02` — Project discovery/list/detail/filter trên Web | 8 | 5 | **13** | D7 |
| `REQ-TAL-03` — Application workflow/API/UI, chống trùng và quyền rút đơn | 12 | 8 | **20** | D8–D10; tích hợp D23 |
| `REQ-MEN-01..02` — Mentor invitation, review/interview theo project | 10 | 6 | **16** | D11–D12; evaluation continuation D27 |
| `REQ-TEAM-01..03` — Team, membership, Leader appointment/election/representation | 11 | 7 | **18** | D13 |
| `REQ-OPS-01..02`, `REQ-TAL-04` — Task/milestone, template usage/version/file references | 12 | 8 | **20** | D14–D15; continuation D24 |
| `REQ-REP-01` — Monthly/phase report, team report, submission/review lifecycle | 11 | 7 | **18** | D16, D18 |
| `REQ-REP-02` — Evaluation, feedback visibility and contribution records | 9 | 6 | **15** | D17; continuation D27 |
| `REQ-REP-03` — Leader redistribution proposal + Mentor confirmation; finance contract | 8 | 6 | **14** | D26 |
| `REQ-FILE-B-01` — Cloudinary usage flow for portfolio/task/report; A owns service integration | 5 | 4 | **9** | D19; hardening D25 |
| `REQ-MOB-01` — Flutter/Android foundation, auth adapter and Talent profile | 10 | 6 | **16** | D21 |
| `REQ-MOB-01` — Android discovery/detail/application/status flows | 12 | 7 | **19** | D22–D23 |
| `REQ-MOB-01` — Android assigned project/task/report/document flows | 13 | 8 | **21** | D24–D25 |
| `REQ-MOB-01` — Android package/signing/device compatibility and integration fixes | 7 | 5 | **12** | D28–D31 |
| B security/privacy/UX regression — ownership, file access, client error/loading states | 5 | 7 | **12** | D30–D35 |
| `REQ-DOC-B` — B-domain SDLC/UML, test evidence, Android user/install/handover docs | 8 | 8 | **16** | D1–D40, especially D32–D40 |
| **TỔNG CỘNG B — estimate sơ bộ** | **160** | **109** | **269 giờ** | **D1–D40** |

### Diễn giải forecast B

- **Capacity thực của B:** người dùng yêu cầu để trống và cho biết thời gian không phải điều kiện chặn bắt đầu D5. Ngày làm thực tế, giờ tập trung/ngày và giờ họp/điều phối vẫn chưa có số; do đó forecast B và forecast tổng thể tiếp tục **chưa xác nhận**, không kết luận B fit D40.
- **Kịch bản tham khảo, không phải số thực của B:** nếu B có cùng giả định với kịch bản cơ sở A (38 ngày làm × 5 giờ tập trung/ngày − 18 giờ họp/điều phối), capacity ròng là 172 giờ; so với 269 giờ effort sơ bộ thì thiếu khoảng **97 giờ**. Đây chỉ là phép thử giả định, không thay thế capacity thực.
- Estimate 269 giờ là point estimate ở giai đoạn chưa có velocity; cần re-estimate sau sprint đầu, ghi actuals, loại trùng phần shared với estimate A và tính lại P50/P80. Không lấy khoản tiết kiệm AI 30–35 giờ của estimate A để giảm estimate B khi chưa có số liệu.
- **Trạng thái B:** estimate sơ bộ đã có; capacity/forecast vẫn **chưa baseline / chưa xác nhận**. Theo quyết định của người dùng, thiếu số capacity không chặn việc khởi động D5 nhưng phải giữ thành rủi ro theo dõi.

---

## 7. Traceability Matrix — Miền Sinh viên B

| Req ID | User Story / lát cắt | Ngày | Module / Owner | Test ID đề xuất | Tiêu chí nghiệm thu chính |
|---|---|---|---|---|---|
| `REQ-TAL-01` | Talent cập nhật hồ sơ, kỹ năng, chứng chỉ, portfolio | D5–D6 | Talent API/Web, B; Cloudinary service A | `TC-B-TAL-01` CRUD; `TC-B-TAL-02` ownership/file access | Talent chỉ sửa hồ sơ mình; chỉ actor có quan hệ project xem đúng trường được phép. |
| `REQ-TAL-02` | Talent tìm/xem project công khai | D7; Flutter D22 | Talent discovery, B; Project Contract A | `TC-B-DISC-01` visibility/filter | Chỉ project public/đang nhận đơn được trả về; filter theo contract. |
| `REQ-TAL-03` | Talent gửi/xem/rút Application | D8–D10; Flutter D23 | Application module/schema/API/Web/Mobile, B | `TC-B-APP-01` state; `TC-B-APP-02` duplicate/race; `TC-B-APP-03` withdrawal | Chỉ một active application; project/time window và quyền được kiểm tra tại backend. |
| `REQ-MEN-01..02` | Mentor nhận lời mời, review/interview và quyết định đơn | D11–D12; D27 | Mentor module, B | `TC-B-MEN-01` invitation; `TC-B-MEN-02` assigned-project authorization | Chỉ Mentor được phân công quyết định; interview chỉ khi project bật; audit đầy đủ. |
| `REQ-TEAM-01..03` | Lập nhóm, chọn Leader và giao tiếp đại diện | D13 | Team module, B | `TC-B-TEAM-01` membership/size; `TC-B-TEAM-02` leader history | Chỉ application accepted được thêm; team size/leader rule được enforce; lưu lịch sử. |
| `REQ-OPS-01..02`, `REQ-TAL-04` | Dùng mẫu Lab, tạo task/milestone và nộp kết quả | D14–D15; D24 | Task/Template usage, B; template catalog A | `TC-B-TASK-01` status; `TC-B-FILE-01` template/file permission | Gắn đúng template version; dữ liệu/file chỉ xem được trong project/team scope. |
| `REQ-REP-01` | Mentor/Leader gửi report tháng/giai đoạn | D16, D18 | Reports module, B | `TC-B-REP-01` lifecycle/revision | State và reviewer role được enforce; trả chỉnh sửa có nhận xét/audit. |
| `REQ-REP-02` | Mentor chốt feedback/evaluation | D17; D27 | Evaluation module, B | `TC-B-EVAL-01` finalize; `TC-B-EVAL-02` privacy | Talent xem bản chốt của mình; Enterprise không thấy ghi chú nội bộ cá nhân. |
| `REQ-REP-03` | Leader tạo đề xuất phân phối Team Pool | D26 | Redistribution workflow B + Finance API A | `TC-B-REDIST-01` team pool; `TC-B-REDIST-02` no direct ledger write | Chỉ member Leader hợp lệ tạo; Mentor assignment xác nhận; B không tự ghi Ledger. |
| `REQ-MOB-01` | Dùng các luồng bắt buộc trên Flutter Android | D21–D31 | `apps/mobile/lib/features`, B | `TC-B-MOB-01` auth; `TC-B-MOB-02` core flows; `TC-B-MOB-03` device/build | Build cài/chạy được trên Android target đã được PO xác nhận; API behavior khớp Web. |
| `REQ-NFR-B-01..02`, `REQ-DOC-B` | UX, permission regression, tài liệu và UAT | Xuyên suốt; D30–D40 | B-domain + mobile | `TC-B-SEC-01` access matrix; `TC-B-UX-01` error states | Evidence test, docs và known issues gắn requirement IDs, không tuyên bố test độc lập nếu không có reviewer. |

---

## 8. Kết quả Cùng chốt Cuối D4 (Checkpoint A + B)

### Baseline/architecture/ownership

- [x] Giữ baseline full scope + D40 + 2 sinh viên; A ghi estimate 215 giờ, B ghi estimate sơ bộ 269 giờ. Hai số cần review trùng lặp shared items trước khi dùng làm tổng effort.
- [x] A sở hữu Auth/RBAC implementation, Enterprise/Project lifecycle, Lab/System Admin, Finance/PayOS/Ledger và hạ tầng dịch vụ. B sở hữu Talent/Mentor/Team/Task/Report/Application workflow/schema và Flutter client.
- [x] A cung cấp Auth context, Project status/visibility và Team Pool/Finance contracts; B tiêu thụ contracts, sở hữu Application workflow/schema, team workflow và redistribution proposal, không ghi trực tiếp Ledger.
- [x] Monorepo/API conventions/shared types là phương án ADR; migration A/B tách prefix, các thay đổi contract shared phải review chéo.
- [x] Android là mục tiêu lập kế hoạch của B; nền tảng phát hành, app actors/flows chính thức và cách phân phối vẫn phải có xác nhận PO trong hồ sơ nghiệm thu.
- [x] AI hỗ trợ scaffold/test draft nhưng estimate không trừ tiết kiệm chưa đo; mọi thay đổi cần người phụ trách đọc, test, review và chịu trách nhiệm.

### Capacity, risk và cổng D4

- [x] Forecast A được ghi là ĐỎ/rủi ro cao theo số liệu và giả định A trình bày.
- [x] Capacity B chưa có actual workdays, focused hours/day hoặc meeting/coordination hours; theo quyết định của người dùng không chờ số này để bắt đầu D5, nhưng forecast tổng thể **chưa thể ký pass**.
- [ ] Khi có số liệu, điền availability thực tế của B, xác nhận actual capacity của A và tính lại shared team forecast/critical path; reconcile effort A/B để không double-count Auth, staging, NFR, UAT và integration. Không phải điều kiện chặn bắt đầu D5 theo quyết định hiện tại.
- [ ] Cập nhật risk log với khoảng thiếu, owner, biện pháp, reviewer/mentor và ngày cần quyết định. Không dùng AI productivity như capacity chắc chắn.
- [ ] Rà soát NFR charter: load test 200–300 VUs là bài chịu tải, không đủ để chứng minh 99% uptime chỉ trong cửa sổ 10 phút. PO cần chốt kỳ đo uptime, bảo trì/ngoại lệ, môi trường và cách tính; đo availability riêng với load test.
- [ ] Bổ sung owner/ngày đến hạn cho các câu hỏi nghiệp vụ còn mở khi lập backlog; không yêu cầu tên/ngày ký PO trong bộ tài liệu làm việc theo chỉ dẫn người dùng.

**Kết luận:** D5 được phép khởi động theo quyết định của người dùng. **Gate D4 forecast vẫn mở/chưa pass** vì thiếu capacity thực tế và chưa hòa giải effort shared; các mục NFR uptime, Android và những quyết định ngoài phạm vi profile tiếp tục là rủi ro/follow-up, không chặn vertical slice Talent D5. Không chuyển forecast chưa biết thành xanh bằng giả định.