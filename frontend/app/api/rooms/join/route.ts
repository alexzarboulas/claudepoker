import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameRooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher';
import { newHand } from '@/lib/engine';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const { roomCode } = await req.json();

  const [room] = await db.select().from(gameRooms).where(eq(gameRooms.roomCode, roomCode.toUpperCase()));
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.status !== 'waiting') return NextResponse.json({ error: 'Room is not available' }, { status: 409 });
  if (room.player1Id === userId) return NextResponse.json({ error: 'Cannot join your own room' }, { status: 400 });

  // Deal first hand
  const gameState = newHand(1, 10000, 10000, true);

  await db.update(gameRooms)
    .set({ player2Id: userId, status: 'active', gameState, handNumber: 1 })
    .where(eq(gameRooms.id, room.id));

  // Notify player1 that opponent joined and game started
  await pusherServer.trigger(`game-${room.id}`, 'game-start', {
    gameState,
    player1Id: room.player1Id,
    player2Id: userId,
  });

  return NextResponse.json({ roomId: room.id });
}
