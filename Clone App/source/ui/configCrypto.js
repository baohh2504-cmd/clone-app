/**
 * Config Encryption Module - Clone App ULTRA (Electron)
 * =====================================================
 * Đọc/ghi config đã mã hóa bằng AES-256-CBC.
 * Key sinh từ HWID của máy → mỗi máy có key riêng.
 * 
 * Phase: 08 - Security Hardening
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Constants
const APPDATA_DIR = path.join(process.env.APPDATA || '', 'RunCloneApp');
const CONFIG_FILE = path.join(APPDATA_DIR, 'config.enc');
const LEGACY_CONFIG_NAME = 'created_users.json';
const SALT = Buffer.from('CloneAppULTRA_SecureConfig_v1');

/**
 * Lấy HWID của máy từ nhiều nguồn để tạo unique key.
 * PHẢI KHỚP với Python: get_machine_hwid()
 */
function getMachineHwid() {
    const parts = [];

    // 1. Machine GUID (từ Registry)
    try {
        const result = execSync(
            'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
            { encoding: 'utf-8', timeout: 5000, windowsHide: true }
        );
        const match = result.match(/MachineGuid\s+REG_SZ\s+(\S+)/i);
        if (match) {
            parts.push(match[1]);
        }
    } catch (e) {
        // Ignore
    }

    // 2. Computer Name (fallback)
    parts.push(process.env.COMPUTERNAME || os.hostname() || 'UNKNOWN');

    // 3. Username (extra entropy)
    parts.push(process.env.USERNAME || os.userInfo().username || 'user');

    return parts.join('-');
}

/**
 * Sinh AES-256 key từ HWID.
 * PHẢI KHỚP với Python: derive_key_from_hwid()
 */
function deriveKeyFromHwid(hwid) {
    const data = Buffer.concat([Buffer.from(hwid, 'utf-8'), SALT]);
    return crypto.createHash('sha256').update(data).digest();
}

/**
 * Lấy key mã hóa dựa trên HWID của máy.
 */
function getEncryptionKey() {
    const hwid = getMachineHwid();
    return deriveKeyFromHwid(hwid);
}

/**
 * Mã hóa dictionary thành bytes.
 * Format: [16 bytes IV] + [Encrypted data with PKCS7 padding]
 */
function encryptData(data) {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);

    // Chuyển object sang JSON
    let plaintext = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');

    // PKCS7 padding
    const paddingLength = 16 - (plaintext.length % 16);
    const padding = Buffer.alloc(paddingLength, paddingLength);
    plaintext = Buffer.concat([plaintext, padding]);

    // Encrypt với AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    cipher.setAutoPadding(false); // Đã tự padding
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    return Buffer.concat([iv, encrypted]);
}

/**
 * Giải mã bytes thành dictionary.
 */
function decryptData(encrypted) {
    if (encrypted.length < 32) {
        return null;
    }

    const key = getEncryptionKey();
    const iv = encrypted.slice(0, 16);
    const ciphertext = encrypted.slice(16);

    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        decipher.setAutoPadding(false);
        let plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

        // Remove PKCS7 padding
        const paddingLength = plaintext[plaintext.length - 1];
        if (paddingLength > 16 || paddingLength === 0) {
            return null;
        }
        plaintext = plaintext.slice(0, -paddingLength);

        return JSON.parse(plaintext.toString('utf-8'));
    } catch (e) {
        console.error('[ConfigCrypto] Decrypt error:', e.message);
        return null;
    }
}

/**
 * Tạo thư mục config nếu chưa có.
 */
function ensureConfigDir() {
    if (!fs.existsSync(APPDATA_DIR)) {
        fs.mkdirSync(APPDATA_DIR, { recursive: true });
    }
    return APPDATA_DIR;
}

/**
 * Tìm file config cũ (plaintext) để migrate.
 */
function findLegacyConfig(projectRoot) {
    const legacyPath = path.join(projectRoot, 'launcher', LEGACY_CONFIG_NAME);
    if (fs.existsSync(legacyPath)) {
        return legacyPath;
    }
    return null;
}

/**
 * Đọc config (tự động migrate từ plaintext nếu cần).
 */
function loadConfig(projectRoot) {
    ensureConfigDir();

    // 1. Thử đọc file encrypted mới
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const encrypted = fs.readFileSync(CONFIG_FILE);
            const data = decryptData(encrypted);
            if (data !== null) {
                return data;
            }
        } catch (e) {
            console.error('[ConfigCrypto] Error reading encrypted config:', e.message);
        }
    }

    // 2. Thử migrate từ file cũ
    const legacyPath = findLegacyConfig(projectRoot);
    if (legacyPath) {
        try {
            const rawData = fs.readFileSync(legacyPath, 'utf-8');
            const data = JSON.parse(rawData);

            // Migrate: Save encrypted version
            saveConfig(data);

            // Xóa file cũ sau khi migrate thành công
            try {
                fs.unlinkSync(legacyPath);
                console.log('[ConfigCrypto] Migrated and removed legacy config');
            } catch (e) {
                // Ignore delete error
            }

            return data;
        } catch (e) {
            console.error('[ConfigCrypto] Error migrating legacy config:', e.message);
        }
    }

    // 3. Trả về config rỗng
    return { users: [], apps: [] };
}

/**
 * Lưu config (đã mã hóa).
 */
function saveConfig(data) {
    try {
        ensureConfigDir();
        const encrypted = encryptData(data);
        fs.writeFileSync(CONFIG_FILE, encrypted);
        return true;
    } catch (e) {
        console.error('[ConfigCrypto] Error saving config:', e.message);
        return false;
    }
}

/**
 * Trả về đường dẫn file config hiện tại.
 */
function getConfigPath() {
    return CONFIG_FILE;
}

module.exports = {
    loadConfig,
    saveConfig,
    getConfigPath,
    getMachineHwid,
    APPDATA_DIR,
    CONFIG_FILE
};
