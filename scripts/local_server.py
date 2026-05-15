from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import secrets
import shutil
from datetime import datetime
from email import message_from_bytes
from email.policy import HTTP as HTTPPolicy
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
IMAGES_DIR = ROOT / "images"
BACKUPS_DIR = ROOT / "backups"
ADMIN_CONFIG_PATH = DATA_DIR / "admin.json"
MESSAGES_PATH = DATA_DIR / "messages.json"
IMAGE_HASHES_PATH = DATA_DIR / "image_hashes.json"
FULL_DIR = IMAGES_DIR / "full"
THUMB_DIR = IMAGES_DIR / "thumbs"
WEBP_FULL_DIR = IMAGES_DIR / "webp" / "full"
WEBP_THUMB_DIR = IMAGES_DIR / "webp" / "thumbs"
BLUR_DIR = IMAGES_DIR / "blur"
CONFIG_PATH = DATA_DIR / "config.json"
PHOTOS_PATH = DATA_DIR / "photos.json"
MAX_BODY_BYTES = 2 * 1024 * 1024
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
THUMB_SIZE = (400, 300)
BLUR_SIZE = (40, 30)
PHOTO_CATEGORIES = {"portrait", "landscape", "documentary", "blackwhite"}


def parse_multipart(content_type: str, body: bytes) -> dict[str, Any]:
    header = f"Content-Type: {content_type}\r\n\r\n".encode()
    msg = message_from_bytes(header + body, policy=HTTPPolicy)
    fields: dict[str, Any] = {}
    for part in msg.iter_parts():
        cd = part.get("Content-Disposition", "")
        if "name=" not in cd:
            continue
        name_start = cd.index("name=") + 5
        name_end = cd.index(";", name_start) if ";" in cd[name_start:] else len(cd)
        name = cd[name_start:name_end].strip().strip('"')
        filename = None
        if "filename=" in cd:
            fn_start = cd.index("filename=") + 9
            fn_end = cd.index(";", fn_start) if ";" in cd[fn_start:] else len(cd)
            filename = cd[fn_start:fn_end].strip().strip('"')
        payload = part.get_content()
        if filename:
            fields[name] = {"filename": filename, "data": payload if isinstance(payload, bytes) else payload.encode()}
        else:
            fields[name] = payload if isinstance(payload, str) else payload.decode()
    return fields


class LocalServerHandler(SimpleHTTPRequestHandler):
    server_version = "ImageExhibitionLocal/1.0"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == "/api/status":
            self.send_json({
                "ok": True,
                "message": "Local save API is available",
                "authRequired": self.auth_required,
            })
            return

        super().do_GET()

    def do_POST(self) -> None:
        route = self.path.split("?", 1)[0]

        try:
            if route == "/api/login":
                self.login()
                return

            if route == "/api/contact-message":
                self.save_contact_message()
                return

            self.require_auth()

            if route == "/api/upload-photo":
                self.upload_photo()
                return

            payload = self.read_json_body()

            if route == "/api/save-config":
                self.save_config(payload)
                return

            if route == "/api/save-photos":
                self.save_photos(payload)
                return

            if route == "/api/save-project":
                self.save_project(payload)
                return

            if route == "/api/check-paths":
                self.check_paths(payload)
                return

            if route == "/api/delete-photo-assets":
                self.delete_photo_assets(payload)
                return

            if route == "/api/list-backups":
                self.list_backups()
                return

            if route == "/api/restore-backup":
                self.restore_backup(payload)
                return

            if route == "/api/integrity-check":
                self.integrity_check()
                return

            if route == "/api/change-password":
                self.change_password(payload)
                return

            if route == "/api/list-messages":
                self.list_messages()
                return

            self.send_error_json(HTTPStatus.NOT_FOUND, "Unknown API endpoint")
        except PermissionError as error:
            self.send_error_json(HTTPStatus.UNAUTHORIZED, str(error))
        except ValueError as error:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(error))
        except Exception as error:
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(error))

    @property
    def admin_password(self) -> str:
        return getattr(self.server, "admin_password", "")

    @property
    def auth_required(self) -> bool:
        return bool(load_admin_config().get("passwordHash") or self.admin_password)

    def login(self) -> None:
        payload = self.read_json_body()
        password = str(payload.get("password", ""))
        if verify_admin_password(password, self.admin_password):
            self.send_json({"ok": True})
            return

        raise PermissionError("Invalid admin password")

    def require_auth(self) -> None:
        if not self.auth_required:
            return

        password = self.headers.get("X-Admin-Password", "")
        if not verify_admin_password(password, self.admin_password):
            raise PermissionError("Admin password is required")

    def read_json_body(self) -> dict[str, Any]:
        length_header = self.headers.get("Content-Length")
        if not length_header:
            raise ValueError("Missing request body")

        length = int(length_header)
        if length > MAX_BODY_BYTES:
            raise ValueError("Request body is too large")

        raw_body = self.rfile.read(length)
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError as error:
            raise ValueError(f"Invalid JSON: {error.msg}") from error

        if not isinstance(payload, dict):
            raise ValueError("JSON body must be an object")

        return payload

    def save_config(self, payload: dict[str, Any]) -> None:
        site_config = payload.get("siteConfig")
        if not isinstance(site_config, dict):
            raise ValueError("config payload must contain a siteConfig object")

        data = dict(payload)
        data["siteConfig"] = site_config
        write_json(CONFIG_PATH, data)
        self.send_json({"ok": True, "file": "data/config.json"})

    def save_photos(self, payload: dict[str, Any]) -> None:
        photos = payload.get("photos")
        if not isinstance(photos, list):
            raise ValueError("photos payload must contain a photos array")

        data = dict(payload)
        data["photos"] = photos
        write_json(PHOTOS_PATH, data)
        self.send_json({"ok": True, "file": "data/photos.json"})

    def save_project(self, payload: dict[str, Any]) -> None:
        config_payload = payload.get("config")
        photos_payload = payload.get("photos")

        if not isinstance(config_payload, dict):
            raise ValueError("project payload must contain a config object")
        if not isinstance(photos_payload, dict):
            raise ValueError("project payload must contain a photos object")

        site_config = config_payload.get("siteConfig")
        photos = photos_payload.get("photos")
        if not isinstance(site_config, dict):
            raise ValueError("config payload must contain a siteConfig object")
        if not isinstance(photos, list):
            raise ValueError("photos payload must contain a photos array")

        write_json(CONFIG_PATH, config_payload)
        write_json(PHOTOS_PATH, photos_payload)
        self.send_json({"ok": True, "files": ["data/config.json", "data/photos.json"]})

    def upload_photo(self) -> None:
        length_header = self.headers.get("Content-Length")
        if not length_header:
            raise ValueError("Missing upload body")

        length = int(length_header)
        if length > MAX_UPLOAD_BYTES:
            raise ValueError("Uploaded image is too large")

        content_type = self.headers.get("Content-Type", "")
        if not content_type.lower().startswith("multipart/form-data"):
            raise ValueError("upload-photo expects multipart/form-data")

        body = self.rfile.read(length)
        form = parse_multipart(content_type, body)

        image_field = form.get("image")
        if image_field is None or not isinstance(image_field, dict) or not image_field.get("filename"):
            raise ValueError("Missing image file")

        photo_id = parse_photo_id(form.get("photoId"))
        category = form.get("category", "portrait") or "portrait"
        if category not in PHOTO_CATEGORIES:
            category = "portrait"

        image_bytes = image_field["data"]
        image_hash = hashlib.sha256(image_bytes).hexdigest()
        existing_upload = find_existing_upload(image_hash)
        if existing_upload:
            self.send_json({
                "ok": True,
                "duplicate": True,
                "photoId": existing_upload.get("photoId"),
                "paths": existing_upload.get("paths", {}),
                "metadata": existing_upload.get("metadata", {}),
                "hash": image_hash,
            })
            return

        focus_x = parse_focus(form.get("focusX"), 0.5)
        focus_y = parse_focus(form.get("focusY"), 0.5)
        metadata = extract_exif_metadata(image_bytes)
        paths = build_image_variants(image_bytes, photo_id, category, focus=(focus_x, focus_y))
        register_upload_hash(image_hash, {
            "photoId": photo_id,
            "paths": paths,
            "metadata": metadata,
            "uploadedAt": datetime.now().isoformat(timespec="seconds"),
        })
        self.send_json({"ok": True, "duplicate": False, "photoId": photo_id, "paths": paths, "metadata": metadata, "hash": image_hash})

    def check_paths(self, payload: dict[str, Any]) -> None:
        paths = payload.get("paths")
        if not isinstance(paths, list):
            raise ValueError("paths must be an array")

        results = []
        for path in paths:
            if not isinstance(path, str) or not path.strip():
                continue

            file_path = resolve_project_path(path)
            results.append({
                "path": path,
                "exists": file_path.exists() if file_path else False,
                "allowed": bool(file_path),
            })

        self.send_json({"ok": True, "results": results})

    def delete_photo_assets(self, payload: dict[str, Any]) -> None:
        paths = payload.get("paths")
        if not isinstance(paths, list):
            raise ValueError("paths must be an array")

        deleted = []
        skipped = []
        for path in paths:
            if not isinstance(path, str) or not path.strip():
                continue

            file_path = resolve_image_path(path)
            if not file_path:
                skipped.append({"path": path, "reason": "outside images directory"})
                continue

            if file_path.exists() and file_path.is_file():
                file_path.unlink()
                deleted.append(path)
            else:
                skipped.append({"path": path, "reason": "not found"})

        self.send_json({"ok": True, "deleted": deleted, "skipped": skipped})

    def list_backups(self) -> None:
        self.send_json({"ok": True, "backups": list_backups()})

    def restore_backup(self, payload: dict[str, Any]) -> None:
        backup_id = payload.get("backupId")
        if not isinstance(backup_id, str) or not backup_id.strip():
            raise ValueError("backupId is required")

        backup_dir = resolve_backup_dir(backup_id)
        if not backup_dir or not backup_dir.exists():
            raise ValueError("Backup not found")

        restored = []
        for filename, target in [("config.json", CONFIG_PATH), ("photos.json", PHOTOS_PATH)]:
            source = backup_dir / filename
            if source.exists():
                data = json.loads(source.read_text(encoding="utf-8"))
                write_json(target, data)
                restored.append(f"data/{filename}")

        if not restored:
            raise ValueError("Backup does not contain restorable JSON files")

        self.send_json({"ok": True, "restored": restored})

    def integrity_check(self) -> None:
        self.send_json({"ok": True, **build_integrity_report()})

    def change_password(self, payload: dict[str, Any]) -> None:
        current_password = str(payload.get("currentPassword", ""))
        new_password = str(payload.get("newPassword", ""))

        if not verify_admin_password(current_password, self.admin_password):
            raise PermissionError("Current password is incorrect")
        if len(new_password) < 8:
            raise ValueError("New password must be at least 8 characters")

        write_json(ADMIN_CONFIG_PATH, {
            "passwordHash": make_password_hash(new_password),
            "updatedAt": datetime.now().isoformat(timespec="seconds"),
        })
        self.send_json({"ok": True})

    def save_contact_message(self) -> None:
        payload = self.read_json_body()
        name = str(payload.get("name", "")).strip()
        email = str(payload.get("email", "")).strip()
        subject = str(payload.get("subject", "")).strip()
        message = str(payload.get("message", "")).strip()

        if not name or not email or not message:
            raise ValueError("name, email and message are required")
        if len(message) < 10:
            raise ValueError("message is too short")

        messages = read_messages()
        next_id = max((int(item.get("id", 0)) for item in messages if isinstance(item, dict)), default=0) + 1
        messages.insert(0, {
            "id": next_id,
            "name": name,
            "email": email,
            "subject": subject,
            "message": message,
            "createdAt": datetime.now().isoformat(timespec="seconds"),
            "status": "new",
        })
        write_json(MESSAGES_PATH, {"messages": messages})
        self.send_json({"ok": True, "id": next_id})

    def list_messages(self) -> None:
        self.send_json({"ok": True, "messages": read_messages()})

    def send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, status: HTTPStatus, message: str) -> None:
        self.send_json({"ok": False, "error": message}, status)


def write_json(path: Path, data: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    target = path.resolve()
    if DATA_DIR.resolve() not in target.parents:
        raise ValueError("Refusing to write outside data directory")

    backup_existing_file(target)
    temp_path = target.with_suffix(target.suffix + ".tmp")
    temp_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp_path.replace(target)


def backup_existing_file(path: Path) -> None:
    if not path.exists():
        return

    backup_dir = BACKUPS_DIR / datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_dir.mkdir(parents=True, exist_ok=True)
    target = backup_dir / path.name
    counter = 1
    while target.exists():
        target = backup_dir / f"{path.stem}-{counter}{path.suffix}"
        counter += 1

    shutil.copy2(path, target)


def list_backups() -> list[dict[str, Any]]:
    if not BACKUPS_DIR.exists():
        return []

    backups = []
    for directory in sorted(BACKUPS_DIR.iterdir(), reverse=True):
        if not directory.is_dir():
            continue

        files = []
        for filename in ["config.json", "photos.json"]:
            file_path = directory / filename
            if file_path.exists():
                files.append({
                    "name": filename,
                    "size": file_path.stat().st_size,
                })

        if files:
            backups.append({
                "id": directory.name,
                "files": files,
            })

    return backups


def resolve_backup_dir(backup_id: str) -> Path | None:
    candidate = (BACKUPS_DIR / backup_id).resolve()
    try:
        candidate.relative_to(BACKUPS_DIR.resolve())
    except ValueError:
        return None
    return candidate


def load_admin_config() -> dict[str, Any]:
    try:
        data = json.loads(ADMIN_CONFIG_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def make_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    iterations = 260000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${digest.hex()}"


def verify_admin_password(password: str, fallback_password: str) -> bool:
    config = load_admin_config()
    stored_hash = config.get("passwordHash")
    if isinstance(stored_hash, str) and stored_hash:
        try:
            algorithm, iterations_text, salt, digest_hex = stored_hash.split("$", 3)
            if algorithm != "pbkdf2_sha256":
                return False
            digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations_text))
            return hmac.compare_digest(digest.hex(), digest_hex)
        except (ValueError, TypeError):
            return False

    if fallback_password:
        return hmac.compare_digest(password, fallback_password)

    return True


def read_messages() -> list[dict[str, Any]]:
    try:
        data = json.loads(MESSAGES_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return []
    messages = data.get("messages", [])
    return messages if isinstance(messages, list) else []


def read_image_hashes() -> dict[str, Any]:
    try:
        data = json.loads(IMAGE_HASHES_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}
    hashes = data.get("hashes", {})
    return hashes if isinstance(hashes, dict) else {}


def find_existing_upload(image_hash: str) -> dict[str, Any] | None:
    item = read_image_hashes().get(image_hash)
    if not isinstance(item, dict):
        return None

    paths = item.get("paths", {})
    if not isinstance(paths, dict):
        return None

    full_image = paths.get("fullImage")
    file_path = resolve_project_path(str(full_image)) if full_image else None
    if file_path and file_path.exists():
        return item

    return None


def register_upload_hash(image_hash: str, item: dict[str, Any]) -> None:
    hashes = read_image_hashes()
    hashes[image_hash] = item
    write_json(IMAGE_HASHES_PATH, {"hashes": hashes})


def parse_photo_id(value: str | None) -> int:
    try:
        photo_id = int(value or "0")
    except ValueError:
        photo_id = 0

    if photo_id > 0:
        return photo_id

    return next_photo_id()


def parse_focus(value: str | None, default: float) -> float:
    try:
        number = float(value if value is not None else default)
    except (TypeError, ValueError):
        number = default

    return min(max(number, 0.0), 1.0)


def next_photo_id() -> int:
    try:
        data = json.loads(PHOTOS_PATH.read_text(encoding="utf-8"))
        photos = data.get("photos", [])
    except (FileNotFoundError, json.JSONDecodeError):
        photos = []

    max_id = 0
    for photo in photos:
        if isinstance(photo, dict):
            try:
                max_id = max(max_id, int(photo.get("id", 0)))
            except (TypeError, ValueError):
                continue

    return max_id + 1


def ensure_image_dirs() -> None:
    for path in [FULL_DIR, THUMB_DIR, WEBP_FULL_DIR, WEBP_THUMB_DIR, BLUR_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def build_image_variants(image_bytes: bytes, photo_id: int, category: str, focus: tuple[float, float] = (0.5, 0.5)) -> dict[str, str]:
    try:
        from PIL import Image, ImageFilter, ImageOps, UnidentifiedImageError
    except ImportError as error:
        raise ValueError("当前 Python 环境未安装 Pillow，图片上传不可用。请运行：python -m pip install Pillow，或重新双击 start-local.bat 自动安装。") from error

    from io import BytesIO

    ensure_image_dirs()

    full_name = f"photo-{photo_id:02d}.jpg"
    thumb_name = f"photo-{photo_id:02d}.jpg"
    blur_name = f"photo-{photo_id:02d}-blur.jpg"
    webp_full_name = f"photo-{photo_id:02d}.webp"
    webp_thumb_name = f"photo-{photo_id:02d}.webp"

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            base = ImageOps.exif_transpose(image).convert("RGB")
    except UnidentifiedImageError as error:
        raise ValueError("Uploaded file is not a supported image") from error

    if category == "blackwhite":
        base = ImageOps.grayscale(base).convert("RGB")

    base.save(FULL_DIR / full_name, "JPEG", quality=88, optimize=True, progressive=True)
    base.save(WEBP_FULL_DIR / webp_full_name, "WEBP", quality=84, method=6)

    thumb = ImageOps.fit(base, THUMB_SIZE, method=Image.Resampling.LANCZOS, centering=focus)
    thumb.save(THUMB_DIR / thumb_name, "JPEG", quality=86, optimize=True, progressive=True)
    thumb.save(WEBP_THUMB_DIR / webp_thumb_name, "WEBP", quality=82, method=6)

    blur = thumb.resize(BLUR_SIZE, Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=2))
    blur.save(BLUR_DIR / blur_name, "JPEG", quality=70, optimize=True)

    return {
        "thumbnail": f"images/thumbs/{thumb_name}",
        "fullImage": f"images/full/{full_name}",
        "webpThumbnail": f"images/webp/thumbs/{webp_thumb_name}",
        "webpFull": f"images/webp/full/{webp_full_name}",
        "blurThumbnail": f"images/blur/{blur_name}",
    }


def extract_exif_metadata(image_bytes: bytes) -> dict[str, str]:
    try:
        from PIL import Image, ExifTags
    except ImportError:
        return {}

    from io import BytesIO

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            raw_exif = image.getexif()
            if not raw_exif:
                return {}
            tag_names = {value: key for key, value in ExifTags.TAGS.items()}
            make = clean_exif_value(raw_exif.get(tag_names.get("Make", 271)))
            model = clean_exif_value(raw_exif.get(tag_names.get("Model", 272)))
            lens = clean_exif_value(raw_exif.get(tag_names.get("LensModel", 42036)))
            aperture = format_aperture(raw_exif.get(tag_names.get("FNumber", 33437)))
            shutter = format_shutter(raw_exif.get(tag_names.get("ExposureTime", 33434)))
            iso = clean_exif_value(raw_exif.get(tag_names.get("ISOSpeedRatings", 34855)) or raw_exif.get(34855))
            date = format_exif_date(clean_exif_value(raw_exif.get(tag_names.get("DateTimeOriginal", 36867)) or raw_exif.get(tag_names.get("DateTime", 306))))
    except Exception:
        return {}

    metadata = {}
    camera = " ".join(part for part in [make, model] if part).strip()
    if camera:
        metadata["camera"] = camera
    if lens:
        metadata["lens"] = lens
    if aperture:
        metadata["aperture"] = aperture
    if shutter:
        metadata["shutter"] = shutter
    if iso:
        metadata["iso"] = str(iso)
    if date:
        metadata["date"] = date
    return metadata


def clean_exif_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore").strip("\x00 ")
    return str(value).strip()


def rational_to_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError, ZeroDivisionError):
        pass
    try:
        numerator, denominator = value
        return float(numerator) / float(denominator)
    except (TypeError, ValueError, ZeroDivisionError):
        return None


def format_aperture(value: Any) -> str:
    number = rational_to_float(value)
    if not number:
        return ""
    return f"f/{number:.1f}".rstrip("0").rstrip(".")


def format_shutter(value: Any) -> str:
    number = rational_to_float(value)
    if not number:
        return ""
    if number >= 1:
        text = f"{number:.1f}".rstrip("0").rstrip(".")
        return f"{text}s"
    denominator = round(1 / number)
    return f"1/{denominator}s"


def format_exif_date(value: str) -> str:
    if not value:
        return ""
    if len(value) >= 10 and value[4] == ":" and value[7] == ":":
        return value[:10].replace(":", "-")
    return value[:10]


def resolve_project_path(path: str) -> Path | None:
    normalized = path.replace("\\", "/").split("?", 1)[0].lstrip("/")
    candidate = (ROOT / normalized).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return None
    return candidate


def resolve_image_path(path: str) -> Path | None:
    candidate = resolve_project_path(path)
    if not candidate:
        return None
    try:
        candidate.relative_to(IMAGES_DIR.resolve())
    except ValueError:
        return None
    return candidate


def read_photos_data() -> list[dict[str, Any]]:
    try:
        data = json.loads(PHOTOS_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return []

    photos = data.get("photos", [])
    return photos if isinstance(photos, list) else []


def build_integrity_report() -> dict[str, Any]:
    photos = read_photos_data()
    issues = []
    referenced_assets = set()
    seen_ids = set()
    duplicate_ids = set()
    required_path_keys = ["thumbnail", "fullImage"]
    optional_path_keys = ["webpThumbnail", "webpFull", "blurThumbnail"]

    for index, photo in enumerate(photos, start=1):
        if not isinstance(photo, dict):
            issues.append(issue("error", f"第 {index} 条作品不是对象", "photos"))
            continue

        photo_id = photo.get("id")
        label = f"作品 {photo_id or index}"

        if photo_id in seen_ids:
            duplicate_ids.add(photo_id)
            issues.append(issue("error", f"{label} 的 ID 重复", "id"))
        else:
            seen_ids.add(photo_id)

        if not str(photo.get("title", "")).strip():
            issues.append(issue("warning", f"{label} 未填写标题", "title"))

        category = photo.get("category")
        if category not in PHOTO_CATEGORIES:
            issues.append(issue("error", f"{label} 分类无效：{category}", "category"))

        for key in required_path_keys:
            path = str(photo.get(key, "")).strip()
            if not path:
                issues.append(issue("error", f"{label} 缺少必填图片路径：{key}", key))
                continue
            referenced_assets.add(path.split("?", 1)[0])
            file_path = resolve_project_path(path)
            if not file_path or not file_path.exists():
                issues.append(issue("error", f"{label} 图片不存在：{path}", key))

        for key in optional_path_keys:
            path = str(photo.get(key, "")).strip()
            if not path:
                issues.append(issue("warning", f"{label} 未填写可选图片路径：{key}", key))
                continue
            referenced_assets.add(path.split("?", 1)[0])
            file_path = resolve_project_path(path)
            if not file_path or not file_path.exists():
                issues.append(issue("warning", f"{label} 可选图片不存在：{path}", key))

        metadata = photo.get("metadata", {})
        if not isinstance(metadata, dict) or not str(metadata.get("description", "")).strip():
            issues.append(issue("info", f"{label} 未填写作品描述", "metadata.description"))

    image_assets = collect_image_assets()
    unreferenced_assets = sorted(path for path in image_assets if path not in referenced_assets)
    for path in unreferenced_assets[:50]:
        issues.append(issue("info", f"图片文件未被作品引用：{path}", "images"))

    return {
        "summary": {
            "photos": len(photos),
            "issues": len(issues),
            "errors": sum(1 for item in issues if item["level"] == "error"),
            "warnings": sum(1 for item in issues if item["level"] == "warning"),
            "info": sum(1 for item in issues if item["level"] == "info"),
            "unreferencedAssets": len(unreferenced_assets),
            "duplicateIds": len(duplicate_ids),
        },
        "issues": issues,
    }


def collect_image_assets() -> set[str]:
    if not IMAGES_DIR.exists():
        return set()

    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    assets = set()
    for path in IMAGES_DIR.rglob("*"):
        if path.is_file() and path.suffix.lower() in extensions:
            assets.add(path.relative_to(ROOT).as_posix())
    return assets


def issue(level: str, message: str, scope: str) -> dict[str, str]:
    return {
        "level": level,
        "message": message,
        "scope": scope,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the ImageExhibition local server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--admin-password", default=os.environ.get("IMAGEEXHIBITION_ADMIN_PASSWORD", "admin123"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), LocalServerHandler)
    server.admin_password = args.admin_password
    print(f"Serving ImageExhibition at http://{args.host}:{args.port}/")
    if args.host in {"0.0.0.0", "::"}:
        print("LAN access enabled. Other computers must use this computer's LAN IP, not 127.0.0.1.")
    print("Local save API enabled for data/config.json and data/photos.json")
    if args.admin_password:
        print("Admin password is enabled. Default password: admin123")
    server.serve_forever()


if __name__ == "__main__":
    main()
