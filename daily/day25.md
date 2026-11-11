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
