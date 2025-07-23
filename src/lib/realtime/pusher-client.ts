import Pusher from 'pusher-js';

let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (!pusherClient) {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
  }
  return pusherClient;
}

export function closePusherClient(): void {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}

// Presence channel types
export interface PresenceInfo {
  userId: string;
  userName: string;
  email: string;
  avatar?: string;
}

export interface PresenceChannel {
  members: Map<string, PresenceInfo>;
}

// Event types
export interface CollaborationEvent {
  type: 'cursor' | 'selection' | 'edit' | 'comment';
  userId: string;
  timestamp: number;
  data: any;
}

export interface ProjectUpdateEvent {
  projectId: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  field?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: number;
}

export interface CommunityInputEvent {
  inputId: string;
  action: 'new' | 'approved' | 'rejected' | 'commented';
  userId: string;
  userName: string;
  data: any;
  timestamp: number;
}

// Helper functions
export function subscribeToProjectChannel(projectId: string) {
  const client = getPusherClient();
  return client.subscribe(`presence-project-${projectId}`);
}

export function subscribeToOrganizationChannel(organizationId: string) {
  const client = getPusherClient();
  return client.subscribe(`presence-organization-${organizationId}`);
}

export function subscribeToCommunityInputChannel(organizationId: string) {
  const client = getPusherClient();
  return client.subscribe(`community-input-${organizationId}`);
} 