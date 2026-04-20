@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist deploy-share-path.txt (
    echo [初回] deploy-share-path.txt を作成します ^(例: \\192.168.1.250\インストールソフト\その他\keiri-faq^)
    copy /Y deploy-share-path.example.txt deploy-share-path.txt >nul
    notepad deploy-share-path.txt
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0copy-to-share.ps1"
if errorlevel 1 (
    echo.
    echo ・共有に書き込み権限があるか、VPN に接続しているか確認してください。
    pause
    exit /b 1
)
pause
