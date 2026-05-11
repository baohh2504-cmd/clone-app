/**
 * renderer.js - Logic cho giao diện mới (SPA)
 */

const els = {
  // Nav
  navDashboard: document.getElementById('nav-dashboard'),
  navSettings: document.getElementById('nav-settings'),
  navUpdate: document.getElementById('nav-update'),
  navAccount: document.getElementById('nav-account'),

  // Views
  viewDashboard: document.getElementById('view-dashboard'),
  viewAddSingle: document.getElementById('view-add-single'),
  viewBatchAdd: document.getElementById('view-batch-add'),
  viewSettings: document.getElementById('view-settings'),
  viewUpdate: document.getElementById('view-update'),
  viewAccount: document.getElementById('view-account'),

  // Dashboard Elements
  cloneGrid: document.getElementById('clone-grid'),
  searchApp: document.getElementById('search-app'),
  btnAddCloneQuick: document.getElementById('btn-add-clone-quick'),
  btnCreateNewCard: document.getElementById('btn-create-new-card'),

  // Add Single App Elements
  singleUsername: document.getElementById('single-username'),
  singleProgramPath: document.getElementById('single-program-path'),
  btnBrowseFile: document.getElementById('btn-browse-file'),
  singleExeName: document.getElementById('single-exe-name'),
  singleCloneTarget: document.getElementById('single-clone-target'),
  singleStoragePath: document.getElementById('setting-storage'),
  btnSingleSelectFolder: document.getElementById('btn-single-select-folder'),
  btnBrowseFolder: document.getElementById('btn-browse-folder'),
  singleCloneName: document.getElementById('single-clone-name'),
  singleProxy: document.getElementById('single-proxy'),
  singleForceClone: document.getElementById('single-force-clone'),
  singleGroupSelect: document.getElementById('single-group-select'),
  btnCreateSingle: document.getElementById('btn-create-single'),
  btnCancelSingle: document.getElementById('btn-cancel-single'),
  btnBackFromSingle: document.getElementById('btn-back-from-single'),
  modeSwitchBatch: document.getElementById('mode-switch-batch'),

  // Settings Elements
  btnCreateUserSetting: document.getElementById('btn-create-user-setting'),
  settingNewUserName: document.getElementById('setting-user-name'),
  settingNewUserPass: document.getElementById('setting-user-pass'),
  settingNewUserProxy: document.getElementById('setting-user-proxy'),
  settingDomain: document.getElementById('setting-domain'),

  // Batch Add Elements
  batchProgramPath: document.getElementById('batch-program-path'),
  btnBatchBrowseFile: document.getElementById('btn-batch-browse-file'),
  batchExeName: document.getElementById('batch-exe-name'),
  batchCloneDir: document.getElementById('batch-clone-dir'),
  batchPassword: document.getElementById('batch-password'),
  btnBatchBrowseFolder: document.getElementById('btn-batch-browse-folder'),
  batchPrefix: document.getElementById('batch-prefix'),
  batchCount: document.getElementById('batch-count'),
  batchGroupSelect: document.getElementById('batch-group-select'),
  batchProxyList: document.getElementById('batch-proxy-list'),
  btnStartBatch: document.getElementById('btn-start-batch'),
  btnCancelBatch: document.getElementById('btn-cancel-batch'),
  batchProgressSection: document.getElementById('batch-progress-section'),
  batchProgressBar: document.getElementById('batch-progress-bar'),
  batchProgressStatus: document.getElementById('batch-progress-status'),
  batchProgressPercent: document.getElementById('batch-progress-percent'),
  batchLogList: document.getElementById('batch-log-list'),
  batchSuccessCount: document.getElementById('batch-success-count'),
  batchTotalCount: document.getElementById('batch-total-count'),
  batchFailCount: document.getElementById('batch-fail-count'),
  btnBackFromBatch: document.getElementById('btn-back-from-batch'),
  modeSwitchSingle: document.getElementById('mode-switch-single'),

  // Status
  statusBar: document.getElementById('status-bar'),
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingTitle: document.getElementById('loading-title'),
  loadingMessage: document.getElementById('loading-message'),

  // Group Elements
  btnManageGroups: document.getElementById('btn-manage-groups'),
  // groupFilterContainer: document.getElementById('group-filter-container'), // Main container
  filterAll: document.getElementById('filter-all'),
  btnFilterDropdown: document.getElementById('btn-filter-dropdown'),
  filterDropdownMenu: document.getElementById('filter-dropdown-menu'),
  activeGroupChips: document.getElementById('active-group-chips'),

  // Group Manager Modal
  modalGroupManager: document.getElementById('modal-group-manager'),
  btnCloseGroupModal: document.getElementById('btn-close-group-modal'),
  inputNewGroup: document.getElementById('input-new-group'),
  btnAddGroup: document.getElementById('btn-add-group'),
  groupList: document.getElementById('group-list'),

  // Password Modal
  passwordModal: document.getElementById('password-modal'),
  passwordModalBackdrop: document.getElementById('password-modal-backdrop'),
  passwordModalSubtitle: document.getElementById('password-modal-subtitle'),
  passwordInput: document.getElementById('password-modal-input'),
  passwordToggleVisibility: document.getElementById('password-toggle-visibility'),
  passwordError: document.getElementById('password-modal-error'),
  passwordSaveCheckbox: document.getElementById('password-save-checkbox'),
  passwordModalCancel: document.getElementById('password-modal-cancel'),
  passwordModalConfirm: document.getElementById('password-modal-confirm'),

  // Account / License Elements
  btnBackFromAccount: document.getElementById('btn-back-from-account'),
  licenseTierIcon: document.getElementById('license-tier-icon'),
  licenseTierName: document.getElementById('license-tier-name'),
  licenseTierBadge: document.getElementById('license-tier-badge'),
  licenseExpiryRow: document.getElementById('license-expiry-row'),
  licenseExpiryDate: document.getElementById('license-expiry-date'),
  licenseCloneUsed: document.getElementById('license-clone-used'),
  licenseCloneLimit: document.getElementById('license-clone-limit'),
  donateCard: document.getElementById('donate-card'),
  btnCopyDonateAccount: document.getElementById('btn-copy-donate-account'),
  btnCopyDonateMessage: document.getElementById('btn-copy-donate-message'),

  // App Settings Elements
  appSettingsGroups: document.getElementById('app-settings-groups'),
  appSettingsName: document.getElementById('app-settings-name'),
  appSettingsIcon: document.getElementById('app-settings-icon'),
  appSettingsSubtitle: document.getElementById('app-settings-subtitle'),
  appSettingsPath: document.getElementById('app-settings-path'),
  appSettingsProxyEnabled: document.getElementById('app-settings-proxy-enabled'),
  appSettingsProxyString: document.getElementById('app-settings-proxy-string'),
  appSettingsAutostart: document.getElementById('app-settings-autostart'),
  btnBackFromAppSettings: document.getElementById('btn-back-from-app-settings'),
  btnAppSave: document.getElementById('btn-app-save'),
  btnAppShortcut: document.getElementById('btn-app-shortcut'),
  btnAppKill: document.getElementById('btn-app-kill'),
  btnAppDelete: document.getElementById('btn-app-delete'),

  appCurrentVersion: document.getElementById('app-current-version'),
  updateLatestVersion: document.getElementById('update-latest-version'),
  updateStatusLabel: document.getElementById('update-status-label'),
  updateStatusDetail: document.getElementById('update-status-detail'),
  updateProgressBar: document.getElementById('update-progress-bar'),
  autoUpdateToggle: document.getElementById('auto-update-toggle'),
  btnCheckUpdate: document.getElementById('btn-check-update'),
  btnOpenUpdateDownload: document.getElementById('btn-open-update-download'),
  btnDownloadUpdate: document.getElementById('btn-download-update'),
  btnInstallUpdate: document.getElementById('btn-install-update'),
  updateModal: document.getElementById('update-modal'),
  updateModalTitle: document.getElementById('update-modal-title'),
  updateModalVersion: document.getElementById('update-modal-version'),
  updateModalMessage: document.getElementById('update-modal-message'),
  updateReleaseNotes: document.getElementById('update-release-notes'),
  updatePageReleaseNotes: document.getElementById('update-page-release-notes'),
  btnCloseUpdateModal: document.getElementById('btn-close-update-modal'),
  btnUpdateLater: document.getElementById('btn-update-later'),
  btnModalOpenDownload: document.getElementById('btn-modal-open-download'),
  btnModalDownloadUpdate: document.getElementById('btn-modal-download-update'),
  btnModalInstallUpdate: document.getElementById('btn-modal-install-update')
};

// Global State
let trackedClones = [];
let cloneOverrides = {};
let trackedUsers = [];
let trackedUserObjects = []; // Full user objects with storagePath
let groups = [];
let activeGroupFilters = []; // Array of strings
let selectedClones = new Set(); // For bulk select feature
let globalAppSettings = {}; // Cache for fallback
let updateState = {
  status: 'idle',
  currentVersion: '',
  latestVersion: '',
  hasUpdate: false,
  downloadUrl: '',
  releaseUrl: '',
  downloadedFile: '',
  progress: 0,
  message: ''
};
const SOCIAL_LINKS = {
  zalo: 'https://zalo.me/0385253882',
  facebook: 'https://www.facebook.com/hohuybao',
  website: 'https://toolchat.id.vn'
};
let licenseState = {
  activated: true,
  valid: true,
  tier: 'free',
  tierName: 'Toàn quyền',
  limits: { maxClones: Infinity, batchCreate: true, name: 'Toàn quyền' },
  features: { batch: true, proxy: true }
};

let credentialPresence = {};

async function resolveAssetUrl(relativePath) {
  try {
    const result = await window.launcherAPI?.resolveAssetUrl?.(relativePath);
    if (result?.ok && result.url) return result.url;
  } catch (_) { }
  return relativePath;
}

async function resolveStaticImages() {
  const images = Array.from(document.querySelectorAll('img[src^="./assets/"], img[src^="assets/"]'));
  await Promise.all(images.map(async (img) => {
    const originalSrc = img.getAttribute('src');
    const resolved = await resolveAssetUrl(originalSrc);
    if (resolved && resolved !== originalSrc) {
      img.style.removeProperty('display');
      img.src = resolved;
    }
  }));
}

function parseLegacySavedCredentials(data) {
  try {
    if (data) {
      try {
        const decrypted = decodeURIComponent(escape(atob(data)));
        if (decrypted && decrypted.startsWith("{")) {
          return JSON.parse(decrypted);
        }
      } catch (ignore) { }

      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Failed to parse legacy credentials:', e);
  }
  return {};
}

// Global App Settings Accessor
function getGlobalAppSetting(key) {
  return globalAppSettings[key] || "";
}

async function migrateLegacySavedCredentials() {
  try {
    const data = localStorage.getItem('savedCredentials');
    const legacyCredentials = parseLegacySavedCredentials(data);
    const entries = Object.entries(legacyCredentials || {}).filter((entry) => entry[0] && entry[1]);
    let migratedAll = true;
    for (const [username, password] of entries) {
      const res = await window.launcherAPI?.saveCredential?.({ username, password });
      credentialPresence[username] = !!res?.ok;
      if (!res?.ok) migratedAll = false;
    }
    if (data && migratedAll) {
      localStorage.removeItem('savedCredentials');
    }
  } catch (e) {
    console.warn('Failed to migrate legacy credentials:', e);
  }
}

async function hasCredentialForUser(username) {
  if (!username) return false;
  if (Object.prototype.hasOwnProperty.call(credentialPresence, username)) {
    return !!credentialPresence[username];
  }
  const res = await window.launcherAPI?.hasCredential?.(username);
  credentialPresence[username] = !!res?.hasCredential;
  return credentialPresence[username];
}

async function saveCredentialForUser(username, password) {
  if (!username || !password) return { ok: false };
  const res = await window.launcherAPI?.saveCredential?.({ username, password });
  credentialPresence[username] = !!res?.ok;
  return res || { ok: false };
}

async function clearCredentialForUser(username) {
  if (!username) return { ok: false };
  const res = await window.launcherAPI?.deleteCredential?.(username);
  credentialPresence[username] = false;
  return res || { ok: false };
}

migrateLegacySavedCredentials();

// Load app logo dynamically
(function loadAppLogo() {
  const logo = document.getElementById('app-logo');
  const fallback = document.querySelector('.logo-fallback');
  if (logo) {
    // Try different paths
    const paths = ['./assets/icon.png', 'assets/icon.png', '../assets/icon.png'];
    let loaded = false;

    for (const src of paths) {
      const img = new Image();
      img.onload = () => {
        if (!loaded) {
          loaded = true;
          logo.src = src;
          logo.style.display = 'block';
          if (fallback) fallback.style.display = 'none';
        }
      };
      img.src = src;
    }

    resolveAssetUrl('./assets/icon.png').then((src) => {
      if (!loaded && src) {
        loaded = true;
        logo.src = src;
        logo.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
      }
    });
  }
})();

// =============================================================================
// UTILS
// =============================================================================

function showLoading(title = "Đang xử lý...", msg = "Vui lòng chờ...") {
  if (els.loadingOverlay) {
    if (els.loadingTitle) els.loadingTitle.textContent = title;
    if (els.loadingMessage) els.loadingMessage.textContent = msg;
    els.loadingOverlay.classList.remove('hidden');
  }
}

function hideLoading() {
  if (els.loadingOverlay) {
    els.loadingOverlay.classList.add('hidden');
  }
}

function showStatus(msg, type = 'info') {
  if (!els.statusBar) return;
  els.statusBar.textContent = msg;
  els.statusBar.classList.remove('hidden', 'bg-red-600', 'bg-slate-800', 'bg-green-600');

  if (type === 'error') els.statusBar.classList.add('bg-red-600');
  else if (type === 'success') els.statusBar.classList.add('bg-green-600');
  else els.statusBar.classList.add('bg-slate-800');

  els.statusBar.classList.remove('hidden');
  setTimeout(() => {
    els.statusBar.classList.add('hidden');
  }, 3000);
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
  }
}

function normalizePathSeparators(path) {
  return (path || "").replace(/\//g, "\\");
}

function extractExeName(fullPath) {
  const parts = normalizePathSeparators(fullPath || "").split("\\");
  return parts.pop() || "";
}

// Detect app type from exe name or path for duplicate checking
function detectAppType(nameOrPath) {
  const lower = (nameOrPath || "").toLowerCase();
  if (lower.includes("zalo")) return "Zalo";
  if (lower.includes("telegram")) return "Telegram";
  if (lower.includes("chrome")) return "Chrome";
  if (lower.includes("firefox")) return "Firefox";
  if (lower.includes("edge")) return "Edge";
  if (lower.includes("messenger")) return "Messenger";
  if (lower.includes("discord")) return "Discord";
  if (lower.includes("skype")) return "Skype";
  if (lower.includes("viber")) return "Viber";
  // Default: use the exe name as type
  const exeName = extractExeName(nameOrPath);
  return exeName.replace(/\.exe$/i, '') || "Unknown";
}

// =============================================================================
// API CALLS
// =============================================================================

async function loadClones() {
  try {
    const res = await window.launcherAPI.listTrackedClones();
    if (res.ok) {
      trackedClones = res.clones || [];
      await loadOverrides(); // Load overrides to get cached proxies/icons
      renderCloneGrid();
    }
  } catch (err) {
    console.error("Load clones failed:", err);
  }
}

async function loadOverrides() {
  if (window.launcherAPI?.loadCloneOverrides) {
    const res = await window.launcherAPI.loadCloneOverrides();
    if (res.ok) cloneOverrides = res.overrides || {};
  }
}

async function loadUsers() {
  if (window.launcherAPI?.listTrackedUsers) {
    const res = await window.launcherAPI.listTrackedUsers();
    if (res.ok) {
      // Store full user objects for storagePath auto-fill
      trackedUserObjects = (res.users || []).map(u => {
        if (typeof u === 'string') {
          return { username: u, defaultProxy: '', storagePath: '' };
        }
        return {
          username: u.username || '',
          defaultProxy: u.defaultProxy || '',
          storagePath: u.storagePath || ''
        };
      });
      // Also keep simple username list for backward compatibility
      trackedUsers = trackedUserObjects.map(u => u.username);
      updateUserSelects();
      renderSettingsUserList();
    }
  }
}

// =============================================================================
// RENDERING
// =============================================================================

async function loadAppSettings() {
  if (window.launcherAPI?.getAppSettings) {
    const res = await window.launcherAPI.getAppSettings();
    if (res.ok && res.settings) {
      const s = res.settings;
      globalAppSettings = s; // Cache it
      // Apply to Add Single inputs
      if (els.singleCloneTarget && s.cloneRoot) {
        els.singleCloneTarget.value = s.cloneRoot;
      }

      // Update Settings View inputs
      if (els.singleStoragePath) els.singleStoragePath.value = s.cloneRoot || "";
      if (els.settingUserDataRoot) els.settingUserDataRoot.value = s.userDataRoot || "";
      if (els.autoUpdateToggle) els.autoUpdateToggle.checked = Boolean(s.autoUpdateEnabled);
    }
  }
}

function renderUpdateState(state = updateState) {
  updateState = { ...updateState, ...(state || {}) };
  const status = updateState.status || 'idle';
  const progress = Number(updateState.progress || 0);
  const hasUpdate = Boolean(updateState.hasUpdate || updateState.downloadUrl);
  const downloaded = status === 'downloaded' || Boolean(updateState.downloadedFile);

  if (els.updateStatusLabel) {
    if (status === 'checking') els.updateStatusLabel.textContent = 'Đang kiểm tra cập nhật...';
    else if (status === 'available') els.updateStatusLabel.textContent = 'Có phiên bản mới';
    else if (status === 'downloading') els.updateStatusLabel.textContent = `Đang tải bản cập nhật${progress ? ` ${progress}%` : ''}`;
    else if (status === 'downloaded') els.updateStatusLabel.textContent = 'Đã tải xong bản cập nhật';
    else if (status === 'installing') els.updateStatusLabel.textContent = 'Đang mở trình cài đặt...';
    else if (status === 'error') els.updateStatusLabel.textContent = 'Cập nhật đang gặp lỗi';
    else els.updateStatusLabel.textContent = 'Chưa kiểm tra';
  }

  if (els.updateStatusDetail) {
    els.updateStatusDetail.textContent = updateState.message || 'Bấm nút bên dưới để kiểm tra phiên bản mới.';
  }

  if (els.updateProgressBar) {
    els.updateProgressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }

  if (els.updateLatestVersion) {
    els.updateLatestVersion.textContent = updateState.latestVersion || 'Chưa kiểm tra';
  }

  if (els.updatePageReleaseNotes) {
    els.updatePageReleaseNotes.textContent = updateState.releaseNotes || 'Chưa có ghi chú phát hành. Hãy bấm kiểm tra cập nhật.';
  }

  els.btnOpenUpdateDownload?.classList.toggle('hidden', !hasUpdate || !updateState.downloadUrl);
  els.btnDownloadUpdate?.classList.toggle('hidden', !hasUpdate || !updateState.downloadUrl || downloaded);
  els.btnInstallUpdate?.classList.toggle('hidden', !downloaded);
  els.btnModalOpenDownload?.classList.toggle('hidden', !hasUpdate || !updateState.downloadUrl || downloaded);
  els.btnModalDownloadUpdate?.classList.toggle('hidden', !hasUpdate || !updateState.downloadUrl || downloaded);
  els.btnModalInstallUpdate?.classList.toggle('hidden', !downloaded);

  const busy = status === 'checking' || status === 'downloading' || status === 'installing';
  if (els.btnCheckUpdate) els.btnCheckUpdate.disabled = busy;
  if (els.btnDownloadUpdate) els.btnDownloadUpdate.disabled = busy;
  if (els.btnModalDownloadUpdate) els.btnModalDownloadUpdate.disabled = busy;
}

function openUpdateModal() {
  if (!els.updateModal) return;
  if (els.updateModalVersion) {
    els.updateModalVersion.textContent = `${updateState.currentVersion || '...'} → ${updateState.latestVersion || '...'}`;
  }
  if (els.updateModalMessage) {
    els.updateModalMessage.textContent = updateState.message || 'Bản mới đã sẵn sàng.';
  }
  if (els.updateReleaseNotes) {
    els.updateReleaseNotes.textContent = updateState.releaseNotes || 'Không có ghi chú phát hành.';
  }
  els.updateModal.classList.remove('hidden');
  renderUpdateState(updateState);
}

function closeUpdateModal() {
  els.updateModal?.classList.add('hidden');
}

async function loadAppVersion() {
  try {
    const res = await window.launcherAPI?.getAppVersion?.();
    if (res?.ok && els.appCurrentVersion) {
      els.appCurrentVersion.textContent = res.version || '...';
      updateState.currentVersion = res.version || '';
    }
  } catch (_) {
    if (els.appCurrentVersion) els.appCurrentVersion.textContent = '...';
  }
}

async function handleCheckUpdate({ silent = false, autoDownload = false } = {}) {
  try {
    renderUpdateState({ status: 'checking', progress: 0, message: 'Đang kiểm tra cập nhật...' });
    const res = await window.launcherAPI?.checkForUpdates?.();
    renderUpdateState(res || {});
    if (res?.hasUpdate) {
      if (!silent) openUpdateModal();
      if (autoDownload) await handleDownloadUpdate();
      return res;
    }
    if (!silent) showStatus(res?.message || 'Bạn đang dùng phiên bản mới nhất.', 'success');
    return res;
  } catch (error) {
    renderUpdateState({ status: 'error', message: error.message || 'Kiểm tra cập nhật thất bại.' });
    if (!silent) showStatus(updateState.message, 'error');
    return null;
  }
}

async function handleOpenUpdateDownload() {
  const url = updateState.downloadUrl || updateState.releaseUrl;
  if (!url) {
    showStatus('Chưa có link tải update.', 'error');
    return;
  }
  const res = await window.launcherAPI?.openExternalUrl?.(url);
  if (!res?.ok) showStatus(res?.message || 'Không mở được link tải.', 'error');
}

async function handleDownloadUpdate() {
  if (!updateState.downloadUrl) {
    showStatus('Chưa có link tải update.', 'error');
    return null;
  }
  renderUpdateState({ status: 'downloading', progress: 0, message: 'Đang tải bản cập nhật...' });
  const res = await window.launcherAPI?.downloadUpdate?.({
    downloadUrl: updateState.downloadUrl,
    latestVersion: updateState.latestVersion,
    checksumUrl: updateState.checksumUrl
  });
  renderUpdateState(res || {});
  if (res?.status === 'downloaded') {
    openUpdateModal();
    showStatus('Đã tải xong bản cập nhật.', 'success');
  } else if (!res?.ok) {
    showStatus(res?.message || 'Tải bản cập nhật thất bại.', 'error');
  }
  return res;
}

async function handleInstallUpdate() {
  if (!updateState.downloadedFile) {
    showStatus('Chưa có file update đã tải.', 'error');
    return;
  }
  const confirmed = window.confirm('App sẽ mở trình cài đặt bản mới và đóng phiên hiện tại. Tiếp tục?');
  if (!confirmed) return;
  await window.launcherAPI?.installDownloadedUpdate?.({ filePath: updateState.downloadedFile });
}

function initUpdateSection() {
  loadAppVersion();
  renderUpdateState(updateState);

  els.btnCheckUpdate?.addEventListener('click', () => handleCheckUpdate());
  els.btnOpenUpdateDownload?.addEventListener('click', handleOpenUpdateDownload);
  els.btnModalOpenDownload?.addEventListener('click', handleOpenUpdateDownload);
  els.btnDownloadUpdate?.addEventListener('click', handleDownloadUpdate);
  els.btnModalDownloadUpdate?.addEventListener('click', handleDownloadUpdate);
  els.btnInstallUpdate?.addEventListener('click', handleInstallUpdate);
  els.btnModalInstallUpdate?.addEventListener('click', handleInstallUpdate);
  els.btnCloseUpdateModal?.addEventListener('click', closeUpdateModal);
  els.btnUpdateLater?.addEventListener('click', closeUpdateModal);

  els.autoUpdateToggle?.addEventListener('change', async (event) => {
    const enabled = Boolean(event.target.checked);
    globalAppSettings = { ...globalAppSettings, autoUpdateEnabled: enabled };
    await window.launcherAPI?.updateAppSettings?.({ autoUpdateEnabled: enabled });
    showStatus(enabled ? 'Đã bật tự động cập nhật.' : 'Đã tắt tự động cập nhật.', 'success');
    if (enabled) handleCheckUpdate({ silent: true, autoDownload: true });
  });

  document.querySelectorAll('.social-link-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const key = button.dataset.socialLink;
      const url = SOCIAL_LINKS[key];
      if (!url) {
        showStatus('Link liên hệ chưa được cấu hình.', 'error');
        return;
      }
      const res = await window.launcherAPI?.openExternalUrl?.(url);
      if (!res?.ok) showStatus(res?.message || 'Không mở được link liên hệ.', 'error');
    });
  });
}

function renderSingleGroupSelect() {
  if (!els.singleGroupSelect) return;
  const options = groups.map(g =>
    `<option value="${g}">${g}</option>`
  ).join('');
  els.singleGroupSelect.innerHTML = `<option value="">-- Chọn Group --</option>${options}`;
}

function renderBatchGroupSelect() {
  if (!els.batchGroupSelect) return;
  const options = groups.map(g =>
    `<option value="${g}">${g}</option>`
  ).join('');
  els.batchGroupSelect.innerHTML = `<option value="">-- Chọn Group --</option>${options}`;
}

function initSettingsListeners() {
  // Load saved Domain from localStorage
  const savedDomain = localStorage.getItem('settingDomain');
  if (savedDomain && els.settingDomain) {
    els.settingDomain.value = savedDomain;
  }

  // Auto-save Domain on change
  els.settingDomain?.addEventListener('change', (e) => {
    localStorage.setItem('settingDomain', e.target.value);
  });

  // Auto-save settings on change
  els.singleStoragePath?.addEventListener('change', async (e) => {
    await window.launcherAPI.updateAppSettings({ cloneRoot: e.target.value });
  });

  // Browse Buttons & Manual User Creation
  if (els.btnSingleSelectFolder) {
    els.btnSingleSelectFolder.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      // Disable button to prevent double clicks
      els.btnSingleSelectFolder.disabled = true;
      try {
        const folder = await window.launcherAPI.selectFolder();
        if (folder) {
          els.singleStoragePath.value = folder;
          await window.launcherAPI.updateAppSettings({ cloneRoot: folder });
        }
      } finally {
        els.btnSingleSelectFolder.disabled = false;
      }
    };
  }

  // Settings: Manual Create User
  if (els.btnCreateUserSetting) {
    els.btnCreateUserSetting.onclick = async (e) => {
      // CRITICAL: Check and disable IMMEDIATELY to prevent double-click
      if (els.btnCreateUserSetting.disabled) return;
      els.btnCreateUserSetting.disabled = true;

      e.stopPropagation();
      e.preventDefault();

      const u = els.settingNewUserName?.value;
      const p = els.settingNewUserPass?.value;
      const Prx = els.settingNewUserProxy?.value;
      let path = "";

      // Fallback if path is empty but global setting exists
      if (!path && els.singleStoragePath?.value?.trim()) {
        path = els.singleStoragePath.value.trim() + "\\" + u;
      }

      if (!u || !p) {
        showStatus("Vui lòng nhập Tên Profile và Pass", "error");
        els.btnCreateUserSetting.disabled = false; // Re-enable on validation failure
        return;
      }

      showLoading("Đang tạo Profile...");
      try {
        const res = await window.launcherAPI.createLocalUser({
          username: u, password: p, proxy: Prx, profileDir: path
        });
        hideLoading();
        if (res.ok) {
          showStatus(res.message, "success");
          loadUsers();
          els.settingNewUserName.value = "";
          els.settingNewUserPass.value = "";
        } else {
          showStatus(res.message, "error");
        }
      } catch (e) {
        hideLoading();
        showStatus(e.message, "error");
      } finally {
        els.btnCreateUserSetting.disabled = false;
      }
    };
  }
}

function initAutoFillListeners() {
  if (!els.singleUsername) return;

  // Use onclick/onchange to avoid duplicate listeners (though addEventListener is standard, we want to be safe)
  els.singleUsername.onchange = (e) => {
    const val = e.target.value;
    const storageInput = els.singleCloneTarget; // This is 'single-clone-target' in Add Single View

    if (!storageInput) return;

    // Reset logic if "NEW_USER" or empty
    if (!val || val === "NEW_USER") {
      // Fallback to global default or clear
      // If we have a global default cached, use it
      storageInput.value = globalAppSettings.cloneRoot || "";
      return;
    }

    const user = trackedUserObjects.find(u => u.username === val);
    if (user && user.storagePath) {
      storageInput.value = user.storagePath;
    } else {
      // User has no specific path -> use global default
      // Only overwrite if empty or matches global default (don't overwrite user custom input unless they switch profiles)
      // Actually per user request: "nó chưa tự động điền". So we should fill it.
      storageInput.value = globalAppSettings.cloneRoot || "";
    }
  };




}

function updateUserSelects() {
  // Populate Single User Select
  if (els.singleUsername) {
    els.singleUsername.innerHTML = '<option value="">-- Chọn Profile --</option>';
    trackedUsers.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u;
      els.singleUsername.appendChild(opt);
    });
    // Option to create new
    const newOpt = document.createElement('option');
    newOpt.value = "NEW_USER";
    newOpt.textContent = "+ Tạo Profile mới (Tự động)";
    els.singleUsername.appendChild(newOpt);
  }
}


function renderSettingsUserList() {
  if (!els.userListBody) return;
  els.userListBody.innerHTML = '';

  if (trackedUsers.length === 0) {
    els.userListBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-8 text-center text-slate-500">
          Chưa có Profile nào được tạo.
        </td>
      </tr>`;
    return;
  }

  trackedUsers.forEach(u => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors';
    // Use N/A for date since we don't track it yet
    tr.innerHTML = `
      <td class="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">${u}</td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Active
        </span>
      </td>

      <td class="px-6 py-4 text-right">
        <button class="btn-delete-user text-slate-400 hover:text-red-500 transition-colors" data-user="${u}">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </td>
    `;
    els.userListBody.appendChild(tr);
  });

  // Attach delete handlers
  document.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.onclick = async (e) => {
      const u = e.currentTarget.getAttribute('data-user');
      if (confirm(`Bạn có chắc muốn xóa Profile "${u}"?\nProfile này sẽ bị xóa khỏi hệ thống Windows.`)) {
        showLoading("Đang xóa Profile...", "Vui lòng chờ...");
        try {
          const res = await window.launcherAPI.deleteTrackedUser(u);
          hideLoading();
          if (res.ok) {
            showStatus(`Đã xóa Profile ${u}`, "success");
            loadUsers(); // Reload list
          } else {
            showStatus(`Lỗi: ${res.message}`, "error");
          }
        } catch (error) {
          hideLoading();
          showStatus(`Lỗi: ${error.message}`, "error");
        }
      }
    };
  });
}

function renderCloneGrid() {
  if (!els.cloneGrid) return;

  // Clear current grid but keep the "Create New" card
  const createBtn = els.btnCreateNewCard;
  els.cloneGrid.innerHTML = '';

  // Filter by active group
  let filteredClones = trackedClones;
  if (activeGroupFilters.length > 0) {
    filteredClones = trackedClones.filter(clone => {
      const override = cloneOverrides[clone.id] || cloneOverrides[clone.username] || {};
      const cloneGroups = override.groups || [];
      // Show if clone belongs to ANY selected group
      return cloneGroups.some(g => activeGroupFilters.includes(g));
    });
  }

  filteredClones.forEach(clone => {
    const card = createCloneCardElement(clone);
    els.cloneGrid.appendChild(card);
  });

  if (createBtn) {
    els.cloneGrid.appendChild(createBtn);
  }
}

const ICONS = {
  zalo: "./assets/zalo.png",
  chrome: "./assets/chrome.svg",
  default: "./assets/icon.png" // Generic App Icon
};

async function resolveKnownAssetUrls() {
  await Promise.all(Object.keys(ICONS).map(async (key) => {
    ICONS[key] = await resolveAssetUrl(ICONS[key]);
  }));
}

function getAppIcon(clone) {
  const path = (clone.exec_path || "").toLowerCase();
  const name = (clone.name || "").toLowerCase();

  if (path.includes("chrome.exe") || name.includes("chrome")) return ICONS.chrome;
  if (path.includes("zalo.exe") || name.includes("zalo")) return ICONS.zalo;

  return ICONS.default;
}

// Icon Cache
const iconCache = {};

function createCloneCardElement(clone) {
  const override = cloneOverrides[clone.id] || cloneOverrides[clone.username] || {};
  const displayName = override.displayName || clone.name || clone.username;

  // Initial placeholder
  const iconId = `icon-${clone.id}`;
  const defaultIcon = ICONS.default;
  // Check cache first
  const cachedIcon = iconCache[clone.exec_path];

  // Logic: If we have cache, use it. If not, fallback to default and load async.
  // Note: For Chrome/Zalo we can still use ICONS map for instant render if desired, 
  // but User wants "Default App Icon", so we prioritize extraction.
  // To keep UI snappy, valid cache or static map is great.
  // Let's rely on extraction primarily for correctness as requested.

  // Minimalist Style: Default no border, Hover Neon Blue
  const neonBorder = 'hover:border-neon-blue';
  const shadowColor = 'neon-blue';

  const div = document.createElement('div');
  // Card Style: Match 'Create New' button (Glass bg, visible border), Hover Neon Blue
  div.className = `group relative flex flex-col gap-3 rounded-xl bg-white/5 backdrop-blur-sm p-4 border border-white/10 transition-all duration-300 aspect-[3/2] ${neonBorder} hover:shadow-[0_0_15px_-3px_rgba(0,240,255,0.4)] hover:bg-white/10`;

  // Custom hover shadow for neon glow could be added via style if tailwind dynamic class fails
  // div.style.boxShadow = ...

  const isSelected = selectedClones.has(clone.id);

  div.innerHTML = `
        <div class="absolute top-2 left-2 z-10">
            <input type="checkbox" class="clone-checkbox w-4 h-4 text-neon-blue bg-slate-800 border-slate-600 rounded focus:ring-neon-blue cursor-pointer" ${isSelected ? 'checked' : ''} />
        </div>
        <div class="absolute top-2 right-2 z-10">
            <button class="btn-settings size-8 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-colors" title="Cài đặt">
                <span class="material-symbols-outlined text-[18px]">settings</span>
            </button>
        </div>
        <div class="flex flex-col items-center justify-center gap-2 pt-2 flex-1">
            <div class="size-14 rounded-xl bg-white/5 flex items-center justify-center p-2 shadow-inner border border-white/5 mb-1 group-hover:scale-110 transition-transform duration-300">
                <img id="${iconId}" src="${cachedIcon || defaultIcon}" class="w-full h-full object-contain filter drop-shadow-md" alt="Icon">
            </div>
            <h3 class="text-white text-base font-bold leading-tight group-hover:text-neon-blue transition-colors text-center truncate w-full tracking-wide" title="${displayName.replace(/"/g, '&quot;')}">${displayName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h3>
            <p class="text-slate-500 text-xs font-medium text-center truncate w-full px-2 font-mono group-hover:text-slate-300 transition-colors" title="${clone.username.replace(/"/g, '&quot;')}">${clone.username.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        <div class="mt-auto w-full pt-1 flex justify-center">
            <button class="btn-launch w-full h-9 bg-neon-blue/10 hover:bg-neon-blue/30 border border-neon-blue/30 hover:border-neon-blue text-neon-blue hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider backdrop-blur-sm shadow-[0_0_10px_rgba(0,240,255,0.1)] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                <span class="material-symbols-outlined text-[18px]">play_arrow</span>
                Launch
            </button>
        </div>
    `;

  // Events
  const btnLaunch = div.querySelector('.btn-launch');
  btnLaunch.onclick = () => launchClone(clone);

  const btnSettings = div.querySelector('.btn-settings');
  if (btnSettings) {
    btnSettings.onclick = (e) => {
      e.stopPropagation(); // Prevent card click if any
      openAppSettings(clone);
    };
  }

  // Checkbox for bulk select
  const checkbox = div.querySelector('.clone-checkbox');
  if (checkbox) {
    checkbox.onchange = (e) => {
      e.stopPropagation();
      if (e.target.checked) {
        selectedClones.add(clone.id);
      } else {
        selectedClones.delete(clone.id);
      }
      updateBulkActionBar();
    };
  }

  // Async Load Icon if not cached
  if (!cachedIcon && clone.exec_path) {
    window.launcherAPI.loadAppIcon(clone.exec_path).then(dataUrl => {
      if (dataUrl) {
        iconCache[clone.exec_path] = dataUrl;
        const img = document.getElementById(iconId);
        if (img) img.src = dataUrl;
      }
    });
  }

  return div;
}

// =============================================================================
// BULK ACTION BAR
// =============================================================================

function updateBulkActionBar() {
  let bar = document.getElementById('bulk-action-bar');

  if (selectedClones.size === 0) {
    if (bar) bar.remove();
    return;
  }

  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'bulk-action-bar';
    bar.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#192233] border border-slate-700 rounded-xl px-6 py-3 flex items-center gap-4 shadow-2xl z-50';
    document.body.appendChild(bar);
  }

  bar.innerHTML = `
    <span class="text-white text-sm font-medium">✓ ${selectedClones.size} đã chọn</span>
    <button id="btn-bulk-deselect" class="px-3 py-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors">Bỏ chọn</button>
    <button id="btn-bulk-run" class="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
      <span class="material-symbols-outlined text-[16px]">play_arrow</span>
      Chạy
    </button>
    <button id="btn-bulk-delete" class="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
      <span class="material-symbols-outlined text-[16px]">delete</span>
      Xóa
    </button>
  `;

  document.getElementById('btn-bulk-deselect').onclick = () => {
    selectedClones.clear();
    renderCloneGrid();
    updateBulkActionBar();
  };

  document.getElementById('btn-bulk-run').onclick = async () => {
    const clonesToRun = trackedClones.filter(c => selectedClones.has(c.id));
    for (const clone of clonesToRun) {
      await launchClone(clone);
    }
    selectedClones.clear();
    renderCloneGrid();
    updateBulkActionBar();
  };

  document.getElementById('btn-bulk-delete').onclick = async () => {
    const count = selectedClones.size;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${count} ứng dụng đã chọn?`)) return;

    showLoading("Đang xóa...", `Đang xóa ${count} ứng dụng...`);

    const clonesToDelete = trackedClones.filter(c => selectedClones.has(c.id));
    for (const clone of clonesToDelete) {
      try {
        await window.launcherAPI.deleteTrackedApp({ appId: clone.id, clone: clone });
      } catch (e) {
        console.error('Error deleting clone:', clone.id, e);
      }
    }

    hideLoading();
    selectedClones.clear();
    await loadClones();
    await loadUsers();
    updateBulkActionBar();
    showStatus(`Đã xóa ${count} ứng dụng!`, 'success');
  };
}

// =============================================================================
// PASSWORD MODAL LOGIC
// =============================================================================

let pendingLaunchClone = null; // Stores clone waiting for password
let passwordResolve = null; // Promise resolver

function showPasswordModal(clone) {
  return new Promise((resolve) => {
    pendingLaunchClone = clone;
    passwordResolve = resolve;

    // Reset modal state
    if (els.passwordInput) els.passwordInput.value = '';
    if (els.passwordError) {
      els.passwordError.textContent = '';
      els.passwordError.classList.add('hidden');
    }
    if (els.passwordModalSubtitle) {
      els.passwordModalSubtitle.textContent = `Nhập mật khẩu cho Profile: ${clone.username}`;
    }
    if (els.passwordSaveCheckbox) els.passwordSaveCheckbox.checked = true;

    // Show modal
    els.passwordModal?.classList.remove('hidden');
    els.passwordInput?.focus();
  });
}

function hidePasswordModal(result = null) {
  els.passwordModal?.classList.add('hidden');
  pendingLaunchClone = null;
  if (passwordResolve) {
    passwordResolve(result);
    passwordResolve = null;
  }
}

// Password modal event listeners
els.passwordModalCancel?.addEventListener('click', () => {
  hidePasswordModal(null);
  showStatus("Đã hủy khởi chạy.", "info");
});

els.passwordModalBackdrop?.addEventListener('click', () => {
  hidePasswordModal(null);
  showStatus("Đã hủy khởi chạy.", "info");
});

els.passwordModalConfirm?.addEventListener('click', async () => {
  const password = els.passwordInput?.value || '';
  const saveCredential = els.passwordSaveCheckbox?.checked || false;

  if (!password) {
    if (els.passwordError) {
      els.passwordError.textContent = 'Vui lòng nhập mật khẩu!';
      els.passwordError.classList.remove('hidden');
    }
    return;
  }

  hidePasswordModal({ password, saveCredential });
});

// Enter key to submit
els.passwordInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    els.passwordModalConfirm?.click();
  }
});

// Toggle password visibility
els.passwordToggleVisibility?.addEventListener('click', () => {
  const input = els.passwordInput;
  const icon = els.passwordToggleVisibility.querySelector('span');
  if (input && icon) {
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility_off';
    }
  }
});

async function launchClone(clone) {
  showStatus(`Đang khởi chạy ${clone.username}...`);
  try {
    const override = cloneOverrides[clone.id] || {};
    const proxy = override.proxy || "";

    let password = null;
    let saveCredential = false;

    const hasCredential = await hasCredentialForUser(clone.username);
    if (hasCredential) {
      showStatus(`Đang chạy ${clone.username} với credential đã lưu...`);
    } else {
      const result = await showPasswordModal(clone);
      if (!result) {
        return;
      }
      password = result.password;
      saveCredential = result.saveCredential;
    }

    const payload = {
      programPath: clone.exec_path,
      username: clone.username,
      proxy: proxy,
      password: password,
      saveCredential: saveCredential,
      skipCredentialCache: !hasCredential && !saveCredential
    };

    const res = await window.launcherAPI.launchClone(payload);

    if (res.ok) {
      if (saveCredential) credentialPresence[clone.username] = true;
      showStatus("Đã khởi chạy thành công!", "success");
    } else if (res.passwordWrong) {
      await clearCredentialForUser(clone.username);
      showStatus("Sai mật khẩu! Vui lòng nhập lại.", "error");
      setTimeout(() => launchClone(clone), 500);
    } else {
      showStatus(res.message || "Lỗi khởi chạy không xác định.", "error");
    }
  } catch (err) {
    showStatus("Lỗi khởi chạy: " + err.message, "error");
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// Nav
// Nav
function updateNavState(activeId) {
  const navs = [els.navDashboard, els.navSettings, els.navUpdate, els.navAccount];
  navs.forEach(btn => {
    if (!btn) return;
    if (btn.id === activeId) {
      btn.classList.add('bg-primary/10', 'dark:bg-[#232f48]', 'text-primary', 'dark:text-white');
      btn.classList.remove('text-slate-600', 'dark:text-[#92a4c9]', 'hover:bg-slate-100', 'dark:hover:bg-[#1a2333]');
    } else {
      btn.classList.remove('active', 'bg-primary/10', 'dark:bg-[#232f48]', 'text-primary', 'dark:text-white');
      btn.classList.add('text-slate-600', 'dark:text-[#92a4c9]', 'hover:bg-slate-100', 'dark:hover:bg-[#1a2333]');
    }
  });
}

// =============================================================================
// APP SETTINGS LOGIC
// =============================================================================

let currentSettingsClone = null;

// Add elements dynamically since they were added html later
Object.assign(els, {
  appSettingsIcon: document.getElementById('app-settings-icon'),
  appSettingsName: document.getElementById('app-settings-name'),
  appSettingsSubtitle: document.getElementById('app-settings-subtitle'),
  appSettingsPath: document.getElementById('app-settings-path'),
  appSettingsProxyEnabled: document.getElementById('app-settings-proxy-enabled'),
  appSettingsProxyString: document.getElementById('app-settings-proxy-string'),
  appSettingsAutostart: document.getElementById('app-settings-autostart'),
  appSettingsGroups: document.getElementById('app-settings-groups'),
  btnBackFromAppSettings: document.getElementById('btn-back-from-app-settings'),
  btnAppSave: document.getElementById('btn-app-save'),
  btnAppShortcut: document.getElementById('btn-app-shortcut'),
  btnAppKill: document.getElementById('btn-app-kill'),
  btnAppDelete: document.getElementById('btn-app-delete'),

  // Settings View Elements
  settingUserName: document.getElementById('setting-user-name'),
  settingUserPass: document.getElementById('setting-user-pass'),
  settingUserProxy: document.getElementById('setting-user-proxy'),
  settingSaveCred: document.getElementById('setting-save-cred'),
  btnGenerateUserSetting: document.getElementById('btn-generate-user-setting'),
  btnCreateUserSetting: document.getElementById('btn-create-user-setting'),
  userListBody: document.getElementById('user-list-body'),
  btnRefreshUsers: document.getElementById('btn-refresh-users')
});


function openAppSettings(clone) {
  currentSettingsClone = clone;
  // STRICT MODE: Only load settings by ID to prevent cross-app pollution
  const override = cloneOverrides[clone.id] || {};

  // DEBUG: Show ID to verify we are working on the correct app
  // console.log(`Opening settings for ID: ${clone.id} (User: ${clone.username})`);
  // showStatus(`Đang cấu hình: ${clone.id}`, "info");

  // Populate Info
  const defaultIcon = ICONS.default;
  const cachedIcon = iconCache[clone.exec_path];

  if (els.appSettingsIcon) {
    els.appSettingsIcon.src = cachedIcon || defaultIcon;
    // Async load if needed
    if (!cachedIcon && clone.exec_path) {
      window.launcherAPI.loadAppIcon(clone.exec_path).then(dataUrl => {
        if (dataUrl && els.appSettingsIcon && currentSettingsClone && currentSettingsClone.id === clone.id) {
          // Only update if we are still viewing the same clone
          iconCache[clone.exec_path] = dataUrl;
          els.appSettingsIcon.src = dataUrl;
        }
      });
    }
  }

  if (els.appSettingsName) els.appSettingsName.value = override.displayName || clone.name || clone.username;
  if (els.appSettingsSubtitle) els.appSettingsSubtitle.textContent = `Chi tiết cấu hình cho ${clone.username}`;

  // Populate Technical
  if (els.appSettingsPath) els.appSettingsPath.value = clone.exec_path || "";

  // Proxy
  const proxyStr = override.proxy || "";
  if (els.appSettingsProxyEnabled) els.appSettingsProxyEnabled.checked = !!proxyStr;
  if (els.appSettingsProxyString) els.appSettingsProxyString.value = proxyStr;

  // System Defaults (mock)
  if (els.appSettingsAutostart) els.appSettingsAutostart.checked = false;

  // Render Group checkboxes
  if (els.appSettingsGroups) {
    const cloneGroups = override.groups || [];
    if (groups.length === 0) {
      els.appSettingsGroups.innerHTML = '<p class="text-xs text-slate-500">Chưa có Group. Bấm nút "Group" trên Dashboard để tạo.</p>';
    } else {
      els.appSettingsGroups.innerHTML = groups.map(g => {
        const isSelected = cloneGroups.includes(g);
        return `
        <label class="relative cursor-pointer group select-none">
          <input type="checkbox" class="group-checkbox peer sr-only" data-group="${g}" ${isSelected ? 'checked' : ''}>
          <div class="px-3 py-1.5 rounded-lg border transition-all duration-200 text-xs font-medium
            peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary peer-checked:shadow-sm
            bg-slate-50 dark:bg-[#111722] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50">
            ${g}
          </div>
        </label>
      `;
      }).join('');
    }
  }

  switchView('view-app-settings');
}

async function saveAppSettings() {
  if (!currentSettingsClone) return;

  try {
    const displayName = els.appSettingsName.value;
    let useProxy = els.appSettingsProxyEnabled.checked;
    let proxyStr = els.appSettingsProxyString.value.trim();

    // Auto-enable proxy if text is provided
    if (proxyStr.length > 0) {
      useProxy = true;
    } else {
      // If empty, force disable
      useProxy = false;
    }

    // Save selected groups
    const selectedGroups = Array.from(els.appSettingsGroups.querySelectorAll('input.group-checkbox:checked'))
      .map(cb => cb.dataset.group);

    // Call updateCloneOverride (updated to handle groups)
    const newOverride = await window.launcherAPI.updateCloneOverride(currentSettingsClone.id, {
      displayName: displayName || "",
      proxy: useProxy ? proxyStr : "",
      groups: selectedGroups
    });

    // Update global state
    cloneOverrides[currentSettingsClone.id] = newOverride || {};
    showStatus("Đã lưu cấu hình ứng dụng!", "success");

    // Refresh views from backend to ensure consistency
    await loadClones();

    // Update reference to the fresh clone object
    // STRICT MATCHING: Prefer ID if available to avoid mixing up apps sharing the same username
    const updatedClone = trackedClones.find(c => {
      if (currentSettingsClone.id && c.id === currentSettingsClone.id) {
        return true;
      }
      // Only fallback to username if ID is missing (legacy support)
      if (!currentSettingsClone.id && c.username === currentSettingsClone.username) {
        return true;
      }
      return false;
    });

    if (updatedClone) {
      currentSettingsClone = updatedClone;
      openAppSettings(updatedClone); // Reload to show saved state
    } else {
      renderCloneGrid();
    }
  } catch (e) {
    console.error("Failed to save settings:", e);
    showStatus(`Lỗi lưu cấu hình: ${e.message}`, "error");
  }
}


// Wire up events
if (els.btnBackFromAppSettings) els.btnBackFromAppSettings.onclick = () => switchView('view-dashboard');
if (els.btnAppSave) els.btnAppSave.onclick = saveAppSettings;

if (els.btnAppShortcut) els.btnAppShortcut.onclick = async () => {
  if (!currentSettingsClone) return;
  try {
    const override = cloneOverrides[currentSettingsClone.id] || {};
    const username = currentSettingsClone.username;
    await window.launcherAPI.createCloneShortcut({
      username: username,
      appId: currentSettingsClone.id,
      execPath: currentSettingsClone.exec_path,
      iconPath: currentSettingsClone.icon_path || "",
      proxy: override.proxy || ""
    });
    showStatus("Đã tạo shortcut thành công!", "success");
  } catch (e) {
    showStatus("Lỗi tạo shortcut: " + e.message, "error");
  }
};

if (els.btnAppKill) els.btnAppKill.onclick = async () => {
  if (!currentSettingsClone) return;
  try {
    await window.launcherAPI.terminateClone(currentSettingsClone.username);
    const appName = currentSettingsClone.displayName || currentSettingsClone.name || currentSettingsClone.username;
    showStatus(`Đã kết thúc tác vụ của ${appName}`, "success");
  } catch (e) {
    showStatus("Lỗi đóng ứng dụng: " + e.message, "error");
  }
};

if (els.btnAppDelete) els.btnAppDelete.onclick = async () => {
  if (!currentSettingsClone) return;

  try {
    // Fetch fresh list to check for shared users
    const result = await window.launcherAPI.listTrackedClones();
    const clones = result.clones || [];
    const sharingUserCount = clones.filter(c => c.username.toLowerCase() === currentSettingsClone.username.toLowerCase()).length;

    let confirmMsg = `Bạn có chắc chắn muốn xóa ${currentSettingsClone.name || currentSettingsClone.username} không?`;
    let deleteUser = false;

    if (sharingUserCount > 1) {
      confirmMsg += `\nLƯU Ý: User Windows '${currentSettingsClone.username}' sẽ ĐƯỢC GIỮ LẠI vì còn ${sharingUserCount - 1} ứng dụng khác đang dùng chung.`;
    } else {
      confirmMsg += `\nHành động này sẽ Xóa Profile Windows và Xóa khỏi danh sách.`;
      deleteUser = true;
    }

    const confirmDelete = confirm(confirmMsg);
    if (!confirmDelete) return;

    // 1. Delete app registry tracking
    await window.launcherAPI.deleteTrackedApp({ appId: currentSettingsClone.id, clone: currentSettingsClone });

    // 2. Delete local user ONLY if not shared
    if (deleteUser) {
      try {
        await window.launcherAPI.deleteTrackedUser(currentSettingsClone.username);
      } catch (e) {
        console.warn("User deletion warning:", e);
      }
      showStatus("Đã xóa ứng dụng và dọn sạch Profile!", "success");
    } else {
      showStatus("Đã xóa ứng dụng (Giữ lại User cho app khác).", "success");
    }

    // Go back to dashboard
    switchView('view-dashboard');
    loadClones(); // Refresh clones
    loadUsers(); // Refresh user list too
  } catch (e) {
    showStatus("Lỗi xóa ứng dụng: " + e.message, "error");
  }
};

// [REMOVED] Duplicate listener - main handler in initSettingsListeners()
// [REMOVED] Settings Create User Logic - already handled in initSettingsListeners() at line 590

// -----------------------------------------------------------------------------


els.navDashboard?.addEventListener('click', () => {
  switchView('view-dashboard');
  updateNavState('nav-dashboard');
});
els.navSettings?.addEventListener('click', () => {
  switchView('view-settings');
  updateNavState('nav-settings');
  loadUsers(); // Refresh list when modifying settings
});
els.navUpdate?.addEventListener('click', () => {
  switchView('view-update');
  updateNavState('nav-update');
  renderUpdateState(updateState);
});
els.btnBackFromSingle?.addEventListener('click', () => {
  switchView('view-dashboard');
  updateNavState('nav-dashboard');
});
els.btnCancelSingle?.addEventListener('click', () => {
  switchView('view-dashboard');
  updateNavState('nav-dashboard');
});
els.btnBackFromBatch?.addEventListener('click', () => {
  switchView('view-dashboard');
  updateNavState('nav-dashboard');
});

// Open Add Views
function resetAddSingleForm() {
  if (els.singleUsername) els.singleUsername.value = '';
  if (els.singleProgramPath) els.singleProgramPath.value = '';
  if (els.singleExeName) els.singleExeName.innerHTML = '<option value="">-- Chọn hoặc nhập tên file --</option>';
  if (els.singleCloneTarget) els.singleCloneTarget.value = '';
  if (els.singleCloneName) els.singleCloneName.value = '';
  if (els.singleProxy) els.singleProxy.value = '';
  if (els.singleUserDataPath) els.singleUserDataPath.value = '';
  if (els.singleForceClone) els.singleForceClone.checked = false;
}

els.btnCreateNewCard?.addEventListener('click', () => {
  resetAddSingleForm();
  switchView('view-add-single');
});
els.btnAddCloneQuick?.addEventListener('click', () => {
  resetAddSingleForm();
  switchView('view-add-single');
});

// Switch Modes
els.modeSwitchBatch?.addEventListener('click', () => switchView('view-batch-add'));
els.modeSwitchSingle?.addEventListener('click', () => switchView('view-add-single'));

// Add Single App Logic
els.singleProgramPath?.addEventListener('change', () => {
  // Auto fill exe name
  const val = els.singleProgramPath.value;
  if (val && val.toLowerCase().endsWith('.exe')) {
    els.singleExeName.value = extractExeName(val);
  }
});

// Refresh User List
els.btnRefreshUsers?.addEventListener('click', () => {
  showStatus("Đang tải lại danh sách user...", "info");
  loadUsers();
});

els.singleUsername?.addEventListener('change', () => {
  const val = els.singleUsername.value;
  if (!val) return;

  // Auto-fill storagePath from profile
  const userObj = trackedUserObjects.find(u => u.username === val);
  if (userObj && userObj.storagePath && els.singleCloneTarget) {
    els.singleCloneTarget.value = userObj.storagePath;
  }

  // Check if we have a saved proxy for this user
  // Try explicit username match first
  let savedProxy = "";
  if (cloneOverrides[val] && cloneOverrides[val].proxy) {
    savedProxy = cloneOverrides[val].proxy;
  } else {
    // Try finding any clone with this username
    const found = trackedClones.find(c => c.username === val);
    if (found && cloneOverrides[found.id] && cloneOverrides[found.id].proxy) {
      savedProxy = cloneOverrides[found.id].proxy;
    }
  }

  if (savedProxy && els.singleProxy) {
    els.singleProxy.value = savedProxy;
  }
});
// [REMOVED] Duplicate listener - main handler in initSettingsListeners()

els.btnCreateSingle?.addEventListener('click', async () => {
  if (!canCreateMoreClones()) {
    showStatus("Không thể tạo thêm clone trong phiên hiện tại.", "error");
    return;
  }

  const username = els.singleUsername.value;
  const programPath = els.singleProgramPath.value;
  const exeName = els.singleExeName.value;
  const cloneTarget = els.singleCloneTarget.value;
  const cloneName = els.singleCloneName.value;
  const proxy = els.singleProxy.value;
  const force = els.singleForceClone.checked;

  if (proxy && !licenseState?.features?.proxy) {
    showStatus("Proxy đang được bật cho chế độ toàn quyền.", "error");
    return;
  }

  // Get selected group from dropdown
  const selectedGroup = els.singleGroupSelect?.value || "";
  const selectedGroups = selectedGroup ? [selectedGroup] : [];

  if (!username || !programPath || !cloneName || !exeName) {
    showStatus("Vui lòng điền đủ thông tin (User, Path, Tên Clone, Tên file .exe)", "error");
    return;
  }

  // Build full path
  let finalPath = programPath;
  if (!finalPath.toLowerCase().endsWith('.exe')) {
    let safeExeName = exeName;
    if (!safeExeName.toLowerCase().endsWith('.exe')) {
      safeExeName += ".exe";
    }
    finalPath = finalPath + "\\" + safeExeName;
  }

  // Check for duplicate app on same profile
  const appType = detectAppType(exeName);
  const existingApps = trackedClones.filter(c =>
    c.username.toLowerCase() === username.toLowerCase() &&
    detectAppType(c.exec_path || c.name || '') === appType
  );

  if (existingApps.length > 0 && username !== "NEW_USER") {
    const existingApp = existingApps[0];
    const result = confirm(
      `⚠️ CẢNH BÁO: Profile "${username}" đã có 1 ứng dụng ${appType} rồi!\n\n` +
      `App hiện tại: ${existingApp.name || existingApp.username}\n\n` +
      `Nếu tạo thêm ${appType} trên profile này, cả 2 sẽ dùng CHUNG 1 tài khoản.\n\n` +
      `Bạn có muốn tiếp tục không?\n` +
      `(Nhấn OK để tiếp tục, Cancel để chọn Profile khác)`
    );
    if (!result) {
      return;
    }
  }


  showLoading("Đang tạo bản sao...", "Quá trình này có thể mất vài phút tùy dung lượng app gốc.\nVui lòng không tắt phần mềm.");

  try {
    let finalUsername = username;

    // Auto Create User Logic
    if (username === "NEW_USER") {
      finalUsername = `User_${Date.now()}`;
      // Windows forbids password containing username. Use a fixed strong password.
      const autoPass = "12345678";

      showLoading("Đang khởi tạo User mới...", "Hệ thống đang tạo user Windows riêng biệt...");

      try {
        const userRes = await window.launcherAPI.createLocalUser({
          username: finalUsername,
          password: autoPass,
          proxy: proxy, // Save proxy for this new user immediately
          saveCred: true, // Always save cred for auto users
          profileDir: els.singleUserDataPath?.value?.trim() || (els.settingUserDataRoot?.value?.trim() ? els.settingUserDataRoot.value.trim() + "\\" + finalUsername : undefined)
        });

        if (!userRes.ok) {
          throw new Error(`Không tạo được user tự động: ${userRes.message}`);
        }

        // Save default proxy to Profile (so all apps from this profile inherit it)
        if (proxy && window.launcherAPI.updateUserDefaultProxy) {
          await window.launcherAPI.updateUserDefaultProxy(finalUsername, proxy);
        }

        // Refresh User List UI immediately
        await loadUsers();
      } catch (err) {
        hideLoading();
        showStatus(err.message, "error");
        return;
      }
    }

    showLoading("Đang tạo bản sao...", `Đang clone app cho profile ${finalUsername}...\nVui lòng chờ.`);

    const res = await window.launcherAPI.cloneApp({
      username: finalUsername,
      sourcePath: finalPath,
      cloneRoot: cloneTarget,
      cloneName: cloneName,
      force: force
    });

    hideLoading();

    if (res.ok) {
      // Save proxy and groups for the new clone
      // Reload list first
      await loadClones();
      const newClone = trackedClones.find(c => c.name === cloneName || c.username === username);
      if (newClone && (proxy || selectedGroups.length > 0)) {
        await window.launcherAPI.updateCloneOverride(newClone.id, {
          proxy: proxy || undefined,
          groups: selectedGroups.length > 0 ? selectedGroups : undefined
        });
        await loadOverrides(); // Refresh overrides
      }
      showStatus("Tạo thành công!", "success");
      switchView('view-dashboard');
    } else {
      showStatus("Lỗi: " + res.message, "error");
    }
  } catch (err) {
    showStatus("Lỗi hệ thống: " + err.message, "error");
  }
});

// Auto extract exe name on input/paste
// [REMOVED] 'input' listener causing lag. Logic moved to 'change'.

els.singleProgramPath?.addEventListener('change', async (e) => {
  let val = e.target.value.trim();
  if (val.includes('"')) {
    val = val.replace(/"/g, '');
    e.target.value = val;
  }

  // Auto extract exe name on change
  if (val && val.toLowerCase().includes('.exe')) {
    const exe = extractExeName(val);
    if (exe && exe.toLowerCase().endsWith('.exe') && !els.singleExeName.value) {
      els.singleExeName.value = exe;
    }
  }

  // If it looks like a directory (no .exe extension), scan for executables silently
  if (val && !val.toLowerCase().endsWith('.exe')) {
    try {
      const res = await window.launcherAPI.listExecutables(val);

      if (res.ok && res.files && res.files.length > 0) {
        // Populate the datalist with all found exe files
        const datalist = document.getElementById('exe-name-suggestions');
        if (datalist) {
          datalist.innerHTML = res.files.map(f => `<option value="${f}">`).join('');
        }

        // Try to auto-select best match (folder name match)
        const folderName = extractExeName(val).toLowerCase();
        const bestMatch = res.files.find(f => f.toLowerCase().replace('.exe', '') === folderName);
        if (bestMatch) {
          els.singleExeName.value = bestMatch;
        }

        showStatus(`Tìm thấy ${res.files.length} file .exe`, "success");
      } else {
        // Clear datalist if no files found
        const datalist = document.getElementById('exe-name-suggestions');
        if (datalist) datalist.innerHTML = '';
      }
    } catch (err) {
      // Silently fail - user can manually type
    }
  } else if (val && val.toLowerCase().endsWith('.exe')) {
    // User pasted a full path with .exe - extract and set it
    const exeName = extractExeName(val);
    els.singleExeName.value = exeName;
  }
});

// File Browsing
els.btnBrowseFile?.addEventListener('click', async () => {
  const path = await window.launcherAPI.selectProgram();
  if (path) {
    els.singleProgramPath.value = path;
    const exeName = extractExeName(path);
    if (exeName && exeName.toLowerCase().endsWith('.exe')) {
      els.singleExeName.value = exeName;
    }
  }
});

els.btnBrowseFolder?.addEventListener('click', async () => {
  const folder = await window.launcherAPI.selectFolder();
  if (folder) {
    els.singleCloneTarget.value = folder;
  }
});

// Batch browse buttons
els.btnBatchBrowseFile?.addEventListener('click', async () => {
  const path = await window.launcherAPI.selectProgram();
  if (path) {
    els.batchProgramPath.value = path;
    // Trigger change event to populate exe datalist
    els.batchProgramPath.dispatchEvent(new Event('change'));
  }
});

els.btnBatchBrowseFolder?.addEventListener('click', async () => {
  const folder = await window.launcherAPI.selectFolder();
  if (folder) {
    els.batchCloneDir.value = folder;
  }
});

els.btnBatchBrowseUserData?.addEventListener('click', async () => {
  const folder = await window.launcherAPI.selectFolder();
  if (folder) {
    els.batchUserDataPath.value = folder;
  }
});

// Batch program path change - populate exe datalist
els.batchProgramPath?.addEventListener('change', async (e) => {
  let val = e.target.value.trim();
  if (val.includes('"')) {
    val = val.replace(/"/g, '');
    e.target.value = val;
  }

  if (val && !val.toLowerCase().endsWith('.exe')) {
    try {
      const res = await window.launcherAPI.listExecutables(val);
      const datalist = document.getElementById('batch-exe-suggestions');
      if (res.ok && res.files && res.files.length > 0) {
        if (datalist) datalist.innerHTML = res.files.map(f => `<option value="${f}">`).join('');
        // Auto-select first exe
        const folderName = extractExeName(val).toLowerCase();
        const bestMatch = res.files.find(f => f.toLowerCase().replace('.exe', '') === folderName);
        if (bestMatch) els.batchExeName.value = bestMatch;
        else if (res.files.length === 1) els.batchExeName.value = res.files[0];
        showStatus(`Tìm thấy ${res.files.length} file .exe`, "success");
      } else {
        if (datalist) datalist.innerHTML = '';
      }
    } catch (err) { /* silent */ }
  } else if (val && val.toLowerCase().endsWith('.exe')) {
    els.batchExeName.value = extractExeName(val);
  }
});

// Batch cancel flag
let batchCancelled = false;

// Cancel batch button
els.btnCancelBatch?.addEventListener('click', () => {
  batchCancelled = true;
  showStatus("Đang hủy... Vui lòng đợi!", "info");
});

// Helper to add log entry
function addBatchLog(message, success = true) {
  if (!els.batchLogList) return;
  const div = document.createElement('div');
  div.className = `flex items-center gap-2 ${success ? 'text-green-500' : 'text-red-500'}`;
  div.innerHTML = `<span class="material-symbols-outlined text-[14px]">${success ? 'check_circle' : 'error'}</span><span>${message}</span>`;
  els.batchLogList.appendChild(div);
  els.batchLogList.scrollTop = els.batchLogList.scrollHeight;
}

// Update progress UI
function updateBatchProgress(current, total, status, successCount, failCount) {
  const percent = Math.round((current / total) * 100);
  if (els.batchProgressBar) els.batchProgressBar.style.width = `${percent}%`;
  if (els.batchProgressPercent) els.batchProgressPercent.textContent = `${percent}%`;
  if (els.batchProgressStatus) els.batchProgressStatus.textContent = status;
  if (els.batchSuccessCount) els.batchSuccessCount.textContent = successCount;
  if (els.batchTotalCount) els.batchTotalCount.textContent = total;
  if (els.batchFailCount) els.batchFailCount.textContent = failCount;
}

// Batch Logic
els.btnStartBatch?.addEventListener('click', async () => {
  const programPath = els.batchProgramPath?.value?.trim();
  const exeName = els.batchExeName?.value?.trim();
  const cloneDir = els.batchCloneDir?.value?.trim();
  const batchPassword = els.batchPassword?.value?.trim();
  const prefix = els.batchPrefix?.value?.trim() || 'Clone_';
  const count = parseInt(els.batchCount?.value) || 10;
  const userDataPath = els.batchUserDataPath?.value?.trim();
  const selectedGroup = els.batchGroupSelect?.value || '';
  const proxyListText = els.batchProxyList?.value || '';

  const proxyList = proxyListText.split('\n').map(p => p.trim()).filter(p => p);

  if (proxyList.length > 0 && !licenseState?.features?.proxy) {
    showStatus("Proxy đang được bật cho chế độ toàn quyền.", "error");
    return;
  }

  if (!programPath) { showStatus("Vui lòng nhập đường dẫn app gốc!", "error"); return; }
  if (!exeName) { showStatus("Vui lòng nhập tên file .exe!", "error"); return; }
  if (!cloneDir) { showStatus("Vui lòng chọn thư mục lưu clone!", "error"); return; }
  if (!batchPassword) { showStatus("Vui lòng nhập mật khẩu cho Profile hàng loạt!", "error"); return; }
  if (count < 1 || count > 500) { showStatus("Số lượng tạo phải từ 1 đến 500!", "error"); return; }

  if (!licenseState?.features?.batch) {
    showStatus("Tính năng tạo hàng loạt đang được bật cho chế độ toàn quyền.", "error");
    return;
  }

  if (licenseState.limits?.maxClones !== Infinity) {
    const max = licenseState.limits?.maxClones || 500;
    const current = trackedClones.length;
    if (current + count > max) {
      showStatus(`Không thể tạo thêm ${count} bản sao trong phiên hiện tại.`, "error");
      return;
    }
  }

  let sourcePath = programPath;
  if (!sourcePath.toLowerCase().endsWith('.exe')) {
    let safeExe = exeName;
    if (!safeExe.toLowerCase().endsWith('.exe')) safeExe += '.exe';
    sourcePath = sourcePath + '\\' + safeExe;
  }

  let successCount = 0;
  let failCount = 0;
  batchCancelled = false;

  // Show progress section
  els.batchProgressSection?.classList.remove('hidden');
  els.btnStartBatch.disabled = true;
  if (els.batchLogList) els.batchLogList.innerHTML = '';
  updateBatchProgress(0, count, 'Đang chuẩn bị...', 0, 0);

  for (let i = 1; i <= count; i++) {
    if (batchCancelled) { addBatchLog('Đã hủy bởi người dùng!', false); break; }

    const profileName = `${prefix}${i}`;
    const proxy = proxyList[i - 1] || '';
    updateBatchProgress(i - 1, count, `Đang tạo: ${profileName}...`, successCount, failCount);

    try {
      const userRes = await window.launcherAPI.createLocalUser({
        username: profileName, password: batchPassword, saveCredential: true,
        userDataPath: userDataPath || undefined, proxy: proxy || undefined
      });

      if (!userRes.ok) { addBatchLog(`${profileName} - Lỗi profile: ${userRes.message}`, false); failCount++; continue; }
      if (proxy) await window.launcherAPI.updateUserDefaultProxy(profileName, proxy);

      const cloneRes = await window.launcherAPI.cloneApp({
        username: profileName, sourcePath, cloneRoot: cloneDir, cloneName: profileName, force: false
      });

      if (!cloneRes.ok) { addBatchLog(`${profileName} - Lỗi clone: ${cloneRes.message}`, false); failCount++; continue; }

      // Assign Group and Proxy to the new clone
      // Use appId from cloneRes if available, otherwise find by matching clone path
      let cloneId = cloneRes.appId;
      if (!cloneId) {
        await loadClones();
        const newClone = trackedClones.find(c => c.username === profileName || c.name === profileName || (c.path && c.path.includes(profileName)));
        cloneId = newClone?.id;
      }

      if (cloneId && (selectedGroup || proxy)) {
        console.log(`Assigning group "${selectedGroup}" and proxy to clone ${cloneId}`);
        await window.launcherAPI.updateCloneOverride(cloneId, {
          proxy: proxy || undefined,
          groups: selectedGroup ? [selectedGroup] : undefined
        });
      } else if (selectedGroup || proxy) {
        console.warn(`Could not find clone ID for ${profileName} to assign group/proxy`);
      }

      addBatchLog(`${profileName} - Hoàn thành`, true);
      successCount++;
    } catch (err) {
      addBatchLog(`${profileName} - Lỗi: ${err.message}`, false);
      failCount++;
    }
  }

  updateBatchProgress(count, count, batchCancelled ? 'Đã hủy' : 'Hoàn thành!', successCount, failCount);
  els.btnStartBatch.disabled = false;

  await loadUsers(); await loadClones(); await loadOverrides();

  if (batchCancelled) showStatus(`Đã hủy! Tạo được ${successCount} bản clone.`, "info");
  else if (failCount === 0) showStatus(`Đã tạo thành công ${successCount} bản clone!`, "success");
  else showStatus(`Hoàn thành: ${successCount} thành công, ${failCount} thất bại`, "error");
});



// Refresh User List Button
els.btnRefreshUsers?.addEventListener('click', () => {
  showStatus("Đang tải lại danh sách user...", "info");
  loadUsers();
});

// =============================================================================
// GROUP MANAGEMENT
// =============================================================================

async function loadGroups() {
  try {
    const res = await window.launcherAPI.getGroups();
    if (res.ok) {
      groups = res.groups || [];
      renderGroupFilterUI();
      renderGroupList();
      renderSingleGroupSelect(); // Update clone form group dropdown
      renderBatchGroupSelect(); // Update batch form group dropdown
    }
  } catch (e) {
    console.error("Failed to load groups:", e);
  }
}

async function saveGroups() {
  try {
    await window.launcherAPI.saveGroups(groups);
  } catch (e) {
    console.error("Failed to save groups:", e);
  }
}

function renderGroupFilterUI() {
  // Update "Tất cả" button state
  if (els.filterAll) {
    const isAll = activeGroupFilters.length === 0;
    els.filterAll.className = `flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors ${isAll
      ? 'bg-primary text-white pointer-events-none'
      : 'bg-slate-100 dark:bg-[#232f48] text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-[#2d3b55]'
      }`;
    // Icon logic removed as requested
  }

  // Update dropdown button state if filters active
  if (els.btnFilterDropdown) {
    const hasFilters = activeGroupFilters.length > 0;
    els.btnFilterDropdown.className = `flex h-9 items-center gap-2 px-3 rounded-lg transition-colors border ${hasFilters
      ? 'bg-primary/20 text-white border-primary/50' // Changed to text-white
      : 'bg-slate-100 dark:bg-[#232f48] hover:bg-slate-200 dark:hover:bg-[#2d3b55] text-slate-700 dark:text-white border-transparent'
      }`;
  }

  renderGroupFilterDropdown();
  renderActiveGroupChips();
}

function renderGroupFilterDropdown() {
  if (!els.filterDropdownMenu) return;

  if (groups.length === 0) {
    els.filterDropdownMenu.innerHTML = '<p class="text-xs text-slate-500 p-2 text-center">Chưa có Group nào</p>';
    return;
  }

  els.filterDropdownMenu.innerHTML = groups.map(group => {
    const isSelected = activeGroupFilters.includes(group);
    return `
      <div class="flex items-center gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" onclick="toggleGroupFilter('${group}')">
        <div class="size-4 rounded border flex items-center justify-center transition-colors ${isSelected
        ? 'bg-primary border-primary'
        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
      }">
          ${isSelected ? '<span class="material-symbols-outlined text-white text-[12px]">check</span>' : ''}
        </div>
        <span class="text-sm text-slate-700 dark:text-white truncate select-none">${group}</span>
      </div>
    `;
  }).join('');
}

function renderActiveGroupChips() {
  if (!els.activeGroupChips) return;

  els.activeGroupChips.innerHTML = activeGroupFilters.map(group => `
    <div class="flex items-center gap-1.5 h-7 px-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800/50">
      <span class="text-[13px] font-medium leading-none">${group}</span>
      <button class="hover:text-red-500 rounded-full flex items-center justify-center transition-colors" onclick="toggleGroupFilter('${group}')">
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  `).join('');
}

// Make globally accessible for onclick events in string HTML
window.toggleGroupFilter = function (groupName) {
  if (activeGroupFilters.includes(groupName)) {
    activeGroupFilters = activeGroupFilters.filter(g => g !== groupName);
  } else {
    activeGroupFilters.push(groupName);
  }
  renderGroupFilterUI();
  renderCloneGrid();
};

function clearGroupFilters() {
  activeGroupFilters = [];
  renderGroupFilterUI();
  renderCloneGrid();
}

// Dropdown Toggling
if (els.btnFilterDropdown) {
  els.btnFilterDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    els.filterDropdownMenu?.classList.toggle('hidden');
  });
}

// Close Dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (els.filterDropdownMenu && !els.filterDropdownMenu.classList.contains('hidden')) {
    if (!els.filterDropdownMenu.contains(e.target) && !els.btnFilterDropdown.contains(e.target)) {
      els.filterDropdownMenu.classList.add('hidden');
    }
  }
});

if (els.filterAll) {
  els.filterAll.addEventListener('click', clearGroupFilters);
}


function renderGroupList() {
  if (!els.groupList) return;

  if (groups.length === 0) {
    els.groupList.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Chưa có Group nào. Thêm Group mới ở trên!</p>';
    return;
  }

  els.groupList.innerHTML = groups.map(groupName => `
    <div class="flex items-center justify-between bg-slate-50 dark:bg-[#111722] rounded-lg px-4 py-3">
      <span class="text-sm text-slate-900 dark:text-white font-medium">${groupName}</span>
      <button class="btn-delete-group text-red-500 hover:text-red-600" data-group="${groupName}">
        <span class="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  `).join('');

  // Add delete listeners
  els.groupList.querySelectorAll('.btn-delete-group').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.group;
      if (confirm(`Xóa Group "${name}" ? Apps sẽ không bị xóa.`)) {
        deleteGroup(name);
      }
    });
  });
}

function addGroup(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (groups.includes(trimmed)) {
    showStatus(`Group "${trimmed}" đã tồn tại!`, "error");
    return;
  }
  groups.push(trimmed);
  saveGroups();
  renderGroupFilterUI();
  renderGroupList();
  renderSingleGroupSelect(); // Update clone form group dropdown
  renderBatchGroupSelect(); // Update batch form group dropdown
  showStatus(`Đã thêm Group "${trimmed}"`, "success");
}

function deleteGroup(name) {
  groups = groups.filter(g => g !== name);
  // Also remove from all clones
  Object.keys(cloneOverrides).forEach(appId => {
    if (cloneOverrides[appId].groups) {
      cloneOverrides[appId].groups = cloneOverrides[appId].groups.filter(g => g !== name);
    }
  });

  // Remove from active filters if present
  if (activeGroupFilters.includes(name)) {
    activeGroupFilters = activeGroupFilters.filter(g => g !== name);
    renderCloneGrid(); // Re-render grid to reflect filter removal
  }

  saveGroups();
  renderGroupFilterUI();
  renderGroupList();
  renderSingleGroupSelect(); // Update clone form dropdown in real-time
  renderBatchGroupSelect(); // Update batch form dropdown in real-time
  showStatus(`Đã xóa Group "${name}"`, "success");
}

function openGroupManager() {
  if (els.modalGroupManager) {
    els.modalGroupManager.classList.remove('hidden');
    renderGroupList();
  }
}

function closeGroupManager() {
  if (els.modalGroupManager) {
    els.modalGroupManager.classList.add('hidden');
  }
}

// Group event listeners
els.btnManageGroups?.addEventListener('click', openGroupManager);
els.btnCloseGroupModal?.addEventListener('click', closeGroupManager);
els.modalGroupManager?.addEventListener('click', (e) => {
  if (e.target === els.modalGroupManager) closeGroupManager();
});
els.btnAddGroup?.addEventListener('click', () => {
  if (els.inputNewGroup) {
    addGroup(els.inputNewGroup.value);
    els.inputNewGroup.value = '';
  }
});
els.inputNewGroup?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addGroup(els.inputNewGroup.value);
    els.inputNewGroup.value = '';
  }
});

// =============================================================================
// ACCESS / ACCOUNT TAB
// =============================================================================

async function loadLicenseStatus() {
  if (!window.licenseAPI) return;
  try {
    const result = await window.licenseAPI.verify();
    licenseState = {
      activated: true,
      valid: true,
      tier: result.tier || 'free',
      tierName: result.tierName || 'Toàn quyền',
      limits: result.limits || { maxClones: Infinity, batchCreate: true, name: 'Toàn quyền' },
      features: result.features || { batch: true, proxy: true }
    };
    updateLicenseUI(licenseState);
  } catch (e) {
    console.error('Failed to verify access status:', e);
    // Nếu lỗi mạng, fallback về getStatus (offline mode)
    try {
      const status = await window.licenseAPI.getStatus();
      licenseState = status;
      updateLicenseUI(status);
    } catch (e2) {
      console.error('Failed to get access status:', e2);
    }
  }
}

function updateLicenseUI(status) {
  const tierMap = {
    free: { name: 'Toàn quyền', badge: 'Đã mở khóa', color: 'bg-gradient-to-r from-neon-green to-neon-blue text-black' },
    plus: { name: 'Plus', badge: 'Plus', color: 'bg-neon-purple text-white' },
    ultra: { name: 'Ultra', badge: 'Ultra 🚀', color: 'bg-gradient-to-r from-neon-purple to-neon-blue text-white' }
  };

  const tier = (status.tier || 'free').toLowerCase();
  const info = tierMap[tier] || tierMap.free;

  if (els.licenseTierName) els.licenseTierName.textContent = info.name;
  if (els.licenseTierBadge) {
    els.licenseTierBadge.textContent = info.badge;
    els.licenseTierBadge.className = `px-4 py-2 rounded-full text-sm font-bold ${info.color}`;
  }

  // Icon color based on tier
  if (els.licenseTierIcon) {
    const icon = els.licenseTierIcon.querySelector('span');
    if (tier === 'ultra' || tier === 'free') {
      els.licenseTierIcon.className = 'size-12 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue flex items-center justify-center';
      if (icon) icon.className = 'material-symbols-outlined text-[24px] text-white';
    } else if (tier === 'plus') {
      els.licenseTierIcon.className = 'size-12 rounded-full bg-neon-purple flex items-center justify-center';
      if (icon) icon.className = 'material-symbols-outlined text-[24px] text-white';
    } else {
      els.licenseTierIcon.className = 'size-12 rounded-full bg-slate-700 flex items-center justify-center';
      if (icon) icon.className = 'material-symbols-outlined text-[24px] text-slate-400';
    }
  }

  // Expiry date (hide for free tier)
  if (els.licenseExpiryRow) {
    if (status.expiresAt && tier !== 'free') {
      els.licenseExpiryRow.classList.remove('hidden');
      els.licenseExpiryRow.classList.add('flex');
      if (els.licenseExpiryDate) {
        const date = new Date(status.expiresAt);
        els.licenseExpiryDate.textContent = date.toLocaleDateString('vi-VN');
      }
    } else {
      els.licenseExpiryRow.classList.add('hidden');
      els.licenseExpiryRow.classList.remove('flex');
    }
  }

  // Clone usage
  const cloneCount = trackedClones.length;
  // Ultra tier = unlimited, JSON does not support Infinity so check tier directly
  let maxClones = Infinity;
  if (tier === 'ultra' || tier === 'free') {
    maxClones = Infinity;
  } else if (tier === 'plus') {
    maxClones = 20;
  } else {
    maxClones = status.limits?.maxClones ?? 5;
  }

  if (els.licenseCloneUsed) els.licenseCloneUsed.textContent = cloneCount;
  if (els.licenseCloneLimit) {
    els.licenseCloneLimit.textContent = maxClones === Infinity ? '∞' : maxClones;
  }
}

function canCreateMoreClones() {
  return true;
}

// Account/License Tab Event Listeners
els.navAccount?.addEventListener('click', () => {
  switchView('view-account');
  loadLicenseStatus();
  updateNavState('nav-account');
});

els.btnBackFromAccount?.addEventListener('click', () => {
  switchView('view-dashboard');
  updateNavState('nav-dashboard');
});

els.btnCopyDonateAccount?.addEventListener('click', async () => {
  try {
    const copied = await copyTextToClipboard('251225042004');
    showStatus(copied ? 'Đã copy số tài khoản.' : 'Không thể copy số tài khoản.', copied ? 'success' : 'error');
  } catch (error) {
    showStatus('Không thể copy số tài khoản.', 'error');
  }
});

els.btnCopyDonateMessage?.addEventListener('click', async () => {
  try {
    const copied = await copyTextToClipboard('Ủng hộ Clone App ULTRA');
    showStatus(copied ? 'Đã copy nội dung chuyển khoản.' : 'Không thể copy nội dung.', copied ? 'success' : 'error');
  } catch (error) {
    showStatus('Không thể copy nội dung.', 'error');
  }
});

// BLOCKING MODAL cho key bị BAN/REVOKE - KHÔNG CHO ĐÓNG
function showBlockingBannedModal(errorMessage) {
  // Xóa modal cũ nếu có
  document.getElementById('banned-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'banned-modal';
  modal.className = 'fixed inset-0 bg-slate-950/90 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm';
  modal.innerHTML = `
    <div class="bg-[#1e293b] p-8 rounded-2xl border border-emerald-500/50 max-w-md text-center shadow-2xl relative overflow-hidden">
      <div class="absolute inset-0 bg-emerald-500/10 pointer-events-none"></div>
      <div class="text-6xl mb-4">✅</div>
      <h2 class="text-2xl font-bold text-emerald-400 mb-2">Toàn quyền đang hoạt động</h2>
      <p class="text-gray-400 mb-6">${errorMessage || 'Cơ chế khóa license đã được gỡ bỏ.'}</p>
      <button id="btn-close-free-full-modal" class="px-8 py-3 bg-gradient-to-r from-emerald-600 to-blue-500 hover:from-emerald-500 hover:to-blue-400 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg w-full">
        Đóng
      </button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btn-close-free-full-modal')?.addEventListener('click', () => {
    modal.remove();
  });
}

function showNuclearModal(errorMessage) {
  // Xóa modal cũ
  document.getElementById('banned-modal')?.remove();

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-slate-950/90 z-[999999] flex items-center justify-center p-4 backdrop-blur-md';
  modal.innerHTML = `
    <div class="bg-[#1e293b] p-10 rounded-3xl border-2 border-emerald-500/60 text-center shadow-[0_0_80px_rgba(16,185,129,0.25)] max-w-2xl relative overflow-hidden">
      <div class="text-8xl mb-6">🛡️</div>
      <h2 class="text-4xl font-black text-emerald-400 mb-4 tracking-widest uppercase">FULL ACCESS</h2>
      <p class="text-white text-xl mb-8">${errorMessage || 'Chế độ bảo vệ phá hủy đã được tắt.'}</p>
      <button id="btn-close-nuclear-disabled-modal" class="px-8 py-3 bg-gradient-to-r from-emerald-600 to-blue-500 hover:from-emerald-500 hover:to-blue-400 text-white rounded-xl font-bold transition-all shadow-lg">
        Đóng
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('btn-close-nuclear-disabled-modal')?.addEventListener('click', () => {
    modal.remove();
  });
}

function checkExpiry() {
  document.getElementById('expiry-modal')?.remove();
  document.getElementById('expiry-toast')?.remove();
}

// Initialization
(async function init() {
  await resolveKnownAssetUrls();
  await resolveStaticImages();
  initSettingsListeners();
  initUpdateSection();
  initAutoFillListeners();
  await loadAppSettings();
  await loadGroups();
  await loadUsers();
  await loadClones();
  await loadLicenseStatus();
  if (globalAppSettings.autoUpdateEnabled) {
    handleCheckUpdate({ silent: true, autoDownload: true });
  }
  checkExpiry();

  // Trigger Auto-fill initial state after data is loaded
  if (els.singleUsername && els.singleUsername.value) {
    els.singleUsername.dispatchEvent(new Event('change'));
  }
})();
