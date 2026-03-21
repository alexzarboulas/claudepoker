import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameRooms } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const roomCode = randomCode();
  const id = nanoid();

  await db.insert(gameRooms).values({
    id,
    roomCode,
    player1Id: userId,
    status: 'waiting',
  });

  return NextResponse.json({ roomId: id, roomCode });
}
