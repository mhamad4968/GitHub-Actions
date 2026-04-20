@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0..\faq-kintone-proxy"
if exist .env (
    echo [.env は既にあります] 上書きしません。編集する場合はメモ帳で開いてください。
    notepad .env
    exit /b 0
)
copy /Y .env.example .env >nul
echo [.env を作成しました] 次を編集してください:
echo   KINTONE_DOMAIN  KINTONE_FAQ_APP_ID^(640^)  KINTONE_API_TOKEN
echo   CORS_ORIGINS ^(HTML を開く URL。例: http://ファイルサーバ名:3080^)
echo   BIND_HOST ^(他PCから使うなら 0.0.0.0^)
notepad .env
endlocal
