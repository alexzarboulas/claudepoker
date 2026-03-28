'use client';

import { useState } from 'react';
import { HandSummary, Card as CardType } from '@/lib/types';
import Card from './Card';
import styles from './Sidebar.module.css';

interface PlayerStats {
  vpip: number;
  pfr: number;
  aggressionFactor: number;
  foldTo3bet: number;
  cbetFreq: number;
  foldToRiverBet: number;
  sampleSize: number;
}

interface Tip {
  id: string;
  text: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
}

interface SidebarProps {
  stats: PlayerStats;
  tips: Tip[];
  history: HandSummary[];
  isOpen?: boolean;
}

const BASELINES = {
  vpip:             { target: 0.68, label: 'VPIP',              green: [0.60, 0.76] as [number,number], amber: [0.50, 0.85] as [number,number] },
  pfr:              { target: 0.52, label: 'PFR',               green: [0.44, 0.60] as [number,number], amber: [0.35, 0.70] as [number,number] },
  aggressionFactor: { target: 2.5,  label: 'Aggression Factor', green: [2.0,  3.2]  as [number,number], amber: [1.5,  4.0]  as [number,number], isRatio: true },
  foldTo3bet:       { target: 0.45, label: 'Fold to 3-Bet',     green: [0.35, 0.55] as [number,number], amber: [0.25, 0.65] as [number,number] },
  cbetFreq:         { target: 0.65, label: 'C-Bet Freq',        green: [0.55, 0.75] as [number,number], amber: [0.45, 0.80] as [number,number] },
  foldToRiverBet:   { target: 0.45, label: 'Fold to River Bet', green: [0.35, 0.55] as [number,number], amber: [0.30, 0.65] as [number,number] },
};

type Tab = 'tutor' | 'stats' | 'history';

export default function Sidebar({ stats, tips, history, isOpen }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('tutor');

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      {/* Tabs */}
      <div className={styles.tabBar}>
        {(['tutor', 'stats', 'history'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'tutor' ? '⚡ Tutor' : tab === 'stats' ? '📊 Stats' : '📋 History'}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'tutor' && <TutorTab tips={tips} />}
        {activeTab === 'stats' && <StatsTab stats={stats} />}
        {activeTab === 'history' && <HistoryTab history={history} />}
      </div>
    </div>
  );
}

/* ---- Tutor Tab ---- */
function TutorTab({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚡</div>
        <div className={styles.emptyTitle}>AI Coach</div>
        <p className={styles.emptyText}>
          Play a few hands and coaching insights will appear here based on your playstyle.
        </p>
        <div className={styles.gtoNote}>
          <span className={styles.gtoLabel}>GTO Target</span>
          <div className={styles.gtoStats}>
            <span>VPIP 68%</span>
            <span>PFR 52%</span>
            <span>AF 2.5×</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tipsWrap}>
      {tips.map(tip => (
        <div key={tip.id} className={`${styles.tipCard} ${styles[`tip_${tip.severity}`]}`}>
          <div className={styles.tipHeader}>
            <span className={styles.tipSeverityDot} />
            <span className={styles.tipSeverityLabel}>
              {tip.severity === 'critical' ? 'Leak Detected' : tip.severity === 'warning' ? 'Trend Warning' : 'Insight'}
            </span>
            <span className={styles.tipTime}>{formatAge(tip.timestamp)}</span>
          </div>
          <p className={styles.tipText}>{tip.text}</p>
        </div>
      ))}
    </div>
  );
}

function formatAge(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

/* ---- Stats Tab ---- */
function StatsTab({ stats }: { stats: PlayerStats }) {
  const insufficient = stats.sampleSize < 10;

  return (
    <div className={styles.statsWrap}>
      {insufficient && (
        <div className={styles.sampleWarning}>
          <span>⚠</span> Need {10 - stats.sampleSize} more hand{10 - stats.sampleSize !== 1 ? 's' : ''} for reliable stats
        </div>
      )}
      {(Object.keys(BASELINES) as (keyof typeof BASELINES)[]).map(key => {
        const baseline = BASELINES[key];
        const value = stats[key as keyof PlayerStats] as number;
        return (
          <StatBar
            key={key}
            label={baseline.label}
            value={value}
            target={baseline.target}
            greenRange={baseline.green}
            amberRange={baseline.amber}
            isRatio={'isRatio' in baseline && baseline.isRatio}
            insufficient={insufficient}
          />
        );
      })}
      <div className={styles.sampleCount}>
        {stats.sampleSize} hands tracked
      </div>
    </div>
  );
}

interface StatBarProps {
  label: string;
  value: number;
  target: number;
  greenRange: [number, number];
  amberRange: [number, number];
  isRatio?: boolean;
  insufficient: boolean;
}

function StatBar({ label, value, target, greenRange, amberRange, isRatio, insufficient }: StatBarProps) {
  const isGreen = value >= greenRange[0] && value <= greenRange[1];
  const isAmber = !isGreen && value >= amberRange[0] && value <= amberRange[1];
  const statusClass = insufficient ? styles.statNeutral : isGreen ? styles.statGood : isAmber ? styles.statWarn : styles.statBad;
  const max = isRatio ? 5 : 1;
  const pct = Math.min((value / max) * 100, 100);
  const targetPct = Math.min((target / max) * 100, 100);

  return (
    <div className={styles.statBar}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        <span className={`${styles.statValue} ${statusClass}`}>
          {isRatio ? value.toFixed(1) + '×' : (value * 100).toFixed(0) + '%'}
        </span>
      </div>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${statusClass}`}
          style={{ width: `${pct}%` }}
        />
        {/* Baseline marker */}
        <div
          className={styles.baselineMarker}
          style={{ left: `${targetPct}%` }}
          title={`GTO: ${isRatio ? target.toFixed(1) + '×' : (target * 100).toFixed(0) + '%'}`}
        />
      </div>
      <div className={styles.statMeta}>
        <span className={styles.statMetaLabel}>GTO: {isRatio ? target.toFixed(1) + '×' : (target * 100).toFixed(0) + '%'}</span>
      </div>
    </div>
  );
}

/* ---- History Tab ---- */
function HistoryTab({ history }: { history: HandSummary[] }) {
  if (history.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <div className={styles.emptyTitle}>No hands yet</div>
        <p className={styles.emptyText}>Your hand history will appear here.</p>
      </div>
    );
  }

  return (
    <div className={styles.historyWrap}>
      {[...history].reverse().map(hand => (
        <div key={hand.handNumber} className={`${styles.handRow} ${styles[`result_${hand.result}`]}`}>
          <div className={styles.handMeta}>
            <span className={styles.handNum}>#{hand.handNumber}</span>
            <span className={`${styles.handResult} ${styles[`result_${hand.result}`]}`}>
              {hand.result === 'won' ? '▲' : hand.result === 'lost' ? '▼' : '◆'}
              {hand.pnl > 0 ? ' +' : hand.pnl < 0 ? ' ' : ' ±'}
              ${Math.abs(hand.pnl).toLocaleString()}
            </span>
          </div>
          <div className={styles.handBoard}>
            {hand.board.slice(0, 5).map((c, i) => (
              <Card key={i} card={c} small animationDelay={0} />
            ))}
            {hand.board.length === 0 && <span className={styles.preflopOnly}>Preflop fold</span>}
          </div>
          <div className={styles.handAction}>{hand.keyAction}</div>
        </div>
      ))}
    </div>
  );
}
