'use client';

import { useState } from 'react';
import AvatarUpload from '@/components/AvatarUpload';
import PresenceDot from '@/components/PresenceDot';
import Link from 'next/link';
import styles from './profile.module.css';

interface Props {
  user: {
    id: string; username: string; email: string;
    bio: string | null; nickname: string | null; avatarUrl: string | null; lastSeen: Date | null;
  };
  stats: {
    handsPlayed: number; vpipCount: number; vpipOpp: number;
    pfrCount: number; pfrOpp: number; sessionPnl: number;
  } | null;
}

export default function ProfileEditClient({ user, stats }: Props) {
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user.nickname ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname || null, bio: bio || null, avatarUrl }),
    });
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  const lastSeenStr = user.lastSeen ? new Date(user.lastSeen).toISOString() : null;

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 480 }}>
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
          <Link href="/lobby" className={styles.backBtn}>← Lobby</Link>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/friends" className={styles.backBtn}>Friends</Link>
            <Link href="/messages" className={styles.backBtn}>Messages</Link>
          </div>
        </div>

        {editing ? (
          <AvatarUpload currentUrl={avatarUrl} username={user.username} onUpload={setAvatarUrl} />
        ) : (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div className={styles.avatar}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (user.username[0]?.toUpperCase() ?? '?')}
            </div>
            <span style={{ position: 'absolute', bottom: 2, right: 2 }}>
              <PresenceDot lastSeen={lastSeenStr} size={12} />
            </span>
          </div>
        )}

        <h1 className={styles.username}>
          {editing
            ? <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder={user.username} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 10px', fontSize: '1.4rem', width: '100%', textAlign: 'center', fontFamily: 'inherit' }} />
            : (nickname || user.username)}
        </h1>
        <p className={styles.email}>{user.email}</p>

        {editing ? (
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Write a short bio..."
            rows={3}
            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)', borderRadius: 8, padding: '10px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
          />
        ) : bio ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>{bio}</p>
        ) : null}

        <div className={styles.divider} />

        <div className={styles.statsGrid}>
          <Stat label="Hands Played" value={stats?.handsPlayed ?? 0} />
          <Stat label="VPIP" value={stats?.vpipOpp ? `${((stats.vpipCount / stats.vpipOpp) * 100).toFixed(0)}%` : '—'} />
          <Stat label="PFR" value={stats?.pfrOpp ? `${((stats.pfrCount / stats.pfrOpp) * 100).toFixed(0)}%` : '—'} />
          <Stat label="Session P&L" value={`${(stats?.sessionPnl ?? 0) >= 0 ? '+' : ''}${stats?.sessionPnl ?? 0}`} />
        </div>

        {editing ? (
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} style={{ flex: 1, background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-mid)', borderRadius: 8, padding: '10px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-mid)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', marginTop: 4 }}>
            {saved ? '✓ Saved' : 'Edit Profile'}
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.stat} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
    </div>
  );
}
