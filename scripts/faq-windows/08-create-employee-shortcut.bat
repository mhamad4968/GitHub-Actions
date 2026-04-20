@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist public-portal-url.txt (
    echo [初回] public-portal-url.txt を作成します ^(社員が開く http(s)://... を1行^)
    copy /Y public-portal-url.example.txt public-portal-url.txt >nul
    notepad public-portal-url.txt
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-employee-shortcut.ps1"
if errorlevel 1 (
    pause
    exit /b 1
)
echo.
echo 配布用\経理FAQポータル.url を社員に配布してください。
pause
