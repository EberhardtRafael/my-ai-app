'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import Header from './Header';
import LoadingState from './LoadingState';

export default function Auth({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/auth/signin') {
      router.replace('/auth/signin');
    }
  }, [status, router, pathname]);

  const isLoading = status === 'loading';
  const isUnauthenticated = status === 'unauthenticated' && pathname !== '/auth/signin';
  const showHeader = pathname !== '/auth/signin';

  if (isLoading) return <LoadingState />;
  if (isUnauthenticated) return null;

  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  );
}
