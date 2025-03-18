import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// GET /api/organizations/[id]/member-agencies - Get all member agencies of an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const parentOrgId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // First check if user has access to view the parent organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', parentOrgId)
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
    
    // Check if the organization is a parent organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('is_parent')
      .eq('id', parentOrgId)
      .single();
    
    if (orgError) throw orgError;
    
    if (!organization.is_parent) {
      return NextResponse.json(
        { error: 'This organization is not set up to have member agencies' },
        { status: 400 }
      );
    }
    
    // Get all member agencies of this parent
    const { data: memberAgencies, error: memberAgenciesError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        description,
        logo_url,
        created_at,
        updated_at,
        parent_id,
        tier,
        settings,
        member_count:organization_members(count)
      `)
      .eq('parent_id', parentOrgId);
    
    if (memberAgenciesError) throw memberAgenciesError;
    
    // Get project counts for each member agency
    const memberAgencyIds = memberAgencies.map(agency => agency.id);
    
    if (memberAgencyIds.length > 0) {
      // Get project counts for each member agency
      for (const agency of memberAgencies) {
        const { count, error: countError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', agency.id);
        
        if (!countError) {
          // Add the count to the agency object
          (agency as any).project_count = count || 0;
        }
      }
    }
    
    return NextResponse.json({ data: memberAgencies });
  } catch (error) {
    logger.error('Error fetching member agencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member agencies' },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/member-agencies - Create a new member agency under this parent
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const parentOrgId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if user is admin of the parent organization or global admin
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', parentOrgId)
      .eq('role', 'org_admin')
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', session.user.id)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    if (!isGlobalAdmin && (!membership || membershipError)) {
      return NextResponse.json(
        { error: 'Forbidden: Only organization admins can create member agencies' },
        { status: 403 }
      );
    }
    
    // Check if the organization is a parent and allows member agency creation
    const { data: parentOrg, error: parentOrgError } = await supabase
      .from('organizations')
      .select('is_parent, settings, name, tier')
      .eq('id', parentOrgId)
      .single();
    
    if (parentOrgError) throw parentOrgError;
    
    if (!parentOrg.is_parent) {
      return NextResponse.json(
        { error: 'This organization is not set up to have member agencies' },
        { status: 400 }
      );
    }
    
    if (parentOrg.settings && 
        parentOrg.settings.allowMemberAgencyCreation !== undefined && 
        !parentOrg.settings.allowMemberAgencyCreation) {
      return NextResponse.json(
        { error: 'Member agency creation is disabled for this organization' },
        { status: 400 }
      );
    }
    
    // Get data from request

const requestData = await request.json();
    
    // Validate input
    if (!requestData.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Prepare member agency data
    const memberAgencyData = {
      name: requestData.name,
      description: requestData.description || '',
      logo_url: requestData.logoUrl,
      website: requestData.website,
      address: requestData.address,
      city: requestData.city,
      state: requestData.state,
      zip_code: requestData.zipCode,
      primary_contact_name: requestData.primaryContactName,
      primary_contact_email: requestData.primaryContactEmail,
      primary_contact_phone: requestData.primaryContactPhone,
      
      // Hierarchy specific fields
      parent_id: parentOrgId,
      parent_name: parentOrg.name,
      is_parent: false, // Member agencies are not parents by default
      tier: (parentOrg.tier || 0) + 1,
      
      // Settings
      settings: parentOrg.settings && parentOrg.settings.inheritParentSettings 
        ? { ...parentOrg.settings, inheritParentSettings: true }
        : requestData.settings || {}
    };
    
    // Insert member agency
    const { data: memberAgency, error: createError } = await supabase
      .from('organizations')
      .insert(memberAgencyData)
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Add creator as admin of the member agency
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        user_id: session.user.id,
        organization_id: memberAgency.id,
        role: 'org_admin',
        joined_at: new Date().toISOString()
      });
    
    if (memberError) throw memberError;
    
    // Update parent organization's memberAgencyIds array
    const { data: parentData, error: parentGetError } = await supabase
      .from('organizations')
      .select('member_agency_ids')
      .eq('id', parentOrgId)
      .single();

    if (parentGetError) throw parentGetError;

    const memberAgencyIds = parentData.member_agency_ids || [];
    memberAgencyIds.push(memberAgency.id);

    const { error: updateParentError } = await supabase
      .from('organizations')
      .update({
        member_agency_ids: memberAgencyIds
      })
      .eq('id', parentOrgId);

    if (updateParentError) throw updateParentError;
    
    return NextResponse.json({ data: memberAgency }, { status: 201 });
  } catch (error) {
    logger.error('Error creating member agency:', error);
    return NextResponse.json(
      { error: 'Failed to create member agency' },
      { status: 500 }
    );
  }
} 