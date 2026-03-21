'use client';

import { GameState, Action, ValidActions, HandResult } from '@/lib/types';
import Card from './Card';
import ActionPanel from './ActionPanel';
import styles from './PokerTable.module.css';

interface PokerTableProps {
  gameState: GameState | null;
  validActions: ValidActions | null;
  onAction: (action: Action) => void;
  onNewHand: () => void;
  isOpponentThinking: boolean;
  opponentName?: string;
  myName?: string;
}

export default function PokerTable({ gameState, validActions, onAction, onNewHand, isOpponentThinking, opponentName, myName }: PokerTableProps) {
  if (!gameState) {
    return (
      <div className={styles.tableWrap}>
        <div className={styles.table}>
          <div className={styles.leftColumn}>
            <div className={styles.colCapital} />
            <div className={styles.colShaft}><div className={styles.colFlute}/><div className={styles.colFlute}/><div className={styles.colFlute}/></div>
            <div className={styles.colBase} />
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.colCapital} />
            <div className={styles.colShaft}><div className={styles.colFlute}/><div className={styles.colFlute}/><div className={styles.colFlute}/></div>
            <div className={styles.colBase} />
          </div>
          <div className={styles.startScreen}>
            <div className={styles.startLogo}>PokerIQ</div>
            <p className={styles.startSub}>Heads-Up Texas Hold'em</p>
            <button className={styles.startBtn} onClick={onNewHand}>
              Deal First Hand
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { players, communityCards, pot, phase, result, lastAction, actionOn } = gameState;
  const isComplete = phase === 'complete';
  const isHumanTurn = actionOn === 'human' && !isComplete;

  return (
    <div className={styles.tableWrap}>
      <div className={styles.table}>
        {/* Marble columns */}
        <div className={styles.leftColumn}>
          <div className={styles.colCapital} />
          <div className={styles.colShaft}><div className={styles.colFlute}/><div className={styles.colFlute}/><div className={styles.colFlute}/></div>
          <div className={styles.colBase} />
        </div>
        <div className={styles.rightColumn}>
          <div className={styles.colCapital} />
          <div className={styles.colShaft}><div className={styles.colFlute}/><div className={styles.colFlute}/><div className={styles.colFlute}/></div>
          <div className={styles.colBase} />
        </div>

        {/* Table felt rim */}
        <div className={styles.rim} />

        {/* Opponent area */}
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
                  animationDelay={i * 80}
                  winner={result.winner === 'opponent'}
                />
              ))
            ) : (
              <>
                <Card faceDown animationDelay={0} />
                <Card faceDown animationDelay={80} />
              </>
            )}
          </div>
          {players.opponent.betThisStreet > 0 && (
            <div className={styles.betChips}>
              <ChipStack amount={players.opponent.betThisStreet} />
            </div>
          )}
        </div>

        {/* Center: community cards + pot */}
        <div className={styles.centerArea}>
          <div className={styles.communityRow}>
            {[0,1,2,3,4].map(i => (
              <Card
                key={i}
                card={communityCards[i] ?? null}
                animationDelay={i * 100}
              />
            ))}
          </div>

          <div className={styles.potArea}>
            {pot > 0 && (
              <div className={styles.pot}>
                <span className={styles.potLabel}>POT</span>
                <span className={styles.potAmount}>${pot.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Phase indicator */}
          {!isComplete && (
            <div className={styles.phaseLabel}>{phase.toUpperCase()}</div>
          )}

          {/* Last action notification */}
          {lastAction && !isComplete && (
            <div className={`${styles.lastAction} ${styles[lastAction.action] ?? ''}`}>
              <span className={styles.lastActionActor}>{lastAction.player === 'human' ? 'You' : 'Opponent'}</span>
              <span className={styles.lastActionText}> {lastAction.action}{lastAction.amount > 0 ? ` $${lastAction.amount.toLocaleString()}` : ''}</span>
            </div>
          )}

          {/* Opponent thinking indicator */}
          {isOpponentThinking && (
            <div className={styles.thinking}>
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
            </div>
          )}
        </div>

        {/* Human area */}
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
                animationDelay={i * 80 + 160}
                winner={isComplete && result?.winner === 'human'}
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

      {/* Result overlay */}
      {isComplete && result && (
        <ResultOverlay result={result} onNewHand={onNewHand} />
      )}

      {/* Action panel */}
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

function ChipStack({ amount }: { amount: number }) {
  const color = amount >= 1000 ? '#222' : amount >= 500 ? '#1a237e' : amount >= 100 ? '#c62828' : '#2e7d32';
  return (
    <div className={styles.chipStack} style={{ animation: 'chipSlide 200ms ease both' }}>
      <div className={styles.chip} style={{ background: color }} />
      <span className={styles.chipAmt}>${amount.toLocaleString()}</span>
    </div>
  );
}

function ResultOverlay({ result, onNewHand }: { result: HandResult; onNewHand: () => void }) {
  const isWin = result.winner === 'human';
  const isSplit = result.winner === 'split';

  return (
    <div className={styles.resultOverlay}>
      <div className={`${styles.resultCard} ${isWin ? styles.resultWin : isSplit ? styles.resultSplit : styles.resultLoss}`}>
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
              : result.humanHandName
            }
          </div>
        )}
        <button className={styles.nextHandBtn} onClick={onNewHand}>
          Next Hand →
        </button>
      </div>
    </div>
  );
}
