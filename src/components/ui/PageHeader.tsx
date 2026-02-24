import type React from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, className = '' }) => {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      {description && <p className="text-gray-600">{description}</p>}
    </div>
  );
};

export default PageHeader;
