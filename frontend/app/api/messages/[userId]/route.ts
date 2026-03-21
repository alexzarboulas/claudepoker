import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { directMessages, friendships } from '@/lib/db/schema';
import { and, asc, eq, or } from 'drizzle-orm';
import { triggerUserEvent } from '@/lib/pusher';
import { randomUUID } from 'crypto';

async function isFriend(myId: string, otherId: string): Promise<boolean> {
  const [f] = await db.select().from(friendships).where(
    and(
      or(
        and(eq(friendships.requesterId, myId), eq(friendships.addresseeId, otherId)),
        and(eq(friendships.requesterId, otherId), eq(friendships.addresseeId, myId))
      ),
      eq(friendships.status, 'accepted')
    )
  );
  return !!f;
}

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const myId = (session.user as { id?: string }).id!;
  const otherId = params.userId;

  if (!await isFriend(myId, otherId)) return NextResponse.json({ error: 'Not friends' }, { status: 403 });

  const messages = await db.select().from(directMessages).where(
    or(
      and(eq(directMessages.senderId, myId), eq(directMessages.receiverId, otherId)),
      and(eq(directMessages.senderId, otherId), eq(directMessages.receiverId, myId))
    )
  ).orderBy(asc(directMessages.createdAt)).limit(50);

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const myId = (session.user as { id?: string }).id!;
  const receiverId = params.userId;

  if (!await isFriend(myId, receiverId)) return NextResponse.json({ error: 'Not friends' }, { status: 403 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  const id = randomUUID();
  const msg = { id, senderId: myId, receiverId, content: content.trim(), createdAt: new Date(), readAt: null };
  await db.insert(directMessages).values(msg);

  await triggerUserEvent(receiverId, 'new-message', { ...msg, createdAt: msg.createdAt.toISOString() });

  return NextResponse.json(msg);
}
