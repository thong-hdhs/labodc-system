---

# Phần triển khai Ngày D26 của Sinh viên B — Đề xuất phân bổ và hiệu suất nhóm

> **Phạm vi:** Leader tạo/chỉnh sửa đề xuất phân bổ nội bộ; Mentor được phân công xem xét. Phần phân bổ chỉ biểu diễn tỷ lệ trong 70% của Team, không tự chuyển tiền, không tạo payment và không sửa ledger thuộc Sinh viên A.

## Hạng mục hoàn thành

- Thêm API Leader tạo/xem/chỉnh sửa đề xuất và API Mentor xem, duyệt hoặc yêu cầu chỉnh sửa; có trạng thái `PENDING`, `APPROVED`, `CHANGES_REQUESTED` cùng audit events.
- Ràng buộc kỳ ngày hợp lệ, đủ mỗi thành viên Team hiện tại đúng một lần, không thành viên ngoài Team/trùng, tỷ lệ là số nguyên basis points trong khoảng 0–10000 và tổng chính xác 10000 (100% phần nội bộ của Team).
- Gắn đề xuất với Leader hiện tại và Mentor đang được phân công. Từ chối duyệt khi Leader/thành viên Team đã thay đổi; đề xuất được trả lại có thể sửa và gửi lại, đề xuất đã duyệt không thể sửa.
- Thêm API báo cáo hiệu suất cho Leader/Mentor theo kỳ, tổng hợp đóng góp và số evaluation đã chốt. Không trả nội dung evaluation riêng tư, không tạo score hoặc tỷ lệ chi trả từ rubric.
- Mở rộng trang Báo cáo Web hiện có với form phân bổ, lịch sử duyệt, thao tác Leader/Mentor và bảng hiệu suất theo thành viên.
- Proposal/audit được lưu trong cùng in-memory repository pattern hiện dùng cho Reports, Evaluations và Contributions; dữ liệu hiện không sống qua lần khởi động lại API. Chưa thêm migration/persistence runtime.

## Kiểm thử và giới hạn môi trường

- `npm run build` — API TypeScript và Web TypeScript/Vite build thành công.
- `npm run test:e2e --workspace @labodc/api -- --runInBand test/d17-d18-evaluations-reports.e2e-spec.ts` — 10 tests PASS, bao gồm tổng tỷ lệ, thành viên ngoài Team, trạng thái duyệt/sửa, Mentor sai quyền, dữ liệu stale và giới hạn riêng tư.
- `npm run test --workspace @labodc/api -- --runInBand` — 41 suites / 104 tests PASS.
- `git diff --check` sạch tại thời điểm ghi nhận.
