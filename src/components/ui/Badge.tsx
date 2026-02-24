import type React from 'react';
import { twMerge } from 'tailwind-merge';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'neutral',
  ...rest
}) => {
  const variantStyles = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={twMerge(
        `text-xs px-2 py-0.5 rounded-full font-light ${variantStyles[variant]} ${className}`
      )}
      {...rest}
    >
      {children}
    </span>
  );
};

export default Badge;
