from __future__ import annotations

import argparse
import json
import sys
from http.client import HTTPConnection
from urllib.parse import quote


REQUIRED_ADMIN_MARKERS = (
    'data-section="maintenance"',
    'data-section="messages"',
    'id="batch-upload-area"',
)


def request(host: str, port: int, path: str) -> tuple[int, str]:
    connection = HTTPConnection(host, port, timeout=1.5)
    try:
        connection.request("GET", path)
        response = connection.getresponse()
        body = response.read(128 * 1024).decode("utf-8", errors="replace")
        return response.status, body
    finally:
        connection.close()


def is_local_api(host: str, port: int) -> bool:
    try:
        status, body = request(host, port, "/api/status")
    except OSError:
        return False

    if status != 200:
        return False

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return False

    return payload.get("ok") is True and "Local save API" in str(payload.get("message", ""))


def admin_status(host: str, port: int) -> int | None:
    try:
        status, _ = request(host, port, "/admin.html")
        return status
    except OSError:
        return None


def admin_version_ok(host: str, port: int) -> bool:
    try:
        status, body = request(host, port, "/admin.html")
    except OSError:
        return False

    return status == 200 and all(marker in body for marker in REQUIRED_ADMIN_MARKERS)


def preflight(host: str, port: int) -> int:
    status = admin_status(host, port)
    if status is None:
        print(f"[INFO] Port {port} is free.")
        return 0

    if is_local_api(host, port) and status == 200 and admin_version_ok(host, port):
        print(f"[INFO] ImageExhibition server is already running at http://{host}:{port}/")
        return 1

    if is_local_api(host, port) and status == 200:
        print(f"[ERROR] Port {port} is running an older ImageExhibition admin page.")
        print("[ERROR] The page is missing the Maintenance / Messages menus or the new upload area.")
        print("[ERROR] Close the old server window, update/copy the latest project files, then run start-local.bat again.")
        return 2

    print(f"[ERROR] Port {port} is already in use, but it does not look like this project server.")
    print(f"[ERROR] GET /admin.html returned HTTP {status}.")
    print("[ERROR] Close the old server window or change PORT in the .bat file, then retry.")
    return 2


def verify(host: str, port: int) -> int:
    if not is_local_api(host, port):
        print(f"[ERROR] ImageExhibition API did not start at http://{host}:{port}/api/status")
        print("[ERROR] Check the server window for Python errors.")
        return 3

    status = admin_status(host, port)
    if status != 200:
        print(f"[ERROR] /admin.html returned HTTP {status}.")
        print("[ERROR] Make sure start-local.bat is inside the project root with admin.html.")
        return 4

    if not admin_version_ok(host, port):
        print("[ERROR] /admin.html is an older version.")
        print("[ERROR] Missing expected menus: Maintenance / Messages, or the new upload area.")
        print("[ERROR] Close the old server window, update/copy the latest project files, then run start-local.bat again.")
        return 5

    print(f"[INFO] Verified: http://{host}:{port}/admin.html")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Check the ImageExhibition local server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--mode", choices={"preflight", "verify"}, required=True)
    args = parser.parse_args()

    host = quote(args.host, safe=":.")
    if args.mode == "preflight":
        return preflight(host, args.port)
    return verify(host, args.port)


if __name__ == "__main__":
    sys.exit(main())
