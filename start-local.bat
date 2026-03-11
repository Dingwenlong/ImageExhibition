@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "PORT=8000"
set "HOST=127.0.0.1"
set "INDEX_URL=http://%HOST%:%PORT%/index.html"
set "ADMIN_URL=http://%HOST%:%PORT%/admin.html"

pushd "%ROOT_DIR%" >nul

set "PYTHON_CMD="
where python >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=python -m"

if not defined PYTHON_CMD (
    where py >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=py -m"
)

if not defined PYTHON_CMD (
    echo [ERROR] Python not found. Install Python 3 and try again.
    echo [ERROR] Download: https://www.python.org/downloads/
    popd >nul
    exit /b 1
)

echo [INFO] Project root: %ROOT_DIR%
echo [INFO] Server URL: http://%HOST%:%PORT%/

if "%DRY_RUN%"=="1" (
    echo [DRY_RUN] Would start: %PYTHON_CMD% http.server %PORT%
    echo [DRY_RUN] Would open: %INDEX_URL%
    echo [DRY_RUN] Would open: %ADMIN_URL%
    popd >nul
    exit /b 0
)

start "ImageExhibition Server" cmd /k "%PYTHON_CMD% http.server %PORT%"
timeout /t 2 /nobreak >nul
start "" "%INDEX_URL%"
start "" "%ADMIN_URL%"

echo [INFO] Local server started in a new window.
echo [INFO] Index: %INDEX_URL%
echo [INFO] Admin: %ADMIN_URL%

popd >nul
exit /b 0
