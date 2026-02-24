import type React from 'react';

type StatusMessageProps = {
  icon: React.ReactNode;
  message: string;
  variant?: 'success' | 'info' | 'warning' | 'error';
  className?: string;
};

export default function StatusMessage({
  icon,
  message,
  variant = 'info',
  className = '',
}: StatusMessageProps) {
  const variantClasses = {
    success: 'text-green-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <div className={`flex items-center gap-2 ${variantClasses[variant]} ${className}`}>
      {icon}
      <span className="font-medium">{message}</span>
    </div>
  );
}
