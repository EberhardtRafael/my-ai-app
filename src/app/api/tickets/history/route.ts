import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DEV_MODE_COOKIE_NAME, hasDeveloperAccess } from '@/utils/devMode';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const devModeCookie = cookieStore.get(DEV_MODE_COOKIE_NAME)?.value;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!hasDeveloperAccess({ role, cookieValue: devModeCookie })) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');

    if (!repo) {
      return NextResponse.json({ error: 'Missing required query param: repo' }, { status: 400 });
    }

    const githubToken = cookieStore.get('github_token')?.value;

    if (!githubToken) {
      return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 });
    }

    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(
      `${pythonBackendUrl}/api/tickets/history?repo=${encodeURIComponent(repo)}&github_token=${encodeURIComponent(githubToken)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch ticket history' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
