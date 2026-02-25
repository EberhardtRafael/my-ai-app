'use client';

import { useState } from 'react';
import Button from './Button';
import Icon from './Icon';

type CollapsibleFilterSectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export default function CollapsibleFilterSection({
  title,
  children,
  defaultOpen = true,
}: CollapsibleFilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="px-0 py-2 first:pt-0 last:pb-0">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((current) => !current)}
        className="w-full rounded-lg border-0 bg-gray-50 px-3 py-1.5 text-left text-base font-normal text-gray-800 shadow-sm hover:bg-gray-100"
      >
        <span className="flex w-full items-center justify-between">
          <span>{title}</span>
          <span className="flex h-6 w-6 items-center justify-center text-gray-500">
            <Icon name={open ? 'minus' : 'plus'} size={20} />
          </span>
        </span>
      </Button>
      {open && <div className="pt-2">{children}</div>}
    </section>
  );
}
