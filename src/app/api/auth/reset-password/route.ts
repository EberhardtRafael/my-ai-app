import { NextResponse } from 'next/server';
import { verifyPasswordResetToken } from '@/utils/resetToken';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token || '');
    const password = String(body?.password || '');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const verification = verifyPasswordResetToken(token);

    if (!verification.valid || !verification.email) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation ResetUserPassword($email: String!, $password: String!) {
          resetUserPassword(email: $email, password: $password)
        }`,
        variables: {
          email: verification.email,
          password,
        },
      }),
      cache: 'no-store',
    });

    const payload = await response.json();

    if (!response.ok || payload?.errors?.length || !payload?.data?.resetUserPassword) {
      return NextResponse.json({ error: 'Unable to reset password' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
