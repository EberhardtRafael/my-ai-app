#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AI-Powered E-Commerce Platform - Quick Start${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo -e "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available. Please update Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker found${NC}"

# Check for .env.local file
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  No .env.local file found. Creating one with defaults...${NC}"
    cat > .env.local << EOF
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
EOF
    echo -e "${GREEN}✓ Created .env.local${NC}"
fi

echo -e "\n${BLUE}📦 Building and starting containers...${NC}"
docker compose up -d --build

echo -e "\n${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check if backend is ready
echo -e "${BLUE}🔍 Checking backend health...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/graphql > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start. Check logs with: docker compose logs backend${NC}"
        exit 1
    fi
    sleep 2
done

# Check if frontend is ready
echo -e "${BLUE}🔍 Checking frontend...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start. Check logs with: docker compose logs frontend${NC}"
        exit 1
    fi
    sleep 2
done

echo -e "\n${GREEN}✨ Success! Your AI-powered e-commerce platform is running!${NC}\n"
echo -e "${BLUE}📱 Application URLs:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   GraphQL API: ${GREEN}http://localhost:8000/graphql${NC}\n"

echo -e "${BLUE}👤 Demo Accounts:${NC}"
echo -e "   Email: ${GREEN}test@example.com${NC} | Password: ${GREEN}test${NC}"
echo -e "   Email: ${GREEN}john@example.com${NC} | Password: ${GREEN}password123${NC}"
echo -e "   Email: ${GREEN}jane@example.com${NC} | Password: ${GREEN}password123${NC}\n"

echo -e "${BLUE}🎯 Try These Features:${NC}"
echo -e "   1. Sign in and visit the ${YELLOW}\"For You\"${NC} section (personalized ML recommendations)"
echo -e "   2. Add items to cart → see ${YELLOW}\"You May Also Like\"${NC} (hybrid collaborative filtering)"
echo -e "   3. Leave a review → watch ${YELLOW}Bayesian quality adjustment${NC} in action"
echo -e "   4. Visit ${YELLOW}/tickets${NC} → generate AI-powered development tickets\n"

echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo -e "   View logs:    ${YELLOW}docker compose logs -f${NC}"
echo -e "   Stop:         ${YELLOW}docker compose down${NC}"
echo -e "   Restart:      ${YELLOW}docker compose restart${NC}"
echo -e "   Run tests:    ${YELLOW}docker compose exec frontend yarn test${NC}\n"

echo -e "${GREEN}🎉 Happy exploring!${NC}\n"
