# Giai đoạn 2 — Mentor, nhóm, vận hành và lát cắt tài chính đầu tiên

**Thời hạn:** D11–D20
**Mục tiêu:** sau MVP, hoàn thiện các workflow mentor/team/task/report và các lát cắt quản trị/tài chính đầu tiên theo phân công chuẩn ở [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md). Các mốc tài chính ở đây là sandbox/ledger theo policy đã duyệt; không mặc định bật giao dịch production.

**Giới hạn nguồn lực:** scope dày so với hai sinh viên. Mỗi ngày tập trung vào một vertical slice/người; mọi estimate/risk phải được cập nhật theo actual capacity. Không hạ baseline hay bỏ test một cách ngầm định.

## Đầu vào

- MVP Project/Application contract và staging flow.
- Rule nghiệp vụ đã xác nhận hoặc danh sách decision/blocker có owner.
- Danh sách mẫu Excel/Docs của Lab, quy tắc mentor/leader/team, report/evaluation và file access.
- PayOS sandbox và rulebook tài chính; nếu chưa có phê duyệt thì chỉ xây/test phần không thực hiện tiền thật.

## Công việc theo ngày

| Ngày | Công việc |
|---|---|
| D11 | A: yêu cầu đổi scope/hủy và approval flow. B: mentor review/phỏng vấn ứng viên. |
| D12 | A: Lab quản lý doanh nghiệp/dự án. B: mentor invitation/accept/decline. |
| D13 | A: project budget/fund setup theo policy, chưa chuyển tiền. B: tạo nhóm và chỉ định/bầu leader theo policy; bao gồm trách nhiệm đại diện nhóm. |
| D14 | A: system settings/technical users/RBAC admin. B: task/template setup, sử dụng biểu mẫu đúng phiên bản. |
| D15 | A: payment order/intent trên PayOS sandbox. B: giao task/milestone cho nhóm. |
| D16 | A: webhook verification/idempotency. B: nộp report/deliverable theo quy trình được duyệt. |
| D17 | A: ledger và tính toán 70/20/10 theo rulebook. B: mentor evaluation/feedback và contribution records. |
| D18 | A: delayed-payment/advance ledger và approval theo policy. B: báo cáo tháng/giai đoạn và luồng review. |
| D19 | A: transparency/monthly finance reports. B: Cloudinary upload/download và quyền truy cập file cho portfolio/task/report. |
| D20 | Tích hợp/regression theo hai miền, E2E, cập nhật tài liệu/traceability, sprint review staging và triage gaps. |

Chi tiết input/output từng người theo ngày trong file 07 là nguồn chuẩn. Quyền quản trị danh mục template thuộc A/System Admin; B sở hữu chức năng dùng template trong quy trình mentor/team/report.

## Đầu ra

- Mentor invitation, review/phỏng vấn theo rule đã duyệt.
- Team/member roles, leader appointment/election và trách nhiệm giao tiếp của leader theo phạm vi xác nhận.
- Task/milestone và quy trình dùng mẫu Excel/Docs chuẩn của Lab; không mặc định thay thế bằng công cụ quản lý ngoài.
- Report phase/month, deliverables, review/return, mentor evaluation, feedback và contribution history.
- Scope-change/cancellation request cùng approval/audit.
- PayOS sandbox, webhook protection, ledger/fund calculations và advance flow chỉ theo policy ký duyệt.
- Lab/admin summaries, transparency report và Cloudinary file flow có quyền hạn.
- Test cases, integration/E2E evidence, staging release và cập nhật traceability.

## Chia việc

- **A:** Enterprise/Lab/Project/Finance/System Admin, bao gồm payment core, ledger, approvals và system template administration.
- **B:** Talent/Mentor/Team/Leader/Task/Template usage/Report/Evaluation và Cloudinary user workflows.
- **Cả hai:** review chéo, API/schema contract, kiểm thử ownership/file/state, tích hợp staging và báo cáo capacity.
- **PO/Finance/Mentor/Lab:** cung cấp policy, mẫu, rubric và phê duyệt nghiệp vụ; không giao nhóm tự suy diễn quy tắc tài chính.

Luồng Talent Leader quản lý/đề xuất phân phối phần quỹ của đội và Mentor xác nhận được triển khai ở D26 theo [kế hoạch phân công từng ngày](./07-phan-cong-tung-ngay.md), phụ thuộc rulebook tài chính đã duyệt.

## Gate kết thúc D20

- Có thể demo các luồng mentor → team → task/report/evaluation, cùng các lát cắt tài chính đã được policy cho phép.
- Quyền đọc/ghi/duyệt theo project/team được kiểm thử; file và dữ liệu nhóm không lộ chéo.
- Quy tắc tiền chưa ký là blocker; không tự động hóa hoặc bật giao dịch thật dựa trên giả định.
- Mọi requirement chưa xong có owner, estimate và disposition cần PO quyết định.

## Definition of Done

Mỗi workflow có acceptance/test evidence, audit phù hợp và review nghiệp vụ; code/API/UI/data tích hợp staging; test quyền và file access pass; tài liệu/traceability được cập nhật. Finance production chỉ được bật sau sign-off riêng.
