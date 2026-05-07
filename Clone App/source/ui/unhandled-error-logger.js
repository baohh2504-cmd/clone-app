/**
 * unhandled-error-logger.js
 * Catch ALL errors (Main & Renderer) and save to file
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Log file path logic
// Prod: %APPDATA%/Run Clone App/logs/error.log
// Dev:  <ProjectRoot>/Clone App/logs/error.log (easier to find)
let LOG_DIR;

if (app.isPackaged) {
    LOG_DIR = path.join(app.getPath('userData'), 'logs');
} else {
    // Dev Mode: Move logs to project root (source/ui -> source -> Clone App -> logs)
    LOG_DIR = path.resolve(__dirname, '..', '..', 'logs');
}

const LOG_FILE = path.join(LOG_DIR, 'error.log');

// Ensure log dir exists
if (!fs.existsSync(LOG_DIR)) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch (e) {
        console.error('Failed to create log dir:', e);
        // Fallback to userData if we can't write to project dir (permission issues)
        LOG_DIR = path.join(app.getPath('userData'), 'logs');
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
}

function writeLog(type, error) {
    const timestamp = new Date().toISOString();
    const message = error.stack || error.toString();
    const logEntry = `[${timestamp}] [${type}] ${message}\n----------------------------------------\n`;

    // Write to file (Sync to ensure it's written before crash)
    try {
        fs.appendFileSync(LOG_FILE, logEntry);
    } catch (e) {
        console.error('Failed to write log file:', e);
    }

    // Also print to console
    console.error(`\n💥 [${type}] captured:\n`, message);
}

module.exports = function setupErrorHandling() {
    process.on('uncaughtException', (error) => {
        writeLog('UNCAUGHT_EXCEPTION', error);
    });

    process.on('unhandledRejection', (reason) => {
        writeLog('UNHANDLED_REJECTION', reason);
    });

    console.log(`📝 Error Logger initialized. Logs at: ${LOG_FILE}`);
    console.log(`📂 UserData Path: ${app.getPath('userData')}`); // DEBUG PATH
};
