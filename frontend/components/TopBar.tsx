'use client';

import styles from './TopBar.module.css';

interface TopBarProps {
  sessionPnl: number;
  handCount: number;
  humanStack: number;
  opponentStack: number;
  smallBlind: number;
  bigBlind: number;
}

export default function TopBar({ sessionPnl, handCount, humanStack, opponentStack, smallBlind, bigBlind }: TopBarProps) {
  const pnlSign = sessionPnl >= 0 ? '+' : '';
  const pnlClass = sessionPnl > 0 ? styles.positive : sessionPnl < 0 ? styles.negative : styles.neutral;

  return (
    <div className={styles.topbar}>
      <div className={styles.logo}>
        <span className={styles.logoPoker}>Poker</span>
        <span className={styles.logoIQ}>IQ</span>
      </div>

      <div className={styles.stats}>
        <StatItem label="Session P&L" value={`${pnlSign}${sessionPnl}`} valueClass={pnlClass} prefix="$" />
        <div className={styles.divider} />
        <StatItem label="Hands" value={String(handCount)} />
        <div className={styles.divider} />
        <StatItem label="Blinds" value={`${smallBlind}/${bigBlind}`} />
        <div className={styles.divider} />
        <StatItem label="Your Stack" value={String(humanStack)} prefix="$" />
        <div className={styles.divider} />
        <StatItem label="Opponent" value={String(opponentStack)} prefix="$" />
      </div>

      <div className={styles.badge}>HEADS-UP</div>
    </div>
  );
}

function StatItem({ label, value, valueClass, prefix }: { label: string; value: string; valueClass?: string; prefix?: string }) {
  return (
    <div className={styles.statItem}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${valueClass ?? ''}`}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        {value}
      </span>
    </div>
  );
}
