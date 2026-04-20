@echo off
chcp 65001 >nul
cd /d "%~dp0..\faq-kintone-proxy"
where npm >nul 2>&1
if errorlevel 1 (
    echo [エラー] npm が PATH にありません。Node.js LTS をインストールしてください。
    pause
    exit /b 1
)
call npm install
if errorlevel 1 (
    pause
    exit /b 1
)
echo [OK] faq-kintone-proxy の npm install が完了しました。
pause
