# Ngày D17 — Mentor evaluation, feedback và contribution records (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — Mentor evaluation/feedback/contribution: API + UI + rubric/visibility tests.
> **Input:** Team và Mentor assignment D13; evaluation decisions được người dùng xác nhận trong phiên làm việc.

## Quyết định nghiệp vụ áp dụng

- Rubric được ghi rõ theo từng đánh giá; mỗi tiêu chí có feedback, không có điểm số hoặc công thức tự động.
- Chỉ Mentor phụ trách được tạo/chốt đánh giá trong dự án được giao.
- Talent chỉ xem đánh giá cá nhân của mình khi đã ở trạng thái `EVALUATION_FINAL`; Enterprise không có API xem evaluation cá nhân.
- Contribution record là ghi nhận mô tả theo kỳ, gắn với một thành viên trong Team; không quy đổi thành tiền, điểm hoặc phân phối quỹ.

## Đã triển khai

- `POST /api/v1/mentor/projects/:projectId/evaluations` tạo evaluation draft; `POST /api/v1/mentor/evaluations/:evaluationId/finalize` chốt evaluation.
- `GET /api/v1/mentor/projects/:projectId/evaluations`, `GET /api/v1/lab-admin/evaluations` và `GET /api/v1/talent/me/evaluations` có scope riêng; Talent chỉ nhận evaluation FINAL của chính mình.
- `POST/GET /api/v1/mentor/projects/:projectId/contributions` ghi và đọc contribution theo project/Team; `GET /api/v1/lab-admin/contributions` dành cho Lab; Talent chỉ đọc contribution gắn với user của mình.
- Rubric chấp nhận 1–30 tiêu chí gồm tên tiêu chí + feedback; API từ chối trường điểm số hoặc field ngoài contract. Evaluation đã chốt không thể finalize lại hoặc sửa.
- UI tại `apps/web/src/features/reports/ProgressReportsPage.tsx` cho Mentor ghi evaluation/contribution, Lab xem theo quyền và Talent xem feedback cuối.
- Migration dự thảo `012_b_reports_evaluations_and_contributions.sql`; repository hiện theo pattern in-memory của các module B trước đó nên migration chưa tự động áp dụng.

## Kiểm thử nghiệm thu

- Kiểm tra Mentor được/không được phân công; chặn target ngoài Team và người không phải Mentor.
- Evaluation draft không hiển thị cho Talent; chỉ finalized evaluation của đúng Talent được trả về.
- Chặn finalize nếu thiếu rubric/feedback; evaluation finalized không thể finalize lại hoặc sửa.
- Contribution chỉ gắn với thành viên đúng Team; người khác không đọc được hồ sơ đóng góp cá nhân.
- E2E kiểm tra draft privacy, chỉ hiện FINAL cho đúng Talent, chặn Mentor chưa được gán, rubric thiếu/score, target ngoài Team và contribution visibility.
- Kết quả cùng xác minh D18: API E2E D17–D18 **7/7 PASS**; toàn bộ API **25/25 suites, 70/70 tests PASS**; API/Web build và `git diff --check` thành công.

## Giới hạn và việc còn lại

- Rubric chưa có tiêu chí chuẩn do Lab phê duyệt; dữ liệu hiện được Mentor cung cấp tường minh, không suy diễn thành điểm số.
- Chưa có cơ chế sửa/thay thế evaluation đã chốt; cần quy trình audit/supersede được PO xác nhận.
- Lưu trữ runtime còn in-memory; cần tích hợp repository PostgreSQL và chạy migration trước khi dùng dữ liệu bền vững.
