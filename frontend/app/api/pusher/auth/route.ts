import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;
  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get('socket_id')!;
  const channel = params.get('channel_name')!;
  // Only allow subscribing to own private channel
  if (channel !== `private-user-${userId}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const authResponse = pusherServer.authorizeChannel(socketId, channel);
  return NextResponse.json(authResponse);
}
