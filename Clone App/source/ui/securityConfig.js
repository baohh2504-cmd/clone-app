/**
 * clone-app-ultra/securityConfig.js
 * 
 * Centralized Configuration for Security Layers
 * Phase 10: Stabilization & Control
 * 
 * Mục đích: Cho phép bật/tắt nhanh các tính năng bảo mật để debug/test
 * mà không cần sửa nhiều file.
 */

const isPackaged = require('electron').app.isPackaged;

const SecurityConfig = {
    // --- Master Switches (ON/OFF) ---

    // 1. Anti-VM Detection (Phase 10)
    // false = luôn cho qua (dùng khi nghi ngờ false positive)
    ENABLE_ANTI_VM: false,

    // 2. Server-Side Logic (Phase 10)
    // false = dùng local offline config (không gọi server get_launch_config)
    ENABLE_SERVER_LOGIC: false,

    // 3. Integrity Checks (Phase 04)
    // false = bỏ qua check hash file khi khởi động
    ENABLE_INTEGRITY: false,

    // 4. Destructive security mode
    // false = Disable completely (Full Access safe mode)
    ENABLE_NUCLEAR_MODE: false,

    // --- Environment Control ---

    // Chỉ kích hoạt bảo mật khi App đã đóng gói (Production)
    // true: Dev mode (npm start) sẽ TẮT hết bảo mật -> Dễ debug logic app
    // false: Dev mode cũng chạy bảo mật -> Dễ debug tính năng bảo mật
    SECURITY_ONLY_IN_PROD: false,

    /**
     * Helper check: Có nên chạy tính năng này không?
     * Logic: (Feature ON) AND ( (In Prod) OR (Security allowed in Dev) )
     */
    shouldRun(featureName) {
        // Nếu feature này bị tắt cứng -> false
        if (this[featureName] === false) return false;

        // Nếu chỉ chạy ở Prod mà đang ở Dev -> false
        if (this.SECURITY_ONLY_IN_PROD && !isPackaged) return false;

        return true;
    }
};

module.exports = SecurityConfig;
