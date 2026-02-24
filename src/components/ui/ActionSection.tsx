import type React from 'react';

type ActionSectionProps = {
  content: React.ReactNode;
  actions: React.ReactNode;
  layout?: 'vertical' | 'horizontal';
  className?: string;
};

export default function ActionSection({
  content,
  actions,
  layout = 'vertical',
  className = '',
}: ActionSectionProps) {
  if (layout === 'horizontal') {
    return (
      <div className={`flex justify-between items-start ${className}`}>
        <div className="flex-1">{content}</div>
        <div className="flex gap-2 ml-4">{actions}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {content}
      <div className="flex gap-2">{actions}</div>
    </div>
  );
}
