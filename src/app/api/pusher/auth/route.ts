import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getPusherServer } from '@/lib/realtime/pusher-server';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();
    
    // Parse request body
    const body = await request.formData();
    const socketId = body.get('socket_id') as string;
    const channelName = body.get('channel_name') as string;
    
    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }
    
    // Check channel authorization
    if (channelName.startsWith('presence-project-')) {
      const projectId = channelName.replace('presence-project-', '');
      
      // Check if user has access to project
      const { data: access } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();
      
      if (!access) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (channelName.startsWith('presence-organization-')) {
      const organizationId = channelName.replace('presence-organization-', '');
      
      // Check if user is member of organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single();
      
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (channelName.startsWith('community-input-')) {
      const organizationId = channelName.replace('community-input-', '');
      
      // Check if user is member of organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single();
      
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
    }
    
    // Authenticate with Pusher
    const pusher = getPusherServer();
    const presenceData = {
      user_id: user.id,
      user_info: {
        userId: user.id,
        userName: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
        email: user.email,
        avatar: profile?.avatar_url,
      },
    };
    
    const authResponse = pusher.authorizeChannel(socketId, channelName, presenceData);
    
    logger.info(`Pusher auth granted for user ${user.id} on channel ${channelName}`);
    
    return NextResponse.json(authResponse);
  } catch (error) {
    logger.error('Error in Pusher auth:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 