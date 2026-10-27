# Giai đoạn 2 — Dự án, công bố và tuyển chọn

**Thời hạn:** D11–D17  
**Mục tiêu:** hoàn thành MVP end-to-end cho luồng doanh nghiệp → Lab → công bố dự án → sinh viên đăng ký, đồng thời tạo lõi dữ liệu dùng cho các phase vận hành sau.

**Giới hạn nguồn lực:** hai sinh viên không chia thành frontend team/backend team. A sở hữu trọn vertical slices của enterprise/Lab/project lifecycle; B sở hữu trọn vertical slices của talent discovery/application. Nếu ở D4 estimate cho thấy thiếu capacity, ghi forecast đỏ và giữ baseline theo quyết định hiện tại; không gọi MVP là hoàn thành toàn sản phẩm.

Phân công full-stack từng ngày tại [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md) là chi tiết ưu tiên; bảng ngày trong file này mô tả nội dung nghiệp vụ, không phải phân vai BE/FE.

## Đầu vào

- Auth/RBAC, staging, API conventions và data model foundation từ phase 1.
- Acceptance criteria và state machine cho enterprise, project proposal, project, candidate application.
- Bộ trường profile/project, điều kiện đăng ký và chính sách dữ liệu đã được PO xác nhận.
- Wireframes, API contract và test data.

## Công việc theo ngày

| Ngày | Công việc |
|---|---|
| D11 | Schema doanh nghiệp/profile/talent/project/proposal/application; migration, seed và data ownership |
| D12 | API hồ sơ; tạo/sửa draft proposal; validation; upload avatar/tài liệu nếu đã được xác nhận |
| D13 | Lab queue; request changes/approve/reject có lý do; authorization và audit transition |
| D14 | Publish/unpublish/close project; enterprise status view; public project list/detail/search/filter |
| D15 | Student application/withdraw theo rule; chống đăng ký trùng và xử lý project đóng đồng thời |
| D16 | Web screens cho enterprise, Lab, talent; responsive, empty/loading/error; tích hợp API |
| D17 | E2E luồng đầy đủ, review với PO/người dùng, sửa blocker; deploy staging; cập nhật traceability |

## Đầu ra

- Hồ sơ doanh nghiệp và hồ sơ sinh viên ở mức yêu cầu.
- Hồ sơ talent có skills, certifications và portfolio theo trường dữ liệu đã duyệt.
- CRUD proposal có draft/submit; Lab queue có request more info/approve/reject.
- Dự án có trạng thái, publish controls, ngày mở/đóng và visibility.
- Danh sách/chi tiết dự án, tìm kiếm/lọc theo tiêu chí đã baseline.
- Student application, trạng thái, withdraw nếu policy cho phép; unique constraint/server-side idempotency.
- Audit trail cho quyết định và state transition.
- Web flows cho actor này; APIs documented; migrations/seed scripts.
- Doanh nghiệp quản lý profile; báo cáo/acceptance/evaluation views được liên kết vào phase vận hành nếu thuộc baseline.
- Integration/E2E tests và report pass/fail.
- Demo MVP staging được PO review; ghi feedback thành backlog change-controlled.

## Chia việc với 2 sinh viên

- **Sinh viên A:** proposal/approval/publish vertical slices, mỗi slice gồm API/state/data + enterprise/Lab UI + tests.
- **Sinh viên B:** project discovery/application vertical slices, mỗi slice gồm API query/validation/data + talent UI + tests; không chỉ làm giao diện.
- **Cả hai:** dùng API contract/mocks để làm độc lập, review chéo và tích hợp E2E cuối ngày theo [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md).
- A owner project lifecycle writes/migrations; B sở hữu Talent Application module và chỉ dùng contract Project do A cung cấp, tránh sửa cùng entity/schema.
- **PO/khách hàng:** xác nhận trường bắt buộc, reason codes, điều kiện đăng ký và review demo.
- Nếu có thêm người, ưu tiên QA độc lập hoặc mobile specialist thay vì thêm dashboard trang trí.

## Gate kết thúc D17

- E2E chạy trên staging với ít nhất tài khoản doanh nghiệp, Lab và sinh viên.
- Dự án chưa duyệt/đóng không bị đăng ký hoặc công bố ngoài ý muốn.
- Không đăng ký trùng; lỗi được xử lý phía server.
- Khách hàng duyệt luồng và dữ liệu nền cần thiết cho việc tạo team.

## Definition of Done

Story có test evidence, API/UI đã tích hợp, quyền kiểm tra ở backend, migration chạy được từ database trống, staging demo không cần thao tác thủ công ngoài hướng dẫn.
