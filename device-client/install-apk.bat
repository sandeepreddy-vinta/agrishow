@echo off
echo ========================================
echo FranchiseOS Player - Install APK
echo ========================================
echo.

set APK_PATH=app\build\outputs\apk\debug\app-debug.apk

if not exist "%APK_PATH%" (
    echo ERROR: APK not found!
    echo Please run setup-and-build.bat first.
    echo.
    pause
    exit /b 1
)

echo APK found: %APK_PATH%
echo.

:: Check if adb is available
where adb >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ADB not found in PATH.
    echo.
    echo Options to install APK:
    echo.
    echo OPTION 1: Copy APK to phone manually
    echo   - Connect phone via USB
    echo   - Copy this file to your phone: 
    echo     %cd%\%APK_PATH%
    echo   - Open file manager on phone and tap the APK to install
    echo   - Enable "Install from unknown sources" if prompted
    echo.
    echo OPTION 2: Install ADB
    echo   - Download from: https://developer.android.com/studio/releases/platform-tools
    echo   - Extract and add to PATH
    echo   - Run this script again
    echo.
    echo OPTION 3: Use Android Studio (if installed)
    echo   - ADB is at: %LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe
    echo.
    pause
    exit /b 1
)

echo ADB found! Checking for connected devices...
echo.

adb devices

echo.
echo Installing APK...
echo.

adb install -r "%APK_PATH%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo INSTALLATION SUCCESSFUL!
    echo ========================================
    echo.
    echo The app "FranchiseOS Player" is now installed on your device.
    echo.
    echo Starting app...
    adb shell am start -n com.franchiseos.player/.ui.SetupActivity
    echo.
) else (
    echo.
    echo Installation failed. Please check:
    echo 1. USB debugging is enabled on phone
    echo 2. Phone is connected via USB
    echo 3. You authorized the computer on your phone
    echo.
)

pause
