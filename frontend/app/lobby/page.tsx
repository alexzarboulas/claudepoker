import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import LobbyCard from '@/components/LobbyCard';

export default async function LobbyPage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');

  const username = (session.user as { name?: string }).name ?? session.user.email ?? 'Player';
  return <LobbyCard username={username} />;
}
