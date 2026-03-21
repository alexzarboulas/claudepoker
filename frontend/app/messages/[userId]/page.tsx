import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import DMConversation from '@/components/DMConversation';
import Link from 'next/link';

export default async function ConversationPage({ params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const myId = (session.user as { id?: string }).id!;
  const otherId = params.userId;

  const [other] = await db.select({ id: users.id, username: users.username, nickname: users.nickname })
    .from(users).where(eq(users.id, otherId));
  if (!other) return <div>User not found</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/messages" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>← Back</Link>
          <h2 style={{ margin: 0, fontFamily: "'Cinzel', serif", color: 'var(--text-primary)', fontSize: '1.2rem' }}>
            {other.nickname ?? other.username}
          </h2>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <DMConversation myId={myId} otherId={otherId} otherName={other.nickname ?? other.username} />
        </div>
      </div>
    </div>
  );
}
