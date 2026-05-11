# Changelog

## [0.7.0] - 2026-05-12

### Fixed
- **Clone folder validation**: Added frontend validation for clone target directory before sending to backend.
- **Clone folder persistence**: Browse folder button now saves selected directory to settings so it persists across sessions.
- **Clone folder reset**: Reset form now pre-fills clone target from saved settings instead of clearing it.
- **Profile switch override**: Switching profiles no longer overwrites a manually selected clone folder.
- **Shortcut payload**: Added `displayName` and `name` to shortcut creation payload for consistent naming and cleanup.

---

## [0.6.0] - 2026-05-12

### Fixed
- **Shortcut Unicode**: VBS files now written in UTF-16LE + BOM so Windows Script Host reads Unicode paths (Vietnamese characters) correctly.
- **Shortcut Batch**: Added `chcp 65001` to BAT files so CMD handles UTF-8 paths properly.
- **Shortcut Payload**: `displayName` and `name` now passed to shortcut creation, ensuring consistent naming and proper cleanup.
- **Cleanup**: HTA password dialog files now deleted when removing a clone app.

---

## [0.5.0] - 2026-05-11

### Fixed
- **Shortcut**: Desktop shortcut now correctly uses compiled `runas_launcher.exe` when available, instead of always calling `python`. Shortcuts work properly in packaged builds.
- **Auto Profile**: Changed default auto-generated password from hardcoded value to `12345678` for automatic profile creation.

---

## [0.4.0] - 2026-05-10

### Added
- **Password Dialog**: New Modern Dark Theme UI for shortcut authentication.
- **Localization**: Improved Vietnamese language support in password dialog (fixed encoding issues).
- **Full Access Mode**: App runs locally with all core features unlocked.

### Changed
- **UI**: Updated Password Dialog dimensions for better compactness and layout.
- **Internal**: Switched Password Dialog rendering from basic HTML to HTA with IE11 edge mode for better CSS support.
- **Cleanup**: Removed legacy server/admin artifacts, debug logs, runtime cache, and old internal metadata.

### Fixed
- Fixed issue where Vietnamese characters were displayed incorrectly in HTA dialogs.
- Fixed issue where `\ufeff` characters were visible in the interface.
