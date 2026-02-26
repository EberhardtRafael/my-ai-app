import crypto from 'node:crypto';

export const GUEST_SESSION_COOKIE = 'guest_session';

const GUEST_TOKEN_PURPOSE = 'guest-session';

type GuestPayload = {
  userId: number;
  exp: number;
  purpose: string;
};

const getSecret = (): string => process.env.NEXTAUTH_SECRET || 'dev-guest-secret-change-me';

const toBase64Url = (value: string): string => Buffer.from(value).toString('base64url');

const fromBase64Url = (value: string): string => Buffer.from(value, 'base64url').toString('utf-8');

const sign = (payload: string): string =>
  crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');

export const createGuestSessionToken = (userId: number, expiresInDays = 30): string => {
  const payload: GuestPayload = {
    userId,
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    purpose: GUEST_TOKEN_PURPOSE,
  };

  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadEncoded);

  return `${payloadEncoded}.${signature}`;
};

export const verifyGuestSessionToken = (token: string): { valid: boolean; userId?: number } => {
  const [payloadEncoded, signature] = token.split('.');

  if (!payloadEncoded || !signature) {
    return { valid: false };
  }

  const expectedSignature = sign(payloadEncoded);

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return { valid: false };
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadEncoded)) as GuestPayload;

    if (payload.purpose !== GUEST_TOKEN_PURPOSE) {
      return { valid: false };
    }

    if (Date.now() > payload.exp) {
      return { valid: false };
    }

    if (!Number.isInteger(payload.userId) || payload.userId <= 0) {
      return { valid: false };
    }

    return { valid: true, userId: payload.userId };
  } catch {
    return { valid: false };
  }
};
