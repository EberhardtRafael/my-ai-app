'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import Header from './Header';

export default function Auth({ children }: { children: React.ReactNode }) {
  const loadingText = 'Loading...';
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/auth/signin') {
      router.replace('/auth/signin');
    }
  }, [status, router, pathname]);

  if (status === 'loading')
    return <div className="flex min-h-screen items-center justify-center">{loadingText}</div>;
  if (status === 'unauthenticated' && pathname !== '/auth/signin') return null;
  return (
    <>
      {pathname !== '/auth/signin' && <Header />}
      {children}
    </>
  );
}
