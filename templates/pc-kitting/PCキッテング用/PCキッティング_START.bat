@echo off
rem PCキッティング — PCキッテング用 フォルダ内から起動（UTF-8 BOM + chcp 65001）
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

set "KITDIR=%~dp0PCキッティング"
set "PSMAIN=%KITDIR%\kitting-main.ps1"

if not exist "%PSMAIN%" (
    echo [ERROR] Script not found:
    echo   %PSMAIN%
    pause
    exit /b 1
)

rem Admin check
net session >nul 2>&1
if errorlevel 1 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -Sta -File "%PSMAIN%" -Mode Full
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" (
    echo.
    echo Exit code: %EC%
    echo Log: %ProgramData%\JBIS-PC-Kitting\logs\
    pause
)
exit /b %EC%
