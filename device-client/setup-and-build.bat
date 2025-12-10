@echo off
echo ========================================
echo FranchiseOS Player - Setup and Build
echo ========================================
echo.

:: Check if JAVA_HOME is set
if "%JAVA_HOME%"=="" (
    echo ERROR: JAVA_HOME is not set!
    echo Please install JDK 17 and set JAVA_HOME environment variable.
    echo Download from: https://adoptium.net/
    echo.
    pause
    exit /b 1
)

echo JAVA_HOME: %JAVA_HOME%
echo.

:: Check if gradle wrapper jar exists
if not exist "gradle\wrapper\gradle-wrapper.jar" (
    echo Gradle wrapper not found. Downloading...
    echo.
    
    :: Create gradle wrapper directory
    if not exist "gradle\wrapper" mkdir "gradle\wrapper"
    
    :: Download gradle-wrapper.jar using PowerShell
    powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/gradle/gradle/v8.2.0/gradle/wrapper/gradle-wrapper.jar' -OutFile 'gradle\wrapper\gradle-wrapper.jar'}"
    
    if not exist "gradle\wrapper\gradle-wrapper.jar" (
        echo Failed to download gradle-wrapper.jar
        echo Please download manually from:
        echo https://github.com/gradle/gradle/raw/v8.2.0/gradle/wrapper/gradle-wrapper.jar
        echo And place it in: gradle\wrapper\gradle-wrapper.jar
        pause
        exit /b 1
    )
    
    echo Gradle wrapper downloaded successfully!
    echo.
)

echo Building Debug APK...
echo This may take 5-10 minutes on first run...
echo.

call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo APK Location:
    echo %cd%\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo To install on your device:
    echo 1. Connect your phone via USB
    echo 2. Enable USB debugging on phone
    echo 3. Run: adb install app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Or copy the APK to your phone and install manually.
    echo.
) else (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    echo.
    echo Common fixes:
    echo 1. Make sure JAVA_HOME points to JDK 17
    echo 2. Check internet connection
    echo 3. Try running again
    echo.
)

pause
