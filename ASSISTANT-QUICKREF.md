# Assistant Feature Flag Quick Reference

## Quick Commands

### Check Current Configuration
```bash
# View feature flags
cat .data/assistant-feature-flags.json

# View knowledge base version
head -5 .data/assistant-knowledge-base.json
```

### Enable Externalized Knowledge
```bash
# Edit the file and set:
"flags": {
  "useExternalizedKnowledge": true
}
```

### Switch Assistant Modes
```bash
# Legacy mode (default, safest)
"assistantMode": "legacy"

# Hybrid mode (enhanced + fallback)
"assistantMode": "hybrid"

# Enhanced mode (full enhancement)
"assistantMode": "enhanced"
```

### Adjust Confidence Threshold
```bash
# More aggressive (fewer fallbacks)
"confidenceThreshold": 0.55

# More conservative (more fallbacks)
"confidenceThreshold": 0.75

# Default
"confidenceThreshold": 0.65
```

## Testing

### Run Setup Tests
```bash
./test-assistant-flags.sh
```

### Test Live Endpoint
```bash
# Start dev server
npm run dev

# Test checkout help
curl -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "how do I checkout?"}'

# Check metadata
curl -s -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "help"}' | \
  grep -A 5 '"metadata"'
```

## Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| Feature Flags | Control assistant modes | `.data/assistant-feature-flags.json` |
| Knowledge Base | Help content & intents | `.data/assistant-knowledge-base.json` |
| Config Utility | Type-safe access | `src/utils/assistantConfig.ts` |
| Assistant Route | Main handler | `src/app/api/assistant/chat/route.ts` |

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `assistantMode` | `"legacy"` | Mode: `legacy` / `hybrid` / `enhanced` |
| `enableHybridMode` | `false` | Allow mixing modes |
| `enableLegacyFallback` | `true` | Fall back on low confidence |
| `confidenceThreshold` | `0.65` | Threshold for fallback |
| `enableKnowledgeRetrieval` | `false` | Use knowledge base |
| `flags.useExternalizedKnowledge` | `false` | Use KB for help |

## Response Metadata

Every response includes:

```json
{
  "metadata": {
    "assistantMode": "legacy",
    "usedLegacyFallback": false,
    "usedExternalizedKnowledge": false,
    "featureFlagsVersion": "1.0.0"
  }
}
```

## Common Workflows

### Gradual Rollout
1. Start: `assistantMode: "legacy"`, all flags `false`
2. Enable KB: Set `useExternalizedKnowledge: true`
3. Test and monitor
4. Enable hybrid: Set `assistantMode: "hybrid"`
5. Adjust threshold based on metrics
6. Full enhanced: Set `assistantMode: "enhanced"`

### Instant Rollback
```bash
# Disable all enhancements
# Edit .data/assistant-feature-flags.json:
{
  "assistantMode": "legacy",
  "flags": {
    "useExternalizedKnowledge": false
  }
}
```

### Update Help Content
```bash
# Edit .data/assistant-knowledge-base.json
# Add/modify entries in "siteHelp"
# No code deploy needed!
```

### Add New Intent
```bash
# Edit .data/assistant-knowledge-base.json
# Add entry in "intents" with examples
# Intent classification automatically uses it
```

## Monitoring

### Check Which Mode Was Used
```javascript
// In response
const mode = response.metadata.assistantMode;
const usedKB = response.metadata.usedExternalizedKnowledge;
const fellBack = response.metadata.usedLegacyFallback;
```

### Track Fallback Rate
```bash
# If you see too many fallbacks:
# - Lower confidence threshold
# - Improve KB quality
# - Add more intent examples
```

## Troubleshooting

### Problem: All requests use legacy mode
**Solution**: Check feature flags enabled:
```bash
cat .data/assistant-feature-flags.json | grep useExternalizedKnowledge
```

### Problem: High fallback rate
**Solution**: Lower confidence threshold:
```bash
# Edit flags: "confidenceThreshold": 0.55
```

### Problem: KB not loading
**Solution**: Validate JSON:
```bash
node -e "JSON.parse(require('fs').readFileSync('.data/assistant-knowledge-base.json'))"
```

### Problem: Need to reload config
**Solution**: Restart dev server (caching is at module level):
```bash
# Kill dev server and restart
npm run dev
```

## File Structure

```
.data/
├── assistant-feature-flags.json    # Feature flag config
├── assistant-knowledge-base.json   # Knowledge base
└── role-overrides.json             # (existing)

src/
├── utils/
│   └── assistantConfig.ts          # Config loader
└── app/
    └── api/
        └── assistant/
            └── chat/
                └── route.ts        # Updated with flags

test-assistant-flags.sh              # Test script
ASSISTANT-UPGRADE-PHASE1.md          # Full documentation
ASSISTANT-QUICKREF.md                # This file
```

## Next Steps

See [ASSISTANT-UPGRADE-PHASE1.md](ASSISTANT-UPGRADE-PHASE1.md) for:
- Detailed implementation notes
- Rollout strategy
- Future enhancement plans
- Complete API documentation
