import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { playerStats, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ProfileEditClient from './ProfileEditClient';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as { id?: string }).id!;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [stats] = await db.select().from(playerStats).where(eq(playerStats.userId, userId));

  return <ProfileEditClient user={user} stats={stats ?? null} />;
}
