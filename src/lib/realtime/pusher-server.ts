import Pusher from 'pusher';

let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherServer;
}

// Helper function to trigger events
export async function triggerProjectUpdate(
  projectId: string,
  event: string,
  data: any
) {
  const pusher = getPusherServer();
  await pusher.trigger(`presence-project-${projectId}`, event, data);
}

export async function triggerOrganizationUpdate(
  organizationId: string,
  event: string,
  data: any
) {
  const pusher = getPusherServer();
  await pusher.trigger(`presence-organization-${organizationId}`, event, data);
}

export async function triggerCommunityInputUpdate(
  organizationId: string,
  event: string,
  data: any
) {
  const pusher = getPusherServer();
  await pusher.trigger(`community-input-${organizationId}`, event, data);
}

// Batch trigger for multiple channels
export async function triggerBatch(triggers: Array<{
  channel: string;
  event: string;
  data: any;
}>) {
  const pusher = getPusherServer();
  await pusher.triggerBatch(triggers.map(t => ({
    channel: t.channel,
    name: t.event,
    data: t.data,
  })));
} 