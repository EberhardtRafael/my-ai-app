#!/bin/bash

echo "🎫 Setting up AI Ticket Generator..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit .env.local and add your GitHub OAuth credentials"
    echo "   Visit: https://github.com/settings/developers"
    echo ""
fi

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd src/app/api/backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.local with your GitHub OAuth credentials"
echo "2. Start Python backend: cd src/app/api/backend && source venv/bin/activate && python app.py"
echo "3. Start Next.js frontend: yarn dev"
echo "4. Visit http://localhost:3000/tickets"
echo ""
echo "📖 Full setup guide: TICKET-GENERATOR-SETUP.md"
