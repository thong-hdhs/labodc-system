# Kế hoạch triển khai LabOdc trong 40 ngày

> **Mục tiêu bàn giao:** ngày D40 đưa sản phẩm đáp ứng baseline yêu cầu khách hàng lên production, hoàn thành UAT và bàn giao vận hành. MVP là mốc trung gian kiểm chứng, không phải tiêu chí hoàn tất đồ án.  
> **Căn cứ:** [yêu cầu LabOdc](../labodc_project_requirements.md), [chiến lược Agile MVP](../labodc_agile_mvp_roadmap_vi.md).  
> **Baseline nhóm đã chọn:** giữ **đầy đủ phạm vi + D40 + 2 sinh viên**, dùng AI hỗ trợ coding. Kế hoạch lấy đây làm mục tiêu cố định, không tự cắt scope. Đây là kế hoạch **rủi ro rất cao/chưa được chứng minh khả thi** khi chưa biết số giờ làm thực tế và kỹ năng production; D4 vẫn phải kiểm tra capacity và nêu rõ khoảng thiếu. AI có thể tăng tốc scaffold/CRUD/test/docs nhưng không tự chịu trách nhiệm về đúng nghiệp vụ, tích hợp, security, tiền thật, UAT hay production. Nếu capacity dự báo thiếu, báo sớm và đề xuất xử lý; không che rủi ro bằng cách tuyên bố AI sẽ giải quyết.

## 1. Cách dùng bộ tài liệu

- Đọc file này để hiểu mục tiêu, mốc và cách phối hợp.
- Mỗi giai đoạn có một file riêng, ghi rõ **đầu vào → việc phải làm → đầu ra → người chịu trách nhiệm → điều kiện nghiệm thu**.
- Dùng requirement ID trong traceability matrix để nối yêu cầu khách hàng với story, code, test case và kết quả UAT.
- Mọi thay đổi yêu cầu sau khi baseline được ký phải có phân tích ảnh hưởng và khách hàng/PO phê duyệt; không tự loại tính năng.

## 2. Baseline phạm vi bàn giao

Baseline nhóm đã chọn là bàn giao toàn bộ các mục dưới đây trong ngày 40. Với 2 sinh viên vibecode, forecast ban đầu **đỏ/rủi ro rất cao**; kế hoạch giữ mục tiêu, dùng AI có kiểm soát và cần PO phản hồi nhanh cùng mentor/reviewer hỗ trợ phần rủi ro. Bao gồm:

- Vai trò: doanh nghiệp, sinh viên/talent, trưởng nhóm, mentor, Lab Admin, System Admin.
- Web portal, admin dashboard, backend REST API và ứng dụng Flutter theo nền tảng được xác nhận.
- Đề xuất/duyệt/công bố dự án, hồ sơ, đăng ký tham gia, thành lập nhóm và theo dõi dự án.
- Quản lý mentor, nhiệm vụ theo biểu mẫu Excel/Docs, báo cáo, đánh giá, nghiệm thu, yêu cầu đổi phạm vi/hủy.
- Luồng khoản đóng góp/thanh toán, quy tắc 70/20/10, phân phối/ghi nhận quỹ, xử lý chậm thanh toán và tạm ứng — chỉ theo chính sách và phê duyệt bằng văn bản.
- PayOS, Cloudinary, PostgreSQL, Redis, Elasticsearch, Docker/AWS nếu khách hàng xác nhận các thành phần này là deliverable bắt buộc.
- Tài liệu URD, SRS, SAD, DDD, implementation, test, installation, source code và deployment.
- NFR: 99% uptime, listing dưới 5 giây, thanh toán dưới 3 giây, hàng trăm người dùng đồng thời, bảo vệ dữ liệu và UX. Các mục phải được cụ thể hóa thành cách đo, môi trường và ngưỡng pass trước khi kiểm thử.

Không diễn giải công nghệ có tên trong đề xuất thành yêu cầu kiến trúc vô điều kiện: PO/khách hàng cần xác nhận cách dùng và tiêu chí nghiệm thu. Nhưng không được tự ý bỏ bất kỳ hạng mục nào đã nằm trong baseline ký duyệt.

## 3. Lịch tổng thể

| Giai đoạn | Ngày | Mục tiêu/gate chính | File chi tiết |
|---|---:|---|---|
| 0. Khám phá, baseline | D1–D4 | Chốt yêu cầu, chính sách, tiêu chí nghiệm thu và capacity | [01-khoi-dong-va-baseline.md](./01-khoi-dong-va-baseline.md) |
| 1. Nền tảng và MVP dự án/tuyển chọn | D5–D10 | Auth/RBAC và demo doanh nghiệp → Lab → công bố → Talent đăng ký | [02-nen-tang-va-danh-tinh.md](./02-nen-tang-va-danh-tinh.md), [03-du-an-va-tuyen-chon.md](./03-du-an-va-tuyen-chon.md) |
| 2. Mentor, nhóm, vận hành và tài chính ban đầu | D11–D20 | Mentor/team/task/report; các lát cắt PayOS/ledger/file theo policy | [04-mentor-va-van-hanh.md](./04-mentor-va-van-hanh.md) |
| 3. Search, Flutter, tích hợp và release candidate | D21–D31 | Mobile, search/cache, tài chính/tích hợp còn lại, regression và RC | [05-tai-chinh-tich-hop-mobile.md](./05-tai-chinh-tich-hop-mobile.md) |
| 4. Kiểm thử/production | D32–D40 | Hardening, NFR, UAT, rollout và bàn giao | [06-kiem-thu-production-ban-giao.md](./06-kiem-thu-production-ban-giao.md) |

Phân công **từng ngày cho cả hai người, có input/output và checkpoint tích hợp** tại [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md). Theo quyết định chốt D1, file 07 là nguồn chuẩn về ngày và nội dung task; các file giai đoạn đã được căn chỉnh theo lịch đó. Lát cắt D7–D10 trong file 03 là phần chi tiết MVP nằm bên trong Giai đoạn 1, không phải giai đoạn nối tiếp sau D10.

## 4. Nhịp Agile và quy tắc vận hành

- Chạy **4 sprint 10 ngày**: D1–D10, D11–D20, D21–D30, D31–D40. Giai đoạn trong bảng trên chia nhỏ hơn để tạo các gate và bàn giao giữa nhóm.
- Mỗi ngày: sync ngắn, cập nhật board, nêu blocker và chủ sở hữu/ngày cần giải quyết.
- Mỗi sprint: planning, refinement ít nhất một lần, demo với khách hàng, retrospective và cập nhật forecast.
- Ưu tiên vertical slice: mỗi story đi qua UI, API, DB, authorization, kiểm thử và tài liệu liên quan.
- Tích hợp vào nhánh chính thường xuyên; deploy staging tối thiểu mỗi sprint, không chờ đến cuối.
- Dành năng lực QA/DevOps xuyên suốt; D32–D40 dùng để xác nhận và ổn định, không phải lần đầu mới kiểm thử hệ thống.
- Mọi thay đổi scope cần ghi: requirement ID, lý do, ảnh hưởng effort/rủi ro/ngày bàn giao, quyết định của người có thẩm quyền.

## 5. Chia việc theo vertical slice — không chia BE/FE

| Owner | Trách nhiệm chính | Cách chia việc/sản phẩm |
|---|---|---|
| Sinh viên A | Owner lát cắt doanh nghiệp/Lab: proposal/project lifecycle, project admin, payment/fund, system admin | Tự làm UI + API + data + test cho module được giao; không chỉ làm backend |
| Sinh viên B | Owner lát cắt talent/mentor: profile/application, team, task/report/evaluation, template; Flutter client theo baseline | Tự làm UI + API + data + test cho module được giao; không chỉ làm frontend |
| Cả A và B | API contract, tích hợp, review chéo, NFR và release | Hai lát cắt tách module/file; thống nhất contract trước; review PR, test staging và cập nhật tài liệu |
| Khách hàng/PO (bắt buộc) | Nghiệp vụ và nghiệm thu | Trả lời câu hỏi nhanh, ký rulebook/baseline, cung cấp tài khoản/tài liệu, tham gia UAT |
| Mentor/reviewer bên ngoài (khuyến nghị) | Rà soát chuyên môn | Review security, payments, AWS/production và kiến trúc; không thay thế trách nhiệm của nhóm |

Hai người làm song song trên **hai module nghiệp vụ độc lập**; mỗi người làm xuyên suốt backend và frontend của module mình, không chia thành BE/FE. Quy tắc tránh đụng file, API contract, migration và checkpoint cuối ngày nằm trong [file phân công hằng ngày](./07-phan-cong-tung-ngay.md).

## 6. Definition of Ready / Definition of Done

### Ready

- Có requirement ID, actor, giá trị, luồng chính/ngoại lệ và acceptance criteria.
- Đã xác định quyền, dữ liệu, trạng thái và phụ thuộc.
- Có thiết kế/API cần thiết hoặc spike đã giải quyết rủi ro kỹ thuật.
- Được PO ưu tiên và nhóm ước lượng đủ nhỏ để kiểm soát.

### Done

- Code review, CI pass, migration và API docs cập nhật.
- Unit/integration test phù hợp; luồng có ảnh hưởng cao có end-to-end test.
- Kiểm tra authorization ở backend và dữ liệu của từng vai trò.
- Có UI state và lỗi được báo rõ; không dùng success-shaped fallback.
- Requirement ID được nối với test case và bằng chứng.
- Deploy staging; smoke test; tài liệu liên quan được cập nhật.
- Trước production: security/config/backup/monitoring/rollback và phê duyệt release hoàn tất.

## 7. Kiểm soát tiến độ và tiêu chí cảnh báo

- **D2:** nếu chưa có PO, người quyết định nghiệp vụ hoặc quyền truy cập dịch vụ/hạ tầng quan trọng, báo blocker và xin quyết định.
- **D4 — forecast bắt buộc:** tính số giờ khả dụng thực tế của hai sinh viên (trừ học tập/nghỉ), ước lượng mỗi requirement có buffer test/UAT/production. Giữ baseline full scope/D40 theo quyết định hiện tại; nếu forecast đỏ, ghi cụ thể khoảng thiếu, phụ thuộc và cách giảm rủi ro bằng AI/review ngoài/giảm thời gian chờ khách hàng, không che forecast.
- **D10:** nếu CI, schema, auth/RBAC và staging chưa chạy, dừng mở rộng tính năng; xử lý nền tảng.
- **D17:** luồng dự án/tuyển chọn chưa end-to-end là critical path.
- **D24:** nếu luồng vận hành mentor/nhóm chưa review được, báo sớm forecast trễ; nhờ PO/mentor/reviewer xử lý blocker và dùng AI để tăng tốc tác vụ có thể kiểm chứng, không che trễ bằng cách bỏ test hoặc âm thầm loại yêu cầu.
- **D31:** không vào hệ thống test nếu còn thiếu tính năng trong baseline hoặc tích hợp chưa có test evidence.
- **D35:** UAT baseline hoàn tất hoặc có danh sách blocker được khách hàng quyết định; không coi lỗi blocker là “known issue” để bàn giao.
- **D40:** production release, nghiệm thu, runbook, quyền truy cập và trách nhiệm vận hành được bàn giao.

## 8. Rủi ro phải quản lý

1. **Scope lớn hơn năng lực 40 ngày:** đo effort trong D1–D4; báo forecast thật hằng ngày; dùng AI cho công việc có thể kiểm chứng và xin mentor/reviewer hỗ trợ các phần rủi ro cao.
2. **Chính sách tiền chưa rõ:** không tự suy luận; yêu cầu ký rulebook, luồng lỗi/hoàn tiền/đối soát trước production.
3. **Dịch vụ/tài khoản chưa sẵn sàng:** lấy credentials và sandbox từ D1; spike PayOS/Cloudinary/mobile/AWS trong tuần đầu.
4. **NFR mơ hồ:** chốt workload, percentile, cửa sổ đo, môi trường và loại trừ phụ thuộc bên thứ ba.
5. **UAT trễ:** đặt lịch người dùng/PO từ D1, duyệt kịch bản trước D10 và giữ thời gian phản hồi.
6. **Production chưa có người vận hành:** xác nhận owner, on-call/escalation, backup, chi phí và quyền truy cập trước khi rollout.

## 9. Việc bắt đầu ngay hôm nay

1. Tạo board dự án với các cột Backlog → Ready → In Progress → Review → Test → Done.
2. Lập danh sách thành viên, kỹ năng, thời gian/ngày và phân vai; một người có thể kiêm nhiệm nhưng không để nhiệm vụ “không owner”.
3. Đặt workshop D1 với khách hàng/PO và mời đại diện doanh nghiệp, sinh viên, mentor, Lab, tài chính, vận hành.
4. Tạo requirement IDs và decision log từ file yêu cầu.
5. Xác nhận tài khoản Git, cloud/AWS, domain, PayOS sandbox, Cloudinary, app distribution và quyền cần thiết.
6. Bắt đầu phase 0 theo [01-khoi-dong-va-baseline.md](./01-khoi-dong-va-baseline.md).

## 10. Workflow vibecode/AI-assisted cho hai sinh viên

### Vòng lặp cho từng story

1. **Human spec:** ghi requirement ID, actor, luồng chính/ngoại lệ, quyền, acceptance criteria, trạng thái/lỗi và dữ liệu mẫu; PO xác nhận rule chưa rõ.
2. **AI plan:** yêu cầu AI đọc đúng file liên quan, nêu giả định, file dự định đổi và test cần có; không cho AI tự thêm scope hoặc quyết định chính sách.
3. **Task nhỏ, bounded:** một thay đổi một mục tiêu; ưu tiên API/UI/test theo vertical slice, không prompt “xây toàn bộ hệ thống”.
4. **Generate + inspect:** AI tạo scaffold/CRUD/test; sinh viên đọc diff, kiểm tra validation, authorization, side effects, migration và error handling.
5. **Run tests:** format/lint/typecheck, unit/integration và acceptance steps; AI sinh test không đồng nghĩa test đúng, cần negative tests.
6. **Review chéo:** người không viết story review; auth/payment/file access/deployment nên có mentor/reviewer có kinh nghiệm khi có thể.
7. **Merge + deploy staging:** merge thường xuyên, smoke test, cập nhật traceability/docs và decision/risk log.

### Phân công

- **Sinh viên A:** primary backend/domain/data; dùng AI tạo NestJS/schema/API/test theo requirement ID; chịu trách nhiệm kiểm tra rule, migration và quyền.
- **Sinh viên B:** primary web/client và Flutter theo baseline; dùng AI tạo component/form/client/test; chịu trách nhiệm UX, error states và platform build.
- **Cả hai:** BA-lite, QA, security checklist, tài liệu và DevOps; review chéo tối thiểu mỗi PR. AI agents chỉ nhận việc độc lập có API contract rõ; sinh viên chịu trách nhiệm tích hợp và nghiệm thu.
- Dùng AI nhiều cho boilerplate, CRUD, draft test/docs, migration draft và lỗi build có bằng chứng. Không giao AI tự phê duyệt financial logic, authorization, security fixes hoặc production release.

### Capacity tracking

Ghi actual hours/ngày theo feature, integration, review, test, documentation và rework. Forecast = effort còn lại theo estimate sau velocity thực tế của sprint đầu. Không ngoại suy tốc độ sinh code thành tốc độ hoàn tất sản phẩm; tích hợp, hiểu code và sửa lỗi cũng tiêu tốn capacity.

Công thức tham khảo: `2 người × số ngày làm thực tế × số giờ tập trung/người/ngày`, rồi trừ họp, học tập, review, test, integration, UAT và rework. Ví dụ 4 giờ tập trung/ngày trong 40 ngày chỉ là 320 giờ gross trước các phần bị trừ; phải ghi giờ thực tế, không mặc định toàn thời gian.

## 11. Câu hỏi cần khách hàng quyết định

Không tự giả định câu trả lời cho các vấn đề ảnh hưởng scope:

- 40 ngày là ngày liên tục hay ngày làm việc; D1 cụ thể là ngày nào?
- Flutter bắt buộc phát hành Android, iOS hay cả hai; có cần store approval trong ngày 40 không?
- Thanh toán production có bắt buộc chạy giao dịch thật hay chỉ nghiệm thu tích hợp sandbox? Ai sở hữu tài khoản PayOS?
- “Lab tạm ứng” là luồng ghi nhận/phê duyệt nội bộ hay chuyển tiền thật? Ai phê duyệt, nguồn quỹ và quy tắc hoàn trả?
- Hàng trăm concurrent users và các ngưỡng thời gian được đo trong điều kiện nào?
- Ai duyệt yêu cầu thay đổi/hủy, tiêu chí nghiệm thu dự án, đóng góp và chia 70/20/10?
- AWS account/domain/data residency, backup retention, privacy policy và người trực production thuộc bên nào?
