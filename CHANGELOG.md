# Changelog

## [Unreleased]

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
