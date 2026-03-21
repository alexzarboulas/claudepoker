'use client';

import { useState } from 'react';

interface UserResult {
  id: string;
  username: string;
  nickname: string | null;
  avatarUrl: string | null;
  friendStatus: string | null;
  friendshipId: string | null;
  isRequester: boolean;
}

export default function FriendSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  async function sendRequest(addresseeId: string) {
    await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresseeId }),
    });
    // Optimistic update
    setResults(prev => prev.map(u => u.id === addresseeId ? { ...u, friendStatus: 'pending', isRequester: true } : u));
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search by username..."
        value={query}
        onChange={e => search(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-mid)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          fontSize: '0.95rem',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {loading && <div style={{ color: 'var(--text-secondary)', padding: '12px 0', fontSize: '0.85rem' }}>Searching...</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {results.map(u => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            borderRadius: 10, padding: '10px 14px',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'var(--bg-panel)', border: '1px solid var(--border-mid)',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gold-primary)', fontWeight: 700,
            }}>
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.nickname ?? u.username}</div>
              {u.nickname && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{u.username}</div>}
            </div>
            {u.friendStatus === 'accepted' && (
              <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>Friends</span>
            )}
            {u.friendStatus === 'pending' && u.isRequester && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Pending</span>
            )}
            {u.friendStatus === 'pending' && !u.isRequester && (
              <span style={{ color: 'var(--gold-primary)', fontSize: '0.8rem' }}>Incoming</span>
            )}
            {!u.friendStatus && (
              <button
                onClick={() => sendRequest(u.id)}
                style={{
                  background: 'var(--gold-primary)', color: '#000', border: 'none',
                  borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                }}
              >
                Add
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
