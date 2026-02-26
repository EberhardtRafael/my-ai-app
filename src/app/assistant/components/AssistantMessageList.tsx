import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import StatusMessage from '@/components/ui/StatusMessage';
import type { ChatMessage } from '../types';
import AssistantQuickLinksList from './AssistantQuickLinksList';

type AssistantMessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  fill?: boolean;
  className?: string;
};

export default function AssistantMessageList({
  messages,
  isLoading,
  fill = false,
  className = '',
}: AssistantMessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    return () => cancelAnimationFrame(frame);
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className={`${fill ? 'flex-1 min-h-0' : 'h-[460px]'} space-y-3 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white p-4 ${className}`}
    >
      {messages.map((message) => (
        <div key={message.id}>
          <div
            className={`whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'ml-10 bg-gray-900 text-white'
                : 'mr-10 bg-gray-100 text-gray-900'
            }`}
          >
            {message.content}
          </div>

          {message.role === 'assistant' && message.quickLinks && message.quickLinks.length > 0 && (
            <div className="mr-10 mt-2">
              <AssistantQuickLinksList quickLinks={message.quickLinks} compact />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="mr-10 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-900">
          <StatusMessage
            icon={<Icon name="hourglass" size={18} />}
            message="Thinking..."
            variant="info"
          />
        </div>
      )}
    </div>
  );
}
