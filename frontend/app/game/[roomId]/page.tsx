import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import MultiplayerGame from './MultiplayerGame';

export default async function GamePage({ params }: { params: { roomId: string } }) {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');

  const userId = (session.user as { id?: string }).id!;
  const username = (session.user as { name?: string }).name ?? session.user.email ?? 'You';

  return <MultiplayerGame roomId={params.roomId} userId={userId} username={username} />;
}
