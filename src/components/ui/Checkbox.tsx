import type React from 'react';
import { twMerge } from 'tailwind-merge';

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
};

export default function Checkbox({
  checked,
  onCheckedChange,
  label,
  size = 'md',
  className = '',
  disabled = false,
}: CheckboxProps) {
  const boxSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const checkSize = size === 'sm' ? 'h-2 w-1' : 'h-2.5 w-1.5';

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          onCheckedChange(!checked);
        }
      }}
      className={twMerge(
        'inline-flex items-center gap-2 rounded-lg text-sm leading-5 transition disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    >
      <span
        className={twMerge(
          'flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 transition',
          boxSize,
          checked && 'border-gray-500 bg-gray-500'
        )}
      >
        <span
          className={twMerge(
            'rotate-45 border-b border-r border-white transition',
            checkSize,
            checked ? 'opacity-100' : 'opacity-0'
          )}
        />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}
