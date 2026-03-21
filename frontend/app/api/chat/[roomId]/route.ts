import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { tableMessages } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;
  const username = (session.user as { name?: string }).name ?? 'Player';
  const { roomId } = params;

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Empty' }, { status: 400 });

  const id = randomUUID();
  await db.insert(tableMessages).values({ id, roomId, userId, username, content: content.trim() });

  // Keep only last 100 messages per room
  const all = await db.select({ id: tableMessages.id }).from(tableMessages)
    .where(eq(tableMessages.roomId, roomId)).orderBy(asc(tableMessages.createdAt));
  if (all.length > 100) {
    const toDelete = all.slice(0, all.length - 100).map(r => r.id);
    for (const did of toDelete) {
      await db.delete(tableMessages).where(eq(tableMessages.id, did));
    }
  }

  await pusherServer.trigger(`game-${roomId}`, 'chat', { username, content: content.trim() });

  return NextResponse.json({ ok: true });
}
