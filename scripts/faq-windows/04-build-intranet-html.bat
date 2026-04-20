@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
if not exist proxy-url.txt (
    copy /Y proxy-url.txt.example proxy-url.txt >nul
    echo [作成] proxy-url.txt を作りました。プロキシの URL を1行で編集してください。
    notepad proxy-url.txt
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0inject-faq-api-base.ps1"
if errorlevel 1 (
    echo [失敗] 上記エラーを確認してください。
    pause
    exit /b 1
)
echo.
echo 次: 05-start-html-server.bat で静的配信し、06-open-portal.bat でブラウザを開きます。
pause
endlocal
