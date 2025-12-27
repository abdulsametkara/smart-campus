@echo off
echo ==========================================
echo    Smart Campus - Quick Deploy (Win)
echo ==========================================

echo [1/4] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo [2/4] Running Database Migrations...
call npm run db:migrate
if %errorlevel% neq 0 (
    echo Migration failed. Ensure Postgres is running and .env is configured.
    pause
    exit /b %errorlevel%
)

echo [3/4] Installing Frontend Dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo [4/4] Starting Services...
echo Starting Backend in a new window...
start "Smart Campus Backend" cmd /k "cd ../backend && npm start"

echo Starting Frontend in a new window...
start "Smart Campus Frontend" cmd /k "npm start"

echo ==========================================
echo Deployment started! Access at http://localhost:3000
echo ==========================================
pause
