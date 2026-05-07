const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * BackupService - Silent Data Protection
 * Creates emergency backups before nuclear destruction
 * Allows for appeal/restoration in case of false positives
 */
class BackupService {
  constructor() {
    // Save to Documents folder to survive app deletion
    this.backupRoot = path.join(app.getPath('documents'), 'RunCloneApp_Backups');
  }

  /**
   * Create emergency backup silently
   * @returns {Promise<{success: boolean, backupPath?: string, error?: string}>}
   */
  async createEmergencyBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupRoot, `emergency_${timestamp}`);

      // Create backup directory
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }

      // 1. Backup encrypted config
      const configSource = path.join(app.getPath('appData'), 'RunCloneApp', 'config.enc');
      if (fs.existsSync(configSource)) {
        fs.copyFileSync(configSource, path.join(backupPath, 'config.enc'));
      }

      // 2. Backup license data
      // Note: Assuming ui-data is in the parent of current directory structure
      // Adjust path if needed based on actual structure
      const dataRoot = path.join(__dirname, '..', 'ui-data');

      const licenseSource = path.join(dataRoot, 'license.json');
      if (fs.existsSync(licenseSource)) {
        fs.copyFileSync(licenseSource, path.join(backupPath, 'license.json'));
      }

      // 3. Backup critical user data files
      const filesToBackup = ['app_settings.json', 'presets.json', 'groups.json', 'clone_overrides.json'];
      for (const file of filesToBackup) {
        const source = path.join(dataRoot, file);
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, path.join(backupPath, file));
        }
      }

      // 4. Create backup manifest (Hidden record)
      const manifest = {
        timestamp: new Date().toISOString(),
        reason: 'Emergency backup before nuclear execution',
        files: fs.readdirSync(backupPath),
        app_version: app.getVersion()
      };

      fs.writeFileSync(
        path.join(backupPath, 'BACKUP_MANIFEST.json'),
        JSON.stringify(manifest, null, 2)
      );

      console.log('[Backup] ✅ Silent emergency backup created at:', backupPath);
      return { success: true, backupPath };

    } catch (error) {
      console.error('[Backup] ❌ Failed to create silent backup:', error);
      // Fail silently - do not stop nuclear
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BackupService();
