@echo off
title Enterprise POS Launcher (Silent Mode)
color 0C

echo ===================================================
echo   Starting Enterprise POS System (Background)
echo ===================================================
echo.

:: Checking if the VBS exists
if exist "start-headless.vbs" (
    echo [INFO] Running servers in background mode...
    echo [INFO] No windows will be opened.
    wscript.exe "start-headless.vbs"
    
    echo.
    echo ---------------------------------------------------
    echo   System is now initializing in the background.
    echo   Access:
    echo   Frontend: http://localhost:5173
    echo   Backend:  http://localhost:3000
    echo ---------------------------------------------------
    echo.
    echo To stop the system, use Task Manager to end 'node' processes.
    echo.
) else (
    echo [ERROR] start-headless.vbs not found.
)

pause
