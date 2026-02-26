import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const githubToken = cookieStore.get('github_token')?.value;
  const githubUsername = cookieStore.get('github_username')?.value;

  return NextResponse.json({
    connected: Boolean(githubToken),
    username: githubUsername || '',
  });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: 'github_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set({
    name: 'github_username',
    value: '',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
