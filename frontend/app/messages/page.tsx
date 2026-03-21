import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { directMessages, users } from '@/lib/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import Link from 'next/link';

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const myId = (session.user as { id?: string }).id!;

  // Get all DMs involving me
  const msgs = await db.select().from(directMessages).where(
    or(eq(directMessages.senderId, myId), eq(directMessages.receiverId, myId))
  ).orderBy(desc(directMessages.createdAt));

  // Build conversation list (unique other userId, latest msg)
  const convMap = new Map<string, typeof msgs[0]>();
  for (const m of msgs) {
    const otherId = m.senderId === myId ? m.receiverId : m.senderId;
    if (!convMap.has(otherId)) convMap.set(otherId, m);
  }

  const convList = await Promise.all([...convMap.entries()].map(async ([otherId, lastMsg]) => {
    const [u] = await db.select({ username: users.username, nickname: users.nickname, avatarUrl: users.avatarUrl })
      .from(users).where(eq(users.id, otherId));
    return { otherId, lastMsg, user: u };
  }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: 24 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontFamily: "'Cinzel', serif", color: 'var(--text-primary)', fontSize: '1.6rem' }}>Messages</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/lobby" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Lobby</Link>
            <Link href="/friends" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Friends</Link>
          </div>
        </div>

        {convList.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '60px 0' }}>
            No messages yet. Start a conversation from your Friends list.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {convList.map(({ otherId, lastMsg, user: u }) => (
              <Link key={otherId} href={`/messages/${otherId}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--bg-input)', border: '1px solid var(--border-mid)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--gold-primary)', fontWeight: 700,
                  }}>
                    {u?.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u?.username[0]?.toUpperCase() ?? '?')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u?.nickname ?? u?.username ?? 'Unknown'}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lastMsg.senderId === myId ? 'You: ' : ''}{lastMsg.content}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
