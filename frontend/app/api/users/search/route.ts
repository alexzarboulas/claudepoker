import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships, users } from '@/lib/db/schema';
import { and, eq, ilike, ne, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const myId = (session.user as { id?: string }).id!;

  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q) return NextResponse.json([]);

  const results = await db.select({
    id: users.id,
    username: users.username,
    nickname: users.nickname,
    avatarUrl: users.avatarUrl,
  }).from(users).where(and(ilike(users.username, `%${q}%`), ne(users.id, myId))).limit(10);

  const enriched = await Promise.all(results.map(async (u) => {
    const [friendship] = await db.select().from(friendships).where(
      or(
        and(eq(friendships.requesterId, myId), eq(friendships.addresseeId, u.id)),
        and(eq(friendships.requesterId, u.id), eq(friendships.addresseeId, myId))
      )
    );
    return {
      ...u,
      friendStatus: friendship?.status ?? null,
      friendshipId: friendship?.id ?? null,
      isRequester: friendship?.requesterId === myId,
    };
  }));

  return NextResponse.json(enriched);
}
