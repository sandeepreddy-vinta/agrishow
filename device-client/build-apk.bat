@echo off
echo ========================================
echo FranchiseOS Player - APK Builder
echo ========================================
echo.

echo Building Debug APK...
echo.

call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo APK Location:
    echo app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo You can now install this APK on your Android device!
    echo.
) else (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause
