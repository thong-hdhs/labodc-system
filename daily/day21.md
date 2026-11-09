# Ngày D21 — Flutter nền tảng, đăng nhập và hồ sơ (Sinh viên B)

> **Phân công chuẩn:** `implementation-plan/07-phan-cong-tung-ngay.md` — Flutter base app, secure login/profile, adapter API và UX error states.
> **Requirement:** `REQ-MOB-01`. Android là nền tảng trong kế hoạch; Q-B12 vẫn chờ PO xác nhận nền tảng nghiệm thu/phát hành.

## Đã triển khai trong checkout

- Tạo Flutter client source tại `apps/mobile` với `ApiClient`, adapter auth/talent và các model có kiểm tra cấu trúc response.
- Login giới hạn client vào `TALENT`/`TALENT_LEADER`, không lưu mật khẩu; access/refresh tokens và account display data được ghi bằng `flutter_secure_storage`.
- Khôi phục phiên chỉ sau khi `GET /auth/me` xác nhận `sub`, role và status khớp dữ liệu lưu. Unauthorized credentials bị xóa; lỗi mạng hiển thị và có thể thử lại.
- Hồ sơ tải/cập nhật qua API Talent hiện có; có loading, validation, success/error state và pull-to-refresh.
- Thêm hướng dẫn setup/run trong [README mobile](../apps/mobile/README.md) và bỏ qua artefact Flutter local/build trong `.gitignore`.

## Chưa xác minh / giới hạn

- Flutter/Dart SDK và Android SDK không có trong môi trường thực thi; vì vậy chưa thể chạy `flutter pub get`, `flutter analyze`, `flutter test` hoặc build/cài lên emulator/device.
- Android runner files chưa được sinh bởi `flutter create`; README ghi rõ bước bootstrap sau khi có SDK. Không tuyên bố mobile build/device test đã pass.
- API hiện chưa có refresh-token endpoint; app lưu refresh token an toàn nhưng chưa thể dùng để gia hạn access token. Khi access token hết hạn, session local bị xóa và Talent cần đăng nhập lại.
- API logout hiện được gọi, nhưng hiệu lực revoke server-side cần được xác nhận/kiểm thử riêng với owner Auth; app luôn xóa credential local trước khi gửi logout.
- Kết quả yêu cầu latency `<300 ms` từ ADR-04 chưa được đo; project repository hiện không phải Elasticsearch-backed trong lát cắt B. A sở hữu Elasticsearch/index consistency và cần cung cấp benchmark/contract khi tích hợp.

## Kiểm thử trong ngày

- API/Web builds và API discovery/application E2E được xác minh cùng D22; chi tiết ở [day22.md](./day22.md).
- Flutter widget/repository tests đã được thêm nhưng chưa chạy do thiếu SDK. Đây là test source, không phải bằng chứng pass.
