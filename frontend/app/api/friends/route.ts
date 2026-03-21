import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships, users } from '@/lib/db/schema';
import { and, eq, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const myId = (session.user as { id?: string }).id!;

  const allFriendships = await db.select().from(friendships).where(
    and(
      or(eq(friendships.requesterId, myId), eq(friendships.addresseeId, myId)),
      or(eq(friendships.status, 'accepted'), eq(friendships.status, 'pending'))
    )
  );

  const accepted = allFriendships.filter(f => f.status === 'accepted');
  const pending = allFriendships.filter(f => f.status === 'pending' && f.addresseeId === myId);

  const friendIds = accepted.map(f => f.requesterId === myId ? f.addresseeId : f.requesterId);
  const pendingIds = pending.map(f => f.requesterId);

  const allIds = [...new Set([...friendIds, ...pendingIds])];
  const userMap: Record<string, { id: string; username: string; nickname: string | null; avatarUrl: string | null; lastSeen: Date | null }> = {};

  if (allIds.length > 0) {
    const userRows = await Promise.all(allIds.map(id =>
      db.select({ id: users.id, username: users.username, nickname: users.nickname, avatarUrl: users.avatarUrl, lastSeen: users.lastSeen })
        .from(users).where(eq(users.id, id))
    ));
    userRows.forEach(rows => rows.forEach(u => { userMap[u.id] = u; }));
  }

  return NextResponse.json({
    friends: friendIds.map(id => ({ ...userMap[id], friendshipId: accepted.find(f => f.requesterId === id || f.addresseeId === id)?.id })),
    pending: pending.map(f => ({ ...userMap[f.requesterId], friendshipId: f.id })),
  });
}
