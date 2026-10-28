# Giai đoạn 3 — Tìm kiếm, Flutter, tài chính và tích hợp hệ thống

**Thời hạn:** D21–D31
**Mục tiêu:** hoàn thiện search/cache, ứng dụng Flutter, các luồng tài chính và tích hợp/delivery còn lại trong baseline; kiểm thử trên môi trường phù hợp và chuẩn bị release candidate. Ngày phân công trong [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md) là lịch chuẩn.

**Cảnh báo nguồn lực:** payment/ledger/webhook, mobile, storage/search/cloud và triển khai là các hạng mục rủi ro cao cho hai sinh viên. Cần reviewer chuyên môn cho tài chính/bảo mật/production. Thiếu policy, tài khoản hoặc năng lực là blocker cần escalte; không mặc định AI thay thế reviewer hay phê duyệt.

## Đầu vào

- Các workflow D5–D20, API/schema contracts và traceability matrix cập nhật.
- Rulebook tài chính; PayOS sandbox và webhook configuration.
- Cloudinary credentials/upload policy; use case Redis/Elasticsearch đã được xác nhận.
- Flutter actor/platform scope. Android là mục tiêu lập kế hoạch hiện tại của B, chờ PO xác nhận nghiệm thu chính thức.
- AWS/Docker environment và quyền triển khai; test data, privacy/security decisions.

## Công việc theo ngày

| Ngày | Công việc |
|---|---|
| D21 | A: Elasticsearch/search cho project listing. B: Flutter base, login/profile. |
| D22 | A: Redis/cache/session use case nếu thuộc baseline. B: Flutter project discovery/detail. |
| D23 | A: payment status/history/reconciliation. B: Flutter application/status. |
| D24 | A: finance admin controls/approvals. B: Flutter assigned project/task/report; mentor review và sprint demo. |
| D25 | A: payment retry/failure/cancel/refund states. B: secure document/portfolio management trên web/mobile. |
| D26 | A: fund allocation/advance approval/payment-delay flow. B: Leader redistribution proposal và team performance report; Mentor confirmation theo policy. |
| D27 | A: Lab administration/monthly summaries. B: Mentor evaluation/acceptance và candidate feedback. |
| D28 | A: production-like deployment, config/health/backup rehearsal. B: Flutter build/signing/device compatibility và client fixes. |
| D29 | Cả hai: đóng các requirement gaps còn lại theo ownership, gắn test evidence và blocker. |
| D30 | A/B: regression theo miền; cùng chạy cross-domain E2E và freeze thay đổi kiến trúc mới. |
| D31 | A/B: security/integration tests theo domain, cross-review và phát hành integrated release candidate lên staging. |

## Đầu ra

- Project search/indexing và Redis use case có consistency/invalidation/fallback tests nếu các thành phần này thuộc baseline.
- Flutter app build được cho nền tảng được PO xác nhận, tích hợp API/auth và các luồng actor bắt buộc.
- Payment states, webhook/idempotency/reconciliation, 70/20/10, delayed payment/advance theo rulebook đã duyệt.
- Leader/team fund workflow liên kết với finance API/ledger của A; có kiểm thử quyền và số liệu.
- Cloudinary flow với kiểm soát truy cập/giới hạn tệp.
- AWS/Docker config, health/backup/deployment rehearsal và release candidate staging.
- Mọi requirement trong baseline có test evidence hoặc blocker/waiver do người có thẩm quyền quyết định.
- Cập nhật SAD/DDD/API docs, threat/deployment/integration runbooks.

## Chia việc

- **A:** payment/fund vertical slices, project search/index/cache, Lab/enterprise finance/admin, server/DB deploy.
- **B:** Flutter client, Talent/Mentor/Team/Task/Report/Template workflows, file usage flows và mobile/device tests.
- **Cả hai:** review chéo, integration/E2E, release checklist và ghi nhận actual hours/forecast.
- Thanh toán production chỉ được bật khi policy, tài khoản, đối soát, vận hành sự cố và security sign-off đã hoàn tất; nếu chưa, giữ sandbox/disabled.

## Gate kết thúc D31

- Các requirement tài chính/integration/mobile có evidence hoặc blocker được PO quyết định chính thức.
- Tính toán quỹ đúng theo policy; webhook trùng/replay không ghi nhận hai lần.
- Flutter build được cài/chạy trên nền tảng mục tiêu đã chốt.
- Integrated RC trên staging có test/release evidence; không đưa phần thiếu baseline sang giai đoạn kiểm thử như thể đã feature-complete.

## Definition of Done

Không có secret trong source/log; sandbox/payment modes rõ ràng; API/client tests pass; ledger/audit khớp; file/mobile/security checks có evidence; tài liệu và traceability cập nhật. Giai đoạn sau tập trung hardening, UAT và rollout, không phải lần đầu phát hiện các chức năng baseline còn thiếu.
