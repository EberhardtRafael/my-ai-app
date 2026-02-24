import type React from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  ...rest
}) => {
  const baseStyles = 'px-4 py-2 rounded-xl transition cursor-pointer disabled:cursor-default';

  const variantStyles = {
    primary:
      'bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white disabled:bg-gray-300 disabled:text-gray-100',
    secondary:
      'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
    ghost: 'text-gray-600 hover:text-gray-800 hover:brightness-75 disabled:text-gray-400',
  };

  return (
    <button className={twMerge(`${baseStyles} ${variantStyles[variant]} ${className}`)} {...rest}>
      {children}
    </button>
  );
};

export default Button;
