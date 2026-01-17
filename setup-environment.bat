@echo off
setlocal enabledelayedexpansion
title Enterprise POS - Automated Setup

echo ===================================================
echo   Enterprise POS - One-Click Environment Setup
echo ===================================================
echo.

:: Check for Administrative Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run this script as Administrator.
    pause
    exit /b 1
)

:: 1. Install Prerequisites using Winget
echo [1/4] Checking/Installing Node.js and PostgreSQL...

where winget >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Winget not found. Please install manually:
    echo Node.js: https://nodejs.org/
    echo PostgreSQL: https://www.postgresql.org/
    pause
    exit /b 1
)

echo Installing Node.js (LTS)...
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements

echo Installing PostgreSQL 16...
winget install PostgreSQL.PostgreSQL --silent --accept-package-agreements --accept-source-agreements

echo.
echo [2/4] Database Configuration
echo ----------------------------
echo Please enter the password you want for your 'postgres' database.
echo IMPORTANT: If PostgreSQL was already installed, enter the existing password.
set /p DB_PASS="Enter Database Password: "

:: 3. Create .env files
echo.
echo [3/4] Generating Configuration Files...
cd backend

echo DATABASE_URL="postgresql://postgres:%DB_PASS%@localhost:5432/enterprise_pos?schema=public" > .env
echo JWT_SECRET="%RANDOM%%RANDOM%_enterprise_secure_key" >> .env
echo. >> .env
echo # Universal SMTP Fallback >> .env
echo EMAIL_HOST="smtp.gmail.com" >> .env
echo EMAIL_PORT=587 >> .env
echo EMAIL_USER="" >> .env
echo EMAIL_PASS="" >> .env

echo [BACKEND] .env created.

cd ../frontend
echo VITE_API_URL="http://localhost:3000" > .env
echo [FRONTEND] .env created.

cd ..

:: 4. Install NPM Dependencies & Build
echo.
echo [4/4] Installing Project Dependencies (This may take a few minutes)...
echo.
echo [BUILD] Processing Backend...
cd backend
call npm install
call npx prisma generate
call npx prisma db push
call npm run build
echo [BUILD] Processing Frontend...
cd ../frontend
call npm install
cd ..

echo.
echo ===================================================
echo   SETUP COMPLETE!
echo ===================================================
echo.
echo You can now use the 'start-silent.vbs' or 'start-servers.bat'
echo to run the system.
echo.
pause
