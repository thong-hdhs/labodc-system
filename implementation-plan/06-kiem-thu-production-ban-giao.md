# Giai đoạn 4 — Kiểm thử hệ thống, UAT, production và bàn giao

**Thời hạn:** D32–D40  
**Mục tiêu:** chứng minh toàn bộ baseline được đáp ứng; đưa phiên bản đã duyệt lên production; nghiệm thu và bàn giao vận hành, không chỉ kết thúc bằng bản build.

**Giới hạn nguồn lực:** hai sinh viên tự kiểm thử code của mình không thay thế QA độc lập hoặc security review. Theo baseline nhóm chọn, D32–D40 dành cho xác minh full scope và rollout; nếu feature còn thiếu ở D32, ghi forecast đỏ và báo PO ngay, không tuyên bố có thể vừa làm tính năng còn thiếu vừa thực hiện đầy đủ UAT/production chỉ nhờ AI.

Hai sinh viên vẫn kiểm thử/sửa lỗi theo miền full-stack riêng, sau đó chạy E2E chung; không chia A chỉ kiểm API và B chỉ kiểm giao diện. Lịch cụ thể tại [bảng D32–D40](./07-phan-cong-tung-ngay.md).

## Đầu vào

- Baseline/traceability matrix và toàn bộ requirement IDs.
- Feature complete candidates, migration scripts, API/mobile builds, integration test evidence.
- NFR test charter đã được khách hàng duyệt.
- Production account/domain/certificates/secrets, backup policy, monitoring, support owner.
- UAT users, test data, test scripts và lịch sign-off.

## Công việc theo ngày

| Ngày | Công việc |
|---|---|
| D32 | Freeze feature baseline; deploy release candidate lên staging; chạy full smoke/regression; đối chiếu traceability |
| D33 | Security/access control tests, privacy/log review, dependency/config scanning; test backup/restore và migration rollback |
| D34 | Load/performance tests theo NFR charter; kiểm tra listing latency/payment processing/throughput và ghi report |
| D35 | UAT với enterprise, talent, mentor, leader, Lab Admin, System Admin; ghi defects; PO phân loại và sign UAT/conditional list |
| D36 | Sửa blocker/critical, regression; release approval; xác nhận production config, backups, monitoring, alert/escalation |
| D37 | Production rollout có kiểm soát; smoke test với tài khoản hạn chế; kiểm tra data migration, health, logs, payment mode |
| D38 | Pilot/rollout người dùng theo kế hoạch đã duyệt; theo dõi alerts, performance, support tickets; rollback nếu release criteria fail |
| D39 | Hoàn tất lỗi còn lại, xác nhận UAT trên production; diễn tập sự cố/rollback/restore; ký handover checklist |
| D40 | Gắn tag/release; bàn giao mã nguồn, tài liệu, credentials theo quy trình an toàn, runbook, training, known issues và nghiệm thu cuối |

Nếu phát hiện blocker ở cuối kỳ, không đánh dấu pass chỉ để giữ ngày. Báo PO/khách hàng, kích hoạt rollback hoặc yêu cầu quyết định chính thức; mọi ngoại lệ phải có chấp thuận và tác động được ghi nhận.

## Đầu ra

- Traceability matrix 100% baseline: mỗi yêu cầu có test/evidence và trạng thái nghiệm thu.
- Test plan, test cases, automation report, defect register, security checklist.
- NFR/load test report theo môi trường/cấu hình và các điều kiện đã thống nhất.
- UAT sign-off theo actor và workflow; danh sách known issues được khách hàng chấp thuận.
- Production release/tag, deployment record, migration record và smoke test evidence.
- HTTPS, secrets management, RBAC admin, backup schedule, restore proof, log/metrics/alerts.
- Rollback/recovery runbook và người/nhóm chịu trách nhiệm sau bàn giao.
- URD, SRS, SAD, DDD, implementation, test, installation, source code và deployment package documentation.
- Hướng dẫn sử dụng/đào tạo và biên bản bàn giao production.

## Chia việc với 2 sinh viên và người nghiệm thu

- **Sinh viên A:** kiểm thử/sửa lỗi full-stack các miền enterprise, Lab, project, payment và System Admin.
- **Sinh viên B:** kiểm thử/sửa lỗi full-stack các miền talent, mentor, team, task/report/template và Flutter.
- **Cả hai:** chạy E2E cross-domain, review chéo, backup/restore/rollback rehearsal và release checklist; không ai tự phê duyệt code critical của chính mình.
- Chi tiết phân công theo ngày và output xem [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md).
- **PO/khách hàng:** thực hiện UAT theo kịch bản, quyết định ngoại lệ và ký nghiệm thu.
- **Reviewer/mentor ngoài nhóm (cần có với payments/production):** security/architecture review và xác nhận các rủi ro vận hành.
- Nếu không có QA/security reviewer ngoài, ghi rõ giới hạn assurance và xin khách hàng chấp thuận; không tuyên bố kiểm thử độc lập đã được thực hiện.

## Điều kiện go/no-go production

- Tất cả blocker/critical đã đóng; high severity có biện pháp/waiver ký duyệt nếu không thể xử lý.
- Migrations đã thử trên bản sao dữ liệu; backup/restore và rollback được kiểm chứng.
- Secrets, HTTPS, quyền, log redaction, monitoring, alert routing đã xác nhận.
- Payment mode được xác nhận; production transaction chỉ bật khi Finance/PO phê duyệt.
- UAT actor/flow pass; NFR report có kết quả, không tuyên bố đạt nếu chưa đo được.
- Người trực vận hành và kênh escalation đã nhận bàn giao.

## Definition of Done

Khách hàng ký nghiệm thu theo baseline; production đáp ứng luồng đã duyệt; release có thể quan sát và rollback; tài liệu và trách nhiệm hậu bàn giao được xác nhận.
