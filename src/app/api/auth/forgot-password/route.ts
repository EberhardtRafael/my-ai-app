import { NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/utils/resetToken';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    const userLookup = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query UserByEmail($email: String!) {
          userByEmail(email: $email) {
            id
            email
          }
        }`,
        variables: { email },
      }),
      cache: 'no-store',
    });

    if (!userLookup.ok) {
      return NextResponse.json({ message: 'If the account exists, a reset link was created.' });
    }

    const lookupData = await userLookup.json();
    const user = lookupData?.data?.userByEmail;

    if (!user) {
      return NextResponse.json({ message: 'If the account exists, a reset link was created.' });
    }

    const token = createPasswordResetToken(email, 30);
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${encodeURIComponent(token)}`;

    // TODO: Wire this to an email provider in production.
    // Development fallback returns the link in response for immediate usage.
    return NextResponse.json({
      message: 'Password reset link generated.',
      resetLink,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}
