import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserEmailFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const jwtEmail = await getUserEmailFromRequest(request);
    if (jwtEmail) {
      const user = await db.user.upsert({
        where: { email: jwtEmail },
        update: {},
        create: { email: jwtEmail },
      });
      return NextResponse.json({ user: { id: user.id, email: user.email } });
    }

    const body = await request.json().catch(() => ({}));
    const email = body?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {},
      create: { email: email.toLowerCase().trim() },
    });

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Error in auth:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
