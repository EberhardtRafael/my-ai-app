import { NextResponse } from 'next/server';
import { setRoleOverrideForIdentity } from '@/utils/serverRoleOverrides';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const DEV_INVITE_CODE = process.env.DEV_INVITE_CODE || '';

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userName = String(body?.userName || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const devAccessCode = String(body?.devAccessCode || '').trim();

    if (!userName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (userName.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (devAccessCode && (!DEV_INVITE_CODE || devAccessCode !== DEV_INVITE_CODE)) {
      return NextResponse.json({ error: 'Invalid developer access code' }, { status: 403 });
    }

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation CreateUser($username: String!, $email: String!, $password: String!) {
          createUser(username: $username, email: $email, password: $password) {
            id
            username
            email
          }
        }`,
        variables: {
          username: userName,
          email,
          password,
        },
      }),
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok || result?.errors?.length) {
      const message = result?.errors?.[0]?.message || 'Unable to create account';
      const isConflict = /already in use|unique/i.test(message);

      return NextResponse.json({ error: message }, { status: isConflict ? 409 : 400 });
    }

    const createdUser = result.data.createUser;

    if (devAccessCode && DEV_INVITE_CODE && devAccessCode === DEV_INVITE_CODE) {
      await setRoleOverrideForIdentity({
        id: String(createdUser.id),
        username: createdUser.username,
        email: createdUser.email,
        role: 'dev',
      });
    }

    return NextResponse.json({
      user: createdUser,
      role: devAccessCode && DEV_INVITE_CODE && devAccessCode === DEV_INVITE_CODE ? 'dev' : 'user',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected signup error' },
      { status: 500 }
    );
  }
}
