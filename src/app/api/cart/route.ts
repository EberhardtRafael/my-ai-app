import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, variables } = body;

    // Validate that this is a cart-related query or mutation
    if (!query.includes('cart') && !query.includes('Cart') && !query.includes('addToCart') && !query.includes('updateCartItem') && !query.includes('removeFromCart') && !query.includes('clearCart')) {
      return NextResponse.json(
        { error: 'This endpoint only handles cart operations' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
