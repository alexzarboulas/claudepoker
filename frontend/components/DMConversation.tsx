'use client';

import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

interface Props {
  myId: string;
  otherId: string;
  otherName: string;
}

export default function DMConversation({ myId, otherId, otherName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/messages/${otherId}`)
      .then(r => r.json())
      .then(setMessages);
  }, [otherId]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });
    const channel = pusher.subscribe(`private-user-${myId}`);
    channel.bind('new-message', (msg: Message) => {
      if ((msg.senderId === otherId && msg.receiverId === myId) ||
          (msg.senderId === myId && msg.receiverId === otherId)) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-user-${myId}`);
    };
  }, [myId, otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/messages/${otherId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    });
    const msg = await res.json();
    setMessages(prev => [...prev, msg]);
    setInput('');
    setSending(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(msg => {
          const isMe = msg.senderId === myId;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '8px 14px', borderRadius: 12,
                background: isMe ? 'var(--gold-primary)' : 'var(--bg-input)',
                color: isMe ? '#000' : 'var(--text-primary)',
                fontSize: '0.9rem', lineHeight: 1.4,
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Message ${otherName}...`}
          style={{
            flex: 1, padding: '10px 14px', background: 'var(--bg-input)',
            border: '1px solid var(--border-mid)', borderRadius: 8,
            color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={sending}
          style={{
            background: 'var(--gold-primary)', color: '#000', border: 'none',
            borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
