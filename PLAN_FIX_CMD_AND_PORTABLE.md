# Kế hoạch sửa CMD/PowerShell popup và bản tải về dùng được trên máy khác

## Mục tiêu

- Khi sử dụng app: không hiện cửa sổ CMD/PowerShell.
- Bản cài đặt tải về chạy được trên máy khác, không phụ thuộc máy dev, không phụ thuộc Python cài sẵn.

## Hiện trạng đã kiểm tra

| Vấn đề | Nguyên nhân chính | File liên quan |
| --- | --- | --- |
| CMD nhảy khi chạy app | `CreateProcessWithLogonW` đang dùng `CREATE_NEW_CONSOLE_FLAG` | `Clone App/source/launcher/runas_launcher.py` |
| CMD nhảy khi chạy clone | Launcher tạo và chạy wrapper `.bat` (`proxy_launch_*.bat`) | `Clone App/source/launcher/runas_launcher.py` |
| Fallback vẫn mở CMD | `runas.exe` fallback dùng `subprocess.CREATE_NEW_CONSOLE` | `Clone App/source/launcher/runas_launcher.py` |
| Máy khác không chạy | Build có thể thiếu `runas_launcher.exe`, rồi fallback sang `python` | `Clone App/source/ui/main.js`, `Clone App/source/ui/scripts/build-obfuscated.js` |
| Config không copy được giữa máy | `config.enc` mã hóa theo HWID máy | `Clone App/source/ui/configCrypto.js`, `Clone App/source/launcher/config_crypto.py` |

## Phạm vi sửa dự kiến

| File | Sửa gì | Lý do |
| --- | --- | --- |
| `Clone App/source/launcher/runas_launcher.py` | Đổi cơ chế tạo process sang hidden/no console | Chặn CMD popup khi clone/chạy app |
| `Clone App/source/launcher/runas_launcher.py` | Hạn chế hoặc bỏ wrapper `.bat` khi không cần thiết | Tránh CMD flash từ batch file |
| `Clone App/source/ui/main.js` | Đảm bảo packaged app chỉ dùng `runas_launcher.exe` hợp lệ | Không phụ thuộc Python trên máy khách |
| `Clone App/source/ui/scripts/build-obfuscated.js` | Build fail nếu thiếu `runas_launcher.exe` | Không tạo installer lỗi |
| `Clone App/source/ui/package.json` | Thêm/điều chỉnh script build launcher nếu cần | Đóng gói đủ dependency |

## Kế hoạch triển khai

1. Phân tích impact trước khi sửa các symbol chính trong `runas_launcher.py` và `main.js`.
2. Sửa launcher Python để không dùng `CREATE_NEW_CONSOLE_FLAG` khi gọi `CreateProcessWithLogonW`.
3. Sửa fallback `runas.exe` để tránh mở console nếu UI đã có password/credential.
4. Bỏ wrapper `.bat` ở luồng không proxy; với proxy thì chạy wrapper theo cơ chế hidden hoặc thay bằng xử lý trực tiếp trong Python.
5. Sửa build để bắt buộc có `launcher/dist/runas_launcher.exe`; thiếu file này thì build dừng ngay.
6. Kiểm tra lại fallback Python trong `main.js`; bản packaged không được yêu cầu máy khách cài Python.
7. Xem lại config HWID: giữ nếu chỉ dùng fresh install, hoặc thêm migration/export nếu cần copy dữ liệu giữa máy.

## Checklist kiểm thử

| Test | Kỳ vọng |
| --- | --- |
| Clone app từ UI | Không hiện CMD/PowerShell |
| Chạy clone từ UI | Không hiện CMD/PowerShell |
| Chạy clone bằng shortcut | Không hiện CMD/PowerShell ngoài dialog nhập mật khẩu nếu cần |
| Chạy với proxy | App mở đúng, không sinh popup console |
| Build khi thiếu `runas_launcher.exe` | Build fail rõ lỗi |
| Cài trên máy sạch không có Python | App mở và clone/chạy được |
| Cài trên máy khác Windows 10/11 | Không phụ thuộc dữ liệu máy dev |

## Rủi ro và lưu ý

- Nếu target app cần console thật thì hidden process có thể ảnh hưởng, nhưng luồng hiện tại chủ yếu chạy app GUI.
- Nếu bỏ `.bat` proxy wrapper, cần test kỹ proxy registry/credential theo từng user.
- `config.enc` đang khóa theo máy; không nên copy nguyên dữ liệu từ máy anh sang máy khác nếu chưa có migration.
- Sau sửa cần build installer mới và test trên máy sạch trước khi phát hành.
