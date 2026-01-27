/**
 * renderer.js - Logic cho giao diện mới (SPA)
 */

const els = {
  // Nav
  navDashboard: document.getElementById('nav-dashboard'),
  navSettings: document.getElementById('nav-settings'),
  navAccount: document.getElementById('nav-account'),

  // Views
  viewDashboard: document.getElementById('view-dashboard'),
  viewAddSingle: document.getElementById('view-add-single'),
  viewBatchAdd: document.getElementById('view-batch-add'),
  viewSettings: document.getElementById('view-settings'),

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
  btnAppDelete: document.getElementById('btn-app-delete')
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

// Saved credentials (stored in localStorage for persistence)
let savedCredentials = {};

function loadSavedCredentials() {
  try {
    const data = localStorage.getItem('savedCredentials');
    if (data) {
      savedCredentials = JSON.parse(data);
    }
  } catch (e) {
    console.warn('Failed to load saved credentials:', e);
    savedCredentials = {};
  }
}

// Global App Settings Accessor
function getGlobalAppSetting(key) {
  return globalAppSettings[key] || "";
}

function saveSavedCredentials() {
  try {
    localStorage.setItem('savedCredentials', JSON.stringify(savedCredentials));
  } catch (e) {
    console.warn('Failed to save credentials:', e);
  }
}

function hasCredentialForUser(username) {
  return !!savedCredentials[username];
}

function getCredentialForUser(username) {
  return savedCredentials[username] || null;
}

function saveCredentialForUser(username, password) {
  savedCredentials[username] = password;
  saveSavedCredentials();
}

function clearCredentialForUser(username) {
  delete savedCredentials[username];
  saveSavedCredentials();
}

// Load saved credentials on startup
loadSavedCredentials();

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
    }
  }
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
        showStatus("Vui lòng nhập User và Pass", "error");
        return;
      }

      if (els.btnCreateUserSetting.disabled) return;
      els.btnCreateUserSetting.disabled = true;

      showLoading("Đang tạo User...");
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



  // Also handle Browse Folder in Add Single View to avoid duplicates
  if (els.btnBrowseFolder) {
    els.btnBrowseFolder.onclick = async () => {
      const folder = await window.launcherAPI.selectFolder();
      if (folder) {
        if (els.singleCloneTarget) els.singleCloneTarget.value = folder;
      }
    };
  }
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
      if (confirm(`Bạn có chắc muốn xóa user "${u}"?\nUser này sẽ bị xóa khỏi hệ thống Windows.`)) {
        showLoading("Đang xóa User...", "Vui lòng chờ...");
        try {
          const res = await window.launcherAPI.deleteTrackedUser(u);
          hideLoading();
          if (res.ok) {
            showStatus(`Đã xóa user ${u}`, "success");
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
  zalo: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2UZmz-gHnORYf7coDXx2BP90aYWuAJ5NV-PAtrbhRwW6Os94X--DLIYMlh1Q29ETZBdbE9OlwOWBtiQIpOpOo-xHEJMrbnvG_sIxfraRqOkYerVL2-GHZmQjW-d-p5fZaZIKywSqx1xVXYltQBCkbzfLu9-SHNsW05T_fbhfy289UsdlPv1GAz_E29udwRzE9ztCmsW6FmQdmALncuIbFFfY_OMBCI96CFSk1LH4Cqz07kF0dHALG_p8I6FitmDNt2b-HQpkYg0Q",
  chrome: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg",
  default: "https://cdn-icons-png.flaticon.com/512/2666/2666505.png" // Generic App Icon
};

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
            <h3 class="text-white text-base font-bold leading-tight group-hover:text-neon-blue transition-colors text-center truncate w-full tracking-wide" title="${displayName}">${displayName}</h3>
            <p class="text-slate-500 text-xs font-medium text-center truncate w-full px-2 font-mono group-hover:text-slate-300 transition-colors" title="${clone.username}">${clone.username}</p>
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
        await window.launcherAPI.deleteTrackedApp(clone.id);
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

    // Check if we have saved credential for this user
    if (hasCredentialForUser(clone.username)) {
      password = getCredentialForUser(clone.username);
      showStatus(`Đang chạy ${clone.username} với credential đã lưu...`);
    } else {
      // Show password dialog for authentication
      const result = await showPasswordModal(clone);
      if (!result) {
        // User cancelled
        return;
      }
      password = result.password;
      saveCredential = result.saveCredential;

      // Save credential if user checked the save checkbox
      if (saveCredential && password) {
        saveCredentialForUser(clone.username, password);
      }
    }

    // Launch with password
    const payload = {
      programPath: clone.exec_path,
      username: clone.username,
      proxy: proxy,
      password: password,
      saveCredential: saveCredential
    };

    const res = await window.launcherAPI.launchClone(payload);

    if (res.ok) {
      showStatus("Đã khởi chạy thành công!", "success");
    } else if (res.passwordWrong) {
      // Password was wrong - clear saved credential and retry
      clearCredentialForUser(clone.username);
      showStatus("Sai mật khẩu! Vui lòng nhập lại.", "error");
      // Retry launch to show password dialog again
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
  const navs = [els.navDashboard, els.navSettings, els.navAccount];
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
    await window.launcherAPI.createCloneShortcut({
      username: currentSettingsClone.username,
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
    await window.launcherAPI.deleteTrackedApp(currentSettingsClone.id);

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

// Settings Create User Logic
// [REMOVED] Auto-generate user button logic

els.btnCreateUserSetting?.addEventListener('click', async () => {
  const username = els.settingUserName?.value.trim();
  const password = els.settingUserPass?.value;
  const proxy = els.settingUserProxy?.value.trim();
  const saveCred = els.settingSaveCred?.checked;

  if (!username || !password) {
    showStatus("Vui lòng nhập Username và Password!", "error");
    return;
  }

  showStatus("Đang tạo User...", "info");
  try {
    const payload = {
      username: username,
      password: password,
      proxy: proxy,
      saveCred: saveCred
    };
    const result = await window.launcherAPI.createLocalUser(payload);
    if (result.ok) {
      showStatus(`Đã tạo User ${username} thành công!`, "success");
      loadUsers(); // Refresh user list
      // Clear inputs
      els.settingUserName.value = "";
      els.settingUserPass.value = "";
      els.settingUserProxy.value = "";

      // Save proxy preference for this user
      if (proxy) {
        await window.launcherAPI.updateCloneOverride({
          appId: username, // Use username as key
          proxy: proxy
        });
        cloneOverrides[username] = { proxy: proxy };
      }
    } else {
      showStatus(`Lỗi tạo User: ${result.message}`, "error");
    }
  } catch (e) {
    showStatus("Lỗi tạo user: " + e.message, "error");
  }
});

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
  const username = els.singleUsername.value;
  const programPath = els.singleProgramPath.value;
  const exeName = els.singleExeName.value;
  const cloneTarget = els.singleCloneTarget.value;
  const cloneName = els.singleCloneName.value;
  const proxy = els.singleProxy.value;
  const force = els.singleForceClone.checked;

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
      const autoPass = "Hhbspace@2026";

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
els.singleProgramPath?.addEventListener('input', (e) => {
  const val = e.target.value;
  // Simple check: if it ends with .exe, extract it
  if (val && val.toLowerCase().includes('.exe')) {
    const exe = extractExeName(val);
    if (exe && exe.toLowerCase().endsWith('.exe')) {
      els.singleExeName.value = exe;
      // Also remove quotes if present in the input for cleaner path
      if (val.includes('"')) {
        e.target.value = val.replace(/"/g, '');
      }
    }
  }
});

els.singleProgramPath?.addEventListener('change', async (e) => {
  let val = e.target.value.trim();
  if (val.includes('"')) {
    val = val.replace(/"/g, '');
    e.target.value = val;
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
  const prefix = els.batchPrefix?.value?.trim() || 'Clone_';
  const count = parseInt(els.batchCount?.value) || 10;
  const userDataPath = els.batchUserDataPath?.value?.trim();
  const selectedGroup = els.batchGroupSelect?.value || '';
  const proxyListText = els.batchProxyList?.value || '';

  const proxyList = proxyListText.split('\n').map(p => p.trim()).filter(p => p);

  if (!programPath) { showStatus("Vui lòng nhập đường dẫn app gốc!", "error"); return; }
  if (!exeName) { showStatus("Vui lòng nhập tên file .exe!", "error"); return; }
  if (!cloneDir) { showStatus("Vui lòng chọn thư mục lưu clone!", "error"); return; }
  if (count < 1 || count > 500) { showStatus("Số lượng tạo phải từ 1 đến 500!", "error"); return; }

  let sourcePath = programPath;
  if (!sourcePath.toLowerCase().endsWith('.exe')) {
    let safeExe = exeName;
    if (!safeExe.toLowerCase().endsWith('.exe')) safeExe += '.exe';
    sourcePath = sourcePath + '\\' + safeExe;
  }

  const defaultPassword = 'Hhbspace@2026';
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
        username: profileName, password: defaultPassword, saveCredential: true,
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


// Initialization
(async function init() {
  initSettingsListeners();
  initAutoFillListeners();
  await loadAppSettings();
  await loadGroups();
  await loadUsers();
  await loadClones();

  // Trigger Auto-fill initial state after data is loaded
  if (els.singleUsername && els.singleUsername.value) {
    els.singleUsername.dispatchEvent(new Event('change'));
  }
})();
