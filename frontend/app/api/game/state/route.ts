import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, updateLastSeen } from '@/lib/db';
import { gameRooms, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GameState } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (userId) updateLastSeen(userId); // fire-and-forget
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });

  const [room] = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId));
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const isPlayer1 = room.player1Id === userId;
  const isPlayer2 = room.player2Id === userId;
  if (!isPlayer1 && !isPlayer2) return NextResponse.json({ error: 'Not in this room' }, { status: 403 });

  // Fetch usernames
  const p1 = room.player1Id ? await db.select({ username: users.username }).from(users).where(eq(users.id, room.player1Id)) : [];
  const p2 = room.player2Id ? await db.select({ username: users.username }).from(users).where(eq(users.id, room.player2Id)) : [];

  const gs = room.gameState as GameState | null;
  const perspective = isPlayer1 ? 'human' : 'opponent';

  let clientState = gs;
  if (gs && gs.phase !== 'complete') {
    const other = perspective === 'human' ? 'opponent' : 'human';
    clientState = JSON.parse(JSON.stringify(gs));
    clientState!.players[other].holeCards = [];
  }

  return NextResponse.json({
    roomId: room.id,
    roomCode: room.roomCode,
    status: room.status,
    perspective,
    gameState: clientState,
    player1Username: p1[0]?.username ?? null,
    player2Username: p2[0]?.username ?? null,
  });
}
