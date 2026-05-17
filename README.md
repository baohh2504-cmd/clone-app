# Clone App

Ứng dụng desktop Windows giúp chạy nhiều bản clone của cùng một ứng dụng (Zalo, CapCut, v.v.) với profile hoàn toàn tách biệt.

[![CI](https://github.com/baohh2504-cmd/clone-app/actions/workflows/ci.yml/badge.svg)](https://github.com/baohh2504-cmd/clone-app/actions/workflows/ci.yml)
[![Release](https://github.com/baohh2504-cmd/clone-app/actions/workflows/release.yml/badge.svg)](https://github.com/baohh2504-cmd/clone-app/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/baohh2504-cmd/clone-app)](https://github.com/baohh2504-cmd/clone-app/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Screenshots

> Screenshot coming soon — nếu bạn muốn contribute screenshot, mở issue hoặc PR.

---

## Tính năng

- **Multi-clone** — Chạy nhiều instance của cùng 1 app trên cùng máy
- **Isolated profiles** — Mỗi clone có Windows user riêng, tách hoàn toàn dữ liệu và credential
- **Credential Manager** — Lưu mật khẩu Windows user qua Windows Credential Manager (không lưu plaintext)
- **Proxy per clone** — Gắn proxy riêng cho từng clone (modify registry per-user)
- **Auto-update** — Tự kiểm tra phiên bản mới từ GitHub Releases, verify SHA256 trước khi cài
- **Giao diện đơn giản** — Electron UI, quản lý clone bằng vài click
- **Hỗ trợ nhiều app** — Zalo, CapCut, và bất kỳ app nào chạy trên Windows

---

## Yêu cầu hệ thống

| Yêu cầu | Chi tiết |
|----------|----------|
| OS | Windows 10/11 x64 |
| Quyền | Administrator (cần để tạo Windows local user) |
| RAM | Tối thiểu 4 GB (mỗi clone tiêu thụ thêm RAM tùy app gốc) |
| Disk | ~100 MB cho app + dung lượng mỗi clone profile |

Không cần cài thêm runtime (.NET, Python, v.v.) khi dùng bản installer — tất cả đã bundle sẵn.

---

## Cài đặt (End-user)

### 1. Tải về

Vào [Releases](https://github.com/baohh2504-cmd/clone-app/releases/latest), tải file `CloneApp-Setup-<version>.exe`.

### 2. Verify checksum

Tải thêm file `checksums.txt` từ cùng release, sau đó kiểm tra:

```bash
certutil -hashfile CloneApp-Setup-<version>.exe SHA256
```

So sánh kết quả với giá trị trong `checksums.txt`. Nếu khớp, file an toàn.

### 3. Cài đặt

Chạy file `.exe`. Windows SmartScreen có thể hiện cảnh báo vì app chưa có code signing certificate (xem mục [Security Model](#security-model) bên dưới).

Để bỏ qua: click **More info** → **Run anyway**.

---

## Build từ source (Developer)

### Yêu cầu

- Node.js 20+
- Python 3.11+
- PyInstaller (`pip install pyinstaller`)
- Git

### Các bước

```bash
# Clone repo
git clone https://github.com/baohh2504-cmd/clone-app.git
cd clone-app

# Cài dependencies
cd "Clone App/source/ui"
npm install

# Build launcher (Python → exe) + đóng gói Electron installer
npm run dist:win
```

Output: `Clone App/source/ui/release/CloneApp-Setup-<version>.exe`

### Scripts có sẵn

| Script | Mô tả |
|--------|--------|
| `npm start` | Chạy Electron dev mode |
| `npm run build:launcher` | Build Python launcher thành exe (PyInstaller) |
| `npm run dist:win` | Build launcher + đóng gói NSIS installer |

---

## Cấu trúc dự án

```
clone-app/
├── .github/workflows/
│   ├── ci.yml              # CI: lint, smoke test
│   └── release.yml         # Build + publish release khi push tag v*.*.*
├── Clone App/
│   └── source/
│       ├── ui/             # Electron frontend (JS/HTML/CSS)
│       │   ├── main.js     # Main process
│       │   ├── preload.js  # Preload script (context bridge)
│       │   ├── renderer.js # Renderer process
│       │   ├── assets/     # Icons, images
│       │   └── package.json
│       ├── launcher/       # Python backend
│       │   ├── runas_launcher.py   # Core: spawn process as different Windows user
│       │   └── config_crypto.py    # Credential encryption utilities
│       └── ui-data/        # Runtime data (profiles, logs)
├── README.md
└── LICENSE
```

---

## Kiến trúc

```
┌─────────────────────────────────────────────┐
│              Electron UI (Node.js)           │
│  - Quản lý danh sách clone                  │
│  - Cấu hình proxy, credential              │
│  - Auto-update checker                       │
└──────────────────┬──────────────────────────┘
                   │ spawn process
                   ▼
┌─────────────────────────────────────────────┐
│         Python Launcher (PyInstaller exe)    │
│  - CreateProcessWithLogonW / runas          │
│  - Tạo Windows local user                   │
│  - Set proxy registry per-user              │
└─────────────────────────────────────────────┘
```

Electron UI giao tiếp với Python launcher qua child process. Launcher sử dụng Windows API (`CreateProcessWithLogonW`) để spawn app dưới user khác, đảm bảo mỗi clone có profile và registry riêng.

---

## Auto-update

Cơ chế cập nhật tự động:

1. App poll GitHub API: `GET https://api.github.com/repos/baohh2504-cmd/clone-app/releases/latest`
2. So sánh version tag với version hiện tại
3. Nếu có bản mới: tải `.exe` + `checksums.txt`
4. Verify SHA256 checksum trước khi cài
5. Nếu checksum khớp → prompt user cài đặt

Không có telemetry. Chỉ gọi GitHub public API để check version.

---

## Security Model

### Không telemetry

App không gửi bất kỳ dữ liệu nào về server. Không analytics, không tracking. Duy nhất network call là check GitHub Releases API cho auto-update.

### Checksum verification

Mọi bản update đều verify SHA256 trước khi cài. File `checksums.txt` được generate trong CI pipeline và publish cùng release.

### Code signing

Hiện tại app **chưa có code signing certificate** (tradeoff cho dự án open-source miễn phí). Điều này có nghĩa:

- Windows Defender SmartScreen sẽ hiện cảnh báo khi chạy lần đầu
- Đây là hành vi bình thường cho unsigned app, không phải malware warning

### Reproducible build

Mọi release đều build qua GitHub Actions. Bạn có thể verify bằng cách:
- Xem [Actions log](https://github.com/baohh2504-cmd/clone-app/actions/workflows/release.yml) của release tương ứng
- Build từ source với cùng tag và so sánh checksum

### Credential storage

Mật khẩu Windows user được lưu qua Windows Credential Manager (DPAPI), không lưu plaintext trên disk.

---

## Legal Disclaimer / Tuyên bố pháp lý

### Tiếng Việt

- **Clone App** là công cụ độc lập, **KHÔNG** liên kết, được tài trợ, hay chứng nhận bởi bất kỳ bên thứ ba nào (bao gồm nhưng không giới hạn: Zalo, VNG, CapCut, ByteDance).
- Tên các ứng dụng được đề cập chỉ nhằm mục đích mô tả chức năng. Mọi thương hiệu thuộc về chủ sở hữu tương ứng.
- Người dùng **tự chịu trách nhiệm** tuân thủ Điều khoản Dịch vụ (ToS) của ứng dụng gốc khi sử dụng tool này.
- Tool tạo Windows local user (cần quyền Administrator) và modify proxy registry — chỉ sử dụng nếu bạn hiểu và đồng ý với các thay đổi này.
- Phần mềm được cung cấp "nguyên trạng" (AS IS), không có bảo hành dưới bất kỳ hình thức nào. Xem [LICENSE](LICENSE) để biết chi tiết.

### English

- **Clone App** is an independent tool, **NOT** affiliated with, sponsored by, or endorsed by any third-party application (including but not limited to: Zalo, VNG, CapCut, ByteDance).
- Application names are mentioned solely to describe functionality. All trademarks belong to their respective owners.
- Users are **solely responsible** for complying with the Terms of Service of the original applications.
- This tool creates Windows local users (requires Administrator privileges) and modifies per-user proxy registry settings — only use if you understand and consent to these changes.
- Software is provided "AS IS", without warranty of any kind. See [LICENSE](LICENSE) for details.

---

## Contributing

Issues và Pull Requests luôn được chào đón. Nếu bạn tìm thấy bug hoặc có ý tưởng feature mới, hãy [mở issue](https://github.com/baohh2504-cmd/clone-app/issues).

> CONTRIBUTING.md sẽ được bổ sung sau.

---

## License

[MIT](LICENSE) — free for personal and commercial use.

---

## Acknowledgments

- [Electron](https://www.electronjs.org/) — Cross-platform desktop framework
- [electron-builder](https://www.electron.build/) — Packaging and distribution
- [PyInstaller](https://pyinstaller.org/) — Python to standalone executable
- [softprops/action-gh-release](https://github.com/softprops/action-gh-release) — GitHub Release automation

---

## English Summary

**Clone App** is a Windows desktop application that lets you run multiple isolated instances of the same app (Zalo, CapCut, etc.) simultaneously. Each clone runs under a separate Windows user account with its own profile, credentials, and optional proxy configuration.

**Key features:** multi-clone management, isolated Windows user profiles, Windows Credential Manager integration, per-clone proxy, SHA256-verified auto-update from GitHub Releases.

**Tech stack:** Electron 34 (UI) + Python 3.11 (launcher backend using `CreateProcessWithLogonW`).

**Requirements:** Windows 10/11 x64, Administrator privileges.

**Install:** Download the latest `.exe` from [Releases](https://github.com/baohh2504-cmd/clone-app/releases/latest), verify SHA256, run installer.

**Not affiliated with any third-party app.** Use at your own risk. MIT License.
