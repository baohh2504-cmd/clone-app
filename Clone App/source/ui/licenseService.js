/**
 * licenseService.js - Trạng thái toàn quyền cho Clone App ULTRA
 * Giữ API tương thích cũ nhưng không yêu cầu kích hoạt hoặc xác thực online
 */

const TIER_LIMITS = {
    free: { maxClones: Infinity, batchCreate: true, name: 'Toàn quyền' },
    plus: { maxClones: 20, batchCreate: true, name: 'Plus' },
    ultra: { maxClones: Infinity, batchCreate: true, name: 'Ultra' }
};

const FREE_FULL_STATUS = {
    activated: true,
    valid: true,
    tier: 'free',
    tierName: 'Toàn quyền',
    limits: TIER_LIMITS.free,
    features: {
        batch: true,
        proxy: true
    }
};

async function verifyLicense() {
    return { ...FREE_FULL_STATUS };
}

function getLicenseStatus() {
    return { ...FREE_FULL_STATUS };
}

async function fetchLaunchConfig(appType = 'zalo') {
    return {
        success: true,
        offline: true,
        config: {
            launcher: 'runas_launcher.exe',
            launcher_fallback: 'runas_launcher.py',
            args_schema: {
                required: ['program_path', 'username'],
                optional: ['domain', 'exe_name', 'proxy']
            },
            arg_mapping: {
                program_path: { position: 0, type: 'positional' },
                username: { flag: '--username', type: 'named' },
                domain: { flag: '--domain', type: 'named' },
                exe_name: { flag: '--exe-name', type: 'named' },
                proxy: { flag: '--proxy', type: 'named' }
            },
            version: 'full-access-local',
            is_bypass: true
        },
        tier: FREE_FULL_STATUS.tier,
        features: FREE_FULL_STATUS.features
    };
}

module.exports = {
    verifyLicense,
    getLicenseStatus,
    fetchLaunchConfig,
    TIER_LIMITS
};
