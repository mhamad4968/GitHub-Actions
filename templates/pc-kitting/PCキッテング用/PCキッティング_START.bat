@echo off
rem JBIS PC kitting launcher (ASCII-only .bat for cmd.exe)
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "PSRUN="

for /d %%D in ("%ROOT%*") do (
    if exist "%%~fD\kitting-run.ps1" set "PSRUN=%%~fD\kitting-run.ps1"
)

if not defined PSRUN (
    echo [ERROR] Script not found: kitting-run.ps1
    echo   Looked under: %ROOT%
    echo   Expected: one subfolder containing kitting-run.ps1
    echo   Fix: copy templates\pc-kitting\PCキッテング用 from repo to Desktop
    pause
    exit /b 1
)

net session >nul 2>&1
if errorlevel 1 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -Sta -File "%PSRUN%" -Mode Full
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" (
    echo.
    echo Exit code: %EC%
    echo Log: %ProgramData%\JBIS-PC-Kitting\logs\
    pause
)
exit /b %EC%
