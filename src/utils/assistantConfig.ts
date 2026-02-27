import fs from 'fs';
import path from 'path';

// Types for feature flags
export type AssistantMode = 'legacy' | 'hybrid' | 'enhanced';

export type AssistantFeatureFlags = {
  assistantMode: AssistantMode;
  enableHybridMode: boolean;
  enableLegacyFallback: boolean;
  confidenceThreshold: number;
  enableKnowledgeRetrieval: boolean;
  enableSchemaValidation: boolean;
  enableLLM: boolean;
  llmProvider: string;
  llmModel: string;
  llmMaxTokens: number;
  flags: {
    useExternalizedKnowledge: boolean;
    useStructuredResponses: boolean;
    enableContextualHelp: boolean;
    enableDebugMode: boolean;
    useLLMForEmptyResults: boolean;
    useLLMForConversation: boolean;
  };
  metadata: {
    version: string;
    lastUpdated: string;
    description: string;
  };
};

// Types for knowledge base
export type IntentMetadata = {
  displayName: string;
  description: string;
  examples: string[];
};

export type SiteHelpEntry = {
  keywords: string[];
  shortAnswer: string;
  detailedAnswer: string;
  quickLinks: Array<{
    label: string;
    href: string;
    kind: string;
  }>;
};

export type AssistantKnowledgeBase = {
  version: string;
  lastUpdated: string;
  description: string;
  intents: Record<string, IntentMetadata>;
  siteHelp: Record<string, SiteHelpEntry>;
  responseTemplates: {
    greeting: {
      casual: string[];
      formal: string[];
    };
    fallback: {
      casual: string[];
      formal: string[];
    };
  };
  categoryHints: string[];
  colorHints: string[];
  colorSynonyms: Record<string, string>;
  categorySynonyms: Record<string, string>;
  stopwords: string[];
};

// Cached configs (loaded once at module initialization)
let cachedFeatureFlags: AssistantFeatureFlags | null = null;
let cachedKnowledgeBase: AssistantKnowledgeBase | null = null;

const DATA_DIR = path.join(process.cwd(), '.data');
const FLAGS_PATH = path.join(DATA_DIR, 'assistant-feature-flags.json');
const KNOWLEDGE_PATH = path.join(DATA_DIR, 'assistant-knowledge-base.json');

// Default feature flags (used if file doesn't exist)
const DEFAULT_FLAGS: AssistantFeatureFlags = {
  assistantMode: 'legacy',
  enableHybridMode: false,
  enableLegacyFallback: true,
  confidenceThreshold: 0.65,
  enableKnowledgeRetrieval: false,
  enableSchemaValidation: false,
  enableLLM: false,
  llmProvider: 'openai',
  llmModel: 'gpt-4o-mini',
  llmMaxTokens: 300,
  flags: {
    useExternalizedKnowledge: false,
    useStructuredResponses: false,
    enableContextualHelp: false,
    enableDebugMode: false,
    useLLMForEmptyResults: false,
    useLLMForConversation: false,
  },
  metadata: {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    description: 'Default assistant feature flags',
  },
};

/**
 * Load feature flags from disk with caching
 */
export function loadFeatureFlags(): AssistantFeatureFlags {
  if (cachedFeatureFlags) {
    return cachedFeatureFlags;
  }

  try {
    if (fs.existsSync(FLAGS_PATH)) {
      const data = fs.readFileSync(FLAGS_PATH, 'utf-8');
      cachedFeatureFlags = JSON.parse(data) as AssistantFeatureFlags;
      return cachedFeatureFlags;
    }
  } catch (error) {
    console.warn('Failed to load assistant feature flags, using defaults:', error);
  }

  cachedFeatureFlags = { ...DEFAULT_FLAGS };
  return cachedFeatureFlags;
}

/**
 * Load knowledge base from disk with caching
 */
export function loadKnowledgeBase(): AssistantKnowledgeBase | null {
  if (cachedKnowledgeBase) {
    return cachedKnowledgeBase;
  }

  try {
    if (fs.existsSync(KNOWLEDGE_PATH)) {
      const data = fs.readFileSync(KNOWLEDGE_PATH, 'utf-8');
      cachedKnowledgeBase = JSON.parse(data) as AssistantKnowledgeBase;
      return cachedKnowledgeBase;
    }
  } catch (error) {
    console.warn('Failed to load assistant knowledge base:', error);
  }

  return null;
}

/**
 * Reload feature flags from disk (clears cache)
 */
export function reloadFeatureFlags(): AssistantFeatureFlags {
  cachedFeatureFlags = null;
  return loadFeatureFlags();
}

/**
 * Reload knowledge base from disk (clears cache)
 */
export function reloadKnowledgeBase(): AssistantKnowledgeBase | null {
  cachedKnowledgeBase = null;
  return loadKnowledgeBase();
}

/**
 * Check if assistant should use externalized knowledge
 */
export function shouldUseExternalizedKnowledge(): boolean {
  const flags = loadFeatureFlags();
  return flags.flags.useExternalizedKnowledge && flags.enableKnowledgeRetrieval;
}

/**
 * Check if assistant should fall back to legacy behavior
 */
export function shouldFallbackToLegacy(confidence: number): boolean {
  const flags = loadFeatureFlags();

  if (!flags.enableLegacyFallback) {
    return false;
  }

  // Fall back to legacy if confidence is below threshold
  return confidence < flags.confidenceThreshold;
}

/**
 * Get site help response from knowledge base
 */
export function getSiteHelpFromKnowledge(message: string): string | null {
  const kb = loadKnowledgeBase();
  if (!kb) return null;

  const text = message.toLowerCase();

  // Find matching help entry
  for (const [, entry] of Object.entries(kb.siteHelp)) {
    const hasMatch = entry.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    if (hasMatch) {
      return entry.shortAnswer;
    }
  }

  // Return general help if no specific match
  return kb.siteHelp.general?.shortAnswer || null;
}

/**
 * Get detailed site help with quick links
 */
export function getDetailedSiteHelp(message: string): SiteHelpEntry | null {
  const kb = loadKnowledgeBase();
  if (!kb) return null;

  const text = message.toLowerCase();

  // Find matching help entry
  for (const [, entry] of Object.entries(kb.siteHelp)) {
    const hasMatch = entry.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    if (hasMatch) {
      return entry;
    }
  }

  // Return general help entry
  return kb.siteHelp.general || null;
}

/**
 * Get intent examples from knowledge base
 */
export function getIntentExamples(intent: string): string[] {
  const kb = loadKnowledgeBase();
  if (!kb || !kb.intents[intent]) {
    return [];
  }
  return kb.intents[intent].examples;
}

/**
 * Build INTENT_CORPUS from knowledge base
 */
export function buildIntentCorpus(): Record<string, string[]> {
  const kb = loadKnowledgeBase();
  if (!kb) {
    return {};
  }

  const corpus: Record<string, string[]> = {};
  for (const [intent, metadata] of Object.entries(kb.intents)) {
    corpus[intent] = metadata.examples;
  }
  return corpus;
}

/**
 * Get response template based on style
 */
export function getResponseTemplate(
  intentType: 'greeting' | 'fallback',
  style: 'casual' | 'formal'
): string[] {
  const kb = loadKnowledgeBase();
  if (!kb || !kb.responseTemplates[intentType]) {
    return [];
  }
  return kb.responseTemplates[intentType][style] || [];
}

/**
 * Get category synonyms
 */
export function getCategorySynonyms(): Record<string, string> {
  const kb = loadKnowledgeBase();
  return kb?.categorySynonyms || {};
}

/**
 * Get color synonyms
 */
export function getColorSynonyms(): Record<string, string> {
  const kb = loadKnowledgeBase();
  return kb?.colorSynonyms || {};
}

/**
 * Get stopwords
 */
export function getStopwords(): Set<string> {
  const kb = loadKnowledgeBase();
  return new Set(kb?.stopwords || []);
}

/**
 * Get category hints
 */
export function getCategoryHints(): string[] {
  const kb = loadKnowledgeBase();
  return kb?.categoryHints || [];
}

/**
 * Get color hints
 */
export function getColorHints(): string[] {
  const kb = loadKnowledgeBase();
  return kb?.colorHints || [];
}
