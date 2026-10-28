# Hồ sơ đầu ra D1 của Sinh viên A và B — Requirement IDs, phân công và câu hỏi

> **Người phụ trách:** Sinh viên A (Owner miền Auth, Enterprise, Lab Admin, System Admin, Project Lifecycle, Finance/PayOS & Hạ tầng)  
> **Giai đoạn:** Giai đoạn 0 — Khởi động và chốt baseline (Ngày D1)

---

## 1. Yêu cầu Chức năng (Functional Requirements — Miền Auth, Enterprise, Lab, Finance, System Admin)

| Req ID | Actor | Tên yêu cầu | Mô tả chi tiết công việc Full-Stack của A | Ưu tiên | Mốc ngày | Module / Path |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **REQ-AUTH-01** | All Actors<br>*(Shared Owner: A)* | Xác thực JWT & Phân quyền RBAC nền tảng | • Thiết kế schema User/Account/Role, hash mật khẩu, JWT Access/Refresh token.<br>• Xây dựng Guards/Policies kiểm tra quyền server-side và quyền sở hữu tài nguyên (resource ownership).<br>• Bootstrap an toàn tài khoản System Admin; ghi nhận Audit Event nền tảng.<br>• Màn hình Login/Logout và khung bảo vệ route trên React Web. | P0 (MVP) | D5–D10<br>*(Sprint 1)* | `apps/api/src/auth`<br>`apps/web/src/features/system-admin` |
| **REQ-ENT-01** | Company<br>*(Enterprise)* | Đăng ký & Quản lý hồ sơ doanh nghiệp | • Doanh nghiệp đăng ký tài khoản và cập nhật thông tin pháp nhân, lĩnh vực, liên hệ.<br>• Kiểm tra quyền sở hữu dữ liệu (data isolation: doanh nghiệp chỉ xem/sửa hồ sơ của mình).<br>• Full-stack: Schema + Migration + CRUD API + Giao diện quản lý hồ sơ doanh nghiệp + Tests. | P0 (MVP) | D6, D11–D12<br>*(Sprint 1–2)* | `apps/api/src/enterprise`<br>`apps/web/src/features/enterprise` |
| **REQ-ENT-02** | Company<br>*(Enterprise)* | Tạo bản nháp & Gửi đề xuất dự án (Project Proposal) | • Doanh nghiệp tạo mới, lưu nháp (Draft), chỉnh sửa và gửi (Submit) đề xuất dự án cho Lab.<br>• Chỉ cho phép sửa khi ở trạng thái Draft hoặc được Lab trả về yêu cầu bổ sung (Request Info).<br>• Hiển thị trạng thái xử lý và lý do từ chối/yêu cầu bổ sung từ Lab. | P0 (MVP) | D7, D12<br>*(Sprint 1–2)* | `apps/api/src/projects`<br>`apps/web/src/features/enterprise` |
| **REQ-LAB-01** | Lab Administrator | Hàng đợi xét duyệt đề xuất & Công bố dự án | • Lab xem hàng đợi (queue) các đề xuất dự án từ doanh nghiệp.<br>• Thực hiện Duyệt (Approve), Từ chối (Reject) hoặc Yêu cầu bổ sung (Request More Info) kèm lý do bắt buộc.<br>• Công bố (Publish), ẩn (Unpublish) hoặc đóng (Close) dự án đã duyệt; lưu vết Audit Trail (người duyệt, thời gian, trạng thái trước/sau). | P0 (MVP) | D8–D9, D13–D14<br>*(Sprint 1–2)* | `apps/api/src/lab-admin`<br>`apps/api/src/projects`<br>`apps/web/src/features/project-admin` |
| **REQ-ENT-03** | Company<br>*(Enterprise)* | Yêu cầu thay đổi phạm vi (Scope Change) hoặc Hủy dự án | • Doanh nghiệp gửi yêu cầu thay đổi phạm vi hoặc hủy dự án đang triển khai kèm lý do và tài liệu/thông tin liên quan.<br>• Theo dõi trạng thái phê duyệt và lịch sử xử lý yêu cầu thay đổi/hủy. | P1 (Baseline) | D11, D23<br>*(Sprint 2–3)* | `apps/api/src/projects`<br>`apps/web/src/features/enterprise` |
| **REQ-LAB-02** | Lab Administrator | Phê duyệt/Từ chối yêu cầu đổi phạm vi & Hủy dự án | • Lab Admin xem xét các yêu cầu đổi phạm vi (scope change) hoặc hủy dự án (cancellation).<br>• Phê duyệt hoặc từ chối kèm lý do, cập nhật trạng thái dự án và ghi nhận ảnh hưởng tới ngân sách/quỹ theo rulebook. | P1 (Baseline) | D11, D23<br>*(Sprint 2–3)* | `apps/api/src/lab-admin`<br>`apps/web/src/features/project-admin` |
| **REQ-LAB-03** | Lab Administrator | Dashboard quản trị tổng thể Doanh nghiệp, Dự án, Mentor & Talent | • Quản lý danh sách doanh nghiệp, dự án, mentor và sinh viên trên Lab Admin Dashboard.<br>• Xem báo cáo tổng hợp tình hình hoạt động dự án và thống kê theo tháng/giai đoạn. | P1 (Baseline) | D12, D23, D27<br>*(Sprint 2–3)* | `apps/api/src/lab-admin`<br>`apps/web/src/features/project-admin` |
| **REQ-ENT-04** | Company<br>*(Enterprise)* | Doanh nghiệp xem báo cáo tiến độ, nghiệm thu & đánh giá | • Cung cấp giao diện và API trên Enterprise Dashboard để doanh nghiệp xem báo cáo tháng/giai đoạn, kết quả nghiệm thu và đánh giá của dự án mình tài trợ. | P1 (Baseline) | D16–D24<br>*(Sprint 2–3)* | `apps/api/src/enterprise`<br>`apps/web/src/features/enterprise` |
| **REQ-SYS-01** | System Administrator | Quản lý cấu hình hệ thống, Vai trò/Quyền & Technical Users | • Cấu hình tham số hệ thống (system settings), quản lý phân quyền (roles/permissions) và khóa/mở khóa tài khoản hoặc quản lý người dùng kỹ thuật.<br>• Phối hợp phân quyền quản lý danh mục mẫu Excel/Docs cho System Admin. | P0/P1 | D14, D22<br>*(Sprint 2–3)* | `apps/api/src/system-admin`<br>`apps/web/src/features/system-admin` |
| **REQ-FIN-01** | Enterprise /<br>Lab Admin | Khởi tạo lệnh thanh toán & Tích hợp cổng PayOS | • Thiết lập ngân sách dự án (Project Budget/Fund setup).<br>• Tạo Payment Order / Payment Intent qua PayOS (kiểm thử Sandbox trước, chỉ bật Production khi có phê duyệt).<br>• Quản lý trạng thái giao dịch (Pending, Success, Failure, Cancel, Refund); tuyệt đối không tin redirect phía client làm bằng chứng thanh toán. | P1 (Baseline) | D13, D15, D25–D26<br>*(Sprint 2–3)* | `apps/api/src/payments`<br>`apps/web/src/features/finance` |
| **REQ-FIN-02** | System /<br>Lab Admin | Xác thực Webhook PayOS, Chống trùng lặp & Đối soát Sổ cái (Ledger) | • Xác thực chữ ký Webhook từ PayOS, xử lý Idempotency Key chống replay/ghi nhận trùng lặp giao dịch.<br>• Thiết kế bảng Ledger (Sổ cái giao dịch) bất biến, màn hình lịch sử thanh toán và công cụ đối soát (Reconciliation) cho Admin. | P1 (Baseline) | D16, D23, D27<br>*(Sprint 2–3)* | `apps/api/src/payments`<br>`apps/web/src/features/finance` |
| **REQ-FIN-03** | Lab Administrator | Phân bổ quỹ tự động/bán tự động theo quy tắc 70 / 20 / 10 | • Tính toán và phân bổ khoản đóng góp của doanh nghiệp theo tỷ lệ cố định: 70% Team / 20% Mentor / 10% Lab.<br>• Áp dụng chính xác quy tắc làm tròn (rounding rule) đã được PO/Finance ký duyệt; kiểm thử biên (boundary unit tests) và phê duyệt phân bổ quỹ. | P1 (Baseline) | D17, D26, D28<br>*(Sprint 2–3)* | `apps/api/src/payments`<br>`apps/web/src/features/finance` |
| **REQ-FIN-04** | Lab Administrator | Quản lý Chậm thanh toán & Quỹ tạm ứng (Hybrid Fund Support) | • Ghi nhận trạng thái doanh nghiệp chậm thanh toán (Delayed Payment) và gửi thông báo nhắc nhở.<br>• Quản lý luồng Lab tạm ứng kinh phí (Advance Ledger & Approval Flow) để sinh viên/mentor nhận phụ cấp đúng hạn; theo dõi đối soát hoàn trả khi doanh nghiệp đóng tiền bù. | P1 (Baseline) | D18, D26, D28<br>*(Sprint 2–3)* | `apps/api/src/payments`<br>`apps/web/src/features/finance` |
| **REQ-FIN-05** | Lab Admin /<br>All Stakeholders | Báo cáo minh bạch tài chính (Transparency Reports) & Tổng kết tháng | • Tổng hợp, truy vấn và công bố báo cáo minh bạch việc phân bổ quỹ (70/20/10, tạm ứng, thực chi) hiển thị rõ ràng cho các bên liên quan.<br>• Xuất báo cáo tổng kết tài chính hằng tháng trên Lab Admin Dashboard. | P1 (Baseline) | D19, D27<br>*(Sprint 2–3)* | `apps/api/src/lab-admin`<br>`apps/web/src/features/finance` |

---

## 2. Yêu cầu Hạ tầng, Tìm kiếm/Cache, Phi chức năng (NFR) & Tài liệu

| Req ID | Hạng mục | Tên yêu cầu | Chi tiết công việc của Sinh viên A | Mốc thực hiện | Trách nhiệm |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **REQ-INFRA-01** | Elasticsearch Search | Tích hợp Elasticsearch cho tìm kiếm/lọc danh sách dự án | • Xây dựng cơ chế đánh chỉ mục (indexing) và API truy vấn/lọc dự án tốc độ cao.<br>• Đảm bảo đồng bộ dữ liệu (consistency) khi dự án được công bố/đóng. | D21, D30 | Owner chính: **A** |
| **REQ-INFRA-02** | Redis Cache / Session | Tích hợp Redis cho Caching & quản lý phiên/chẩn đoán | • Triển khai Redis cho caching danh sách dự án hoặc quản lý phiên đăng nhập/rate-limit theo use case chốt ở D4.<br>• Kiểm thử cơ chế xóa cache (cache invalidation) khi trạng thái dự án thay đổi. | D22, D30 | Owner chính: **A** |
| **REQ-INFRA-03** | Docker, CI/CD & AWS | Thiết lập Docker, Pipeline CI/CD, Staging & Production AWS | • Tạo Docker Compose local, GitHub Actions CI (lint, typecheck, test), môi trường Staging và Production trên AWS.<br>• Cấu hình HTTPS, quản lý biến môi trường/secrets, health checks, kịch bản sao lưu/khôi phục DB (Backup/Restore) và Rollback. | D5–D10, D28, D33–D39 | **A** chủ trì Server/DB<br>*(Cùng B)* |
| **REQ-NFR-01** | Hiệu năng (Performance) | Tải danh sách dự án < 5 giây; Xử lý thanh toán < 3 giây | • Đo kiểm và tối ưu hóa câu lệnh truy vấn PostgreSQL/Elasticsearch cho API danh sách dự án (< 5s).<br>• Tối ưu hóa luồng tạo lệnh và xử lý giao dịch thanh toán (< 3s) theo điều kiện trong NFR Test Charter. | D3–D4 *(Charter)*<br>D34 *(Load Test)* | Owner chính: **A** |
| **REQ-NFR-02** | Độ tin cậy & Mở rộng | Đảm bảo 99.0% Uptime & Hỗ trợ hàng trăm người dùng đồng thời | • Thiết lập giám sát (monitoring/health check), cấu hình chịu tải và chạy kịch bản kiểm thử tải (Load/Stress Test) ở ngày D34. | D28, D34, D37–D40 | **A** chủ trì Backend<br>*(Cùng B)* |
| **REQ-NFR-03** | Bảo mật (Security) | Mã hóa dữ liệu nhạy cảm/thanh toán & Phân quyền Server-side | • Đảm bảo không lưu thông tin thẻ/bí mật thanh toán trái phép, ẩn thông tin nhạy cảm trong log (log redaction).<br>• Viết bộ kiểm thử âm tính (Negative Authorization Tests) chứng minh không thể gọi API vượt quyền. | D7–D8, D25, D31, D33 | Owner chính: **A**<br>*(Auth & Payment)* |
| **REQ-DOC-A** | Tài liệu SDLC & UML 2.0 | Bộ 9 tài liệu bắt buộc (Phần kiến trúc, DB, API & Miền nghiệp vụ A) | • Soạn thảo và cập nhật liên tục theo từng Sprint cho các phần thuộc miền A trong: URD, SRS, SAD (Kiến trúc), DDD (Thiết kế chi tiết), Implementation Docs, Test Docs, Installation Guide, Source Code Docs và Deployment Package Docs. | Xuyên suốt<br>D1–D40 | **A** *(Miền A & Hạ tầng)*<br>+ **B** *(Miền B & Mobile)* |

---

## 3. Bộ Câu hỏi Nghiệp vụ, Tài chính & Kỹ thuật (Dùng cho Kickoff D1 & Workshop D2)

| Mã CH | Chủ đề | Nội dung câu hỏi chi tiết của Sinh viên A | Req ID liên quan | Phản hồi của PO / Quyết định chốt |
| :--- | :--- | :--- | :--- | :--- |
| **Q-A01** | Lịch trình & Người quyết định | 1. Mốc 40 ngày (D1–D40) được tính theo ngày lịch liên tục (kể cả T7, CN) hay ngày làm việc?<br>2. Ngày D1 chính thức bắt đầu từ ngày dương lịch nào?<br>3. Ai là Product Owner (PO) chính thức có thẩm quyền ký duyệt Baseline (ở D4), Rulebook tài chính và nghiệm thu UAT (ở D35–D40)? | Tất cả Req IDs | *[Ghi tên PO, email/SĐT, ngày D1-D40 và SLA thời gian phản hồi câu hỏi]* |
| **Q-A02** | Hồ sơ Doanh nghiệp & Xác thực | 1. Khi doanh nghiệp mới đăng ký tài khoản trên Portal, tài khoản có được tạo đề xuất dự án ngay không hay phải chờ Lab Admin duyệt xác thực hồ sơ doanh nghiệp (KYC/mã số thuế) trước?<br>2. Bộ trường thông tin bắt buộc của Hồ sơ doanh nghiệp và Đề xuất dự án (Proposal) gồm những trường nào? | `REQ-ENT-01`<br>`REQ-ENT-02` | *[Ghi danh sách trường bắt buộc và quy tắc duyệt tài khoản doanh nghiệp]* |
| **Q-A03** | Luồng duyệt & Công bố dự án của Lab | 1. Khi Lab Admin từ chối (Reject) hoặc yêu cầu bổ sung (Request Info) một đề xuất, có danh mục mã lý do (reason codes) chuẩn không hay nhập văn bản tự do?<br>2. Một dự án sau khi được Lab duyệt (Approved) sẽ tự động công bố (Published) cho sinh viên ứng tuyển hay Lab Admin phải bấm công bố thủ công kèm cài đặt ngày mở/đóng nhận đơn? | `REQ-LAB-01` | *[Ghi quy tắc chuyển trạng thái Draft -> Submitted -> Approved -> Published]* |
| **Q-A04** | Đổi phạm vi & Hủy dự án | 1. Những trạng thái nào của dự án cho phép Doanh nghiệp gửi yêu cầu Đổi phạm vi (Scope Change) hoặc Hủy dự án (Cancel)?<br>2. Ai là người có thẩm quyền phê duyệt cuối cùng (chỉ Lab Admin hay cần cả Mentor đồng thuận)?<br>3. Nếu hủy dự án khi đang thực hiện dở dang, khoản tiền doanh nghiệp đã đóng hoặc tiền Lab đã tạm ứng sẽ được xử lý/khấu trừ/hoàn trả theo tỷ lệ nào? | `REQ-ENT-03`<br>`REQ-LAB-02` | *[Ghi điều kiện được phép hủy/đổi scope và quy tắc xử lý tài chính khi hủy]* |
| **Q-A05** | Cổng thanh toán PayOS & Môi trường | 1. Ở ngày bàn giao D40 trên Production, hệ thống bắt buộc bật giao dịch tiền thật qua PayOS Production hay chỉ nghiệm thu tích hợp trên PayOS Sandbox?<br>2. Ai là chủ sở hữu tài khoản PayOS và khi nào nhóm nhận được Client ID, API Key, Checksum Key của môi trường Sandbox?<br>3. Doanh nghiệp thanh toán khoản đóng góp 1 lần toàn bộ trước khi dự án chạy hay thanh toán thành nhiều đợt (theo từng giai đoạn/tháng)? | `REQ-FIN-01`<br>`REQ-FIN-02` | *[Ghi chế độ nghiệm thu Sandbox/Prod, kỳ hạn thanh toán 1 lần hay nhiều đợt]* |
| **Q-A06** | Quy tắc chia quỹ 70/20/10 & Làm tròn số | 1. Quy tắc phân bổ 70% (Team) / 20% (Mentor) / 10% (Lab) được tính trên tổng số tiền doanh nghiệp nộp (Gross) hay sau khi đã trừ phí cổng thanh toán PayOS (Net)?<br>2. Khi chia tỷ lệ 70/20/10 hoặc khi Leader chia tiếp 70% cho các thành viên mà phát sinh số lẻ (ví dụ: lẻ đồng Việt Nam), quy tắc làm tròn (Rounding Rule: làm tròn xuống FLOOR hay HALF_UP) là gì và phần dư 1–2 đồng được cộng vào quỹ Lab hay xử lý thế nào?<br>3. Thời điểm nào hệ thống được phép kích hoạt lệnh phân bổ 70/20/10 (ngay khi PayOS báo thanh toán thành công hay phải chờ Lab Admin nghiệm thu báo cáo giai đoạn)? | `REQ-FIN-03` | *[Ghi rõ công thức Gross/Net, quy tắc làm tròn VND và điều kiện kích hoạt chia quỹ]* |
| **Q-A07** | Chậm thanh toán & Lab tạm ứng (Advance) | 1. Cơ chế 'Lab tạm ứng' (Hybrid Fund Support) trên hệ thống là luồng ghi nhận & phê duyệt bút toán sổ cái nội bộ (chuyển tiền thủ công bên ngoài rồi cập nhật biên lai) hay hệ thống phải gọi API ngân hàng để giải ngân tự động?<br>2. Sau bao nhiêu ngày quá hạn thanh toán của doanh nghiệp thì dự án chuyển sang trạng thái 'Delayed Payment' và đủ điều kiện xin Lab tạm ứng?<br>3. Ai có quyền tạo đề xuất tạm ứng, ai có quyền phê duyệt (Lab Admin?), hạn mức tạm ứng tối đa là bao nhiêu % và quy trình khấu trừ hoàn trả quỹ Lab khi doanh nghiệp nộp tiền bù hoạt động ra sao? | `REQ-FIN-04` | *[Ghi rõ bản chất ghi sổ hay chuyển tiền tự động, người duyệt và quy tắc hoàn trả]* |
| **Q-A08** | Báo cáo minh bạch (Transparency Report) | 1. Báo cáo minh bạch tài chính công bố những chỉ số nào và mức độ chi tiết đến đâu (công khai cho toàn bộ người dùng trong hệ thống hay chỉ các thành viên thuộc dự án đó mới xem được chi tiết dự án của mình)?<br>2. Có cần xuất báo cáo tài chính tháng ra file Excel/PDF theo mẫu cố định của UTH/Lab không? | `REQ-FIN-05` | *[Ghi phạm vi hiển thị báo cáo minh bạch và định dạng xuất file nếu có]* |
| **Q-A09** | Phạm vi Redis, Elasticsearch & NFR | 1. Khách hàng/PO xác nhận Redis và Elasticsearch có phải là thành phần bắt buộc triển khai trên Production để nghiệm thu không, và cụ thể dùng cho tính năng nào (ví dụ: Elasticsearch cho tìm kiếm dự án; Redis cho cache danh sách dự án & blacklist JWT)?<br>2. Tiêu chí nghiệm thu NFR ('hàng trăm người dùng đồng thời', 'tải danh sách dự án < 5 giây', 'xử lý thanh toán < 3 giây', '99% uptime') được đo ở phân vị nào (P95 hay P99), bao nhiêu VU (Virtual Users) cụ thể và có loại trừ độ trễ mạng của bên thứ ba (PayOS) không? | `REQ-INFRA-01`<br>`REQ-INFRA-02`<br>`REQ-NFR-01..03` | *[Ghi ngưỡng đo cụ thể: số VU, P95/P99, cấu hình server đo tải]* |
| **Q-A10** | Tài khoản AWS, Domain & Bàn giao Production | 1. Tài khoản AWS, tên miền (Domain/HTTPS) và chi phí hạ tầng cho môi trường Staging & Production do phía Khách hàng/Lab cấp hay nhóm tự chuẩn bị?<br>2. Sau ngày bàn giao D40, ai là người tiếp nhận quyền quản trị tối cao (System Admin, AWS root/IAM, DB backups) và trực vận hành (on-call)? | `REQ-INFRA-03`<br>`REQ-SYS-01` | *[Ghi thông tin người cấp AWS/Domain và người nhận bàn giao vận hành]* |

---

## 4. Yêu cầu của Sinh viên B — Talent, Mentor, Team và vận hành

> **Người phụ trách:** Sinh viên B (Owner miền Talent, Mentor, Team/Leader, Task/Template usage, Report/Evaluation và client Flutter).
> **Trạng thái:** Phân rã ban đầu; các quy tắc và ưu tiên cần PO/đại diện Lab xác nhận trước khi trở thành baseline.

### 4.1 Yêu cầu chức năng

| Req ID | Actor | Tên yêu cầu | Mô tả phạm vi của B | Ưu tiên ban đầu | Mốc dự kiến | Module / Path |
|---|---|---|---|---|---|---|
| **REQ-TAL-01** | Talent | Quản lý hồ sơ sinh viên | Sinh viên quản lý thông tin cá nhân, kỹ năng, chứng chỉ và portfolio; cần xác định trường bắt buộc, quyền xem và phạm vi dữ liệu được chia sẻ. | P0 (MVP) | D5–D6 | `apps/api/src/talent`; `apps/web/src/features/talent` |
| **REQ-TAL-02** | Talent | Tìm và xem dự án | Xem danh sách/chi tiết các dự án đã được công bố và đang nhận đăng ký; hỗ trợ tiêu chí tìm kiếm/lọc đã được thống nhất. | P0 (MVP) | D7–D10 | `apps/api/src/talent`; `apps/web/src/features/talent` |
| **REQ-TAL-03** | Talent | Đăng ký tham gia dự án | Gửi đăng ký vào dự án đủ điều kiện, xem trạng thái và hủy/rút đăng ký nếu chính sách cho phép; backend phải ngăn đăng ký trùng và đăng ký dự án không mở. | P0 (MVP) | D8–D10 | `apps/api/src/talent`; `apps/web/src/features/talent` |
| **REQ-TAL-04** | Talent | Xem công việc được giao | Thành viên xem task/milestone và trạng thái công việc thuộc dự án/nhóm của mình; không truy cập dữ liệu nhóm khác. | P1 (Baseline) | D15; mobile D24 | `apps/api/src/tasks`; `apps/web/src/features/team` |
| **REQ-MEN-01** | Mentor | Nhận và xử lý lời mời | Mentor được mời vào dự án có thể xem thông tin liên quan và chấp nhận/từ chối lời mời; thao tác phải gắn với đúng dự án và tài khoản. | P1 (Baseline) | D12 | `apps/api/src/mentor`; `apps/web/src/features/mentor` |
| **REQ-MEN-02** | Mentor | Xem xét/phỏng vấn ứng viên | Mentor xem danh sách ứng viên thuộc dự án được giao và ghi nhận nhận xét/kết quả phỏng vấn nếu quy trình yêu cầu. | P1 (Baseline) | D11, tiếp tục D27 | `apps/api/src/mentor`; `apps/web/src/features/mentor` |
| **REQ-TEAM-01** | Lab Admin / Mentor | Thành lập và quản lý nhóm | Tạo nhóm từ các ứng viên được chấp nhận, quản lý thành viên và vai trò trong phạm vi dự án; quy tắc tạo/sửa nhóm cần PO xác nhận. | P1 (Baseline) | D13 | `apps/api/src/teams`; `apps/web/src/features/team` |
| **REQ-TEAM-02** | Mentor / Talent | Chỉ định trưởng nhóm | Hỗ trợ bổ nhiệm trưởng nhóm bởi mentor hoặc lựa chọn bởi nhóm theo chính sách được duyệt; giới hạn quyền trưởng nhóm trong nhóm được giao. | P1 (Baseline) | D13 | `apps/api/src/teams`; `apps/web/src/features/team` |
| **REQ-TEAM-03** | Talent Leader | Đại diện nhóm trong giao tiếp | Trưởng nhóm đại diện nhóm trong trao đổi với Mentor, Lab và các bên liên quan theo phạm vi quyền được xác nhận; lưu lại nội dung/quyết định quan trọng nếu quy trình yêu cầu. | P1 (Baseline) | D13–D20 | `apps/api/src/teams`; `apps/web/src/features/team` |
| **REQ-OPS-01** | Mentor / Talent Leader | Quản lý task và milestone theo mẫu | Mentor phân rã và theo dõi công việc bằng biểu mẫu Excel/Docs chuẩn do Lab cung cấp; hệ thống hỗ trợ quản lý/ghi nhận theo cách PO xác nhận. Không mặc định tích hợp Jira/Trello hay thay thế các mẫu chuẩn của Lab. | P1 (Baseline) | D11–D20 | `apps/api/src/tasks`; `apps/web/src/features/team` |
| **REQ-OPS-02** | System Admin / Mentor | Sử dụng mẫu Excel/Docs | Mentor sử dụng mẫu chính thức để lập kế hoạch và báo cáo; phối hợp với owner System Admin về phiên bản mẫu, quyền tải lên/tải xuống và lưu trữ. B phụ trách luồng sử dụng trong nghiệp vụ; không nhận ownership cấu hình hệ thống của A. | P1 (Baseline) | D14; tiếp tục theo task/report | `apps/api/src/templates`; `apps/web/src/features/reports` |
| **REQ-REP-01** | Mentor / Talent Leader | Nộp báo cáo tiến độ | Mentor lập báo cáo tháng/giai đoạn; trưởng nhóm có thể gửi báo cáo nhóm theo quyền được duyệt. Theo dõi trạng thái gửi, duyệt, yêu cầu chỉnh sửa và lịch sử báo cáo. | P1 (Baseline) | D16–D20 | `apps/api/src/reports`; `apps/web/src/features/reports` |
| **REQ-REP-02** | Mentor / Talent | Đánh giá và phản hồi | Mentor đánh giá năng lực/hiệu quả và gửi phản hồi cho sinh viên theo tiêu chí được Lab xác nhận; quyền xem kết quả phải được xác định theo vai trò. | P1 (Baseline) | D17–D20 | `apps/api/src/reports`; `apps/web/src/features/mentor` |
| **REQ-REP-03** | Talent Leader / Mentor | Quản lý phân phối phần quỹ của đội | Talent Leader quản lý/đề xuất việc phân phối phần quỹ của đội theo chính sách được duyệt; Mentor xác nhận theo quy trình. B sở hữu luồng nghiệp vụ nhóm và giao diện; A sở hữu ledger/payment core. Công thức, thẩm quyền cuối cùng và việc thực hiện giao dịch phải theo rulebook được PO/Finance phê duyệt. | P1 (Baseline) | D26; phụ thuộc rulebook tài chính | `apps/api/src/reports`; `apps/web/src/features/team` |

Ưu tiên/mốc của B là đề xuất ban đầu, không phải baseline đã ký. Lịch chi tiết theo [file phân công từng ngày](../implementation-plan/07-phan-cong-tung-ngay.md).

### 4.2 Yêu cầu client Flutter

| Req ID | Actor | Tên yêu cầu | Phạm vi phân tích của B | Ưu tiên ban đầu | Mốc dự kiến |
|---|---|---|---|---|---|
| **REQ-MOB-01** | Talent (và actor khác nếu được duyệt) | Ứng dụng Flutter | Phân rã các luồng cần có trên mobile và dùng API chung với hệ thống. **Phạm vi lập kế hoạch hiện tại: Android**, theo lựa chọn đã chốt; cần PO/khách hàng xác nhận chính thức nền tảng, chức năng nghiệm thu và cách phân phối. | P1 (Baseline, chờ PO xác nhận) | Nền tảng D21–D24; hoàn thiện/tích hợp D28–D31 |

Các luồng Talent dự kiến cần PO xác nhận: đăng nhập/hồ sơ, khám phá dự án, đăng ký/xem trạng thái, xem task được giao và nộp báo cáo/tài liệu nếu thuộc phạm vi. Chưa giả định mọi chức năng web đều phải có trên mobile.

### 4.3 NFR, file và tài liệu thuộc miền B

| Req ID / Hạng mục | Trách nhiệm của B | Mốc dự kiến | Phối hợp |
|---|---|---|---|
| **REQ-NFR-B-01 — UX Talent/Mentor** | Làm rõ và kiểm tra giao diện dễ sử dụng; có trạng thái loading, empty, success và error; thông báo lỗi không bị che giấu. | Xuyên suốt; UAT D35 | PO, người dùng thử, A về API error contract |
| **REQ-NFR-B-02 — Quyền riêng tư theo vai trò/nhóm** | Xác định dữ liệu hồ sơ, ứng viên, nhóm, báo cáo và đánh giá được từng actor xem/sửa; bổ sung kiểm thử truy cập đúng/sai phạm vi cho API và client. | D1–D4 đặc tả; kiểm thử xuyên suốt | A owner auth/RBAC shared; B owner quy tắc nghiệp vụ miền B |
| **REQ-FILE-B-01 — Portfolio và tài liệu** | Xác định các luồng B cần tải/xem tài liệu và quyền truy cập; kiểm thử client/luồng nghiệp vụ. Không tự quyết định chính sách lưu trữ hoặc cấu hình dịch vụ. | Khi triển khai profile/task/report | A owner hạ tầng/tích hợp Cloudinary theo phân công hiện tại |
| **REQ-DOC-B — Tài liệu SDLC/UML 2.0** | Cập nhật phần miền Talent/Mentor/Team/Task/Report/Mobile trong URD, SRS, DDD, implementation docs, test docs, source docs và hướng dẫn sử dụng/cài đặt mobile khi cần. | Xuyên suốt D1–D40 | A phụ trách phần Enterprise/Lab/Finance/Infrastructure; thống nhất tài liệu dùng chung |

### 4.4 Câu hỏi nghiệp vụ/UX của B

| Mã CH | Chủ đề | Câu hỏi của Sinh viên B | Req ID liên quan | Phản hồi / quyết định |
|---|---|---|---|---|
| **Q-B01** | Hồ sơ Talent | Những trường hồ sơ nào bắt buộc? Kỹ năng/chứng chỉ có danh mục chuẩn không? Hồ sơ, portfolio và thông tin liên hệ được chia sẻ với doanh nghiệp, mentor hoặc người dùng nào? | `REQ-TAL-01` | *Chờ PO/Lab xác nhận* |
| **Q-B02** | Điều kiện đăng ký | Điều kiện để sinh viên đăng ký dự án là gì? Có giới hạn số dự án/đơn đang hoạt động hoặc yêu cầu kỹ năng, chứng chỉ hay không? | `REQ-TAL-02`, `REQ-TAL-03` | *Chờ PO/Lab xác nhận* |
| **Q-B03** | Rút đơn và trạng thái | Sinh viên được rút đơn ở những trạng thái nào và đến thời điểm nào? Danh sách trạng thái đăng ký, người thay đổi trạng thái và thông tin lý do cần hiển thị ra sao? | `REQ-TAL-03` | *Chờ PO/Lab xác nhận* |
| **Q-B04** | Phỏng vấn/tuyển chọn | Phỏng vấn có bắt buộc cho mọi dự án hay tùy dự án? Ai tạo lịch/ghi kết quả; rubric và trạng thái ứng viên nào được dùng? | `REQ-MEN-02` | *Chờ PO/Mentor xác nhận* |
| **Q-B05** | Thành lập nhóm | Ai có quyền tạo nhóm và chọn thành viên? Nhóm có giới hạn quy mô, số lượng mentor hoặc quy tắc thay đổi thành viên không? | `REQ-TEAM-01` | *Chờ PO/Lab xác nhận* |
| **Q-B06** | Trưởng nhóm | Trưởng nhóm do mentor bổ nhiệm, nhóm bầu chọn hay cho phép cả hai? Ai xác nhận kết quả và khi nào được thay đổi trưởng nhóm? | `REQ-TEAM-02` | *Chờ PO/Mentor xác nhận* |
| **Q-B06a** | Đại diện nhóm | Trưởng nhóm đại diện nhóm qua kênh nào, được trao đổi/quyết định trong phạm vi nào và nội dung nào cần lưu lịch sử? | `REQ-TEAM-03` | *Chờ PO/Mentor/Lab xác nhận* |
| **Q-B07** | Task và milestone | Mentor giao task cho cá nhân hay nhóm? Có trạng thái, hạn hoàn thành, mức độ ưu tiên hoặc quy tắc cập nhật tiến độ chuẩn không? | `REQ-TAL-04`, `REQ-OPS-01` | *Chờ PO/Mentor xác nhận* |
| **Q-B08** | Mẫu Excel/Docs | Lab cung cấp những mẫu nào và định dạng/phiên bản hiện hành là gì? Người dùng tải mẫu để làm ngoài hệ thống rồi tải lên, hay cần nhập/cập nhật các trường ngay trong hệ thống? Ai duyệt phiên bản mới? | `REQ-OPS-01`, `REQ-OPS-02` | *Chờ Lab/System Admin xác nhận* |
| **Q-B09** | Báo cáo và nghiệm thu | Báo cáo tháng/giai đoạn gồm trường nào, hạn nộp và người duyệt là ai? Có quy trình trả lại/chỉnh sửa và mẫu nghiệm thu/deliverable bắt buộc không? | `REQ-REP-01` | *Chờ PO/Mentor/Lab xác nhận* |
| **Q-B10** | Đánh giá và đóng góp | Ai đánh giá ai, theo rubric/chu kỳ nào? Sinh viên có xem phản hồi và điểm/đánh giá của mình không? Ai được xem/chỉnh sửa lịch sử đóng góp? | `REQ-REP-02`, `REQ-REP-03` | *Chờ PO/Mentor xác nhận* |
| **Q-B11** | Phân phối phần quỹ của đội | Trong luồng Leader quản lý/đề xuất phân phối và Mentor xác nhận, cần ghi nhận những thông tin/trạng thái nào? Hệ thống chỉ ghi nhận quyết định hay có bước khởi tạo giao dịch chi tiền; ai có quyền phê duyệt cuối? | `REQ-REP-03` | *Chờ PO/Finance/Mentor xác nhận theo rulebook; phối hợp Q-A06/Q-A07* |
| **Q-B12** | Flutter/Android | Android là nền tảng mục tiêu của kế hoạch B hiện tại. PO xác nhận Android có phải nền tảng nghiệm thu chính thức không? Cần phát hành APK nội bộ hay Google Play; actor và luồng nào bắt buộc trên app? | `REQ-MOB-01` | *Chờ PO xác nhận* |
| **Q-B13** | Tệp portfolio/tài liệu | Những loại và kích thước tệp nào được phép? Tài liệu nào công khai, tài liệu nào chỉ nhóm/mentor/Lab xem được; có thời hạn lưu/xóa nào không? | `REQ-TAL-01`, `REQ-OPS-02` | *Chờ Lab/PO xác nhận; phối hợp owner Cloudinary* |

### 4.5 Phụ thuộc kỹ thuật và phối hợp A/B

| Phụ thuộc | Nhu cầu của B | Owner / việc cần thống nhất |
|---|---|---|
| **User/Auth/Role** | Định danh Talent, Mentor, Leader và quyền/ownership cho API/client. | A sở hữu Auth/RBAC implementation; B đặc tả quyền nghiệp vụ và test allow/deny cho miền B. |
| **Project** | Danh sách/chi tiết dự án đúng trạng thái công bố và điều kiện nhận đơn. | A sở hữu Project lifecycle/status contract; B tiêu thụ contract này. |
| **Application** | Tạo/xem/rút đơn, nhận trạng thái và xử lý chống trùng. | **B sở hữu workflow/schema Application**; A cung cấp Project status contract; hai bên review ranh giới tích hợp. |
| **Team/mentor assignment** | Team tham chiếu application được duyệt, mentor được gán và quyền theo project. | B sở hữu miền Team/Mentor; thống nhất quan hệ và migration ownership trước khi code. |
| **Template/System Admin** | Dùng mẫu trong task/report và quản lý đúng phiên bản. | A sở hữu System Admin/danh mục mẫu; B sở hữu luồng sử dụng template trong nghiệp vụ. |
| **File storage** | Lưu/xem portfolio, template hoặc tài liệu báo cáo có kiểm soát quyền. | A sở hữu hạ tầng/tích hợp Cloudinary; B xác định use case, access rules và kiểm thử sử dụng. |
| **Tài chính** | Talent Leader quản lý/đề xuất phân phối phần quỹ đội và Mentor xác nhận. | B sở hữu workflow nhóm; A sở hữu payment/ledger/API tài chính. Công thức, quyền phê duyệt và giao dịch chờ rulebook. |
| **Lịch triển khai** | Các file giai đoạn trước có mốc khác lịch chi tiết. | Theo quyết định D1, file 07 là nguồn chuẩn; kế hoạch giai đoạn/roadmap đã được đồng bộ. |

## 5. Kết quả cùng chốt D1 giữa Sinh viên A và B

### 5.1 Ma trận owner và ranh giới shared

| Requirement / miền | Owner chính | Ranh giới đã thống nhất |
|---|---|---|
| Auth, RBAC implementation, shared user/account/role | A | B cung cấp yêu cầu quyền Talent/Mentor/Leader và test allow/deny cho module B. |
| Enterprise, proposal, Project lifecycle, Lab/System Admin | A | A sở hữu trạng thái/API Project; B tiêu thụ Project contract. |
| Talent profile, discovery, Application workflow/schema | B | B sở hữu trải nghiệm và nghiệp vụ Application; A cung cấp trạng thái Project và review contract shared. |
| Mentor, Team, Leader, Task, Template usage, Report, Evaluation, contribution | B | System Admin và quản trị danh mục template thuộc A; B sở hữu luồng sử dụng template. |
| Payment, PayOS, ledger, 70/20/10, advance, finance reports | A | B sở hữu thao tác/UX Talent Leader trong phân phối phần quỹ đội; logic và ledger thuộc A. |
| Cloudinary/hạ tầng file | A | B xác định use case, quyền nghiệp vụ và kiểm thử sử dụng cho profile/task/report. |
| Flutter client | B | Android là mục tiêu lập kế hoạch hiện tại; PO còn phải xác nhận nền tảng/phạm vi nghiệm thu chính thức. |

### 5.2 Quyết định và việc còn mở

- **Đã chốt:** B sở hữu Application workflow/schema; A sở hữu Project lifecycle và contract trạng thái dự án.
- **Đã chốt phạm vi phân rã:** Talent Leader đại diện nhóm trong giao tiếp; Leader quản lý/đề xuất phân phối phần quỹ đội, Mentor xác nhận theo policy.
- **Chưa chốt nghiệp vụ:** trạng thái, điều kiện, rubric, quy mô nhóm, quyền đại diện và chi tiết template/report vẫn cần PO/Lab/Mentor xác nhận; chính sách tiền và thao tác giao dịch cần rulebook PO/Finance.
- **Lịch chuẩn:** [file phân công từng ngày](../implementation-plan/07-phan-cong-tung-ngay.md) là nguồn chuẩn về nhiệm vụ/ngày; các file giai đoạn và roadmap được căn chỉnh theo lịch này.
- **Workshop PO:** chưa có tên/liên hệ hoặc khung giờ nên chưa thể ghi là đã đặt lịch. Cần xác định PO, gửi đề nghị workshop D2, ghi người tham dự và quyết định vào decision log.

### 5.3 Checklist hoàn thành D1 của Sinh viên B

- [x] Phân rã yêu cầu Talent, Mentor, Team/Leader, Task/Template, Report/Evaluation và Flutter thành mã `REQ-*` riêng.
- [x] Ghi actor, phạm vi, ưu tiên ban đầu và mốc dự kiến; đánh dấu ưu tiên/lịch là chưa được PO phê duyệt.
- [x] Ghi các câu hỏi nghiệp vụ/UX riêng biệt để dùng trong workshop D2.
- [x] Ghi phụ thuộc kỹ thuật và owner phối hợp; không nhận thay ownership shared của A.
- [x] Ghi Android là lựa chọn lập kế hoạch hiện tại; chờ PO xác nhận chính thức.
- [x] Gộp requirement IDs với A, xác định owner/ranh giới shared và ghi quyết định còn mở.
- [ ] Xác định PO/liên hệ, đề xuất và xác nhận lịch workshop D2 với PO, Lab, mentor và đại diện Talent.

**Checkpoint cuối D1:** A và B đã thống nhất danh sách yêu cầu, owner và ranh giới shared; các câu hỏi chưa quyết định được giữ lại cho PO/decision log, không biến giả định thành baseline.