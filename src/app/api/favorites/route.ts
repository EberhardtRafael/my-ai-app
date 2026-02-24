import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    // Validate that this is a favorites query or mutation
    if (!query.includes('favorite') && !query.includes('Favorite')) {
      return NextResponse.json(
        { error: 'This endpoint only handles favorites operations' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const { data, errors } = await response.json();

    if (errors && errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
