import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships } from '@/lib/db/schema';
import { and, eq, or } from 'drizzle-orm';
import { triggerUserEvent } from '@/lib/pusher';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const myId = (session.user as { id?: string }).id!;

  const { addresseeId } = await req.json();
  if (!addresseeId || addresseeId === myId) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  // Check no existing friendship
  const [existing] = await db.select().from(friendships).where(
    or(
      and(eq(friendships.requesterId, myId), eq(friendships.addresseeId, addresseeId)),
      and(eq(friendships.requesterId, addresseeId), eq(friendships.addresseeId, myId))
    )
  );
  if (existing) return NextResponse.json({ error: 'Already exists' }, { status: 409 });

  const id = randomUUID();
  await db.insert(friendships).values({ id, requesterId: myId, addresseeId, status: 'pending' });

  // Notify addressee via Pusher
  await triggerUserEvent(addresseeId, 'friend-request', { from: myId, friendshipId: id });

  return NextResponse.json({ id });
}
