# Contributing to Clone App

Cảm ơn bạn quan tâm đến Clone App. Mọi đóng góp — bug report, feature request, code fix, doc improvement, hay đơn giản là typo fix — đều được chào đón.

---

## Code of Conduct

Dự án kỳ vọng mọi thành viên cộng đồng ứng xử tôn trọng, xây dựng, và chuyên nghiệp. Không chấp nhận harassment, discrimination, hay hành vi độc hại dưới mọi hình thức. Dự án tham chiếu [Contributor Covenant](https://www.contributor-covenant.org/) làm hướng dẫn chuẩn mực, dù chưa chính thức adopt bản formal.

---

## Ways to Contribute

- **Report bugs** — Mở [issue](https://github.com/baohh2504-cmd/clone-app/issues) với repro steps rõ ràng
- **Request features** — Mở issue mô tả use case, không chỉ mô tả solution
- **Submit PR** — Code fix, doc fix, translation
- **Improve documentation** — README, CONTRIBUTING, SECURITY
- **Test trên môi trường khác** — Windows version, locale, DPI setting khác nhau

---

## Before You Start

| Trước khi | Làm gì |
|-----------|--------|
| Mở issue mới | Search [existing issues](https://github.com/baohh2504-cmd/clone-app/issues) để tránh duplicate |
| Bắt đầu code feature lớn | Mở issue thảo luận trước — tránh PR bị reject vì scope không phù hợp |
| Report bug | Đảm bảo repro được trên branch `master` mới nhất |

---

## Development Setup

### Yêu cầu

| Yêu cầu | Phiên bản |
|---------|-----------|
| Node.js | 20+ |
| Python | 3.11+ |
| PyInstaller | `pip install pyinstaller` |
| Git | Bất kỳ phiên bản ổn định |
| OS | Windows 10/11 x64 (app dùng Windows API, không chạy được trên macOS/Linux) |

### Các bước

```bash
git clone https://github.com/baohh2504-cmd/clone-app.git
cd clone-app
cd "Clone App/source/ui"
npm install
npm start              # dev mode
npm run dist:win       # build full installer
```

### Lưu ý

- App yêu cầu **quyền Administrator** để tạo Windows local user — chạy terminal với Run as Administrator khi test
- Nếu gặp lỗi `app.isPackaged undefined`, thử `unset ELECTRON_RUN_AS_NODE` (đã fix trong code nhưng vẫn note cho môi trường lạ)
- `npm run dist:win` sẽ build cả Python launcher (PyInstaller) và đóng gói NSIS installer

---

## Project Structure

Xem section [Cấu trúc dự án](./README.md#cấu-trúc-dự-án) trong README.

---

## Code Style

| Ngôn ngữ | Quy tắc |
|----------|---------|
| JavaScript | Match style hiện có — 2 spaces indent, không có Prettier config, không enforce |
| Python | PEP 8, 4 spaces indent, không strict |

Nguyên tắc quan trọng:

- **Không thêm dependencies mới** mà không thảo luận trước qua issue — giữ bundle size nhỏ
- Match style xung quanh code hiện tại, không refactor style không liên quan
- Mỗi PR nên tập trung vào 1 vấn đề, không mix formatting với logic change

---

## Commit Messages

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

### Types phổ biến

| Type | Dùng cho |
|------|----------|
| `feat` | Feature mới |
| `fix` | Bug fix |
| `docs` | Documentation |
| `ci` | CI/CD thay đổi |
| `chore` | Maintenance, không đổi production code |
| `refactor` | Refactor không đổi behavior |

### Ví dụ từ git history

```
fix(launcher): support Unicode paths in batch wrapper
docs: add MIT LICENSE and rewrite README for open source
fix(update): match both checksums.txt and SHA256SUMS.txt asset names
ci: add GitHub Actions release and smoke test workflows
refactor: prepare for open source by removing licensing and integrity modules
```

Body optional cho commit nhỏ. Required cho breaking change, kèm `BREAKING CHANGE:` footer.

---

## Pull Request Process

1. **Fork** repo
2. Tạo branch từ `master`:

   ```bash
   git checkout -b fix/issue-number-short-desc
   # hoặc
   git checkout -b feat/short-description
   ```

3. Make changes, test local (`npm start`, build thử nếu touch launcher)
4. Commit theo Conventional Commits
5. Push lên fork, mở PR vs `master` (không phải `main`)
6. Title PR theo convention: `fix(launcher): mô tả ngắn`
7. Body PR mô tả: what changed, why, how tested
8. Link issue liên quan: `Closes #123`
9. Chờ CI pass — smoke test trên `windows-latest` qua [Actions](https://github.com/baohh2504-cmd/clone-app/actions/workflows/ci.yml)
10. Maintainer review — đây là solo project nên response time có thể chậm, nhưng mọi PR đều được xem xét

---

## Testing

Dự án hiện **chưa có unit test framework**. Testing chủ yếu manual:

- **Smoke test**: `npm start` → tạo 1 clone test → verify launch OK
- **Build test**: `npm run dist:win` → chạy installer → verify app chạy bình thường
- Nếu PR fix bug: mô tả repro steps trước/sau fix trong PR body
- Không bắt buộc viết automated test cho PR nhỏ, nhưng welcome nếu có

---

## Areas Needing Help

- Translations — EN README polish, các ngôn ngữ khác
- Screenshots cho README
- Test trên Windows version khác (Win 10 21H2, Win 11 22H2/23H2/24H2)
- Test với app khác ngoài Zalo/CapCut
- SECURITY.md improvements
- Unit test framework setup (nếu bạn có kinh nghiệm với testing trên Electron)

---

## License

Bằng cách submit PR, bạn đồng ý đóng góp dưới MIT License — cùng license với dự án.

---

## English Summary

Contributions are welcome — bug reports, feature requests, code fixes, docs, or tests. The project follows Conventional Commits and uses `master` as the main branch (not `main`). Fork from `master`, create a feature/fix branch, and submit a PR. There is no unit test framework yet; manual smoke testing is sufficient for most PRs. This is a solo-maintained project so review may be slow, but all contributions are appreciated. By submitting a PR, you agree your contributions are licensed under the MIT License.