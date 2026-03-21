'use client';

import { useState } from 'react';
import FriendsList from '@/components/FriendsList';
import FriendSearch from '@/components/FriendSearch';
import Link from 'next/link';

export default function FriendsPageClient() {
  const [tab, setTab] = useState<'friends' | 'search'>('friends');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: 24 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontFamily: "'Cinzel', serif", color: 'var(--text-primary)', fontSize: '1.6rem' }}>Friends</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/lobby" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Lobby</Link>
            <Link href="/messages" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Messages</Link>
            <Link href="/profile" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Profile</Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg-panel)', borderRadius: 10, padding: 4, border: '1px solid var(--border-subtle)' }}>
          {(['friends', 'search'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: tab === t ? 'var(--bg-input)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: tab === t ? 600 : 400, fontSize: '0.9rem', textTransform: 'capitalize',
            }}>
              {t === 'search' ? 'Find Players' : 'My Friends'}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20 }}>
          {tab === 'friends' ? <FriendsList /> : <FriendSearch />}
        </div>
      </div>
    </div>
  );
}
