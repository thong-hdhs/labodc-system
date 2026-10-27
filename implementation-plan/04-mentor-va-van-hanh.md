# Giai đoạn 3 — Mentor, nhóm và vận hành dự án

**Thời hạn:** D18–D24  
**Mục tiêu:** hoàn thành các chức năng sau tuyển chọn: phân mentor/leader, nhóm, task theo template, báo cáo, đánh giá và quản lý vòng đời thực hiện dự án.

**Giới hạn nguồn lực:** phase này gồm nhiều domain/workflow độc lập. Hai sinh viên vibecode cần chốt scope/capacity ở D4; không nên giả định hoàn thành toàn bộ trong 7 ngày lịch nếu chưa estimate. Ưu tiên theo baseline được khách hàng phê duyệt, làm một workflow end-to-end mỗi lần và yêu cầu mentor/Lab phản hồi nhanh.

Phân công theo owner và output full-stack từng ngày tại [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md); không chuyển toàn bộ API cho một người và UI cho người còn lại.

## Đầu vào

- Project/application/team schema và luồng staging từ phase 2.
- Danh sách mẫu Excel/Docs chính thức và định nghĩa trường dữ liệu/template version.
- Quy tắc chỉ định mentor/leader, phỏng vấn, đánh giá, nghiệm thu, contribution.
- Luồng đổi scope/cancel, approver, lý do, thời hạn và ảnh hưởng tài chính.
- Quyền truy cập và acceptance criteria ký bởi PO.

## Công việc theo ngày

| Ngày | Công việc |
|---|---|
| D18 | Schema team/membership/mentor invitation/assignment; quyền theo project/team |
| D19 | Invite/accept mentor; chỉ định/elect leader theo policy; tạo team từ các application được duyệt |
| D20 | Task/milestone management và template Excel/Docs versioning; upload/download an toàn |
| D21 | Báo cáo phase/month, trạng thái, deliverables, acceptance; lưu lịch sử nộp/duyệt |
| D22 | Mentor feedback/evaluation, contribution records; xác nhận redistribution proposal theo policy |
| D23 | Request scope change/cancellation, approve/reject, reason/audit; Lab project administration và summaries |
| D24 | E2E test từ accepted candidate đến report/approval; review với mentor/Lab; fix blocker, staging release |

## Đầu ra

- Team, member roles, mentor assignment/invitation, leader appointment/election.
- Mentor có thể nhận/từ chối lời mời và phỏng vấn ứng viên khi quy trình yêu cầu; leader có luồng báo cáo và đề xuất/ghi nhận phân phối quỹ theo quyền đã ký.
- Quyền xem/sửa theo team/project; không lộ hồ sơ đội khác.
- Task/milestone và biểu mẫu chuẩn có version; upload/download có validation, giới hạn và audit.
- Báo cáo tiến độ/tháng hoặc theo phase; nộp, sửa, duyệt, trả về.
- Mentor evaluation/feedback; contribution records và quy trình xác nhận phân phối.
- Scope-change/cancellation request flow với phê duyệt đúng actor.
- Lab dashboard quản lý project/team/mentor/talent và summary/report theo yêu cầu.
- System Admin quản lý template Excel/Docs, cấu hình hệ thống và technical users theo quyền đã duyệt.
- Doanh nghiệp xem báo cáo, kết quả nghiệm thu và đánh giá; yêu cầu đổi scope/hủy được liên kết với approval flow.
- Test cases cho workflow, ownership, file access, approval và audit.

## Chia việc với 2 sinh viên

- **Sinh viên A:** full-stack scope-change/cancellation và Lab project/admin/fund flows (API + UI + data + tests), theo ngày tại [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md).
- **Sinh viên B:** full-stack mentor/team/leader/task/template/report/evaluation (API + UI + data + tests); owns các module nghiệp vụ này.
- **Cả hai:** API/schema contract trước code, test quyền/file/state và review chéo; không chia A làm BE, B làm FE.
- **PO/mentor/Lab:** cung cấp mẫu và duyệt rubric, quyền chỉ định leader, approval matrix đúng hạn.
- Nếu có reviewer ngoài, ưu tiên rà soát file-upload/security và nghiệp vụ vận hành.

## Gate kết thúc D24

- Có thể demo từ application được duyệt đến team/mentor assignment, task/report và phản hồi.
- Báo cáo và template khớp mẫu Lab; phiên bản template được nhận diện.
- Không ai có thể duyệt request hoặc đọc/ghi dữ liệu dự án ngoài quyền.
- Các quyết định liên quan tiền không được tự động hóa nếu rulebook chưa được ký; trường hợp đó phải được escalated như blocker baseline, không âm thầm bỏ tính năng.

## Definition of Done

Mỗi luồng vận hành có acceptance test, audit phù hợp, kiểm thử quyền, evidence review của người dùng nghiệp vụ và release staging.
