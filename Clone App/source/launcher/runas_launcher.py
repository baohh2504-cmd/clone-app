import argparse
import getpass
import os
import json
import shlex
import shutil
import winreg
import subprocess
from subprocess import CREATE_NEW_CONSOLE
import sys
import textwrap
import uuid
from pathlib import Path
from typing import Optional, Tuple
import tempfile
import datetime
import time
import ctypes
from ctypes import wintypes

# FIXED: Define constants for magic numbers
# Windows API constants for CreateProcessWithLogonW
LOGON_WITH_PROFILE = 0x00000001
CREATE_UNICODE_ENVIRONMENT = 0x00000400
CREATE_NEW_CONSOLE_FLAG = 0x00000010

# Shell Notification constants
SHCNE_ASSOCCHANGED = 0x08000000
SHCNF_IDLIST = 0x0000

# Timeout constants (in milliseconds)
DEFAULT_COMMAND_TIMEOUT_MS = 120000  # 2 minutes
MAX_COMMAND_TIMEOUT_MS = 600000      # 10 minutes
DEBUG_LOG_ENABLED = os.environ.get("CLONE_APP_DEBUG") == "1"


# Windows Credential API structures
class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ('Flags', wintypes.DWORD),
        ('Type', wintypes.DWORD),
        ('TargetName', wintypes.LPWSTR),
        ('Comment', wintypes.LPWSTR),
        ('LastWritten', wintypes.FILETIME),
        ('CredentialBlobSize', wintypes.DWORD),
        ('CredentialBlob', ctypes.POINTER(ctypes.c_byte)),
        ('Persist', wintypes.DWORD),
        ('AttributeCount', wintypes.DWORD),
        ('Attributes', ctypes.c_void_p),
        ('TargetAlias', wintypes.LPWSTR),
        ('UserName', wintypes.LPWSTR),
    ]

# STARTUPINFO structure
class STARTUPINFOW(ctypes.Structure):
    _fields_ = [
        ("cb", wintypes.DWORD),
        ("lpReserved", wintypes.LPWSTR),
        ("lpDesktop", wintypes.LPWSTR),
        ("lpTitle", wintypes.LPWSTR),
        ("dwX", wintypes.DWORD),
        ("dwY", wintypes.DWORD),
        ("dwXSize", wintypes.DWORD),
        ("dwYSize", wintypes.DWORD),
        ("dwXCountChars", wintypes.DWORD),
        ("dwYCountChars", wintypes.DWORD),
        ("dwFillAttribute", wintypes.DWORD),
        ("dwFlags", wintypes.DWORD),
        ("wShowWindow", wintypes.WORD),
        ("cbReserved2", wintypes.WORD),
        ("lpReserved2", ctypes.POINTER(wintypes.BYTE)),
        ("hStdInput", wintypes.HANDLE),
        ("hStdOutput", wintypes.HANDLE),
        ("hStdError", wintypes.HANDLE),
    ]


# PROCESS_INFORMATION structure
class PROCESS_INFORMATION(ctypes.Structure):
    _fields_ = [
        ("hProcess", wintypes.HANDLE),
        ("hThread", wintypes.HANDLE),
        ("dwProcessId", wintypes.DWORD),
        ("dwThreadId", wintypes.DWORD),
    ]


def create_process_as_user(
    username: str, password: str, command: str, working_dir: str = None
) -> int:
    """
    Launch a process as another user using CreateProcessWithLogonW.
    This bypasses runas.exe and doesn't require console input.
    Returns 0 on success, or the Windows error code on failure.
    """
    try:
        # Split username into domain and user if needed
        if "\\" in username:
            domain, user = username.split("\\", 1)
        else:
            domain = os.environ.get("COMPUTERNAME", ".")
            user = username

        debug_log(
            f"CreateProcessWithLogonW: domain={domain}, user={user}, command={command[:100]}..."
        )

        # Initialize structures
        startup_info = STARTUPINFOW()
        startup_info.cb = ctypes.sizeof(STARTUPINFOW)
        startup_info.dwFlags = 0

        process_info = PROCESS_INFORMATION()

        # Use WinDLL with use_last_error for proper error handling
        advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)

        # Call CreateProcessWithLogonW
        result = advapi32.CreateProcessWithLogonW(
            user,  # lpUsername
            domain,  # lpDomain
            password,  # lpPassword
            LOGON_WITH_PROFILE,  # dwLogonFlags
            None,  # lpApplicationName
            command,  # lpCommandLine
            CREATE_NEW_CONSOLE_FLAG,  # dwCreationFlags
            None,  # lpEnvironment
            working_dir,  # lpCurrentDirectory
            ctypes.byref(startup_info),  # lpStartupInfo
            ctypes.byref(process_info),  # lpProcessInformation
        )

        if result:
            # Close handles
            ctypes.windll.kernel32.CloseHandle(process_info.hProcess)
            ctypes.windll.kernel32.CloseHandle(process_info.hThread)
            debug_log(
                f"CreateProcessWithLogonW SUCCESS! PID: {process_info.dwProcessId}"
            )

            # Refresh taskbar icons to pick up the correct icon
            try:
                # SHChangeNotify with SHCNE_ASSOCCHANGED refreshes shell icon associations
                # FIXED: Use constants instead of magic numbers
                ctypes.windll.shell32.SHChangeNotify(
                    SHCNE_ASSOCCHANGED, SHCNF_IDLIST, None, None
                )
            except (OSError, AttributeError):
                # FIXED: Catch specific Windows API errors
                pass  # Non-critical, icon refresh can fail

            return 0
        else:
            error_code = ctypes.get_last_error()
            error_msgs = {
                1326: "Logon failure: unknown user name or bad password",
                1327: "Account restriction: password expired or account disabled",
                1907: "Password must change before first logon",
                1314: "A required privilege is not held by the client",
                2: "The system cannot find the file specified",
                267: "The directory name is invalid",
                5: "Access is denied",
            }
            error_msg = error_msgs.get(error_code, f"Unknown error")
            debug_log(
                f"CreateProcessWithLogonW FAILED! Error {error_code}: {error_msg}"
            )
            return error_code
    except Exception as e:
        debug_log(f"CreateProcessWithLogonW exception: {e}")
        import traceback

        debug_log(traceback.format_exc())
        return -1


# DEBUG LOGGING (Internal)
def debug_log(msg: str):
    if not DEBUG_LOG_ENABLED:
        return
    try:
        # Use relative path for debugging
        debug_file = Path("launcher_exec_debug.txt")
        with open(debug_file, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.datetime.now()}] {msg}\n")
    except (OSError, PermissionError, IOError):
        # FIXED: Catch specific file I/O errors instead of broad Exception
        pass  # Silent fail for debug logging is acceptable


# DEBUG: EARLY PROBE
if DEBUG_LOG_ENABLED:
    try:
        Path("alive_probe.txt").write_text("I am alive!", encoding="utf-8")
    except:
        pass

SCRIPT_DIR = Path(__file__).resolve().parent
# Import encrypted config module
try:
    from config_crypto import (
        load_config as _load_encrypted_config,
        save_config as _save_encrypted_config,
    )

    USE_ENCRYPTED_CONFIG = True
except ImportError:
    USE_ENCRYPTED_CONFIG = False

# Legacy path (for migration)
USER_REGISTRY_PATH = SCRIPT_DIR / "created_users.json"
STARTUP_DIR = (
    Path(os.environ.get("APPDATA", ""))
    / "Microsoft"
    / "Windows"
    / "Start Menu"
    / "Programs"
    / "Startup"
)
USERLIST_REG_PATH = r"HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\SpecialAccounts\UserList"


def run_hidden(cmd, **kwargs):
    if os.name == "nt" and "creationflags" not in kwargs:
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    return subprocess.run(cmd, **kwargs)


try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass


def load_registry() -> dict:
    # Use encrypted config if available
    if USE_ENCRYPTED_CONFIG:
        try:
            data = _load_encrypted_config()
            if not data:
                # Fallback to plaintext if encrypted is empty
                if USER_REGISTRY_PATH.exists():
                    try:
                        data = json.loads(
                            USER_REGISTRY_PATH.read_text(encoding="utf-8")
                        )
                    except:
                        pass
        except Exception:
            # Fallback to plaintext on error
            if USER_REGISTRY_PATH.exists():
                try:
                    data = json.loads(USER_REGISTRY_PATH.read_text(encoding="utf-8"))
                except:
                    data = {"users": [], "apps": []}

    else:
        # Fallback to plaintext (legacy)
        if not USER_REGISTRY_PATH.exists():
            return {"users": [], "apps": []}
        try:
            data = json.loads(USER_REGISTRY_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {"users": [], "apps": []}

    if not data:
        data = {"users": [], "apps": []}

    if isinstance(data, dict) and "apps" in data:
        users = data.get("users", [])
        apps = data.get("apps", [])
    else:
        # legacy format
        raw_users = data.get("users", []) if isinstance(data, dict) else []
        users = []
        apps = []
        for entry in raw_users:
            if isinstance(entry, str):
                if entry:
                    users.append(entry)
                continue
            if isinstance(entry, dict):
                username = entry.get("username")
                exec_path = entry.get("exec_path")
                if username:
                    users.append(username)
                    if exec_path:
                        apps.append(
                            {
                                "id": slugify_token(
                                    f"{Path(exec_path).stem}-{uuid.uuid4().hex[:6]}"
                                ),
                                "username": username,
                                "exec_path": exec_path,
                                "name": Path(exec_path).stem,
                            }
                        )
        if users or apps:
            result = {"users": users, "apps": apps}
            save_registry(result)
            return result
        return {"users": [], "apps": []}

    clean_users = []
    seen_users = set()
    for user in users or []:
        # Support both legacy string format and new object format
        if isinstance(user, str):
            normalized = user.strip()
            if normalized and normalized.lower() not in seen_users:
                clean_users.append(
                    {"username": normalized, "defaultProxy": "", "storagePath": ""}
                )
                seen_users.add(normalized.lower())
        elif isinstance(user, dict):
            username = (user.get("username") or "").strip()
            if username and username.lower() not in seen_users:
                clean_users.append(
                    {
                        "username": username,
                        "defaultProxy": user.get("defaultProxy", ""),
                        "storagePath": user.get("storagePath", ""),
                    }
                )
                seen_users.add(username.lower())

    clean_apps = []
    seen_ids = set()
    for app in apps or []:
        if not isinstance(app, dict):
            continue
        app_id = app.get("id") or slugify_token(uuid.uuid4().hex)
        if app_id in seen_ids:
            app_id = f"{app_id}-{uuid.uuid4().hex[:4]}"
        seen_ids.add(app_id)
        username = app.get("username", "")
        exec_path = app.get("exec_path", "")
        clean_apps.append(
            {
                "id": app_id,
                "username": username,
                "exec_path": exec_path,
                "name": app.get("name") or Path(exec_path).stem if exec_path else "",
            }
        )

    result = {"users": clean_users, "apps": clean_apps}
    # Always save to ensure IDs are persisted and stable
    save_registry(result)
    return result


def save_registry(registry: dict) -> None:
    data = {
        "users": registry.get("users", []),
        "apps": registry.get("apps", []),
    }

    # Use encrypted config if available
    if USE_ENCRYPTED_CONFIG:
        try:
            if _save_encrypted_config(data):
                return
        except Exception as exc:
            debug_log(f"Encrypted config save failed: {exc}")

    # Fallback to plaintext (legacy)
    USER_REGISTRY_PATH.write_text(
        json.dumps(data, indent=2),
        encoding="utf-8",
    )


def load_proxy_from_config(
    config_path: str, app_id: str, username: str = ""
) -> Optional[str]:
    """Load proxy setting from clone_overrides.json, with fallback to Profile default proxy."""
    app_proxy = None

    # Step 1: Try to load App-specific proxy
    if config_path and app_id:
        try:
            path = Path(config_path)
            if path.exists():
                data = json.loads(path.read_text(encoding="utf-8"))
                entry = data.get(app_id)
                if entry and entry.get("proxy"):
                    app_proxy = entry["proxy"]
        except Exception:
            pass

    if app_proxy:
        return app_proxy

    # Step 2: Fallback to Profile's default proxy
    if username:
        try:
            registry = load_registry()
            user = find_user_by_name(registry, username)
            if user and user.get("defaultProxy"):
                return user["defaultProxy"]
        except Exception:
            pass

    return None


def find_app_by_id(registry: dict, app_id: str) -> Optional[dict]:
    if not app_id:
        return None
    for app in registry.get("apps", []):
        if app.get("id") == app_id:
            return app
    return None


def generate_app_id(username: str, exec_path: str) -> str:
    base = f"{Path(exec_path).stem}-{slugify_token(username)}-{uuid.uuid4().hex[:6]}"
    return slugify_token(base) or f"app-{uuid.uuid4().hex[:8]}"


def ensure_user_entry(registry: dict, username: str, default_proxy: str = "") -> None:
    """Ensure a user entry exists in the registry. Creates if missing."""
    if not username:
        return
    normalized = username.strip()
    if not normalized:
        return
    users = registry.setdefault("users", [])
    # Build lookup for existing usernames
    existing = {
        (u.get("username") if isinstance(u, dict) else u).lower(): idx
        for idx, u in enumerate(users)
    }
    if normalized.lower() not in existing:
        users.append(
            {"username": normalized, "defaultProxy": default_proxy, "storagePath": ""}
        )


def find_user_by_name(registry: dict, username: str) -> Optional[dict]:
    """Find a user object by username."""
    if not username:
        return None
    normalized = username.strip().lower()
    for user in registry.get("users", []):
        if isinstance(user, dict):
            if (user.get("username") or "").lower() == normalized:
                return user
        elif isinstance(user, str) and user.lower() == normalized:
            return {"username": user, "defaultProxy": "", "storagePath": ""}
    return None


def update_user_default_proxy(
    registry: dict, username: str, default_proxy: str
) -> bool:
    """Update the default proxy for a user. Returns True if updated."""
    user = find_user_by_name(registry, username)
    if user:
        user["defaultProxy"] = default_proxy
        return True
    return False


def update_user_storage_path(registry: dict, username: str, storage_path: str) -> bool:
    """Update the storage path for a user. Returns True if updated."""
    user = find_user_by_name(registry, username)
    if user:
        user["storagePath"] = storage_path
        return True
    return False


def register_app_entry(
    registry: dict,
    username: str,
    exec_path: Optional[str],
    app_id: Optional[str] = None,
) -> Optional[dict]:
    ensure_user_entry(registry, username)
    if not exec_path:
        return None
    exec_path = str(Path(exec_path).expanduser())
    exec_key = exec_path.lower()
    apps = registry.setdefault("apps", [])
    if app_id:
        app = find_app_by_id(registry, app_id)
        if not app:
            app = {"id": app_id, "username": username}
            apps.append(app)
    else:
        app = next(
            (
                item
                for item in apps
                if item.get("username", "").lower() == username.lower()
                and (item.get("exec_path") or "").lower() == exec_key
            ),
            None,
        )
        if not app:
            generated = generate_app_id(username, exec_path)
            app = {"id": generated, "username": username}
            apps.append(app)
    app["username"] = username
    app["exec_path"] = exec_path
    app.setdefault("name", Path(exec_path).stem)
    return app


def split_account(username: str) -> Tuple[Optional[str], str]:
    """Return (domain, user) when username looks like DOMAIN\\User."""
    if "\\" in username:
        domain, user = username.split("\\", 1)
        return domain or None, user
    return None, username


def is_local_domain(domain: Optional[str]) -> bool:
    """True if the domain refers to the current machine."""
    if not domain or domain in {".", "localhost"}:
        return True
    return domain.upper() == os.environ.get("COMPUTERNAME", "").upper()


def user_exists(local_username: str) -> bool:
    """Check whether a local SAM account already exists."""
    result = run_hidden(
        ["net", "user", local_username],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.returncode == 0


def create_local_user(
    local_username: str, password: str, profile_path: Optional[str] = None
) -> None:
    """Create a local SAM account via `net user`."""
    # Capture output to detect specific errors (like Name matching Computer Name)
    proc = run_hidden(
        ["net", "user", local_username, password, "/add", "/expires:never"],
        capture_output=True,
        text=True,
    )

    if proc.returncode != 0:
        if "2253" in proc.stderr or "same as computer name" in proc.stderr.lower():
            raise RuntimeError(
                f"LỖI: Tên Profile '{local_username}' trùng với Tên Máy Tính (Computer Name). Vui lòng chọn tên khác."
            )
        # Raise generic error with output
        raise subprocess.CalledProcessError(
            proc.returncode, proc.args, output=proc.stdout, stderr=proc.stderr
        )

    # Set password to never expire (prevents Error 1907 after password ages out)
    # Try PowerShell first (modern), fallback to wmic (legacy)
    try:
        run_hidden(
            ["powershell", "-Command",
             f"Set-LocalUser -Name '{local_username}' -PasswordNeverExpires $true"],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        try:
            run_hidden(
                ["wmic", "useraccount", "where", f"name='{local_username}'",
                 "set", "PasswordExpires=False"],
                check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
        except FileNotFoundError:
            pass  # wmic not available on some systems

    run_hidden(
        ["net", "user", local_username, "/active:yes"],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if profile_path:
        set_profile_path(local_username, profile_path)


def get_user_sid(username: str) -> Optional[str]:
    """Get the SID for a local user."""
    try:
        cmd = ["wmic", "useraccount", "where", f"name='{username}'", "get", "sid"]
        proc = run_hidden(
            cmd, capture_output=True, text=True, stderr=subprocess.DEVNULL
        )
        for line in proc.stdout.splitlines():
            line = line.strip()
            if line.startswith("S-1-5-"):
                return line
    except Exception:
        pass
    return None


def set_profile_path(username: str, path: str) -> None:
    sid = get_user_sid(username)
    if not sid:
        raise RuntimeError(f"Không lấy được SID của Profile {username}.")

    try:
        target = Path(path).resolve()
        # Only create parent directory. Let Windows create the user directory with correct ACLs on first login.
        target.parent.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        raise RuntimeError(f"Không tạo được thư mục cha cho Profile: {e}")

    key = f"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ProfileList\\{sid}"
    try:
        run_hidden(
            [
                "reg",
                "add",
                key,
                "/v",
                "ProfileImagePath",
                "/t",
                "REG_EXPAND_SZ",
                "/d",
                str(target),
                "/f",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as e:
        detail = (
            (e.stderr or b"").decode("utf-8", errors="ignore")
            if isinstance(e.stderr, bytes)
            else (e.stderr or "")
        )
        raise RuntimeError(
            f"Không set được ProfileImagePath cho {username}. {detail}".strip()
        )


def expected_profile_path(username: str, profile_path: Optional[str] = None) -> Path:
    if profile_path:
        return Path(profile_path).expanduser().resolve()
    domain, local_user = split_account(username)
    system_drive = os.environ.get("SystemDrive", "C:") + "\\"
    return Path(system_drive) / "Users" / local_user


def profile_is_ready(path: Path) -> bool:
    try:
        return path.exists() and ((path / "NTUSER.DAT").exists() or any(path.iterdir()))
    except PermissionError:
        return path.exists()


def initialize_user_profile(
    username: str, password: str, profile_path: Optional[str] = None
) -> Path:
    target = expected_profile_path(username, profile_path)
    command = r"C:\Windows\System32\cmd.exe /c exit"
    working_dir = os.environ.get("SystemRoot", r"C:\Windows")
    if create_process_as_user(username, password, command, working_dir) != 0:
        raise RuntimeError(
            "Đã tạo user nhưng không khởi tạo được Windows profile "
            "(sai password hoặc quyền logon bị chặn)."
        )

    deadline = time.time() + 20
    while time.time() < deadline:
        if profile_is_ready(target):
            return target
        time.sleep(0.5)

    raise RuntimeError(f"Đã tạo user nhưng Windows chưa tạo thư mục profile tại {target}.")


def ensure_local_user(
    domain_username: str, password: str, profile_path: Optional[str] = None
) -> bool:
    """
    Create the local account if it does not exist.

    Returns True when a new account was created.
    """
    domain, local_user = split_account(domain_username)
    if not is_local_domain(domain):
        raise RuntimeError("Auto-creating accounts only works for local machine users.")
    if user_exists(local_user):
        return False

    create_local_user(local_user, password, profile_path)
    return True


def load_tracked_apps() -> list[dict]:
    return load_registry().get("apps", [])


def register_created_user(
    username: str,
    exec_path: Optional[str],
    app_id: Optional[str] = None,
    storage_path: Optional[str] = None,
) -> Optional[dict]:
    registry = load_registry()
    app = register_app_entry(registry, username, exec_path, app_id=app_id)
    if storage_path:
        user = find_user_by_name(registry, username)
        if user:
            user["storagePath"] = str(storage_path)
    save_registry(registry)
    saved_user = find_user_by_name(load_registry(), username)
    if not saved_user:
        raise RuntimeError(f"Đã tạo user {username} nhưng không lưu được vào danh sách Profile.")
    hide_local_account(username, silent=True)
    return app


def unregister_user(username: str) -> None:
    registry = load_registry()
    cleaned = []
    for entry in registry.get("users", []):
        # Handle both dict and string formats
        if isinstance(entry, dict):
            entry_username = entry.get("username", "")
        else:
            entry_username = entry
        if entry_username.lower() != username.lower():
            cleaned.append(entry)
    registry["users"] = cleaned
    save_registry(registry)


def _is_64bit_os() -> bool:
    return bool(
        os.environ.get("PROCESSOR_ARCHITEW6432")
        or os.environ.get("PROCESSOR_ARCHITECTURE", "").upper() == "AMD64"
    )


def hide_local_account(username: str, silent: bool = False) -> bool:
    """Hide the given local user from Windows logon UI."""
    domain, local_user = split_account(username)
    if not local_user or not is_local_domain(domain):
        return False
    targets = {local_user}
    if domain:
        targets.add(f"{domain}\\{local_user}")

    success = False
    messages: list[str] = []
    reg_views: list[Optional[str]] = []
    if _is_64bit_os():
        reg_views.extend(["/reg:64", "/reg:32"])
    reg_views.append(None)

    for target in targets:
        for view in reg_views:
            cmd = [
                "reg",
                "add",
                USERLIST_REG_PATH,
                "/v",
                target,
                "/t",
                "REG_DWORD",
                "/d",
                "0",
                "/f",
            ]
            if view:
                cmd.append(view)
            try:
                run_hidden(
                    cmd,
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                success = True
            except subprocess.CalledProcessError as exc:
                stderr = exc.stderr.decode(errors="ignore") if exc.stderr else ""
                stdout = exc.stdout.decode(errors="ignore") if exc.stdout else ""
                msg = stderr.strip() or stdout.strip()
                if msg:
                    messages.append(msg)

    if not success and not silent:
        hint = " (can admin?)" if messages else ""
        # FIXED: Use proper Vietnamese with diacritics
        print(f"Không thể ẩn user {username}.{hint}", file=sys.stderr)
    return success


def show_local_account(username: str, silent: bool = False) -> bool:
    """Remove the hidden flag so the local user appears again."""
    domain, local_user = split_account(username)
    if not local_user or not is_local_domain(domain):
        return False
    targets = {local_user}
    if domain:
        targets.add(f"{domain}\\{local_user}")

    success = False
    messages: list[str] = []
    reg_views: list[Optional[str]] = []
    if _is_64bit_os():
        reg_views.extend(["/reg:64", "/reg:32"])
    reg_views.append(None)

    for target in targets:
        for view in reg_views:
            cmd = [
                "reg",
                "delete",
                USERLIST_REG_PATH,
                "/v",
                target,
                "/f",
            ]
            if view:
                cmd.append(view)
            try:
                run_hidden(
                    cmd,
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                success = True
            except subprocess.CalledProcessError as exc:
                stderr = exc.stderr.decode(errors="ignore") if exc.stderr else ""
                stdout = exc.stdout.decode(errors="ignore") if exc.stdout else ""
                msg = stderr.strip() or stdout.strip()
                normalized = msg.lower()
                if "unable to find" in normalized or "khong tim" in normalized:
                    success = True
                    continue
                if msg:
                    messages.append(msg)

    if not success and not silent:
        hint = " (can admin?)" if messages else ""
        # FIXED: Use proper Vietnamese with diacritics
        print(f"Không thể hiện Profile {username}.{hint}", file=sys.stderr)
    return success


def tracked_usernames() -> list[dict]:
    """Return list of user objects with username, defaultProxy, and storagePath."""
    users = load_registry().get("users", [])
    # Ensure all entries are dicts with proper fields
    result = []
    for user in users:
        if isinstance(user, dict):
            result.append(
                {
                    "username": user.get("username", ""),
                    "defaultProxy": user.get("defaultProxy", ""),
                    "storagePath": user.get("storagePath", ""),
                }
            )
        elif isinstance(user, str):
            result.append({"username": user, "defaultProxy": "", "storagePath": ""})
    return result


def is_user_hidden(username: str) -> bool:
    domain, local_user = split_account(username)
    if not local_user:
        return False
    targets = {local_user}
    if domain:
        targets.add(f"{domain}\\{local_user}")
    reg_views: list[Optional[str]] = []
    if _is_64bit_os():
        reg_views.extend(["/reg:64", "/reg:32"])
    reg_views.append(None)
    for target in targets:
        for view in reg_views:
            cmd = [
                "reg",
                "query",
                USERLIST_REG_PATH,
                "/v",
                target,
            ]
            if view:
                cmd.append(view)
            proc = run_hidden(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if proc.returncode == 0:
                return True
    return False


def startup_script_path(app_id: str) -> Path:
    token = slugify_token(app_id or uuid.uuid4().hex)
    return STARTUP_DIR / f"runas-startup-{token}.cmd"


def write_startup_script(app: dict) -> None:
    STARTUP_DIR.mkdir(parents=True, exist_ok=True)
    script_path = startup_script_path(app["id"])
    python_cmd = f'"{sys.executable}"' if sys.executable else "python"
    username = app.get("username", "")
    exec_path = app.get("exec_path", "")
    body = textwrap.dedent(
        f"""@echo off
cd /d "{SCRIPT_DIR}"
{python_cmd} "{SCRIPT_DIR / 'runas_launcher.py'}" "{exec_path}" --username "{username}"
"""
    )
    script_path.write_text(body, encoding="utf-8")


def toggle_startup_entry(app_id: str) -> tuple[bool, str]:
    registry = load_registry()
    app = find_app_by_id(registry, app_id)
    if not app or not app.get("exec_path"):
        raise RuntimeError("Chưa có thông tin app hoặc đường dẫn .exe.")
    target = startup_script_path(app_id)
    if target.exists():
        target.unlink()
        return False, f"Đã tắt chạy cùng Windows cho {app.get('name') or app_id}."
    write_startup_script(app)
    return True, f"Đã bật chạy cùng Windows cho {app.get('name') or app_id}."


def collect_clone_flags() -> dict:
    flags = {}
    registry = load_registry()
    for app in registry.get("apps", []):
        app_id = app.get("id")
        username = app.get("username", "")
        if not app_id:
            continue
        flags[app_id] = {
            "hidden": is_user_hidden(username),
            "startup": startup_script_path(app_id).exists(),
        }
    return flags


def slugify_token(value: str) -> str:
    """Return a filesystem-friendly token derived from value."""
    allowed = "abcdefghijklmnopqrstuvwxyz0123456789-_"
    sanitized = [ch.lower() if ch.lower() in allowed else "-" for ch in value]
    slug = "".join(sanitized)
    slug = "-".join(filter(None, slug.split("-")))
    return slug or "user"


def determine_clone_destination(
    source_dir: Path,
    username: str,
    clone_to: str,
    clone_name: Optional[str],
) -> Path:
    """
    Decide where the cloned folder should live.

    - When clone_name is provided, treat clone_to as the parent folder.
    - Otherwise:
        * If clone_to exists and is a directory -> use it as root and append
          <app>-<user>.
        * If clone_to does not exist -> treat it as the final folder path.
    """
    base = Path(clone_to).expanduser()
    if clone_name:
        base.mkdir(parents=True, exist_ok=True)
        return (base / clone_name).resolve()

    if base.exists():
        if not base.is_dir():
            raise RuntimeError(f"Clone path {base} is not a directory.")
        folder_stub = slugify_token(source_dir.name)
        user_stub = slugify_token(username.replace("\\", "-"))
        return (base / f"{folder_stub}-{user_stub}").resolve()

    base.parent.mkdir(parents=True, exist_ok=True)
    return base.resolve()


def clone_program_tree(
    exe_path: Path,
    username: str,
    clone_to: str,
    clone_name: Optional[str],
    force_clone: bool,
    quiet: bool = False,
) -> Tuple[Path, Path]:
    """
    Copy the entire application folder to another location.

    Returns (new_executable_path, clone_folder_path).
    """
    source_dir = exe_path.parent
    destination = determine_clone_destination(
        source_dir, username, clone_to, clone_name
    )

    if destination.exists():
        if force_clone:
            shutil.rmtree(destination)
        elif not destination.is_dir():
            raise RuntimeError(f"{destination} exists and is not a folder.")
        else:
            if not quiet:
                print(f"Updating existing clone at {destination}")

    try:
        shutil.copytree(
            source_dir,
            destination,
            dirs_exist_ok=True,
        )
    except (shutil.Error, PermissionError) as exc:
        # FIXED: Use proper Vietnamese with diacritics
        raise RuntimeError(
            f"Không thể sao chép tệp (có thể ứng dụng đang chạy?). Vui lòng tắt Zalo/App liên quan trước khi thử lại.\nChi tiết: {exc}"
        )
    if not quiet:
        print(f"Cloned {source_dir} -> {destination}")

    # FIX: Remove VisualElementsManifest.xml to prevent blank icon on Taskbar
    # This forces Windows to use the embedded icon in the EXE.
    # Deleted to ensure standard icon rendering.
    try:
        for manifest in destination.glob("*.VisualElementsManifest.xml"):
            manifest.unlink()
    except (OSError, PermissionError):
        # FIXED: Catch specific file operation errors
        pass  # Non-critical, manifest removal can fail

    grant_folder_access(destination, username)

    # Rebuild Icon Cache to ensure Taskbar picks up the EXE icon
    try:
        run_hidden(
            ["ie4uinit.exe", "-show"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass

    return destination / exe_path.name, destination


def grant_folder_access(folder: Path, username: str) -> None:
    """Grant modify permissions to the alternate user on the cloned folder."""
    try:
        run_hidden(
            ["icacls", str(folder), "/grant", f"{username}:(OI)(CI)M", "/T"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        # Grant Everyone (World SID: *S-1-1-0) Read & Execute access
        # This ensures Shell can read icons regardless of ownership
        run_hidden(
            ["icacls", str(folder), "/grant", "*S-1-1-0:(OI)(CI)RX", "/T"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError as exc:
        # Silenced to prevent red text
        pass


def force_delete_folder(folder: Path) -> None:
    """Try to remove a folder forcefully (take ownership + rd)."""
    if not folder.exists():
        return
    try:
        run_hidden(
            ["icacls", str(folder), "/grant", "Administrators:F", "/T", "/C"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass
    try:
        run_hidden(
            ["cmd", "/c", "rd", "/s", "/q", str(folder)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.decode(errors="ignore") if exc.stderr else ""
        stdout = exc.stdout.decode(errors="ignore") if exc.stdout else ""
        msg = stderr.strip() or stdout.strip()
        raise RuntimeError(msg or f"Không xóa được thư mục {folder}")


def profile_roots() -> set[Path]:
    roots = set()
    try:
        import winreg  # type: ignore

        with winreg.OpenKey(
            winreg.HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList",
        ) as key:
            value, _ = winreg.QueryValueEx(key, "ProfilesDirectory")
            if value:
                roots.add(Path(str(value)))
    except Exception:
        pass
    sys_drive = Path(os.environ.get("SystemDrive", "C:"))
    roots.add(sys_drive / "Users")
    return roots


def delete_profile_via_wmi(profile_path: Path) -> None:
    """Use WMI to delete user profile record if folder persists."""
    try:
        run_hidden(
            [
                "wmic",
                "path",
                "win32_userprofile",
                f"where LocalPath='{profile_path}'",
                "delete",
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.decode(errors="ignore") if exc.stderr else ""
        stdout = exc.stdout.decode(errors="ignore") if exc.stdout else ""
        msg = stderr.strip() or stdout.strip()
        if msg:
            print(
                f"WMI delete profile error for {profile_path}: {msg}", file=sys.stderr
            )


def delete_local_user(domain_username: str) -> None:
    """Delete a previously-created local user."""
    domain, local_user = split_account(domain_username)
    if not is_local_domain(domain):
        print(
            f"User {domain_username} không thuộc máy này. Chỉ xóa khỏi danh sách tracking.",
            file=sys.stderr,
        )
        unregister_user(domain_username)
        return
    roots = profile_roots()
    profile_candidates = set()
    for root in roots:
        profile_candidates.add(root / local_user)
        if domain:
            profile_candidates.add(root / f"{domain}.{local_user}")
    try:
        result = run_hidden(
            ["net", "user", local_user, "/delete"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        stdout = result.stdout.decode(errors="ignore") if result.stdout else ""
        if stdout.strip():
            print(stdout.strip())
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.decode(errors="ignore") if exc.stderr else ""
        stdout = exc.stdout.decode(errors="ignore") if exc.stdout else ""
        message = (stderr or stdout).strip().lower()
        if "could not be found" in message or "helpmsg 2221" in message:
            # User already missing -> continue cleanup
            pass
        else:
            raise

    # Clean up credentials from the current user's vault
    try:
        run_hidden(
            ["cmdkey", "/delete:" + local_user],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        computer_name = os.environ.get("COMPUTERNAME", "localhost")
        full_user = f"{computer_name}\\{local_user}"
        run_hidden(
            ["cmdkey", "/delete:" + full_user],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except:
        pass

    unregister_user(domain_username)
    for candidate in profile_candidates:
        if candidate.exists():
            try:
                force_delete_folder(candidate)
                print(f"Đã xóa thư mục hồ sơ {candidate}")
            except Exception as exc:
                print(
                    f"Không xóa được thư mục hồ sơ {candidate}: {exc}", file=sys.stderr
                )
                delete_profile_via_wmi(candidate)


def read_password(args: argparse.Namespace, username: str) -> Optional[str]:
    """Obtain the password based on CLI flags."""
    debug_log(
        f"read_password called: password={bool(args.password)}, password_stdin={args.password_stdin}"
    )

    if args.password:
        debug_log("Using password from --password arg")
        return args.password
    if args.password_stdin:
        debug_log("Attempting to read password from STDIN...")
        try:
            password = sys.stdin.readline().rstrip("\r\n")
            debug_log(
                f"STDIN password read: length={len(password)}, empty={not password}"
            )
            if password:
                return password
        except Exception as e:
            debug_log(f"STDIN read error: {e}")

    # Do NOT use getpass here - it blocks when running from hidden BAT/VBS shortcut.
    # Instead, return None so the caller can try load_user_credential() from Windows Vault.
    debug_log("No password source available")
    return None


def resolve_executable(program_path: str, exe_name: Optional[str]) -> Path:
    """Return the executable path based on the provided file or folder."""
    path = Path(program_path).expanduser().resolve()
    if path.is_file():
        return path

    if not path.is_dir():
        raise FileNotFoundError(f"{path} is neither a file nor a folder")

    candidates = []
    if exe_name:
        candidate = path / exe_name
        if candidate.exists():
            return candidate
        candidates.append(candidate)

    zalo_candidates = sorted(path.glob("Zalo*.exe"))
    if zalo_candidates:
        return zalo_candidates[0]

    exe_files = sorted(path.glob("*.exe"))
    if exe_files:
        return exe_files[0]

    raise FileNotFoundError(
        f"Could not find any executable inside {path}. "
        "Specify --exe-name explicitly."
    )


def build_command(
    exe_path: Path,
    arg_string: Optional[str],
    working_dir: Optional[str],
) -> str:
    """Compose the command that runas should trigger."""
    args: list[str]
    enforce_small_scale = exe_path.name.lower().startswith("zalo")
    if arg_string:
        args = [str(exe_path), *shlex.split(arg_string, posix=False)]
    else:
        args = [str(exe_path)]

    if enforce_small_scale:
        required_switches = [
            "--high-dpi-support=1",
            "--force-device-scale-factor=1",
        ]
        lower_existing = {part.lower() for part in args[1:]}
        missing = [
            switch for switch in required_switches if switch not in lower_existing
        ]
        if missing:
            args = [args[0], *missing, *args[1:]]

    wd = str(Path(working_dir).expanduser().resolve()) if working_dir else ""
    if wd or enforce_small_scale:
        cmd_parts = ["cmd.exe", "/c"]
        if wd:
            cmd_parts += ["cd", "/d", wd, "&&"]
        if enforce_small_scale:
            cmd_parts += ["set", "__COMPAT_LAYER=HIGHDPIAWARE", "&&"]
        cmd_parts += ["start", "", *args]
    else:
        cmd_parts = list(args)

    return subprocess.list2cmdline(cmd_parts)


def run_as_user(
    username: str,
    command: str,
    save_cred: bool,
    has_saved_credential: bool = False,
    password: str = None,
    working_dir: str = None,
) -> None:
    """
    Invoke a command as another user.
    When password is provided, uses CreateProcessWithLogonW (no console prompt).
    If that fails, raises an error instead of falling back to runas.exe.
    Only uses runas.exe with console when NO password is provided.
    """
    # Ensure fully qualified username
    target_user = username
    if "\\" not in target_user:
        computer_name = os.environ.get("COMPUTERNAME", "localhost")
        target_user = f"{computer_name}\\{target_user}"

    # If we have password, use Windows API directly (no console needed)
    if password:
        debug_log(f"Using CreateProcessWithLogonW for {target_user}")
        error_code = create_process_as_user(target_user, password, command, working_dir)
        if error_code == 0:
            debug_log("CreateProcessWithLogonW succeeded - no console needed!")
            return

        # Handle Error 1907: Password must change - try to reset it automatically
        if error_code in (1907, 1327):
            debug_log(f"Error {error_code}: Password expired/must change. Attempting auto-reset...")
            _, local_user = (target_user.split('\\', 1) if '\\' in target_user else ('', target_user))
            try:
                # Reset password to the same value to clear the 'must change' flag
                run_hidden(
                    ["net", "user", local_user, password],
                    check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
                # Set password to never expire
                run_hidden(
                    ["powershell", "-Command",
                     f"Set-LocalUser -Name '{local_user}' -PasswordNeverExpires $true"],
                    check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
                debug_log("Password reset successful, retrying CreateProcessWithLogonW...")
                error_code = create_process_as_user(target_user, password, command, working_dir)
                if error_code == 0:
                    debug_log("CreateProcessWithLogonW succeeded after password reset!")
                    return
            except Exception as e:
                debug_log(f"Auto-reset password failed: {e}")

        # Don't fall back to runas.exe - raise error instead
        debug_log(
            f"CreateProcessWithLogonW failed (error {error_code}) - raising error (no CMD fallback)"
        )
        raise subprocess.CalledProcessError(
            1,
            "CreateProcessWithLogonW",
            stderr=f"Lỗi {error_code}: Sai mật khẩu hoặc user không tồn tại. Vui lòng kiểm tra lại.",
        )

    # Only use runas.exe fallback when NO password was provided at all
    runas_cmd = ["runas.exe"]
    if save_cred:
        runas_cmd.append("/savecred")

    runas_cmd.append(f"/user:{target_user}")
    runas_cmd.append(command)

    # Fallback: show console for user to enter password
    print("Một cửa sổ runas mới sẽ hiện ra. Nhập mật khẩu của user khi được hỏi.")
    subprocess.run(
        runas_cmd,
        check=True,
        creationflags=subprocess.CREATE_NEW_CONSOLE,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=("Launch a Windows program under another user using runas/cmdkey.")
    )
    parser.add_argument(
        "program",
        nargs="?",
        help="Path to the executable or to a folder that contains it.",
    )
    parser.add_argument(
        "--exe-name",
        help="Executable file name to use when PROGRAM points to a folder.",
    )
    parser.add_argument(
        "--arguments",
        help="Extra arguments to pass to the executable.",
    )
    parser.add_argument(
        "--working-dir",
        help="Working directory. Defaults to the executable's parent folder.",
    )
    parser.add_argument(
        "--username",
        help="Account to run under. Required unless using --list-tracked-users/--delete-tracked-user.",
    )
    parser.add_argument(
        "--domain",
        help="Optional domain/workgroup. Used when --username lacks a prefix.",
    )
    parser.add_argument(
        "--password",
        help="Password for the alternate user. If omitted, you'll be prompted.",
    )
    parser.add_argument(
        "--password-stdin",
        action="store_true",
        help="Read the password from STDIN (useful for UI wrappers).",
    )
    parser.add_argument(
        "--skip-credential-cache",
        action="store_true",
        help="Do not call cmdkey or use /savecred (you will be prompted).",
    )
    parser.add_argument(
        "--auto-create-user",
        action="store_true",
        help="Automatically create the local user if missing (requires admin).",
    )
    parser.add_argument(
        "--create-user",
        help="Create a local user without launching any application.",
    )
    parser.add_argument(
        "--list-tracked-users",
        action="store_true",
        help="List users that were created via this tool (JSON output).",
    )
    parser.add_argument(
        "--list-tracked-clones",
        action="store_true",
        help="List tracked clones with their executable paths.",
    )
    parser.add_argument(
        "--delete-tracked-user",
        help="Delete a user that was previously created via this tool.",
    )
    parser.add_argument(
        "--save-credential",
        help="Save a Windows Credential Manager password for the given user.",
    )
    parser.add_argument(
        "--delete-credential",
        help="Delete Windows Credential Manager entries for the given user.",
    )
    parser.add_argument(
        "--hide-user",
        help="Hide a local user from the Windows logon screen.",
    )
    parser.add_argument(
        "--show-user",
        help="Show a hidden local user on the Windows logon screen.",
    )
    parser.add_argument(
        "--toggle-startup",
        help="Toggle auto-launch on Windows startup for a tracked app (provide app ID).",
    )
    parser.add_argument(
        "--list-clone-flags",
        action="store_true",
        help="List hidden/startup flags for tracked clones.",
    )
    parser.add_argument(
        "--delete-clone-folder",
        help="Delete a clone directory recursively.",
    )
    parser.add_argument(
        "--delete-app",
        help="Delete a tracked app entry by its ID.",
    )
    parser.add_argument(
        "--update-user-proxy",
        nargs=2,
        metavar=("USERNAME", "PROXY"),
        help="Update the default proxy for a user profile.",
    )

    parser.add_argument(
        "--set-clone-path",
        nargs="+",
        metavar="ARGS",
        help="Set executable path for a tracked app. Usage: --set-clone-path USER EXE_PATH [APP_ID].",
    )
    parser.add_argument(
        "--clone-to",
        help="Clone the program folder to this path/drive before running.",
    )
    parser.add_argument(
        "--clone-name",
        help="Optional folder name for the clone (defaults to <app>-<user>).",
    )
    parser.add_argument(
        "--force-clone",
        action="store_true",
        help="Delete the clone directory before copying files over.",
    )
    parser.add_argument(
        "--clone-only",
        action="store_true",
        help="Only clone the application and skip launching (requires --clone-to).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only print the command that would be executed.",
    )
    parser.add_argument(
        "--user-data-dir",
        help="Custom directory for the new user's profile data.",
    )
    parser.add_argument(
        "--proxy",
        help="Set IP:PORT proxy for the target user (automatically configures Registry).",
    )
    parser.add_argument(
        "--config-path",
        help="Path to clone_overrides.json for dynamic lookup.",
    )
    parser.add_argument(
        "--app-id",
        help="App ID to lookup in config-path.",
    )
    parser.add_argument(
        "--update-user-storage",
        nargs=2,
        metavar=("USERNAME", "PATH"),
        help="Update storage path for a user: --update-user-storage username path",
    )
    return parser.parse_args()


def load_user_hive(username: str) -> Optional[str]:
    """Loads the user's registry hive and returns the temporary key name."""
    from pathlib import Path
    import uuid

    domain, user = split_account(username)
    roots = profile_roots()
    profile_path = None

    # FIXED: Define COMPUTER_NAME before use
    computer_name = os.environ.get("COMPUTERNAME", "localhost")
    # Try common profile paths
    candidates = [f"{user}", f"{user}.{domain}", f"{user}.{computer_name}"]
    for root in roots:
        for candidate in candidates:
            path = root / candidate
            if (path / "NTUSER.DAT").exists():
                profile_path = path / "NTUSER.DAT"
                break
        if profile_path:
            break

    if not profile_path:
        profile_path = (
            Path(os.environ.get("SystemDrive", "C:")) / "Users" / user / "NTUSER.DAT"
        )

    if not profile_path.exists():
        return None

    temp_key = f"CloneApp_{uuid.uuid4().hex}"
    try:
        run_hidden(
            ["reg", "load", f"HKU\\{temp_key}", str(profile_path)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return temp_key
    except subprocess.CalledProcessError:
        return None


def unload_user_hive(temp_key: str) -> None:
    try:
        run_hidden(
            ["reg", "unload", f"HKU\\{temp_key}"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        pass


def set_user_proxy(username: str, proxy_string: str) -> None:
    """Configures the proxy for the given user via registry injection."""
    if not proxy_string:
        return

    parts = proxy_string.strip().split(":")
    if len(parts) >= 2:
        address = f"{parts[0]}:{parts[1]}"
    else:
        return

    temp_key = load_user_hive(username)
    if not temp_key:
        print(f"Không load được profile của {username} để set proxy.", file=sys.stderr)
        return

    try:
        settings_key = f"HKU\\{temp_key}\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"
        run_hidden(
            [
                "reg",
                "add",
                settings_key,
                "/v",
                "ProxyEnable",
                "/t",
                "REG_DWORD",
                "/d",
                "1",
                "/f",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        run_hidden(
            [
                "reg",
                "add",
                settings_key,
                "/v",
                "ProxyServer",
                "/t",
                "REG_SZ",
                "/d",
                address,
                "/f",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        try:
            run_hidden(
                ["reg", "delete", settings_key, "/v", "AutoConfigURL", "/f"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            pass
        print(f"Đã set proxy {address} cho {username}.")
    except Exception as exc:
        print(f"Lỗi set proxy: {exc}", file=sys.stderr)
    finally:
        unload_user_hive(temp_key)


def clear_user_credentials(proxy_string: str) -> None:
    try:
        parts = proxy_string.strip().split(":")
        if len(parts) >= 2:
            ip = parts[0]
            run_hidden(
                ["cmdkey", "/delete", ip],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            run_hidden(
                ["cmdkey", "/delete", f"LegacyGeneric:target={ip}"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
    except Exception:
        pass


def load_user_credential(username: str) -> Optional[str]:
    """Retrieve the stored password for the given username using Windows Credential Manager."""
    advapi32 = ctypes.windll.advapi32
    CRED_TYPE_GENERIC = 1

    targets_to_try = [username]
    if "\\" not in username:
        computer_name = os.environ.get("COMPUTERNAME", "localhost")
        targets_to_try.append(f"{computer_name}\\{username}")

    for target in targets_to_try:
        pcred = ctypes.POINTER(CREDENTIAL)()
        res = advapi32.CredReadW(target, CRED_TYPE_GENERIC, 0, ctypes.byref(pcred))
        if res:
            try:
                cred = pcred.contents
                blob = ctypes.string_at(cred.CredentialBlob, cred.CredentialBlobSize)
                password = blob.decode('utf-16-le')
                return password
            finally:
                advapi32.CredFree(pcred)

    return None

def save_user_credential(username: str, password: str) -> None:
    """Proactively save the user credential so runas doesn't prompt."""
    try:
        # 1. Save generic "username"
        run_hidden(
            [
                "cmdkey",
                "/generic:" + username,
                f"/user:{username}",
                f"/pass:{password}",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )

        # 2. Save "COMPUTERNAME\username" (runas often prefers this)
        computer_name = os.environ.get("COMPUTERNAME", "localhost")
        if "\\" not in username:
            full_user = f"{computer_name}\\{username}"
            run_hidden(
                [
                    "cmdkey",
                    "/generic:" + full_user,
                    f"/user:{full_user}",
                    f"/pass:{password}",
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
    except Exception as e:
        # print(f"Warning: Failed to save credential: {e}", file=sys.stderr)
        pass

    # 3. Save as "Windows Credential" (Domain style) for the computer
    # runas /savecred often looks for Target=ComputerName when logging in as ComputerName\User
    try:
        computer_name = os.environ.get("COMPUTERNAME", "localhost")
        if "\\" not in username:
            full_user = f"{computer_name}\\{username}"
            run_hidden(
                [
                    "cmdkey",
                    "/add:" + computer_name,
                    f"/user:{full_user}",
                    f"/pass:{password}",
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
            # Also try adding target as the full user itself for good measure
            run_hidden(
                [
                    "cmdkey",
                    "/add:" + full_user,
                    f"/user:{full_user}",
                    f"/pass:{password}",
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
    except Exception as e:
        # print(f"Warning: Failed to save domain credential: {e}", file=sys.stderr)
        pass


def create_proxy_wrapper(
    exe: Path, args: list[str], working_dir: str, proxy_string: str
) -> str:
    """Creates a temporary batch file to configure proxy and run the app."""
    # Parse Proxy IP and Port
    parts = proxy_string.strip().split(":")
    if len(parts) < 2:
        # Fallback to no-proxy wrapper if invalid
        return create_clear_proxy_wrapper(exe, args, working_dir)

    ip = parts[0]
    port = parts[1]
    proxy_address = f"{ip}:{port}"

    wrapper_path = (
        Path(os.environ.get("PUBLIC", "C:\\Users\\Public"))
        / f"proxy_launch_{uuid.uuid4().hex}.bat"
    )
    # FIXED: Use SCRIPT_DIR instead of hardcoded path
    log_path = SCRIPT_DIR / "proxy_debug.log"

    # Basic Application Launch Command
    # We use 'start "" "exe" args'
    # Use list2cmdline for args to handle internal quotes
    exe_cmd = subprocess.list2cmdline([str(exe), *args])

    batch_content = [
        "@echo off",
        f'echo --- NEW RUN {uuid.uuid4().hex} --- >> "{log_path}"',
        f'echo Setting Proxy to {proxy_address}... >> "{log_path}"',
        # Set Registry
        f'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f >> "{log_path}" 2>&1',
        f'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "{proxy_address}" /f >> "{log_path}" 2>&1',
        # Remove auto config
        f'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v AutoConfigURL /f >> "{log_path}" 2>&1',
        # Clear credentials first
        f'cmdkey /delete:{ip} >> "{log_path}" 2>&1',
        f'cmdkey /delete:LegacyGeneric:target={ip} >> "{log_path}" 2>&1',
    ]

    # Add Credential if provided (IP:PORT:USER:PASS)
    if len(parts) >= 4:
        proxy_user = parts[2]
        proxy_pass = parts[3]
        batch_content.append(
            f'echo Adding capabilities for {proxy_user}... >> "{log_path}"'
        )
        batch_content.append(
            f'cmdkey /add:{ip} /user:{proxy_user} /pass:{proxy_pass} >> "{log_path}" 2>&1'
        )
        batch_content.append(
            f'cmdkey /generic:{ip} /user:{proxy_user} /pass:{proxy_pass} >> "{log_path}" 2>&1'
        )

    # CD and Launch
    if working_dir:
        batch_content.append(f'cd /d "{working_dir}"')

    # Use simple START to detach/run
    # Quote the title as first arg to start
    batch_content.extend(
        [f'echo Launching: {exe_cmd} >> "{log_path}"', f'start "" {exe_cmd}', "exit"]
    )

    wrapper_path.write_text("\n".join(batch_content), encoding="utf-8")
    return f'"{str(wrapper_path)}"'


def create_clear_proxy_wrapper(exe: Path, args: list[str], working_dir: str) -> str:
    """Creates a temporary batch file to DISABLE proxy and run the app."""
    wrapper_path = (
        Path(os.environ.get("PUBLIC", "C:\\Users\\Public"))
        / f"proxy_launch_{uuid.uuid4().hex}.bat"
    )
    # FIXED: Use SCRIPT_DIR instead of hardcoded path
    log_path = SCRIPT_DIR / "proxy_debug.log"

    exe_cmd = subprocess.list2cmdline([str(exe), *args])

    batch_content = [
        "@echo off",
        f'echo --- NEW RUN (CLEAR PROXY) {uuid.uuid4().hex} --- >> "{log_path}"',
        # Disable Proxy
        f'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f >> "{log_path}" 2>&1',
        f'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /f >> "{log_path}" 2>&1',
        f'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v AutoConfigURL /f >> "{log_path}" 2>&1',
        # Launch App
        f'echo Launching: {exe_cmd} >> "{log_path}"',
    ]

    if working_dir:
        batch_content.append(f'cd /d "{working_dir}"')

    batch_content.extend([f'start "" {exe_cmd}', "exit"])

    wrapper_path.write_text("\n".join(batch_content), encoding="utf-8")
    return f'"{str(wrapper_path)}"'


def main() -> int:
    debug_log("=== STARTING MAIN ===")
    args = parse_args()
    debug_log(f"ARGS: {args}")

    if args.create_user:
        username = args.create_user.strip()
        if not username:
            print("Chưa chọn tên Profile để tạo.")
            return 1
        password = read_password(args, username)
        if not password:
            print("Password không được để trống.")
            return 1
        try:
            created = ensure_local_user(username, password, args.user_data_dir)
            profile_path = initialize_user_profile(
                username, password, args.user_data_dir
            )
            save_user_credential(username, password)
            register_created_user(username, None, storage_path=str(profile_path))
            payload = {
                "ok": True,
                "username": username,
                "created": created,
                "profileReady": True,
                "profilePath": str(profile_path),
                "message": (
                    f"Đã tạo Profile {username}."
                    if created
                    else f"Profile {username} đã tồn tại."
                ),
            }
            print(json.dumps(payload, ensure_ascii=False))
            return 0
        except RuntimeError as exc:
            print(exc)
            return 1
        except subprocess.CalledProcessError as exc:
            print(
                "Không tạo được Profile (cần quyền admin?).",
            )
            return exc.returncode

    if args.list_tracked_users:
        print(
            json.dumps(
                {"users": tracked_usernames()},
                indent=2,
            )
        )
        return 0

    if args.save_credential:
        username = args.save_credential.strip()
        if not username:
            print("Chưa chọn Profile để lưu credential.", file=sys.stderr)
            return 1
        password = read_password(args, username)
        if not password:
            print("Password không được để trống.", file=sys.stderr)
            return 1
        save_user_credential(username, password)
        print(json.dumps({"ok": True, "hasCredential": True}, ensure_ascii=False))
        return 0

    if args.delete_credential:
        username = args.delete_credential.strip()
        if not username:
            print("Chưa chọn Profile để xóa credential.", file=sys.stderr)
            return 1
        targets = [username]
        if "\\" not in username:
            computer_name = os.environ.get("COMPUTERNAME", "localhost")
            targets.extend([f"{computer_name}\\{username}", computer_name])
        for target in dict.fromkeys(targets):
            run_hidden(
                ["cmdkey", "/delete:" + target],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        print(json.dumps({"ok": True, "hasCredential": False}, ensure_ascii=False))
        return 0

    if args.update_user_storage:
        username, storage_path = args.update_user_storage
        registry = load_registry()
        if update_user_storage_path(registry, username, storage_path):
            save_registry(registry)
            print(
                json.dumps(
                    {"ok": True, "message": f"Updated storage path for {username}"}
                )
            )
            return 0
        else:
            print(json.dumps({"ok": False, "message": f"User {username} not found"}))
            return 1

    if args.hide_user:
        if hide_local_account(args.hide_user, silent=False):
            print(f"Đã ẩn user {args.hide_user}.")
            return 0
        print(
            "Không thể ẩn user (cần chạy launcher với quyền admin?).",
            file=sys.stderr,
        )
        return 1

    if args.show_user:
        if show_local_account(args.show_user, silent=False):
            print(f"Đã hiện user {args.show_user}.")
            return 0
        print(
            "Không thể hiện user (cần chạy launcher với quyền admin?).",
            file=sys.stderr,
        )
        return 1

    if args.toggle_startup:
        try:
            enabled, message = toggle_startup_entry(args.toggle_startup)
            print(
                json.dumps(
                    {"enabled": enabled, "message": message},
                    ensure_ascii=False,
                )
            )
            return 0
        except RuntimeError as exc:
            print(exc, file=sys.stderr)
            return 1
        except OSError as exc:
            print(f"Không ghi được file startup: {exc}", file=sys.stderr)
            return 1

    if args.list_clone_flags:
        print(
            json.dumps(
                {"flags": collect_clone_flags()},
                indent=2,
            )
        )
        return 0

    if args.delete_clone_folder:
        folder = Path(args.delete_clone_folder).expanduser()
        try:
            if folder.exists():
                shutil.rmtree(folder)
                print(f"Đã xóa thư mục clone {folder}.")
            else:
                print("Thư mục clone không tồn tại (có thể đã xóa từ trước).")
            return 0
        except Exception as exc:
            print(f"Không xóa được thư mục clone: {exc}", file=sys.stderr)
            return 1

    if args.list_tracked_clones:
        print(
            json.dumps(
                {"clones": load_tracked_apps()},
                indent=2,
            )
        )
        return 0

    if args.delete_app:
        registry = load_registry()
        before = len(registry.get("apps", []))
        registry["apps"] = [
            app for app in registry.get("apps", []) if app.get("id") != args.delete_app
        ]
        after = len(registry["apps"])
        if after == before:
            print("Không tìm thấy app để xóa.", file=sys.stderr)
            return 1
        save_registry(registry)
        print(f"Đã xóa app {args.delete_app}.")
        return 0

    if args.update_user_proxy:
        username, default_proxy = args.update_user_proxy
        registry = load_registry()
        user = find_user_by_name(registry, username)
        if not user:
            print(f"Không tìm thấy user {username}.", file=sys.stderr)
            return 1
        user["defaultProxy"] = default_proxy
        save_registry(registry)
        if default_proxy:
            print(f"Đã cập nhật proxy mặc định cho {username}: {default_proxy}")
        else:
            print(f"Đã xóa proxy mặc định cho {username}.")
        return 0

    if args.set_clone_path:
        if len(args.set_clone_path) < 2:
            print(
                "--set-clone-path requires at least USER and EXE_PATH.", file=sys.stderr
            )
            return 1
        user, exe_path = args.set_clone_path[0], args.set_clone_path[1]
        app_id = args.set_clone_path[2] if len(args.set_clone_path) > 2 else None
        exe = Path(exe_path).expanduser()
        if not exe.exists():
            print(f"Executable {exe} does not exist.", file=sys.stderr)
            return 1
        app = register_created_user(user, str(exe), app_id=app_id)
        target_name = app.get("name") if app else exe.name
        print(f"Đã gắn đường dẫn {exe} cho {target_name}.")
        return 0

    if args.delete_tracked_user:
        try:
            delete_local_user(args.delete_tracked_user)
            print(f"Đã xóa user {args.delete_tracked_user}.")
            return 0
        except RuntimeError as exc:
            print(exc, file=sys.stderr)
            return 1
        except subprocess.CalledProcessError as exc:
            print(
                "Xóa user thất bại (cần quyền admin?).",
                file=sys.stderr,
            )
            return exc.returncode

    if not args.program:
        print(
            "Thiếu PROGRAM. Cung cấp đường dẫn app hoặc dùng --list-tracked-users/--delete-tracked-user.",
            file=sys.stderr,
        )
        return 1

    if args.clone_name and not args.clone_to:
        print("--clone-name requires --clone-to.", file=sys.stderr)
        return 1

    if args.clone_only and not args.clone_to:
        print("--clone-only requires --clone-to.", file=sys.stderr)
        return 1

    if (
        not (
            args.list_tracked_users
            or args.delete_tracked_user
            or args.list_tracked_clones
            or args.set_clone_path
        )
        and not args.username
    ):
        print(
            "Thiếu --username. Chỉ được bỏ qua khi dùng --list-tracked-users hoặc --delete-tracked-user.",
            file=sys.stderr,
        )
        return 1

    try:
        exe_path = resolve_executable(args.program, args.exe_name)
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 1

    username = args.username
    if args.domain and "\\" not in username:
        username = f"{args.domain}\\{username}"

    clone_dir: Optional[Path] = None
    if args.clone_to:
        try:
            exe_path, clone_dir = clone_program_tree(
                exe_path,
                username,
                args.clone_to,
                args.clone_name,
                args.force_clone,
                quiet=args.clone_only,
            )
            register_created_user(username, str(exe_path))
            if args.clone_only:
                payload = {
                    "clone_path": str(clone_dir) if clone_dir else "",
                    "exe_path": str(exe_path),
                    "username": username,
                }
                print(json.dumps(payload, ensure_ascii=False))
                return 0
        except (RuntimeError, OSError, PermissionError) as exc:
            print(f"Clone failed: {exc}", file=sys.stderr)
            return 1

    working_dir = args.working_dir or str(exe_path.parent)
    command = build_command(exe_path, args.arguments, working_dir)
    register_created_user(username, str(exe_path))
    debug_log(f"Register User OK. Building Command...")

    savecred = not args.skip_credential_cache

    # Always try to read password if available to support updating credentials
    password: Optional[str] = None
    if not args.dry_run:
        debug_log("Reading password...")
        password = read_password(args, username)
        if not password and savecred:
            debug_log("No password from args/stdin, trying to load from Credential Manager...")
            password = load_user_credential(username)
            debug_log(f"Loaded password from Credential Manager: {bool(password)}")
        debug_log(f"Has Password: {bool(password)}")

    if args.auto_create_user and not password:
        print(
            "A non-empty password is required to run with alternate credentials.",
            file=sys.stderr,
        )
        debug_log("Error: Missing password for auto-create")
        return 1

    if password and savecred:
        debug_log(f"Saving credential for {username}")
        save_user_credential(username, password)
        debug_log("Credential saved.")

    if args.auto_create_user:
        if password is None:
            print(
                "Auto-create user requires a password to be provided.", file=sys.stderr
            )
            return 1
        try:
            created = ensure_local_user(username, password, args.user_data_dir)
            if created:
                print(f"Created local Profile {username}.")
                # Save credential immediately to avoid prompts
                save_user_credential(username, password)
            else:
                print(f"Profile {username} đã tồn tại.")
                # Update credential if we have password (maybe it changed or wasn't saved)
                save_user_credential(username, password)
            register_created_user(username, None)
            return 0
        except RuntimeError as exc:
            print(exc, file=sys.stderr)
            return 1
        except subprocess.CalledProcessError as exc:
            print(
                "Creating the user failed. Please run the launcher with admin privileges.",
                file=sys.stderr,
            )
            return exc.returncode

    if args.dry_run:
        print("Resolved executable:", exe_path)
        print("Working directory:", working_dir)
        if clone_dir:
            print("Clone destination:", clone_dir)
        print("runas command:", command)
        return 0

    # Prepare arguments for wrapper
    exe_args = []
    if args.arguments:
        exe_args = shlex.split(args.arguments, posix=False)

    if args.proxy:
        proxy_to_use = args.proxy
    elif args.config_path and args.app_id:
        # Pass username for fallback to Profile's default proxy
        proxy_to_use = load_proxy_from_config(args.config_path, args.app_id, username)
    else:
        proxy_to_use = None

    if proxy_to_use:
        print(f"Cấu hình proxy: {proxy_to_use} (qua Wrapper Script)")
        debug_log(f"Using proxy wrapper: {proxy_to_use}")
        # Create wrapper script that sets proxy AND runs the app
        command = create_proxy_wrapper(exe_path, exe_args, working_dir, proxy_to_use)
    else:
        debug_log("Using clear proxy wrapper")
        # Ensure proxy is DISABLED/CLEARED to prevent leftover settings using the same wrapper approach
        command = create_clear_proxy_wrapper(exe_path, exe_args, working_dir)

    debug_log(f"Final Command: {command}")

    if args.dry_run:
        print(command)
        return 0

    print(f"Đang chạy lệnh: {command}")

    try:
        debug_log(f"Calling run_as_user({username}, ...)")
        # Pass password to enable CreateProcessWithLogonW (no console prompt)
        run_as_user(
            username,
            command,
            savecred,
            has_saved_credential=bool(password),
            password=password,
            working_dir=working_dir,
        )
        debug_log("run_as_user returned successfully")
    except subprocess.CalledProcessError as exc:
        debug_log(f"run_as_user failed: {exc}")
        print(f"runas failed: {exc}", file=sys.stderr)
        return exc.returncode

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        import traceback

        # FIXED: Use SCRIPT_DIR instead of hardcoded path
        error_log = SCRIPT_DIR / "launcher_crash.log"
        error_log.write_text(f"CRASH: {e}\n{traceback.format_exc()}", encoding="utf-8")
        sys.exit(1)
