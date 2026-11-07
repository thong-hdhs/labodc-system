# Ngày D18 — Báo cáo tháng/giai đoạn và luồng review (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — Báo cáo theo tháng/giai đoạn: API + Mentor/Lab UI + submit/review tests.
> **Input:** Report lifecycle B4 trong `daily/day3.md`; người dùng xác nhận baseline fields và reviewer trong phiên làm việc.

## Quyết định nghiệp vụ áp dụng

- Báo cáo có kỳ `MONTH` hoặc `PHASE`, phạm vi project/Team, tóm tắt, tiến độ, vướng mắc và bước tiếp theo.
- Mentor phụ trách hoặc Lab Admin có thể tiếp nhận báo cáo để review; reviewer bắt đầu review là người duy nhất xử lý kết quả của lần review đó.
- Leader hiện tại có thể lập báo cáo Team; Mentor có thể lập báo cáo project hoặc báo cáo gắn Team.
- Thay đổi nội dung tạo version mới; lịch sử trạng thái và ghi chú trả chỉnh sửa được lưu riêng.

## Đã triển khai

- API lifecycle `DRAFT -> SUBMITTED -> IN_REVIEW -> APPROVED` hoặc `CHANGES_REQUESTED -> SUBMITTED`; trả chỉnh sửa bắt buộc có ghi chú và chỉ reviewer đã tiếp nhận được xử lý kết quả. Gửi lại xóa reviewer hiện hành để cần tiếp nhận review lại.
- Mentor phụ trách tạo báo cáo project/Team; chỉ Leader hiện tại tạo báo cáo Team và không thể tự chọn Team qua request body.
- `PATCH /api/v1/reports/:reportId` tạo version mới; `GET /api/v1/reports/:reportId/history` lưu/read state events theo quyền.
- Listing có scope Mentor/project, Lab Admin, và thành viên Talent/Leader thuộc Team; report khác project/Team không được đọc.
- UI báo cáo tại `apps/web/src/features/reports/ProgressReportsPage.tsx` dùng chung cho Mentor/Lab/Talent Leader/Talent: tạo, gửi, sửa khi được trả lại, xem trạng thái/lịch sử, tiếp nhận review, duyệt hoặc yêu cầu chỉnh sửa.
- Migration dự thảo `012_b_reports_evaluations_and_contributions.sql` chứa report, versions, state history, evaluation và contribution records.

## Kiểm thử nghiệm thu

- Validate kỳ/ngày và nội dung bắt buộc; chặn submit/review/approve sai trạng thái.
- Kiểm tra Mentor assignment, reviewer đã tiếp nhận, Lab Admin, Leader hiện tại và membership; ngăn truy cập chéo project/Team.
- Kiểm tra trả chỉnh sửa cần lý do, cập nhật tăng version, resubmit và state history giữ đầy đủ.
- Kết quả: D17–D18 E2E **7/7 PASS**; toàn bộ API **25/25 suites, 70/70 tests PASS**; API build, Web build và `git diff --check` thành công.

## Giới hạn và việc còn lại

- Các trường và quyền reviewer là baseline được PO/user xác nhận cho lát cắt này; mẫu báo cáo chính thức vẫn cần Lab cung cấp nếu có yêu cầu biểu mẫu.
- Runtime repository còn in-memory; migration là draft chưa được chạy trên PostgreSQL.
- Report file upload/download thuộc D19; D18 chỉ lưu metadata và nội dung văn bản, không phát sinh URL tệp giả.
