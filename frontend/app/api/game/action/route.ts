import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, updateLastSeen } from '@/lib/db';
import { gameRooms, handHistory, playerStats } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher';
import { applyAction, newHand } from '@/lib/engine';
import { GameState, Action } from '@/lib/types';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const schema = z.object({
  roomId: z.string(),
  action: z.object({
    type: z.enum(['fold', 'check', 'call', 'bet', 'raise', 'allin']),
    amount: z.number(),
  }),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { roomId, action } = parsed.data;
  if (userId) updateLastSeen(userId); // fire-and-forget
  const [room] = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId));
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const isPlayer1 = room.player1Id === userId;
  const isPlayer2 = room.player2Id === userId;
  if (!isPlayer1 && !isPlayer2) return NextResponse.json({ error: 'Not in this room' }, { status: 403 });

  const gs = room.gameState as GameState;
  // player1 is always 'human', player2 is always 'opponent' in engine perspective
  const enginePlayer = isPlayer1 ? 'human' : 'opponent';

  if (gs.actionOn !== enginePlayer) {
    return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
  }

  const newState = applyAction(gs, enginePlayer, action as Action);

  let winnerId: string | null = null;
  if (newState.phase === 'complete' && newState.result) {
    winnerId = newState.result.winner === 'human' ? room.player1Id! :
               newState.result.winner === 'opponent' ? room.player2Id! : null;

    // Save hand history
    await db.insert(handHistory).values({
      id: nanoid(),
      roomId,
      handNumber: newState.handNumber,
      winnerId,
      pot: newState.result.potWon,
      board: newState.communityCards,
      player1Cards: newState.players.human.holeCards,
      player2Cards: newState.players.opponent.holeCards,
    });

    // Update player stats
    await db.update(playerStats)
      .set({ handsPlayed: sql`${playerStats.handsPlayed} + 1` })
      .where(eq(playerStats.userId, room.player1Id!));

    await db.update(playerStats)
      .set({ handsPlayed: sql`${playerStats.handsPlayed} + 1` })
      .where(eq(playerStats.userId, room.player2Id!));
  }

  await db.update(gameRooms)
    .set({ gameState: newState })
    .where(eq(gameRooms.id, roomId));

  // Push state update to both clients (hide opponent hole cards from each player)
  const stateForP1 = buildClientState(newState, 'human');
  const stateForP2 = buildClientState(newState, 'opponent');

  await pusherServer.trigger(`game-${roomId}`, 'state-update', {
    stateForP1,
    stateForP2,
    winnerId,
  });

  return NextResponse.json({ success: true });
}

function buildClientState(state: GameState, perspective: 'human' | 'opponent'): GameState {
  const s = JSON.parse(JSON.stringify(state)) as GameState;
  const other = perspective === 'human' ? 'opponent' : 'human';
  // Hide opponent's hole cards unless complete
  if (s.phase !== 'complete') {
    s.players[other].holeCards = [];
  }
  return s;
}
