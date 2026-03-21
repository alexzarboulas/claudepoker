import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { playerStats, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import styles from './profile.module.css';
import Link from 'next/link';

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');
  const userId = (session.user as { id?: string }).id!;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [stats] = await db.select().from(playerStats).where(eq(playerStats.userId, userId));

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase() ?? '?'}</div>
        <h1 className={styles.username}>{user?.username}</h1>
        <p className={styles.email}>{user?.email}</p>

        <div className={styles.divider} />

        <div className={styles.statsGrid}>
          <Stat label="Hands Played" value={stats?.handsPlayed ?? 0} />
          <Stat label="VPIP" value={stats?.vpipOpp ? `${((stats.vpipCount / stats.vpipOpp) * 100).toFixed(0)}%` : '—'} />
          <Stat label="PFR" value={stats?.pfrOpp ? `${((stats.pfrCount / stats.pfrOpp) * 100).toFixed(0)}%` : '—'} />
          <Stat label="Session P&L" value={`${(stats?.sessionPnl ?? 0) >= 0 ? '+' : ''}${stats?.sessionPnl ?? 0}`} />
        </div>

        <Link href="/lobby" className={styles.backBtn}>← Back to Lobby</Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
