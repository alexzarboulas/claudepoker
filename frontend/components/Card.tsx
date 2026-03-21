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
        <div className={styles.backPattern}>
          <svg className={styles.amphoraSvg} viewBox="0 0 50 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Neck */}
            <rect x="19" y="4" width="12" height="8" rx="2" fill="rgba(212,168,67,0.45)"/>
            {/* Rim at top */}
            <rect x="15" y="3" width="20" height="3" rx="1.5" fill="rgba(212,168,67,0.55)"/>
            {/* Left handle */}
            <path d="M19 10 C10 12, 8 20, 12 26 C14 29, 18 28, 19 26" stroke="rgba(212,168,67,0.55)" strokeWidth="2" fill="none" strokeLinecap="round"/>
            {/* Right handle */}
            <path d="M31 10 C40 12, 42 20, 38 26 C36 29, 32 28, 31 26" stroke="rgba(212,168,67,0.55)" strokeWidth="2" fill="none" strokeLinecap="round"/>
            {/* Body */}
            <path d="M19 12 C14 16, 11 24, 12 34 C13 42, 18 50, 20 58 C21 62, 25 64, 25 64 C25 64, 29 62, 30 58 C32 50, 37 42, 38 34 C39 24, 36 16, 31 12 Z" fill="rgba(212,168,67,0.35)" stroke="rgba(212,168,67,0.6)" strokeWidth="1.2"/>
            {/* Foot base */}
            <ellipse cx="25" cy="64" rx="6" ry="2" fill="rgba(212,168,67,0.5)"/>
            {/* Decorative band */}
            <path d="M13 30 Q25 33 37 30" stroke="rgba(212,168,67,0.3)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
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
