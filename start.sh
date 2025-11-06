#!/bin/bash

# Media Categorizer Startup Script

echo "🎬 Starting Media Categorizer..."

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Please edit .env and set MEDIA_DIRECTORY to your media folder path"
    else
        echo "MEDIA_DIRECTORY=/path/to/your/media" > .env
        echo "Please edit .env and set MEDIA_DIRECTORY to your media folder path"
    fi
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "⚠️  uv not found. Using pip instead..."
    USE_UV=false
else
    USE_UV=true
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    if [ "$USE_UV" = true ]; then
        uv venv
    else
        python3 -m venv venv
    fi
fi

# Activate virtual environment
source venv/bin/activate

# Install backend dependencies
echo "📦 Installing backend dependencies..."
if [ "$USE_UV" = true ]; then
    uv pip install -r requirements.txt
else
    pip install -q -r requirements.txt
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start backend in background
echo "🚀 Starting backend server..."
python -m uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Media Categorizer is running!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle shutdown
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for processes
wait
