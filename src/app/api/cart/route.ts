import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GUEST_SESSION_COOKIE, verifyGuestSessionToken } from '@/utils/guestSession';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const resolveActorUserId = async (): Promise<number | null> => {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const parsedSessionUserId = Number.parseInt(session.user.id, 10);
    if (Number.isInteger(parsedSessionUserId) && parsedSessionUserId > 0) {
      return parsedSessionUserId;
    }
  }

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

  if (!guestToken) {
    return null;
  }

  const verifiedGuest = verifyGuestSessionToken(guestToken);
  if (!verifiedGuest.valid || !verifiedGuest.userId) {
    return null;
  }

  return verifiedGuest.userId;
};

export async function POST(req: Request) {
  try {
    const actorUserId = await resolveActorUserId();
    if (!actorUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { query, variables } = body;

    // Validate that this is a cart-related query or mutation
    if (
      !query.includes('cart') &&
      !query.includes('Cart') &&
      !query.includes('addToCart') &&
      !query.includes('updateCartItem') &&
      !query.includes('removeFromCart') &&
      !query.includes('clearCart')
    ) {
      return NextResponse.json(
        { error: 'This endpoint only handles cart operations' },
        { status: 400 }
      );
    }

    if (query.includes('userId:') && !query.includes('$userId')) {
      return NextResponse.json(
        { error: 'Literal userId is not allowed. Use variables.userId.' },
        { status: 400 }
      );
    }

    const effectiveVariables = variables && typeof variables === 'object' ? { ...variables } : {};

    if (query.includes('$userId')) {
      effectiveVariables.userId = actorUserId;
    }

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: effectiveVariables }),
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
