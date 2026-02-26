'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import AssistantFloatingWidget from './AssistantFloatingWidget';
import Header from './Header';
import LoadingState from './LoadingState';

export default function Auth({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ['/auth/signin', '/auth/forgot-password', '/auth/reset-password'];
  const isPublicPath =
    pathname === '/' ||
    pathname === '/plp' ||
    pathname === '/cart' ||
    pathname === '/checkout' ||
    pathname.startsWith('/pdp/') ||
    publicPaths.includes(pathname);

  useEffect(() => {
    if (status === 'unauthenticated' && !isPublicPath) {
      router.replace('/auth/signin');
    }
  }, [status, router, isPublicPath]);

  const isLoading = status === 'loading';
  const isUnauthenticated = status === 'unauthenticated' && !isPublicPath;
  const showHeader = !publicPaths.includes(pathname);

  if (isLoading) return <LoadingState />;
  if (isUnauthenticated) return null;

  return (
    <>
      {showHeader && <Header />}
      {children}
      <AssistantFloatingWidget />
    </>
  );
}
