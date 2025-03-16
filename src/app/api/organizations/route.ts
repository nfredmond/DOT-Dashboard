import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Organization } from '@/types/organization';
import { cookies } from 'next/headers';

// GET /api/organizations - Get all organizations or filtered by user access
export async function GET(request: NextRequest) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const url = new URL(request.url);
  const onlyMine = url.searchParams.get('onlyMine') === 'true';
  
  try {
    let query = supabase.from('organizations').select('*');
    
    // Check if user is admin in metadata
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', userId)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    // If not global admin and only requesting own organizations
    if (!isGlobalAdmin || onlyMine) {
      // Get organizations where user is a member or admin
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId);
      
      if (memberships && memberships.length > 0) {
        const orgIds = memberships.map(m => m.organization_id);
        query = query.in('id', orgIds);
      } else {
        // User has no organizations
        return NextResponse.json({ data: [] });
      }
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create a new organization
export async function POST(request: NextRequest) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const userId = session.user.id;
    const requestData = await request.json();
    
    // Validate input
    if (!requestData.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Insert organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: requestData.name,
        description: requestData.description,
        logo_url: requestData.logoUrl,
        website: requestData.website,
        address: requestData.address,
        city: requestData.city,
        state: requestData.state,
        zip_code: requestData.zipCode,
        primary_contact_name: requestData.primaryContactName,
        primary_contact_email: requestData.primaryContactEmail,
        primary_contact_phone: requestData.primaryContactPhone,
        settings: requestData.settings || {}
      })
      .select()
      .single();
    
    if (orgError) throw orgError;
    
    // Add creator as admin
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        user_id: userId,
        organization_id: organization.id,
        role: 'org_admin',
        joined_at: new Date().toISOString()
      });
    
    if (memberError) throw memberError;
    
    return NextResponse.json({ data: organization }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
} 