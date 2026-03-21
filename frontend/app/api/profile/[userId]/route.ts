import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships, playerStats, users } from '@/lib/db/schema';
import { and, eq, or } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  const myId = session?.user ? (session.user as { id?: string }).id : null;
  const targetId = params.userId;

  const [user] = await db.select({
    id: users.id,
    username: users.username,
    nickname: users.nickname,
    avatarUrl: users.avatarUrl,
    lastSeen: users.lastSeen,
  }).from(users).where(eq(users.id, targetId));

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let isFriend = false;
  if (myId && myId !== targetId) {
    const [friendship] = await db.select().from(friendships).where(
      and(
        or(
          and(eq(friendships.requesterId, myId), eq(friendships.addresseeId, targetId)),
          and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, myId))
        ),
        eq(friendships.status, 'accepted')
      )
    );
    isFriend = !!friendship;
  }

  let stats = null;
  if (isFriend || myId === targetId) {
    const [s] = await db.select().from(playerStats).where(eq(playerStats.userId, targetId));
    stats = s ?? null;
  }

  return NextResponse.json({ user, stats, isFriend, isMe: myId === targetId });
}
