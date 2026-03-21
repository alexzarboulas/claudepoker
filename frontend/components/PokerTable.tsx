'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Action, ValidActions, HandResult } from '@/lib/types';
import { Card as CardType } from '@/lib/types';
import Card from './Card';
import ActionPanel from './ActionPanel';
import styles from './PokerTable.module.css';
import { playCardDeal, playChip } from '@/lib/sounds';

interface PokerTableProps {
  gameState: GameState | null;
  validActions: ValidActions | null;
  onAction: (action: Action) => void;
  onNewHand: () => void;
  isOpponentThinking: boolean;
  opponentName?: string;
  myName?: string;
}

export default function PokerTable({
  gameState,
  validActions,
  onAction,
  onNewHand,
  isOpponentThinking,
  opponentName,
  myName,
}: PokerTableProps) {
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const prevCommunityRef = useRef<CardType[]>([]);
  const prevHandIdRef = useRef<string | null>(null);
  const [allInFlash, setAllInFlash] = useState(false);
  const prevAllInRef = useRef(false);
  const [streetDimming, setStreetDimming] = useState(false);
  const prevPhaseRef = useRef<string | null>(null);
  const [potDisplay, setPotDisplay] = useState(0);
  const potAnimRef = useRef<number | null>(null);
  const prevLastActionRef = useRef<string | null>(null);

  // New hand: reset animation state
  useEffect(() => {
    if (!gameState) return;
    if (gameState.handId !== prevHandIdRef.current) {
      prevHandIdRef.current = gameState.handId;
      setRevealedCards(new Set());
      prevCommunityRef.current = [];
      prevAllInRef.current = false;
      prevPhaseRef.current = gameState.phase;
      [0, 100, 200, 300].forEach(d => setTimeout(() => playCardDeal(), d));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.handId]);

  // Community card flip
  useEffect(() => {
    if (!gameState) return;
    const prev = prevCommunityRef.current;
    const curr = gameState.communityCards;
    if (curr.length > prev.length) {
      const newCount = curr.length - prev.length;
      for (let i = 0; i < newCount; i++) {
        const idx = prev.length + i;
        setTimeout(() => playCardDeal(), i * 220);
        setTimeout(() => {
          setRevealedCards(s => new Set([...s, idx]));
        }, i * 220 + 430);
      }
    }
    prevCommunityRef.current = curr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.communityCards.length]);

  // All-in flash
  useEffect(() => {
    if (!gameState) return;
    const isAllIn = gameState.players.human.isAllIn || gameState.players.opponent.isAllIn;
    if (isAllIn && !prevAllInRef.current) {
      setAllInFlash(true);
      setTimeout(() => setAllInFlash(false), 720);
    }
    prevAllInRef.current = isAllIn;
  }, [gameState?.players.human.isAllIn, gameState?.players.opponent.isAllIn]);

  // Street dim
  useEffect(() => {
    if (!gameState) return;
    const phase = gameState.phase;
    if (prevPhaseRef.current && prevPhaseRef.current !== phase && phase !== 'complete') {
      setStreetDimming(true);
      setTimeout(() => setStreetDimming(false), 340);
    }
    prevPhaseRef.current = phase;
  }, [gameState?.phase]);

  // Chip sound on action
  useEffect(() => {
    if (!gameState?.lastAction) return;
    const a = gameState.lastAction;
    const key = `${a.player}-${a.action}-${a.amount}`;
    if (key !== prevLastActionRef.current) {
      prevLastActionRef.current = key;
      if (a.action === 'call' || a.action === 'bet' || a.action === 'raise' || a.action === 'allin') {
        playChip();
      }
    }
  }, [gameState?.lastAction]);

  // Pot ticker
  useEffect(() => {
    if (!gameState) return;
    const target = gameState.pot;
    if (potAnimRef.current) cancelAnimationFrame(potAnimRef.current);
    let startVal = potDisplay;
    const startTime = performance.now();
    const dur = 280;
    function tick(now: number) {
      const t = Math.min((now - startTime) / dur, 1);
      const eased = 1 - (1 - t) ** 3;
      setPotDisplay(Math.round(startVal + (target - startVal) * eased));
      if (t < 1) potAnimRef.current = requestAnimationFrame(tick);
    }
    potAnimRef.current = requestAnimationFrame(tick);
    return () => { if (potAnimRef.current) cancelAnimationFrame(potAnimRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.pot]);

  if (!gameState) {
    return (
      <div className={styles.tableWrap}>
        <div className={styles.table}>
          <div className={styles.startScreen}>
            <div className={styles.startLogo}>PokerIQ</div>
            <p className={styles.startSub}>Heads-Up Texas Hold'em</p>
            <button className={styles.startBtn} onClick={onNewHand}>Deal First Hand</button>
          </div>
        </div>
      </div>
    );
  }

  const { players, communityCards, pot, phase, result, lastAction, actionOn } = gameState;
  const isComplete = phase === 'complete';
  const isHumanTurn = actionOn === 'human' && !isComplete;
  const opponentWon = isComplete && result?.winner === 'opponent';
  const humanWon = isComplete && result?.winner === 'human';

  return (
    <div className={styles.tableWrap}>
      <div
        className={[
          styles.table,
          allInFlash ? styles.desatSnap : '',
          streetDimming ? styles.streetDim : '',
        ].filter(Boolean).join(' ')}
      >
        <div className={styles.rim} />

        {/* Opponent */}
        <div className={styles.opponentArea}>
          <div className={styles.playerLabel}>
            <span className={styles.playerName}>{opponentName ?? 'Opponent'}</span>
            <span className={styles.playerStack}>${players.opponent.stack.toLocaleString()}</span>
            {players.opponent.position === 'BTN' && <span className={styles.dealerChip}>D</span>}
          </div>
          <div className={styles.cardRow}>
            {isComplete && result && result.opponentCards.length > 0 ? (
              result.opponentCards.map((c, i) => (
                <Card
                  key={i}
                  card={c}
                  animationDelay={i * 90}
                  dealRole="opponent"
                  winner={opponentWon}
                  loser={humanWon}
                  fanIndex={opponentWon ? i : undefined}
                />
              ))
            ) : (
              <>
                <Card faceDown dealRole="opponent" animationDelay={0} />
                <Card faceDown dealRole="opponent" animationDelay={100} />
              </>
            )}
          </div>
          {players.opponent.betThisStreet > 0 && (
            <div className={styles.betChips}>
              <ChipStack amount={players.opponent.betThisStreet} />
            </div>
          )}
        </div>

        {/* Center */}
        <div className={styles.centerArea}>
          <div className={styles.communityRow}>
            {[0, 1, 2, 3, 4].map(i => (
              <CommunityCardSlot
                key={i}
                card={communityCards[i] ?? null}
                revealed={revealedCards.has(i)}
                dealDelay={i * 200}
              />
            ))}
          </div>
          <div className={styles.potArea}>
            {pot > 0 && (
              <div className={styles.pot}>
                <span className={styles.potLabel}>POT</span>
                <span className={styles.potAmount}>${potDisplay.toLocaleString()}</span>
              </div>
            )}
          </div>
          {!isComplete && <div className={styles.phaseLabel}>{phase.toUpperCase()}</div>}
          {lastAction && !isComplete && (
            <div className={`${styles.lastAction}`}>
              <span className={styles.lastActionActor}>{lastAction.player === 'human' ? 'You' : 'Opponent'}</span>
              <span className={styles.lastActionText}> {lastAction.action}{lastAction.amount > 0 ? ` $${lastAction.amount.toLocaleString()}` : ''}</span>
            </div>
          )}
          {isOpponentThinking && (
            <div className={styles.thinking}>
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
            </div>
          )}
        </div>

        {/* Human */}
        <div className={styles.humanArea}>
          {players.human.betThisStreet > 0 && (
            <div className={styles.betChipsHuman}>
              <ChipStack amount={players.human.betThisStreet} />
            </div>
          )}
          <div className={styles.cardRow}>
            {players.human.holeCards.map((c, i) => (
              <Card
                key={i}
                card={c}
                animationDelay={i * 100 + 200}
                dealRole="human"
                winner={humanWon}
                loser={opponentWon}
              />
            ))}
          </div>
          <div className={styles.playerLabel}>
            {players.human.position === 'BTN' && <span className={styles.dealerChip}>D</span>}
            <span className={styles.playerName}>{myName ?? 'You'}</span>
            <span className={styles.playerStack}>${players.human.stack.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isComplete && result && (
          <ResultOverlay result={result} onNewHand={onNewHand} />
        )}
      </AnimatePresence>

      {!isComplete && validActions && (
        <ActionPanel
          validActions={validActions}
          pot={pot}
          onAction={onAction}
          disabled={!isHumanTurn}
        />
      )}
    </div>
  );
}

function CommunityCardSlot({
  card,
  revealed,
  dealDelay,
}: {
  card: CardType | null;
  revealed: boolean;
  dealDelay: number;
}) {
  const [showFace, setShowFace] = useState(false);
  const [scaleX, setScaleX] = useState(1);

  useEffect(() => {
    if (!card) { setShowFace(false); setScaleX(1); return; }
    if (revealed && !showFace) {
      setScaleX(0);
      setTimeout(() => { setShowFace(true); setScaleX(1); }, 155);
    }
  }, [revealed, card]);

  useEffect(() => {
    if (!card) { setShowFace(false); setScaleX(1); }
  }, [card]);

  if (!card) return <div className={styles.communitySlot} />;

  return (
    <div style={{ transform: `scaleX(${scaleX})`, transition: 'transform 0.15s ease' }}>
      <Card
        card={showFace ? card : null}
        faceDown={!showFace}
        dealRole="community"
        animationDelay={dealDelay}
      />
    </div>
  );
}

function ChipStack({ amount }: { amount: number }) {
  const color = amount >= 1000 ? '#222' : amount >= 500 ? '#1a237e' : amount >= 100 ? '#c62828' : '#2e7d32';
  return (
    <motion.div
      className={styles.chipStack}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <div className={styles.chip} style={{ background: color }} />
      <span className={styles.chipAmt}>${amount.toLocaleString()}</span>
    </motion.div>
  );
}

function ResultOverlay({ result, onNewHand }: { result: HandResult; onNewHand: () => void }) {
  const isWin = result.winner === 'human';
  const isSplit = result.winner === 'split';
  return (
    <motion.div
      className={styles.resultOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.26, delay: 0.22 }}
    >
      <motion.div
        className={`${styles.resultCard} ${isWin ? styles.resultWin : isSplit ? styles.resultSplit : styles.resultLoss}`}
        initial={{ opacity: 0, scale: 0.86, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 330, damping: 26, delay: 0.32 }}
      >
        <div className={styles.resultIcon}>{isWin ? '♠' : isSplit ? '♦' : '♣'}</div>
        <div className={styles.resultTitle}>
          {isWin ? 'You Win!' : isSplit ? 'Split Pot' : 'Opponent Wins'}
        </div>
        {result.potWon > 0 && (
          <div className={styles.resultAmount}>
            {isWin ? '+' : isSplit ? '±' : '-'}${result.potWon.toLocaleString()}
          </div>
        )}
        {result.humanHandName && (
          <div className={styles.resultHand}>
            {isWin
              ? `Your ${result.humanHandName}`
              : !result.humanHandName.includes('fold') && result.opponentHandName
              ? `Opponent: ${result.opponentHandName}`
              : result.humanHandName}
          </div>
        )}
        <button className={styles.nextHandBtn} onClick={onNewHand}>Next Hand →</button>
      </motion.div>
    </motion.div>
  );
}
