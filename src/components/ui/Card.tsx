import type React from 'react';

type CardProps = {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ header, children, footer, className = '' }) => {
  return (
    <div className={`bg-gray-50 p-6 rounded-lg shadow ${className}`}>
      {header && <div className="mb-4">{header}</div>}
      <div className="flex-1">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};

export default Card;
