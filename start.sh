#!/bin/bash

echo "========================================"
echo "   ReliefRoute - Starting Application"
echo "========================================"
echo

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    echo "Backend virtual environment found."
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
else
    echo "Frontend dependencies found."
fi

echo
echo "Starting Backend Server..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo "Starting Frontend Server..."
sleep 2
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo
echo "========================================"
echo "   ReliefRoute is starting up!"
echo "========================================"
echo
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo
echo "   Demo Accounts:"
echo "   - admin@reliefroute.org / admin123"
echo "   - coordinator@reliefroute.org / coord123"
echo
echo "   Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait


# touch update 11/29/2025 12:45:26
