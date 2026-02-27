/**
 * Lightweight LLM integration for assistant context-aware responses
 * Supports OpenAI and Anthropic APIs with graceful fallback
 */

import { loadFeatureFlags } from './assistantConfig';

type LLMProvider = 'openai' | 'anthropic';

type LLMResponse = {
  content: string;
  error?: string;
  fallback?: boolean;
};

/**
 * Check if LLM features are enabled
 */
export function isLLMEnabled(): boolean {
  const flags = loadFeatureFlags();
  return flags.enableLLM && (!!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY);
}

/**
 * Get configured LLM provider
 */
function getLLMProvider(): LLMProvider {
  const flags = loadFeatureFlags();
  return flags.llmProvider as LLMProvider;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { content: '', error: 'OpenAI API key not configured', fallback: true };
  }

  try {
    const flags = loadFeatureFlags();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: flags.llmModel || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return { content: '', error: 'OpenAI API request failed', fallback: true };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return { content, fallback: false };
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return { content: '', error: String(error), fallback: true };
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { content: '', error: 'Anthropic API key not configured', fallback: true };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return { content: '', error: 'Anthropic API request failed', fallback: true };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    return { content, fallback: false };
  } catch (error) {
    console.error('Anthropic API call failed:', error);
    return { content: '', error: String(error), fallback: true };
  }
}

/**
 * Call LLM with automatic provider selection
 */
async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 300
): Promise<LLMResponse> {
  const provider = getLLMProvider();

  if (provider === 'anthropic') {
    return callAnthropic(systemPrompt, userPrompt, maxTokens);
  }

  return callOpenAI(systemPrompt, userPrompt, maxTokens);
}

/**
 * Generate helpful response for empty product search results
 */
export async function generateEmptyResultResponse(
  userMessage: string,
  searchTerm: string,
  category: string,
  color: string,
  budget: number | null
): Promise<string> {
  console.log('[LLM] generateEmptyResultResponse called');
  const flags = loadFeatureFlags();

  const systemPrompt = `You are a helpful shopping assistant. When no products match a search, provide a brief, empathetic response that:
1. Acknowledges the specific request
2. Suggests 2-3 concrete alternative search strategies
3. Stays under 80 words
4. Uses a friendly, conversational tone`;

  const context = [
    `User query: "${userMessage}"`,
    searchTerm && `Search term: ${searchTerm}`,
    category && `Category: ${category}`,
    color && `Color: ${color}`,
    budget && `Budget: under $${budget}`,
  ]
    .filter(Boolean)
    .join('\n');

  const userPrompt = `${context}\n\nNo products were found. Generate a helpful response with alternative search suggestions.`;

  const response = await callLLM(systemPrompt, userPrompt, flags.llmMaxTokens || 300);

  console.log('[LLM] Empty result response:', {
    hasFallback: response.fallback,
    hasContent: !!response.content,
    error: response.error,
  });

  if (response.fallback || !response.content) {
    console.error('[LLM] FAILED to generate empty result response:', response.error);
    return 'The assistant could not generate a response. Please check the console for errors.';
  }

  return response.content.trim();
}

/**
 * Generate conversational reply that adapts to context
 */
export async function generateConversationalReply(
  userMessage: string,
  intent: string,
  products: number,
  baseReply: string,
  confidence: number
): Promise<string> {
  const flags = loadFeatureFlags();

  console.log('[LLM] generateConversationalReply called');
  console.log('[LLM] flags.flags.useLLMForConversation:', flags.flags.useLLMForConversation);
  console.log('[LLM] isLLMEnabled():', isLLMEnabled());
  console.log('[LLM] OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('[LLM] flags.enableLLM:', flags.enableLLM);

  console.log('[LLM] Calling OpenAI API...');

  const systemPrompt = `You are a friendly shopping assistant. Rewrite responses to be more natural and helpful while keeping them concise (under 100 words). Maintain key information but make the tone conversational and supportive.`;

  const context = [
    `User query: "${userMessage}"`,
    `Detected intent: ${intent}`,
    `Products found: ${products}`,
    `Confidence: ${Math.round(confidence * 100)}%`,
    `Base response: ${baseReply}`,
  ].join('\n');

  const userPrompt = `${context}\n\nImprove the base response to be more natural and context-aware. Keep it concise and friendly.`;

  const response = await callLLM(systemPrompt, userPrompt, flags.llmMaxTokens || 300);

  console.log('[LLM] Response received:', {
    hasFallback: response.fallback,
    hasContent: !!response.content,
    error: response.error,
    contentLength: response.content?.length || 0,
  });

  if (response.fallback || !response.content) {
    console.log('[LLM] Using fallback - LLM call failed');
    return baseReply;
  }

  console.log('[LLM] LLM response successful:', response.content.substring(0, 100));
  return response.content.trim();
}

/**
 * Extract better search terms from natural language query
 */
export async function improveSearchQuery(userMessage: string): Promise<{
  searchTerm: string;
  category: string;
  color: string;
  characteristics: string[];
}> {
  const flags = loadFeatureFlags();

  if (!flags.enableLLM || !isLLMEnabled()) {
    // Return empty - let legacy extraction handle it
    return { searchTerm: '', category: '', color: '', characteristics: [] };
  }

  const systemPrompt = `Extract product search parameters from natural language queries. Return ONLY a JSON object with these fields:
{
  "searchTerm": "main product keywords",
  "category": "shirt|dress|jacket|shoes|pants|accessories or empty",
  "color": "specific color or empty",
  "characteristics": ["list", "of", "style", "attributes"]
}`;

  const userPrompt = `Query: "${userMessage}"\n\nExtract search parameters as JSON.`;

  const response = await callLLM(systemPrompt, userPrompt, 200);

  if (response.fallback || !response.content) {
    return { searchTerm: '', category: '', color: '', characteristics: [] };
  }

  try {
    const parsed = JSON.parse(response.content);
    return {
      searchTerm: parsed.searchTerm || '',
      category: parsed.category || '',
      color: parsed.color || '',
      characteristics: Array.isArray(parsed.characteristics) ? parsed.characteristics : [],
    };
  } catch {
    // JSON parse failed, return empty
    return { searchTerm: '', category: '', color: '', characteristics: [] };
  }
}

/**
 * Full LLM-powered assistant - handles intent, product selection, and response
 */
export async function handleFullLLMConversation(
  userMessage: string,
  products: Array<{
    id: number;
    name: string;
    category: string;
    price: number;
    brand?: string;
    ratingAvg?: number;
  }>
): Promise<{
  reply: string;
  productIds: number[];
  intent: string;
}> {
  console.log('[LLM] handleFullLLMConversation called');
  const flags = loadFeatureFlags();

  const systemPrompt = `You are a helpful shopping assistant for an e-commerce site. Based on the user's query, you should:
1. Understand what they want
2. Recommend the most relevant products from the catalog (up to 5)
3. Provide a natural, conversational response

Return your response as JSON:
{
  "reply": "your conversational response here",
  "productIds": [1, 2, 3],
  "intent": "product_search|greeting|help|etc"
}

Keep responses under 150 words. Be friendly and helpful.`;

  const productCatalog = products
    .slice(0, 50)
    .map(
      (p) =>
        `ID:${p.id} | ${p.name} | ${p.category} | $${p.price}${p.brand ? ` | ${p.brand}` : ''}${p.ratingAvg ? ` | ⭐${p.ratingAvg.toFixed(1)}` : ''}`
    )
    .join('\n');

  const userPrompt = `User: "${userMessage}"

Available products:
${productCatalog}

Respond as JSON with reply, productIds, and intent.`;

  const response = await callLLM(systemPrompt, userPrompt, flags.llmMaxTokens || 500);

  console.log('[LLM] Full conversation response:', {
    hasFallback: response.fallback,
    hasContent: !!response.content,
    error: response.error,
  });

  if (response.fallback || !response.content) {
    console.error('[LLM] Full LLM conversation failed:', response.error);
    
    // Smart fallback: analyze the query and give contextual response
    const msg = userMessage.toLowerCase();
    
    // Extract color/category/price from query for smart filtering
    const hasBlue = /\bblue\b/.test(msg);
    const hasRed = /\bred\b/.test(msg);
    const hasBlack = /\bblack\b/.test(msg);
    const hasShoes = /\b(shoe|shoes|sneaker|sneakers)\b/.test(msg);
    const hasShirt = /\b(shirt|tshirt|t-shirt|tee)\b/.test(msg);
    const hasCheap = /\b(cheap|budget|under|below|affordable)\b/.test(msg);
    
    let filteredProducts = products;
    
    // Filter by color
    if (hasBlue) {
      filteredProducts = products.filter(p => 
        JSON.stringify(p).toLowerCase().includes('blue')
      );
    } else if (hasRed) {
      filteredProducts = products.filter(p => 
        JSON.stringify(p).toLowerCase().includes('red') || 
        JSON.stringify(p).toLowerCase().includes('burgundy')
      );
    } else if (hasBlack) {
      filteredProducts = products.filter(p => 
        JSON.stringify(p).toLowerCase().includes('black')
      );
    }
    
    // Filter by category
    if (hasShoes && filteredProducts.length > 0) {
      const shoeProducts = filteredProducts.filter(p => 
        p.category.toLowerCase().includes('shoe')
      );
      if (shoeProducts.length > 0) filteredProducts = shoeProducts;
    } else if (hasShirt && filteredProducts.length > 0) {
      const shirtProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes('shirt')
      );
      if (shirtProducts.length > 0) filteredProducts = shirtProducts;
    }
    
    // Sort by price if budget-focused
    if (hasCheap) {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else {
      // Sort by rating if available
      filteredProducts.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
    }
    
    const topProducts = filteredProducts.slice(0, 5);
    
    let reply = '';
    if (topProducts.length > 0) {
      const productList = topProducts
        .map(p => `${p.name} - $${p.price.toFixed(2)}`)
        .join(', ');
      
      if (hasBlue) {
        reply = `I found some blue items for you: ${productList}. Check them out!`;
      } else if (hasRed) {
        reply = `Here are red items that might interest you: ${productList}.`;
      } else if (hasBlack) {
        reply = `I found these black items: ${productList}.`;
      } else if (hasShoes) {
        reply = `Here are some shoes: ${productList}.`;
      } else if (hasCheap) {
        reply = `Here are budget-friendly options: ${productList}.`;
      } else {
        reply = `I found these products for you: ${productList}.`;
      }
    } else {
      reply = `I couldn't find exactly what you're looking for. Try browsing our catalog or search for specific items like "blue shoes" or "red shirt".`;
    }
    
    return {
      reply,
      productIds: topProducts.map(p => p.id),
      intent: topProducts.length > 0 ? 'product_search' : 'greeting',
    };
  }

  try {
    const parsed = JSON.parse(response.content);
    return {
      reply: parsed.reply || 'How can I assist you?',
      productIds: Array.isArray(parsed.productIds) ? parsed.productIds : [],
      intent: parsed.intent || 'unknown',
    };
  } catch (error) {
    console.error('[LLM] Failed to parse LLM response:', error, response.content);
    return {
      reply: response.content.trim(),
      productIds: [],
      intent: 'unknown',
    };
  }
}
