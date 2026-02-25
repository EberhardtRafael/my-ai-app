export type AssistantQuickLink = {
  label: string;
  href: string;
  kind: 'product' | 'location';
};

export type AssistantProduct = {
  id: number;
  name: string;
  category: string;
  price: number;
  ratingAvg?: number;
};

export type AssistantResponse = {
  reply: string;
  intent: string;
  confidence: number;
  suggestions: string[];
  quickLinks?: AssistantQuickLink[];
  products?: AssistantProduct[];
};

export type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  quickLinks?: AssistantQuickLink[];
};
