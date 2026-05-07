/**
 * integrity.js - File Integrity Check Module
 * Phát hiện nếu file JS bị sửa đổi sau khi build (chống crack/patch)
 * 
 * Sử dụng:
 * - Build time: generateIntegrityFile() - tạo integrity.json
 * - Runtime: verifyIntegrity() - kiểm tra hash
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Các file cần kiểm tra (file quan trọng nhất)
const CRITICAL_FILES = [
    'renderer.js',
    'preload.js'
];

// Tên file lưu hash
const INTEGRITY_FILE = 'integrity.json';

/**
 * Tính hash SHA256 của một file
 * @param {string} filePath - Đường dẫn tuyệt đối đến file
 * @returns {string} Hash SHA256 dạng hex
 */
function calculateFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
        console.error(`[Integrity] Không thể đọc file: ${filePath}`, error.message);
        return null;
    }
}

function resolveCriticalFile(baseDir, entry) {
    const candidates = Array.isArray(entry) ? entry : [entry];
    return candidates.find((filename) => fs.existsSync(path.join(baseDir, filename))) || candidates[0];
}

function resolveRuntimeFilePath(baseDir, filename) {
    const directPath = path.join(baseDir, filename);
    const unpackedBaseDir = baseDir.replace(/app\.asar$/, 'app.asar.unpacked');
    const unpackedPath = path.join(unpackedBaseDir, filename);

    if (unpackedBaseDir !== baseDir && fs.existsSync(unpackedPath)) {
        return unpackedPath;
    }

    if (fs.existsSync(directPath)) {
        return directPath;
    }

    if (unpackedBaseDir !== baseDir && fs.existsSync(unpackedPath)) {
        return unpackedPath;
    }

    return directPath;
}

/**
 * Tạo file integrity.json chứa hash của các file quan trọng
 * Gọi trong quá trình build (sau obfuscation)
 * @param {string} baseDir - Thư mục chứa các file JS
 * @returns {object} Object chứa hash của từng file
 */
function generateIntegrityFile(baseDir) {
    const hashes = {};
    const timestamp = new Date().toISOString();

    console.log('[Integrity] Đang tạo file hashes...');

    for (const entry of CRITICAL_FILES) {
        const filename = resolveCriticalFile(baseDir, entry);
        const filePath = path.join(baseDir, filename);
        if (fs.existsSync(filePath)) {
            const hash = calculateFileHash(filePath);
            if (hash) {
                hashes[filename] = hash;
                console.log(`   ✅ ${filename}: ${hash.substring(0, 16)}...`);
            }
        } else {
            console.log(`   ⚠️ ${filename}: File không tồn tại`);
        }
    }

    const integrityData = {
        version: '1.0',
        generated: timestamp,
        files: hashes
    };

    // Ghi file integrity.json
    const integrityPath = path.join(baseDir, INTEGRITY_FILE);
    fs.writeFileSync(integrityPath, JSON.stringify(integrityData, null, 2));
    console.log(`[Integrity] ✅ Đã tạo ${INTEGRITY_FILE}`);

    return integrityData;
}

/**
 * Kiểm tra tính toàn vẹn của các file so với hash đã lưu
 * Gọi khi app khởi động (chỉ trong packaged build)
 * @param {string} baseDir - Thư mục chứa các file JS
 * @returns {object} { valid: boolean, tamperedFiles: string[] }
 */
function verifyIntegrity(baseDir) {
    const integrityPath = resolveRuntimeFilePath(baseDir, INTEGRITY_FILE);

    // Nếu không có file integrity.json -> bỏ qua (dev mode)
    if (!fs.existsSync(integrityPath)) {
        console.log('[Integrity] Không tìm thấy integrity.json, bỏ qua kiểm tra');
        return { valid: true, tamperedFiles: [], skipped: true };
    }

    let integrityData;
    try {
        integrityData = JSON.parse(fs.readFileSync(integrityPath, 'utf8'));
    } catch (error) {
        console.error('[Integrity] Lỗi đọc integrity.json:', error.message);
        return { valid: false, tamperedFiles: ['integrity.json'], error: 'parse_error' };
    }

    const tamperedFiles = [];

    for (const [filename, expectedHash] of Object.entries(integrityData.files)) {
        const filePath = resolveRuntimeFilePath(baseDir, filename);

        if (!fs.existsSync(filePath)) {
            console.warn(`[Integrity] ❌ File bị xóa: ${filename}`);
            tamperedFiles.push(filename);
            continue;
        }

        const currentHash = calculateFileHash(filePath);
        if (currentHash !== expectedHash) {
            console.warn(`[Integrity] ❌ File bị sửa đổi: ${filename}`);
            tamperedFiles.push(filename);
        }
    }

    if (tamperedFiles.length > 0) {
        console.error(`[Integrity] ⚠️ CẢNH BÁO: Phát hiện ${tamperedFiles.length} file bị sửa đổi!`);
        return { valid: false, tamperedFiles };
    }

    // console.log('[Integrity] ✅ Tất cả file đều nguyên vẹn'); // Silence success log
    return { valid: true, tamperedFiles: [] };
}

/**
 * NÂNG CẤP BẢO MẬT: Kiểm tra nội dung file securityConfig.js
 * Ngăn chặn việc sửa ENABLE_NUCLEAR_MODE thành false
 * @param {string} baseDir - Thư mục chứa các file JS
 */
function checkSecurityConfig(baseDir) {
    try {
        const configPath = path.join(baseDir, 'securityConfig.js');
        if (!fs.existsSync(configPath)) return true; // Dev mode might not have it in expected path

        const content = fs.readFileSync(configPath, 'utf8');

        // Kiểm tra xem biến ENABLE_NUCLEAR_MODE có bị sửa thành false không
        // Logic: Nếu tìm thấy 'ENABLE_NUCLEAR_MODE: false' -> BÁO ĐỘNG
        if (content.includes('ENABLE_NUCLEAR_MODE: false') || content.includes('ENABLE_NUCLEAR_MODE:false')) {
             console.error('[Integrity] 🚨 CRITICAL: securityConfig.js has been tampered with (Nuclear Mode disabled)!');
             return false;
        }

        return true;
    } catch (e) {
        console.error('[Integrity] Config check error:', e);
        return false; // Fail closed if we can't read config
    }
}

module.exports = {
    CRITICAL_FILES,
    INTEGRITY_FILE,
    calculateFileHash,
    resolveCriticalFile,
    resolveRuntimeFilePath,
    generateIntegrityFile,
    verifyIntegrity,
    checkSecurityConfig // NEW EXPORT
};
