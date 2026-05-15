@echo off
setlocal EnableExtensions EnableDelayedExpansion

title ImageExhibition Local Launcher

set "ROOT_DIR=%~dp0"
set "PORT=8000"
set "HOST=127.0.0.1"
set "LOG_DIR=%ROOT_DIR%logs"
set "LOG_FILE=%LOG_DIR%\start-local.log"

pushd "%ROOT_DIR%" >nul

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>nul
echo ================================================== > "%LOG_FILE%"
echo ImageExhibition start-local.bat >> "%LOG_FILE%"
echo Time: %DATE% %TIME% >> "%LOG_FILE%"
echo Project root: %ROOT_DIR% >> "%LOG_FILE%"

echo.
echo ==================================================
echo   ImageExhibition local launcher
echo ==================================================
echo [INFO] Project root: %ROOT_DIR%
echo [INFO] Log file: %LOG_FILE%
echo.

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
echo [INFO] Python command: %PYTHON_CMD%
echo Python command: %PYTHON_CMD% >> "%LOG_FILE%"

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

echo [INFO] Checking image upload dependency: Pillow
%PYTHON_CMD% -c "import PIL" >nul 2>nul
if errorlevel 1 (
    echo [INFO] Pillow not found. Installing Pillow for image upload...
    echo Installing Pillow... >> "%LOG_FILE%"
    %PYTHON_CMD% -m pip install Pillow >> "%LOG_FILE%" 2>&1
    if errorlevel 1 (
        echo.
        echo [ERROR] Pillow installation failed. Image upload needs Pillow.
        echo [ERROR] Please run manually: %PYTHON_CMD% -m pip install Pillow
        echo [ERROR] See log: %LOG_FILE%
        echo.
        pause
        popd >nul
        exit /b 1
    )
    echo [INFO] Pillow installed.
    echo Pillow installed. >> "%LOG_FILE%"
) else (
    echo [INFO] Pillow is ready.
    echo Pillow is ready. >> "%LOG_FILE%"
)

echo [INFO] Project root: %ROOT_DIR%
echo [INFO] Admin password: admin123

set "SERVER_ALREADY_RUNNING="
set "PORT_READY="

for %%P in (8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010) do (
    set "PORT=%%P"
    call :SET_URLS
    echo [INFO] Checking port !PORT!...
    echo Checking port !PORT!... >> "%LOG_FILE%"
    %PYTHON_CMD% scripts\check_server.py --host %HOST% --port !PORT! --mode preflight >> "%LOG_FILE%" 2>&1
    set "CHECK_RESULT=!ERRORLEVEL!"
    if "!CHECK_RESULT!"=="1" (
        set "SERVER_ALREADY_RUNNING=1"
        set "PORT_READY=1"
        goto PORT_SELECTED
    )
    if "!CHECK_RESULT!"=="0" (
        set "PORT_READY=1"
        goto PORT_SELECTED
    )
    echo [INFO] Port !PORT! is busy or has an old server, trying next port...
)

:PORT_SELECTED
if not defined PORT_READY (
    echo.
    echo [ERROR] Could not find a usable port from 8000 to 8010.
    echo [ERROR] Close old ImageExhibition server windows, then run start-local.bat again.
    echo.
    type "%LOG_FILE%"
    echo.
    pause
    popd >nul
    exit /b 1
)

call :SET_URLS
echo [INFO] Server URL: http://%HOST%:%PORT%/
echo Selected port: %PORT% >> "%LOG_FILE%"

if "%DRY_RUN%"=="1" (
    echo [DRY_RUN] Would start: %PYTHON_CMD% scripts\local_server.py --host %HOST% --port %PORT%
    echo [DRY_RUN] Would open: %INDEX_URL%
    echo [DRY_RUN] Would open: %ADMIN_URL%
    popd >nul
    exit /b 0
)

start "ImageExhibition Server" cmd /k "%PYTHON_CMD% scripts\local_server.py --host %HOST% --port %PORT%"
echo [INFO] Server window opened. Waiting for service...
echo Server window opened. Waiting for service... >> "%LOG_FILE%"

set "VERIFY_OK="
for /l %%I in (1,1,20) do (
    timeout /t 1 /nobreak >nul
    %PYTHON_CMD% scripts\check_server.py --host %HOST% --port %PORT% --mode verify >> "%LOG_FILE%" 2>&1
    if not errorlevel 1 (
        set "VERIFY_OK=1"
        goto VERIFIED
    )
    echo [INFO] Waiting... %%I/20
)

:VERIFIED
if not defined VERIFY_OK (
    echo.
    echo [ERROR] Server did not become ready.
    echo [ERROR] Check the server window and log file:
    echo [ERROR] %LOG_FILE%
    echo.
    type "%LOG_FILE%"
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
echo [INFO] If the browser did not open, copy the Admin URL above.
echo.
echo [INFO] This launcher window can be closed. The server window must stay open.
timeout /t 8 /nobreak >nul

popd >nul
exit /b 0

:SET_URLS
set "INDEX_URL=http://%HOST%:%PORT%/index.html"
set "ADMIN_URL=http://%HOST%:%PORT%/admin.html"
exit /b 0
