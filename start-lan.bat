@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "PORT=8000"
set "HOST=0.0.0.0"
set "LOCAL_URL=http://127.0.0.1:%PORT%/admin.html"

pushd "%ROOT_DIR%" >nul

set "PYTHON_CMD="
where python >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=python"

if not defined PYTHON_CMD (
    where py >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=py -3"
)

if not defined PYTHON_CMD (
    echo [ERROR] Python not found. Install Python 3 and try again.
    echo [ERROR] Download: https://www.python.org/downloads/
    popd >nul
    exit /b 1
)

echo [INFO] Project root: %ROOT_DIR%
echo [INFO] Server binding: http://%HOST%:%PORT%/
echo [INFO] Local admin: %LOCAL_URL%
echo [INFO] Admin password: admin123
echo.
echo [INFO] Other computers on the same LAN should use this computer's IPv4 address:
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | ForEach-Object { '       http://' + $_.IPAddress + ':%PORT%/admin.html' }"
echo.
echo [INFO] If another computer cannot open it, allow Python through Windows Firewall.

if "%DRY_RUN%"=="1" (
    echo [DRY_RUN] Would start: %PYTHON_CMD% scripts\local_server.py --host %HOST% --port %PORT%
    echo [DRY_RUN] Would open: %LOCAL_URL%
    popd >nul
    exit /b 0
)

start "ImageExhibition LAN Server" cmd /k "%PYTHON_CMD% scripts\local_server.py --host %HOST% --port %PORT%"
timeout /t 2 /nobreak >nul
start "" "%LOCAL_URL%"

echo [INFO] LAN server started in a new window.

popd >nul
exit /b 0
