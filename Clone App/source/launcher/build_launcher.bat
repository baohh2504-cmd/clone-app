@echo off
echo ========================================
echo   Building runas_launcher.exe
echo ========================================
echo.

REM Chuyển vào thư mục launcher
cd /d "%~dp0"

REM Kiểm tra PyInstaller
pyinstaller --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PyInstaller chưa được cài đặt!
    echo Chạy: pip install pyinstaller
    pause
    exit /b 1
)

echo [1/3] Cleaning previous build...
rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul
del runas_launcher.spec 2>nul

echo [2/3] Building EXE with PyInstaller...
pyinstaller --onefile --noconsole --clean ^
    --name "runas_launcher" ^
    --icon "../ui/assets/icon.ico" ^
    runas_launcher.py

if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Verifying output...
if exist "dist\runas_launcher.exe" (
    echo ========================================
    echo   BUILD SUCCESS!
    echo   Output: dist\runas_launcher.exe
    echo ========================================
    dir dist\runas_launcher.exe
) else (
    echo [ERROR] EXE not found in dist/
    pause
    exit /b 1
)

echo.
echo Testing EXE...
dist\runas_launcher.exe --help
echo.
pause
