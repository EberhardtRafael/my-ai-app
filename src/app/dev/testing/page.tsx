import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DEV_MODE_COOKIE_NAME, hasDeveloperAccess } from '@/utils/devMode';
import TestingDashboardClient from './testing-dashboard-client';

export default async function DevTestingPage() {
  const cookieStore = await cookies();
  const devModeCookie = cookieStore.get(DEV_MODE_COOKIE_NAME)?.value;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!hasDeveloperAccess({ role, cookieValue: devModeCookie })) {
    notFound();
  }

  return <TestingDashboardClient />;
}
