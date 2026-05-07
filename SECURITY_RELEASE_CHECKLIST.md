# Checklist giảm hiểu nhầm mã độc cho Clone App

Tài liệu này ghi lại các việc nên sửa ở **source gốc** trước khi build/phát hành lại Clone App, để người tải về ít bị Windows Defender, SmartScreen, antivirus hoặc người dùng nghi ngờ là mã độc.

## Mục tiêu

- Giảm cảnh báo bảo mật sai hoặc hiểu nhầm.
- Làm app minh bạch hơn với người dùng.
- Loại bỏ file debug/build dư khỏi installer.
- Tăng độ tin cậy khi app có thao tác hệ thống như tạo profile, chạy app clone, lưu credential, update installer.

## Ưu tiên rất cao

### 1. Ký số toàn bộ file `.exe`

Các file cần ký số trước khi phát hành:

- `Clone App.exe`
- Installer `CloneApp-Setup-*.exe`
- `Uninstall Clone App.exe`
- `resources/launcher/dist/runas_launcher.exe`
- `resources/elevate.exe`

Lý do:

- File `.exe` chưa ký số rất dễ bị Windows SmartScreen cảnh báo.
- App hiện có hành vi nhạy cảm như chạy tiến trình ngoài, tạo profile, dùng quyền hệ thống, nên chữ ký số càng quan trọng.

Việc cần làm:

- Mua hoặc dùng code signing certificate hợp lệ.
- Tích hợp signing vào pipeline build.
- Kiểm tra sau build bằng `Get-AuthenticodeSignature` hoặc công cụ tương đương.

### 2. Bỏ hoặc tắt Anti-VM / Anti-debug trong bản public

Các thành phần nên xem lại:

- `antiVM.jsc`
- `securityConfig.jsc`
- logic `ENABLE_ANTI_VM`
- logic `setupAntiDebug`
- logic phát hiện `vmware`, `virtualbox`, `sandboxie`
- logic đóng DevTools hoặc chống debug quá mạnh

Lý do:

- Anti-VM và anti-debug là dấu hiệu rất phổ biến trong malware.
- Nếu app không bắt buộc cần tính năng này, nên bỏ khỏi bản public.
- Nếu chỉ dùng để bảo vệ license/source, nên thay bằng cơ chế nhẹ hơn và minh bạch hơn.

Khuyến nghị:

- Bản public: tắt hoàn toàn Anti-VM.
- Bản internal/dev: nếu cần thì giữ bằng flag build riêng.
- Không kill app hoặc chặn người dùng chỉ vì chạy trong máy ảo.

### 3. Không lưu password bằng base64/localStorage

Hiện trong renderer có logic dạng `encryptData/decryptData` sử dụng `btoa/atob`. Đây chỉ là base64, không phải mã hóa bảo mật.

Rủi ro:

- Người dùng hoặc reviewer có thể hiểu là app thu/lưu mật khẩu không an toàn.
- Antivirus hoặc security reviewer có thể đánh giá xấu vì app xử lý credential nhưng không dùng cơ chế bảo mật chuẩn.

Việc cần làm:

- Không lưu password/profile credential trong renderer/localStorage.
- Chuyển xử lý credential sang main process hoặc helper native.
- Dùng Windows Credential Manager hoặc DPAPI.
- Nếu lưu proxy có `USER:PASS`, cần mã hóa thật và có thông báo rõ cho người dùng.
- Thêm nút xóa credential đã lưu.
- Trong UI, giải thích rõ app lưu gì, lưu ở đâu, dùng để làm gì.

### 4. Xác thực file update trước khi chạy installer

File liên quan:

- `updateService.js`

Hiện app có cơ chế:

- Check GitHub release.
- Tải asset dạng `CloneApp-Setup-*.exe`.
- Chạy installer sau khi tải.

Việc cần làm:

- Kiểm tra SHA256 của installer trước khi chạy.
- Hoặc kiểm tra chữ ký số của installer trước khi chạy.
- Chỉ chạy installer nếu:
  - URL thuộc host cho phép.
  - Tên file đúng pattern.
  - Hash đúng manifest release.
  - Chữ ký số hợp lệ và signer đúng.

Khuyến nghị thêm:

- Publish file `checksums.txt` hoặc `latest.yml` có hash.
- Hiển thị nguồn tải rõ ràng trong UI.
- Không auto-run installer nếu người dùng chưa xác nhận.

## Ưu tiên cao

### 5. Loại bỏ thư mục `resources/extracted_app` khỏi bản phát hành

Thư mục này đang chứa nhiều file trùng với `resources/app.asar.unpacked`:

- `main.jsc`
- `preload.js`
- `renderer.js`
- `antiVM.jsc`
- `configCrypto.jsc`
- `securityConfig.jsc`
- `licenseService.jsc`
- `launcher/dist/runas_launcher.exe`

Lý do nên bỏ:

- Làm app nặng hơn.
- Làm lộ thêm code/assets không cần thiết.
- Dễ khiến người dùng nghi ngờ vì có nhiều bản duplicate.
- Có thể bị antivirus quét trùng cùng một binary nhiều lần.

Việc cần làm ở source/build:

- Kiểm tra config Electron Builder/Electron Forge.
- Không copy `extracted_app` vào `resources` khi đóng gói.
- Chỉ giữ đúng file app cần chạy trong `app.asar` và `app.asar.unpacked`.
- Sau khi build lại, test app vẫn mở và chạy clone bình thường.

### 6. Loại bỏ file debug/log khỏi installer

Các file không nên đi kèm bản phát hành:

- `resources/alive_probe.txt`
- `resources/launcher_exec_debug.txt`
- `resources/launcher_utility.log`

Lý do:

- Là file debug/probe, không cần cho người dùng cuối.
- Log có thể chứa username, đường dẫn app, đường dẫn profile, proxy hoặc thông tin test.
- Dễ tạo cảm giác app đang âm thầm ghi log nhạy cảm.

Việc cần làm:

- Thêm các file này vào ignore/exclude của build.
- Chỉ tạo log runtime trong thư mục user data, ví dụ `%APPDATA%/Clone App/logs`.
- Có chính sách rotate log và không ghi password/proxy đầy đủ.

### 7. Làm rõ các quyền/hành vi hệ thống trong UI

App có các hành vi nhạy cảm hợp lý với chức năng clone/profile:

- Chạy app dưới profile Windows khác.
- Tạo profile/user.
- Lưu credential.
- Tạo shortcut.
- Bật chạy cùng Windows.
- Kết thúc tiến trình bằng `taskkill`.
- Dùng helper `runas_launcher.exe`.
- Dùng `elevate.exe` khi cần quyền admin.

Việc cần làm:

- Thêm màn hình giới thiệu hoặc permission notice lần đầu mở app.
- Trước khi lưu credential, hiển thị xác nhận rõ ràng.
- Trước khi bật chạy cùng Windows, hiển thị app sẽ thêm startup entry ở đâu.
- Trước khi kill process, hiển thị process nào sẽ bị đóng.
- Không tự bật các quyền/hành vi này nếu người dùng chưa chọn.

## Ưu tiên vừa

### 8. Bundle asset frontend thay vì dùng CDN

Hiện `index.html` dùng:

- `https://cdn.tailwindcss.com`
- `https://fonts.googleapis.com`
- `https://ui-avatars.com`

Rủi ro:

- App desktop mở lên có network request bên ngoài.
- Người dùng/AV có thể nghi ngờ app gọi internet không rõ lý do.
- CDN runtime không phù hợp cho production Electron app.

Việc cần làm:

- Build Tailwind CSS thành file local.
- Bundle font/icon local.
- Không dùng avatar remote nếu không cần.
- Nếu cần mở link hỗ trợ, chỉ mở khi người dùng bấm.

### 9. Thêm Content Security Policy cho Electron renderer

Việc cần làm:

- Thêm CSP trong `index.html`.
- Chặn script remote trong production.
- Hạn chế `connect-src` chỉ tới host update/license cần thiết.
- Không dùng inline script nếu có thể.

Gợi ý hướng cấu hình:

- `default-src 'self'`
- `script-src 'self'`
- `style-src 'self' 'unsafe-inline'` nếu chưa tách được style inline
- `img-src 'self' data:`
- `connect-src 'self' https://api.github.com https://github.com https://objects.githubusercontent.com`

Điều chỉnh lại theo nhu cầu thực tế của app.

### 10. Làm code production minh bạch hơn

Hiện nhiều file `.js` bị obfuscate/minify thành một dòng, kết hợp với `.jsc` bytecode.

Rủi ro:

- Người dùng kỹ thuật không đọc được app đang làm gì.
- Antivirus heuristic có thể đánh giá xấu hơn.
- Khi có sự cố, khó debug và khó chứng minh app sạch.

Khuyến nghị:

- Không obfuscate những phần không cần che giấu.
- Nếu vẫn cần bảo vệ source, chỉ obfuscate phần license/logic nhạy cảm.
- Cân nhắc publish changelog, checksum, privacy note để tăng tin cậy.

### 11. Chuẩn hóa nơi lưu dữ liệu runtime

Không nên ghi file runtime vào thư mục cài đặt `Program Files` hoặc `AppData/Local/Programs`.

Việc cần làm:

- Dữ liệu user/config/log nên lưu ở `%APPDATA%/Clone App` hoặc `%LOCALAPPDATA%/Clone App`.
- Thư mục cài đặt chỉ chứa binary/app resources.
- Không ghi log trực tiếp vào `resources`.

### 12. Kiểm soát logging dữ liệu nhạy cảm

Không ghi vào log:

- Password.
- Proxy đầy đủ có username/password.
- Token/license key.
- Credential command đầy đủ.
- Đường dẫn cá nhân nếu không cần thiết.

Nếu cần log proxy, nên mask:

- `host:port:user:****`

Nếu cần log username, nên cân nhắc chỉ log khi bật debug mode.

## Ưu tiên thấp nhưng nên làm

### 13. Loại bớt locale Electron không dùng

Thư mục `locales` có nhiều file `.pak` ngôn ngữ. Nếu app chỉ phục vụ tiếng Việt/Anh, có thể cấu hình build để giảm dung lượng.

Lưu ý:

- Không bắt buộc.
- Cần test kỹ sau khi loại.

### 14. Kiểm tra lại asset ảnh

Một số ảnh có metadata URL/chứng chỉ/AI provenance. Không nguy hiểm trực tiếp, nhưng có thể làm kết quả scan nhìn rối.

Việc cần làm:

- Optimize/compress lại ảnh production.
- Strip metadata nếu không cần.

## Checklist trước khi release lại

- [ ] Đã bỏ/tắt Anti-VM trong bản public.
- [ ] Đã bỏ/tắt anti-debug quá mạnh trong bản public.
- [ ] Đã ký số toàn bộ `.exe`.
- [ ] Installer update được verify bằng SHA256 hoặc chữ ký số.
- [ ] Không còn `resources/extracted_app` trong bản cài.
- [ ] Không còn file debug/log trong installer.
- [ ] Không lưu password bằng base64/localStorage.
- [ ] Credential được lưu bằng Windows Credential Manager hoặc DPAPI.
- [ ] Tailwind/font/avatar đã được bundle local.
- [ ] Có Content Security Policy cho renderer.
- [ ] Runtime logs/config lưu ở `%APPDATA%` hoặc `%LOCALAPPDATA%`.
- [ ] Log đã mask password/proxy/token.
- [ ] UI có thông báo rõ khi tạo profile, lưu credential, bật startup, kill process, chạy update.
- [ ] Có changelog và checksum công khai cho bản phát hành.
- [ ] Đã scan lại installer bằng Windows Defender/VirusTotal trước khi phát hành.

## Gợi ý file nên exclude khỏi build

Thêm các pattern tương đương vào config build:

```text
resources/extracted_app/**
resources/alive_probe.txt
resources/launcher_exec_debug.txt
resources/launcher_utility.log
**/*.log
**/*debug*.txt
**/*.tmp
```

Nếu source có thư mục build tạm, cũng nên exclude:

```text
dist-debug/**
temp/**
tmp/**
.cache/**
```

## Gợi ý nội dung minh bạch cho người dùng

Nên có một đoạn trong README hoặc màn hình đầu tiên:

```text
Clone App cần tạo và chạy profile Windows riêng để cô lập dữ liệu ứng dụng clone.
Ứng dụng chỉ lưu credential khi bạn bật tùy chọn lưu credential.
Bạn có thể xóa credential đã lưu bất cứ lúc nào trong phần Cài đặt.
Clone App không tự bật chạy cùng Windows nếu bạn chưa bật tùy chọn này.
Cập nhật ứng dụng chỉ được tải từ GitHub release chính thức và được xác thực trước khi cài đặt.
```

## Ghi chú cuối

Những điểm trên không khẳng định app là mã độc. Đây là các yếu tố kỹ thuật dễ làm antivirus hoặc người dùng hiểu nhầm. Sửa các mục ưu tiên cao trước sẽ giúp bản phát hành đáng tin cậy hơn nhiều.
