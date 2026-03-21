'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LobbyCard.module.css';

export default function LobbyCard({ username }: { username: string }) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setCreating(true);
    setError('');
    const res = await fetch('/api/rooms/create', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setCreating(false); return; }
    setCreatedCode(data.roomCode);
    setCreating(false);
    // Poll for opponent joining
    pollForStart(data.roomId);
  }

  async function pollForStart(roomId: string) {
    // Redirect once game starts (Pusher handles it on client, this is fallback)
    router.push(`/game/${roomId}`);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setError('');
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setJoining(false); return; }
    router.push(`/game/${data.roomId}`);
  }

  function copyCode() {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.lobby}>
      <div className={styles.header}>
        <div className={styles.logoSmall}>♠ PokerIQ</div>
        <span className={styles.greeting}>Welcome, <strong>{username}</strong></span>
      </div>

      <div className={styles.cards}>
        {/* Create Room */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>New Game</h2>
          <p className={styles.cardDesc}>Create a room and share the code with a friend.</p>
          {!createdCode ? (
            <button className={styles.primaryBtn} onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : '+ Create Room'}
            </button>
          ) : (
            <div className={styles.codeDisplay}>
              <div className={styles.codeLabel}>Share this code:</div>
              <div className={styles.codeRow}>
                <span className={styles.code}>{createdCode}</span>
                <button className={styles.copyBtn} onClick={copyCode}>
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
              <div className={styles.waiting}>
                <span className={styles.waitDot} />
                <span className={styles.waitDot} />
                <span className={styles.waitDot} />
                Waiting for opponent…
              </div>
            </div>
          )}
        </div>

        {/* Join Room */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Join Game</h2>
          <p className={styles.cardDesc}>Enter a room code from your opponent.</p>
          <form onSubmit={handleJoin} className={styles.joinForm}>
            <input
              className={styles.codeInput}
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              required
            />
            <button className={styles.primaryBtn} type="submit" disabled={joining}>
              {joining ? 'Joining…' : 'Join →'}
            </button>
          </form>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
