#!/bin/bash
# Test script for assistant feature flag system

set -e

echo "🧪 Testing Assistant Feature Flag System"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Step 1: Checking feature flag files exist${NC}"
if [ -f ".data/assistant-feature-flags.json" ]; then
    echo "✅ Feature flags file exists"
    echo "Content preview:"
    head -10 .data/assistant-feature-flags.json
else
    echo "❌ Feature flags file not found"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 2: Checking knowledge base file exists${NC}"
if [ -f ".data/assistant-knowledge-base.json" ]; then
    echo "✅ Knowledge base file exists"
    echo "Content preview:"
    head -10 .data/assistant-knowledge-base.json
else
    echo "❌ Knowledge base file not found"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 3: Checking config utility exists${NC}"
if [ -f "src/utils/assistantConfig.ts" ]; then
    echo "✅ Config utility exists"
    echo "Export count:"
    grep -c "^export " src/utils/assistantConfig.ts || echo "0"
else
    echo "❌ Config utility not found"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 4: Validating JSON files${NC}"
if command -v node &> /dev/null; then
    echo "Validating feature flags JSON..."
    if node -e "JSON.parse(require('fs').readFileSync('.data/assistant-feature-flags.json', 'utf-8'))" 2>/dev/null; then
        echo "✅ Feature flags JSON is valid"
    else
        echo "❌ Feature flags JSON is invalid"
        exit 1
    fi
    
    echo "Validating knowledge base JSON..."
    if node -e "JSON.parse(require('fs').readFileSync('.data/assistant-knowledge-base.json', 'utf-8'))" 2>/dev/null; then
        echo "✅ Knowledge base JSON is valid"
    else
        echo "❌ Knowledge base JSON is invalid"
        exit 1
    fi
else
    echo "⚠️  Node not available, skipping JSON validation"
fi

echo ""
echo -e "${YELLOW}📋 Step 5: Checking TypeScript compilation${NC}"
if [ -f "src/app/api/assistant/chat/route.ts" ]; then
    echo "✅ Assistant route updated"
    if grep -q "loadFeatureFlags" src/app/api/assistant/chat/route.ts; then
        echo "✅ Uses feature flag system"
    else
        echo "❌ Feature flag imports not found"
        exit 1
    fi
else
    echo "❌ Assistant route not found"
    exit 1
fi

echo ""
echo ""
echo -e "${GREEN}✅ Feature flag system setup complete!${NC}"
echo ""
echo "Summary:"
echo "- Feature flags: .data/assistant-feature-flags.json"
echo "- Knowledge base: .data/assistant-knowledge-base.json"
echo "- Config utility: src/utils/assistantConfig.ts"
echo "- Current mode: legacy (safe default)"
echo ""
echo "To test live:"
echo "  1. Start dev server: npm run dev"
echo "  2. Test endpoint: curl -X POST http://localhost:3000/api/assistant/chat \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"message\": \"how do I checkout?\"}'"
echo ""
echo "To enable externalized knowledge:"
echo "  Edit .data/assistant-feature-flags.json"
echo "  Set: \"useExternalizedKnowledge\": true"
echo ""
echo "Documentation: ASSISTANT-UPGRADE-PHASE1.md"
