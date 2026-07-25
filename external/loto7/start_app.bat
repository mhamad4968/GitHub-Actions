@echo off
REM Use ASCII only so cmd.exe does not mojibake (UTF-8 .bat breaks on Japanese Windows).
cd /d "%~dp0"
title LOTO7 AI ANALYZER

echo ==========================================
echo   LOTO7 AI ANALYZER v5.0
echo ==========================================
echo   If server already runs: browser opens, this window exits after pause.
echo   To stop server: close the FIRST black window, or press Ctrl+C there.
echo ==========================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python and add it to PATH.
    pause
    exit /b 1
)

python -u ai_server.py
set EXITCODE=%ERRORLEVEL%

REM Exit code 2 = another LOTO7 server is already running
if %EXITCODE%==2 (
    echo.
    echo [INFO] Server is already running. Close the first console window to stop it.
    echo [INFO] You may close this window after reading the message above.
    echo.
    pause
    exit /b 0
)

echo.
if %EXITCODE% neq 0 (
    echo [ERROR] Exit code %EXITCODE%
    echo Check Python error messages printed above.
)
if %EXITCODE%==0 echo [INFO] Server stopped.
echo.
pause
