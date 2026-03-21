'use client';

import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';

interface ChatMsg { username: string; content: string; }

interface Props {
  roomId: string;
  myUsername: string;
}

export default function TableChat({ roomId, myUsername }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`game-${roomId}`);
    channel.bind('chat', (data: ChatMsg) => {
      setMessages(prev => [...prev, data]);
      setUnread(prev => open ? 0 : prev + 1);
    });
    return () => {
      channel.unbind('chat');
      pusher.unsubscribe(`game-${roomId}`);
    };
  }, [roomId, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  async function send() {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    await fetch(`/api/chat/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  }

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
    }}>
      {open && (
        <div style={{
          width: 300, height: 360, background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)', borderRadius: 12,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Table Chat</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>{m.username}: </span>
                <span style={{ color: 'var(--text-primary)' }}>{m.content}</span>
              </div>
            ))}
            {messages.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No messages yet</div>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 6 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Say something..."
              style={{
                flex: 1, padding: '7px 10px', background: 'var(--bg-input)',
                border: '1px solid var(--border-mid)', borderRadius: 6,
                color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
              }}
            />
            <button onClick={send} style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>↑</button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'var(--bg-panel)', border: '1px solid var(--border-mid)',
          borderRadius: 24, padding: '10px 16px', cursor: 'pointer',
          color: 'var(--gold-primary)', fontWeight: 600, fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}
      >
        💬 Chat
        {unread > 0 && (
          <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
