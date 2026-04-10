import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserEmailFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const email = await getUserEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Error in auth:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
