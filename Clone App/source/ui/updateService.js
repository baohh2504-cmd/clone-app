const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { net } = require("electron");

const UPDATE_STATE = {
  IDLE: "idle",
  CHECKING: "checking",
  AVAILABLE: "available",
  DOWNLOADING: "downloading",
  DOWNLOADED: "downloaded",
  INSTALLING: "installing",
  ERROR: "error",
};

const DEFAULT_CONFIG = {
  owner: process.env.RUN_CLONE_UPDATE_OWNER || "baohh2504-cmd",
  repo: process.env.RUN_CLONE_UPDATE_REPO || "clone-app",
  assetPattern: /CloneApp-Setup-.*\.exe$/i,
  allowedHosts: ["github.com", "api.github.com", "objects.githubusercontent.com"],
};

let state = {
  status: UPDATE_STATE.IDLE,
  currentVersion: "",
  latestVersion: "",
  message: "",
  downloadUrl: "",
  checksumUrl: "",
  expectedSha256: "",
  downloadedSha256: "",
  verified: false,
  releaseUrl: "",
  downloadedFile: "",
  progress: 0,
};

function setState(patch) {
  state = { ...state, ...(patch || {}) };
  return getState();
}

function getState() {
  return { ...state };
}

function normalizeVersion(version) {
  return String(version || "")
    .trim()
    .replace(/^v/i, "")
    .split("-")[0];
}

function compareVersions(a, b) {
  const left = normalizeVersion(a).split(".").map((part) => parseInt(part, 10) || 0);
  const right = normalizeVersion(b).split(".").map((part) => parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length, 3);
  for (let index = 0; index < length; index += 1) {
    const av = left[index] || 0;
    const bv = right[index] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function isConfigured(config) {
  return Boolean(config.owner && config.repo);
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: "GET",
      url,
      redirect: "manual",
    });
    request.setHeader("User-Agent", "CloneApp-Updater");
    request.setHeader("Accept", "application/vnd.github+json");
    request.on("redirect", (_statusCode, _method, redirectUrl) => {
      if (!validateExternalUrl(redirectUrl)) {
        reject(new Error("GitHub chuyển hướng tới link không hợp lệ."));
        return;
      }
      request.followRedirect();
    });

    let body = "";
    request.on("response", (response) => {
      response.on("data", (chunk) => {
        body += chunk.toString("utf8");
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`GitHub trả về HTTP ${response.statusCode}.`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (_) {
          reject(new Error("Không đọc được dữ liệu cập nhật từ GitHub."));
        }
      });
    });
    request.on("error", reject);
    request.end();
  });
}

function findInstallerAsset(release, config) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  return assets.find((asset) => config.assetPattern.test(asset?.name || "")) ||
    assets.find((asset) => /\.exe$/i.test(asset?.name || ""));
}

function findChecksumAsset(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  return assets.find((asset) => /^checksums\.txt$/i.test(asset?.name || "")) ||
    assets.find((asset) => /checksum/i.test(asset?.name || "") && /\.txt$/i.test(asset?.name || ""));
}

function validateExternalUrl(rawUrl, config = DEFAULT_CONFIG) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    return config.allowedHosts.includes(parsed.hostname) || parsed.hostname.endsWith(".githubusercontent.com");
  } catch (_) {
    return false;
  }
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: "GET",
      url,
      redirect: "manual",
    });
    request.setHeader("User-Agent", "CloneApp-Updater");
    request.on("redirect", (_statusCode, _method, redirectUrl) => {
      if (!validateExternalUrl(redirectUrl)) {
        reject(new Error("GitHub chuyển hướng tới link checksum không hợp lệ."));
        return;
      }
      request.followRedirect();
    });

    let body = "";
    request.on("response", (response) => {
      response.on("data", (chunk) => {
        body += chunk.toString("utf8");
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`GitHub trả về HTTP ${response.statusCode} khi tải checksum.`));
          return;
        }
        resolve(body);
      });
    });
    request.on("error", reject);
    request.end();
  });
}

function calculateSha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function parseChecksumText(text, filename) {
  const wanted = path.basename(filename || "").toLowerCase();
  for (const line of String(text || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/\b([a-f0-9]{64})\b/i);
    if (!match) continue;
    const lower = trimmed.toLowerCase();
    if (!wanted || lower.includes(wanted)) {
      return match[1].toLowerCase();
    }
  }
  return "";
}

async function checkForUpdates({ currentVersion, config = DEFAULT_CONFIG } = {}) {
  const effectiveConfig = { ...DEFAULT_CONFIG, ...(config || {}) };
  setState({ status: UPDATE_STATE.CHECKING, currentVersion, message: "Đang kiểm tra cập nhật..." });

  try {
    if (!isConfigured(effectiveConfig)) {
      return setState({
        status: UPDATE_STATE.ERROR,
        currentVersion,
        latestVersion: "",
        hasUpdate: false,
        downloadUrl: "",
        checksumUrl: "",
        expectedSha256: "",
        downloadedSha256: "",
        verified: false,
        releaseUrl: "",
        downloadedFile: "",
        progress: 0,
        message: "Chưa cấu hình GitHub owner/repo cho cập nhật.",
      });
    }

    const release = await requestJson(`https://api.github.com/repos/${effectiveConfig.owner}/${effectiveConfig.repo}/releases/latest`);
    const latestVersion = normalizeVersion(release.tag_name || release.name || "");
    const current = normalizeVersion(currentVersion);
    const asset = findInstallerAsset(release, effectiveConfig);
    const checksumAsset = findChecksumAsset(release);
    const hasUpdate = compareVersions(latestVersion, current) > 0;
    const downloadUrl = asset?.browser_download_url || "";
    const checksumUrl = checksumAsset?.browser_download_url || "";

    if (hasUpdate && !downloadUrl) {
      return setState({
        status: UPDATE_STATE.ERROR,
        currentVersion: current,
        latestVersion,
        releaseName: release.name || release.tag_name || "",
        releaseNotes: release.body || "",
        releaseUrl: release.html_url || "",
        message: "Có bản mới nhưng release chưa có file .exe.",
      });
    }

    return setState({
      status: hasUpdate ? UPDATE_STATE.AVAILABLE : UPDATE_STATE.IDLE,
      currentVersion: current,
      latestVersion,
      hasUpdate,
      releaseName: release.name || release.tag_name || "",
      releaseNotes: release.body || "",
      downloadUrl: hasUpdate ? downloadUrl : "",
      checksumUrl: hasUpdate ? checksumUrl : "",
      expectedSha256: "",
      downloadedSha256: "",
      verified: false,
      releaseUrl: release.html_url || "",
      downloadedFile: "",
      progress: 0,
      message: hasUpdate ? "Đã tìm thấy phiên bản mới." : "Bạn đang dùng phiên bản mới nhất.",
    });
  } catch (error) {
    return setState({
      status: UPDATE_STATE.ERROR,
      currentVersion,
      hasUpdate: false,
      downloadUrl: "",
      checksumUrl: "",
      expectedSha256: "",
      downloadedSha256: "",
      verified: false,
      downloadedFile: "",
      progress: 0,
      message: error.message || "Kiểm tra cập nhật thất bại.",
    });
  }
}

function safeInstallerName(url, latestVersion) {
  try {
    const parsed = new URL(url);
    const base = path.basename(decodeURIComponent(parsed.pathname));
    if (/\.exe$/i.test(base)) return base.replace(/[<>:"/\\|?*]/g, "");
  } catch (_) {
    return `CloneApp-Setup-${normalizeVersion(latestVersion) || "latest"}.exe`;
  }
  return `CloneApp-Setup-${normalizeVersion(latestVersion) || "latest"}.exe`;
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const request = net.request({ method: "GET", url, redirect: "manual" });
    const file = fs.createWriteStream(destination);
    let received = 0;
    let total = 0;
    request.on("redirect", (_statusCode, _method, redirectUrl) => {
      if (!validateExternalUrl(redirectUrl)) {
        file.close();
        fs.rmSync(destination, { force: true });
        reject(new Error("GitHub chuyển hướng tới link tải không hợp lệ."));
        return;
      }
      request.followRedirect();
    });

    request.on("response", (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        file.close();
        fs.rmSync(destination, { force: true });
        reject(new Error(`Tải update thất bại HTTP ${response.statusCode}.`));
        return;
      }

      total = parseInt(response.headers["content-length"], 10) || 0;
      response.on("data", (chunk) => {
        received += chunk.length;
        if (total > 0) {
          setState({ progress: Math.min(99, Math.round((received / total) * 100)) });
        }
      });
      response.pipe(file);
    });

    file.on("finish", () => {
      file.close(() => resolve(destination));
    });
    file.on("error", (error) => {
      fs.rmSync(destination, { force: true });
      reject(error);
    });
    request.on("error", (error) => {
      fs.rmSync(destination, { force: true });
      reject(error);
    });
    request.end();
  });
}

async function downloadUpdate({ downloadUrl, latestVersion, updatesDir, checksumUrl, config = DEFAULT_CONFIG } = {}) {
  const effectiveConfig = { ...DEFAULT_CONFIG, ...(config || {}) };
  try {
    if (!downloadUrl || !validateExternalUrl(downloadUrl, effectiveConfig)) {
      return setState({ status: UPDATE_STATE.ERROR, message: "Link tải update không hợp lệ." });
    }
    const effectiveChecksumUrl = checksumUrl || state.checksumUrl || "";
    if (!effectiveChecksumUrl || !validateExternalUrl(effectiveChecksumUrl, effectiveConfig)) {
      return setState({ status: UPDATE_STATE.ERROR, message: "Release chưa có checksum SHA256 hợp lệ." });
    }
    fs.mkdirSync(updatesDir, { recursive: true });
    const filename = safeInstallerName(downloadUrl, latestVersion);
    const destination = path.join(updatesDir, filename);

    setState({ status: UPDATE_STATE.DOWNLOADING, progress: 0, message: "Đang tải bản cập nhật..." });
    await downloadFile(downloadUrl, destination);

    const stat = fs.statSync(destination);
    if (!/\.exe$/i.test(destination) || stat.size <= 0) {
      fs.rmSync(destination, { force: true });
      return setState({ status: UPDATE_STATE.ERROR, message: "File update tải về không hợp lệ." });
    }

    const checksumText = await requestText(effectiveChecksumUrl);
    const expectedSha256 = parseChecksumText(checksumText, filename);
    if (!expectedSha256) {
      fs.rmSync(destination, { force: true });
      return setState({ status: UPDATE_STATE.ERROR, message: "Không tìm thấy SHA256 của installer trong checksums.txt." });
    }

    const downloadedSha256 = calculateSha256(destination);
    if (downloadedSha256.toLowerCase() !== expectedSha256.toLowerCase()) {
      fs.rmSync(destination, { force: true });
      return setState({ status: UPDATE_STATE.ERROR, message: "SHA256 của file update không khớp. Đã chặn cài đặt." });
    }

    return setState({
      status: UPDATE_STATE.DOWNLOADED,
      downloadedFile: destination,
      checksumUrl: effectiveChecksumUrl,
      expectedSha256,
      downloadedSha256,
      verified: true,
      progress: 100,
      message: "Đã tải xong và xác thực SHA256 bản cập nhật.",
    });
  } catch (error) {
    return setState({
      status: UPDATE_STATE.ERROR,
      message: error.message || "Tải bản cập nhật thất bại.",
    });
  }
}

async function installDownloadedUpdate({ filePath, updatesDir } = {}) {
  try {
    const resolvedFile = path.resolve(filePath || state.downloadedFile || "");
    const resolvedDir = path.resolve(updatesDir || "");
    const relativeFile = path.relative(resolvedDir, resolvedFile);
    const insideUpdatesDir = relativeFile && !relativeFile.startsWith("..") && !path.isAbsolute(relativeFile);
    if (!resolvedFile || !insideUpdatesDir || !/\.exe$/i.test(resolvedFile) || !fs.existsSync(resolvedFile)) {
      return setState({ status: UPDATE_STATE.ERROR, message: "File cài đặt update không hợp lệ." });
    }
    if (!state.verified || !state.expectedSha256) {
      return setState({ status: UPDATE_STATE.ERROR, message: "File update chưa được xác thực SHA256." });
    }
    const currentSha256 = calculateSha256(resolvedFile);
    if (currentSha256.toLowerCase() !== state.expectedSha256.toLowerCase()) {
      return setState({ status: UPDATE_STATE.ERROR, message: "SHA256 của file update đã thay đổi. Đã chặn cài đặt." });
    }

    setState({ status: UPDATE_STATE.INSTALLING, message: "Đang mở trình cài đặt..." });
    const child = spawn(resolvedFile, [], {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });
    child.unref();
    return setState({ status: UPDATE_STATE.INSTALLING, message: "Đã mở trình cài đặt." });
  } catch (error) {
    return setState({ status: UPDATE_STATE.ERROR, message: error.message || "Không mở được trình cài đặt." });
  }
}

module.exports = {
  UPDATE_STATE,
  DEFAULT_CONFIG,
  getState,
  checkForUpdates,
  downloadUpdate,
  installDownloadedUpdate,
  validateExternalUrl,
};
