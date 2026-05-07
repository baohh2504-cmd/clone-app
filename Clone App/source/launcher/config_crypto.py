"""
Config Encryption Module - Clone App ULTRA
==========================================
Mã hóa file cấu hình bằng AES-256-CBC.
Key sinh từ HWID của máy → mỗi máy có key riêng.

Author: Clone App Team
Phase: 08 - Security Hardening
"""

import os
import json
import hashlib
import base64
import subprocess
from pathlib import Path
from typing import Optional, Tuple
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

# Constants
APPDATA_DIR = Path(os.environ.get("APPDATA", "")) / "RunCloneApp"
CONFIG_FILE = APPDATA_DIR / "config.enc"
LEGACY_CONFIG_NAME = "created_users.json"


def run_hidden(cmd: list[str], **kwargs):
    if os.name == "nt" and "creationflags" not in kwargs:
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    return subprocess.run(cmd, **kwargs)


def get_machine_hwid() -> str:
    """
    Lấy HWID của máy từ nhiều nguồn để tạo unique key.
    Kết hợp: Machine GUID + Processor ID + Volume Serial
    """
    parts = []

    # 1. Machine GUID (từ Registry)
    try:
        result = run_hidden(
            [
                "reg",
                "query",
                "HKLM\\SOFTWARE\\Microsoft\\Cryptography",
                "/v",
                "MachineGuid",
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )
        for line in result.stdout.splitlines():
            if "MachineGuid" in line:
                parts.append(line.split()[-1])
                break
    except Exception:
        pass

    # 2. Computer Name (fallback)
    parts.append(os.environ.get("COMPUTERNAME", "UNKNOWN"))

    # 3. Username (extra entropy)
    parts.append(os.environ.get("USERNAME", "user"))

    combined = "-".join(parts)
    return combined


def derive_key_from_hwid(hwid: str) -> bytes:
    """
    Sinh AES-256 key từ HWID.
    HWID → SHA256 → 32 bytes key
    """
    # Thêm salt cố định để tăng entropy
    salt = b"CloneAppULTRA_SecureConfig_v1"
    data = hwid.encode("utf-8") + salt

    # SHA-256 cho ra 32 bytes = 256 bits (đúng cho AES-256)
    key = hashlib.sha256(data).digest()
    return key


def get_encryption_key() -> bytes:
    """Lấy key mã hóa dựa trên HWID của máy."""
    hwid = get_machine_hwid()
    return derive_key_from_hwid(hwid)


def encrypt_data(data: dict) -> bytes:
    """
    Mã hóa dictionary thành bytes.
    Format: [16 bytes IV] + [Encrypted data]
    """
    key = get_encryption_key()

    # Tạo random IV (Initialization Vector)
    iv = os.urandom(16)

    # Chuyển dict sang JSON string
    plaintext = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")

    # Padding to block size (16 bytes for AES)
    padding_length = 16 - (len(plaintext) % 16)
    plaintext += bytes([padding_length]) * padding_length

    # Encrypt với AES-256-CBC
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext) + encryptor.finalize()

    # Kết hợp IV + ciphertext
    return iv + ciphertext


def decrypt_data(encrypted: bytes) -> Optional[dict]:
    """
    Giải mã bytes thành dictionary.
    """
    if len(encrypted) < 32:  # Minimum: 16 IV + 16 data block
        return None

    key = get_encryption_key()

    # Tách IV và ciphertext
    iv = encrypted[:16]
    ciphertext = encrypted[16:]

    try:
        # Decrypt
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()

        # Remove PKCS7 padding
        padding_length = plaintext[-1]
        if padding_length > 16:
            return None
        plaintext = plaintext[:-padding_length]

        # Parse JSON
        return json.loads(plaintext.decode("utf-8"))
    except Exception:
        return None


def ensure_config_dir() -> Path:
    """Tạo thư mục config nếu chưa có."""
    APPDATA_DIR.mkdir(parents=True, exist_ok=True)
    return APPDATA_DIR


def find_legacy_config() -> Optional[Path]:
    """
    Tìm file config cũ (plaintext) để migrate.
    Tìm trong thư mục launcher cũ.
    """
    # Thử tìm trong thư mục script đang chạy
    script_dir = Path(__file__).resolve().parent
    legacy_path = script_dir / LEGACY_CONFIG_NAME

    if legacy_path.exists():
        return legacy_path

    return None


def load_config() -> dict:
    """
    Đọc config (tự động migrate từ plaintext nếu cần).

    Priority:
    1. Đọc từ file encrypted mới
    2. Nếu không có → Migrate từ file cũ
    3. Nếu cũng không có → Trả về config rỗng
    """
    ensure_config_dir()

    # 1. Thử đọc file encrypted mới
    if CONFIG_FILE.exists():
        try:
            encrypted = CONFIG_FILE.read_bytes()
            data = decrypt_data(encrypted)
            if data is not None:
                return data
        except Exception:
            pass

    # 2. Thử migrate từ file cũ
    legacy_path = find_legacy_config()
    if legacy_path and legacy_path.exists():
        try:
            data = json.loads(legacy_path.read_text(encoding="utf-8"))

            # Migrate: Save encrypted version
            save_config(data)

            # Xóa file cũ sau khi migrate thành công
            try:
                legacy_path.unlink()
            except Exception:
                pass

            return data
        except Exception:
            pass

    # 3. Trả về config rỗng
    return {"users": [], "apps": []}


def save_config(data: dict) -> bool:
    """
    Lưu config (đã mã hóa).
    """
    try:
        ensure_config_dir()
        encrypted = encrypt_data(data)
        CONFIG_FILE.write_bytes(encrypted)
        return True
    except Exception:
        return False


def get_config_path() -> Path:
    """Trả về đường dẫn file config hiện tại."""
    return CONFIG_FILE


# Export public functions
__all__ = [
    "load_config",
    "save_config",
    "get_config_path",
    "get_machine_hwid",
]
