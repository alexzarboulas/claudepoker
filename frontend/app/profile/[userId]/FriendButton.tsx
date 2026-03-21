'use client';

import { useState } from 'react';

interface Props {
  myId: string;
  targetId: string;
  pendingStatus: string | null;
  friendshipId: string | null;
}

export default function FriendButton({ myId, targetId, pendingStatus, friendshipId }: Props) {
  const [status, setStatus] = useState(pendingStatus);
  const [fId, setFId] = useState(friendshipId);

  async function sendRequest() {
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresseeId: targetId }),
    });
    const data = await res.json();
    setFId(data.id);
    setStatus('sent');
  }

  async function respond(action: 'accept' | 'decline') {
    await fetch(`/api/friends/${fId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (action === 'accept') window.location.reload();
    else setStatus('declined');
  }

  if (status === 'sent') return <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Friend request sent</span>;
  if (status === 'declined') return null;
  if (status === 'incoming') return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => respond('accept')} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 600 }}>Accept</button>
      <button onClick={() => respond('decline')} style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-mid)', borderRadius: 6, padding: '7px 14px', cursor: 'pointer' }}>Decline</button>
    </div>
  );

  return (
    <button onClick={sendRequest} style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 700 }}>
      + Add Friend
    </button>
  );
}
