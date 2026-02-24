import Link from 'next/link';
import type React from 'react';
import Button from './Button';

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionLabel, actionHref }) => {
  return (
    <div className="bg-gray-50 p-12 rounded-lg shadow text-center">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
