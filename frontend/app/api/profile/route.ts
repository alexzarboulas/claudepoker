import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { playerStats, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;

  const [stats] = await db.select().from(playerStats).where(eq(playerStats.userId, userId));
  const [user] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId));

  return NextResponse.json({ username: user?.username, stats });
}
