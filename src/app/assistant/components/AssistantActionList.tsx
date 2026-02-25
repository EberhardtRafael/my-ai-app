import type { ReactNode } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export type AssistantActionListItem = {
  key: string;
  label: string;
  href?: string;
  prefix?: ReactNode;
  onClick?: () => void;
};

type AssistantActionListProps = {
  items: AssistantActionListItem[];
  compact?: boolean;
  disabled?: boolean;
};

export default function AssistantActionList({
  items,
  compact = false,
  disabled = false,
}: AssistantActionListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'space-y-2'}>
      {items.map((item) => {
        const button = (
          <Button
            variant="secondary"
            className={compact ? 'px-3 py-1 text-xs' : 'w-full justify-start text-left'}
            onClick={item.onClick}
            disabled={disabled}
          >
            {item.prefix}
            {item.label}
          </Button>
        );

        if (item.href) {
          return (
            <Link href={item.href} key={item.key}>
              {button}
            </Link>
          );
        }

        return <span key={item.key}>{button}</span>;
      })}
    </div>
  );
}