@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "PORT=8000"
set "HOST=127.0.0.1"
set "INDEX_URL=http://%HOST%:%PORT%/index.html"
set "ADMIN_URL=http://%HOST%:%PORT%/admin.html"

pushd "%ROOT_DIR%" >nul

set "PYTHON_CMD="
python -c "1" >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=python"

if not defined PYTHON_CMD (
    py -3 -c "1" >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=py -3"
)

if not defined PYTHON_CMD (
    echo [ERROR] Python not found or Windows Store alias detected.
    echo [ERROR] Please install Python 3 from https://www.python.org/downloads/
    echo [ERROR] Make sure to check "Add Python to PATH" during installation.
    echo [ERROR] If already installed, disable Windows Store alias:
    echo [ERROR]   Settings ^> Apps ^> Advanced app settings ^> App execution aliases ^> Disable "python.exe"
    echo.
    pause
    popd >nul
    exit /b 1
)

if not exist "scripts\local_server.py" (
    echo [ERROR] Server script not found: scripts\local_server.py
    echo [ERROR] Please ensure the project is complete.
    echo.
    pause
    popd >nul
    exit /b 1
)

if not exist "admin.html" (
    echo [ERROR] admin.html not found in project root: %ROOT_DIR%
    echo [ERROR] Please run this script from a complete ImageExhibition project folder.
    echo.
    pause
    popd >nul
    exit /b 1
)

if not exist "scripts\check_server.py" (
    echo [ERROR] Server checker not found: scripts\check_server.py
    echo [ERROR] Please ensure the project is complete.
    echo.
    pause
    popd >nul
    exit /b 1
)

echo [INFO] Project root: %ROOT_DIR%
echo [INFO] Server URL: http://%HOST%:%PORT%/
echo [INFO] Admin password: admin123

%PYTHON_CMD% scripts\check_server.py --host %HOST% --port %PORT% --mode preflight
set "CHECK_RESULT=%ERRORLEVEL%"
if "%CHECK_RESULT%"=="1" (
    set "SERVER_ALREADY_RUNNING=1"
    goto OPEN_URLS
)
if not "%CHECK_RESULT%"=="0" (
    echo.
    pause
    popd >nul
    exit /b 1
)

if "%DRY_RUN%"=="1" (
    echo [DRY_RUN] Would start: %PYTHON_CMD% scripts\local_server.py --host %HOST% --port %PORT%
    echo [DRY_RUN] Would open: %INDEX_URL%
    echo [DRY_RUN] Would open: %ADMIN_URL%
    popd >nul
    exit /b 0
)

start "ImageExhibition Server" cmd /k "%PYTHON_CMD% scripts\local_server.py --host %HOST% --port %PORT%"
timeout /t 2 /nobreak >nul
%PYTHON_CMD% scripts\check_server.py --host %HOST% --port %PORT% --mode verify
if errorlevel 1 (
    echo.
    pause
    popd >nul
    exit /b 1
)

:OPEN_URLS
if "%DRY_RUN%"=="1" (
    echo [DRY_RUN] Would open: %INDEX_URL%
    echo [DRY_RUN] Would open: %ADMIN_URL%
    popd >nul
    exit /b 0
)

start "" "%INDEX_URL%"
start "" "%ADMIN_URL%"

if defined SERVER_ALREADY_RUNNING (
    echo [INFO] Reused existing ImageExhibition server.
) else (
    echo [INFO] Local server started in a new window.
)
echo [INFO] Index: %INDEX_URL%
echo [INFO] Admin: %ADMIN_URL%

popd >nul
exit /b 0
