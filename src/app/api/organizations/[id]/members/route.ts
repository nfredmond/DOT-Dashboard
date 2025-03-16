import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// GET /api/organizations/[id]/members - Get all members of an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const orgId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // First check if user has access to view members
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', orgId)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', session.user.id)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    // Check if user has permission to view members
    if (!isGlobalAdmin && (!membership || membershipError)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this organization' },
        { status: 403 }
      );
    }
    
    // Get members with user details
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        user_id,
        role,
        joined_at,
        invited_by,
        permissions,
        users:user_id (
          id,
          email,
          first_name,
          last_name,
          profile_image
        )
      `)
      .eq('organization_id', orgId);
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization members' },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/members - Add a new member to the organization
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const orgId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if user is admin of the organization or global admin
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', orgId)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', session.user.id)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    const isOrgAdmin = membership?.role === 'org_admin';
    
    if (!isGlobalAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only organization admins can add members' },
        { status: 403 }
      );
    }
    
    // Get data from request
    const requestData = await request.json();
    
    if (!requestData.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', requestData.email)
      .single();
    
    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw userError;
    }
    
    if (existingUser) {
      // User exists, add them directly to organization
      const { data: newMember, error: addError } = await supabase
        .from('organization_members')
        .insert({
          user_id: existingUser.id,
          organization_id: orgId,
          role: requestData.role || 'org_member',
          joined_at: new Date().toISOString(),
          invited_by: session.user.id
        })
        .select()
        .single();
      
      if (addError) throw addError;
      
      return NextResponse.json({ data: newMember }, { status: 201 });
    } else {
      // User doesn't exist, create an invitation
      const { data: invite, error: inviteError } = await supabase
        .from('organization_invites')
        .insert({
          email: requestData.email,
          organization_id: orgId,
          role: requestData.role || 'org_member',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          invited_by: session.user.id,
          status: 'pending',
          token: crypto.randomUUID()
        })
        .select()
        .single();
      
      if (inviteError) throw inviteError;
      
      // TODO: Send invitation email
      
      return NextResponse.json({ data: invite, type: 'invite' }, { status: 201 });
    }
  } catch (error) {
    console.error('Error adding organization member:', error);
    return NextResponse.json(
      { error: 'Failed to add organization member' },
      { status: 500 }
    );
  }
} 