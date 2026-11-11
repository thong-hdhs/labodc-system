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

---

# Phần Báo cáo Ngày D26 của Sinh viên A — Liên thông Đánh giá Hiệu suất Mobile (`Evaluations`) với Quyết toán Quỹ 70% Nhóm Sinh viên, Kiểm toán Bảo mật File Riêng tư & Đóng Cổng Gate D26 (`GATE_D26_MOBILE_FULL_PARITY_AND_EVAL_BRIDGE`)

> **Người phụ trách:** Sinh viên A phối hợp đồng bộ với bản cập nhật Mobile D26 của Sinh viên B (`apps/mobile/lib/features/evaluations/*` & `apps/mobile/test/features/evaluations/*`)  
> **Đầu ra:** Migration `022_a_mobile_evaluations_payout_bridge_and_gate_d26.sql`, `MobileEvaluationBridgeService` & `MobileEvaluationBridgeController` (`apps/api/src/system-admin/*`), Giao diện `MobileEvaluationBridgeD26Panel.tsx`, Unit Test `mobile-evaluation-bridge.service.spec.ts` và E2E Test `d26-mobile-evaluations-payout-bridge.e2e-spec.ts` Pass 100%.

| Mã Gate / Req | Hạng mục công việc Full-Stack của Sinh viên A (Ngày D26) | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **Gate D26** *(DB Migration)* | Thiết kế Migration `022_a_mobile_evaluations_payout_bridge_and_gate_d26.sql` (`evaluation_payout_reconciliations`, `gate_d26_mobile_full_parity_signoffs`) | `apps/api/src/database/migrations/022_a_mobile_evaluations_payout_bridge_and_gate_d26.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **Evaluation – Payout Bridge** | Xây dựng API Đối soát Điểm đánh giá đóng góp trên Mobile với Quỹ 70% Nhóm SV (`POST /api/v1/system-admin/mobile-eval-bridge/reconcile-payout`) và Ký Nghiệm thu Cổng Tương đương Toàn diện Gate D26 (`POST /api/v1/system-admin/mobile-eval-bridge/gate-d26-signoff`) | `apps/api/src/system-admin/mobile-evaluation-bridge.types.ts`<br>`apps/api/src/system-admin/mobile-evaluation-bridge.service.ts`<br>`apps/api/src/system-admin/mobile-evaluation-bridge.controller.ts`<br>`apps/web/src/features/system-admin/MobileEvaluationBridgeD26Panel.tsx` | **Hoàn thành (100%)** | Pass Unit Test `Unit-EVAL-D26-01` & E2E `TC-BRIDGE-D26-01` |
