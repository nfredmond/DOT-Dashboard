import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { Measure, MeasureStatus } from '@/types/measure';
import logger from '../../../../lib/logger';

// GET /api/measures/[id] - Get a measure by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const measureId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if the user has access to the measure
    const { data: measure, error: measureError } = await supabase
      .from('measures')
      .select(`
        id,
        name,
        code,
        description,
        organization_id,
        parent_measure_id,
        start_date,
        end_date,
        status,
        funding_amount,
        funding_currency,
        reporting_frequency,
        reporting_requirements,
        metadata,
        custom_reporting_fields,
        created_by,
        created_at,
        updated_at
      `)
      .eq('id', measureId)
      .single();
    
    if (measureError) {
      if (measureError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Measure not found' }, { status: 404 });
      }
      throw measureError;
    }
    
    // Check if user is a global admin or has the greendot email
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', session.user.id)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin) ||
      session.user.email?.endsWith('@greendottransportation.com');
    
    // If not a global admin, check if the user has access to the measure
    if (!isGlobalAdmin) {
      // Check if the user is a member of the organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('organization_id', measure.organization_id)
        .single();
      
      // If not a direct organization member, check for measure organizations
      if (!membership) {
        const { data: measureOrgs } = await supabase
          .from('measure_organizations')
          .select('organization_id')
          .eq('measure_id', measureId);
        
        // Get all organizations the user is a member of
        const { data: userOrgs } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id);
        
        // Check if any of the user's organizations have access to this measure
        const hasAccess = userOrgs && measureOrgs && 
          measureOrgs.some(mo => userOrgs.some(uo => uo.organization_id === mo.organization_id));
        
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'You do not have access to this measure' },
            { status: 403 }
          );
        }
      }
    }
    
    // Get organization name
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', measure.organization_id)
      .single();
    
    // Get parent measure name if applicable
    let parentMeasureName;
    if (measure.parent_measure_id) {
      const { data: parentMeasure } = await supabase
        .from('measures')
        .select('name')
        .eq('id', measure.parent_measure_id)
        .single();
      
      if (parentMeasure) {
        parentMeasureName = parentMeasure.name;
      }
    }
    
    // Get creator name
    const { data: creator } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', measure.created_by)
      .single();
    
    // Format the measure
    const formattedMeasure: Measure = {
      id: measure.id,
      name: measure.name,
      code: measure.code,
      description: measure.description,
      organizationId: measure.organization_id,
      organizationName: organization?.name || '',
      parentMeasureId: measure.parent_measure_id,
      parentMeasureName: parentMeasureName,
      startDate: measure.start_date,
      endDate: measure.end_date,
      status: measure.status as MeasureStatus,
      fundingAmount: measure.funding_amount,
      fundingCurrency: measure.funding_currency,
      reportingFrequency: measure.reporting_frequency,
      reportingRequirements: measure.reporting_requirements,
      metadata: measure.metadata,
      customReportingFields: measure.custom_reporting_fields,
      createdBy: measure.created_by,
      createdByName: creator ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() : '',
      createdAt: measure.created_at,
      updatedAt: measure.updated_at
    };
    
    // Get linked measures (measures that are related to this one)
    const { data: childMeasures } = await supabase
      .from('measures')
      .select('id, name, code, status, start_date, end_date')
      .eq('parent_measure_id', measureId);
    
    // Get projects associated with this measure
    const { data: measureProjects } = await supabase
      .from('measure_projects')
      .select(`
        id,
        project_id,
        funding_amount,
        is_active,
        projects (
          name
        )
      `)
      .eq('measure_id', measureId);
    
    // Get organizations associated with this measure
    const { data: measureOrgs } = await supabase
      .from('measure_organizations')
      .select(`
        id,
        organization_id,
        role,
        permissions,
        organizations (
          name
        )
      `)
      .eq('measure_id', measureId);
    
    // Add associations to the formatted measure
    formattedMeasure.linkedMeasures = childMeasures ? childMeasures.map(m => ({
      id: m.id,
      name: m.name,
      code: m.code,
      relationshipType: 'child',
      startDate: m.start_date,
      endDate: m.end_date,
      status: m.status as MeasureStatus
    })) : [];
    
    if (measure.parent_measure_id) {
      formattedMeasure.linkedMeasures.push({
        id: measure.parent_measure_id,
        name: parentMeasureName || 'Parent Measure',
        code: '',
        relationshipType: 'parent',
        status: 'active' as MeasureStatus
      });
    }
    
    // Add counts
    formattedMeasure.projectCount = measureProjects?.length || 0;
    formattedMeasure.organizationCount = measureOrgs?.length || 0;
    
    return NextResponse.json({ data: formattedMeasure });
  } catch (error: any) {
    logger.error('Error fetching measure:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch measure' },
      { status: 500 }
    );
  }
}

// PATCH /api/measures/[id] - Update a measure
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const measureId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const requestData = await request.json();
    
    // Check if measure exists
    const { data: existingMeasure, error: measureError } = await supabase
      .from('measures')
      .select('organization_id, status')
      .eq('id', measureId)
      .single();
    
    if (measureError) {
      if (measureError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Measure not found' }, { status: 404 });
      }
      throw measureError;
    }
    
    // Check if user has permission to update this measure
    const userId = session.user.id;
    
    // Check if user is a global admin or has the greendot email
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', userId)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin) ||
      session.user.email?.endsWith('@greendottransportation.com');
    
    // Check if user is admin of the measure's organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', existingMeasure.organization_id)
      .eq('role', 'org_admin')
      .single();
    
    const isOrgAdmin = !membershipError && membership;
    
    // Check if user has admin role in measure_organizations
    const { data: measureOrgRole } = await supabase
      .from('measure_organizations')
      .select('role, permissions')
      .eq('measure_id', measureId)
      .eq('organization_id', existingMeasure.organization_id)
      .single();
    
    const isMeasureAdmin = measureOrgRole && 
      (measureOrgRole.role === 'owner' || measureOrgRole.role === 'administrator' || 
      (measureOrgRole.permissions && measureOrgRole.permissions.canEdit));
    
    // Only admins can update measures
    if (!isGlobalAdmin && !isOrgAdmin && !isMeasureAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this measure' },
        { status: 403 }
      );
    }
    
    // Check status transitions - some status changes might be restricted
    if (requestData.status && 
        requestData.status !== existingMeasure.status && 
        existingMeasure.status === 'completed') {
      // Prevent changing from completed status unless global admin
      if (!isGlobalAdmin) {
        return NextResponse.json(
          { error: 'Only global admins can change a measure from completed status' },
          { status: 403 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Only update fields that are provided
    if (requestData.name !== undefined) updateData.name = requestData.name;
    if (requestData.code !== undefined) updateData.code = requestData.code;
    if (requestData.description !== undefined) updateData.description = requestData.description;
    if (requestData.startDate !== undefined) updateData.start_date = requestData.startDate;
    if (requestData.endDate !== undefined) updateData.end_date = requestData.endDate;
    if (requestData.status !== undefined) updateData.status = requestData.status;
    if (requestData.fundingAmount !== undefined) updateData.funding_amount = requestData.fundingAmount;
    if (requestData.fundingCurrency !== undefined) updateData.funding_currency = requestData.fundingCurrency;
    if (requestData.reportingFrequency !== undefined) updateData.reporting_frequency = requestData.reportingFrequency;
    if (requestData.reportingRequirements !== undefined) updateData.reporting_requirements = requestData.reportingRequirements;
    if (requestData.metadata !== undefined) updateData.metadata = requestData.metadata;
    if (requestData.customReportingFields !== undefined) updateData.custom_reporting_fields = requestData.customReportingFields;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update the measure
    const { data: updatedMeasure, error: updateError } = await supabase
      .from('measures')
      .update(updateData)
      .eq('id', measureId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Format response
    const formattedMeasure: Partial<Measure> = {
      id: updatedMeasure.id,
      name: updatedMeasure.name,
      code: updatedMeasure.code,
      description: updatedMeasure.description,
      organizationId: updatedMeasure.organization_id,
      parentMeasureId: updatedMeasure.parent_measure_id,
      startDate: updatedMeasure.start_date,
      endDate: updatedMeasure.end_date,
      status: updatedMeasure.status as MeasureStatus,
      fundingAmount: updatedMeasure.funding_amount,
      fundingCurrency: updatedMeasure.funding_currency,
      reportingFrequency: updatedMeasure.reporting_frequency,
      reportingRequirements: updatedMeasure.reporting_requirements,
      metadata: updatedMeasure.metadata,
      customReportingFields: updatedMeasure.custom_reporting_fields,
      createdBy: updatedMeasure.created_by,
      createdAt: updatedMeasure.created_at,
      updatedAt: updatedMeasure.updated_at
    };
    
    return NextResponse.json({ data: formattedMeasure });
  } catch (error: any) {
    logger.error('Error updating measure:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update measure' },
      { status: 500 }
    );
  }
}

// DELETE /api/measures/[id] - Delete a measure
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const measureId = params.id;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if measure exists and get its organization
    const { data: measure, error: measureError } = await supabase
      .from('measures')
      .select('organization_id, status, name')
      .eq('id', measureId)
      .single();
    
    if (measureError) {
      if (measureError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Measure not found' }, { status: 404 });
      }
      throw measureError;
    }
    
    // Check if user is a global admin or has the greendot email
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', session.user.id)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin) ||
      session.user.email?.endsWith('@greendottransportation.com');
    
    // Check if user is admin of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', measure.organization_id)
      .eq('role', 'org_admin')
      .single();
    
    // Only global admins and organization admins can delete measures
    if (!isGlobalAdmin && (!membership || membershipError)) {
      return NextResponse.json(
        { error: 'Only organization admins can delete measures' },
        { status: 403 }
      );
    }
    
    // Check for child measures that depend on this one
    const { data: childMeasures, error: _childError } = await supabase
      .from('measures')
      .select('id, name')
      .eq('parent_measure_id', measureId);
    
    if (childMeasures && childMeasures.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete measure with dependent child measures',
          childMeasures: childMeasures
        },
        { status: 400 }
      );
    }
    
    // Check for active projects associated with this measure
    const { data: activeProjects, error: _projectsError } = await supabase
      .from('measure_projects')
      .select('id, project_id, projects:project_id(name)')
      .eq('measure_id', measureId)
      .eq('is_active', true);
    
    if (activeProjects && activeProjects.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete measure with active projects',
          activeProjects: activeProjects
        },
        { status: 400 }
      );
    }
    
    // All checks passed, delete the measure
    // First delete all the relationships
    await supabase
      .from('measure_organizations')
      .delete()
      .eq('measure_id', measureId);
    
    await supabase
      .from('measure_projects')
      .delete()
      .eq('measure_id', measureId);
    
    await supabase
      .from('measure_reporting')
      .delete()
      .eq('measure_id', measureId);
    
    // Finally delete the measure itself
    const { error: deleteError } = await supabase
      .from('measures')
      .delete()
      .eq('id', measureId);
    
    if (deleteError) throw deleteError;
    
    return NextResponse.json({
      success: true,
      message: `Measure "${measure.name}" deleted successfully`
    });
  } catch (error: any) {
    logger.error('Error deleting measure:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete measure' },
      { status: 500 }
    );
  }
} 