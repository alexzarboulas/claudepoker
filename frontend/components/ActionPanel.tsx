'use client';

import { useState, useEffect } from 'react';
import { Action, ValidActions } from '@/lib/types';
import styles from './ActionPanel.module.css';

interface ActionPanelProps {
  validActions: ValidActions;
  pot: number;
  onAction: (action: Action) => void;
  disabled: boolean;
}

export default function ActionPanel({ validActions, pot, onAction, disabled }: ActionPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(validActions.minRaise);

  useEffect(() => {
    setRaiseAmount(validActions.minRaise);
  }, [validActions.minRaise]);

  const potPct = pot > 0 ? Math.round((raiseAmount / pot) * 100) : 0;

  const quickSizes = [
    { label: '½ Pot', amount: Math.max(validActions.minRaise, Math.floor(pot * 0.5)) },
    { label: '¾ Pot', amount: Math.max(validActions.minRaise, Math.floor(pot * 0.75)) },
    { label: 'Pot',   amount: Math.max(validActions.minRaise, pot) },
    { label: 'All-in',amount: validActions.maxRaise },
  ].filter(s => s.amount <= validActions.maxRaise);

  return (
    <div className={`${styles.panel} ${disabled ? styles.disabled : ''}`}>
      {/* Raise sizing row — only shown when raise is possible */}
      {(validActions.canRaise || validActions.canBet) && !disabled && (
        <div className={styles.sizeRow}>
          <div className={styles.quickSizes}>
            {quickSizes.map(s => (
              <button
                key={s.label}
                className={`${styles.quickBtn} ${raiseAmount === s.amount ? styles.quickActive : ''}`}
                onClick={() => setRaiseAmount(Math.min(s.amount, validActions.maxRaise))}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className={styles.sliderWrap}>
            <input
              type="range"
              min={validActions.minRaise}
              max={validActions.maxRaise}
              step={validActions.minRaise}
              value={raiseAmount}
              onChange={e => setRaiseAmount(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.raiseInfo}>
              <span className={styles.raiseAmt}>${raiseAmount.toLocaleString()}</span>
              <span className={styles.raisePct}>{potPct}% pot</span>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.buttons}>
        <button
          className={`${styles.btn} ${styles.fold}`}
          onClick={() => onAction({ type: 'fold', amount: 0 })}
          disabled={disabled}
        >
          <span className={styles.btnIcon}>✕</span>
          <span className={styles.btnLabel}>Fold</span>
        </button>

        {validActions.canCheck ? (
          <button
            className={`${styles.btn} ${styles.call}`}
            onClick={() => onAction({ type: 'check', amount: 0 })}
            disabled={disabled}
          >
            <span className={styles.btnIcon}>✓</span>
            <span className={styles.btnLabel}>Check</span>
          </button>
        ) : (
          <button
            className={`${styles.btn} ${styles.call}`}
            onClick={() => onAction({ type: 'call', amount: validActions.callAmount })}
            disabled={disabled || !validActions.canCall}
          >
            <span className={styles.btnIcon}>↗</span>
            <span className={styles.btnLabel}>Call</span>
            <span className={styles.btnAmount}>${validActions.callAmount.toLocaleString()}</span>
          </button>
        )}

        {(validActions.canRaise || validActions.canBet) && (
          <button
            className={`${styles.btn} ${styles.raise}`}
            onClick={() => onAction({
              type: validActions.canBet && !validActions.canRaise ? 'bet' : 'raise',
              amount: raiseAmount,
            })}
            disabled={disabled}
          >
            <span className={styles.btnIcon}>⬆</span>
            <span className={styles.btnLabel}>{validActions.canBet && !validActions.canRaise ? 'Bet' : 'Raise'}</span>
            <span className={styles.btnAmount}>${raiseAmount.toLocaleString()}</span>
          </button>
        )}
      </div>
    </div>
  );
}
