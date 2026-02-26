import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import {
  DEV_MODE_COOKIE_NAME,
  hasDeveloperAccess,
  isDeveloperModeForced,
  isDeveloperModeToggleAvailable,
} from '@/utils/devMode';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const toPayload = (cookieValue: string | undefined, role: string | null | undefined) => {
  const available = isDeveloperModeToggleAvailable(role);
  const forced = isDeveloperModeForced();
  const enabled = hasDeveloperAccess({ role, cookieValue });

  return {
    available,
    forced,
    enabled,
    role: role || 'user',
  };
};

export async function GET() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(DEV_MODE_COOKIE_NAME)?.value;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  return NextResponse.json(toPayload(cookieValue, role));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  const available = isDeveloperModeToggleAvailable(role);
  const forced = isDeveloperModeForced();

  if (!available) {
    return NextResponse.json(
      { error: 'Developer mode is not available for this role' },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  const existingCookie = cookieStore.get(DEV_MODE_COOKIE_NAME)?.value;

  if (forced) {
    return NextResponse.json(toPayload(existingCookie, role));
  }

  const body = await request.json().catch(() => null);
  const enabled = Boolean(body?.enabled);

  const response = NextResponse.json(toPayload(enabled ? 'true' : undefined, role));

  response.cookies.set({
    name: DEV_MODE_COOKIE_NAME,
    value: enabled ? 'true' : 'false',
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
