/**
 * antiVM.js - Anti-Virtual Machine Detection Module
 * Clone App ULTRA - Phase 10 Security Hardening
 * =====================================================
 * Phát hiện nếu app đang chạy trong môi trường ảo hóa (VM/VPS/Sandbox).
 * Mục đích: Chống farming hàng loạt trên VPS và chống phân tích trong Sandbox.
 */

const { execSync, spawn } = require('child_process');
const os = require('os');

// --- Configuration ---
const SecurityConfig = require('./securityConfig');
const VM_DETECTION_ENABLED = SecurityConfig.shouldRun('ENABLE_ANTI_VM'); // Config kiểm soát
const STRICT_MODE = false;         // false = chỉ block khi chắc chắn là VM (≥4 indicators)

// --- Known VM Artifacts ---
const VM_PROCESS_NAMES = [
    'vmtoolsd', 'vmwaretray', 'vmwareuser',     // VMware
    'vboxservice', 'vboxtray',                   // VirtualBox
    'xenservice',                                // Xen
    'qemu-ga',                                   // QEMU/KVM
    'joeboxserver', 'joeboxcontrol',             // Joe Sandbox
    'sandboxie', 'sbiectrl', 'sbiesvc',          // Sandboxie
    'prl_tools', 'prl_cc'                        // Parallels
];

const VM_DRIVER_KEYWORDS = [
    'vbox', 'vmware', 'virtualbox', 'qemu', 'xen', 'hyperv', 'parallels', 'vm'
];

const VM_BIOS_KEYWORDS = [
    'virtualbox', 'vmware', 'qemu', 'xen', 'microsoft corporation', 'parallels'
];

/**
 * Kiểm tra thông số phần cứng cơ bản.
 * VM thường có: ít CPU, ít RAM, Generic GPU.
 * @returns {{ suspicious: boolean, reasons: string[] }}
 */
function checkHardwareSpecs() {
    const reasons = [];
    const cpuCores = os.cpus().length;
    const totalRamGB = os.totalmem() / (1024 * 1024 * 1024);

    // Check CPU cores (VM thường có 1-2 cores)
    if (cpuCores < 2) {
        reasons.push(`CPU chỉ có ${cpuCores} core (thường là VM)`);
    }

    // Check RAM (VM thường có ít RAM)
    if (totalRamGB < 2) {
        reasons.push(`RAM chỉ có ${totalRamGB.toFixed(1)} GB (thường là VM)`);
    }

    // Check CPU model for VM keywords
    const cpuModel = os.cpus()[0]?.model?.toLowerCase() || '';
    if (cpuModel.includes('qemu') || cpuModel.includes('virtual')) {
        reasons.push(`CPU model chứa keyword VM: ${cpuModel}`);
    }

    return {
        suspicious: reasons.length > 0,
        reasons
    };
}

/**
 * Kiểm tra các process đặc trưng của VM đang chạy.
 * @returns {Promise<{ suspicious: boolean, reasons: string[] }>}
 */
async function checkVMProcesses() {
    return new Promise((resolve) => {
        const reasons = [];

        try {
            // Dùng tasklist để lấy danh sách process
            const output = execSync('tasklist /FO CSV /NH', {
                encoding: 'utf-8',
                timeout: 5000,
                windowsHide: true
            });

            const lowerOutput = output.toLowerCase();
            for (const vmProcess of VM_PROCESS_NAMES) {
                if (lowerOutput.includes(vmProcess.toLowerCase())) {
                    reasons.push(`Phát hiện process VM: ${vmProcess}`);
                }
            }
        } catch (e) {
            // Ignore error - có thể không có quyền
        }

        resolve({
            suspicious: reasons.length > 0,
            reasons
        });
    });
}

/**
 * Kiểm tra drivers/devices có artifact của VM không.
 * @returns {Promise<{ suspicious: boolean, reasons: string[] }>}
 */
async function checkVMDrivers() {
    return new Promise((resolve) => {
        const reasons = [];

        try {
            // Check PnP devices
            const output = execSync(
                'powershell -NoProfile -Command "Get-PnpDevice | Select-Object -ExpandProperty FriendlyName"',
                { encoding: 'utf-8', timeout: 10000, windowsHide: true }
            );

            const lowerOutput = output.toLowerCase();
            for (const keyword of VM_DRIVER_KEYWORDS) {
                if (lowerOutput.includes(keyword)) {
                    reasons.push(`Phát hiện driver VM: ${keyword}`);
                    break; // Only report once
                }
            }
        } catch (e) {
            // Ignore - có thể không có quyền PowerShell
        }

        resolve({
            suspicious: reasons.length > 0,
            reasons
        });
    });
}

/**
 * Kiểm tra BIOS/Manufacturer info.
 * @returns {Promise<{ suspicious: boolean, reasons: string[] }>}
 */
async function checkBIOSInfo() {
    return new Promise((resolve) => {
        const reasons = [];

        try {
            // Windows 11 removed wmic, use PowerShell instead
            const output = execSync(
                'powershell -NoProfile -Command "Get-CimInstance Win32_BIOS | Select-Object Manufacturer,SerialNumber,SMBIOSBIOSVersion | Format-List"',
                { encoding: 'utf-8', timeout: 5000, windowsHide: true }
            );

            const lowerOutput = output.toLowerCase();
            for (const keyword of VM_BIOS_KEYWORDS) {
                if (lowerOutput.includes(keyword)) {
                    reasons.push(`BIOS chứa keyword VM: ${keyword}`);
                    break;
                }
            }

            // NOTE: Removed BIOS serial check - too many false positives on real PCs
            // Many real motherboards have "0" or "To Be Filled" as serial
        } catch (e) {
            // Ignore
        }

        resolve({
            suspicious: reasons.length > 0,
            reasons
        });
    });
}

/**
 * Kiểm tra MAC Address (VM thường có MAC prefix đặc biệt).
 * @returns {{ suspicious: boolean, reasons: string[] }}
 */
function checkMACAddress() {
    const reasons = [];
    const interfaces = os.networkInterfaces();

    // Known VM MAC prefixes (first 3 octets)
    const vmMacPrefixes = [
        '00:0c:29', '00:50:56', '00:05:69',  // VMware
        '08:00:27', '0a:00:27',               // VirtualBox
        '00:1c:42',                            // Parallels
        '00:16:3e',                            // Xen
        '52:54:00',                            // QEMU/KVM
        '00:15:5d'                             // Hyper-V
    ];

    for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs || []) {
            if (addr.mac && addr.mac !== '00:00:00:00:00:00') {
                const macPrefix = addr.mac.toLowerCase().substring(0, 8);
                if (vmMacPrefixes.includes(macPrefix)) {
                    reasons.push(`MAC Address ${addr.mac} thuộc vendor VM`);
                }
            }
        }
    }

    return {
        suspicious: reasons.length > 0,
        reasons
    };
}

/**
 * Kiểm tra timing attack (debugger làm chậm code).
 * @returns {{ suspicious: boolean, reasons: string[] }}
 */
function checkTimingAttack() {
    const reasons = [];
    const iterations = 1000;

    const start = process.hrtime.bigint();

    // Một vòng lặp đơn giản
    let sum = 0;
    for (let i = 0; i < iterations; i++) {
        sum += Math.random();
    }

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    // Nếu 1000 iterations mất > 100ms -> có debugger
    if (durationMs > 100) {
        reasons.push(`Timing attack detected: ${durationMs.toFixed(2)}ms cho ${iterations} iterations`);
    }

    return {
        suspicious: reasons.length > 0,
        reasons,
        _durationMs: durationMs // For debugging
    };
}

/**
 * Master function: Chạy tất cả các check và tổng hợp kết quả.
 * @returns {Promise<{ isVM: boolean, confidence: string, reasons: string[] }>}
 */
async function detectVirtualMachine() {
    if (!VM_DETECTION_ENABLED) {
        return { isVM: false, confidence: 'disabled', reasons: [] };
    }

    const allReasons = [];
    let suspiciousCount = 0;
    const totalChecks = 6;

    // 1. Hardware specs (sync)
    const hwCheck = checkHardwareSpecs();
    if (hwCheck.suspicious) {
        suspiciousCount++;
        allReasons.push(...hwCheck.reasons);
    }

    // 2. MAC Address (sync)
    const macCheck = checkMACAddress();
    if (macCheck.suspicious) {
        suspiciousCount++;
        allReasons.push(...macCheck.reasons);
    }

    // 3. Timing (sync)
    const timingCheck = checkTimingAttack();
    if (timingCheck.suspicious) {
        suspiciousCount++;
        allReasons.push(...timingCheck.reasons);
    }

    // 4. Processes (async)
    const processCheck = await checkVMProcesses();
    if (processCheck.suspicious) {
        suspiciousCount++;
        allReasons.push(...processCheck.reasons);
    }

    // 5. Drivers (async)
    const driverCheck = await checkVMDrivers();
    if (driverCheck.suspicious) {
        suspiciousCount++;
        allReasons.push(...driverCheck.reasons);
    }

    // 6. BIOS (async)
    const biosCheck = await checkBIOSInfo();
    if (biosCheck.suspicious) {
        suspiciousCount++;
        allReasons.push(...biosCheck.reasons);
    }

    // Đánh giá confidence
    let confidence = 'low';
    let isVM = false;

    // Cần ≥4 indicators để chắc chắn là VM (giảm false positive)
    if (suspiciousCount >= 4) {
        confidence = 'high';
        isVM = true;
    } else if (suspiciousCount >= 3) {
        confidence = 'medium';
        isVM = STRICT_MODE; // Only block if strict mode = true
    } else {
        confidence = 'low';
        isVM = false; // 1-2 indicators không đủ để kết luận
    }

    return {
        isVM,
        confidence,
        suspiciousCount,
        totalChecks,
        reasons: allReasons
    };
}

/**
 * Wrapper function để gọi từ main process.
 * Trả về object đơn giản để xử lý.
 */
async function runAntiVMCheck() {
    try {
        const result = await detectVirtualMachine();

        if (result.isVM) {
            console.log('[AntiVM] ⚠️ VM DETECTED!');
            console.log('[AntiVM] Confidence:', result.confidence);
            console.log('[AntiVM] Reasons:', result.reasons.join(', '));
        } else {
            console.log('[AntiVM] ✅ Environment OK');
        }

        return result;
    } catch (error) {
        console.error('[AntiVM] Error during check:', error.message);
        // Fail open - nếu check bị lỗi thì cho qua
        return { isVM: false, confidence: 'error', reasons: ['Check failed'] };
    }
}

module.exports = {
    detectVirtualMachine,
    runAntiVMCheck,
    // Export individual checks for testing
    checkHardwareSpecs,
    checkVMProcesses,
    checkVMDrivers,
    checkBIOSInfo,
    checkMACAddress,
    checkTimingAttack
};
