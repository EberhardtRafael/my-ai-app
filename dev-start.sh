#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting AI-Powered E-Commerce Platform (Development Mode)${NC}\n"

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 is not installed.${NC}"
    exit 1
fi

# Check if Node/Yarn is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed.${NC}"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}⚠️  Yarn not found. Installing...${NC}"
    npm install -g yarn
fi

# Check for .env.local
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  Creating .env.local file...${NC}"
    cat > .env.local << EOF
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
EOF
    echo -e "${GREEN}✓ Created .env.local${NC}"
fi

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    yarn install
fi

# Setup backend
cd src/app/api/backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${BLUE}🐍 Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate

if [ ! -f "venv/installed" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    pip install -r requirements.txt
    touch venv/installed
fi

# Initialize database if it doesn't exist
if [ ! -f "products.db" ]; then
    echo -e "${BLUE}🗄️  Initializing database with seed data...${NC}"
    python3 seed.py
fi

cd ../../../..

echo -e "\n${GREEN}✨ Setup complete!${NC}\n"
echo -e "${BLUE}Starting servers...${NC}"
echo -e "${YELLOW}Note: This will open two terminal processes.${NC}\n"

# Kill any existing processes on ports 3000 and 8000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start backend in background
echo -e "${BLUE}🔧 Starting backend on http://localhost:8000${NC}"
cd src/app/api/backend
source venv/bin/activate
nohup python3 app.py > ../../../backend.log 2>&1 &
BACKEND_PID=$!
cd ../../../..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend failed to start. Check backend.log for details.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Start frontend
echo -e "${BLUE}🎨 Starting frontend on http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓ Servers stopped${NC}"
    exit 0
}

trap cleanup INT TERM

yarn dev &
FRONTEND_PID=$!

# Wait for frontend process
wait $FRONTEND_PID

cleanup
