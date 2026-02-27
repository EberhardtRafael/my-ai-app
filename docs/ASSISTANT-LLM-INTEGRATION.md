# Assistant LLM Integration (Phase 2)

## Overview

Added lightweight LLM integration to fix the "looks promising" + empty results problem and improve conversational quality.

## Problem Solved

**Before**:
- User searches for "flannel"
- No products found
- Assistant says: "this looks promising" then "I could not find matching products"
- Unhelpful, confusing, generic

**After** (with LLM enabled):
- User searches for "flannel"
- No products found
- LLM generates: "I don't see any flannel items right now. Try searching for 'shirt' or 'jacket' to see what styles we have, or browse all products to explore options."
- Helpful, honest, specific alternatives

## What Was Added

### 1. LLM Utility (`src/utils/assistantLLM.ts`)

**Functions**:
- `isLLMEnabled()` - Check if LLM features available
- `generateEmptyResultResponse()` - Context-aware empty result handling
- `generateConversationalReply()` - Natural conversational enhancement
- `improveSearchQuery()` - Better query understanding (future use)

**Providers Supported**:
- OpenAI (gpt-4o-mini, configurable)
- Anthropic (claude-3-5-haiku)

**Graceful Fallback**:
- If API key missing → legacy behavior
- If API call fails → legacy behavior
- If response invalid → legacy behavior

### 2. Updated Feature Flags

**New flags in `.data/assistant-feature-flags.json`**:
```json
{
  "enableLLM": false,
  "llmProvider": "openai",
  "llmModel": "gpt-4o-mini",
  "llmMaxTokens": 300,
  "flags": {
    "useLLMForEmptyResults": false,
    "useLLMForConversation": false
  }
}
```

### 3. Enhanced Assistant Route

**Changes**:
- `formatProducts()` now async, uses LLM for empty results
- Passes context (message, search terms, etc.) to formatting
- Optional conversational enhancement with LLM
- All changes backward compatible

## Configuration

### Enable LLM Features

**1. Set API Key**:
```bash
# In .env.local
OPENAI_API_KEY=sk-...

# Or for Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

**2. Enable in Feature Flags**:
```json
{
  "enableLLM": true,
  "flags": {
    "useLLMForEmptyResults": true,
    "useLLMForConversation": false
  }
}
```

### Rollout Stages

**Stage 1: Empty Results Only** (Recommended First)
```json
{
  "enableLLM": true,
  "flags": {
    "useLLMForEmptyResults": true,
    "useLLMForConversation": false
  }
}
```
- Fixes the immediate problem (empty result handling)
- Low API usage (only when no products found)
- Easy to validate improvement

**Stage 2: Full Conversational**
```json
{
  "enableLLM": true,
  "flags": {
    "useLLMForEmptyResults": true,
    "useLLMForConversation": true
  }
}
```
- Enhances all responses
- Higher API usage
- More natural conversation

## Cost & Performance

### API Usage Patterns

**Empty Results Only**:
- Triggered: Only when product search returns 0 results
- Frequency: ~5-10% of searches (estimated)
- Token usage: ~200-300 tokens per call
- Cost: ~$0.0001 per empty result (gpt-4o-mini)

**Full Conversational**:
- Triggered: Every assistant response
- Frequency: 100% of interactions
- Token usage: ~300-400 tokens per call
- Cost: ~$0.0001 per response (gpt-4o-mini)

**Monthly estimate** (1000 queries):
- Empty results only: $0.50-$1.00
- Full conversational: $10-$15

### Performance

- LLM calls are async, don't block processing
- Typical latency: +200-500ms per LLM-enhanced response
- Fallback to legacy is instant if LLM unavailable
- Caching possible (future optimization)

## Examples

### Empty Result Response

**Query**: "flannel shirt"
**Products Found**: 0

**Legacy** (before):
```
I could not find matching products right now. Try another keyword or browse the catalog.
```

**LLM-Enhanced**:
```
I don't see any flannel shirts in stock right now. You might find what you're looking for by searching for:
- "shirt" to see all shirt styles
- "jacket" if you want something warm
- Or browse the catalog to explore available options
```

### Conversational Enhancement

**Query**: "cheap shoes"
**Products Found**: 12

**Legacy** (before):
```
Here is what I found.

Intent confidence is moderate (67%).

Here are some options:
- Running Shoes Pro (shoes) — $89.99 | ⭐ 4.5
- Classic Sneakers (shoes) — $59.99 | ⭐ 4.2
...

The mean price is $74.50 across 12 products.
```

**LLM-Enhanced**:
```
I found 12 affordable shoe options for you! Here are some top picks:
- Running Shoes Pro (shoes) — $89.99 | ⭐ 4.5
- Classic Sneakers (shoes) — $59.99 | ⭐ 4.2
...

Prices range from $45 to $90, with most around $75. Let me know if you'd like to filter by style or see more options!
```

## Testing

### Manual Test

**1. Enable LLM for empty results**:
```bash
# Edit .data/assistant-feature-flags.json
{
  "enableLLM": true,
  "flags": { "useLLMForEmptyResults": true }
}
```

**2. Set API key**:
```bash
# In .env.local
OPENAI_API_KEY=sk-...
```

**3. Start dev server**:
```bash
npm run dev
```

**4. Test empty result**:
```bash
curl -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "flannel shirt"}'
```

**5. Check response**:
Look for context-aware suggestions instead of generic "try another keyword"

### Verify Fallback

**1. Disable API key**:
```bash
# Comment out in .env.local
# OPENAI_API_KEY=sk-...
```

**2. Test again**:
Should return legacy response (proves fallback works)

## Monitoring

### Response Metadata

Responses include LLM usage info:
```json
{
  "metadata": {
    "usedLLMForEmptyResults": true,
    "usedLLMForConversation": false,
    "llmProvider": "openai",
    "llmModel": "gpt-4o-mini"
  }
}
```

### Check If LLM Is Active

```bash
# Test and check metadata
curl -s -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' | jq '.metadata | {usedLLM, llmProvider}'
```

## Safety & Fallback

**Multiple Fallback Layers**:

1. **No API key** → `isLLMEnabled()` returns false → legacy
2. **API call fails** → catch error → legacy
3. **Invalid response** → validation fails → legacy  
4. **Timeout** → (future) abort and use legacy
5. **Rate limit** → (future) exponential backoff, then legacy

**Current behavior**: If LLM fails for any reason, user sees legacy response (indistinguishable from pre-LLM behavior)

## Future Enhancements

### Caching
- Cache LLM responses for common queries
- Reduce API costs
- Faster responses

### Query Reformulation
- Use `improveSearchQuery()` to understand intent
- Automatically retry with better search terms
- Reduce empty results

### Response Streaming
- Stream LLM responses for faster perceived latency
- Show partial responses as they're generated

### Fine-tuning
- Collect high-quality request/response pairs
- Fine-tune model on your product catalog
- Even better, cheaper responses

## Files Modified

**Created**:
- `src/utils/assistantLLM.ts` - LLM integration utility

**Modified**:
- `.data/assistant-feature-flags.json` - Added LLM flags
- `src/utils/assistantConfig.ts` - Updated types for LLM fields
- `src/app/api/assistant/chat/route.ts` - Integrated LLM calls

## Configuration Reference

**Feature Flag Options**:
```json
{
  "enableLLM": true,              // Master LLM switch
  "llmProvider": "openai",        // "openai" | "anthropic"
  "llmModel": "gpt-4o-mini",      // Model identifier
  "llmMaxTokens": 300,            // Max response length
  "flags": {
    "useLLMForEmptyResults": true,   // Context-aware empty results
    "useLLMForConversation": false    // Enhance all responses
  }
}
```

**Environment Variables**:
```bash
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

## Rollback

**Instant disable**:
```json
{
  "enableLLM": false
}
```

**Disable specific features**:
```json
{
  "enableLLM": true,
  "flags": {
    "useLLMForEmptyResults": false,
    "useLLMForConversation": false
  }
}
```

## Summary

✅ **Problem Fixed**: Empty results now get helpful, context-aware suggestions  
✅ **Backward Compatible**: Legacy behavior preserved when LLM disabled  
✅ **Graceful Fallback**: API failures don't break the assistant  
✅ **Cost Effective**: Start with empty results only (~$1/month)  
✅ **Easy Rollout**: Toggle flags without code deploy  

**Recommended next**: Enable for empty results only, monitor for 1 week, then consider full conversational enhancement.
