import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  createGuestSessionToken,
  GUEST_SESSION_COOKIE,
  verifyGuestSessionToken,
} from '@/utils/guestSession';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const createGuestBackendUser = async (): Promise<number | null> => {
  const unique = crypto.randomUUID().replace(/-/g, '');
  const username = `guest_${unique.slice(0, 12)}`;
  const email = `${username}@guest.local`;
  const password = `${crypto.randomBytes(16).toString('hex')}Aa1!`;

  const response = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation CreateUser($username: String!, $email: String!, $password: String!) {
        createUser(username: $username, email: $email, password: $password) {
          id
        }
      }`,
      variables: {
        username,
        email,
        password,
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.data?.createUser?.id || null;
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return NextResponse.json({ userId: session.user.id, isGuest: false });
  }

  const { searchParams } = new URL(request.url);
  const shouldCreate = searchParams.get('create') !== 'false';

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

  if (existingToken) {
    const verified = verifyGuestSessionToken(existingToken);
    if (verified.valid && verified.userId) {
      return NextResponse.json({ userId: verified.userId.toString(), isGuest: true });
    }
  }

  if (!shouldCreate) {
    return NextResponse.json({ userId: null, isGuest: false });
  }

  const guestUserId = await createGuestBackendUser();

  if (!guestUserId) {
    return NextResponse.json({ error: 'Failed to initialize guest session' }, { status: 500 });
  }

  const token = createGuestSessionToken(guestUserId);
  const response = NextResponse.json({ userId: guestUserId.toString(), isGuest: true });

  response.cookies.set({
    name: GUEST_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: GUEST_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
