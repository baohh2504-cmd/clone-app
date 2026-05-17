# Security Policy

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.9.x   | Security fixes only |
| < 0.9   | Not supported       |

Đây là solo project nên không có backport cho các version cũ. Nên luôn dùng version mới nhất.

---

## Reporting a Vulnerability

**KHÔNG báo lỗi security qua GitHub Issues công khai.**

Cách báo: mở GitHub Security Advisory private — [New Advisory](https://github.com/baohh2504-cmd/clone-app/security/advisories/new).

Response time: best-effort vì solo project. Mục tiêu acknowledge trong vòng **7 ngày**. Maintainer sẽ phản hồi trực tiếp trên thread Advisory.

---

## What to Include in Report

- Version bị ảnh hưởng (xem trong app hoặc file `package.json`)
- Các bước reproduce chi tiết
- Expected behavior vs actual behavior
- Impact assessment (ai bị ảnh hưởng, mức độ nghiêm trọng)
- Screenshot hoặc log nếu có

---

## What NOT to Include

- Private credential (password, token, key) — không gửi kèm
- Malware sample hoặc exploit payload thực tế — chỉ mô tả kỹ thuật

---

## Disclosure Policy

- **Coordinated disclosure**: fix được phát hành trước, sau đó mới public disclosure.
- Reporter có thể chọn: credit trong release notes hoặc anonymous. Nếu reporter đồng ý, maintainer sẽ ghi nhận tên trong Security Advisory và changelog.
- Không public disclose trước khi fix available, trừ khi đã qua 90 ngày kể từ báo cáo.

---

## Out of Scope

Các trường hợp sau sẽ không được xử lý như security vulnerability:

- Issues yêu cầu attacker đã có **Administrator access** trên máy đích — Clone App vốn cần Admin để chạy
- Self-XSS hoặc social engineering
- Vulnerabilities trong **dependencies** — báo upstream trực tiếp, hoặc mở PR bump version
- Theoretical issues **không có repro steps**
- Issues trong tools không phải Clone App (Electron, Node.js, Python core, Windows)

---

## Security Practices

| Practice | Chi tiết |
|----------|----------|
| SHA256 checksum | Mọi release có checksum verify |
| Reproducible build | GitHub Actions workflow (`.github/workflows/release.yml`) |
| Credential storage | Windows Credential Manager (DPAPI), không lưu plaintext |
| No telemetry | Không thu thập dữ liệu user |
| Network calls | Chỉ GitHub Releases API, không có call khác |
| Dependency update | Dependabot bật, weekly scan (npm + github-actions) |

---

## English Summary

This project follows coordinated disclosure. Report security vulnerabilities privately via [GitHub Security Advisory](https://github.com/baohh2504-cmd/clone-app/security/advisories/new) — do not use public GitHub Issues. Only the latest 0.9.x version receives security fixes; older versions are not supported. Response time is best-effort (solo maintainer, target acknowledgment within 7 days). Out-of-scope items include issues requiring prior Admin access, self-XSS, dependency vulnerabilities (report upstream), theoretical issues without reproduction steps, and bugs in third-party tools. Security practices include SHA256 checksum verification for all releases, reproducible builds via GitHub Actions, DPAPI-backed credential storage, no telemetry, and Dependabot-enabled dependency scanning.