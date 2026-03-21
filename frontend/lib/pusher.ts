import Pusher from 'pusher';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function triggerUserEvent(userId: string, event: string, data: unknown) {
  return pusherServer.trigger(`private-user-${userId}`, event, data);
}
