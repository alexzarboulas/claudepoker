'use client';

import { Card as CardType } from '@/lib/types';
import styles from './Card.module.css';

const SUIT_SYMBOLS: Record<string, string> = {
  s: '♠', h: '♥', d: '♦', c: '♣',
};

const SUIT_CLASS: Record<string, string> = {
  s: 'black', h: 'red', d: 'red', c: 'black',
};

const RANK_DISPLAY: Record<string, string> = {
  T: '10', J: 'J', Q: 'Q', K: 'K', A: 'A',
};

interface CardProps {
  card?: CardType | null;
  faceDown?: boolean;
  animationDelay?: number;
  winner?: boolean;
  small?: boolean;
}

export default function Card({ card, faceDown = false, animationDelay = 0, winner = false, small = false }: CardProps) {
  if (!card && !faceDown) {
    return <div className={`${styles.cardSlot} ${small ? styles.small : ''}`} />;
  }

  if (faceDown || !card) {
    return (
      <div
        className={`${styles.card} ${styles.faceDown} ${small ? styles.small : ''}`}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className={styles.backPattern} />
      </div>
    );
  }

  const rankDisplay = RANK_DISPLAY[card.rank] ?? card.rank;
  const suit = SUIT_SYMBOLS[card.suit];
  const colorClass = styles[SUIT_CLASS[card.suit]];

  return (
    <div
      className={`${styles.card} ${styles.faceUp} ${colorClass} ${winner ? styles.winner : ''} ${small ? styles.small : ''}`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={styles.corner}>
        <span className={styles.rank}>{rankDisplay}</span>
        <span className={styles.suitSmall}>{suit}</span>
      </div>
      <div className={styles.centerSuit}>{suit}</div>
      <div className={`${styles.corner} ${styles.bottomRight}`}>
        <span className={styles.rank}>{rankDisplay}</span>
        <span className={styles.suitSmall}>{suit}</span>
      </div>
    </div>
  );
}
