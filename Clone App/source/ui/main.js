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
const { spawn, execSync } = require("child_process");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const LAUNCHER_SCRIPT = path.join(
  PROJECT_ROOT,
  "launcher",
  "runas_launcher.py"
);
const CREATED_USERS_FILE = path.join(
  PROJECT_ROOT,
  "launcher",
  "created_users.json"
);
const DATA_ROOT = path.join(PROJECT_ROOT, "ui-data");
const CACHE_DIR = path.join(DATA_ROOT, "cache");
const TEMP_DIR = path.join(DATA_ROOT, "temp");
const USER_DATA_DIR = path.join(DATA_ROOT, "userdata");
const PRESET_FILE = path.join(DATA_ROOT, "presets.json");
const CLONE_OVERRIDES_FILE = path.join(DATA_ROOT, "clone_overrides.json");
const APP_SETTINGS_FILE = path.join(DATA_ROOT, "app_settings.json");
const GROUPS_FILE = path.join(DATA_ROOT, "groups.json");
function resolveAssetPath(...segments) {
  const base = app?.isPackaged ? process.resourcesPath : __dirname;
  return path.join(base, ...segments);
}

const APP_ICON_PATH = resolveAssetPath("assets", "icon.ico");
const PYTHON_CMD = process.env.PYTHON_CMD || "python";
const DEFAULT_APP_SETTINGS = {
  autoLaunch: false,
  launchMode: "window",
};

function ensureDataDirectories() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
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
  return cleaned || "Run Clone App";
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
      tray.setToolTip("Run Clone App");
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

function createWindow() {
  const shouldStartHidden = appSettings.launchMode === "tray";
  const win = new BrowserWindow({
    width: 1050,
    height: 720,
    show: false, // Wait to maximize
    skipTaskbar: shouldStartHidden,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow loading local images
    },
  });

  win.removeMenu();
  win.loadFile(path.join(__dirname, "index.html"));
  registerDevToolsShortcut(win);

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
  if (!fs.existsSync(LAUNCHER_SCRIPT)) {
    throw new Error(`Cannot find launcher script at ${LAUNCHER_SCRIPT}`);
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
    throw new Error("Khong truy cap duoc thu muc.");
  }
  if (!stats.isDirectory()) {
    return [];
  }
  let entries = [];
  try {
    entries = await fs.promises.readdir(cleaned, { withFileTypes: true });
  } catch (error) {
    throw new Error("Khong doc duoc danh sach tep.");
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
  return new Promise((resolve) => {
    // DEBUG: Trace execution
    const debugLog = path.join(PROJECT_ROOT, "launcher_exec.log");
    const args = [LAUNCHER_SCRIPT, payload.programPath, "--username", payload.username];

    try {
      fs.appendFileSync(debugLog, `\n\n[${new Date().toISOString()}] Attempting to launch:\nCMD: ${PYTHON_CMD}\nSCRIPT: ${LAUNCHER_SCRIPT}\nPAYLOAD: ${JSON.stringify(payload)}\n`);
    } catch (e) { }

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
      // Note: Python auto-saves credential when password is provided via stdin
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
    const child = spawn(PYTHON_CMD, args, {
      cwd: PROJECT_ROOT,
      windowsHide: hasPasswordFromDialog, // Hide if using custom dialog
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
        message: `Không thể chạy Python (${PYTHON_CMD}): ${error.message}`,
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
  const python = PYTHON_CMD.includes(" ") ? `"${PYTHON_CMD}"` : PYTHON_CMD;
  let commandLine = `${python} "${LAUNCHER_SCRIPT}" "${clone.execPath}" --username "${clone.username}"`;

  // Dynamic Proxy: Pass config path so launcher reads latest proxy at runtime
  commandLine += ` --config-path "${CLONE_OVERRIDES_FILE}"`;
  // payload.appId is passed from renderer
  if (clone.appId) {
    commandLine += ` --app-id "${clone.appId}"`;
  }

  // Force save credential to ensure password is strictly cached and used
  commandLine += ` --save-credential`;

  const batContent = `@echo off\r\ncd /d "${PROJECT_ROOT}"\r\n${commandLine}\r\n`;
  fs.writeFileSync(batPath, batContent, "utf-8");

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
    description: `Chạy ${displayName} bằng Run Clone App`,
  });
  if (!success) {
    throw new Error("Không tạo được shortcut trên Desktop.");
  }
  return shortcutPath;
}

function runPythonUtility(extraArgs) {
  return new Promise((resolve) => {
    const child = spawn(PYTHON_CMD, [LAUNCHER_SCRIPT, ...extraArgs], {
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
  });
}

app.whenReady().then(() => {
  try {
    ensureLauncher();
  } catch (error) {
    dialog.showErrorBox("Thiếu file launcher", error.message);
    app.exit(1);
    return;
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
        message: error.message || "Khong doc duoc danh sach file .exe.",
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
      const result = require("child_process").execSync(
        `cmdkey /list:${username}`,
        { encoding: "utf8", windowsHide: true }
      );
      // If credential exists, cmdkey returns info about it
      const hasCredential = result.includes(username) || result.includes("Target:");
      return { hasCredential };
    } catch (error) {
      // cmdkey returns error if no credential found
      return { hasCredential: false };
    }
  });


  ipcMain.handle("list-tracked-users", async () => {
    const result = await runPythonUtility(["--list-tracked-users"]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Khong doc duoc danh sach user.",
        users: [],
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return { ok: true, users: data.users || [] };
    } catch (error) {
      return {
        ok: false,
        message: "Khong parse duoc danh sach user.",
        users: [],
      };
    }
  });

  ipcMain.handle("delete-tracked-user", async (_event, username) => {
    if (!username) {
      return {
        ok: false,
        message: "Chua chon user de xoa.",
      };
    }
    const result = await runPythonUtility(["--delete-tracked-user", username]);
    if (!result.ok) {
      return {
        ok: false,
        message: result.stderr.trim() || result.stdout.trim() || "Xoa user that bai.",
      };
    }
    const message =
      result.stdout.trim() || `Da xoa user ${username}.`;
    return { ok: true, message };
  });

  ipcMain.handle("hide-tracked-user", async (_event, username) => {
    if (!username) {
      return { ok: false, message: "Chua chon user." };
    }
    const result = await runPythonUtility(["--hide-user", username]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Khong an duoc user (can quyen admin).",
      };
    }
    return {
      ok: true,
      message: result.stdout.trim() || `Da an user ${username}.`,
    };
  });

  ipcMain.handle("show-tracked-user", async (_event, username) => {
    if (!username) {
      return { ok: false, message: "Chua chon user." };
    }
    const result = await runPythonUtility(["--show-user", username]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Khong hien duoc user (can quyen admin).",
      };
    }
    return {
      ok: true,
      message: result.stdout.trim() || `Da hien user ${username}.`,
    };
  });

  ipcMain.handle("update-user-storage-path", async (_event, { username, storagePath }) => {
    if (!username) {
      return { ok: false, message: "Chua chon user." };
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
          "Khong cap nhat duoc thu muc luu tru.",
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return {
        ok: data.ok !== false,
        message: data.message || `Da cap nhat thu muc luu tru cho ${username}.`,
      };
    } catch (_) {
      return {
        ok: true,
        message: result.stdout.trim() || `Da cap nhat thu muc luu tru.`,
      };
    }
  });

  ipcMain.handle("toggle-startup", async (_event, payload) => {
    if (!payload || !payload.appId) {
      return { ok: false, message: "Thieu appId." };
    }
    const result = await runPythonUtility(["--toggle-startup", payload.appId]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Khong cap nhat duoc che do khoi dong.",
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return {
        ok: true,
        enabled: Boolean(data.enabled),
        message: data.message || "Da cap nhat che do khoi dong.",
      };
    } catch (_) {
      return {
        ok: true,
        enabled: undefined,
        message: result.stdout.trim() || "Da cap nhat che do khoi dong.",
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

  ipcMain.handle("get-clone-flags", async () => {
    const result = await runPythonUtility(["--list-clone-flags"]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Khong lay duoc trang thai clone.",
        flags: {},
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return { ok: true, flags: data.flags || {} };
    } catch (error) {
      return { ok: false, message: "Khong parse duoc trang thai clone.", flags: {} };
    }
  });

  ipcMain.handle("delete-clone-folder", async (_event, folderPath) => {
    if (!folderPath) {
      return { ok: false, message: "Chua chon thu muc clone." };
    }
    const normalized = folderPath.trim();
    const result = await runPythonUtility(["--delete-clone-folder", normalized]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Khong xoa duoc thu muc clone.",
      };
    }
    return { ok: true, message: result.stdout.trim() || "Da xoa thu muc clone." };
  });

  ipcMain.handle("get-app-settings", async () => {
    return { ok: true, settings: appSettings };
  });

  ipcMain.handle("update-app-settings", async (_event, patch) => {
    if (!patch || typeof patch !== "object") {
      return { ok: false, message: "Du lieu khong hop le." };
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
      return { ok: false, message: "Chua chon user hoac duong dan app." };
    }
    const cloneRoot = (payload.cloneRoot || "").trim();
    if (!cloneRoot) {
      return { ok: false, message: "Chua chon thu muc luu clone." };
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
          "Khong clone duoc app.",
      };
    }
    const stdout = result.stdout.trim();
    if (stdout) {
      try {
        const details = JSON.parse(stdout);
        return {
          ok: true,
          message: `Da tao app tai ${details.clone_path || cloneRoot}.`,
          details,
        };
      } catch (_) {
        /* ignore */
      }
    }
    return { ok: true, message: stdout || "Da clone app." };
  });

  ipcMain.handle("create-local-user", async (_event, payload) => {
    if (!payload?.username) {
      return { ok: false, message: "Chua nhap username." };
    }
    if (!payload?.password) {
      return { ok: false, message: "Chua nhap password." };
    }
    const args = [
      "--create-user",
      payload.username,
      "--password",
      payload.password,
    ];
    // Accept both profileDir and userDataPath for custom data path
    const customProfilePath = payload.profileDir || payload.userDataPath;
    if (customProfilePath) {
      args.push("--user-data-dir", customProfilePath);
    }
    const result = await runPythonUtility(args);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Khong tao duoc user.",
      };
    }
    return { ok: true, message: result.stdout.trim() || "Da tao user." };
  });

  ipcMain.handle("update-user-default-proxy", async (_event, payload) => {
    if (!payload?.username) {
      return { ok: false, message: "Chua nhap username." };
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
          "Khong cap nhat duoc proxy.",
      };
    }
    return { ok: true, message: result.stdout.trim() || "Da cap nhat proxy." };
  });

  ipcMain.handle("delete-clone-app", async (_event, payload) => {
    const appId = typeof payload === "string" ? payload : payload?.appId;
    const cloneDetails = typeof payload === "object" ? payload.clone || {} : {};
    if (!appId) {
      return { ok: false, message: "Chua chon app de go." };
    }
    const result = await runPythonUtility(["--delete-app", appId]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Khong go duoc app.",
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
    return { ok: true, message: result.stdout.trim() || "Da go app." };
  });

  ipcMain.handle("register-tracked-clone", async (_event, payload) => {
    if (!payload || !payload.username || !payload.execPath) {
      return { ok: false, message: "Chua chon user hoac exe." };
    }
    const args = ["--set-clone-path", payload.username, payload.execPath];
    if (payload.appId) {
      args.push(payload.appId);
    }
    const result = await runPythonUtility(args);
    if (!result.ok) {
      return {
        ok: false,
        message: result.stderr.trim() || result.stdout.trim() || "Khong luu duoc duong dan clone.",
      };
    }
    return { ok: true, message: result.stdout.trim() || "Da cap nhat clone." };
  });

  ipcMain.handle("list-tracked-clones", async () => {
    const result = await runPythonUtility(["--list-tracked-clones"]);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          result.stdout.trim() ||
          "Khong doc duoc danh sach clone.",
        clones: [],
      };
    }
    try {
      const data = JSON.parse(result.stdout || "{}");
      return { ok: true, clones: data.clones || [] };
    } catch (error) {
      return {
        ok: false,
        message: "Khong parse duoc danh sach clone.",
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
        message: error.message || "Khong doc duoc danh sach preset.",
        presets: [],
      };
    }
  });

  ipcMain.handle("save-presets", async (_event, presets) => {
    if (!Array.isArray(presets)) {
      return { ok: false, message: "Du lieu preset khong hop le." };
    }
    try {
      writePresetFile(presets);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Khong luu duoc preset.",
      };
    }
  });

  ipcMain.handle("load-clone-overrides", async () => {
    try {
      return { ok: true, overrides: readCloneOverrides() };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Khong doc duoc overrides.",
        overrides: {},
      };
    }
  });

  ipcMain.handle("update-clone-override", async (_event, payload) => {
    if (!payload || !payload.appId) {
      return { ok: false, message: "Thieu thong tin app." };
    }
    try {
      const updated = updateCloneOverride(payload.appId, payload);
      return { ok: true, override: updated };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Khong cap nhat duoc override.",
      };
    }
  });

  ipcMain.handle("get-groups", async () => {
    try {
      return { ok: true, groups: readGroups() };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Khong doc duoc danh sach group.",
        groups: [],
      };
    }
  });

  ipcMain.handle("save-groups", async (_event, groups) => {
    if (!Array.isArray(groups)) {
      return { ok: false, message: "Du lieu groups khong hop le." };
    }
    try {
      writeGroups(groups);
      return { ok: true, groups };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Khong luu duoc groups.",
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
  const shortcutName = safeFileName(`${displayName} - Run Clone App`);
  return path.join(desktopDir, `${shortcutName}.lnk`);
}
