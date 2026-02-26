import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { setRoleOverrideForIdentity } from '@/utils/serverRoleOverrides';

const DEV_INVITE_CODE = process.env.DEV_INVITE_CODE || '';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const devAccessCode = String(body?.devAccessCode || '').trim();

  if (!devAccessCode) {
    return NextResponse.json({ error: 'Developer access code is required' }, { status: 400 });
  }

  if (!DEV_INVITE_CODE || devAccessCode !== DEV_INVITE_CODE) {
    return NextResponse.json({ error: 'Invalid developer access code' }, { status: 403 });
  }

  await setRoleOverrideForIdentity({
    id: session.user.id,
    username: session.user.name,
    email: session.user.email,
    role: 'dev',
  });

  return NextResponse.json({ role: 'dev' });
}
