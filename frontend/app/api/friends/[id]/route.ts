import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const myId = (session.user as { id?: string }).id!;

  const { action } = await req.json();
  const [friendship] = await db.select().from(friendships).where(eq(friendships.id, params.id));
  if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (friendship.addresseeId !== myId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (action === 'accept') {
    await db.update(friendships).set({ status: 'accepted' }).where(eq(friendships.id, params.id));
  } else if (action === 'decline') {
    await db.update(friendships).set({ status: 'declined' }).where(eq(friendships.id, params.id));
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
