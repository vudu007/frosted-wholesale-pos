@echo off
title Stop Enterprise POS
echo ===================================================
echo   Stopping all Enterprise POS Background Processes
echo ===================================================
echo.

echo Terminating Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1

if %errorlevel% equ 0 (
    echo [SUCCESS] System stopped.
) else (
    echo [INFO] No active POS processes found.
)

echo.
pause
