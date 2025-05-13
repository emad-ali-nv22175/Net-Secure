#!/bin/bash

# Print colored status messages
print_status() {
    echo -e "\e[1;34m>>> $1\e[0m"
}

# Function to check if a port is in use and kill the process
check_and_kill_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        print_status "Killing process on port $1..."
        lsof -ti:$1 | xargs kill -9
    fi
}

# Clean up ports
check_and_kill_port 3000  # Frontend port
check_and_kill_port 3001  # Backend port

# Start frontend development server first
print_status "Starting frontend development server..."
cd Net-Secure
npm install --legacy-peer-deps
npm audit fix --force
npm run dev &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 5

# Start backend server
print_status "Starting backend server..."
cd ../cipherx-backend
npm install
npm start &
BACKEND_PID=$!

# Handle script termination
trap 'kill $FRONTEND_PID $BACKEND_PID 2>/dev/null' EXIT

# Keep script running and show status
print_status "Development servers are running..."
print_status "Frontend: http://localhost:3000"
print_status "Backend:  http://localhost:3001"
print_status "Press Ctrl+C to stop both servers"

# Wait for user interrupt
wait