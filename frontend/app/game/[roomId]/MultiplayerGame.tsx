'use client';

import { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import { GameState, Action, ValidActions } from '@/lib/types';
import { getValidActions } from '@/lib/engine';
import TopBar from '@/components/TopBar';
import PokerTable from '@/components/PokerTable';
import Sidebar from '@/components/Sidebar';
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

  // Load initial state
  useEffect(() => {
    async function loadState() {
      const res = await fetch(`/api/game/state?roomId=${roomId}`);
      if (!res.ok) return;
      const data: RoomInfo = await res.json();
      setPerspective(data.perspective);
      setRoomStatus(data.status);
      if (data.gameState) {
        setGameState(data.gameState);
        setHandCount(data.gameState.handNumber);
      }
      if (data.perspective === 'human') {
        setOpponentUsername(data.player2Username ?? 'Opponent');
      } else {
        setOpponentUsername(data.player1Username ?? 'Opponent');
      }
    }
    loadState();
  }, [roomId]);

  // Pusher subscription
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`game-${roomId}`);

    channel.bind('game-start', (data: { gameState: GameState; player1Id: string; player2Id: string }) => {
      setRoomStatus('active');
      setGameState(data.gameState);
      setHandCount(1);
    });

    channel.bind('state-update', (data: { stateForP1: GameState; stateForP2: GameState }) => {
      setPerspective(prev => {
        const myState = prev === 'human' ? data.stateForP1 : data.stateForP2;
        setGameState(myState);
        if (myState.phase === 'complete') {
          const result = myState.result;
          if (result) {
            const won = (prev === 'human' && result.winner === 'human') ||
                        (prev === 'opponent' && result.winner === 'opponent');
            const pnl = won ? result.potWon - myState.players[prev].totalBetThisHand
                            : result.winner === 'split' ? 0
                            : -myState.players[prev].totalBetThisHand;
            setSessionPnl(p => p + pnl);
          }
        }
        return prev;
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${roomId}`);
    };
  }, [roomId]);

  const handleAction = useCallback(async (action: Action) => {
    await fetch('/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, action }),
    });
  }, [roomId]);

  const handleNewHand = useCallback(() => {
    window.location.reload();
  }, []);

  const myPlayer = gameState?.players[perspective];
  const validActions: ValidActions | null = gameState && gameState.actionOn === perspective && gameState.phase !== 'complete'
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
        <div className={styles.body}>
          <PokerTable
            gameState={tableState}
            validActions={validActions}
            onAction={handleAction}
            onNewHand={handleNewHand}
            isOpponentThinking={gameState?.actionOn !== null && gameState?.actionOn !== perspective && gameState?.phase !== 'complete'}
            opponentName={opponentUsername}
            myName={username}
          />
          <Sidebar
            stats={{ vpip: 0, pfr: 0, aggressionFactor: 0, foldTo3bet: 0, cbetFreq: 0, foldToRiverBet: 0, sampleSize: 0 }}
            tips={[]}
            history={[]}
          />
        </div>
      )}
    </div>
  );
}

// Remap game state so that from PokerTable's perspective, the current player is always 'human'
function remapForTable(gs: GameState, perspective: 'human' | 'opponent'): GameState {
  if (perspective === 'human') return gs;
  // Swap human and opponent
  const remapped = JSON.parse(JSON.stringify(gs)) as GameState;
  const tmp = remapped.players.human;
  remapped.players.human = remapped.players.opponent;
  remapped.players.opponent = tmp;
  if (remapped.actionOn === 'human') remapped.actionOn = 'opponent';
  else if (remapped.actionOn === 'opponent') remapped.actionOn = 'human';
  if (remapped.result) {
    if (remapped.result.winner === 'human') remapped.result.winner = 'opponent';
    else if (remapped.result.winner === 'opponent') remapped.result.winner = 'human';
    // Also swap opponentCards
    remapped.result.opponentCards = gs.players.human.holeCards;
  }
  return remapped;
}
