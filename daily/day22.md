# Ngày D22 — Khám phá dự án trên mobile và hợp đồng lọc (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — Flutter project discovery/detail và refinement search/filter API thuộc miền B; đối chiếu hành vi Web/mobile.

## API discovery B

- Thêm `GET /api/v1/talent/discovery/projects` và `GET /api/v1/talent/discovery/projects/:projectId` trong Talent module, tiêu thụ `ProjectsService` contract của A; không sửa Project lifecycle/schema.
- Tìm kiếm `keyword` không phân biệt hoa/thường theo title, summary, company name và code; `skill` so khớp chính xác, không phân biệt hoa/thường.
- Kết quả chỉ gồm project PUBLISHED đang trong thời gian nhận đơn. Detail ngoài trạng thái eligible trả 404 để không quảng bá/cho xem dự án đóng hoặc chưa mở nhận đơn.
- Hỗ trợ `page` (mặc định 1), `pageSize` (mặc định 20, tối đa 50); trả `items` và metadata tổng số kết quả/trang. Query không hợp lệ trả 400.
- Web discovery chuyển sang API contract mới, loại bỏ request eligibility riêng cho từng project và thêm pagination. Flutter repository/screen sử dụng cùng endpoint, filter, detail và pagination.

## Kiểm thử và kết quả

- E2E kiểm tra keyword + skill, page/pageSize, detail public, query sai, loại project sau khi đóng nhận đơn khỏi discovery và từ chối detail khi đã đóng.
- `npm run build --workspace @labodc/api` — PASS.
- `npm run build --workspace @labodc/web` — PASS.
- `npm test --workspace @labodc/api -- --runInBand test/applications.e2e-spec.ts` — **1 suite, 5 tests PASS**.
- `npm test --workspace @labodc/api -- --runInBand` — **33 suites, 87 tests PASS**.
- E2E includes repeated filter-query rejection, out-of-range page clamping, and exclusion of projects that stop accepting applications.
- `git diff --check` — PASS.
- Flutter repository/widget/auth tests đã được thêm nhưng không thể chạy vì máy không cài Flutter/Dart SDK; chưa có emulator/device build.

## Cùng chốt / phụ thuộc còn mở

- `pageSize` có upper bound 50; đây là giới hạn API, không phải xác nhận tiêu chí tuyển chọn hay chính sách số đơn. Q-B02 vẫn chờ PO/Lab.
- A sở hữu Elasticsearch/indexing, API performance target và consistency khi publish/close. B API discovery hiện dùng Project service contract hiện có; không tuyên bố đã đạt latency 300 ms hay đã tích hợp Elasticsearch.
- Redis/cache/session use case do A đánh giá theo baseline; B không thêm Redis hoặc cache client-side để tránh giữ project state cũ.
- Q-B12 về platform chính thức, phát hành APK/Play Store và phạm vi actor/luồng nghiệm thu vẫn chờ PO; implementation theo Android/Flutter hiện được nêu trong kế hoạch nhưng chưa có build evidence.
