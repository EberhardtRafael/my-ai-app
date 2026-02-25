import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');

    if (!repo) {
      return NextResponse.json({ error: 'Missing required query param: repo' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const githubToken = cookieStore.get('github_token')?.value;

    if (!githubToken) {
      return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 });
    }

    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(
      `${pythonBackendUrl}/api/tickets/stats?repo=${encodeURIComponent(repo)}&github_token=${encodeURIComponent(githubToken)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch ticket stats' },
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
