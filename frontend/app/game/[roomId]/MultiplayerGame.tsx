'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';
import { GameState, Action, ValidActions } from '@/lib/types';
import { getValidActions } from '@/lib/engine';
import TopBar from '@/components/TopBar';
import PokerTable from '@/components/PokerTable';
import Sidebar from '@/components/Sidebar';
import TableChat from '@/components/TableChat';
import styles from './game.module.css';

interface Props {
  roomId: string;
  userId: string;
  username: string;
}

interface RoomInfo {
  perspective: 'human' | 'opponent';
  gameState: GameState | null;
  status: string;
  player1Username: string | null;
  player2Username: string | null;
}

export default function MultiplayerGame({ roomId, userId, username }: Props) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [perspective, setPerspective] = useState<'human' | 'opponent'>('human');
  const [roomStatus, setRoomStatus] = useState<string>('waiting');
  const [opponentUsername, setOpponentUsername] = useState<string>('Opponent');
  const [sessionPnl, setSessionPnl] = useState(0);
  const [handCount, setHandCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep a ref so Pusher handlers always read the latest perspective
  const perspectiveRef = useRef<'human' | 'opponent'>('human');
  useEffect(() => {
    perspectiveRef.current = perspective;
  }, [perspective]);

  const loadState = useCallback(async () => {
    const res = await fetch(`/api/game/state?roomId=${roomId}`);
    if (!res.ok) return;
    const data: RoomInfo = await res.json();
    perspectiveRef.current = data.perspective;
    setPerspective(data.perspective);
    setRoomStatus(data.status);
    if (data.gameState) {
      setGameState(data.gameState);
      setHandCount(data.gameState.handNumber);
    }
    setOpponentUsername(
      data.perspective === 'human'
        ? (data.player2Username ?? 'Opponent')
        : (data.player1Username ?? 'Opponent')
    );
  }, [roomId]);

  // Load initial state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Pusher subscription
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`game-${roomId}`);

    // game-start: opponent joined — reload state from server to get correct filtered view
    channel.bind('game-start', () => {
      loadState();
    });

    // new-hand: next hand was dealt — both clients reload fresh state
    channel.bind('new-hand', () => {
      loadState();
    });

    // state-update: a player acted — use ref to pick the correct player's state
    channel.bind('state-update', (data: { stateForP1: GameState; stateForP2: GameState }) => {
      const myState = perspectiveRef.current === 'human' ? data.stateForP1 : data.stateForP2;
      setGameState(myState);
      setIsSubmitting(false);
      if (myState.phase === 'complete' && myState.result) {
        const p = perspectiveRef.current;
        const { winner, potWon } = myState.result;
        const won = (p === 'human' && winner === 'human') || (p === 'opponent' && winner === 'opponent');
        const pnl = won
          ? potWon - myState.players[p].totalBetThisHand
          : winner === 'split' ? 0
          : -myState.players[p].totalBetThisHand;
        setSessionPnl(prev => prev + pnl);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${roomId}`);
    };
  }, [roomId, loadState]);

  const handleAction = useCallback(async (action: Action) => {
    setIsSubmitting(true);
    await fetch('/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, action }),
    });
  }, [roomId]);

  const handleNewHand = useCallback(async () => {
    await fetch('/api/game/new-hand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId }),
    });
    // Server will trigger 'new-hand' Pusher event; both clients reload via that handler
  }, [roomId]);

  const myPlayer = gameState?.players[perspective];
  const validActions: ValidActions | null =
    !isSubmitting &&
    gameState &&
    gameState.actionOn === perspective &&
    gameState.phase !== 'complete'
      ? getValidActions(gameState, perspective)
      : null;

  const humanStack = myPlayer?.stack ?? 10000;
  const opponentStack = gameState?.players[perspective === 'human' ? 'opponent' : 'human']?.stack ?? 10000;
  const tableState = gameState ? remapForTable(gameState, perspective) : null;

  return (
    <div className={styles.app}>
      <TopBar
        sessionPnl={sessionPnl}
        handCount={handCount}
        humanStack={humanStack}
        opponentStack={opponentStack}
        smallBlind={50}
        bigBlind={100}
      />
      {roomStatus === 'waiting' && (
        <div className={styles.waitingOverlay}>
          <div className={styles.waitingCard}>
            <div className={styles.waitingTitle}>Waiting for opponent</div>
            <div className={styles.waitingDots}>
              <span /><span /><span />
            </div>
            <p className={styles.waitingInfo}>Share the room code with a friend to start playing.</p>
          </div>
        </div>
      )}
      {roomStatus !== 'waiting' && (
        <>
          <div className={styles.body}>
            <PokerTable
              gameState={tableState}
              validActions={validActions}
              onAction={handleAction}
              onNewHand={handleNewHand}
              isOpponentThinking={
                !isSubmitting &&
                gameState?.actionOn !== null &&
                gameState?.actionOn !== perspective &&
                gameState?.phase !== 'complete'
              }
              opponentName={opponentUsername}
              myName={username}
            />
            <Sidebar
              stats={{ vpip: 0, pfr: 0, aggressionFactor: 0, foldTo3bet: 0, cbetFreq: 0, foldToRiverBet: 0, sampleSize: 0 }}
              tips={[]}
              history={[]}
            />
          </div>
          <TableChat roomId={roomId} myUsername={username} />
        </>
      )}
    </div>
  );
}

function remapForTable(gs: GameState, perspective: 'human' | 'opponent'): GameState {
  if (perspective === 'human') return gs;
  const remapped = JSON.parse(JSON.stringify(gs)) as GameState;
  const tmp = remapped.players.human;
  remapped.players.human = remapped.players.opponent;
  remapped.players.opponent = tmp;
  if (remapped.actionOn === 'human') remapped.actionOn = 'opponent';
  else if (remapped.actionOn === 'opponent') remapped.actionOn = 'human';
  if (remapped.result) {
    if (remapped.result.winner === 'human') remapped.result.winner = 'opponent';
    else if (remapped.result.winner === 'opponent') remapped.result.winner = 'human';
    remapped.result.opponentCards = gs.players.human.holeCards;
  }
  return remapped;
}
