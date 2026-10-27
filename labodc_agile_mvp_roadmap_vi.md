# Chiến lược triển khai LabOdc theo Agile: MVP trước, mở rộng sau

> **Mục đích:** Chuyển yêu cầu LabOdc thành một lộ trình triển khai có thể bắt đầu ngay, kiểm soát được phạm vi và tạo ra sản phẩm chạy được theo từng đợt.  
> **Căn cứ:** `labodc_project_requirements.md`.  
> **Ràng buộc thời gian/nguồn lực:** Tổng thời gian là **40 ngày từ D1 đến ngày bàn giao**; nhóm chọn giữ toàn bộ phạm vi với **2 sinh viên vibecode/AI-assisted**. Ngày 40 là sản phẩm đầy đủ theo baseline, production và được khách hàng nghiệm thu. Với thông tin hiện có, mục tiêu này **rủi ro rất cao/chưa chứng minh khả thi**. Kế hoạch cần forecast capacity thực tế, dùng AI có kiểm soát và báo rủi ro minh bạch; AI-generated code không thay thế review, kiểm thử hay trách nhiệm production.

## 1. Tóm tắt đề xuất

LabOdc hiện được mô tả như một hệ sinh thái lớn gồm cổng doanh nghiệp, cổng sinh viên, bảng điều khiển mentor và Lab, quản trị hệ thống, thanh toán, phân phối quỹ, hỗ trợ tạm ứng, báo cáo, ứng dụng di động và nhiều thành phần hạ tầng. Nếu triển khai tất cả cùng lúc, nhóm có nguy cơ hoàn thành nhiều màn hình rời rạc nhưng không có quy trình đầu-cuối đáng tin cậy.

**Đề xuất:** phát triển tăng dần theo các lát cắt dọc (vertical slices), mỗi lát cắt bao gồm giao diện, API, dữ liệu, quyền truy cập và kiểm thử. MVP là mốc kiểm chứng sớm, không phải phạm vi cuối cùng. Sản phẩm bàn giao ngày 40 phải bao phủ đầy đủ các yêu cầu đã thống nhất từ khách hàng, gồm:

1. Doanh nghiệp tạo đề xuất dự án.
2. Lab xem xét và duyệt hoặc từ chối.
3. Dự án đã duyệt được công bố.
4. Sinh viên xem dự án và gửi đăng ký tham gia.
5. Lab/mentor xem danh sách đăng ký và cập nhật kết quả.
6. Các bên theo dõi trạng thái dự án và lịch sử thay đổi.
7. Mentor và trưởng nhóm quản lý đội, nhiệm vụ theo biểu mẫu chuẩn, báo cáo, đánh giá và đóng góp.
8. Lab quản lý doanh nghiệp, dự án, mentor, sinh viên, phê duyệt, phân bổ quỹ và báo cáo minh bạch.
9. Quản trị viên hệ thống quản lý cấu hình, vai trò/quyền và mẫu Excel.
10. Các luồng thanh toán, phân bổ 70/20/10, yêu cầu đổi phạm vi/hủy và cơ chế hỗ trợ quỹ được triển khai theo chính sách đã được khách hàng phê duyệt.
11. Portal web, dashboard quản trị và ứng dụng di động Flutter được hoàn thiện theo phạm vi nền tảng được xác nhận.

MVP có thể bắt đầu bằng lát cắt web để xác minh luồng nghiệp vụ, nhưng không được dùng điều đó để loại các deliverable bắt buộc khỏi phạm vi bàn giao. Các yêu cầu về thanh toán, tạm ứng, ứng dụng di động, Redis/Elasticsearch và hạ tầng AWS phải được làm rõ, ước lượng và đưa vào kế hoạch phát hành. Không xử lý tiền thật cho tới khi quy trình nghiệp vụ, tài khoản nhà cung cấp, bảo mật và phê duyệt production sẵn sàng.

## 2. Định nghĩa thành công

MVP thành công ở mốc giữa khi luồng cốt lõi có thể kiểm chứng. **Bàn giao cuối cùng thành công** khi toàn bộ phạm vi đã chốt từ tài liệu yêu cầu và các quyết định nghiệp vụ bổ sung được triển khai, kiểm thử, vận hành trên production và được khách hàng nghiệm thu.

### Tiêu chí đo lường ban đầu

- Một doanh nghiệp có thể gửi đề xuất dự án và xem trạng thái xử lý.
- Lab có thể xem hàng đợi, duyệt/từ chối kèm lý do; quyết định được lưu cùng thời điểm và người thực hiện.
- Sinh viên có thể tìm dự án đã công bố và đăng ký; không thể đăng ký trùng hoặc đăng ký dự án chưa mở.
- Lab/mentor có thể xem và cập nhật kết quả đăng ký theo quyền được cấp.
- Các vai trò không thể truy cập dữ liệu hoặc thao tác không được phép bằng cách gọi API trực tiếp.
- Các luồng chính có kiểm thử tự động và có dữ liệu demo có thể tái tạo.
- Người dùng thử nghiệm hiểu được bước tiếp theo mà không cần hướng dẫn trực tiếp từ lập trình viên.
- Các chức năng và vai trò trong phạm vi được ký duyệt đều có tiêu chí nghiệm thu và bằng chứng kiểm thử.
- Các tích hợp thanh toán, lưu trữ tài liệu, ứng dụng di động và các dịch vụ hạ tầng bắt buộc hoạt động ở môi trường production theo chính sách đã duyệt.
- Ứng dụng production có HTTPS, cấu hình bí mật ngoài source code, sao lưu cơ sở dữ liệu có kiểm tra khôi phục, log/giám sát lỗi và quy trình rollback đã diễn tập.
- Tài khoản production, quyền quản trị, người trực vận hành và cách báo lỗi đã được bàn giao rõ ràng.

Các NFR ghi trong yêu cầu — 99% uptime, hàng trăm người dùng đồng thời, danh sách dự án dưới 5 giây và xử lý thanh toán dưới 3 giây — phải được chuyển thành kịch bản/điều kiện đo cụ thể và kiểm thử trong môi trường tương ứng. Không được tuyên bố đạt chỉ dựa trên một bản deploy; các chỉ số production cần có monitoring và kết quả kiểm thử làm bằng chứng.

## 3. Phạm vi theo giai đoạn

### Giai đoạn 0 — Khám phá và chốt phạm vi

**Mục tiêu:** giảm mơ hồ nghiệp vụ trước khi viết nhiều mã.

- Phỏng vấn đại diện doanh nghiệp, sinh viên, mentor và Lab; xác nhận ai có quyền thực hiện từng quyết định.
- Vẽ quy trình hiện tại và quy trình mục tiêu từ gửi dự án đến kết thúc dự án.
- Thống nhất trạng thái và quy tắc chuyển trạng thái của dự án/đăng ký.
- Xác nhận dữ liệu bắt buộc, hồ sơ người dùng, điều kiện tham gia và cách xử lý khiếu nại/hủy.
- Xác nhận ý nghĩa “thanh toán”, “phân phối quỹ”, “tạm ứng”; người chịu trách nhiệm pháp lý và cách đối soát.
- Chọn lát cắt đầu tiên để kiểm chứng nhanh; đề xuất bắt đầu bằng web responsive, đồng thời lập kế hoạch riêng cho Flutter để vẫn đáp ứng baseline cuối.
- Phân rã toàn bộ yêu cầu thành backlog, tiêu chí nghiệm thu, ma trận truy vết và danh sách câu hỏi chưa được quyết định.

**Đầu ra:** sơ đồ actor/use case, luồng nghiệp vụ, glossary, baseline yêu cầu đầy đủ, traceability matrix, backlog theo release, wireframe cho các actor, quyết định kiến trúc ban đầu, danh sách rủi ro và tiêu chí nghiệm thu.

### Giai đoạn 1 — MVP vận hành dự án và đăng ký tham gia

Đây là phiên bản nhỏ đầu tiên để xác nhận luồng và kiến trúc, không phải sản phẩm bàn giao cuối cùng.

**Bao gồm:**

- Đăng nhập và phân quyền tối thiểu cho doanh nghiệp, sinh viên, Lab/mentor.
- Hồ sơ doanh nghiệp và hồ sơ sinh viên ở mức tối thiểu.
- Doanh nghiệp tạo, sửa bản nháp và gửi đề xuất dự án.
- Lab xem, yêu cầu bổ sung, duyệt hoặc từ chối đề xuất.
- Công bố/đóng dự án đã duyệt.
- Sinh viên duyệt danh sách, xem chi tiết và gửi/hủy đăng ký theo quy tắc đã thống nhất.
- Lab/mentor xem danh sách ứng viên và cập nhật trạng thái đăng ký.
- Trang tổng quan theo vai trò và lịch sử hoạt động thiết yếu.
- Dữ liệu mẫu có kiểm soát, hướng dẫn chạy cục bộ và triển khai production.

**Không đưa vào MVP đầu tiên:** các hạng mục phức tạp này được hoãn khỏi lát cắt ban đầu, nhưng nếu thuộc yêu cầu khách hàng đã ký duyệt thì vẫn phải hoàn thành và nghiệm thu trước ngày 40: thanh toán production, phân bổ 70/20/10, cơ chế tạm ứng, ứng dụng Flutter, báo cáo minh bạch và các tích hợp dịch vụ bắt buộc. Mỗi hạng mục cần điều kiện đầu vào/đầu ra, chủ sở hữu nghiệp vụ và tiêu chí nghiệm thu rõ ràng.

### Giai đoạn 2 — Quản lý thực hiện dự án (phát triển sau MVP, trước D40)

- Thành lập nhóm, chỉ định trưởng nhóm và mentor.
- Giao nhận đầu ra theo giai đoạn; tải lên tài liệu và biên bản nghiệm thu.
- Biểu mẫu báo cáo tiến độ/tháng theo mẫu của Lab.
- Đánh giá đóng góp và phản hồi mentor.
- Yêu cầu thay đổi phạm vi, hủy dự án và quy trình phê duyệt.
- Nhật ký kiểm toán đầy đủ hơn và xuất dữ liệu/báo cáo.

### Giai đoạn 3 — Tài chính, tích hợp và vận hành (phát triển sau MVP, trước D40 nếu thuộc baseline)

- Tích hợp PayOS theo môi trường được khách hàng yêu cầu; kiểm thử sandbox trước khi production, xử lý webhook có xác thực và chống ghi nhận giao dịch trùng.
- Sổ cái giao dịch, đối soát, phê duyệt thủ công và báo cáo tài chính.
- Chỉ xem xét tự động hóa phân phối/tạm ứng sau khi chính sách, trách nhiệm, kiểm soát gian lận và quy trình hoàn trả được Lab phê duyệt.
- Thông báo email, tìm kiếm nâng cao, tối ưu tải và đo lường khả năng mở rộng.
- Xây và phát hành Flutter, Redis/Elasticsearch, Cloudinary và các thành phần AWS nếu khách hàng xác nhận chúng thuộc baseline bàn giao; không loại bỏ hạng mục chỉ vì MVP ban đầu là web.

Các giai đoạn 1–3 là thứ tự phát triển trong cùng 40 ngày, không phải cam kết chuyển P1/P2 sang sau ngày bàn giao. Sau ngày 40 chỉ còn việc ngoài baseline hoặc các thay đổi được khách hàng phê duyệt riêng.

## 4. Kế hoạch triển khai Agile trong 40 ngày

MVP là mốc kiểm chứng giữa chặng; ngày 40 phải hoàn tất toàn bộ baseline khách hàng ký duyệt, production và nghiệm thu. Lịch chi tiết, đầu vào/đầu ra, owner và gate nằm trong [bộ kế hoạch theo giai đoạn](./implementation-plan/00-ke-hoach-tong-the.md). Các mốc thống nhất:

| Giai đoạn | Ngày | Mục tiêu |
|---|---:|---|
| 0. Khởi động và baseline | D1–D4 | Chốt yêu cầu, chính sách, acceptance criteria, nguồn lực và khả thi |
| 1. Nền tảng và danh tính | D5–D10 | CI/CD, môi trường, dữ liệu, JWT/RBAC, khung web/mobile |
| 2. Dự án và tuyển chọn | D11–D17 | Đề xuất, duyệt, công bố, sinh viên đăng ký |
| 3. Mentor và vận hành | D18–D24 | Nhóm, mentor/leader, task/template, báo cáo, đánh giá |
| 4. Tài chính và tích hợp | D25–D31 | Quỹ/thanh toán theo policy, PayOS, Cloudinary, Flutter và thành phần baseline |
| 5. Kiểm thử, UAT, production | D32–D40 | Hồi quy, NFR, UAT, rollout, nghiệm thu, bàn giao |

Các giai đoạn là mốc kiểm soát. Với 2 người, không thể giả định BA, Backend, Web, Flutter, QA, Security và DevOps đều là luồng song song chuyên trách. QA, DevOps, security, tài liệu và spike tích hợp vẫn phải làm từ D1 nhưng sẽ cạnh tranh thời gian với phát triển. Cuối D4 cần forecast capacity toàn bộ baseline; nếu đỏ, báo cụ thể khoảng thiếu và xin PO/mentor hỗ trợ. Giữ baseline đã chốt, không âm thầm bỏ yêu cầu hay hạ tiêu chí nghiệm thu.

**Cách tính capacity tại D4:** `2 người × số ngày làm thực tế × số giờ tập trung/người/ngày`, sau đó trừ thời gian họp, học tập, review, kiểm thử, tích hợp, UAT và sửa lỗi. Ví dụ 4 giờ tập trung/ngày trong 40 ngày chỉ tạo 320 giờ gross trước các phần bị trừ; không được lập kế hoạch theo giả định làm toàn thời gian nếu thực tế không phải vậy.

**Phân công thực tế:** Sinh viên A làm primary backend/domain/data; Sinh viên B làm primary client/UI; cả hai luân phiên phân tích, test, review chéo, tài liệu và deploy. Flutter, payments thật, AWS production và security-sensitive work cần mentor/reviewer có kinh nghiệm; nếu không có, phải báo rủi ro và xin quyết định scope/hạn, không giao code cho AI rồi coi là nghiệm thu.

Mỗi sprint cần planning, sync ngắn hằng ngày, refinement, demo với PO và retrospective. Mỗi story đi qua giao diện, API, dữ liệu, authorization, kiểm thử và tài liệu; deploy staging tối thiểu mỗi sprint. Yêu cầu NFR phải có cách đo/ngưỡng pass cụ thể; thanh toán production chỉ được bật sau khi chính sách, vận hành và phê duyệt phù hợp đã hoàn tất.

## 5. Backlog ưu tiên mẫu

### P0 — Nền tảng/MVP để xác minh sớm

1. Là người dùng, tôi có thể đăng nhập để truy cập đúng chức năng theo vai trò.
2. Là doanh nghiệp, tôi có thể tạo và gửi đề xuất dự án để Lab xem xét.
3. Là Lab, tôi có thể xem hàng đợi và duyệt/từ chối/yêu cầu bổ sung dự án.
4. Là doanh nghiệp, tôi có thể theo dõi trạng thái và lý do xử lý đề xuất.
5. Là Lab, tôi có thể công bố/đóng dự án đã duyệt.
6. Là sinh viên, tôi có thể xem và tìm dự án đang nhận đăng ký.
7. Là sinh viên, tôi có thể đăng ký tham gia và xem trạng thái đăng ký.
8. Là Lab/mentor, tôi có thể xem danh sách đăng ký và cập nhật kết quả.
9. Là quản trị viên, tôi có thể quản lý người dùng/khóa tài khoản ở mức tối thiểu để xử lý vận hành.

### P1 — Bắt buộc hoàn thành trước nghiệm thu cuối ngày 40

- Quản lý mentor và mời mentor vào dự án.
- Tạo nhóm, chỉ định trưởng nhóm, phân công thành viên.
- Nộp báo cáo theo giai đoạn/tháng, tài liệu và kết quả nghiệm thu theo biểu mẫu.
- Đánh giá, ghi nhận đóng góp và quy trình trưởng nhóm phân phối quỹ nếu được chính sách xác nhận.
- Yêu cầu thay đổi phạm vi/hủy và quy trình phê duyệt.
- Dashboard doanh nghiệp, ứng viên, mentor, Lab và system admin theo yêu cầu.
- Thanh toán/tích hợp PayOS, quy tắc 70/20/10, hỗ trợ tạm ứng và đối soát theo chính sách đã duyệt.
- Flutter, Cloudinary, Redis, Elasticsearch, Docker/AWS và các thành phần được khách hàng xác nhận là bắt buộc.
- Báo cáo minh bạch, lịch sử kiểm toán, cấu hình vai trò/quyền và quản lý mẫu Excel.

### Hạng mục cần đặc tả/đo trước khi nghiệm thu

- Mức 99% uptime: kỳ đo, thời gian bảo trì và ngoại lệ.
- “Hàng trăm concurrent users”: số người dùng đồng thời, kịch bản tải và thời lượng test.
- “Dưới 5 giây” và “dưới 3 giây”: điểm bắt đầu/kết thúc, môi trường, percentile và cách loại trừ lỗi bên thứ ba.
- Thanh toán, tạm ứng, phân bổ và hoàn tiền: trạng thái, quy tắc làm tròn, webhook, đối soát, người duyệt, xử lý giao dịch lỗi và trách nhiệm vận hành.

MoSCoW/WSJF dùng để sắp thứ tự phát triển và giảm rủi ro, **không được dùng để tự ý loại yêu cầu bắt buộc**. Chỉ khách hàng/PO có thẩm quyền mới chấp thuận thay đổi phạm vi hoặc tiêu chí nghiệm thu.

## 6. Ví dụ tiêu chí nghiệm thu

### Gửi và duyệt đề xuất dự án

- Đề xuất bắt buộc có các trường đã được Lab thống nhất; lỗi được hiển thị ngay tại trường liên quan.
- Doanh nghiệp chỉ sửa bản nháp hoặc đề xuất được trả về bổ sung; không tự sửa nội dung đã duyệt trái quy trình.
- Lab có thể duyệt, từ chối hoặc yêu cầu bổ sung; thao tác từ chối/yêu cầu bổ sung cần có lý do.
- Mỗi thay đổi trạng thái lưu người thao tác, thời điểm và trạng thái trước/sau.
- Chỉ Lab có quyền duyệt; kiểm tra quyền được thực hiện ở API, không chỉ ẩn nút trên giao diện.

### Đăng ký tham gia dự án

- Chỉ dự án đã công bố và đang nhận đăng ký mới cho phép đăng ký.
- Một sinh viên không thể tạo nhiều đăng ký hoạt động cho cùng dự án.
- Hệ thống hiển thị xác nhận khi đăng ký thành công và trạng thái hiện tại.
- Sinh viên chỉ xem dữ liệu của mình; mentor/Lab chỉ xem dữ liệu theo phạm vi được giao.
- Các trường hợp cạnh tranh (đăng ký đồng thời, dự án vừa đóng) được xử lý nhất quán ở backend.

## 7. Cách tổ chức Agile cho nhóm đồ án

### Vai trò gợi ý

- **Product Owner:** một người đại diện nghiệp vụ/Lab hoặc thành viên nhóm được chỉ định; có quyền quyết định thứ tự backlog và trả lời câu hỏi nghiệp vụ.
- **Scrum Master/facilitator:** luân phiên hoặc một thành viên đảm bảo nhóm gỡ trở ngại, giữ nhịp và cải tiến cách làm.
- **Nhóm phát triển:** frontend, backend, QA/kiểm thử, DevOps/tài liệu là trách nhiệm; nhóm nhỏ có thể kiêm nhiệm nhưng cần người chịu trách nhiệm rõ cho từng phần.
- **Người phản biện/đại diện người dùng:** mentor, sinh viên, doanh nghiệp hoặc giảng viên tham gia review theo khả năng.

### Nhịp làm việc mỗi sprint

1. **Sprint Planning:** chọn mục tiêu sprint; phân rã story thành việc nhỏ; chỉ nhận việc có tiêu chí nghiệm thu và phụ thuộc rõ.
2. **Daily sync ngắn:** mỗi người nêu tiến triển, việc tiếp theo và blocker; cập nhật bảng công việc, không biến thành buổi báo cáo dài.
3. **Refinement:** làm rõ các story sắp tới, xác nhận quy tắc và kiểm tra độ lớn trước sprint kế tiếp.
4. **Sprint Review:** demo trực tiếp sản phẩm chạy được cho người liên quan; ghi nhận phản hồi thành backlog, không sửa phạm vi giữa sprint tùy tiện.
5. **Retrospective:** chọn 1–2 cải tiến cụ thể cho sprint sau và theo dõi kết quả.

Dùng một bảng công việc đơn giản với các cột **Backlog → Ready → In Progress → Review/Test → Done**. Hạn chế số việc đang làm đồng thời; ưu tiên hoàn tất việc đang dở hơn khởi động thêm nhiều nhánh.

## 8. Quy tắc chất lượng và hoàn thành

### Definition of Ready

Một story chỉ vào sprint khi:

- Nêu được actor, nhu cầu và giá trị.
- Có tiêu chí nghiệm thu kiểm chứng được.
- Có quy tắc quyền/trạng thái và dữ liệu liên quan.
- Các phụ thuộc đã biết; thiết kế đủ để bắt đầu, nhưng không khóa cứng mọi chi tiết.
- Có thể hoàn thành trong một sprint hoặc đã được chia nhỏ.

### Definition of Done

- Code đã được review và hợp nhất theo quy ước nhóm.
- Có kiểm thử phù hợp: unit cho logic, integration cho API/quyền/dữ liệu và luồng đầu-cuối cho các kịch bản quan trọng.
- Không còn lỗi chặn ở luồng nghiệm thu; lỗi còn lại được ghi backlog.
- UI có trạng thái loading, empty, success và error; lỗi API không bị che giấu.
- Phân quyền được kiểm tra phía server; dữ liệu nhạy cảm không ghi vào log.
- Migration/schema và dữ liệu mẫu được cập nhật nếu cần.
- Tài liệu chạy/test và tài liệu liên quan được cập nhật.
- Mọi yêu cầu trong baseline được liên kết tới test case và kết quả UAT; các sai khác/giới hạn được khách hàng chấp thuận tường minh.
- Bản phát hành bàn giao được triển khai và smoke test trên production; các luồng theo vai trò và tích hợp được kiểm tra trên môi trường đích.
- Có cấu hình HTTPS và secrets an toàn, phân quyền tài khoản vận hành, sao lưu tự động, log/giám sát lỗi và hướng dẫn rollback.
- Nhóm đã thử khôi phục backup trên môi trường kiểm tra; hướng dẫn vận hành và người tiếp nhận được xác nhận.

## 9. Kiến trúc và kỹ thuật: làm đủ, chưa làm thừa

### Kiến trúc mục tiêu theo baseline

- **Web:** React + TypeScript cho portal và dashboard.
- **Mobile:** Flutter theo các use case/actor đã chốt; xác định trước nền tảng phát hành (Android/iOS), cơ chế phân phối và tiêu chí nghiệm thu.
- **Backend:** NestJS REST API; xác thực và authorization tập trung, kiểm tra dữ liệu đầu vào, quy tắc nghiệp vụ đặt ở backend.
- **Dữ liệu:** PostgreSQL là nguồn dữ liệu chuẩn; Redis và Elasticsearch được dùng cho mục đích cụ thể đã xác định, không chỉ thêm theo tên trong stack.
- **Dịch vụ:** PayOS, Cloudinary và AWS được tích hợp theo các luồng production được khách hàng duyệt; xác nhận tài khoản, credentials, sandbox/production và chi phí từ D1.
- **Vận hành:** Docker; CI chạy lint, type-check và test; staging/production tách biệt; deploy có kiểm soát, migration, health check, sao lưu/khôi phục, giám sát và rollback.

### Những quyết định cần chốt sớm

- Ma trận quyền theo vai trò và phạm vi dữ liệu.
- Máy trạng thái dự án/đăng ký và ai được chuyển trạng thái nào.
- Quy tắc lưu trữ, thời hạn giữ và xóa dữ liệu cá nhân.
- Cách xử lý tài liệu tải lên và thông tin doanh nghiệp.
- Chính sách tiền thật, tạm ứng, hoàn trả, làm tròn chia quỹ, phê duyệt và đối soát.
- Hành vi ứng dụng Flutter, nền tảng phát hành và các chức năng đồng nhất với web.
- Nhà cung cấp production, tên miền/HTTPS, sao lưu/khôi phục, monitoring/logging, tài khoản quản trị và người chịu trách nhiệm trực.

Không lưu thông tin thẻ hoặc bí mật thanh toán của người dùng nếu không cần thiết. Mọi tích hợp tài chính phải dùng tài liệu chính thức, sandbox và xác nhận chính sách trước khi production.

## 10. Tài liệu đồ án: tạo cùng quá trình phát triển

Yêu cầu có URD, SRS, SAD, DDD, tài liệu triển khai, kiểm thử, cài đặt, mã nguồn và gói triển khai. Không nên đợi đến cuối kỳ mới viết. Gắn tài liệu với quyết định và sản phẩm từng sprint:

- **D1–D4:** rà soát URD, glossary, actor/use case, baseline yêu cầu đầy đủ, acceptance criteria và traceability matrix.
- **Sprint 1:** SRS, kiến trúc tổng thể/SAD, sơ đồ triển khai, mô hình dữ liệu và quyết định kỹ thuật.
- **Các sprint tính năng:** cập nhật DDD/API, sơ đồ trạng thái, quyết định kiến trúc và tài liệu nguồn liên quan.
- **Mỗi sprint:** test plan/case, kết quả kiểm thử và ghi chú thay đổi.
- **Trước bàn giao:** test report/UAT, hướng dẫn cài đặt và vận hành, cấu hình môi trường, triển khai, tài liệu tích hợp, chính sách backup/restore, danh sách giới hạn được khách hàng chấp thuận và gói bàn giao.

Dùng UML khi giúp giải thích yêu cầu/thiết kế: use case, activity/sequence cho luồng quan trọng, class/domain model và deployment diagram. Không cần vẽ mọi sơ đồ có thể có; sơ đồ phải khớp với hệ thống thực tế.

## 11. Rủi ro chính và cách giảm thiểu

| Rủi ro | Tác động | Cách giảm thiểu |
|---|---|---|
| Yêu cầu rộng hơn nguồn lực và 40 ngày | Không hoàn thành/không thể nghiệm thu toàn bộ | Đánh giá effort/năng lực ở D4; tăng nguồn lực hoặc khách hàng phê duyệt đổi hạn/phạm vi; không hạ chuẩn ngầm |
| Quy trình tiền và tỷ lệ 70/20/10 chưa rõ về vận hành/pháp lý | Sai lệch tài chính, mất niềm tin, trách nhiệm không rõ | Chốt chính sách, người phê duyệt, đối soát, hoàn tiền và audit trước triển khai; dùng sandbox cho kiểm thử |
| Quyền truy cập chỉ được kiểm tra ở giao diện | Người dùng có thể gọi API trái quyền, lộ dữ liệu | Authorization server-side, kiểm thử âm tính theo từng vai trò, giới hạn phạm vi dữ liệu |
| Không có người quyết định nghiệp vụ phản hồi | Story bị chặn hoặc nhóm tự suy đoán sai | Chỉ định Product Owner; lưu câu hỏi mở và thời hạn quyết định; dùng phương án đơn giản có thể đảo ngược khi phù hợp |
| Tích hợp dịch vụ/ứng dụng di động không sẵn sàng | Chặn luồng build hoặc nghiệm thu production | Lấy tài khoản, keys, SDK, quy trình phát hành và sandbox ngay D1–D2; làm spike tích hợp trong tuần đầu |
| Viết tài liệu dồn cuối kỳ | Tài liệu lệch khỏi phần mềm, thiếu bằng chứng kiểm thử | Cập nhật tài liệu trực tiếp theo sprint và gắn với story hoàn thành |
| Phụ thuộc một thành viên hoặc merge muộn | Tắc nghẽn và lỗi tích hợp cuối kỳ | Code review sớm, chia sẻ kiến thức, tích hợp thường xuyên, CI và demo định kỳ |
| Chưa có domain/quyền truy cập production hoặc người vận hành | Không thể phát hành thật đúng ngày bàn giao hoặc không ai xử lý sự cố | Xác nhận owner, hạ tầng, quyền và billing trong D1–D2; deploy staging sớm; production readiness là gate bắt buộc từ đầu |

## 12. Việc cần hoàn tất trong 4 ngày đầu

1. Chỉ định Product Owner, người phê duyệt nghiệp vụ, người phụ trách production và người tiếp nhận vận hành sau bàn giao.
2. Xác nhận domain, nhà cung cấp hạ tầng, tài khoản/billing, quyền triển khai, secrets, PayOS/Cloudinary credentials, môi trường mobile và ngân sách; kiểm tra nhóm thực sự truy cập được.
3. Phân tích đầy đủ file yêu cầu với khách hàng; ghi mỗi mục thành requirement ID, actor, quy tắc, ưu tiên theo release, acceptance criteria và người ký nghiệm thu.
4. Làm rõ ngay chính sách thanh toán/tạm ứng, các vai trò, luồng mentor/leader, mẫu Excel, mobile platforms và định nghĩa NFR.
5. Đánh giá effort toàn bộ scope với nhân lực thực có. Nếu không khớp 40 ngày, trình khách hàng phương án tăng nguồn lực hoặc thay đổi deadline/phạm vi bằng văn bản.
6. Chốt baseline và traceability matrix; tạo backlog sprint theo phụ thuộc; thiết kế kiến trúc triển khai; không tự loại hạng mục nào trong file yêu cầu.
7. Tạo repo, CI và khung ứng dụng; triển khai bản khung lên staging, thử các tích hợp rủi ro cao và xác nhận đường phát hành.
8. Nếu đến cuối D2 chưa có quyền truy cập production, nhà cung cấp/dịch vụ, người phê duyệt hoặc credentials thiết yếu, báo blocker cấp dự án và xin quyết định ngay.

## 13. Kết luận

Theo yêu cầu đã làm rõ, **ngày 40 là hạn bàn giao sản phẩm đầy đủ theo baseline khách hàng chấp thuận, chạy trên production và qua nghiệm thu**. MVP chỉ là phiên bản trung gian để kiểm chứng sớm; không được coi MVP là hoàn thành đồ án hay dùng nó để loại các yêu cầu về mentor, quản trị, tài chính, mobile, tích hợp và NFR.

Phạm vi hiện tại rộng và nguồn lực là hai sinh viên vibecode, nên full scope/D40 vẫn là mục tiêu rủi ro cao, không phải kết quả được đảm bảo bởi AI. Nhóm giữ baseline đã chọn, đo giờ thực và báo sớm blockers; cần PO phản hồi nhanh và mentor/reviewer hỗ trợ các phần tài chính, bảo mật, mobile và production. Không hứa đạt NFR nếu chưa có ngưỡng đo và kết quả kiểm thử; không đưa thanh toán production vào vận hành khi chưa có quy trình, phê duyệt và kiểm soát phù hợp.

**Nguyên tắc điều hành:** MVP giúp kiểm chứng sớm nhưng không thay thế cam kết cuối; mọi yêu cầu trong baseline phải có bằng chứng nghiệm thu. Ưu tiên luồng đầu-cuối, tích hợp liên tục, kiểm chứng nghiệp vụ và quyền truy cập; nếu lịch không khả thi thì báo cấp có thẩm quyền sớm để điều chỉnh nguồn lực/hạn/phạm vi bằng thỏa thuận với khách hàng, không hạ tiêu chí một cách ngầm định.
