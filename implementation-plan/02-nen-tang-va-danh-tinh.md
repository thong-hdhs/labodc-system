# Giai đoạn 1 — Nền tảng và lát cắt MVP đầu tiên

**Thời hạn:** D5–D10  
**Mục tiêu:** dựng nền tảng cần thiết và triển khai MVP theo lịch phân công chuẩn tại [07-phan-cong-tung-ngay.md](./07-phan-cong-tung-ngay.md): xác thực, hồ sơ, đề xuất/duyệt/công bố dự án, khám phá và đăng ký ứng tuyển. Đây là lát cắt kiểm chứng, không thay thế baseline bàn giao đầy đủ D40.

**Giới hạn nguồn lực:** hai sinh viên làm vertical slice theo miền nghiệp vụ; A sở hữu Auth/RBAC và Project lifecycle, B sở hữu Talent profile/discovery/Application. Mỗi người làm UI + API + data + test cho phần mình. Shared contract phải được thống nhất trước khi tích hợp; không chia người này chỉ làm backend, người kia chỉ làm frontend.

## Đầu vào

- Baseline/requirement IDs, actor list, câu hỏi mở và ownership D1–D4.
- API conventions, data classification/privacy decisions và shared User/Auth/Project/Application contracts.
- Repo, quyền Git/cloud/domain, CI/CD, PayOS sandbox, Cloudinary và Flutter toolchain theo phạm vi đã được xác nhận.
- Quyết định JWT/session, password policy và cách bootstrap System Admin.

## Công việc và thời hạn

| Ngày | Công việc/đầu ra trung gian |
|---|---|
| D5 | A dựng NestJS/API và React root skeleton, auth/user/role vertical slice; B khởi tạo Talent profile API/schema/UI theo contract, không sửa shared auth/root config. |
| D6 | Hoàn thiện hồ sơ doanh nghiệp (A) và hồ sơ Talent gồm skills/certifications/portfolio (B); kiểm tra ownership và data isolation. |
| D7 | A làm proposal draft/submit; B làm discovery/list/detail/filter cho Talent theo Project contract; A là owner Project lifecycle/schema. |
| D8 | A làm Lab review queue, approve/reject/request-info và audit; B làm application/withdraw theo rule, kiểm thử chống trùng và project đóng. |
| D9 | A làm publish/unpublish/close và enterprise status; B làm trạng thái application và candidate view; kiểm tra visibility/quyền. |
| D10 | Tích hợp, sửa lỗi, bổ sung E2E/seed/run docs và demo staging theo luồng doanh nghiệp → Lab → công bố → sinh viên đăng ký; cập nhật capacity forecast. |

Chi tiết trách nhiệm, input/output và checkpoint mỗi ngày theo [file phân công từng ngày](./07-phan-cong-tung-ngay.md), là nguồn chuẩn khi chia việc.

## Đầu ra

- Repo có quy ước làm việc, CI, Docker local, PostgreSQL migrations/versioning và API skeleton.
- Login/authentication và authorization server-side theo contract; tài khoản System Admin bootstrap an toàn.
- Hồ sơ doanh nghiệp và Talent theo trường đã được PO xác nhận.
- Proposal draft/submit; Lab review queue có request more info/approve/reject; audit state transition.
- Publish controls và danh sách/chi tiết dự án chỉ hiển thị đúng trạng thái.
- Talent application/status; server-side validation chống trùng và không nhận đơn khi dự án đóng.
- Web flows cho actor MVP; API docs, migrations/seed và E2E test evidence.
- Staging demo và cập nhật traceability/risk/capacity.

## Chia việc

- **Sinh viên A:** shared Auth/RBAC implementation, enterprise profile, proposal/approval/publish/project lifecycle; full-stack slices gồm API, data, UI và tests.
- **Sinh viên B:** Talent profile, project discovery và Application workflow/schema; full-stack slices gồm API, data, UI và tests.
- **Cả hai:** chốt contract User/Auth/Project/Application, tích hợp, review chéo, CI/staging và E2E.
- **PO/khách hàng:** xác nhận trường hồ sơ/dự án, reason codes, điều kiện đăng ký, trạng thái và review demo.
- Không cùng sửa shared schema/migration; B sở hữu Application workflow/schema, A sở hữu Project lifecycle và cung cấp trạng thái Project contract.

## Gate kết thúc D10

- Có thể demo end-to-end trên staging: doanh nghiệp tạo/gửi proposal → Lab xử lý → dự án được công bố → Talent đăng ký và xem trạng thái.
- Hành động trái quyền, đăng ký trùng và đăng ký dự án chưa mở bị backend từ chối.
- Migration/seed và smoke test chạy lặp lại được; các lỗi và giới hạn được ghi nhận.
- MVP được PO review; chưa coi đây là hoàn thành các yêu cầu mentor, vận hành, tài chính, mobile hay production thuộc baseline.

## Definition of Done

CI và các kiểm thử phù hợp pass; API/UI/data tích hợp; authorization được xác minh phía server; staging demo có thể tái tạo; traceability, tài liệu và forecast được cập nhật. Nếu nền tảng/auth chưa ổn định, ghi blocker và xử lý trước khi mở rộng.
