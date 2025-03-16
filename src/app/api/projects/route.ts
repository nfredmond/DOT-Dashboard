import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { Project } from '@/types/project';

// Demo projects data
const demoProjects = [
  {
    id: 'demo1',
    name: 'City Transportation Plan',
    description: 'Mapping transportation infrastructure and planning future improvements',
    created_at: '2023-10-15',
    updated_at: '2023-11-20',
    map_type: 'cartoPositron',
    location: 'Downtown',
    status: 'In Progress',
    category: 'Transit',
    priority: 'High',
    estimated_cost: 2500000,
    is_public: true,
    organization_id: 'demo-org'
  },
  {
    id: 'demo2',
    name: 'Urban Development Zones',
    description: 'Identifying and mapping urban development and zoning areas',
    created_at: '2023-09-05',
    updated_at: '2023-11-18',
    map_type: 'cartoDarkMatter',
    location: 'Citywide',
    status: 'Planned',
    category: 'Urban Planning',
    priority: 'Medium',
    estimated_cost: 1800000,
    is_public: true,
    organization_id: 'demo-org'
  },
  {
    id: 'demo3',
    name: 'Bicycle Network Expansion',
    description: 'Expanding the city bicycle network with new paths and safety improvements',
    created_at: '2023-11-01',
    updated_at: '2023-11-25',
    map_type: 'openStreetMap',
    location: 'Multiple Areas',
    status: 'Planned',
    category: 'Active Transportation',
    priority: 'Medium',
    estimated_cost: 950000,
    is_public: true,
    organization_id: 'demo-org'
  }
];

// GET /api/projects - Get projects with organization-based filtering
export async function GET(request: NextRequest) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check for demo mode - if no session is found, look for demo user in cookies/localStorage
  // NOTE: We can't directly access localStorage server-side, but we can check for a demo cookie
  const demoCookie = cookies().get('planning_manager_demo_mode');
  const isDemo = !session && demoCookie?.value === 'true';
  
  if (!session && !isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // If in demo mode, return mock data
  if (isDemo) {
    return NextResponse.json(demoProjects);
  }
  
  // Regular flow for authenticated users
  const userId = session.user.id;
  const url = new URL(request.url);
  const organizationId = url.searchParams.get('organizationId');
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const public_only = url.searchParams.get('public') === 'true';
  const includeMemberAgencies = url.searchParams.get('includeMemberAgencies') === 'true';
  
  try {
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', userId)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    // Set up the query
    let query = supabase.from('projects').select('*');
    
    // Start building OR filter for organization IDs
    let orgIdFilters: string[] = [];
    
    // If organization ID is specified, get that organization and potentially its member agencies
    if (organizationId) {
      // Always include the specified organization
      orgIdFilters.push(organizationId);
      
      // Check if we should include member agencies
      if (includeMemberAgencies) {
        // Get organization data to check if it's a parent
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('is_parent, member_agency_ids')
          .eq('id', organizationId)
          .single();
        
        if (!orgError && orgData && orgData.is_parent && orgData.member_agency_ids?.length > 0) {
          // Add member agency IDs to the filter
          orgIdFilters = [...orgIdFilters, ...(orgData.member_agency_ids as string[])];
        }
      }
      
      // Apply the organization filter
      query = query.in('organization_id', orgIdFilters);
    }
    
    // Add additional filters if specified
    if (status) {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    // If not a global admin, filter by projects user has access to
    if (!isGlobalAdmin) {
      if (organizationId) {
        // Get all organizations the user is a member of
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId);
        
        const userOrgIds = memberships ? memberships.map(m => m.organization_id) : [];
        
        // Check if user is a member of any of the filtered organizations
        const hasAccessToSomeOrg = orgIdFilters.some(orgId => userOrgIds.includes(orgId));
        
        if (!hasAccessToSomeOrg) {
          // User is not a member of any of the requested organizations
          if (public_only) {
            // Only show public projects
            query = query.eq('is_public', true);
          } else {
            // User has no access to non-public projects
            return NextResponse.json({ data: [] });
          }
        }
      } else {
        // No organization specified, get all organizations user is a member of
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId);
        
        if (memberships && memberships.length > 0) {
          const userOrgIds = memberships.map(m => m.organization_id);
          
          // For each organization user is a member of, also get any parent organizations
          const { data: parentOrgs } = await supabase
            .from('organizations')
            .select('id')
            .in('id', userOrgIds);
          
          // Get all parent organization IDs
          let parentOrgIds: string[] = [];
          if (parentOrgs && parentOrgs.length > 0) {
            // Get all member agencies for these parents
            const { data: memberAgencies } = await supabase
              .from('organizations')
              .select('id')
              .in('parent_id', parentOrgs.map(org => org.id));
            
            if (memberAgencies && memberAgencies.length > 0) {
              parentOrgIds = [...parentOrgIds, ...memberAgencies.map(agency => agency.id)];
            }
          }
          
          // Combine user's organizations with parent org's member agencies
          const allAccessibleOrgIds = Array.from(new Set([...userOrgIds, ...parentOrgIds]));
          
          // Get projects from user's organizations OR public projects
          query = query.or(`organization_id.in.(${allAccessibleOrgIds.join(',')}),is_public.eq.true`);
        } else {
          // User has no organizations, only show public projects
          query = query.eq('is_public', true);
        }
      }
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
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
    
    // Validate required fields
    if (!requestData.name || !requestData.organizationId) {
      return NextResponse.json(
        { error: 'Name and organization ID are required' },
        { status: 400 }
      );
    }
    
    // Check organization details to determine if it's a member agency
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('parent_id, parent_name, settings')
      .eq('id', requestData.organizationId)
      .single();
    
    if (orgError) throw orgError;
    
    // Check if user has permission to create projects in the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', requestData.organizationId)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', userId)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    // Only org admins, org members, or global admins can create projects
    if (!isGlobalAdmin && (!membership || membershipError)) {
      // If this is a member agency, check if user has access to the parent organization
      if (organization.parent_id) {
        const { data: parentMembership, error: parentMembershipError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', userId)
          .eq('organization_id', organization.parent_id)
          .single();
        
        // If user doesn't have access to either the member agency or parent, deny access
        if (!parentMembership || parentMembershipError) {
          return NextResponse.json(
            { error: 'Forbidden: You do not have permission to create projects in this organization' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to create projects in this organization' },
          { status: 403 }
        );
      }
    }
    
    // Set up parent organization tracking if this is a member agency
    const isMemberAgencyProject = !!organization.parent_id;
    const parentOrgId = organization.parent_id || null;
    
    // Prepare the project data
    const projectData = {
      name: requestData.name,
      description: requestData.description || '',
      location: requestData.location || '',
      category: requestData.category || 'Other',
      status: requestData.status || 'draft',
      priority: requestData.priority || 'Medium',
      
      // Dates
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      start_date: requestData.startDate,
      end_date: requestData.endDate,
      
      // Budget
      estimated_cost: requestData.estimatedCost || 0,
      allocated_budget: requestData.allocatedBudget || 0,
      
      // GIS/Mapping
      coordinates: requestData.coordinates || { latitude: 0, longitude: 0 },
      geometry: requestData.geometry,
      
      // Organization and access control
      organization_id: requestData.organizationId,
      created_by: userId,
      visibility: requestData.visibility || 'private',
      
      // Member Agency tracking
      parent_org_id: parentOrgId,
      is_member_agency_project: isMemberAgencyProject,
      original_org_id: requestData.organizationId,
      
      // Initialize reporting data if this is a member agency project
      reporting_data: isMemberAgencyProject && organization.settings?.customReportingFields 
        ? organization.settings.customReportingFields.map((field: any) => ({
            id: crypto.randomUUID(),
            fieldId: field.id,
            fieldName: field.name,
            value: null,
            reportedAt: null,
            reportedBy: null,
            reportPeriod: null,
          }))
        : [],
      
      // Any additional fields
      metadata: requestData.metadata || {}
    };
    
    // Insert the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
    
    if (projectError) throw projectError;
    
    // Process and store any geospatial files if they were included
    if (requestData.geospatialFiles && requestData.geospatialFiles.length > 0) {
      // In a real implementation, you would process and store files here
      // This is just a placeholder for the logic
      console.log('Processing geospatial files:', requestData.geospatialFiles.length);
    }
    
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 