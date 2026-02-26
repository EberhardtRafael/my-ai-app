import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = Number.parseInt(session?.user?.id || '', 10);

    if (!Number.isInteger(sessionUserId) || sessionUserId <= 0) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { query, variables } = body;

    if (query.includes('userId:') && !query.includes('$userId')) {
      return NextResponse.json(
        { error: 'Literal userId is not allowed. Use variables.userId.' },
        { status: 400 }
      );
    }

    const effectiveVariables = variables && typeof variables === 'object' ? { ...variables } : {};
    if (query.includes('$userId')) {
      effectiveVariables.userId = sessionUserId;
    }

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: effectiveVariables }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
