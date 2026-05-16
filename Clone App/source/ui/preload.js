const { contextBridge, ipcRenderer } = require("electron");

// === LAUNCHER API ===
const launcherAPI = {
  selectProgram: () => ipcRenderer.invoke("select-program"),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  listExecutables: (folderPath) =>
    ipcRenderer.invoke("list-executables", folderPath),
  launchClone: (payload) => ipcRenderer.invoke("launch-program", payload),
  listTrackedUsers: () => ipcRenderer.invoke("list-tracked-users"),
  deleteTrackedUser: (username) =>
    ipcRenderer.invoke("delete-tracked-user", username),
  hideTrackedUser: (username) =>
    ipcRenderer.invoke("hide-tracked-user", username),
  showTrackedUser: (username) =>
    ipcRenderer.invoke("show-tracked-user", username),
  toggleStartupEntry: (appId) =>
    ipcRenderer.invoke("toggle-startup", { appId }),
  listTrackedClones: () => ipcRenderer.invoke("list-tracked-clones"),
  deleteTrackedApp: (payload) => ipcRenderer.invoke("delete-clone-app", payload),
  cloneApp: (payload) => ipcRenderer.invoke("clone-app", payload),
  createLocalUser: (payload) => ipcRenderer.invoke("create-local-user", payload),
  checkAdmin: () => ipcRenderer.invoke("check-admin"),
  loadAppIcon: (exePath) => ipcRenderer.invoke("load-app-icon", exePath),
  registerTrackedClone: (payload) =>
    ipcRenderer.invoke("register-tracked-clone", payload),
  loadPresets: () => ipcRenderer.invoke("load-presets"),
  savePresets: (payload) => ipcRenderer.invoke("save-presets", payload),
  loadCloneOverrides: () => ipcRenderer.invoke("load-clone-overrides"),
  updateCloneOverride: (appId, patch) =>
    ipcRenderer.invoke("update-clone-override", { appId, ...patch }),
  selectIconFile: () => ipcRenderer.invoke("select-icon-file"),
  checkCloneStatus: (clones) => ipcRenderer.invoke("check-clone-status", clones),
  terminateClone: (username) => ipcRenderer.invoke("terminate-clone", username),
  getCloneFlags: () => ipcRenderer.invoke("get-clone-flags"),
  deleteCloneFolder: (folderPath) =>
    ipcRenderer.invoke("delete-clone-folder", folderPath),
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),
  resolveAssetUrl: (relativePath) => ipcRenderer.invoke("app:resolve-asset-url", relativePath),
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  getUpdateState: () => ipcRenderer.invoke("update:get-state"),
  downloadUpdate: (payload) => ipcRenderer.invoke("update:download", payload),
  installDownloadedUpdate: (payload) => ipcRenderer.invoke("update:install", payload),
  openExternalUrl: (url) => ipcRenderer.invoke("app:open-external-url", url),
  getAppSettings: () => ipcRenderer.invoke("get-app-settings"),
  updateAppSettings: (payload) => ipcRenderer.invoke("update-app-settings", payload),
  createCloneShortcut: (payload) =>
    ipcRenderer.invoke("create-clone-shortcut", payload),
  getGroups: () => ipcRenderer.invoke("get-groups"),
  saveGroups: (groups) => ipcRenderer.invoke("save-groups", groups),
  hasCredential: (username) => ipcRenderer.invoke("has-credential", username),
  saveCredential: (payload) => ipcRenderer.invoke("save-credential", payload),
  deleteCredential: (username) => ipcRenderer.invoke("delete-credential", username),
  updateUserDefaultProxy: (username, defaultProxy) =>
    ipcRenderer.invoke("update-user-default-proxy", { username, defaultProxy }),
  updateUserStoragePath: (username, storagePath) =>
    ipcRenderer.invoke("update-user-storage-path", { username, storagePath }),
};

// === SECURITY: Object.freeze để chống sửa đổi từ Console ===
Object.freeze(launcherAPI);

// Expose frozen APIs to renderer
contextBridge.exposeInMainWorld("launcherAPI", launcherAPI);
