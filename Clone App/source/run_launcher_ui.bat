@echo off
setlocal enabledelayedexpansion

REM Go to repo root (this file's directory)
cd /d "%~dp0"

REM Ensure UI dependencies exist before launching
if not exist ".\ui\node_modules" (
    echo [setup] Dang cai dependency cho UI...
    pushd ".\ui"
    npm install
    if errorlevel 1 (
        echo [error] npm install that bai. Kiem tra Node.js/NPM roi chay lai.
        popd
        exit /b 1
    )
    popd
)

REM Run the Electron UI
pushd ".\ui"
echo [info] Dang mo giao dien run-as. Tam tat cua Electron se hien len trong vai giay...
npm start
set "exit_code=%errorlevel%"
popd

endlocal & exit /b %exit_code%
