'use client';

import { motion } from 'framer-motion';
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

export type CardDealRole = 'human' | 'opponent' | 'community' | 'none';

interface CardProps {
  card?: CardType | null;
  faceDown?: boolean;
  animationDelay?: number;
  winner?: boolean;
  loser?: boolean;
  small?: boolean;
  dealRole?: CardDealRole;
  fanIndex?: number; // 0 or 1 — for fan-out effect when opponent wins
}

function getDealInitial(role: CardDealRole) {
  switch (role) {
    case 'human':
      return { y: -200, rotate: -16, scale: 0.72, opacity: 0 };
    case 'opponent':
      return { y: 200, rotate: 16, scale: 0.72, opacity: 0 };
    case 'community':
      return { y: -55, x: -70, rotate: -10, scale: 0.78, opacity: 0 };
    default:
      return { opacity: 0, scale: 0.92 };
  }
}

function AmphoraBack() {
  return (
    <div className={styles.backPattern}>
      <svg className={styles.amphoraSvg} viewBox="0 0 50 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="19" y="4" width="12" height="8" rx="2" fill="rgba(212,168,67,0.45)"/>
        <rect x="15" y="3" width="20" height="3" rx="1.5" fill="rgba(212,168,67,0.55)"/>
        <path d="M19 10 C10 12, 8 20, 12 26 C14 29, 18 28, 19 26" stroke="rgba(212,168,67,0.55)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M31 10 C40 12, 42 20, 38 26 C36 29, 32 28, 31 26" stroke="rgba(212,168,67,0.55)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M19 12 C14 16, 11 24, 12 34 C13 42, 18 50, 20 58 C21 62, 25 64, 25 64 C25 64, 29 62, 30 58 C32 50, 37 42, 38 34 C39 24, 36 16, 31 12 Z" fill="rgba(212,168,67,0.35)" stroke="rgba(212,168,67,0.6)" strokeWidth="1.2"/>
        <ellipse cx="25" cy="64" rx="6" ry="2" fill="rgba(212,168,67,0.5)"/>
        <path d="M13 30 Q25 33 37 30" stroke="rgba(212,168,67,0.3)" strokeWidth="1" fill="none"/>
      </svg>
    </div>
  );
}

export default function Card({
  card,
  faceDown = false,
  animationDelay = 0,
  winner = false,
  loser = false,
  small = false,
  dealRole = 'none',
  fanIndex,
}: CardProps) {
  const initial = getDealInitial(dealRole);
  const springTransition = dealRole !== 'none'
    ? { type: 'spring' as const, stiffness: 270, damping: 26, delay: animationDelay / 1000 }
    : { type: 'spring' as const, stiffness: 350, damping: 30, delay: animationDelay / 1000 };

  // Fan-out for opponent's winning cards: applied via CSS transition after a short delay
  const fanStyle: React.CSSProperties | undefined = (fanIndex !== undefined && winner)
    ? {
        transform: fanIndex === 0
          ? 'rotate(-13deg) translate(-18px, -10px)'
          : 'rotate(13deg) translate(18px, -10px)',
        transition: 'transform 0.45s ease 0.25s',
        filter: 'drop-shadow(0 0 8px rgba(212,168,67,0.5))',
      }
    : undefined;

  if (!card && !faceDown) {
    return <div className={`${styles.cardSlot} ${small ? styles.small : ''}`} />;
  }

  if (faceDown || !card) {
    return (
      <motion.div
        className={`${styles.card} ${styles.faceDown} ${small ? styles.small : ''}`}
        initial={initial}
        animate={{ y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }}
        transition={springTransition}
      >
        <AmphoraBack />
      </motion.div>
    );
  }

  const rankDisplay = RANK_DISPLAY[card.rank] ?? card.rank;
  const suit = SUIT_SYMBOLS[card.suit];
  const colorClass = styles[SUIT_CLASS[card.suit]];

  return (
    <motion.div
      className={`${styles.card} ${styles.faceUp} ${colorClass} ${winner ? styles.winner : ''} ${loser ? styles.loser : ''} ${small ? styles.small : ''}`}
      initial={initial}
      animate={{
        y: 0, x: 0, rotate: 0, scale: 1,
        opacity: loser ? 0.28 : 1,
        filter: loser ? 'grayscale(70%)' : 'grayscale(0%)',
      }}
      transition={springTransition}
      style={fanStyle}
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
    </motion.div>
  );
}
