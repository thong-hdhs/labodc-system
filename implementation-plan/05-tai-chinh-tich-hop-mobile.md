# Giai đoạn 4 — Tài chính, tích hợp ngoài và Flutter

**Thời hạn:** D25–D31  
**Mục tiêu:** hoàn thiện các luồng tài chính và dịch vụ nằm trong baseline, tích hợp mobile/API, và không đưa giao dịch production vào hoạt động khi chưa có quyết định nghiệp vụ/bảo mật.

**Cảnh báo nguồn lực:** payments + ledger + webhook + tạm ứng + Flutter + search/storage/cloud là rủi ro lớn cho hai sinh viên không có chuyên gia chuyên trách. Trước khi bắt đầu, cần có estimate và reviewer có kinh nghiệm tài chính/bảo mật. Nếu thiếu policy/tài khoản/reviewer hoặc capacity, đánh dấu blocker và xin quyết định scope/nguồn lực; không tự triển khai tiền thật bằng code sinh tự động chưa được review.

Phân công mỗi ngày giữ theo domain ownership A (Finance/Enterprise) và B (Talent/Mentor/Files/Mobile); mỗi người làm UI + API + data + tests cho slices của mình như [bảng D21–D31](./07-phan-cong-tung-ngay.md).

## Đầu vào

- Rulebook tài chính ký duyệt: payment states, split 70/20/10, rounding, delayed payment, advance, refunds, cancellation, reconciliation.
- Tài khoản PayOS sandbox/production và webhook configuration.
- Cloudinary credentials, upload policy, AWS environments, Redis/Elasticsearch use cases và acceptance criteria.
- Flutter actor/platform scope và app signing/distribution accounts.
- Tất cả workflow giai đoạn 2–3, test data, security/privacy decisions.

## Công việc theo ngày

| Ngày | Công việc |
|---|---|
| D25 | Chốt payment domain/data model/ledger, idempotency keys, transaction states, threat review; test PayOS sandbox connectivity |
| D26 | Tạo payment intent/order và trạng thái pending/success/failure/cancel; không tin redirect phía client làm bằng chứng thanh toán |
| D27 | Webhook verification, replay/duplicate protection, reconciliation/admin review; test lỗi mạng/timeout |
| D28 | Quy tắc phân bổ 70/20/10, làm tròn, approval, fund allocation và delayed payment/advance ledger theo policy |
| D29 | Cloudinary upload/download; access controls, file constraints; Flutter flows login/project/application/task/report theo baseline |
| D30 | Redis/Elasticsearch integration nếu được xác nhận; search/index consistency; AWS/Docker deploy configuration; Flutter build/signing integration |
| D31 | Tích hợp end-to-end tài chính/files/mobile; test sandbox; customer review; kiểm tra traceability mọi requirement còn lại |

## Đầu ra

- Payment/transaction state machine và ledger được thiết kế, migration, API/UI theo policy.
- Webhook xác thực theo cơ chế nhà cung cấp; xử lý idempotent; transaction reconciliation có audit.
- Rule phân bổ quỹ và tạm ứng được kiểm thử đơn vị/biên làm tròn; thao tác phê duyệt có quyền rõ.
- Lab transparency report/monthly summary và enterprise payment/report status theo baseline; các khoản advance được ghi nhận, phê duyệt và đối soát, không chỉ cập nhật số dư trực tiếp.
- Cloudinary flow với upload/download quyền hạn, giới hạn file và không để lộ URL/quyền quá mức.
- Flutter build cho platform đã xác nhận, tích hợp API/JWT và luồng user bắt buộc.
- Redis/Elasticsearch có use case, fallback/consistency và monitoring nếu baseline yêu cầu.
- PayOS sandbox test report; production-readiness checklist; không ghi nhận thanh toán thật trong production trước khi được PO/đơn vị tài chính phê duyệt.
- Cập nhật SAD/DDD/API docs, threat model và integration runbook.

## Chia việc với 2 sinh viên

- **Sinh viên A:** sở hữu payment/fund vertical slices end-to-end: ledger/webhook/API/data + enterprise/Lab payment UI + boundary tests; không chỉ làm backend.
- **Sinh viên B:** sở hữu Cloudinary/template/mobile vertical slices: file/task API + web/mobile screens + permission/device tests; không chỉ làm frontend.
- **Cả hai:** review chéo và test tích hợp theo [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md); không chỉnh đồng thời cùng payment/file module.
- PO/Finance/reviewer phê duyệt rule, sandbox/production; transaction production không bật nếu chưa đủ sign-off.
- **PO/Finance/mentor chuyên môn:** ký policy, cấp tài khoản, xác nhận sandbox/production và review thiết kế tài chính.
- Nếu không có chuyên gia/reviewer tài chính và bảo mật, chỉ tích hợp/test sandbox hoặc không bật chức năng tiền thật theo quyết định bằng văn bản.

## Gate kết thúc D31

- Mọi requirement tài chính/integration/mobile có test evidence hoặc blocker được người có thẩm quyền quyết định bằng văn bản.
- Thanh toán thật chỉ được bật khi có phê duyệt nghiệp vụ, tài khoản production, đối soát, vận hành sự cố và security sign-off.
- Tính toán quỹ có test chính xác; webhook duplicate/replay không ghi nhận hai lần.
- Flutter được build/install/test trên platform mục tiêu; store review (nếu cần) được tính vào critical path.

## Definition of Done

Không có secret trong repo/log; tích hợp test ở sandbox; ledger/audit khớp; mobile/API test pass; acceptance của PO/Finance ghi nhận. Nếu production payment chưa được phép, môi trường phải ở chế độ sandbox/disabled, không thể bị hiểu nhầm là giao dịch thật.
