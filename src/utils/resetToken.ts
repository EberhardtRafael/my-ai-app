import crypto from 'node:crypto';

const TOKEN_PURPOSE = 'password-reset';

type ResetPayload = {
  email: string;
  exp: number;
  purpose: string;
};

const getSecret = (): string => process.env.NEXTAUTH_SECRET || 'dev-reset-secret-change-me';

const toBase64Url = (value: string): string => Buffer.from(value).toString('base64url');

const fromBase64Url = (value: string): string => Buffer.from(value, 'base64url').toString('utf-8');

const sign = (payload: string): string =>
  crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');

export const createPasswordResetToken = (email: string, expiresInMinutes = 30): string => {
  const payload: ResetPayload = {
    email,
    exp: Date.now() + expiresInMinutes * 60 * 1000,
    purpose: TOKEN_PURPOSE,
  };

  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadEncoded);

  return `${payloadEncoded}.${signature}`;
};

export const verifyPasswordResetToken = (token: string): { valid: boolean; email?: string } => {
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
    const payload = JSON.parse(fromBase64Url(payloadEncoded)) as ResetPayload;

    if (payload.purpose !== TOKEN_PURPOSE) {
      return { valid: false };
    }

    if (Date.now() > payload.exp) {
      return { valid: false };
    }

    if (!payload.email) {
      return { valid: false };
    }

    return { valid: true, email: payload.email };
  } catch {
    return { valid: false };
  }
};
