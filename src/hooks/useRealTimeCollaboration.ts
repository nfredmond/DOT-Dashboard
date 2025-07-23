import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPusherClient, 
  closePusherClient,
  PresenceInfo,
  ProjectUpdateEvent,
  CommunityInputEvent
} from '@/lib/realtime/pusher-client';
import type { Channel, PresenceChannel } from 'pusher-js';

interface UseRealTimeCollaborationOptions {
  projectId?: string;
  organizationId?: string;
  onProjectUpdate?: (event: ProjectUpdateEvent) => void;
  onCommunityInput?: (event: CommunityInputEvent) => void;
  onMembersChange?: (members: PresenceInfo[]) => void;
}

export function useRealTimeCollaboration({
  projectId,
  organizationId,
  onProjectUpdate,
  onCommunityInput,
  onMembersChange,
}: UseRealTimeCollaborationOptions) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeMembers, setActiveMembers] = useState<PresenceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const channelsRef = useRef<Map<string, Channel>>(new Map());
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);
  
  // Initialize Pusher connection
  useEffect(() => {
    if (!user) return;
    
    try {
      pusherRef.current = getPusherClient();
      
      pusherRef.current.connection.bind('connected', () => {
        setIsConnected(true);
        setError(null);
      });
      
      pusherRef.current.connection.bind('error', (err: any) => {
        setError(err.message || 'Connection error');
        setIsConnected(false);
      });
      
      pusherRef.current.connection.bind('disconnected', () => {
        setIsConnected(false);
      });
      
      return () => {
        if (pusherRef.current) {
          pusherRef.current.connection.unbind_all();
        }
      };
    } catch (err) {
      console.error('Error initializing Pusher:', err);
      setError('Failed to initialize real-time connection');
    }
  }, [user]);
  
  // Subscribe to project channel
  useEffect(() => {
    if (!projectId || !pusherRef.current || !isConnected) return;
    
    const channelName = `presence-project-${projectId}`;
    let channel = channelsRef.current.get(channelName);
    
    if (!channel) {
      channel = pusherRef.current.subscribe(channelName) as PresenceChannel;
      channelsRef.current.set(channelName, channel);
      
      // Handle presence events
      channel.bind('pusher:subscription_succeeded', (members: any) => {
        const membersList = Object.values(members.members) as PresenceInfo[];
        setActiveMembers(membersList);
        onMembersChange?.(membersList);
      });
      
      channel.bind('pusher:member_added', (member: any) => {
        setActiveMembers(prev => {
          const updated = [...prev, member.info as PresenceInfo];
          onMembersChange?.(updated);
          return updated;
        });
      });
      
      channel.bind('pusher:member_removed', (member: any) => {
        setActiveMembers(prev => {
          const updated = prev.filter(m => m.userId !== member.id);
          onMembersChange?.(updated);
          return updated;
        });
      });
      
      // Handle project update events
      if (onProjectUpdate) {
        channel.bind('project-updated', onProjectUpdate);
        channel.bind('project-field-changed', onProjectUpdate);
        channel.bind('scenario-updated', onProjectUpdate);
        channel.bind('task-updated', onProjectUpdate);
      }
    }
    
    return () => {
      if (channel && pusherRef.current) {
        channel.unbind_all();
        pusherRef.current.unsubscribe(channelName);
        channelsRef.current.delete(channelName);
      }
    };
  }, [projectId, isConnected, onProjectUpdate, onMembersChange]);
  
  // Subscribe to organization channel
  useEffect(() => {
    if (!organizationId || !pusherRef.current || !isConnected) return;
    
    const channelName = `presence-organization-${organizationId}`;
    let channel = channelsRef.current.get(channelName);
    
    if (!channel) {
      channel = pusherRef.current.subscribe(channelName) as PresenceChannel;
      channelsRef.current.set(channelName, channel);
      
      // Handle organization-wide events
      channel.bind('member-joined', (data: any) => {
        console.log('New member joined organization:', data);
      });
      
      channel.bind('member-left', (data: any) => {
        console.log('Member left organization:', data);
      });
    }
    
    return () => {
      if (channel && pusherRef.current) {
        channel.unbind_all();
        pusherRef.current.unsubscribe(channelName);
        channelsRef.current.delete(channelName);
      }
    };
  }, [organizationId, isConnected]);
  
  // Subscribe to community input channel
  useEffect(() => {
    if (!organizationId || !pusherRef.current || !isConnected || !onCommunityInput) {
      return;
    }
    
    const channelName = `community-input-${organizationId}`;
    let channel = channelsRef.current.get(channelName);
    
    if (!channel) {
      channel = pusherRef.current.subscribe(channelName);
      channelsRef.current.set(channelName, channel);
      
      // Handle community input events
      channel.bind('new-input', onCommunityInput);
      channel.bind('input-approved', onCommunityInput);
      channel.bind('input-rejected', onCommunityInput);
      channel.bind('input-commented', onCommunityInput);
    }
    
    return () => {
      if (channel && pusherRef.current) {
        channel.unbind_all();
        pusherRef.current.unsubscribe(channelName);
        channelsRef.current.delete(channelName);
      }
    };
  }, [organizationId, isConnected, onCommunityInput]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all channels
      channelsRef.current.forEach((channel, name) => {
        channel.unbind_all();
        pusherRef.current?.unsubscribe(name);
      });
      channelsRef.current.clear();
      
      // Close connection if no other components are using it
      if (pusherRef.current) {
        closePusherClient();
      }
    };
  }, []);
  
  // Helper function to emit events
  const emit = useCallback((eventName: string, data: any) => {
    if (!isConnected) {
      console.warn('Cannot emit event: not connected');
      return;
    }
    
    // Find the appropriate channel and trigger the event
    channelsRef.current.forEach((channel) => {
      if (channel.name.includes('presence-')) {
        channel.trigger(`client-${eventName}`, data);
      }
    });
  }, [isConnected]);
  
  // Get member by userId
  const getMember = useCallback((userId: string) => {
    return activeMembers.find(m => m.userId === userId);
  }, [activeMembers]);
  
  return {
    isConnected,
    activeMembers,
    error,
    emit,
    getMember,
  };
} 