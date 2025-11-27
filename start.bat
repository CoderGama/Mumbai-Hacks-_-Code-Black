@echo off
echo ========================================
echo    ReliefRoute - Starting Application
echo ========================================
echo.

:: Check if backend venv exists
if not exist "backend\venv" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
) else (
    echo Backend virtual environment found.
)

:: Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo Frontend dependencies found.
)

echo.
echo Starting Backend Server...
start "ReliefRoute Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo Starting Frontend Server...
timeout /t 3 /nobreak > nul
start "ReliefRoute Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo    ReliefRoute is starting up!
echo ========================================
echo.
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo    Demo Accounts:
echo    - admin@reliefroute.org / admin123
echo    - coordinator@reliefroute.org / coord123
echo.

timeout /t 5 /nobreak > nul
start http://localhost:3000

