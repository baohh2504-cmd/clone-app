# Phase 02: Settings & Detail Views
Status: ⬜ Pending

## Objective
Áp dụng theme Cyber Grid cho các trang con: Settings, Add Clone View, Create User View, Group Manager Modal.
Tập trung vào tính nhất quán (Consistency) và trải nghiệm "Pro".

## Requirements
- [ ] **Views Container:** Đảm bảo tất cả views con đều nằm trong background grid.
- [ ] **Inputs & Forms:** Style lại input field (nền tối, border mờ, focus neon).
- [ ] **Modals:** Chuyển sang style Glassmorphism (Kính mờ).
- [ ] **Group Manager:** Card style cho Group Items.
- [ ] **Settings Page:** Layout lại cho gọn gàng, hiện đại hơn.

## Implementation Steps
1. [ ] **Global Input Styles:** Update CSS cho `input`, `select`, `textarea` trong `index.html`.
2. [ ] **Modal Styles:** Update CSS cho `.modal-content`.
3. [ ] **Add Clone View:** Style lại form nhập liệu.
4. [ ] **Group Manager:** Update `renderGroupList` trong `renderer.js` để dùng card style mới.
5. [ ] **Settings View:** Tinh chỉnh layout.

## Files to Modify
- `d:\Clone App_ULTRA\Clone App\source\ui\index.html` (CSS styles)
- `d:\Clone App_ULTRA\Clone App\source\ui\renderer.js` (Modal & Group Render logic)

## Test Criteria
- [ ] Input fields trông hiện đại, dễ nhìn trên nền tối.
- [ ] Modal nổi bật nhưng không làm rối mắt.
- [ ] Group list đẹp, đồng bộ với dashboard card.
