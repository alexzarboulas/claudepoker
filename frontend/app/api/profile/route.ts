import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { playerStats, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [stats] = await db.select().from(playerStats).where(eq(playerStats.userId, userId));

  return NextResponse.json({ user, stats });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;

  const body = await req.json();
  const { bio, nickname, avatarUrl } = body;

  if (avatarUrl && avatarUrl.length > 80 * 1024) {
    return NextResponse.json({ error: 'Avatar too large (max 80KB)' }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (bio !== undefined) updates.bio = bio;
  if (nickname !== undefined) updates.nickname = nickname;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  await db.update(users).set(updates).where(eq(users.id, userId));
  return NextResponse.json({ ok: true });
}
