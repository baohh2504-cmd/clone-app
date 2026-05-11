const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  globalShortcut,
  nativeImage,
  Tray,
  Menu,
  shell,
} = require("electron");
const fs = require("fs");
const { spawn, execSync, execFileSync } = require("child_process");
const path = require("path");
const os = require("os");
const { pathToFileURL } = require("url");
const licenseService = require("./licenseService");
const configCrypto = require("./configCrypto");
const updateService = require("./updateService");
const securityConfig = require("./securityConfig"); // Ensure config is loaded
const integrity = require("./integrity"); // NEW: Integrity Check Module
require('./unhandled-error-logger')(); // Init Logger Error Capture

const PROJECT_ROOT = path.resolve(__dirname, "..");

// Security Enhancement: Ưu tiên dùng EXE đã compile, fallback về Python cho dev mode
const LAUNCHER_EXE = path.join(PROJECT_ROOT, "launcher", "dist", "runas_launcher.exe");
const LAUNCHER_PY = path.join(PROJECT_ROOT, "launcher", "runas_launcher.py");
const FORCE_EXE_LAUNCHER = process.env.USE_EXE_LAUNCHER === "1";
const USE_EXE_LAUNCHER = (app.isPackaged || FORCE_EXE_LAUNCHER) && fs.existsSync(LAUNCHER_EXE);
const LAUNCHER_CMD = USE_EXE_LAUNCHER ? LAUNCHER_EXE : null;
const LAUNCHER_SCRIPT = LAUNCHER_PY; // Giữ cho backward compatibility

// Config path (encrypted in %APPDATA%, legacy in launcher folder)
const CREATED_USERS_FILE = configCrypto.CONFIG_FILE;
const LEGACY_USERS_FILE = path.join(
  PROJECT_ROOT,
  "launcher",
  "created_users.json"
);
const APPDATA_ROOT = path.join(process.env.APPDATA || os.homedir(), "RunCloneApp");
const LEGACY_DATA_ROOT = path.join(PROJECT_ROOT, "ui-data");
const DATA_ROOT = path.join(APPDATA_ROOT, "ui-data");
const DEBUG_LOG_ENABLED = process.env.CLONE_APP_DEBUG === "1";
const SENSITIVE_ARG_NAMES = new Set(["--password"]);
const CACHE_DIR = path.join(DATA_ROOT, "cache");
const TEMP_DIR = path.join(DATA_ROOT, "temp");
const USER_DATA_DIR = path.join(DATA_ROOT, "userdata");
const UPDATE_CACHE_DIR = path.join(APPDATA_ROOT, "updates");
const UPDATE_BACKUP_DIR = path.join(APPDATA_ROOT, "backups");
const PRESET_FILE = path.join(DATA_ROOT, "presets.json");
const CLONE_OVERRIDES_FILE = path.join(DATA_ROOT, "clone_overrides.json");
const APP_SETTINGS_FILE = path.join(DATA_ROOT, "app_settings.json");
const GROUPS_FILE = path.join(DATA_ROOT, "groups.json");
function resolveAssetPath(...segments) {
  const base = app?.isPackaged ? process.resourcesPath : __dirname;
  return path.join(base, ...segments);
}

function redactCommandArgs(args = []) {
  let redactNext = false;
  return args.map((arg) => {
    if (redactNext) {
      redactNext = false;
      return "[REDACTED]";
    }
    if (SENSITIVE_ARG_NAMES.has(arg)) {
      redactNext = true;
      return arg;
    }
    if (typeof arg === "string" && arg.startsWith("--password=")) {
      return "--password=[REDACTED]";
    }
    return arg;
  });
}

const APP_ICON_PATH = resolveAssetPath("assets", "icon.ico");
const PYTHON_CMD = process.env.PYTHON_CMD || "python";
// Log launcher mode at startup - Only for dev debugging
// console.log(`[Launcher] Mode: ${USE_EXE_LAUNCHER ? 'EXE (Compiled)' : 'Python (Dev)'}`);
const DEFAULT_APP_SETTINGS = {
  autoLaunch: false,
  launchMode: "window",
  autoUpdateEnabled: false,
};

function ensureDataDirectories() {
  fs.mkdirSync(APPDATA_ROOT, { recursive: true });
  if (fs.existsSync(LEGACY_DATA_ROOT) && !fs.existsSync(DATA_ROOT)) {
    fs.cpSync(LEGACY_DATA_ROOT, DATA_ROOT, { recursive: true, force: false });
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  fs.mkdirSync(UPDATE_CACHE_DIR, { recursive: true });
  fs.mkdirSync(UPDATE_BACKUP_DIR, { recursive: true });
}

function readPresetFile() {
  if (!fs.existsSync(PRESET_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(PRESET_FILE, "utf-8");
    if (!raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.presets) ? parsed.presets : [];
  } catch (error) {
    console.error("Failed to read preset file:", error);
    return [];
  }
}

function writePresetFile(presets) {
  try {
    fs.writeFileSync(
      PRESET_FILE,
      JSON.stringify({ presets }, null, 2),
      "utf-8"
    );
    return true;
  } catch (error) {
    console.error("Failed to write preset file:", error);
    throw error;
  }
}

function readCloneOverrides() {
  if (!fs.existsSync(CLONE_OVERRIDES_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CLONE_OVERRIDES_FILE, "utf-8");
    if (!raw.trim()) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("Failed to read clone overrides:", error);
    return {};
  }
}

function writeCloneOverrides(overrides) {
  try {
    fs.writeFileSync(
      CLONE_OVERRIDES_FILE,
      JSON.stringify(overrides || {}, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Failed to write clone overrides:", error);
    throw error;
  }
}

function readAppSettings() {
  if (!fs.existsSync(APP_SETTINGS_FILE)) {
    return { ...DEFAULT_APP_SETTINGS };
  }
  try {
    const raw = fs.readFileSync(APP_SETTINGS_FILE, "utf-8");
    if (!raw.trim()) {
      return { ...DEFAULT_APP_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_APP_SETTINGS,
      ...(parsed || {}),
    };
  } catch (error) {
    console.error("Failed to read app settings:", error);
    return { ...DEFAULT_APP_SETTINGS };
  }
}

function writeAppSettings(settings) {
  try {
    fs.writeFileSync(
      APP_SETTINGS_FILE,
      JSON.stringify(settings || DEFAULT_APP_SETTINGS, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Failed to write app settings:", error);
  }
}

function readGroups() {
  if (!fs.existsSync(GROUPS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(GROUPS_FILE, "utf-8");
    if (!raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.groups) ? parsed.groups : [];
  } catch (error) {
    console.error("Failed to read groups file:", error);
    return [];
  }
}

function writeGroups(groups) {
  try {
    fs.writeFileSync(
      GROUPS_FILE,
      JSON.stringify({ groups: groups || [] }, null, 2),
      "utf-8"
    );
    return true;
  } catch (error) {
    console.error("Failed to write groups file:", error);
    return false;
  }
}

function slugifyLabel(value) {
  return (
    (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase() || "clone"
  );
}

function safeFileName(value) {
  const cleaned = (value || "").toString().replace(/[<>:"/\\|?*]/g, "").trim();
  return cleaned || "Clone App";
}

function loadTrayIconImage() {
  const candidates = [
    resolveAssetPath("assets", "icon.ico"),
    resolveAssetPath("assets", "icon.png"),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const buffer = fs.readFileSync(candidate);
        const image = nativeImage.createFromBuffer(buffer);
        if (image && !image.isEmpty()) {
          return image;
        }
      }
    } catch (error) {
      console.warn("Cannot load tray icon from", candidate, error);
    }
    try {
      const fallback = nativeImage.createFromPath(candidate);
      if (fallback && !fallback.isEmpty()) {
        return fallback;
      }
    } catch (_) {
      /* ignore */
    }
  }
  return nativeImage.createFromPath(process.execPath);
}

ensureDataDirectories();
app.setPath("userData", USER_DATA_DIR);
app.setPath("cache", CACHE_DIR);
app.setPath("temp", TEMP_DIR);
let appSettings = readAppSettings();
let tray = null;
let mainWindow = null;
let isQuitting = false;

function isRunningAsAdmin() {
  if (process.platform !== "win32") {
    return true;
  }
  try {
    const result = execSync(
      'powershell -NoLogo -NonInteractive -Command "[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"',
      { encoding: "utf-8" }
    );
    return /True/i.test(result);
  } catch (error) {
    return false;
  }
}

function registerDevToolsShortcut(window) {
  // Disable DevTools hotkey in packaged build
  if (app.isPackaged) {
    return;
  }
  if (!window) {
    return;
  }

  const openDevTools = () => {
    if (!window.isDestroyed()) {
      window.webContents.openDevTools({ mode: "detach" });
    }
  };

  window.webContents.on("before-input-event", (event, input) => {
    if (
      input.type === "keyDown" &&
      input.control &&
      input.shift &&
      input.key.toLowerCase() === "i"
    ) {
      // In dev only; packaged build returns earlier
      event.preventDefault();
      openDevTools();
    }
  });

  if (!globalShortcut.isRegistered("Control+Shift+I")) {
    globalShortcut.register("Control+Shift+I", openDevTools);
  }

  if (process.env.ELECTRON_OPEN_DEVTOOLS === "1") {
    openDevTools();
  }
}

function applyAutoLaunchSetting() {
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(appSettings.autoLaunch),
      openAsHidden: appSettings.launchMode === "tray",
      path: process.execPath,
    });
  } catch (error) {
    console.error("Failed to update auto-launch:", error);
  }
}

function showMainWindow() {
  if (!mainWindow) {
    return;
  }
  mainWindow.show();
  mainWindow.focus();
  mainWindow.setSkipTaskbar(false);
  updateTrayMenu();
}

function hideMainWindow() {
  if (!mainWindow) {
    return;
  }
  mainWindow.hide();
  if (appSettings.launchMode === "tray") {
    mainWindow.setSkipTaskbar(true);
  }
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) {
    return;
  }
  const template = [
    {
      label: mainWindow && mainWindow.isVisible() ? "Ẩn cửa sổ" : "Hiện cửa sổ",
      click: () => {
        if (mainWindow?.isVisible()) {
          hideMainWindow();
        } else {
          showMainWindow();
        }
      },
    },
    { type: "separator" },
    {
      label: "Thoát ứng dụng",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ];
  tray.setContextMenu(Menu.buildFromTemplate(template));
}

function refreshTrayState() {
  if (appSettings.launchMode === "tray") {
    if (!tray) {
      const icon = loadTrayIconImage();
      tray = new Tray(icon);
      tray.setToolTip("Clone App");
      tray.on("click", () => {
        if (mainWindow?.isVisible()) {
          hideMainWindow();
        } else {
          showMainWindow();
        }
      });
    }
    updateTrayMenu();
  } else if (tray) {
    tray.destroy();
    tray = null;
  }
}

/**
 * Anti-Debugging: Chặn DevTools trong bản đóng gói
 * - Block phím F12 và Ctrl+Shift+I
 * - Kiểm tra và đóng DevTools mỗi 3 giây
 */
function setupAntiDebug(window) {
  // Chỉ active trong bản đóng gói (packaged build)
  if (!app.isPackaged) {
    return;
  }

  if (!window || window.isDestroyed()) {
    return;
  }

  // Block phím tắt DevTools: F12 và Ctrl+Shift+I
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    const isF12 = input.key === 'F12';
    const isCtrlShiftI = input.control && input.shift && input.key.toLowerCase() === 'i';
    const isCtrlShiftJ = input.control && input.shift && input.key.toLowerCase() === 'j';

    if (isF12 || isCtrlShiftI || isCtrlShiftJ) {
      event.preventDefault();
      console.log('[Security] Blocked DevTools shortcut');
    }
  });

  // Kiểm tra DevTools định kỳ (mỗi 3 giây)
  const antiDebugInterval = setInterval(() => {
    if (window.isDestroyed()) {
      clearInterval(antiDebugInterval);
      return;
    }

    // Nếu DevTools đang mở, đóng ngay
    if (window.webContents.isDevToolsOpened()) {
      window.webContents.closeDevTools();
      console.log('[Security] DevTools detected - closing app');
      clearInterval(antiDebugInterval);

      // Hiện dialog và thoát
      dialog.showMessageBoxSync({
        type: 'error',
        title: 'Lỗi bảo mật',
        message: 'Phát hiện công cụ debug.\n\nỨng dụng sẽ đóng để bảo vệ phiên chạy hiện tại.',
        buttons: ['Đóng']
      });
      app.exit(1);
    }
  }, 3000);

  // Cleanup khi window đóng
  window.on('closed', () => {
    clearInterval(antiDebugInterval);
  });
}

function createWindow() {
  const shouldStartHidden = appSettings.launchMode === "tray";
  const win = new BrowserWindow({
    width: 1050,
    height: 720,
    icon: APP_ICON_PATH,
    show: false, // Wait to maximize
    skipTaskbar: shouldStartHidden,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true, // FIXED: Enable web security (use file:// protocol for local assets)
    },
  });

  win.removeMenu();
  win.loadFile(path.join(__dirname, "index.html"));
  registerDevToolsShortcut(win);
  setupAntiDebug(win);

  if (!shouldStartHidden) {
    win.maximize();
    win.show();
  }

  win.on("close", (event) => {
    if (!isQuitting && appSettings.launchMode === "tray") {
      event.preventDefault();
      hideMainWindow();
    }
  });

  win.on("show", () => {
    win.setSkipTaskbar(false);
    updateTrayMenu();
  });

  win.on("hide", () => {
    if (appSettings.launchMode === "tray") {
      win.setSkipTaskbar(true);
    }
    updateTrayMenu();
  });

  return win;
}

function ensureLauncher() {
  if (app.isPackaged) {
    if (!fs.existsSync(LAUNCHER_EXE)) {
      throw new Error(`Packaged build requires launcher EXE at ${LAUNCHER_EXE}. Run 'npm run build:launcher' first.`);
    }
  } else {
    if (!fs.existsSync(LAUNCHER_SCRIPT)) {
      throw new Error(`Cannot find launcher script at ${LAUNCHER_SCRIPT}`);
    }
  }
}

async function handleSelectProgram() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile", "openDirectory"],
    title: "Chọn thư mục hoặc file thực thi",
  });

  if (canceled || !filePaths.length) {
    return null;
  }

  return filePaths[0];
}

async function handleSelectIconFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    title: "Chọn file icon (ICO/PNG/EXE)",
    filters: [
      {
        name: "Biểu tượng",
        extensions: ["ico", "png", "jpg", "jpeg", "bmp", "exe"],
      },
      { name: "Tất cả", extensions: ["*"] },
    ],
  });
  if (canceled || !filePaths.length) {
    return null;
  }
  return filePaths[0];
}

async function listExecutablesInFolder(folderPath) {
  if (!folderPath) {
    return [];
  }
  const cleaned = folderPath.trim();
  if (!cleaned) {
    return [];
  }
  let stats;
  try {
    stats = await fs.promises.stat(cleaned);
  } catch (error) {
    throw new Error("Không truy cập được thư mục.");
  }
  if (!stats.isDirectory()) {
    return [];
  }
  let entries = [];
  try {
    entries = await fs.promises.readdir(cleaned, { withFileTypes: true });
  } catch (error) {
    throw new Error("Không đọc được danh sách tệp.");
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".exe"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .slice(0, 200);
}

function updateCloneOverride(appId, patch) {
  if (!appId) {
    throw new Error("App ID is required.");
  }

  const overrides = readCloneOverrides();
  const legacyKey = patch?.username && patch.username !== appId ? patch.username : null;
  const current = overrides[appId] || (legacyKey ? overrides[legacyKey] : {}) || {};
  const next = { ...current };

  if (Object.prototype.hasOwnProperty.call(patch, "displayName")) {
    const value =
      typeof patch.displayName === "string" ? patch.displayName.trim() : "";
    if (value) {
      next.displayName = value;
    } else {
      delete next.displayName;
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, "iconPath")) {
    const value =
      typeof patch.iconPath === "string" ? patch.iconPath.trim() : "";
    if (value) {
      next.iconPath = value;
    } else {
      delete next.iconPath;
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, "proxy")) {
    const value =
      typeof patch.proxy === "string" ? patch.proxy.trim() : "";
    if (value) {
      next.proxy = value;
    } else {
      delete next.proxy;
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, "groups")) {
    const value = Array.isArray(patch.groups) ? patch.groups : [];
    if (value.length > 0) {
      next.groups = value;
    } else {
      delete next.groups;
    }
  }

  if (!Object.keys(next).length) {
    delete overrides[appId];
  } else {
    overrides[appId] = next;
  }
  if (legacyKey && legacyKey !== appId) {
    delete overrides[legacyKey];
  }

  writeCloneOverrides(overrides);
  return overrides[appId] || null;
}

function splitDomainUser(username = "") {
  if (!username) {
    return { domain: "", user: "" };
  }
  const parts = username.split("\\");
  if (parts.length >= 2) {
    return { domain: parts[0], user: parts.slice(1).join("\\") };
  }
  return { domain: "", user: username };
}

function parseCsvLine(line = "") {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function normalizePathLower(value = "") {
  if (!value) {
    return "";
  }
  return value.replace(/\//g, "\\").toLowerCase();
}

function buildProcessQueryScript(names = []) {
  const literal = names.length
    ? `@(${names.map((name) => `'${name.replace(/'/g, "''")}'`).join(",")})`
    : "@()";
  return `
$ErrorActionPreference = 'SilentlyContinue';
$names = ${literal};
$processes = Get-Process -IncludeUserName | Where-Object {
  ($names.Count -eq 0) -or $names -contains $_.ProcessName.ToLower()
};
$result = @();
foreach ($proc in $processes) {
  if (-not $proc.UserName) { continue }
  $path = $proc.Path;
  if (-not $path) { continue }
  $result += [PSCustomObject]@{
    UserName = $proc.UserName
    Path = $path
    ProcessName = $proc.ProcessName
  }
}
$result | ConvertTo-Json -Compress
`.trim();
}

function queryRunningByUser(targets = []) {
  return new Promise((resolve) => {
    if (!targets.length) {
      resolve({});
      return;
    }

    const initial = {};
    const exeNames = new Set();
    targets.forEach((target) => {
      if (!target?.key) {
        return;
      }
      initial[target.key] = false;
      if (target.exeLower) {
        const processName = target.exeLower.replace(/\.exe$/, "");
        if (processName) {
          exeNames.add(processName);
        }
      }
    });

    const script = buildProcessQueryScript(Array.from(exeNames));
    const child = spawn(
      "powershell.exe",
      ["-NoLogo", "-NoProfile", "-Command", script],
      { windowsHide: true }
    );
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.on("error", () => {
      resolve(initial);
    });
    child.on("close", () => {
      let parsed = [];
      const trimmed = stdout.trim();
      if (trimmed) {
        try {
          parsed = JSON.parse(trimmed);
        } catch (_) {
          parsed = [];
        }
      }
      if (!Array.isArray(parsed)) {
        parsed = [];
      }
      const processes = parsed.map((item) => ({
        userLower: (item?.UserName || item?.username || "").toLowerCase(),
        pathLower: normalizePathLower(item?.Path || item?.path || ""),
      }));

      targets.forEach((target) => {
        const key = target?.key;
        if (!key) {
          return;
        }
        const userLower = (target.userLower || "").toLowerCase();
        const execLower = target.execLower || "";
        const rootLower = target.rootLower || "";
        const exeLower = target.exeLower || "";
        const hasMatch = processes.some((proc) => {
          if (!proc.pathLower) {
            return false;
          }
          if (userLower && proc.userLower !== userLower) {
            return false;
          }
          if (execLower && proc.pathLower === execLower) {
            return true;
          }
          if (
            rootLower &&
            (proc.pathLower === rootLower ||
              proc.pathLower.startsWith(`${rootLower}\\`))
          ) {
            return true;
          }
          if (exeLower && proc.pathLower.endsWith(`\\${exeLower}`)) {
            return true;
          }
          return false;
        });
        initial[key] = hasMatch;
      });

      resolve(initial);
    });
  });
}

function runLauncher(payload) {
  return new Promise(async (resolve) => {
    // === Launch Config (local full-access mode) ===
    // Packaged builds resolve launcher config through the compatibility layer
    if (app.isPackaged) {
      try {
        const configResult = await licenseService.fetchLaunchConfig('zalo');

        if (configResult.success && configResult.config && configResult.config.is_bypass) {
          console.log('[Launch Config] Local config active');
        } else if (!configResult.success) {
          if (configResult.kill) {
            const { dialog, app: electronApp } = require('electron');
            dialog.showMessageBoxSync({
              type: 'error',
              title: 'Launch Config Error',
              message: configResult.error || 'Không thể chuẩn bị cấu hình chạy ứng dụng.',
              buttons: ['OK']
            });
            electronApp.exit(1);
          }

          resolve({
            ok: false,
            message: configResult.error || 'Không thể chuẩn bị cấu hình chạy ứng dụng.',
            stdout: '',
            stderr: '',
            exitCode: -1
          });
          return;
        }

        if (!configResult.offline) {
          console.log('[Launch Config] Config version:', configResult.config.version);
        }
      } catch (sslError) {
        console.error('[Launch Config] Error:', sslError.message);
        resolve({
          ok: false,
          message: 'Lỗi chuẩn bị cấu hình chạy ứng dụng: ' + sslError.message,
          stdout: '',
          stderr: '',
          exitCode: -1
        });
        return;
      }
    }

    // DEBUG: Trace execution
    const debugLog = path.join(PROJECT_ROOT, "launcher_exec.log");
    // EXE mode: args trực tiếp, Python mode: script + args
    const baseArgs = [payload.programPath, "--username", payload.username];
    const args = USE_EXE_LAUNCHER ? baseArgs : [LAUNCHER_SCRIPT, ...baseArgs];
    const cmd = USE_EXE_LAUNCHER ? LAUNCHER_EXE : PYTHON_CMD;

    if (DEBUG_LOG_ENABLED) {
      try {
        fs.appendFileSync(debugLog, `\n\n[${new Date().toISOString()}] Attempting to launch:\nMODE: ${USE_EXE_LAUNCHER ? 'EXE' : 'Python'}\nCMD: ${cmd}\n`);
      } catch (e) { }
    }

    if (payload.domain) {
      args.push("--domain", payload.domain);
    }

    if (payload.exeName) {
      args.push("--exe-name", payload.exeName);
    }

    if (payload.arguments) {
      args.push("--arguments", payload.arguments);
    }

    if (payload.workingDir) {
      args.push("--working-dir", payload.workingDir);
    }

    // If password is provided (from custom dialog), always use stdin mode
    const hasPasswordFromDialog = payload.password && payload.password.length > 0;

    if (hasPasswordFromDialog) {
      args.push("--password-stdin");
    }

    if (payload.skipCredentialCache) {
      args.push("--skip-credential-cache");
    }

    if (payload.autoCreateUser) {
      args.push("--auto-create-user");
    }

    if (payload.deleteUser) {
      args.push("--delete-user");
    }

    if (payload.cloneEnabled && payload.cloneTarget) {
      args.push("--clone-to", payload.cloneTarget);
      if (payload.cloneName) {
        args.push("--clone-name", payload.cloneName);
      }
      if (payload.forceClone) {
        args.push("--force-clone");
      }
    }

    if (payload.proxy) {
      args.push("--proxy", payload.proxy);
    }

    // Hide CMD window when password provided from custom dialog
    const child = spawn(cmd, args, {
      cwd: PROJECT_ROOT,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({
        ok: false,
        message: `Không thể chạy launcher (${cmd}): ${error.message}`,
        stdout,
        stderr,
        exitCode: -1,
      });
    });

    child.on("close", (code) => {
      let msg = "Đã gửi lệnh runas thành công.";
      let isOk = code === 0;
      let passwordWrong = false;

      if (code !== 0) {
        isOk = false;
        // runas usually returns 1 for authentication failure
        if (code === 1) {
          msg = "Lỗi khởi chạy: Sai mật khẩu hoặc bạn đã tắt cửa sổ nhập liệu.";
          passwordWrong = true; // Signal renderer to clear saved credential
        } else {
          // Include stderr for debugging
          const errDetail = stderr.trim() || stdout.trim() || "Không có chi tiết";
          msg = `Lỗi khởi chạy (Mã lỗi ${code}): ${errDetail}`;
        }
      }

      resolve({
        ok: isOk,
        message: msg,
        stdout,
        stderr,
        exitCode: code,
        passwordWrong,
      });
    });

    // Write password to stdin if provided (from custom dialog or saveCredential flow)
    if (payload.password) {
      child.stdin.write(`${payload.password}\n`);
    }
    child.stdin.end();
  });
}

function createCloneShortcutFile(clone) {
  if (!clone || !clone.execPath || !clone.username) {
    throw new Error("Thiếu thông tin clone để tạo shortcut.");
  }
  if (!fs.existsSync(clone.execPath)) {
    throw new Error("File .exe của clone không tồn tại.");
  }
  const displayName = clone.displayName || clone.name || clone.username;
  const slug = slugifyLabel(displayName || clone.username);
  const execDir = path.dirname(clone.execPath);
  const batBase = `run-clone-${slug}.bat`;
  const vbsBase = `run-clone-${slug}.vbs`;
  const batPath = path.join(execDir, batBase);
  const vbsPath = path.join(execDir, vbsBase);
  let commandLine;
  if (USE_EXE_LAUNCHER && fs.existsSync(LAUNCHER_EXE)) {
    const exe = LAUNCHER_EXE.includes(" ") ? `"${LAUNCHER_EXE}"` : LAUNCHER_EXE;
    commandLine = `${exe} "${clone.execPath}" --username "${clone.username}"`;
  } else {
    const python = PYTHON_CMD.includes(" ") ? `"${PYTHON_CMD}"` : PYTHON_CMD;
    commandLine = `${python} "${LAUNCHER_SCRIPT}" "${clone.execPath}" --username "${clone.username}"`;
  }

  // Dynamic Proxy: Pass config path so launcher reads latest proxy at runtime
  commandLine += ` --config-path "${CLONE_OVERRIDES_FILE}"`;
  // payload.appId is passed from renderer
  if (clone.appId) {
    commandLine += ` --app-id "${clone.appId}"`;
  }

  // Create HTA (HTML Application) for Windows 11 Fluent style password dialog
  const htaBase = `run-clone-${slug}.hta`;
  const htaPath = path.join(execDir, htaBase);
  const tempPassFile = path.join(os.tmpdir(), `.pass_${slug}.tmp`);

  // Windows 11 Fluent Design HTA content (Modern Dark Theme)
  const htaContent = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="x-ua-compatible" content="ie=edge" />
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Clone App Security</title>
<HTA:APPLICATION
  ID="CloneAppAuth"
  APPLICATIONNAME="Clone App"
  BORDER="dialog"
  BORDERSTYLE="normal"
  CAPTION="yes"
  CONTEXTMENU="no"
  MAXIMIZEBUTTON="no"
  MINIMIZEBUTTON="no"
  NAVIGABLE="no"
  SCROLL="no"
  SELECTION="no"
  SHOWINTASKBAR="yes"
  SINGLEINSTANCE="yes"
  SYSMENU="yes"
  VERSION="2.0"
  WINDOWSTATE="normal"
/>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', 'Roboto', sans-serif;
  background-color: #202020;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
  user-select: none;
  cursor: default;
}
.container {
  width: 100%;
  padding: 24px;   /* Reduced from 40px */
  text-align: center;
  opacity: 0;
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.icon-lock {
  width: 40px;      /* Reduced from 48px */
  height: 40px;     /* Reduced from 48px */
  background: rgba(96, 205, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px auto; /* Reduced from 20px */
  color: #60cdff;
  font-size: 20px;  /* Reduced from 24px */
}
h1 {
  font-size: 20px;  /* Reduced from 24px */
  font-weight: 600;
  margin-bottom: 4px; /* Reduced from 8px */
  letter-spacing: -0.5px;
}
p {
  color: #aaaaaa;
  font-size: 13px;  /* Reduced from 14px */
  margin-bottom: 20px; /* Reduced from 32px */
  line-height: 1.4;
}
.highlight {
  color: #ffffff;
  font-weight: 600;
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
.input-wrapper {
  position: relative;
  margin-bottom: 20px; /* Reduced from 24px */
  text-align: left;
}
/* ... skipped input styles ... */
input {
  width: 100%;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  color: white;
  padding: 10px 40px 10px 12px; /* Slight reduce padding */
  border-radius: 6px;
  font-size: 14px; /* Back to 14px for compactness */
  outline: none;
  transition: all 0.2s;
}
input:focus {
  border-color: #60cdff;
  background: #333;
  box-shadow: 0 0 0 2px rgba(96, 205, 255, 0.25);
}
input::placeholder { color: #666; }
.toggle-btn {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 40px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  transition: color 0.2s;
}
.toggle-btn:hover { color: #fff; }
.toggle-btn svg { width: 20px; height: 20px; fill: currentColor; }
.btn-group {
  display: flex;
  flex-direction: column;
  gap: 10px; /* Reduced from 12px */
}
.btn {
  width: 100%;
  padding: 10px; /* Reduced from 12px */
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary {
  background: #60cdff;
  color: #1a1a1a;
}
.btn-primary:active { transform: scale(0.98); background: #50b0db; }
.btn-primary:hover { background: #7ad6ff; box-shadow: 0 4px 12px rgba(96, 205, 255, 0.2); }
.btn-secondary {
  background: transparent;
  color: #888;
}
.btn-secondary:hover { color: #fff; }
</style>
<script>
window.resizeTo(400, 340);
var w = 400, h = 340;
window.moveTo((screen.width - w) / 2, (screen.height - h) / 2);

window.onload = function() {
  document.getElementById('pass').focus();
};

function togglePass() {
  var p = document.getElementById('pass');
  var icon = document.getElementById('eyeIconSvg');
  if (p.type === 'password') {
    p.type = 'text';
    // Eye Off
    icon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
  } else {
    p.type = 'password';
    // Eye On
    icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
  }
}

function submitPass() {
  var pass = document.getElementById('pass').value;
  if (!pass) return;

  var fso = new ActiveXObject('Scripting.FileSystemObject');
  var f = fso.CreateTextFile('${tempPassFile.replace(/\\/g, '\\\\')}', true);
  f.WriteLine(pass);
  f.Close();
  window.close();
}

function cancelPass() {
  window.close();
}

document.onkeydown = function() {
  var e = window.event;
  if (e.keyCode === 13) submitPass();
  if (e.keyCode === 27) cancelPass();
};
</script>
</head>
<body>
<div class="container">
  <div class="icon-lock">🔒</div>
  <h1>Nhập Mật Khẩu</h1>
  <p>Để truy cập profile <span class="highlight">${clone.username}</span>, vui lòng xác thực danh tính của bạn.</p>

  <div class="input-wrapper">
    <input type="password" id="pass" placeholder="Nhập mật khẩu..." />
    <button class="toggle-btn" onclick="togglePass()" tabindex="-1">
      <svg id="eyeIconSvg" viewBox="0 0 24 24">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
    </button>
  </div>

  <div class="btn-group">
    <button class="btn btn-primary" onclick="submitPass()">Xác nhận</button>
    <button class="btn btn-secondary" onclick="cancelPass()">Hủy bỏ</button>
  </div>
</div>
</body>
</html>`;
  // Write HTA file (meta charset="utf-8" handles encoding now)
  fs.writeFileSync(htaPath, htaContent, "utf-8");

  // Batch file: run HTA, wait for password file, read it, pipe to Python, then clean up
  const commandLineBase = commandLine;
  const commandLineStdin = commandLine + ` --password-stdin`;

  const batContent = `@echo off
cd /d "${PROJECT_ROOT}"

REM Check for saved credential
cmdkey /list:${clone.username} 2>nul | findstr /i "Target:" >nul 2>&1
if %errorlevel%==0 (
    ${commandLineBase}
    if %errorlevel% neq 0 (
        REM If runas failed (e.g., password changed), delete old credential and prompt again
        cmdkey /delete:${clone.username} >nul 2>&1
        goto prompt_pass
    )
    goto :eof
)

:prompt_pass
del "${tempPassFile}" 2>nul
start /wait "" mshta.exe "${htaPath}"
if not exist "${tempPassFile}" exit /b 1
set /p PASS=<"${tempPassFile}"
del "${tempPassFile}" 2>nul
echo %PASS%| ${commandLineStdin}
`.replace(/\n/g, '\r\n');
  fs.writeFileSync(batPath, batContent, "utf-8");

  // VBS runs the batch file hidden (0 = hidden window)
  const vbsContent = [
    'Set WshShell = CreateObject("WScript.Shell")',
    `WshShell.Run chr(34) & "${batPath}" & chr(34), 0, False`,
    "Set WshShell = Nothing",
  ].join("\r\n");
  fs.writeFileSync(vbsPath, vbsContent, "utf-8");

  const shortcutPath = resolveShortcutPath(displayName);
  const iconCandidates = [
    clone.iconPath && fs.existsSync(clone.iconPath) ? clone.iconPath : null,
    fs.existsSync(clone.execPath) ? clone.execPath : null,
    APP_ICON_PATH,
  ].filter(Boolean);
  const iconCandidate = iconCandidates.find(Boolean) || APP_ICON_PATH;
  const success = shell.writeShortcutLink(shortcutPath, {
    target: vbsPath,
    workingDirectory: execDir,
    icon: iconCandidate,
    iconIndex: 0,
    description: `Chạy ${displayName} bằng Clone App`,
  });
  if (!success) {
    throw new Error("Không tạo được shortcut trên Desktop.");
  }
  return shortcutPath;
}

function runPythonUtility(extraArgs) {
  return new Promise((resolve) => {
    // EXE mode: gọi EXE trực tiếp, Python mode: python script
    const cmd = USE_EXE_LAUNCHER ? LAUNCHER_EXE : PYTHON_CMD;
    const args = USE_EXE_LAUNCHER ? extraArgs : [LAUNCHER_SCRIPT, ...extraArgs];

    // DEBUG LOGGING
    const utilLog = path.join(PROJECT_ROOT, "launcher_utility.log");
    if (DEBUG_LOG_ENABLED) {
      try {
        const timestamp = new Date().toISOString();
        const headers = `\n[${timestamp}] UTIL_EXEC: ${cmd} ${JSON.stringify(redactCommandArgs(args))}\n`;
        fs.appendFileSync(utilLog, headers);
      } catch (e) { /* ignore log error */ }
    }

    const child = spawn(cmd, args, {
      cwd: PROJECT_ROOT,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (DEBUG_LOG_ENABLED) {
        try {
          fs.appendFileSync(utilLog, `[ERROR] Spawn Failed: ${error.message}\n`);
        } catch (e) { }
      }

      resolve({
        ok: false,
        stdout,
        stderr: error.message,
        exitCode: -1,
      });
    });

    child.on("close", (code) => {
      if (DEBUG_LOG_ENABLED) {
        try {
          fs.appendFileSync(utilLog, `[EXIT] Code: ${code}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}\n-----------------------------------\n`);
        } catch (e) { }
      }

      resolve({
        ok: code === 0,
        stdout,
        stderr,
        exitCode: code,
      });
    });
  });
}

function runPythonUtilityWithInput(extraArgs, inputText = "") {
  return new Promise((resolve) => {
    const cmd = USE_EXE_LAUNCHER ? LAUNCHER_EXE : PYTHON_CMD;
    const args = USE_EXE_LAUNCHER ? extraArgs : [LAUNCHER_SCRIPT, ...extraArgs];
    const child = spawn(cmd, args, {
      cwd: PROJECT_ROOT,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({
        ok: false,
        stdout,
        stderr: error.message,
        exitCode: -1,
      });
    });

    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        stdout,
        stderr,
        exitCode: code,
      });
    });

    if (inputText) {
      child.stdin.write(inputText);
    }
    child.stdin.end();
  });
}

app.whenReady().then(async () => {
  // === PHASE 11: INTEGRITY CHECK (ANTI-TAMPER) ===
  // Kiểm tra xem file securityConfig.js có bị sửa đổi để tắt Nuclear Mode không
  if (app.isPackaged && securityConfig.shouldRun("ENABLE_NUCLEAR_MODE")) {
    const isSecure = integrity.checkSecurityConfig(__dirname);
    if (!isSecure) {
      console.error('🚨 SECURITY BREACH DETECTED: Config Tampered');
      // Silent crash - Don't explain why
      app.exit(1);
      return;
    }
  }

  try {
    ensureLauncher();
  } catch (error) {
    dialog.showErrorBox("Thiếu file launcher", error.message);
    app.exit(1);
    return;
  }

  // Security Layer 4: Kiểm tra File Integrity (chỉ trong packaged build)
  if (app.isPackaged) {
    try {
      const result = integrity.verifyIntegrity(__dirname);

      if (!result.valid && !result.skipped) {
        console.error('[Security] File integrity check FAILED:', result.tamperedFiles);

        dialog.showMessageBoxSync({
          type: 'error',
          title: 'Lỗi bảo mật',
          message: 'Phát hiện file ứng dụng bị sửa đổi trái phép.\n\nỨng dụng sẽ đóng để bảo vệ phiên chạy hiện tại.',
          buttons: ['Đóng']
        });
        app.exit(1);
        return;
      }
    } catch (integrityError) {
      console.error('[Security] Integrity check error:', integrityError.message);
      // Không block app nếu lỗi đọc file
    }
  }

  ipcMain.handle("select-program", handleSelectProgram);
  ipcMain.handle("list-executables", async (_event, folderPath) => {
    try {
      const files = await listExecutablesInFolder(folderPath);
      return { ok: true, files };
    } catch (error) {
      return {
        ok: false,
        files: [],
        message: error.message || "Không đọc được danh sách file .exe.",
      };
    }
  });
  ipcMain.handle("select-icon-file", handleSelectIconFile);
  ipcMain.handle("launch-program", async (_event, payload) => {
    if (!payload.programPath || !payload.username) {
      return {
        ok: false,
        message: "Thiếu đường dẫn chương trình hoặc username.",
      };
    }
    return runLauncher(payload);
  });

  // Check if credential is saved for a user (by checking Windows Credential Manager)
  ipcMain.handle("has-credential", async (_event, username) => {
    if (!username) {
      return { hasCredential: false };
    }
    try {
      // Use cmdkey to check if credential exists
      const result = execFileSync("cmdkey", [`/list:${username}`], {
        encoding: "utf8",
        windowsHide: true,
      });
      // If credential exists, cmdkey returns info about it
      const hasCredential = result.includes(username) || result.includes("Target:");
      return { hasCredential };
    } catch (error) {
      // cmdkey returns error if no credential found
      return { hasCredential: false };
    }
  });

  ipcMain.handle("save-credential", async (_event, payload) => {
    const username = payload?.username || "";
    const password = payload?.password || "";
    if (!username || !password) {
      return { ok: false, hasCredential: false, message: "Thiếu username hoặc password." };
    }
    const result = await runPythonUtilityWithInput(
      ["--save-credential", username, "--password-stdin"],
      `${password}\n`
    );
    if (!result.ok) {
      return {
        ok: false,
        hasCredential: false,
        message: result.stderr.trim() || result.stdout.trim() || "Không lưu được credential.",
      };
    }
    return { ok: true, hasCredential: true };
  });

  ipcMain.handle("delete-credential", async (_event, username) => {
    if (!username) {
      return { ok: false, hasCredential: false, message: "Thiếu username." };
    }
    const result = await runPythonUtility(["--delete-credential", username]);
    if (!result.ok) {
      return {
        ok: false,
        hasCredential: false,
        message: result.stderr.trim() || result.stdout.trim() || "Không xóa được credential.",
      };
    }
    return { ok: true, hasCredential: false };
  });


  ipcMain.handle("list-tracked-users", async () => {
    const result = await runPythonUtility(["--list-tracked-users"]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không đọc được danh sách user.",
        users: [],
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return { ok: true, users: data.users || [] };
    } catch (error) {
      return {
        ok: false,
        message: "Không parse được danh sách user.",
        users: [],
      };
    }
  });

  ipcMain.handle("delete-tracked-user", async (_event, username) => {
    if (!username) {
      return {
        ok: false,
        message: "Chưa chọn user để xóa.",
      };
    }
    const result = await runPythonUtility(["--delete-tracked-user", username]);
    if (!result.ok) {
      return {
        ok: false,
        message: result.stderr.trim() || result.stdout.trim() || "Xóa user thất bại.",
      };
    }
    const message =
      result.stdout.trim() || `Đã xóa user ${username}.`;
    return { ok: true, message };
  });

  ipcMain.handle("hide-tracked-user", async (_event, username) => {
    if (!username) {
      return { ok: false, message: "Chưa chọn user." };
    }
    const result = await runPythonUtility(["--hide-user", username]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không ẩn được user (cần quyền admin).",
      };
    }
    return {
      ok: true,
      message: result.stdout.trim() || `Đã ẩn user ${username}.`,
    };
  });

  ipcMain.handle("show-tracked-user", async (_event, username) => {
    if (!username) {
      return { ok: false, message: "Chưa chọn user." };
    }
    const result = await runPythonUtility(["--show-user", username]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không hiện được user (cần quyền admin).",
      };
    }
    return {
      ok: true,
      message: result.stdout.trim() || `Đã hiện user ${username}.`,
    };
  });

  ipcMain.handle("update-user-storage-path", async (_event, { username, storagePath }) => {
    if (!username) {
      return { ok: false, message: "Chưa chọn user." };
    }
    const result = await runPythonUtility([
      "--update-user-storage",
      username,
      storagePath || "",
    ]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không cập nhật được thư mục lưu trữ.",
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return {
        ok: data.ok !== false,
        message: data.message || `Đã cập nhật thư mục lưu trữ cho ${username}.`,
      };
    } catch (_) {
      return {
        ok: true,
        message: result.stdout.trim() || `Đã cập nhật thư mục lưu trữ.`,
      };
    }
  });

  ipcMain.handle("toggle-startup", async (_event, payload) => {
    if (!payload || !payload.appId) {
      return { ok: false, message: "Thiếu appId." };
    }
    const result = await runPythonUtility(["--toggle-startup", payload.appId]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không cập nhật được chế độ khởi động.",
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return {
        ok: true,
        enabled: Boolean(data.enabled),
        message: data.message || "Đã cập nhật chế độ khởi động.",
      };
    } catch (_) {
      return {
        ok: true,
        enabled: undefined,
        message: result.stdout.trim() || "Đã cập nhật chế độ khởi động.",
      };
    }
  });

  ipcMain.handle("select-folder", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    if (canceled || filePaths.length === 0) {
      return null;
    }
    return filePaths[0];
  });

  ipcMain.handle("check-admin", async () => {
    return { ok: true, admin: isRunningAsAdmin() };
  });

  ipcMain.handle("app:get-version", async () => {
    return { ok: true, version: app.getVersion() };
  });

  ipcMain.handle("app:resolve-asset-url", async (_event, relativePath) => {
    try {
      const normalized = String(relativePath || "")
        .replace(/^[./\\]+/, "")
        .replace(/\\/g, "/");
      if (!normalized || normalized.includes("..") || !normalized.startsWith("assets/")) {
        return { ok: false, url: "" };
      }
      const assetPath = app.isPackaged
        ? path.join(process.resourcesPath, normalized)
        : path.join(__dirname, normalized);
      if (!fs.existsSync(assetPath)) {
        return { ok: false, url: "" };
      }
      return { ok: true, url: pathToFileURL(assetPath).toString() };
    } catch (_) {
      return { ok: false, url: "" };
    }
  });

  ipcMain.handle("app:open-external-url", async (_event, url) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (_) {
      return { ok: false, message: "Link không hợp lệ hoặc chưa được cho phép." };
    }
    if (parsedUrl.protocol !== "https:") {
      return { ok: false, message: "Chỉ cho phép mở link https." };
    }
    await shell.openExternal(parsedUrl.toString());
    return { ok: true };
  });

  ipcMain.handle("update:get-state", async () => {
    return { ok: true, state: updateService.getState() };
  });

  ipcMain.handle("update:check", async () => {
    const state = await updateService.checkForUpdates({ currentVersion: app.getVersion() });
    return { ok: state.status !== updateService.UPDATE_STATE.ERROR, ...state };
  });

  ipcMain.handle("update:download", async (_event, payload) => {
    const state = await updateService.downloadUpdate({
      downloadUrl: payload?.downloadUrl,
      latestVersion: payload?.latestVersion,
      checksumUrl: payload?.checksumUrl,
      updatesDir: UPDATE_CACHE_DIR,
    });
    return { ok: state.status !== updateService.UPDATE_STATE.ERROR, ...state };
  });

  ipcMain.handle("update:install", async (_event, payload) => {
    const state = await updateService.installDownloadedUpdate({
      filePath: payload?.filePath,
      updatesDir: UPDATE_CACHE_DIR,
    });
    if (state.status === updateService.UPDATE_STATE.INSTALLING) {
      setTimeout(() => app.quit(), 800);
    }
    return { ok: state.status !== updateService.UPDATE_STATE.ERROR, ...state };
  });

  ipcMain.handle("get-clone-flags", async () => {
    const result = await runPythonUtility(["--list-clone-flags"]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không lấy được trạng thái clone.",
        flags: {},
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return { ok: true, flags: data.flags || {} };
    } catch (error) {
      return { ok: false, message: "Không parse được trạng thái clone.", flags: {} };
    }
  });

  ipcMain.handle("delete-clone-folder", async (_event, folderPath) => {
    if (!folderPath) {
      return { ok: false, message: "Chưa chọn thư mục clone." };
    }
    const normalized = folderPath.trim();
    const result = await runPythonUtility(["--delete-clone-folder", normalized]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không xóa được thư mục clone.",
      };
    }
    return { ok: true, message: result.stdout.trim() || "Đã xóa thư mục clone." };
  });

  ipcMain.handle("get-app-settings", async () => {
    return { ok: true, settings: appSettings };
  });

  ipcMain.handle("update-app-settings", async (_event, patch) => {
    if (!patch || typeof patch !== "object") {
      return { ok: false, message: "Dữ liệu không hợp lệ." };
    }
    if (patch.launchMode && !["window", "tray"].includes(patch.launchMode)) {
      patch.launchMode = appSettings.launchMode;
    }
    appSettings = {
      ...appSettings,
      ...patch,
    };
    writeAppSettings(appSettings);
    applyAutoLaunchSetting();
    refreshTrayState();
    if (appSettings.launchMode === "window" && mainWindow && !mainWindow.isVisible()) {
      showMainWindow();
    }
    return { ok: true, settings: appSettings };
  });

  ipcMain.handle("create-clone-shortcut", async (_event, payload) => {
    try {
      const shortcutPath = createCloneShortcutFile(payload || {});
      return {
        ok: true,
        shortcutPath,
        message: `Đã tạo shortcut tại ${shortcutPath}`,
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Không tạo được shortcut.",
      };
    }
  });

  ipcMain.handle("clone-app", async (_event, payload) => {
    if (!payload || !payload.sourcePath || !payload.username) {
      return { ok: false, message: "Chưa chọn user hoặc đường dẫn app." };
    }
    const cloneRoot = (payload.cloneRoot || "").trim();
    if (!cloneRoot) {
      return { ok: false, message: "Chưa chọn thư mục lưu clone." };
    }
    const args = [
      payload.sourcePath,
      "--username",
      payload.username,
      "--clone-to",
      cloneRoot,
    ];
    if (payload.cloneName) {
      args.push("--clone-name", payload.cloneName);
    }
    if (payload.force) {
      args.push("--force-clone");
    }
    args.push("--clone-only");
    const result = await runPythonUtility(args);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không clone được app.",
      };
    }
    const stdout = result.stdout.trim();
    if (stdout) {
      try {
        const details = JSON.parse(stdout);
        return {
          ok: true,
          message: `Đã tạo app tại ${details.clone_path || cloneRoot}.`,
          details,
        };
      } catch (_) {
        /* ignore */
      }
    }
    return { ok: true, message: stdout || "Đã clone app." };
  });

  ipcMain.handle("create-local-user", async (_event, payload) => {
    if (!payload?.username) {
      return { ok: false, message: "Chưa nhập username." };
    }
    if (!payload?.password) {
      return { ok: false, message: "Chưa nhập password." };
    }
    const args = [
      "--create-user",
      payload.username,
      "--password-stdin",
    ];
    // Accept both profileDir and userDataPath for custom data path
    const customProfilePath = payload.profileDir || payload.userDataPath;
    if (customProfilePath) {
      args.push("--user-data-dir", customProfilePath);
    }
    const result = await runPythonUtilityWithInput(args, `${payload.password}\n`);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không tạo được Profile.",
      };
    }
    const stdout = result.stdout.trim();
    try {
      const data = JSON.parse(stdout || "{}");
      if (!data.ok || !data.profileReady) {
        return {
          ok: false,
          message: data.message || "Đã tạo user nhưng Profile chưa sẵn sàng.",
          details: data,
        };
      }
      return {
        ok: true,
        message: data.message || `Đã tạo Profile ${payload.username}.`,
        details: data,
      };
    } catch (_error) {
      return { ok: true, message: stdout || "Đã tạo Profile." };
    }
  });

  ipcMain.handle("update-user-default-proxy", async (_event, payload) => {
    if (!payload?.username) {
      return { ok: false, message: "Chưa nhập username." };
    }
    const defaultProxy = payload.defaultProxy || "";
    const args = [
      "--update-user-proxy",
      payload.username,
      defaultProxy,
    ];
    const result = await runPythonUtility(args);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không cập nhật được proxy.",
      };
    }
    return { ok: true, message: result.stdout.trim() || "Đã cập nhật proxy." };
  });

  ipcMain.handle("delete-clone-app", async (_event, payload) => {
    const appId = typeof payload === "string" ? payload : payload?.appId;
    const cloneDetails = typeof payload === "object" ? payload.clone || {} : {};
    if (!appId) {
      return { ok: false, message: "Chưa chọn app để gỡ." };
    }
    const result = await runPythonUtility(["--delete-app", appId]);
    const errMsg = result.stderr.trim() || result.stdout.trim();
    if (!result.ok && !errMsg.includes("Không tìm thấy app")) {
      return {
        ok: false,
        message:
          errMsg ||
          "Không gỡ được app.",
      };
    }
    if (cloneDetails) {
      try {
        const displayName =
          cloneDetails.displayName || cloneDetails.name || cloneDetails.username || "";
        const shortcutPath = resolveShortcutPath(displayName);
        if (fs.existsSync(shortcutPath)) {
          fs.unlinkSync(shortcutPath);
        }
        if (cloneDetails.execPath) {
          const folder = path.dirname(cloneDetails.execPath);
          if (fs.existsSync(folder)) {
            const slug = slugifyLabel(displayName || cloneDetails.username || appId);
            const files = fs.readdirSync(folder);
            files
              .filter(
                (f) =>
                  f.toLowerCase().startsWith(`run-clone-${slug}`) &&
                  (f.toLowerCase().endsWith(".bat") || f.toLowerCase().endsWith(".vbs"))
              )
              .forEach((f) => {
                try {
                  fs.unlinkSync(path.join(folder, f));
                } catch (_) {
                  /* ignore */
                }
              });
          }
        }
      } catch (error) {
        console.warn("Không xóa được shortcut:", error);
      }
    }
    return { ok: true, message: result.stdout.trim() || "Đã gỡ app." };
  });

  ipcMain.handle("register-tracked-clone", async (_event, payload) => {
    if (!payload || !payload.username || !payload.execPath) {
      return { ok: false, message: "Chưa chọn user hoặc exe." };
    }
    const args = ["--set-clone-path", payload.username, payload.execPath];
    if (payload.appId) {
      args.push(payload.appId);
    }
    const result = await runPythonUtility(args);
    if (!result.ok) {
      return {
        ok: false,
        message: result.stderr.trim() || result.stdout.trim() || "Không lưu được đường dẫn clone.",
      };
    }
    return { ok: true, message: result.stdout.trim() || "Đã cập nhật clone." };
  });

  ipcMain.handle("list-tracked-clones", async () => {
    const result = await runPythonUtility(["--list-tracked-clones"]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Không đọc được danh sách clone.",
        clones: [],
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return { ok: true, clones: data.clones || [] };
    } catch (error) {
      return {
        ok: false,
        message: "Không parse được danh sách clone.",
        clones: [],
      };
    }
  });

  ipcMain.handle("load-app-icon", async (_event, filePath) => {
    if (!filePath) {
      return null;
    }
    try {
      let image = nativeImage.createFromPath(filePath);
      if (image.isEmpty()) {
        const ext = path.extname(filePath).toLowerCase();
        if ([".exe", ".lnk", ".ico"].includes(ext)) {
          try {
            image = await app.getFileIcon(filePath, { size: "normal" });
          } catch (_) {
            /* ignore */
          }
        }
      }
      if (image.isEmpty()) {
        return null;
      }
      return image.resize({ width: 64, height: 64 }).toDataURL();
    } catch (error) {
      return null;
    }
  });



  ipcMain.handle("load-presets", async () => {
    try {
      return { ok: true, presets: readPresetFile() };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Không đọc được danh sách preset.",
        presets: [],
      };
    }
  });

  ipcMain.handle("save-presets", async (_event, presets) => {
    if (!Array.isArray(presets)) {
      return { ok: false, message: "Dữ liệu preset không hợp lệ." };
    }
    try {
      writePresetFile(presets);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Không lưu được preset.",
      };
    }
  });

  ipcMain.handle("load-clone-overrides", async () => {
    try {
      return { ok: true, overrides: readCloneOverrides() };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Không đọc được overrides.",
        overrides: {},
      };
    }
  });

  ipcMain.handle("update-clone-override", async (_event, payload) => {
    if (!payload || !payload.appId) {
      return { ok: false, message: "Thiếu thông tin app." };
    }
    try {
      const updated = updateCloneOverride(payload.appId, payload);
      return { ok: true, override: updated };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Không cập nhật được override.",
      };
    }
  });

  ipcMain.handle("get-groups", async () => {
    try {
      return { ok: true, groups: readGroups() };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Không đọc được danh sách group.",
        groups: [],
      };
    }
  });

  ipcMain.handle("save-groups", async (_event, groups) => {
    if (!Array.isArray(groups)) {
      return { ok: false, message: "Dữ liệu groups không hợp lệ." };
    }
    try {
      writeGroups(groups);
      return { ok: true, groups };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Không lưu được groups.",
      };
    }
  });



  ipcMain.handle("terminate-clone", async (_event, username) => {
    return terminateCloneProcesses(username);
  });

  ipcMain.handle("check-clone-status", async (_event, clones) => {
    const response = {};
    if (!Array.isArray(clones) || !clones.length) {
      return { ok: true, statuses: response };
    }
    const targets = [];
    clones.forEach((item, index) => {
      const key = item?.id || item?.username || `clone-${index}`;
      response[key] = false;
      const username = item?.username;
      if (!username) {
        return;
      }
      const execPath = item?.exec_path || "";
      const execDir = execPath ? path.dirname(execPath) : "";
      targets.push({
        key,
        username,
        userLower: username.toLowerCase(),
        execLower: normalizePathLower(execPath),
        rootLower: normalizePathLower(execDir),
        exeLower: execPath ? path.basename(execPath).toLowerCase() : "",
      });
    });
    if (!targets.length) {
      return { ok: true, statuses: response };
    }
    try {
      const statusByKey = await queryRunningByUser(targets);
      console.log("[check-clone-status] targets:", targets);
      console.log("[check-clone-status] raw result:", statusByKey);
      for (const [appKey, isRunning] of Object.entries(statusByKey || {})) {
        if (typeof isRunning === "boolean") {
          response[appKey] = isRunning;
        }
      }
    } catch (error) {
      console.warn("[check-clone-status] failed:", error);
    }
    return { ok: true, statuses: response };
  });

  // === LICENSE HANDLERS ===
  ipcMain.handle("license:verify", async () => {
    return await licenseService.verifyLicense();
  });

  ipcMain.handle("license:getStatus", async () => {
    return licenseService.getLicenseStatus();
  });

  applyAutoLaunchSetting();

  mainWindow = createWindow();
  refreshTrayState();

  app.on("activate", () => {
    if (!mainWindow) {
      mainWindow = createWindow();
      refreshTrayState();
    } else {
      showMainWindow();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || isQuitting || appSettings.launchMode !== "tray") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
function terminateCloneProcesses(username) {
  return new Promise((resolve) => {
    if (!username) {
      resolve({ ok: false, message: "Missing username." });
      return;
    }
    const filter = username.replace(/"/g, '""');
    const child = spawn(
      "taskkill",
      ["/FI", `USERNAME eq ${filter}`, "/IM", "Zalo.exe", "/F"],
      {
        windowsHide: true,
      }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ ok: false, message: error.message });
    });
    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        message:
          code === 0
            ? stdout.trim() || `Đã kết thúc các tiến trình của ${username}.`
            : stderr.trim() || "Không thể kết thúc tiến trình.",
      });
    });
  });
}
function resolveShortcutPath(displayName) {
  const desktopDir = app.getPath("desktop");
  const shortcutName = safeFileName(`${displayName} - Clone App`);
  return path.join(desktopDir, `${shortcutName}.lnk`);
}
