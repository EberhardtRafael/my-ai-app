'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type React from 'react';

type DropdownItem = {
  label: string;
  onClick: () => void;
};

type DropdownProps = {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
};

const Dropdown: React.FC<DropdownProps> = ({ trigger, items, className = '' }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <div className={className}>{trigger}</div>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[12rem] bg-gray-50 rounded-md shadow-lg border border-gray-200 py-1 z-50"
          sideOffset={8}
          align="end"
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              onClick={item.onClick}
              className="px-4 py-2 text-sm font-light text-gray-700 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default Dropdown;
