@echo off
:: This script checks for prerequisites and launches the servers silently.

echo Starting Servers in Silent Mode...
if exist "start-headless.vbs" (
    wscript.exe "start-headless.vbs"
    echo Success: Servers are starting in the background.
    echo Frontend: http://localhost:5173
    echo Backend:  http://localhost:3000
) else (
    echo Error: start-headless.vbs not found.
)

timeout /t 3 >nul
exit