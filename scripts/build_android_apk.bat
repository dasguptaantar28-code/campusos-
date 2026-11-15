@echo off
setlocal
set FLUTTER_BIN=D:\flutter\bin\flutter.bat
if not exist "%FLUTTER_BIN%" set FLUTTER_BIN=flutter

cd /d "%~dp0..\apps\mobile"
echo [CampusOS] Fetching Flutter packages...
call "%FLUTTER_BIN%" pub get
if errorlevel 1 exit /b 1

echo [CampusOS] Building Android Debug APK...
if "%SUPABASE_URL%"=="" (
  call "%FLUTTER_BIN%" build apk --debug
) else (
  call "%FLUTTER_BIN%" build apk --debug --dart-define=SUPABASE_URL=%SUPABASE_URL% --dart-define=SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
)
if errorlevel 1 exit /b 1

echo [CampusOS] Debug APK built at apps\mobile\build\app\outputs\flutter-apk\app-debug.apk
endlocal
