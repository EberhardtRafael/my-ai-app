import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, task_description, context } = body;

    // Get GitHub token from cookie
    const cookieStore = await cookies();
    const githubToken = cookieStore.get('github_token')?.value;

    if (!githubToken) {
      return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 });
    }

    // Validate inputs
    if (!repo || !task_description) {
      return NextResponse.json(
        { error: 'Missing required fields: repo and task_description' },
        { status: 400 }
      );
    }

    // Call Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonBackendUrl}/api/tickets/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo,
        github_token: githubToken,
        task_description,
        context: context || 'full-stack',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate ticket');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ticket generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
