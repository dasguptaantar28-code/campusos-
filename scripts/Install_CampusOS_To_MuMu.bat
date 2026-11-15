@echo off
title CampusOS - Install to MuMu Player
echo =======================================================================
echo                  CampusOS Mobile - MuMu Player Installer
echo =======================================================================
echo.

set ADB="C:\Users\This PC\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set MUMU_ADB="D:\Program Files\Netease\MuMuPlayer\nx_device\15.0\shell\adb.exe"
set APK="%~dp0..\apps\mobile-android\CampusOS-debug.apk"

if not exist %APK% (
    set APK="%~dp0..\apps\mobile-android\app\build\outputs\apk\debug\app-debug.apk"
)

if not exist %APK% (
    echo [ERROR] CampusOS-debug.apk not found! Run gradlew assembleDebug first.
    pause
    exit /b 1
)

echo [1/3] Connecting to MuMu Player emulator...
%ADB% connect 127.0.0.1:16384 >nul 2>&1
%ADB% connect 127.0.0.1:7555 >nul 2>&1
%ADB% devices

echo [2/3] Installing CampusOS-debug.apk to MuMu Player...
%ADB% install -r -g %APK%
if %ERRORLEVEL% NEQ 0 (
    echo Retrying with MuMu native ADB...
    %MUMU_ADB% connect 127.0.0.1:16384 >nul 2>&1
    %MUMU_ADB% install -r -g %APK%
)

echo [3/3] Launching CampusOS on MuMu Player...
%ADB% shell am start -n com.campusos.app/.MainActivity
echo.
echo Done!
pause
