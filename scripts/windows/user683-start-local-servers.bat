@echo off
setlocal EnableExtensions
REM リポルート（package.json があるフォルダ）を決める:
REM   1) 環境変数 KINTONE_AI_LAB_ROOT
REM   2) この bat が kintone-ai-lab\scripts\windows\ にあるときの ../../
REM   3) カレントディレクトリ（デスクトップのコピーから使うなら、先に cd でリポへ移動）
set "REPO="
if defined KINTONE_AI_LAB_ROOT if exist "%KINTONE_AI_LAB_ROOT%\package.json" set "REPO=%KINTONE_AI_LAB_ROOT%"
if not defined REPO if exist "%~dp0..\..\package.json" set "REPO=%~dp0..\.."
if not defined REPO if exist "%CD%\package.json" set "REPO=%CD%"

if not defined REPO (
  echo [user683] package.json が見つかりません（リポルートを特定できません）。
  echo.
  echo 【推奨】PowerShell でリポのルートへ移動してから:
  echo   cd あなたのパス\kintone-ai-lab
  echo   npm run user683:local-servers
  echo.
  echo 【または】ユーザー環境変数 KINTONE_AI_LAB_ROOT にリポのフルパスを設定してから、この bat を再実行
  echo   setx KINTONE_AI_LAB_ROOT "C:\Users\...\kintone-ai-lab"
  echo.
  echo 【デスクトップに bat を置く場合】ショートカットの「作業フォルダ」を kintone-ai-lab にするか、上記の cd を先に実行してください。
  endlocal
  exit /b 1
)

pushd "%REPO%"
if not exist "package.json" (
  echo [user683] package.json not found in: %CD%
  popd
  endlocal
  exit /b 1
)

echo [user683] REPO=%CD%
echo [user683] 別ウィンドウで起動: Claude 中継 ^(既定 17884^) + 月次 PDF 配信 ^(既定 17886^)
echo [user683] 各ウィンドウを閉じるとそのサーバのみ停止します。
start "user683 Claude relay" /D "%CD%" cmd /k npm run user683:claude-relay
start "user683 monthly PDF serve" /D "%CD%" cmd /k npm run user683:monthly-pdf:serve

timeout /t 2 /nobreak >nul
echo.
echo --- kintone 683 で「Claude 中継 URL 未設定」のとき、次をコンソールへ貼り付け ---
call npm run user683:claude-browser-url:print
echo.
popd
endlocal
