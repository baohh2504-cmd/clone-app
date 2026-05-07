/**
 * Bytenode Compiler Script - Clone App ULTRA
 * ===========================================
 * Compile obfuscated JS files to V8 bytecode using Electron
 * 
 * Phase: 09 - Security Hardening (Bytenode)
 * 
 * Usage: npm run compile:bytenode
 * 
 * Flow: source/*.js → build/*.js (obfuscated) → build/*.jsc (bytecode)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const integrity = require('../integrity.js');

// Paths
const BUILD_DIR = path.join(__dirname, '..', 'build');
const HELPER_SCRIPT = path.join(__dirname, 'compile-helper.js');

// Files to compile to bytecode (main app files)
const FILES_TO_COMPILE = [
    'main.js',
    'licenseService.js',
    'configCrypto.js',
    'securityConfig.js',// Add securityConfig
    'backupService.js',
    'unhandled-error-logger.js'
];

// Files that need special handling (preload/renderer stay as JS for Electron)
const FILES_SKIP_BYTENODE = [
    'preload.js',   // Preload runs in renderer context
    'renderer.js',  // Renderer process needs to stay JS
    'integrity.js'
];

/**
 * Compile a single JS file to bytecode using Electron's V8
 */
function compileFile(filename) {
    const jsPath = path.join(BUILD_DIR, filename);
    const jscPath = jsPath.replace('.js', '.jsc');

    if (!fs.existsSync(jsPath)) {
        console.log(`   ⚠️ Skipped (not found): ${filename}`);
        return false;
    }

    console.log(`🔐 Compiling: ${filename}...`);

    try {
        // Use Electron to compile with correct V8 version
        execSync(`npx electron "${HELPER_SCRIPT}" "${jsPath}" "${jscPath}"`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
            timeout: 60000 // 60 second timeout per file
        });

        const jsSize = fs.statSync(jsPath).size;
        const jscSize = fs.statSync(jscPath).size;

        console.log(`   ✅ ${filename}: ${(jsSize / 1024).toFixed(1)}KB → ${(jscSize / 1024).toFixed(1)}KB (.jsc)`);

        // Delete original JS file after successful compilation
        fs.unlinkSync(jsPath);
        console.log(`   🗑️ Deleted: ${filename} (only .jsc remains)`);

        return true;
    } catch (error) {
        console.error(`   ❌ Failed: ${filename}:`, error.message);
        return false;
    }
}

/**
 * Create loader.js that bootstraps bytenode and loads main.jsc
 */
function createLoader() {
    const loaderPath = path.join(BUILD_DIR, 'loader.js');

    const loaderCode = `/**
 * Bytenode Loader - Clone App ULTRA
 * Loads V8 bytecode compiled files
 * Phase 09: Security Hardening
 */
'use strict';

// Bootstrap bytenode runtime
require('bytenode');

// Load the main compiled module
require('./main.jsc');
`;

    fs.writeFileSync(loaderPath, loaderCode, 'utf8');
    console.log('📄 Created: loader.js');
}

/**
 * Update package.json main entry to use loader
 */
function updatePackageJson() {
    const pkgPath = path.join(BUILD_DIR, 'package.json');

    if (!fs.existsSync(pkgPath)) {
        console.log('⚠️ package.json not found in build/');
        return;
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    // Change main entry from main.js to loader.js
    if (pkg.main === 'main.js') {
        pkg.main = 'loader.js';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
        console.log('📦 Updated package.json: main → loader.js');
    }
}

/**
 * Main build process
 */
function main() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  🔐 BYTENODE COMPILATION - Phase 09');
    console.log('═══════════════════════════════════════════\n');

    // Check if build directory exists
    if (!fs.existsSync(BUILD_DIR)) {
        console.error('❌ Build directory not found! Run "npm run obfuscate" first.');
        process.exit(1);
    }

    console.log('📁 Build directory:', BUILD_DIR);
    console.log('📋 Files to compile:', FILES_TO_COMPILE.join(', '));
    console.log('⚡ Files skipped:', FILES_SKIP_BYTENODE.join(', '));
    console.log('');

    const startTime = Date.now();
    let successCount = 0;

    // Compile each file sequentially
    for (const filename of FILES_TO_COMPILE) {
        const success = compileFile(filename);
        if (success) successCount++;
    }

    console.log('');

    // Create loader
    createLoader();

    // Update package.json
    updatePackageJson();

    console.log('🔐 Regenerating integrity hashes...');
    integrity.generateIntegrityFile(BUILD_DIR);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`  ✅ Bytenode compilation complete in ${elapsed}s`);
    console.log(`  📊 Compiled: ${successCount}/${FILES_TO_COMPILE.length} files`);
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('💡 Tiếp theo:');
    console.log('   - Test bytecode: cd build && npx electron .');
    console.log('   - Build installer: npm run dist:obfuscated');
    console.log('');
}

main();
