import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

interface ProjectData {
  id: string;
  name: string;
  description: string;
  organization_id: string;
  status: string;
  category: string;
  location: string;
  start_date: string;
  end_date: string;
  estimated_cost: number;
  allocated_budget: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  is_member_agency_project: boolean;
  parent_org_id: string;
  reporting_data: Array<{
    id: string;
    fieldId: string;
    fieldName: string;
    value: any;
    reportedAt: string | null;
    reportedBy: string | null;
    reportPeriod: string | null;
    notes: string | null;
  }>;
  original_org_id: string;
  shared_with_orgs: string[];
  [key: string]: any;
}

interface FormattedProject extends ProjectData {
  organizationName?: string;
}

// GET /api/organizations/[id]/batch-export - Export projects for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const organizationId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const includeMemberAgencies = searchParams.get('includeMemberAgencies') === 'true';
    const includeReportingFields = searchParams.get('includeReportingFields') === 'true';
    const filterStatus = searchParams.get('status');
    const filterCategory = searchParams.get('category');
    
    // Check if user has permission to access this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', organizationId)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', session.user.id)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    if (!membership && !isGlobalAdmin) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }
    
    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name, is_parent, member_agency_ids, parent_id, settings')
      .eq('id', organizationId)
      .single();
    
    if (orgError) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Build query to get projects
    let projectsQuery = supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        organization_id,
        status,
        category,
        location,
        start_date,
        end_date,
        estimated_cost,
        allocated_budget,
        created_at,
        created_by,
        updated_at,
        updated_by,
        is_member_agency_project,
        parent_org_id,
        reporting_data,
        original_org_id,
        shared_with_orgs
      `);
    
    // Apply filters if provided
    if (filterStatus) {
      projectsQuery = projectsQuery.eq('status', filterStatus);
    }
    
    if (filterCategory) {
      projectsQuery = projectsQuery.eq('category', filterCategory);
    }
    
    let orgIds: string[] = [organizationId];
    
    // Include member agency projects if requested and if this is a parent org
    if (includeMemberAgencies && organization.is_parent && 
        organization.member_agency_ids && organization.member_agency_ids.length > 0) {
      orgIds = [...orgIds, ...organization.member_agency_ids];
    }
    
    // Fetch projects
    const { data: projects, error: projectsError } = await projectsQuery
      .in('organization_id', orgIds)
      .order('name', { ascending: true });
    
    if (projectsError) {
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }
    
    // If this is for a parent organization, fetch member agency names
    const orgNames: Record<string, string> = {};
    if (includeMemberAgencies && organization.is_parent && 
        organization.member_agency_ids && organization.member_agency_ids.length > 0) {
      const { data: memberAgencies } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', organization.member_agency_ids);
      
      if (memberAgencies) {
        memberAgencies.forEach(agency => {
          orgNames[agency.id] = agency.name;
        });
      }
    }
    
    // Get any custom reporting field definitions if needed
    let reportingFields: any[] = [];
    if (includeReportingFields && organization.settings?.customReportingFields) {
      reportingFields = organization.settings.customReportingFields;
    }
    
    // Process and format the data based on requested format
    let responseData;
    
    if (format === 'csv') {
      // Generate CSV file
      const csvRows: string[] = [];
      
      // Generate headers
      const headers = [
        'ID', 'Name', 'Description', 'Status', 'Category', 'Location',
        'Start Date', 'End Date', 'Estimated Cost', 'Allocated Budget',
        'Created At', 'Updated At'
      ];
      
      // Add org name header if including member agencies
      if (includeMemberAgencies) {
        headers.push('Organization Name');
      }
      
      // Add reporting field headers if requested
      if (includeReportingFields && reportingFields.length > 0) {
        reportingFields.forEach(field => {
          headers.push(field.name);
        });
      }
      
      csvRows.push(headers.join(','));
      
      // Add data rows
      projects.forEach(project => {
        const values: any[] = [
          project.id,
          `"${(project.name || '').replace(/"/g, '""')}"`,
          `"${(project.description || '').replace(/"/g, '""')}"`,
          project.status,
          project.category,
          `"${(project.location || '').replace(/"/g, '""')}"`,
          project.start_date,
          project.end_date,
          project.estimated_cost,
          project.allocated_budget,
          project.created_at,
          project.updated_at
        ];
        
        // Add org name if including member agencies
        if (includeMemberAgencies) {
          values.push(`"${orgNames[project.organization_id] || organization.name}"`);
        }
        
        // Add reporting field values if requested
        if (includeReportingFields && reportingFields.length > 0) {
          reportingFields.forEach(field => {
            const reportingItem = project.reporting_data?.find(
              (item: any) => item.fieldId === field.id
            );
            
            let value = reportingItem ? reportingItem.value : '';
            if (typeof value === 'string') {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            
            values.push(value);
          });
        }
        
        csvRows.push(values.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      // Return CSV data
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="projects-${organizationId}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // JSON format (default)
      responseData = {
        organization: {
          id: organizationId,
          name: organization.name,
          isParent: organization.is_parent
        },
        reportingFields: includeReportingFields ? reportingFields : undefined,
        projects: projects.map(project => {
          const formattedProject: FormattedProject = { ...project };
          
          // Add organization name if including member agencies
          if (includeMemberAgencies) {
            formattedProject.organizationName = 
              orgNames[project.organization_id] || organization.name;
          }
          
          return formattedProject;
        }),
        timestamp: new Date().toISOString(),
        totalCount: projects.length
      };
      
      return NextResponse.json({ data: responseData });
    }
  } catch (error: any) {
    console.error('Error exporting projects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export projects' },
      { status: 500 }
    );
  }
} 