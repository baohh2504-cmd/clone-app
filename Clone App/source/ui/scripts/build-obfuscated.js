/**
 * Build Script: Obfuscate JavaScript files before packaging
 * Run: node scripts/build-obfuscated.js
 * 
 * Mục đích: Làm rối mã nguồn JS để bảo vệ logic license và chống reverse engineering
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Thư mục nguồn và đích
const SOURCE_DIR = path.join(__dirname, '..');
const BUILD_DIR = path.join(SOURCE_DIR, 'build');

// Các file JS cần obfuscate (quan trọng nhất)
const FILES_TO_OBFUSCATE = [
    'main.js',
    'preload.js',
    'licenseService.js',
    'updateService.js',
    'renderer.js',
    'integrity.js',     // Security Layer 4
    'configCrypto.js',  // Phase 08: Config encryption
    'securityConfig.js',// Add securityConfig
    'backupService.js',
    'unhandled-error-logger.js'
];

// Các file/folder cần copy nguyên (không obfuscate)
const FILES_TO_COPY = [
    'index.html',
    'styles.css',
    'package.json',
    'package-lock.json'
];

const FOLDERS_TO_COPY = [
    'assets',
    'node_modules'
];

// Cấu hình Obfuscation (Electron-Compatible: bảo mật + tương thích Electron)
const OBFUSCATOR_OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: false,           // TẮT - gây conflict với Electron
    debugProtection: false,              // Sẽ enable ở Phase 02
    disableConsoleOutput: false,         // Giữ console để debug
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,                // QUAN TRỌNG: giữ nguyên tên globals
    renameProperties: false,             // QUAN TRỌNG: không đổi tên properties
    reservedNames: [                     // Bảo vệ tên quan trọng của Electron/Node
        'require',
        'exports',
        'module',
        'process',
        'electron',
        'ipcRenderer',
        'ipcMain',
        'contextBridge',
        'BrowserWindow',
        'app',
        'dialog',
        'shell',
        'nativeTheme',
        'powerSaveBlocker'
    ],
    reservedStrings: [],
    selfDefending: false,                // TẮT - có thể gây conflict
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: false,    // TẮT - gây runtime error
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: false,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.5,
    transformObjectKeys: false,          // TẮT - gây lỗi với object properties
    unicodeEscapeSequence: false
};

/**
 * Xóa và tạo lại thư mục build
 */
function prepareBuildDir() {
    console.log('🧹 Dọn dẹp thư mục build...');

    if (fs.existsSync(BUILD_DIR)) {
        fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(BUILD_DIR, { recursive: true });

    console.log('✅ Đã tạo thư mục build/');
}

/**
 * Obfuscate một file JS
 */
function obfuscateFile(filename) {
    const sourcePath = path.join(SOURCE_DIR, filename);
    const destPath = path.join(BUILD_DIR, filename);

    console.log(`🔐 Đang obfuscate: ${filename}...`);

    try {
        const sourceCode = fs.readFileSync(sourcePath, 'utf8');
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, OBFUSCATOR_OPTIONS);

        fs.writeFileSync(destPath, obfuscatedCode.getObfuscatedCode());

        const originalSize = Buffer.byteLength(sourceCode, 'utf8');
        const obfuscatedSize = Buffer.byteLength(obfuscatedCode.getObfuscatedCode(), 'utf8');
        const ratio = ((obfuscatedSize / originalSize) * 100).toFixed(1);

        console.log(`   ✅ ${filename}: ${(originalSize / 1024).toFixed(1)}KB → ${(obfuscatedSize / 1024).toFixed(1)}KB (${ratio}%)`);

    } catch (error) {
        console.error(`   ❌ Lỗi obfuscate ${filename}:`, error.message);
        process.exit(1);
    }
}

/**
 * Copy file nguyên vẹn
 */
function copyFile(filename) {
    const sourcePath = path.join(SOURCE_DIR, filename);
    const destPath = path.join(BUILD_DIR, filename);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`📄 Copied: ${filename}`);
    }
}

/**
 * Copy thư mục đệ quy
 */
function copyFolder(folderName) {
    const sourcePath = path.join(SOURCE_DIR, folderName);
    const destPath = path.join(BUILD_DIR, folderName);

    if (fs.existsSync(sourcePath)) {
        console.log(`📁 Copying folder: ${folderName}...`);
        fs.cpSync(sourcePath, destPath, { recursive: true });
        console.log(`   ✅ Copied: ${folderName}`);
    }
}

/**
 * Main build process
 */
async function build() {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  🛡️  Clone App ULTRA - Obfuscation Build  ');
    console.log('═══════════════════════════════════════════');
    console.log('');

    const startTime = Date.now();

    // Step 1: Chuẩn bị thư mục
    prepareBuildDir();
    console.log('');

    // Step 2: Obfuscate các file JS quan trọng
    console.log('🔐 Obfuscating JavaScript files...');
    for (const file of FILES_TO_OBFUSCATE) {
        obfuscateFile(file);
    }
    console.log('');

    // Step 3: Copy các file không cần obfuscate
    console.log('📄 Copying static files...');
    for (const file of FILES_TO_COPY) {
        copyFile(file);
    }
    console.log('');

    // Step 4: Copy các folders
    console.log('📁 Copying folders...');
    for (const folder of FOLDERS_TO_COPY) {
        copyFolder(folder);
    }

    // Step 4b: Copy launcher - CHỈ COPY EXE (Security: không copy source Python)
    console.log('📁 Setting up launcher (EXE only)...');
    const launcherSource = path.join(SOURCE_DIR, '..', 'launcher');
    const launcherDest = path.join(BUILD_DIR, 'launcher');
    const exeSource = path.join(launcherSource, 'dist', 'runas_launcher.exe');

    // Tạo thư mục launcher và dist
    fs.mkdirSync(path.join(launcherDest, 'dist'), { recursive: true });

    if (fs.existsSync(exeSource)) {
        // Copy file EXE đã compile
        const exeDest = path.join(launcherDest, 'dist', 'runas_launcher.exe');
        fs.copyFileSync(exeSource, exeDest);
        console.log('   ✅ Copied: runas_launcher.exe');

        // Tạo file created_users.json rỗng (app sẽ tạo data khi chạy)
        const usersFile = path.join(launcherDest, 'created_users.json');
        fs.writeFileSync(usersFile, JSON.stringify({ users: [] }, null, 2));
        console.log('   ✅ Created: created_users.json (empty)');

        console.log('   🔒 Security: Python source files NOT included');
    } else {
        console.log('⚠️ Warning: EXE not found at', exeSource);
        console.log('   Run: cd launcher && pyinstaller --onefile runas_launcher.py');
    }
    console.log('');

    // Step 5: Tạo file integrity.json (Security Layer 4)
    console.log('🔐 Generating integrity hashes...');
    const integrity = require('../integrity.js');
    integrity.generateIntegrityFile(BUILD_DIR);
    console.log('');

    // Done
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('═══════════════════════════════════════════');
    console.log(`  ✅ Build complete in ${elapsed}s`);
    console.log(`  📂 Output: ${BUILD_DIR}`);
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('💡 Tiếp theo:');
    console.log('   - Test: cd build && npx electron .');
    console.log('   - Pack: npm run dist:obfuscated');
    console.log('');
}

// Run
build().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
