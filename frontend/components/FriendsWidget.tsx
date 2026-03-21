'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import PresenceDot from './PresenceDot';

interface Friend {
  id: string;
  username: string;
  nickname: string | null;
  avatarUrl: string | null;
  lastSeen: string | null;
}

export default function FriendsWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/friends');
      if (!res.ok) return;
      const data = await res.json();
      setFriends(data.friends ?? []);
    } catch {}
  }

  useEffect(() => {
    if (!session?.user) return;
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [session]);

  if (!session?.user) return null;

  const onlineCount = friends.filter(f => {
    if (!f.lastSeen) return false;
    return (Date.now() - new Date(f.lastSeen).getTime()) < 2 * 60 * 1000;
  }).length;

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: 16,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      {open && (
        <div style={{
          width: 220,
          maxHeight: 360,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
              Friends {onlineCount > 0 && <span style={{ color: '#22c55e' }}>· {onlineCount} online</span>}
            </span>
            <Link href="/friends" onClick={() => setOpen(false)} style={{
              color: 'var(--text-secondary)', fontSize: '0.75rem', textDecoration: 'none',
            }}>
              All
            </Link>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {friends.length === 0 ? (
              <div style={{ padding: '16px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                No friends yet.{' '}
                <Link href="/friends" onClick={() => setOpen(false)} style={{ color: 'var(--gold-primary)' }}>
                  Find players
                </Link>
              </div>
            ) : (
              friends.map(f => {
                const isOnline = f.lastSeen
                  ? (Date.now() - new Date(f.lastSeen).getTime()) < 2 * 60 * 1000
                  : false;
                return (
                  <Link
                    key={f.id}
                    href={`/messages/${f.id}`}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      textDecoration: 'none',
                      borderBottom: '1px solid var(--border-subtle)',
                      opacity: isOnline ? 1 : 0.5,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-mid)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gold-primary)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}>
                      {f.avatarUrl
                        ? <img src={f.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : f.username[0].toUpperCase()}
                    </div>
                    {/* Name + dot */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {f.nickname ?? f.username}
                        </span>
                        <PresenceDot lastSeen={f.lastSeen} size={7} />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-mid)',
          borderRadius: 20,
          padding: '8px 14px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontWeight: 600,
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}
      >
        <span>👥</span>
        <span>Friends</span>
        {onlineCount > 0 && (
          <span style={{
            background: '#22c55e',
            color: '#000',
            borderRadius: 10,
            padding: '1px 6px',
            fontSize: '0.72rem',
            fontWeight: 700,
          }}>
            {onlineCount}
          </span>
        )}
      </button>
    </div>
  );
}
