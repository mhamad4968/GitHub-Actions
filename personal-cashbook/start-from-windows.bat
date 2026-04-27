@echo off
setlocal EnableExtensions
REM Keep this file ASCII-only. UTF-8 Japanese breaks cmd.exe on Japanese Windows.

cd /d "%~dp0"
if not exist "app.py" (
  echo ERROR: app.py not found. Put this bat in the same folder as app.py.
  pause
  exit /b 1
)

REM Convert this folder to a WSL path (trailing ".\" avoids wslpath edge cases)
for /f "delims=" %%i in ('wsl.exe wslpath -u "%~dp0."') do set "UBUNTU_PATH=%%i"
if not defined UBUNTU_PATH (
  echo ERROR: wslpath failed. Try: wsl.exe wslpath -u "%~dp0."
  pause
  exit /b 1
)

echo WSL path: %UBUNTU_PATH%
echo Browser: http://localhost:8501
echo.

wsl.exe bash -lc "cd '%UBUNTU_PATH%' && source .venv/bin/activate && python -m streamlit run app.py"
echo exit=%ERRORLEVEL%
pause
