#!/bin/bash

# Test script for personalized recommendations

echo "🧪 Testing Personalized Recommendations GraphQL Endpoint"
echo "========================================================"
echo ""

# Start backend if not running
if ! lsof -ti:8000 > /dev/null 2>&1; then
    echo "🚀 Starting backend server..."
    cd /home/sarate/Dev/NextJs/my-ai-app/src/app/api/backend
    python3 app.py > /dev/null 2>&1 &
    BACKEND_PID=$!
    echo "⏳ Waiting for server to start..."
    sleep 5
else
    echo "✅ Backend already running"
fi

echo ""
echo "📊 Testing personalizedRecommendations query..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { personalizedRecommendations(userId: 1, limit: 5) { id name category price } }"}')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Test complete!"
