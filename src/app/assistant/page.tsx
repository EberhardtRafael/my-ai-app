'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import InfoMessage from '@/components/ui/InfoMessage';
import PageHeader from '@/components/ui/PageHeader';
import Textarea from '@/components/ui/Textarea';
import AssistantMessageList from './components/AssistantMessageList';
import AssistantQuickLinksList from './components/AssistantQuickLinksList';
import AssistantSuggestionsList from './components/AssistantSuggestionsList';
import AssistantTopProductsList from './components/AssistantTopProductsList';
import type { AssistantResponse, ChatMessage } from './types';

const ASSISTANT_SESSION_STORAGE_KEY = 'assistant-chat-session-v1';

type AssistantSessionState = {
  input: string;
  messages: ChatMessage[];
  messageId: number;
  lastResponse: AssistantResponse | null;
};

export default function AssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        'I am your free site assistant. Ask me about products, pricing, recommendations, orders, cart, favorites, or tickets.',
    },
  ]);
  const [messageId, setMessageId] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AssistantResponse | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ASSISTANT_SESSION_STORAGE_KEY);
      if (!raw) {
        setIsHydrated(true);
        return;
      }

      const saved = JSON.parse(raw) as Partial<AssistantSessionState>;
      if (typeof saved.input === 'string') {
        setInput(saved.input);
      }
      if (Array.isArray(saved.messages) && saved.messages.length > 0) {
        setMessages(saved.messages);
      }
      if (typeof saved.messageId === 'number' && Number.isFinite(saved.messageId)) {
        setMessageId(saved.messageId);
      }
      if (saved.lastResponse) {
        setLastResponse(saved.lastResponse as AssistantResponse);
      }
    } catch (error) {
      console.error('Failed to restore assistant session state:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const state: AssistantSessionState = {
      input,
      messages,
      messageId,
      lastResponse,
    };

    try {
      sessionStorage.setItem(ASSISTANT_SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist assistant session state:', error);
    }
  }, [input, messages, messageId, lastResponse, isHydrated]);

  const sendMessage = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || isLoading) return;

    const userId = messageId;
    const assistantId = messageId + 1;
    setMessageId((prev) => prev + 2);

    setMessages((prev) => [...prev, { id: userId, role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = (await response.json()) as AssistantResponse;

      if (!response.ok) {
        throw new Error(
          (data as unknown as { error?: string }).error || 'Assistant request failed'
        );
      }

      setLastResponse(data);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: data.reply,
          quickLinks: data.quickLinks || [],
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: `I hit an error: ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-8 max-w-5xl">
      <PageHeader
        title="Site Assistant"
        description="Deterministic, zero-cost assistant for product discovery and site help"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="mb-4 text-lg font-semibold">Conversation</div>

          <AssistantMessageList messages={messages} isLoading={isLoading} className="mb-4" />

          <div className="space-y-3">
            <Textarea
              id="assistant-input"
              label="Ask the assistant"
              placeholder="Example: Show me good jackets under $120 and explain why"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-[110px]"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 text-lg font-semibold">Insights</div>

          {lastResponse ? (
            <div className="space-y-4 text-sm">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="block">
                  <span className="font-semibold">Intent:</span> {lastResponse.intent}
                </span>
                <span className="block mt-1">
                  <span className="font-semibold">Confidence:</span>{' '}
                  {Math.round(lastResponse.confidence * 100)}%
                </span>
              </div>

              <AssistantTopProductsList products={lastResponse.products || []} />

              <AssistantSuggestionsList
                suggestions={lastResponse.suggestions}
                isLoading={isLoading}
                onSuggestionClick={sendMessage}
              />

              {lastResponse.quickLinks && lastResponse.quickLinks.length > 0 && (
                <div>
                  <div className="mb-2 font-semibold">Quick links</div>
                  <AssistantQuickLinksList
                    quickLinks={lastResponse.quickLinks}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          ) : (
            <InfoMessage
              message="Send a message to see intent confidence, retrieved products, and suggested prompts."
              className="text-sm"
            />
          )}
        </Card>
      </div>
    </main>
  );
}
