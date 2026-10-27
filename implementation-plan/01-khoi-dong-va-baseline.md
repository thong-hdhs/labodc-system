# Giai đoạn 0 — Khởi động và chốt baseline

**Thời hạn:** D1–D4  
**Mục tiêu:** chuyển tài liệu yêu cầu cấp cao thành phạm vi có thể phát triển, đo lường và nghiệm thu; lập forecast cho lựa chọn đã chốt: **full scope + D40 + 2 sinh viên dùng AI hỗ trợ**. Đây là mục tiêu rủi ro cao/chưa chứng minh khả thi; phase này đo khoảng thiếu để điều phối AI, lịch, mentor và review.

## Đầu vào

- [Yêu cầu LabOdc](../labodc_project_requirements.md).
- [Kế hoạch tổng thể](./00-ke-hoach-tong-the.md).
- Hai sinh viên: kỹ năng thực tế, thời gian tập trung/ngày, ngày nghỉ/kỳ thi, kinh nghiệm với NestJS, React, Flutter, payments, cloud, testing và production.
- Hợp đồng/đề bài, người đại diện khách hàng/PO và quy trình ký duyệt.
- Truy cập Git, AWS/cloud, domain, PayOS sandbox, Cloudinary, Google Play/TestFlight nếu Flutter cần phát hành.
- Mẫu Excel/Docs hiện có, quy định tài chính, chính sách bảo mật và lưu trữ dữ liệu.

## Công việc theo ngày

| Ngày | Việc chính | Owner chính |
|---|---|---|
| D1 | Kickoff; xác nhận mục tiêu, người quyết định, thời gian, kênh liên lạc; liệt kê actor/deliverable; tạo board/risk log | Sinh viên A điều phối, B ghi nhận; PO quyết định |
| D2 | Workshop theo luồng: proposal-to-project, recruitment/team, mentor/reporting, payment/fund, change/cancel, admin; kiểm tra quyền truy cập hạ tầng/tài khoản | A hỏi domain/API, B ghi actor/UI; PO và đại diện nghiệp vụ trả lời |
| D3 | Phân rã requirement IDs; vẽ state machine/permission matrix; draft acceptance criteria/NFR testability; kiểm tra AI-generated assumptions | Cùng A+B; review PO/mentor |
| D4 | Ước lượng từng requirement theo giờ/người, cộng test/integration/UAT/deploy buffer; đối chiếu giờ khả dụng thật; chốt forecast, critical path, AI workflow và lịch review/mentor | A+B trình bày; PO xác nhận baseline |

## Đầu ra bắt buộc

1. **Baseline yêu cầu**: mã định danh cho từng chức năng, vai trò, NFR, tích hợp và tài liệu cần bàn giao.
2. **Traceability matrix**: requirement ID → user story → release/sprint → owner → test case → nghiệm thu.
3. **Sơ đồ actor và quyền**: hành động nào được phép, trên dữ liệu nào, ai phê duyệt.
4. **State machine** cho proposal/project/application/team/payment/change request.
5. **Rulebook nghiệp vụ** được PO/khách hàng ký: 70/20/10, làm tròn, tạm ứng, thanh toán trễ, hoàn tiền, hủy, đổi scope, phân phối của leader.
6. **NFR test charter**: định nghĩa concurrent users, load profile, cách tính thời gian response, 99% uptime window, điều kiện pass.
7. **Architecture decision record (ADR)**: web/mobile scope, REST/JWT, PostgreSQL, Redis/Elasticsearch, PayOS/Cloudinary, AWS, deploy/security.
8. **Capacity plan và forecast** theo số giờ khả dụng của 2 người, kỹ năng, phụ thuộc và buffer; backlog full scope/40 ngày theo quyết định hiện tại, kèm trạng thái rủi ro và khoảng thiếu nếu có.
9. **Risk/decision log**, owner và deadline cho mọi câu hỏi chưa trả lời.

## Chia việc

- Sinh viên A: phân tích yêu cầu Enterprise/Lab/Project/Finance/System Admin; output domain rules, state, acceptance criteria và estimate cho các lát cắt full-stack A.
- Sinh viên B: phân tích Talent/Mentor/Team/Report/Template/Flutter; output domain rules, state, acceptance criteria và estimate cho các lát cắt full-stack B.
- Cả hai: cùng xác nhận shared auth/API/data contracts, testability, QA/DevOps effort và review chéo; đây là chia theo miền nghiệp vụ, không chia backend/frontend.
- PO/khách hàng: quyết định nghiệp vụ, cấp rulebook/tài khoản và ký baseline; không giao sinh viên tự suy diễn chính sách tiền.
- Mentor/reviewer có kinh nghiệm (nếu có): rà soát estimates về security, payment và production; không thay quyết định khách hàng.

## Gate kết thúc D4

- Không còn yêu cầu baseline nào không có owner/acceptance criteria.
- Khách hàng đã chỉ định người có quyền duyệt và lịch phản hồi/UAT.
- Nhóm đã kiểm tra quyền truy cập tài khoản/tích hợp, không chỉ nhận lời hứa.
- Có capacity/effort forecast cho toàn bộ baseline, cộng QA, UAT và production, dựa trên giờ thực sự có thể làm.
- Nếu forecast không vừa: ghi rõ trạng thái đỏ, khoảng thiếu, biện pháp AI/review/điều phối và escalates cho PO. Baseline hiện vẫn full scope/D40; không tự ý cắt scope. Mọi đổi baseline cần quyết định mới từ người có thẩm quyền.

## Definition of Done

Baseline full scope/D40, forecast capacity, AI workflow, risk log và owner của mọi blocker đã được ghi nhận. Nếu forecast vượt capacity, báo trạng thái đỏ một cách minh bạch nhưng vẫn bắt đầu phase 1 theo quyết định hiện tại; không chuyển đỏ thành xanh bằng lời hứa AI.
