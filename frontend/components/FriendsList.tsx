'use client';

import { useEffect, useState } from 'react';
import PresenceDot from './PresenceDot';
import Link from 'next/link';

interface Friend {
  id: string;
  username: string;
  nickname: string | null;
  avatarUrl: string | null;
  lastSeen: string | null;
  friendshipId: string;
}

export default function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/friends');
    const data = await res.json();
    setFriends(data.friends ?? []);
    setPending(data.pending ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function respond(friendshipId: string, action: 'accept' | 'decline') {
    await fetch(`/api/friends/${friendshipId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    load();
  }

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Loading...</div>;

  return (
    <div>
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Friend Requests ({pending.length})
          </div>
          {pending.map(u => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 8,
            }}>
              <UserAvatar user={u} />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.nickname ?? u.username}</div>
                {u.nickname && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{u.username}</div>}
              </div>
              <button onClick={() => respond(u.friendshipId, 'accept')} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', marginRight: 6 }}>Accept</button>
              <button onClick={() => respond(u.friendshipId, 'decline')} style={{ background: 'var(--bg-panel)', color: 'var(--text-secondary)', border: '1px solid var(--border-mid)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>Decline</button>
            </div>
          ))}
        </div>
      )}

      {friends.length === 0 && pending.length === 0 && (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
          No friends yet. Use the Search tab to find players.
        </div>
      )}

      <div>
        {friends.length > 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Friends ({friends.length})</div>}
        {friends.map(u => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 8,
          }}>
            <UserAvatar user={u} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.nickname ?? u.username}</span>
                <PresenceDot lastSeen={u.lastSeen} size={8} />
              </div>
              {u.nickname && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{u.username}</div>}
            </div>
            <Link href={`/messages/${u.id}`} style={{
              background: 'var(--bg-panel)', color: 'var(--gold-primary)', border: '1px solid var(--border-mid)',
              borderRadius: 6, padding: '6px 12px', textDecoration: 'none', fontSize: '0.8rem', marginRight: 6,
            }}>
              DM
            </Link>
            <Link href={`/profile/${u.id}`} style={{
              color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none',
            }}>
              Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserAvatar({ user }: { user: { username: string; avatarUrl: string | null } }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
      background: 'var(--bg-panel)', border: '1px solid var(--border-mid)',
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--gold-primary)', fontWeight: 700,
    }}>
      {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.username[0].toUpperCase()}
    </div>
  );
}
