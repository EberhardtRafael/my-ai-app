import type { AssistantQuickLink } from '../types';
import AssistantActionList from './AssistantActionList';

type AssistantQuickLinksListProps = {
  quickLinks: AssistantQuickLink[];
  compact?: boolean;
  disabled?: boolean;
};

export default function AssistantQuickLinksList({
  quickLinks,
  compact = false,
  disabled = false,
}: AssistantQuickLinksListProps) {
  if (quickLinks.length === 0) {
    return null;
  }

  return (
    <AssistantActionList
      items={quickLinks.map((link) => ({
        key: `${link.href}-${link.label}`,
        label: link.label,
        href: link.href,
        prefix: link.kind === 'product' ? '🛍️ ' : '📍 ',
      }))}
      compact={compact}
      disabled={disabled}
    />
  );
}
