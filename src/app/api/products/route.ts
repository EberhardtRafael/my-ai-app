import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const { query, variables } = await req.json();

    // Validate that this is a products or recommendations query
    const queryLower = query.toLowerCase();
    if (!queryLower.includes('product') && !queryLower.includes('recommendation')) {
      return NextResponse.json(
        { error: 'This endpoint only handles product and recommendation operations' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error('Backend returned error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Backend response:', text);
      return NextResponse.json(
        {
          error: `Backend error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json({ error: result.errors }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
