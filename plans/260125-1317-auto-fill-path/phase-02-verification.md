# Phase 02: Verification
Status: ⬜ Pending

## Test Cases

### 1. Existing User with Path
- **Setup**: Ensure `runas_launcher.py` or `.json` has a user "TestUser" with `storagePath="D:\\Test"`.
- **Action**: Select "TestUser" in dropdown.
- **Expected**: "Storage Path" input changes to "D:\\Test".

### 2. User without Path
- **Setup**: User "NewUser" with empty storage path.
- **Action**: Select "NewUser".
- **Expected**: Input should be empty or default.

### 3. Manual Override
- **Action**: Select "TestUser" (Auto-fills "D:\\Test").
- **Action**: Manually change input to "E:\\NewPath".
- **Verification**: Check if backend received update (via logs or `created_users.json`).
- **Action**: Switch to another user then back to "TestUser".
- **Expected**: Should now auto-fill "E:\\NewPath".
