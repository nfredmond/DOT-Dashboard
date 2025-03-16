import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { ReportingData } from '@/types/project';

// GET /api/projects/[id]/reporting - Get reporting data for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const projectId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get project with organization details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        organization_id,
        parent_org_id,
        is_member_agency_project,
        reporting_data,
        visibility
      `)
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw projectError;
    }
    
    // Check permissions - user must have access to either the project's org or parent org
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .in('organization_id', [project.organization_id, project.parent_org_id].filter(Boolean));
    
    // Allow access if project is public or user is a member of organization
    if (project.visibility !== 'public' && (!membership || !membership.length)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // If not a member agency project, return empty reporting data
    if (!project.is_member_agency_project) {
      return NextResponse.json({ 
        data: { 
          reporting_data: [],
          is_member_agency_project: false,
          message: 'This is not a member agency project, no reporting data available'
        }
      });
    }
    
    // Get the reporting field definitions from the parent organization
    let reportingFields = [];
    if (project.parent_org_id) {
      const { data: parentOrg, error: parentOrgError } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', project.parent_org_id)
        .single();
      
      if (!parentOrgError && parentOrg && parentOrg.settings?.customReportingFields) {
        reportingFields = parentOrg.settings.customReportingFields;
      }
    }
    
    // Return reporting data with field definitions
    return NextResponse.json({ 
      data: {
        reporting_data: project.reporting_data || [],
        fields: reportingFields,
        is_member_agency_project: true
      }
    });
  } catch (error) {
    console.error('Error fetching project reporting data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project reporting data' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/reporting - Update reporting data for a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const projectId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get the project to check permissions
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        organization_id,
        parent_org_id,
        is_member_agency_project,
        reporting_data
      `)
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw projectError;
    }
    
    // This endpoint only works for member agency projects
    if (!project.is_member_agency_project) {
      return NextResponse.json(
        { error: 'This is not a member agency project' },
        { status: 400 }
      );
    }
    
    // Check if user has edit permissions for this project
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', project.organization_id)
      .single();
    
    // Also check if user is a member of the parent organization
    const { data: parentMembership, error: parentMembershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', project.parent_org_id)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', session.user.id)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    // Allow edits if user is admin of either org or a global admin
    const canEdit = isGlobalAdmin || 
      (membership && membership.role === 'org_admin') || 
      (parentMembership && parentMembership.role === 'org_admin');
    
    if (!canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to update reporting data' },
        { status: 403 }
      );
    }
    
    // Get request body
    const requestData = await request.json();
    
    if (!requestData.reportingData || !Array.isArray(requestData.reportingData)) {
      return NextResponse.json(
        { error: 'Invalid reporting data format' },
        { status: 400 }
      );
    }
    
    // Validate reporting data
    for (const item of requestData.reportingData) {
      if (!item.fieldId || !item.fieldName) {
        return NextResponse.json(
          { error: 'Each reporting item must include fieldId and fieldName' },
          { status: 400 }
        );
      }
    }
    
    // Prepare new reporting data
    const updatedReportingData = requestData.reportingData.map((item: Partial<ReportingData>) => ({
      id: item.id || crypto.randomUUID(),
      fieldId: item.fieldId,
      fieldName: item.fieldName,
      value: item.value,
      reportedAt: new Date().toISOString(),
      reportedBy: session.user.id,
      reportPeriod: item.reportPeriod || requestData.reportPeriod,
      notes: item.notes
    }));
    
    // Update the project with new reporting data
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        reporting_data: updatedReportingData,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      })
      .eq('id', projectId)
      .select('id, name, reporting_data')
      .single();
    
    if (updateError) throw updateError;
    
    return NextResponse.json({ data: updatedProject });
  } catch (error) {
    console.error('Error updating project reporting data:', error);
    return NextResponse.json(
      { error: 'Failed to update project reporting data' },
      { status: 500 }
    );
  }
} 