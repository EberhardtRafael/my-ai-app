import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  buildIntentCorpus,
  getCategoryHints,
  getCategorySynonyms,
  getColorSynonyms,
  getSiteHelpFromKnowledge,
  getStopwords,
  loadFeatureFlags,
  shouldUseExternalizedKnowledge,
} from '@/utils/assistantConfig';
import {
  handleFullLLMConversation,
} from '@/utils/assistantLLM';

type AssistantIntent =
  | 'greeting'
  | 'product_search'
  | 'category_browse'
  | 'pricing'
  | 'recommendation'
  | 'site_help'
  | 'fallback';

type ProductHit = {
  id: number;
  name: string;
  category: string;
  price: number;
  brand?: string;
  material?: string;
  tags?: string;
  ratingAvg?: number;
  variants?: Array<{
    sku?: string;
    color?: string;
    size?: string;
  }>;
};

type GraphQlProductsResponse = {
  data?: {
    products?: Array<{
      id: number;
      name: string;
      category: string;
      price: number;
      brand?: string;
      material?: string;
      tags?: string;
      ratingAvg?: number;
      variants?: Array<{
        sku?: string;
        color?: string;
        size?: string;
      }>;
    }>;
  };
};

type IntentDistribution = Record<AssistantIntent, number>;

type ProductStats = {
  count: number;
  meanPrice: number;
  medianPrice: number;
  stdPrice: number;
  minPrice: number;
  maxPrice: number;
  meanRating: number;
  categoryDiversity: number;
};

type AssistantQuickLink = {
  label: string;
  href: string;
  kind: 'product' | 'location';
};

type UserStyleProfile = {
  messagesSeen: number;
  verbosityPreference: number;
  formalityPreference: number;
  mathAffinity: number;
  frustrationLevel: number;
  intentCounts: Record<AssistantIntent, number>;
};

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'this',
  'that',
  'from',
  'about',
  'want',
  'need',
  'show',
  'find',
  'products',
  'product',
  'please',
  'hello',
  'help',
  'site',
  'price',
  'cheap',
  'expensive',
]);

const CATEGORY_HINTS = ['shirt', 'dress', 'jacket', 'shoes', 'pants', 'accessories'];
const COLOR_HINTS = [
  'black',
  'white',
  'gray',
  'grey',
  'blue',
  'navy',
  'olive',
  'brown',
  'cream',
  'burgundy',
  'red',
  'charcoal',
];
const COLOR_SYNONYMS: Record<string, string> = {
  'wine red': 'Burgundy',
  maroon: 'Burgundy',
  crimson: 'Burgundy',
  grey: 'Gray',
  navy: 'Navy',
  blue: 'Blue',
  black: 'Black',
  white: 'White',
  gray: 'Gray',
  olive: 'Olive',
  brown: 'Brown',
  cream: 'Cream',
  red: 'Burgundy',
  charcoal: 'Charcoal',
};
const CATEGORY_SYNONYMS: Record<string, string> = {
  sneaker: 'shoes',
  sneakers: 'shoes',
  shoe: 'shoes',
  tshirt: 'shirt',
  't-shirt': 'shirt',
  tee: 'shirt',
  tees: 'shirt',
  trouser: 'pants',
  trousers: 'pants',
};

const BUY_TERMS = ['buy', 'purchase', 'shop', 'get me', 'looking for'];
const CHARACTERISTIC_NOISE = new Set([
  'stuff',
  'things',
  'items',
  'around',
  'about',
  'best',
  'top',
  'rated',
  'similar',
  'option',
  'options',
  'show',
  'find',
  'need',
  'want',
  'please',
  'less',
  'than',
  'under',
  'below',
  'bucks',
  'dollar',
  'dollars',
]);

const INTENTS: AssistantIntent[] = [
  'greeting',
  'product_search',
  'category_browse',
  'pricing',
  'recommendation',
  'site_help',
  'fallback',
];

const DEFAULT_STYLE_PROFILE: UserStyleProfile = {
  messagesSeen: 0,
  verbosityPreference: 0.5,
  formalityPreference: 0.5,
  mathAffinity: 0.5,
  frustrationLevel: 0,
  intentCounts: {
    greeting: 0,
    product_search: 0,
    category_browse: 0,
    pricing: 0,
    recommendation: 0,
    site_help: 0,
    fallback: 0,
  },
};

const INTENT_CORPUS: Record<AssistantIntent, string[]> = {
  greeting: ['hi there', 'hello', 'good morning', 'hey assistant'],
  product_search: [
    'find running shoes',
    'show me black jacket',
    'i want to buy a shirt',
    'help me find products',
  ],
  category_browse: [
    'browse jackets',
    'show categories',
    'show me dresses',
    'what pants do you have',
  ],
  pricing: [
    'cheap options under 100',
    'what is the price',
    'budget products',
    'show affordable shoes',
  ],
  recommendation: [
    'recommend me good products',
    'best for me',
    'similar to running shoes',
    'suggest top rated items',
  ],
  site_help: ['how do i checkout', 'where are my orders', 'how to use favorites', 'how do i login'],
  fallback: ['help', 'not sure', 'something else'],
};

const RULE_BOOSTS: Record<AssistantIntent, RegExp[]> = {
  greeting: [/\b(hi|hello|hey|good morning|good evening)\b/],
  product_search: [/\b(product|search|find|buy|purchase|shop|looking for|show me)\b/],
  category_browse: [
    /\b(category|categories|browse|collection|show .* (shirt|dress|jacket|shoes|pants))\b/,
  ],
  pricing: [/\b(price|cost|budget|cheap|expensive|under\s+\d+|below\s+\d+)\b/],
  recommendation: [/\b(recommend|suggest|similar|best for me|for you)\b/],
  site_help: [
    /\b(order|cart|checkout|favorite|favorites|ticket|tickets|account|login|sign in|profile|role|dev mode|developer mode|token|session|expire|expiry|testing|tests?|qa|how do i)\b/,
  ],
  fallback: [],
};

function tokenize(text: string): string[] {
  // Use externalized stopwords if enabled, otherwise use legacy
  const stopwords = shouldUseExternalizedKnowledge() ? getStopwords() : STOPWORDS;

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopwords.has(token));
}

function buildBayesModel() {
  // Use externalized intent corpus if enabled, otherwise use legacy
  const intentCorpus = shouldUseExternalizedKnowledge() ? buildIntentCorpus() : INTENT_CORPUS;

  const wordCounts: Record<AssistantIntent, Record<string, number>> = {
    greeting: {},
    product_search: {},
    category_browse: {},
    pricing: {},
    recommendation: {},
    site_help: {},
    fallback: {},
  };
  const totalWords: Record<AssistantIntent, number> = {
    greeting: 0,
    product_search: 0,
    category_browse: 0,
    pricing: 0,
    recommendation: 0,
    site_help: 0,
    fallback: 0,
  };
  const priors: Record<AssistantIntent, number> = {
    greeting: 1,
    product_search: 1,
    category_browse: 1,
    pricing: 1,
    recommendation: 1,
    site_help: 1,
    fallback: 1,
  };
  const vocabulary = new Set<string>();

  for (const intent of INTENTS) {
    const samples = intentCorpus[intent] || [];
    priors[intent] = samples.length;

    for (const sample of samples) {
      const tokens = tokenize(sample);
      for (const token of tokens) {
        vocabulary.add(token);
        wordCounts[intent][token] = (wordCounts[intent][token] || 0) + 1;
        totalWords[intent] += 1;
      }
    }
  }

  return {
    wordCounts,
    totalWords,
    priors,
    vocabularySize: vocabulary.size,
    totalSamples: INTENTS.reduce((sum, intent) => sum + priors[intent], 0),
  };
}

const BAYES_MODEL = buildBayesModel();

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce<Record<string, string>>((accumulator, pair) => {
    const [key, ...rest] = pair.trim().split('=');
    if (!key) return accumulator;
    accumulator[key] = rest.join('=');
    return accumulator;
  }, {});
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeStyleProfile(profile: unknown): UserStyleProfile {
  const parsed = (profile || {}) as Partial<UserStyleProfile>;
  return {
    messagesSeen: Number(parsed.messagesSeen || 0),
    verbosityPreference: clamp(Number(parsed.verbosityPreference ?? 0.5)),
    formalityPreference: clamp(Number(parsed.formalityPreference ?? 0.5)),
    mathAffinity: clamp(Number(parsed.mathAffinity ?? 0.5)),
    frustrationLevel: clamp(Number(parsed.frustrationLevel ?? 0), 0, 1),
    intentCounts: {
      ...DEFAULT_STYLE_PROFILE.intentCounts,
      ...(parsed.intentCounts || {}),
    },
  };
}

function detectFrustrationSignal(message: string): number {
  const text = message.toLowerCase();
  const frustrationTerms = [
    'frustrated',
    'annoyed',
    'angry',
    'this sucks',
    'useless',
    'dumb',
    'stupid',
    'hate',
    'wtf',
    'why is this',
    'not working',
    'call a real person',
  ];

  let signal = 0;
  if (frustrationTerms.some((term) => text.includes(term))) {
    signal += 0.75;
  }
  if (text.includes('!')) {
    signal += 0.1;
  }
  if (/\b(now|immediately|asap)\b/.test(text)) {
    signal += 0.1;
  }
  return clamp(signal, 0, 1);
}

function shouldShowProductListForMessage(intent: AssistantIntent, message: string): boolean {
  if (intent === 'product_search' || intent === 'category_browse' || intent === 'pricing') {
    return true;
  }

  const text = message.toLowerCase();
  return /\b(show|find|list|recommend|similar|products?|items?)\b/.test(text);
}

async function loadStyleProfile(profileId: string): Promise<UserStyleProfile> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/assistant/profile/${encodeURIComponent(profileId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      return {
        ...DEFAULT_STYLE_PROFILE,
        intentCounts: { ...DEFAULT_STYLE_PROFILE.intentCounts },
      };
    }

    const data = (await response.json()) as { profile?: unknown };
    return normalizeStyleProfile(data.profile);
  } catch {
    return {
      ...DEFAULT_STYLE_PROFILE,
      intentCounts: { ...DEFAULT_STYLE_PROFILE.intentCounts },
    };
  }
}

async function saveStyleProfile(profileId: string, profile: UserStyleProfile): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/assistant/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, profile }),
    });
  } catch {
    // swallow persistence errors to keep chat responsive
  }
}

function updateStyleProfile(
  profile: UserStyleProfile,
  message: string,
  intent: AssistantIntent
): UserStyleProfile {
  const text = message.toLowerCase();
  const lengthSignal = clamp(message.length / 220);
  const detailSignal =
    /\b(explain|why|detail|detailed|compare|analysis|pros|cons|breakdown)\b/.test(text) ? 1 : 0;
  const shortSignal = message.length < 35 ? 1 : 0;
  const formalSignal = /\b(please|could you|would you|kindly)\b/.test(text) ? 1 : 0.2;
  const mathSignal =
    /\b(statistics|probability|math|mean|median|sigma|distribution|bayes|score|confidence)\b/.test(
      text
    )
      ? 1
      : 0;
  const frustrationSignal = detectFrustrationSignal(message);

  const nextMessagesSeen = profile.messagesSeen + 1;
  const alpha = 0.25;

  return {
    messagesSeen: nextMessagesSeen,
    verbosityPreference: clamp(
      profile.verbosityPreference * (1 - alpha) +
        (lengthSignal * 0.6 + detailSignal * 0.5 - shortSignal * 0.2) * alpha
    ),
    formalityPreference: clamp(profile.formalityPreference * (1 - alpha) + formalSignal * alpha),
    mathAffinity: clamp(profile.mathAffinity * (1 - alpha) + mathSignal * alpha),
    frustrationLevel: clamp(
      profile.frustrationLevel * (1 - alpha) + frustrationSignal * alpha,
      0,
      1
    ),
    intentCounts: {
      ...profile.intentCounts,
      [intent]: (profile.intentCounts[intent] || 0) + 1,
    },
  };
}

function normalizeLogScores(logScores: IntentDistribution): IntentDistribution {
  const maxLog = Math.max(...INTENTS.map((intent) => logScores[intent]));
  const expScores = INTENTS.map((intent) => ({
    intent,
    value: Math.exp(logScores[intent] - maxLog),
  }));
  const denom = expScores.reduce((sum, item) => sum + item.value, 0) || 1;

  const distribution: IntentDistribution = {
    greeting: 0,
    product_search: 0,
    category_browse: 0,
    pricing: 0,
    recommendation: 0,
    site_help: 0,
    fallback: 0,
  };

  for (const item of expScores) {
    distribution[item.intent] = item.value / denom;
  }

  return distribution;
}

function classifyIntent(message: string): {
  intent: AssistantIntent;
  confidence: number;
  distribution: IntentDistribution;
} {
  const text = message.toLowerCase();
  const tokens = tokenize(message);
  const logScores: IntentDistribution = {
    greeting: 0,
    product_search: 0,
    category_browse: 0,
    pricing: 0,
    recommendation: 0,
    site_help: 0,
    fallback: 0,
  };

  for (const intent of INTENTS) {
    const prior = BAYES_MODEL.priors[intent] / BAYES_MODEL.totalSamples;
    logScores[intent] = Math.log(prior || 1e-9);

    for (const token of tokens) {
      const count = BAYES_MODEL.wordCounts[intent][token] || 0;
      const likelihood =
        (count + 1) / (BAYES_MODEL.totalWords[intent] + BAYES_MODEL.vocabularySize);
      logScores[intent] += Math.log(likelihood);
    }

    if (RULE_BOOSTS[intent].some((pattern) => pattern.test(text))) {
      logScores[intent] += 1.2;
    }

    if (intent === 'product_search' && BUY_TERMS.some((term) => text.includes(term))) {
      logScores[intent] += 1.0;
    }
  }

  const distribution = normalizeLogScores(logScores);
  const ranked = [...INTENTS].sort((a, b) => distribution[b] - distribution[a]);
  const bestIntent = ranked[0];

  return {
    intent: bestIntent,
    confidence: Number(distribution[bestIntent].toFixed(3)),
    distribution,
  };
}

function extractSearchTerm(message: string): string {
  const cleaned = tokenize(message).filter((token) => token.length > 2);

  const filtered = cleaned.filter(
    (token) =>
      !CATEGORY_HINTS.includes(token) &&
      !COLOR_HINTS.includes(token) &&
      token !== 'stuff' &&
      token !== 'things' &&
      token !== 'items'
  );

  if (filtered.length === 0) {
    return '';
  }

  return filtered.slice(0, 3).join(' ');
}

function extractCharacteristics(message: string): string[] {
  const tokens = tokenize(message).filter((token) => token.length >= 3);

  const characteristics = tokens.filter(
    (token) =>
      !CATEGORY_HINTS.includes(token) &&
      !COLOR_HINTS.includes(token) &&
      !CHARACTERISTIC_NOISE.has(token) &&
      !BUY_TERMS.some((term) => term.includes(token))
  );

  return [...new Set(characteristics)].slice(0, 6);
}

function extractCategory(message: string): string {
  const text = message.toLowerCase();

  // Use externalized synonyms if enabled, otherwise use legacy
  const categorySynonyms = shouldUseExternalizedKnowledge()
    ? getCategorySynonyms()
    : CATEGORY_SYNONYMS;
  const categoryHints = shouldUseExternalizedKnowledge() ? getCategoryHints() : CATEGORY_HINTS;

  for (const [alias, canonical] of Object.entries(categorySynonyms)) {
    if (text.includes(alias)) {
      return canonical;
    }
  }

  const matched = categoryHints.find((hint) => text.includes(hint));
  return matched || '';
}

function extractBudget(message: string): number | null {
  const text = message.toLowerCase();
  const budgetPattern = /(under|below|less than|max|budget)\s*\$?\s*(\d{2,5})/;
  const match = text.match(budgetPattern);
  if (!match) return null;

  const budget = Number(match[2]);
  return Number.isFinite(budget) ? budget : null;
}

function extractColor(message: string): string {
  const text = message.toLowerCase();

  // Use externalized synonyms if enabled, otherwise use legacy
  const colorSynonyms = shouldUseExternalizedKnowledge() ? getColorSynonyms() : COLOR_SYNONYMS;

  for (const [synonym, canonical] of Object.entries(colorSynonyms)) {
    if (text.includes(synonym)) {
      return canonical;
    }
  }

  return '';
}

function getProductSearchableText(product: ProductHit): string {
  const variantText = (product.variants || [])
    .map((variant) => `${variant.color || ''} ${variant.size || ''} ${variant.sku || ''}`)
    .join(' ');

  return [
    product.name,
    product.category,
    product.brand || '',
    product.material || '',
    product.tags || '',
    variantText,
  ]
    .join(' ')
    .toLowerCase();
}

function getCharacteristicMatchCount(product: ProductHit, characteristics: string[]): number {
  if (characteristics.length === 0) return 0;
  const searchable = getProductSearchableText(product);

  return characteristics.reduce(
    (count, characteristic) => (searchable.includes(characteristic) ? count + 1 : count),
    0
  );
}

function getRankedProducts(
  products: ProductHit[],
  message: string,
  category: string,
  budget: number | null,
  color: string,
  characteristics: string[]
): ProductHit[] {
  const text = message.toLowerCase();
  const tokens = tokenize(text);

  const scored = products.map((product) => {
    const searchable = getProductSearchableText(product);
    let score = 0;

    for (const token of tokens) {
      if (token.length < 3) continue;
      if (searchable.includes(token)) score += 2;
    }

    if (category && product.category.toLowerCase().includes(category)) {
      score += 3;
    }

    if (color) {
      const variantColors = (product.variants || [])
        .map((variant) => (variant.color || '').toLowerCase())
        .filter(Boolean);
      if (variantColors.includes(color.toLowerCase())) {
        score += 5;
      } else {
        score -= 4;
      }
    }

    if (budget !== null) {
      if (product.price <= budget) {
        score += 2;
      } else {
        score -= Math.min(3, (product.price - budget) / Math.max(budget, 1));
      }
    }

    if (characteristics.length > 0) {
      const matchCount = getCharacteristicMatchCount(product, characteristics);
      score += matchCount * 2.5;
      if (matchCount === 0) {
        score -= 3;
      }
    }

    score += (product.ratingAvg || 0) * 0.5;
    return {
      product,
      score,
      characteristicMatches: getCharacteristicMatchCount(product, characteristics),
    };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);

  const filtered =
    characteristics.length > 0 ? sorted.filter((entry) => entry.characteristicMatches > 0) : sorted;

  return filtered.map((entry) => entry.product).slice(0, 8);
}

function calculateProductStats(products: ProductHit[]): ProductStats {
  if (products.length === 0) {
    return {
      count: 0,
      meanPrice: 0,
      medianPrice: 0,
      stdPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      meanRating: 0,
      categoryDiversity: 0,
    };
  }

  const prices = products.map((item) => item.price).filter((price) => Number.isFinite(price));
  prices.sort((a, b) => a - b);

  const meanPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const medianPrice = prices[Math.floor(prices.length / 2)] || meanPrice;
  const variance =
    prices.reduce((sum, price) => sum + (price - meanPrice) ** 2, 0) / Math.max(prices.length, 1);
  const stdPrice = Math.sqrt(variance);

  const ratings = products
    .map((item) => item.ratingAvg)
    .filter((rating): rating is number => typeof rating === 'number');
  const meanRating = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : 0;

  const categories = new Set(products.map((item) => item.category.toLowerCase()));

  return {
    count: products.length,
    meanPrice,
    medianPrice,
    stdPrice,
    minPrice: prices[0] || 0,
    maxPrice: prices[prices.length - 1] || 0,
    meanRating,
    categoryDiversity: categories.size,
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickVariant(message: string, options: string[]): string {
  if (options.length === 0) return '';
  const seed = hashString(message);
  return options[seed % options.length];
}

function buildStatsNarrative(stats: ProductStats, intent: AssistantIntent): string {
  if (stats.count === 0) return '';

  if (intent === 'pricing') {
    return `Price stats: median $${stats.medianPrice.toFixed(2)}, mean $${stats.meanPrice.toFixed(2)}, spread σ=$${stats.stdPrice.toFixed(2)}.`;
  }

  if (intent === 'recommendation') {
    return `Data signal: average rating ${stats.meanRating.toFixed(2)} across ${stats.count} items with ${stats.categoryDiversity} category buckets.`;
  }

  return `Quick stats: $${stats.minPrice.toFixed(2)} to $${stats.maxPrice.toFixed(2)} (median $${stats.medianPrice.toFixed(2)}).`;
}

async function formatProducts(
  products: ProductHit[],
  userMessage: string = '',
  searchTerm: string = '',
  category: string = '',
  color: string = '',
  budget: number | null = null
): Promise<string> {
  if (products.length === 0) {
    console.log('[LLM] Empty results - calling LLM');
    return await generateEmptyResultResponse(userMessage, searchTerm, category, color, budget);
  }

  const lines = products.slice(0, 5).map((item) => {
    const rating = item.ratingAvg ? ` | ⭐ ${item.ratingAvg.toFixed(1)}` : '';
    return `- ${item.name} (${item.category}) — $${item.price.toFixed(2)}${rating}`;
  });

  return ['Here are some options:', ...lines].join('\n');
}

async function fetchProducts(
  searchTerm: string,
  category: string,
  color: string,
  limit: number = 24
): Promise<ProductHit[]> {
  const safeSearch = searchTerm.replace(/"/g, '');
  const safeCategory = category.replace(/"/g, '');
  const safeColor = color.replace(/"/g, '');

  const query = `
    query {
      products(searchTerm: "${safeSearch}", category: "${safeCategory}", color: "${safeColor}", offset: 0, limit: ${limit}) {
        id
        name
        category
        price
        brand
        material
        tags
        ratingAvg
        variants {
          sku
          color
          size
        }
      }
    }
  `;

  const response = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    return [];
  }

  const result = (await response.json()) as GraphQlProductsResponse;
  return result.data?.products || [];
}

async function fetchProductsWithFallback(
  message: string,
  searchTerm: string,
  category: string,
  budget: number | null,
  color: string,
  characteristics: string[]
): Promise<ProductHit[]> {
  const primary = await fetchProducts(searchTerm, category, color, 40);
  if (primary.length > 0) {
    return getRankedProducts(primary, message, category, budget, color, characteristics);
  }

  if (category) {
    const categoryOnly = await fetchProducts('', category, color, 80);
    if (categoryOnly.length > 0) {
      return getRankedProducts(categoryOnly, message, category, budget, color, characteristics);
    }
  }

  if (color) {
    const colorOnly = await fetchProducts('', '', color, 80);
    if (colorOnly.length > 0) {
      return getRankedProducts(colorOnly, message, category, budget, color, characteristics);
    }
  }

  const broad = await fetchProducts('', '', '', characteristics.length > 0 ? 140 : 80);
  if (broad.length > 0) {
    return getRankedProducts(broad, message, category, budget, color, characteristics);
  }

  return [];
}

function buildSiteHelpReply(message: string): string {
  // Try to use externalized knowledge if enabled
  if (shouldUseExternalizedKnowledge()) {
    const knowledgeResponse = getSiteHelpFromKnowledge(message);
    if (knowledgeResponse) {
      return knowledgeResponse;
    }
  }

  // Legacy fallback behavior
  const text = message.toLowerCase();

  if (
    text.includes('role') ||
    text.includes('dev mode') ||
    text.includes('developer mode') ||
    text.includes('permission')
  ) {
    return 'This app supports user and dev roles. Dev mode availability depends on your role, and when enabled it unlocks Tickets and the Dev Testing page.';
  }

  if (text.includes('profile')) {
    return 'Open the Profile page from the user dropdown to view and manage account details.';
  }

  if (
    text.includes('token') ||
    text.includes('session') ||
    text.includes('expire') ||
    text.includes('expiry')
  ) {
    return 'Auth uses JWT sessions. Session and JWT max age are 8 hours, with a 30-minute update age, so tokens refresh periodically while active.';
  }

  if (text.includes('testing') || text.includes('test page') || text.includes('qa')) {
    return 'When dev mode is enabled, use the Dev Testing page for testing workflows. You can also run automated tests with npm scripts like test, test:coverage, and test:smoke.';
  }

  if (text.includes('test') || text.includes('jest') || text.includes('pytest')) {
    return 'Available tests include frontend Jest tests and backend Python pytest suites. Common commands: npm test, npm run test:coverage, npm run test:smoke, npm run test:python, and npm run test:all.';
  }

  if (text.includes('buy') || text.includes('purchase') || text.includes('shop')) {
    return 'To buy: go to Products, open an item, choose options, add to cart, then checkout from the Cart page.';
  }

  if (text.includes('order')) {
    return 'You can view order history on the Orders page after signing in.';
  }
  if (text.includes('cart') || text.includes('checkout')) {
    return 'Add items from Products, then open Cart and proceed to Checkout to complete your purchase.';
  }
  if (text.includes('favorite')) {
    return 'Use the Favorites page to save items you want to track or compare later.';
  }
  if (text.includes('ticket')) {
    return 'The Tickets page can generate implementation tickets and now includes analytics/history.';
  }
  if (text.includes('login') || text.includes('sign in') || text.includes('account')) {
    return 'Use Sign In from the header menu or /auth/signin to access personalized recommendations, profile, orders, and role-based dev features.';
  }

  return 'I can help with products, orders, cart/checkout, favorites, tickets, sign-in/profile, roles/dev mode, token/session behavior, and testing workflows.';
}

function buildConversationalReply(
  message: string,
  intent: AssistantIntent,
  confidence: number,
  baseReply: string,
  statsNarrative: string,
  styleProfile: UserStyleProfile
): string {
  const isFrustrated = styleProfile.frustrationLevel >= 0.45;
  const openers = isFrustrated
    ? [
        'You are right to be frustrated. Let me make this simple.',
        'Thanks for the direct feedback. I will keep this concise.',
        'I understand. Let us fix this quickly.',
      ]
    : styleProfile.formalityPreference >= 0.6
      ? [
          'Here is the analysis I prepared for you.',
          'Based on your request, I evaluated the available options.',
          'I reviewed the data and identified relevant matches.',
        ]
      : [
          'Here is what I found.',
          'I ran a quick analysis for you.',
          'Based on your request, this looks promising.',
        ];
  const confidenceLine =
    confidence >= 0.75
      ? `Intent confidence is strong (${Math.round(confidence * 100)}%).`
      : `Intent confidence is moderate (${Math.round(confidence * 100)}%), so you can refine the query for better matches.`;

  const opener = pickVariant(message, openers);
  const parts = [opener, baseReply];

  if (styleProfile.verbosityPreference >= 0.45 && !isFrustrated) {
    parts.splice(1, 0, confidenceLine);
  }

  if (statsNarrative && styleProfile.verbosityPreference >= 0.35 && !isFrustrated) {
    parts.push(statsNarrative);
  }

  if (statsNarrative && styleProfile.mathAffinity >= 0.6 && !isFrustrated) {
    parts.push(
      'If you want, I can also compare options using a weighted value score (rating-to-price ratio).'
    );
  }

  if (intent === 'fallback') {
    parts.push(
      isFrustrated
        ? 'Give me one target + budget, and I will return only the top 3 choices.'
        : 'Try adding product type, budget, or desired style for sharper results.'
    );
  }

  if (isFrustrated) {
    parts.push('If you prefer, I can switch to strict step-by-step guidance only.');
  }

  const deduped = parts.filter((part, index) => part && parts.indexOf(part) === index);
  return deduped.join('\n\n');
}

function buildPersonalizedSuggestions(styleProfile: UserStyleProfile): string[] {
  const rankedIntents = [...INTENTS].sort(
    (first, second) =>
      (styleProfile.intentCounts[second] || 0) - (styleProfile.intentCounts[first] || 0)
  );
  const topIntent = rankedIntents[0];

  if (topIntent === 'pricing') {
    return [
      'Show high-rated items under $80',
      'Compare value options in shoes',
      'Find budget picks with best ratings',
      'What is the median price for jackets?',
    ];
  }

  if (topIntent === 'recommendation') {
    return [
      'Suggest top-rated running shoes',
      'Find products similar to this style',
      'Recommend items with strong value score',
      'Show me a diverse shortlist of options',
    ];
  }

  if (topIntent === 'site_help') {
    return [
      'How do I buy a shirt on this site?',
      'Where can I track my orders?',
      'How do roles and dev mode work?',
      'How long do auth tokens/sessions last?',
    ];
  }

  return [
    'Show me trending jackets under $120',
    'Find products similar to running shoes',
    'How do I check my order history?',
    'Help me compare products for value',
  ];
}

function buildQuickLinks(
  message: string,
  intent: AssistantIntent,
  products: ProductHit[],
  searchTerm: string,
  category: string,
  color: string,
  characteristics: string[],
  assistantSession: string
): AssistantQuickLink[] {
  const text = message.toLowerCase();
  const links: AssistantQuickLink[] = [];

  const query = new URLSearchParams();
  if (searchTerm) {
    query.set('search', searchTerm);
  }
  if (category) {
    query.set('category', category);
  }
  if (color) {
    query.set('color', color);
  }
  if (characteristics.length > 0) {
    query.set('characteristics', characteristics.join(','));
  }
  query.set('assistantSession', assistantSession);
  if (products.length > 0) {
    query.set(
      'assistantRecs',
      products
        .slice(0, 8)
        .map((product) => String(product.id))
        .join(',')
    );
  }
  const plpResultsHref = query.toString() ? `/plp?${query.toString()}` : '/plp';

  links.push({
    label: 'Open these results in PLP',
    href: plpResultsHref,
    kind: 'location',
  });

  for (const product of products.slice(0, 4)) {
    links.push({
      label: `Open ${product.name}`,
      href: `/pdp/${product.id}`,
      kind: 'product',
    });
  }

  links.push({ label: 'Browse all products', href: '/plp', kind: 'location' });

  if (text.includes('checkout') || text.includes('buy') || text.includes('purchase')) {
    links.push({ label: 'Go to cart', href: '/cart', kind: 'location' });
    links.push({ label: 'Go to checkout', href: '/checkout', kind: 'location' });
  }
  if (text.includes('order')) {
    links.push({ label: 'Open orders', href: '/orders', kind: 'location' });
  }
  if (text.includes('favorite')) {
    links.push({ label: 'Open favorites', href: '/favorites', kind: 'location' });
  }
  if (text.includes('ticket')) {
    links.push({ label: 'Open tickets', href: '/tickets', kind: 'location' });
  }
  if (text.includes('profile') || text.includes('account')) {
    links.push({ label: 'Open profile', href: '/profile', kind: 'location' });
  }
  if (text.includes('login') || text.includes('sign in')) {
    links.push({ label: 'Open sign in', href: '/auth/signin', kind: 'location' });
  }
  if (
    text.includes('role') ||
    text.includes('dev mode') ||
    text.includes('developer mode') ||
    text.includes('testing') ||
    text.includes('test')
  ) {
    links.push({ label: 'Open dev testing', href: '/dev/testing', kind: 'location' });
  }

  if (intent === 'site_help' && !text.includes('checkout') && !text.includes('order')) {
    links.push({ label: 'Open assistant home', href: '/assistant', kind: 'location' });
  }

  const deduped: AssistantQuickLink[] = [];
  for (const link of links) {
    if (!deduped.some((existing) => existing.href === link.href)) {
      deduped.push(link);
    }
  }

  return deduped.slice(0, 6);
}

export async function POST(request: Request) {
  try {
    // Load feature flags at request time
    const featureFlags = loadFeatureFlags();

    const body = (await request.json()) as { message?: string };
    const message = (body.message || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user session to tie conversation to user account
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Use user ID as profile_id for logged-in users, UUID for guests
    const cookies = parseCookieHeader(request.headers.get('cookie'));
    const profileId = userId
      ? `user-${userId}` // Logged-in users: use "user-{id}"
      : cookies.assistant_profile_id || crypto.randomUUID(); // Guests: UUID from cookie or new

    const currentStyleProfile = await loadStyleProfile(profileId);

    // Fetch broad product catalog for LLM to choose from
    console.log('[FULL LLM] Fetching product catalog');
    const allProducts = await fetchProducts('', '', '', 100);

    // Let LLM handle everything: intent, product selection, response
    console.log('[FULL LLM] Calling handleFullLLMConversation');
    const { reply, productIds, intent } = await handleFullLLMConversation(message, allProducts);

    // Filter products based on LLM's recommendation
    const products = allProducts.filter((p) => productIds.includes(p.id));

    console.log('[FULL LLM] LLM selected', products.length, 'products');

    // Update style profile with detected intent
    const nextStyleProfile = updateStyleProfile(
      currentStyleProfile,
      message,
      intent as AssistantIntent
    );

    // Legacy fields for compatibility
    const category = extractCategory(message);
    const searchTerm = extractSearchTerm(message);
    const budget = extractBudget(message);
    const color = extractColor(message);
    const characteristics = extractCharacteristics(message);
    const confidence = 0.85; // LLM is always confident
    const distribution: IntentDistribution = {
      greeting: 0,
      product_search: 0,
      category_browse: 0,
      pricing: 0,
      recommendation: 0,
      site_help: 0,
      fallback: 0,
      [intent as AssistantIntent]: 1.0,
    };
    const useLegacyFallback = false;

    const productStats = calculateProductStats(products);
    const suggestions = buildPersonalizedSuggestions(nextStyleProfile);
    const assistantSession = `${profileId.slice(0, 8)}-${Date.now().toString(36)}`;
    const quickLinks = buildQuickLinks(
      message,
      intent as AssistantIntent,
      products,
      searchTerm,
      category,
      color,
      characteristics,
      assistantSession
    );

    const response = NextResponse.json({
      reply,
      intent,
      confidence,
      products,
      quickLinks,
      suggestions,
      metadata: {
        searchTerm,
        category,
        color,
        budget,
        characteristics,
        intentDistribution: distribution,
        productStats,
        styleProfile: nextStyleProfile,
        profileId,
        assistantSession,
        deterministic: false, // LLM-generated responses are non-deterministic
        // Feature flag metadata
        assistantMode: featureFlags.assistantMode,
        usedLegacyFallback: useLegacyFallback,
        usedExternalizedKnowledge: shouldUseExternalizedKnowledge(),
        featureFlagsVersion: featureFlags.metadata.version,
      },
    });

    await saveStyleProfile(profileId, nextStyleProfile);

    // Only set cookie for guest users (logged-in users use user-based profile_id)
    if (!userId) {
      response.cookies.set('assistant_profile_id', profileId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Assistant failed to respond',
      },
      { status: 500 }
    );
  }
}
