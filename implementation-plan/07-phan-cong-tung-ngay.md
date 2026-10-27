# Phân công từng ngày cho 2 sinh viên — vertical slice, không chia BE/FE

> **Mục tiêu:** chia công việc D1–D40 sao cho hai sinh viên có thể làm độc lập trên hai lát cắt nghiệp vụ khác nhau; mỗi người chịu trách nhiệm xuyên suốt giao diện + API/backend + dữ liệu + kiểm thử cho phần mình. Không tổ chức một người chỉ làm BE và một người chỉ làm FE.  
> **Nguồn yêu cầu:** [labodc_project_requirements.md](../labodc_project_requirements.md).  
> **Lịch tổng:** [00-ke-hoach-tong-the.md](./00-ke-hoach-tong-the.md).

## 1. Quy ước chia việc để tránh chồng chéo

### Ownership theo miền nghiệp vụ

- **Sinh viên A owns Enterprise/Lab/Finance/System Admin:** enterprise profile, project proposal/lifecycle, Lab approval/admin, scope-change/cancel, payment/ledger/70-20-10/advance, finance reports, system settings/technical users.
- **Sinh viên B owns Talent/Mentor/Team/Operations:** talent profile/portfolio, candidate discovery/application, interview/mentor workflow, team/leader, tasks/templates/files, reports/evaluation/contribution, Flutter client.
- **Cả hai cùng chịu trách nhiệm chung** về API convention, authentication contract, production checklist, review chéo và quyết định kiến trúc; mỗi file/code module chỉ có một owner viết chính.

### Quy tắc file/API/schema

1. Tách backend theo NestJS domain module và frontend theo feature route/component; không cùng sửa một feature folder trong cùng ngày. Ví dụ ownership: A `apps/api/src/{auth,enterprise,projects,payments,lab-admin,system-admin}` và `apps/web/src/features/{enterprise,project-admin,finance,system-admin}`; B `apps/api/src/{talent,mentor,teams,tasks,reports,templates}`, `apps/web/src/features/{talent,mentor,team,reports}` và `apps/mobile/lib/features`.
2. A sở hữu auth/RBAC shared module, company/project/payment/admin modules; B sở hữu talent/mentor/team/task/report/template/mobile modules. Người kia chỉ review qua PR; B làm cả backend APIs lẫn UI trong module mình.
3. Không sửa trực tiếp cùng migration/schema file. Mỗi người tạo migration riêng có timestamp và prefix module; nếu đổi shared entity, mở contract/PR trước, chỉ một người được chỉ định owner migration đó.
4. API contract cho shared entities (User, Project, Application, Team, Payment) được ghi trước khi client tiêu thụ. B không đổi API của A trực tiếp; tạo issue/PR đề nghị thay đổi.
5. Mỗi người làm full-stack theo feature của mình: form/screen → API/controller/service → persistence/validation/authorization → tests. Flutter là client thứ hai cho các API mà B cùng sở hữu về miền nghiệp vụ, không phải lý do biến B thành “frontend-only”.
6. PR nhỏ, một story/vertical slice; đặt owner/reviewer; không merge code do AI sinh nếu người phụ trách chưa đọc, chạy test và giải thích được.
7. Có thể dùng mock API trong ngày đầu feature để độc lập; trước checkpoint phải tích hợp API thật hoặc ghi rõ contract mismatch.

### Nhịp mỗi ngày

- **Đầu ngày 10–15 phút:** xác nhận input, output, file/module owner, API contract và blocker.
- **Trong ngày:** mỗi người làm phần riêng; nếu cần shared change thì tạo contract/PR, không cùng chỉnh file.
- **Cuối ngày 20–30 phút:** merge/review, chạy test cho hai slices, smoke staging khi phù hợp, cập nhật traceability và actual hours.
- Nếu dependency chưa sẵn sàng, dùng mock theo contract đã thống nhất và tiếp tục phần độc lập; không tự tạo schema/API song song.

## 2. Phân công D1–D10: baseline, nền tảng và MVP

Mỗi ngày dùng cùng một bố cục: **Input** là điều kiện bắt đầu; **A/B** là đầu ra mỗi người chịu trách nhiệm; **Cùng chốt** là checkpoint để không lệch contract.

### D1 — Phân rã yêu cầu
- **Input:** Requirements file, mục tiêu D40, danh sách stakeholder.
- **A:** Phân rã actor/requirements Enterprise, Lab, System Admin, project và finance; đầu ra: requirement IDs A + câu hỏi nghiệp vụ A.
- **B:** Phân rã requirements Talent, Mentor, Leader, team, task/report/mobile; đầu ra: requirement IDs B + câu hỏi UX B.
- **Cùng chốt:** Gộp danh sách, mỗi requirement có owner; đặt lịch PO.

### D2 — Workshop luồng nghiệp vụ
- **Input:** Danh sách yêu cầu D1, khách hàng/PO có mặt.
- **A:** Workshop proposal, duyệt/công bố, đổi scope/hủy, payment/fund/advance; đầu ra: sơ đồ luồng A và decision log.
- **B:** Workshop profile, apply, mentor/interview, team/leader, task/report/evaluation; đầu ra: sơ đồ luồng B.
- **Cùng chốt:** PO xác nhận câu hỏi mở và người quyết định.

### D3 — State và acceptance criteria
- **Input:** Luồng nghiệp vụ draft.
- **A:** Viết state machine + acceptance criteria cho project/admin/finance; đầu ra: A-domain states, API/data draft.
- **B:** Viết state machine + acceptance criteria cho talent/team/report/mobile; đầu ra: B-domain states, API/data draft.
- **Cùng chốt:** Auth/role contract, shared Project/Application ownership và quy tắc dữ liệu.

### D4 — Ước lượng và forecast gate
- **Input:** Requirement IDs, luồng, giờ khả dụng của hai người.
- **A:** Ước lượng story enterprise/admin/finance theo giờ, dependency, test/rework; đầu ra: estimate A + risk list.
- **B:** Ước lượng talent/mentor/mobile/report theo giờ, dependency, test/rework; đầu ra: estimate B + test charter draft.
- **Cùng chốt:** Capacity/forecast, baseline, API conventions, architecture và risk đỏ.

### D5 — Nền tảng và đăng nhập
- **Input:** Repo rỗng, stack/API convention đã chốt D4; shared User/Auth contract.
- **A:** Tạo NestJS/API và React root skeleton, auth/user/role vertical slice (API + login/admin UI + tests); owner shared config/auth.
- **B:** Tạo module Talent profile theo contract (profile API/schema riêng + UI form + validation/tests); không sửa root config/auth.
- **Cùng chốt:** A merge skeleton/auth trước; B tích hợp theo contract, seed user/mock auth nếu cần; chốt migration ownership.

### D6 — Hồ sơ doanh nghiệp và tài năng
- **Input:** Auth/RBAC staging, form/profile contract.
- **A:** Enterprise profile: API/schema + UI đăng ký/quản lý doanh nghiệp + ownership test.
- **B:** Talent skills/certifications/portfolio: API/schema + UI + upload stub/validation/test.
- **Cùng chốt:** E2E hai loại hồ sơ, kiểm tra data isolation.

### D7 — Đề xuất và khám phá dự án
- **Input:** Profile modules và project field acceptance criteria.
- **A:** Proposal draft/submit: API/state/data + form doanh nghiệp + validation/test.
- **B:** Discovery/list/detail/filter: API read/search + web UI cho sinh viên; dùng project contract, test visibility.
- **Cùng chốt:** Review contract project; chỉ A ghi project lifecycle schema.

### D8 — Duyệt đề xuất và ứng tuyển
- **Input:** Proposal và discovery APIs/UI.
- **A:** Lab review queue: API approve/reject/request-info + UI + audit/test.
- **B:** Candidate application/withdraw: API + UI + duplicate/closed-project tests.
- **Cùng chốt:** E2E proposal vào queue và application validation.

### D9 — Công bố và trạng thái ứng tuyển
- **Input:** Lab decisions, application states.
- **A:** Publish/unpublish/close project: API + Lab UI + transition tests.
- **B:** Application status/candidate view: API + talent UI + ownership tests.
- **Cùng chốt:** Kiểm thử project visibility và quyền theo vai trò.

### D10 — Demo MVP đầu tiên
- **Input:** Auth + proposal/review/publish/apply vertical slices.
- **A:** Tích hợp, sửa A-project API/UI defects; bổ sung E2E test và migration/seed docs.
- **B:** Tích hợp, sửa B-talent API/UI defects; bổ sung E2E test responsive.
- **Cùng chốt:** Sprint demo staging: doanh nghiệp → Lab → công khai → đăng ký; ghi forecast.

## 3. Phân công D11–D20: mentor, nhóm và vận hành

### D11 — Đổi dự án và phỏng vấn
- **Input:** Project/app states, chính sách interview/change.
- **A:** Request đổi scope/hủy: API/state/approval UI cho enterprise/Lab + audit tests.
- **B:** Mentor review/interview candidate: API + mentor UI + rubric/status tests.
- **Cùng chốt:** Xác nhận approver và state transitions với PO.

### D12 — Quản trị Lab và mời mentor
- **Input:** Interview criteria, cancellation policy.
- **A:** Lab quản lý company/project: API + admin screens + ownership tests.
- **B:** Mentor invitation/accept/decline: API + mentor screens + notification state.
- **Cùng chốt:** E2E invite/review; kiểm tra tenant/resource scoping.

### D13 — Ngân sách và lập nhóm
- **Input:** Approved applications, mentor assignment rule.
- **A:** Project budget/fund setup và admin allocation UI/API theo policy chưa chuyển tiền.
- **B:** Team formation/leader appointment/election: API + UI + role/uniqueness tests.
- **Cùng chốt:** Kiểm tra application → team, leader permissions.

### D14 — Cấu hình và template
- **Input:** Mẫu Excel/Docs và approved file policy.
- **A:** System settings/technical users: API + admin UI + RBAC tests.
- **B:** Template/task setup: metadata API + task/milestone UI + version tests.
- **Cùng chốt:** Chốt template version; test file access contract.

### D15 — Payment sandbox và giao nhiệm vụ
- **Input:** Team/task model, PayOS sandbox credentials.
- **A:** Tạo payment order/payment intent sandbox: API + enterprise payment UI + state tests.
- **B:** Giao task/milestone cho team: API + mentor/leader UI + assignment tests.
- **Cùng chốt:** Không xác nhận giao dịch bằng redirect client; kiểm tra sandbox-only.

### D16 — Webhook và nộp đầu ra
- **Input:** Payment order API, task assignments.
- **A:** Payment callback/webhook: verification/idempotency API + admin payment status UI + duplicate tests.
- **B:** Nộp báo cáo/đầu ra: API + student/leader UI + validation/version tests.
- **Cùng chốt:** Test callback giả lập và report submission E2E.

### D17 — Ledger và đánh giá
- **Input:** Financial rulebook signed or decisions listed.
- **A:** Ledger + 70/20/10 calculation/rounding API + finance UI + unit/boundary tests.
- **B:** Mentor evaluation/feedback/contribution: API + UI + rubric/visibility tests.
- **Cùng chốt:** Review rule tiền với Finance; không để AI tự quyết định rounding.

### D18 — Tạm ứng và báo cáo giai đoạn
- **Input:** Delayed payment/advance policy, phase report fields.
- **A:** Delayed payment/advance ledger + approval UI/API + audit/negative tests.
- **B:** Báo cáo theo tháng/giai đoạn: API + mentor/Lab UI + submit/review tests.
- **Cùng chốt:** Cross-test quyền Lab/mentor/leader và số liệu hiển thị.

### D19 — Minh bạch tài chính và file
- **Input:** File upload policy, transparency report criteria.
- **A:** Lab transparency/monthly finance report: query/API + dashboard/export UI + calculation tests.
- **B:** Cloudinary integration: upload/download API + UI cho avatar/portfolio/task docs + access/size tests.
- **Cùng chốt:** Verify file permissions; report sums compare ledger fixtures.

### D20 — Sprint tích hợp
- **Input:** Hai domain slices, updated OpenAPI, templates.
- **A:** Sửa A-side integration defects; fullstack E2E payment/project/admin scenarios + docs.
- **B:** Sửa B-side integration defects; fullstack E2E talent/mentor/team/report scenarios + docs.
- **Cùng chốt:** Sprint review staging, triage; ghi requirements chưa có owner/test.

## 4. Phân công D21–D31: tìm kiếm, Flutter, tài chính và tích hợp

### D21 — Search và Flutter nền tảng
- **Input:** Search requirements, actual response time target.
- **A:** Elasticsearch/search integration cho project listing: indexing/query API + admin/search filters UI + consistency tests.
- **B:** Flutter base app và secure login/profile: client flow + API adapter/error states/device tests.
- **Cùng chốt:** Build web/API/mobile; ghi quyết định Redis/Elasticsearch use case.

### D22 — Cache và khám phá trên mobile
- **Input:** Search API contract, Flutter auth endpoints.
- **A:** Redis/cache/session use case nếu baseline yêu cầu: backend integration + admin diagnostics/settings UI + invalidation tests.
- **B:** Flutter project discovery/detail: client screens + candidate search/filter API refinement thuộc B module + widget/API tests.
- **Cùng chốt:** So khớp Flutter và web API behavior.

### D23 — Thanh toán và ứng tuyển mobile
- **Input:** PayOS sandbox/order flow, Flutter project flow.
- **A:** Payment status/history/reconciliation: API + enterprise/Lab UI + ledger reconciliation tests.
- **B:** Flutter application/status: application API + mobile UI + duplicate/offline/retry tests.
- **Cùng chốt:** E2E sandbox payment + apply trên build mobile.

### D24 — Tài chính và nhiệm vụ mobile
- **Input:** Team/task/report APIs, Cloudinary service.
- **A:** Finance admin controls/approvals: API + dashboard UI + role/audit tests.
- **B:** Flutter assigned project/task/report: APIs + app screens + device/widget tests.
- **Cùng chốt:** Mentor review các phần integration/security; sprint demo.

### D25 — Xử lý lỗi thanh toán và tài liệu
- **Input:** Payment failure/timeout cases, file policy.
- **A:** Payment retry/failure/cancel/refund state: API + enterprise UI + idempotency tests.
- **B:** Secure document/portfolio management: API + web/mobile UI + file access/size tests.
- **Cùng chốt:** Test không tạo duplicate transaction/file exposure.

### D26 — Phân bổ quỹ và hiệu suất nhóm
- **Input:** Split/advance rulebook, approved evaluation rubric.
- **A:** Fund allocation/advance approval and payment-delay notices: API + Lab/enterprise screens + arithmetic tests.
- **B:** Leader redistribution proposal + team performance report: API + leader/mentor screens + approval tests.
- **Cùng chốt:** Finance/PO xem sample calculation và báo cáo.

### D27 — Báo cáo quản trị và đánh giá
- **Input:** Admin reporting requirements, monthly summary.
- **A:** Lab enterprise/project/talent administration and monthly summaries: API + dashboard + query tests.
- **B:** Mentor evaluation/acceptance and candidate feedback: API + mentor/talent UI + visibility tests.
- **Cùng chốt:** Verify report totals against fixtures and role permissions.

### D28 — Diễn tập triển khai
- **Input:** AWS account, Docker config, mobile platform target.
- **A:** Production-like deploy/config/health/backup instrumentation for A modules + admin status view; đầu ra: deploy rehearsal.
- **B:** Flutter build/signing/device compatibility + web/mobile UI fixes for B modules; đầu ra: installable release candidate.
- **Cùng chốt:** Không merge secret; staging health check và deploy note.

### D29 — Đóng các khoảng trống yêu cầu
- **Input:** Full traceability matrix, unresolved req list.
- **A:** Implement remaining A-owned requirement gaps as vertical slices; đầu ra: linked test evidence.
- **B:** Implement remaining B-owned requirement gaps as vertical slices; đầu ra: linked test evidence.
- **Cùng chốt:** Triage requirement IDs; mọi gap có owner, estimate và blocker.

### D30 — Regression theo miền
- **Input:** Candidate RC, integrations.
- **A:** A-domain regression: enterprise/project/finance/admin UI+API+data; đầu ra: defect list and fixes.
- **B:** B-domain regression: talent/mentor/team/report/template/mobile UI+API+data; đầu ra: defect list and fixes.
- **Cùng chốt:** End-to-end cross-domain smoke; freeze new architecture changes.

### D31 — Tích hợp và phát hành RC
- **Input:** Feature-complete candidate, security checklist.
- **A:** Security + integration tests for A-owned auth/project/payment/admin slices; remediate findings.
- **B:** Security + integration tests for B-owned profile/files/team/report/mobile slices; remediate findings.
- **Cùng chốt:** Cross-review PRs; publish integrated RC to staging.

## 5. Phân công D32–D40: hardening, UAT, production, bàn giao

### D32 — Regression trên staging
- **Input:** Staging RC, requirement-to-test matrix.
- **A:** Regression A modules, API/UI/data defects; đầu ra: A test report + fixes.
- **B:** Regression B modules and Flutter; đầu ra: B test report + fixes.
- **Cùng chốt:** Tất cả P0/P1 baseline có test/evidence mapping.

### D33 — Bảo mật và dữ liệu
- **Input:** RC stable, security/deploy checklist.
- **A:** Test auth/RBAC, payment webhook/ledger, migration/backup on A-owned domains; close defects.
- **B:** Test file permissions, mobile auth/storage, report/team privacy; close defects.
- **Cùng chốt:** Independent mentor/security review findings được ghi và phân loại.

### D34 — Kiểm thử NFR
- **Input:** NFR test charter and load environment.
- **A:** Run load/perf tests for project listing/payment APIs; optimize A-side queries/UI; report measured values.
- **B:** Run device/UX/responsive tests and B API flows; optimize candidate/mentor screens; report.
- **Cùng chốt:** Không tuyên bố NFR pass nếu test conditions/results không ghi lại.

### D35 — UAT với khách hàng
- **Input:** UAT scripts, seeded accounts for all actors.
- **A:** Facilitate UAT for enterprise/Lab/System Admin; fix A-owned defects fullstack.
- **B:** Facilitate UAT for talent/mentor/leader/mobile; fix B-owned defects fullstack.
- **Cùng chốt:** PO signs results or records blocker/decision.

### D36 — Sửa blocker và quyết định go/no-go
- **Input:** UAT defects and release candidate.
- **A:** Fix A-owned blockers; verify payment mode, ledger, admin controls, run A smoke tests.
- **B:** Fix B-owned blockers; verify Flutter/web candidate flows, run B smoke tests.
- **Cùng chốt:** Release go/no-go, DB backup/restore and rollback rehearsal.

### D37 — Triển khai production
- **Input:** Approved production release and migration plan.
- **A:** Deploy/verify A-owned server/project/finance routes and admin flows; đầu ra: A smoke record.
- **B:** Deploy/verify B-owned web/mobile talent/mentor flows and app distribution; đầu ra: B smoke record.
- **Cùng chốt:** Joint production smoke, metrics/logs, validate no critical errors.

### D38 — Theo dõi pilot
- **Input:** Production pilot users and support channel.
- **A:** Monitor/fix enterprise/Lab/finance defects fullstack; đầu ra: incident/defect notes.
- **B:** Monitor/fix talent/mentor/mobile defects fullstack; đầu ra: incident/defect notes.
- **Cùng chốt:** PO decides continue/rollback; no scope additions.

### D39 — Diễn tập và bàn giao
- **Input:** Pilot results, handover checklist.
- **A:** Verify backup/restore, finance/project data integrity, API runbook and A docs.
- **B:** Verify user workflows, mobile install/use guide, templates and B docs.
- **Cùng chốt:** Both rehearse rollback/support and confirm owner/access.

### D40 — Nghiệm thu cuối
- **Input:** Final production candidate, signed acceptance checklist.
- **A:** Final A-domain smoke, release notes for project/admin/finance, operations handover.
- **B:** Final B-domain smoke, mobile/client guide, mentor/talent handover.
- **Cùng chốt:** Customer accepts full baseline; tag release, hand over source/docs/production operations.

## 6. Cách tránh chồng chéo mỗi ngày

- Task của A và B khác **business domain + file ownership**, nhưng mỗi bên đều có UI và backend/API work trong task được giao.
- Không giao cùng một màn hình/API/table cho cả hai cùng lúc. Nếu shared change cần thiết, một người tạo contract/PR; người kia review, không sửa song song.
- Migration của A/B tách file và module; thay đổi bảng dùng chung phải thống nhất schema/API trước giờ code.
- Dùng mock/contract test để một người không bị chặn khi người kia đang làm implementation.
- Mỗi ngày chỉ chọn tối đa một mục tiêu chính/người và một task phụ nhỏ; tránh để AI sinh nhiều feature chưa tích hợp.
- Chốt integration checkpoint cuối ngày: build/test của từng domain pass; mismatch API ghi issue với owner, không tự sửa chồng chéo.

## 7. Mẫu task card dùng hằng ngày

```text
Requirement ID:
Người owner:
Business domain/module:
Input/contract đã có:
Files được phép sửa:
Files/module không được sửa:
Output cần demo cuối ngày:
Acceptance checks:
Tests phải chạy:
API/schema dependency:
AI prompt/task bounded:
Reviewer:
Actual hours / blocker / risk:
```

Lịch ngày trên là kế hoạch phân công, không phải cam kết năng suất. Nếu estimate vượt capacity, giữ ownership và báo forecast đỏ; không giảm kiểm thử, bỏ yêu cầu hoặc coi code AI sinh ra là done khi chưa qua acceptance.
