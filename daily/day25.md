---

# Phần triển khai Ngày D25 của Sinh viên B — Quản lý an toàn Avatar và Portfolio

> **Phạm vi:** Sinh viên B sở hữu Talent, Files và ứng dụng Flutter. Không thay đổi luồng thanh toán, sổ cái hoặc API thuộc phần Sinh viên A.

## Hạng mục hoàn thành

- Bổ sung quản lý tệp hồ sơ trong Flutter Profile: liệt kê tệp riêng tư, tải avatar/portfolio và mở liên kết tải do API cấp.
- Tái sử dụng signed-upload flow hiện dùng cho Task/Report bằng `PrivateFileRepository`; không đưa Cloudinary URL ra UI hoặc lưu URL vào profile.
- Kiểm tra loại tệp và kích thước ở client trước khi xin upload intent: avatar PNG/JPEG tối đa 5 MiB; portfolio PDF/PNG/JPEG tối đa 10 MiB. API tiếp tục là nguồn xác thực cuối cùng.
- Chỉ cho tải tệp sau khi hồ sơ Talent đã lưu; lỗi đọc file, upload, xác minh/hoàn tất và mở URL được hiển thị rõ.
- Cập nhật hướng dẫn mobile và thêm repository/widget test source cho luồng hồ sơ. Web Profile đã tích hợp `FileAttachmentsPanel`; API file policy, owner authorization, private downloads và kiểm tra kích thước đã có từ các ngày trước.

## Kiểm thử và giới hạn môi trường

- `npm run build` — API TypeScript và Web TypeScript/Vite build thành công.
- `npm run test --workspace @labodc/api -- --runInBand` — 41 suites / 104 tests PASS; bao gồm E2E file policy và phân quyền sẵn có.
- Flutter/Dart/Android SDK không có trong môi trường; mobile analyzer, widget/repository tests và thiết bị chưa chạy. Không ghi nhận chúng là PASS.

---

# Phần Báo cáo Ngày D25 của Sinh viên A — Kiểm định Hợp đồng API Mobile Pha 2 (`Applications`, `Work/Tasks`, `Progress Reports`, `Private Files`) & Đối soát Đồng bộ Đa nền tảng Gate D25 (`GATE_D25_MOBILE_PHASE2_WORK_AND_SYNC`)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Project Lifecycle, Lab Admin, System Admin, Finance/PayOS & Hạ tầng) phối hợp đồng bộ với bản cập nhật Mobile D25 của Sinh viên B (`apps/mobile/lib/features/applications/*`, `apps/mobile/lib/features/work/*`, `apps/mobile/lib/core/files/private_file_repository.dart`)  
> **Đầu ra:** Migration `021_a_mobile_phase2_work_contract_and_sync_d25.sql`, `MobilePhase2SyncService` & `MobilePhase2SyncController` (`apps/api/src/system-admin/*`), Giao diện `MobilePhase2SyncD25Panel.tsx`, Unit Test `mobile-phase2-sync.service.spec.ts` và E2E Test `d25-mobile-phase2-work-and-sync.e2e-spec.ts` Pass 100%.

| Mã Gate / Req | Hạng mục công việc Full-Stack của Sinh viên A (Ngày D25) | Đường dẫn File / Module thuộc quyền sở hữu của A | Trạng thái | Bằng chứng Kiểm thử |
| :--- | :--- | :--- | :---: | :--- |
| **Gate D25** *(DB Migration)* | Thiết kế Migration `021_a_mobile_phase2_work_contract_and_sync_d25.sql` (`cross_platform_sync_checkpoints`) lưu trữ biên bản đối soát đồng bộ Web–Mobile Pha 2 | `apps/api/src/database/migrations/021_a_mobile_phase2_work_contract_and_sync_d25.sql` | **Hoàn thành (100%)** | Đồng bộ chuẩn Schema D3 |
| **Mobile Phase 2 Contract** | Xây dựng API Kiểm định 6 hợp đồng tích hợp Mobile Pha 2 (`GET /api/v1/system-admin/mobile-phase2/contracts`) và Ký Checkpoint Đồng bộ Đa nền tảng (`POST /api/v1/system-admin/mobile-phase2/sync-checkpoints`) | `apps/api/src/system-admin/mobile-phase2-sync.types.ts`<br>`apps/api/src/system-admin/mobile-phase2-sync.service.ts`<br>`apps/api/src/system-admin/mobile-phase2-sync.controller.ts`<br>`apps/web/src/features/system-admin/MobilePhase2SyncD25Panel.tsx` | **Hoàn thành (100%)** | Pass Unit Test `Unit-SYNC-D25-01..02` & E2E `TC-SYNC-D25-01` |
