@echo off
setlocal EnableExtensions
REM このファイルは app.py と同じ「personal-cashbook」フォルダ内に置いてください。
REM デスクトップのショートカットは、この bat へのリンクで構いません（bat 本体はフォルダ内のまま）。

cd /d "%~dp0"
if not exist "app.py" (
  echo [ERROR] app.py not found. Put this bat inside the personal-cashbook folder.
  pause
  exit /b 1
)

REM 現在の Windows フォルダを WSL のパスに変換（Desktop 以外に置いても動く）
for /f "delims=" %%i in ('wsl.exe wslpath -u "%CD%"') do set "UBUNTU_PATH=%%i"
if not defined UBUNTU_PATH (
  echo [ERROR] wslpath failed. Check: wsl.exe --status
  wsl.exe echo WSL_OK
  pause
  exit /b 1
)

echo WSL path: %UBUNTU_PATH%
echo Open http://localhost:8501 in your browser after Streamlit starts.
echo.

wsl.exe bash -lc "cd '%UBUNTU_PATH%' && source .venv/bin/activate && python -m streamlit run app.py"
set ERR=%ERRORLEVEL%

echo.
if not "%ERR%"=="0" echo [ERROR] exit code %ERR%
pause
