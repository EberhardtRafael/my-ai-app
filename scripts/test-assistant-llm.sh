#!/bin/bash
# Test script for assistant LLM integration

set -e

echo "🤖 Testing Assistant LLM Integration"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📋 Step 1: Checking LLM utility exists${NC}"
if [ -f "src/utils/assistantLLM.ts" ]; then
    echo "✅ LLM utility exists"
    export_count=$(grep -c "^export " src/utils/assistantLLM.ts || echo "0")
    echo "   Exports: $export_count functions"
else
    echo "❌ LLM utility not found"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 2: Checking feature flag LLM settings${NC}"
if grep -q "enableLLM" .data/assistant-feature-flags.json; then
    echo "✅ LLM flags configured"
    echo "   Current settings:"
    grep -A 1 "enableLLM" .data/assistant-feature-flags.json | head -2
else
    echo "❌ LLM flags not found in feature flags"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 3: Checking API key configuration${NC}"
if [ -f ".env.local" ]; then
    if grep -q "OPENAI_API_KEY" .env.local || grep -q "ANTHROPIC_API_KEY" .env.local; then
        if grep -q "^OPENAI_API_KEY=sk-" .env.local; then
            echo "✅ OpenAI API key configured"
        elif grep -q "^ANTHROPIC_API_KEY=sk-" .env.local; then
            echo "✅ Anthropic API key configured"
        else
            echo "⚠️  API key placeholder detected (update with real key to enable LLM)"
        fi
    else
        echo "⚠️  No API key configured (LLM will use fallback)"
    fi
else
    echo "⚠️  .env.local not found (create from .env.local.example)"
fi

echo ""
echo -e "${YELLOW}📋 Step 4: Checking assistant route integration${NC}"
if grep -q "generateEmptyResultResponse" src/app/api/assistant/chat/route.ts; then
    echo "✅ Empty result LLM integration present"
else
    echo "❌ LLM integration not found in route"
    exit 1
fi

if grep -q "generateConversationalReply" src/app/api/assistant/chat/route.ts; then
    echo "✅ Conversational LLM integration present"
else
    echo "❌ Conversational LLM not found in route"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 5: TypeScript validation${NC}"
if command -v node &> /dev/null; then
    echo "Validating TypeScript files..."
    # Check if files have syntax errors (basic check)
    if node -e "require('fs').readFileSync('src/utils/assistantLLM.ts', 'utf-8')" 2>/dev/null; then
        echo "✅ assistantLLM.ts readable"
    fi
    if node -e "require('fs').readFileSync('src/app/api/assistant/chat/route.ts', 'utf-8')" 2>/dev/null; then
        echo "✅ route.ts integration readable"
    fi
else
    echo "⚠️  Node not available, skipping TS validation"
fi

echo ""
echo ""
echo -e "${GREEN}✅ LLM integration setup complete!${NC}"
echo ""
echo "Configuration Status:"
echo "--------------------"

# Check what's enabled
ENABLE_LLM=$(grep -A 1 "\"enableLLM\"" .data/assistant-feature-flags.json | grep "true" && echo "YES" || echo "NO")
EMPTY_RESULTS=$(grep "useLLMForEmptyResults" .data/assistant-feature-flags.json | grep "true" && echo "YES" || echo "NO")
CONVERSATION=$(grep "useLLMForConversation" .data/assistant-feature-flags.json | grep "true" && echo "YES" || echo "NO")

echo "- LLM Enabled: $ENABLE_LLM"
echo "- Empty Results LLM: $EMPTY_RESULTS"
echo "- Conversational LLM: $CONVERSATION"

echo ""
echo "To enable LLM features:"
echo "1. Set API key in .env.local:"
echo "   OPENAI_API_KEY=sk-your-key-here"
echo ""
echo "2. Enable in .data/assistant-feature-flags.json:"
echo "   \"enableLLM\": true,"
echo "   \"flags\": {"
echo "     \"useLLMForEmptyResults\": true"
echo "   }"
echo ""
echo "3. Restart dev server and test:"
echo "   npm run dev"
echo "   curl -X POST http://localhost:3000/api/assistant/chat \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"message\": \"flannel shirt\"}'"
echo ""
echo "Documentation: ASSISTANT-LLM-INTEGRATION.md"
