import type React from 'react';
import InfoMessage from './InfoMessage';

type PageShellProps = {
  title: string;
  requireAuth?: boolean;
  isAuthenticated?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
};

const PageShell: React.FC<PageShellProps> = ({
  title,
  requireAuth = false,
  isAuthenticated = true,
  loading = false,
  children,
  headerAction,
}) => {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          {headerAction}
        </div>

        {requireAuth && !isAuthenticated ? (
          <InfoMessage
            message="Please sign in to view this page."
            linkText="Sign in here"
            linkHref="/auth/signin"
          />
        ) : loading ? (
          <p>Loading...</p>
        ) : (
          children
        )}
      </div>
    </main>
  );
};

export default PageShell;
