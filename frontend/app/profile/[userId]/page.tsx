import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import styles from '../profile.module.css';
import PresenceDot from '@/components/PresenceDot';
import FriendButton from './FriendButton';
import { db } from '@/lib/db';
import { users, playerStats, friendships } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  const myId = session?.user ? (session.user as { id?: string }).id ?? null : null;

  const targetId = params.userId;

  const [user] = await db.select().from(users).where(eq(users.id, targetId));
  if (!user) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>User not found.</div>;

  let isFriend = false;
  let friendshipId: string | null = null;
  let pendingStatus: string | null = null;

  if (myId && myId !== targetId) {
    const [f] = await db.select().from(friendships).where(
      or(
        and(eq(friendships.requesterId, myId), eq(friendships.addresseeId, targetId)),
        and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, myId))
      )
    );
    if (f) {
      friendshipId = f.id;
      if (f.status === 'accepted') isFriend = true;
      else if (f.status === 'pending') pendingStatus = f.requesterId === myId ? 'sent' : 'incoming';
    }
  }

  let stats = null;
  if (isFriend || myId === targetId) {
    const [s] = await db.select().from(playerStats).where(eq(playerStats.userId, targetId));
    stats = s ?? null;
  }

  const lastSeenStr = user.lastSeen ? new Date(user.lastSeen).toISOString() : null;

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Link href="/friends" className={styles.backBtn}>← Friends</Link>
          {myId && myId !== targetId && isFriend && (
            <Link href={`/messages/${targetId}`} style={{ color: 'var(--gold-primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
              💬 Message
            </Link>
          )}
        </div>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div className={styles.avatar}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : (user.username[0]?.toUpperCase() ?? '?')}
          </div>
          <span style={{ position: 'absolute', bottom: 2, right: 2 }}>
            <PresenceDot lastSeen={lastSeenStr} size={12} />
          </span>
        </div>

        <h1 className={styles.username}>{user.nickname ?? user.username}</h1>
        {user.nickname && <p className={styles.email}>@{user.username}</p>}
        {user.bio && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>{user.bio}</p>}

        {/* Friend action */}
        {myId && myId !== targetId && !isFriend && (
          <FriendButton
            myId={myId}
            targetId={targetId}
            pendingStatus={pendingStatus}
            friendshipId={friendshipId}
          />
        )}

        <div className={styles.divider} />

        {stats ? (
          <div className={styles.statsGrid}>
            <Stat label="Hands Played" value={stats.handsPlayed} />
            <Stat label="VPIP" value={stats.vpipOpp ? `${((stats.vpipCount / stats.vpipOpp) * 100).toFixed(0)}%` : '—'} />
            <Stat label="PFR" value={stats.pfrOpp ? `${((stats.pfrCount / stats.pfrOpp) * 100).toFixed(0)}%` : '—'} />
            <Stat label="Session P&L" value={`${stats.sessionPnl >= 0 ? '+' : ''}${stats.sessionPnl}`} />
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Stats only visible to friends.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
    </div>
  );
}
