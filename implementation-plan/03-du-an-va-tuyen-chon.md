# Lát cắt MVP — Dự án, công bố và tuyển chọn

**Thời hạn:** D7–D10
**Mục tiêu:** hoàn thành và demo luồng doanh nghiệp → Lab → công bố dự án → Talent đăng ký, theo lịch chi tiết chuẩn tại [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md). Nội dung này là lát cắt nghiệp vụ trong Giai đoạn 1 (D5–D10), không phải một giai đoạn nối tiếp sau D10.

**Giới hạn nguồn lực:** A sở hữu project lifecycle, proposal/approval/publish và contract trạng thái dự án. B sở hữu Talent discovery và Application workflow/schema. Mỗi bên làm full-stack theo miền; thay đổi contract shared phải được thống nhất trước khi code.

## Đầu vào

- Auth/RBAC và các contract API/data nền tảng.
- Yêu cầu/acceptance criteria cho proposal, project state và application được PO xác nhận hoặc đánh dấu câu hỏi mở.
- Trường hồ sơ/dự án, điều kiện đăng ký, test data và wireframes.

## Công việc theo ngày

| Ngày | Công việc |
|---|---|
| D7 | A làm proposal draft/submit; B làm danh sách/chi tiết/tìm kiếm dự án theo contract và trạng thái visibility do A sở hữu. |
| D8 | A làm hàng đợi Lab, request info/approve/reject có lý do; B làm đăng ký/rút đăng ký theo policy, chống trùng và project đóng. |
| D9 | A làm publish/unpublish/close và enterprise status; B làm trạng thái application và candidate view; kiểm tra quyền/visibility. |
| D10 | Chạy E2E, sửa blocker, review PO/người dùng, cập nhật traceability và deploy/demo staging. |

Profile doanh nghiệp và Talent được bắt đầu ở D6 theo phân công ngày; nền tảng/auth được xây xuyên suốt D5–D10 theo [02-nen-tang-va-danh-tinh.md](./02-nen-tang-va-danh-tinh.md).

## Đầu ra

- Proposal draft/submit và Lab queue xử lý request-info/approve/reject.
- Project state và thao tác publish/unpublish/close; danh sách/chi tiết chỉ hiện project hợp lệ.
- Talent discovery/search/filter theo tiêu chí đã baseline.
- Application, trạng thái và withdraw nếu policy cho phép; backend bảo vệ tính duy nhất và điều kiện đăng ký.
- Audit trail cho quyết định và chuyển trạng thái; API/UI/migration/seed docs.
- E2E test evidence và demo MVP staging được PO review; feedback thành backlog có kiểm soát thay đổi.

## Phân công và ownership

- **A:** proposal/review/publish/project lifecycle, API + schema/migration + enterprise/Lab UI + tests.
- **B:** discovery/application, API + schema/migration thuộc Application + Talent UI + tests.
- **Shared contract:** A cung cấp trạng thái Project; B sở hữu Application workflow/schema; hai bên review contract và integration tests.
- **PO/khách hàng:** xác nhận trường bắt buộc, reason codes, điều kiện đăng ký và review demo.

## Gate kết thúc D10

- E2E chạy trên staging với doanh nghiệp, Lab và Talent.
- Project chưa duyệt/chưa công bố/đóng không bị hiển thị hoặc nhận đơn trái quy tắc.
- Application trùng bị từ chối phía server và quyền dữ liệu được kiểm tra.
- PO đã review MVP hoặc các vấn đề chưa quyết định được ghi rõ với owner/deadline.

## Definition of Done

Story có test evidence; API/UI/data tích hợp; authorization server-side; migration chạy được từ database trống; staging demo tái tạo được theo hướng dẫn. Đây là MVP, không phải xác nhận hoàn tất baseline D40.
