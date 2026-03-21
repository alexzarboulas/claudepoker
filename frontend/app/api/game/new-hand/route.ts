import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameRooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher';
import { newHand } from '@/lib/engine';
import { GameState } from '@/lib/types';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const { roomId } = await req.json();

  const [room] = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId));
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const isPlayer1 = room.player1Id === userId;
  const isPlayer2 = room.player2Id === userId;
  if (!isPlayer1 && !isPlayer2) return NextResponse.json({ error: 'Not in this room' }, { status: 403 });

  const gs = room.gameState as GameState;
  if (gs.phase !== 'complete') return NextResponse.json({ error: 'Hand not complete' }, { status: 400 });

  const nextHandNumber = gs.handNumber + 1;
  // Alternate button each hand
  const humanIsBtn = nextHandNumber % 2 === 1;
  const gameState = newHand(
    nextHandNumber,
    gs.players.human.stack,
    gs.players.opponent.stack,
    humanIsBtn,
  );

  await db.update(gameRooms)
    .set({ gameState, handNumber: nextHandNumber })
    .where(eq(gameRooms.id, roomId));

  await pusherServer.trigger(`game-${roomId}`, 'new-hand', {});

  return NextResponse.json({ success: true });
}
