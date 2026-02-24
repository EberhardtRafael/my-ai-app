import type React from 'react';

type EmptyStateProps = {
  icon: React.ReactNode;
  message: string;
  className?: string;
};

const TicketEmptyState: React.FC<EmptyStateProps> = ({ icon, message, className = '' }) => {
  return (
    <div className={`text-center text-gray-500 py-12 ${className}`}>
      <div className="mx-auto mb-4 text-gray-400">{icon}</div>
      <p>{message}</p>
    </div>
  );
};

export default TicketEmptyState;
