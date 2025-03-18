import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { Measure, MeasureStatus } from '@/types/measure';

interface MeasureRecord {
  id: string;
  name: string;
  code: string;
  description: string;
  organization_id: string;
  parent_measure_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: MeasureStatus;
  funding_amount: number | null;
  funding_currency: string;
  reporting_frequency: string | null;
  reporting_requirements: string | null;
  metadata: Record<string, any>;
  custom_reporting_fields: any[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// GET /api/measures - Get measures with organization-based filtering
export async function GET(request: NextRequest) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const status = url.searchParams.get('status');
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const includeMemberAgencies = url.searchParams.get('includeMemberAgencies') === 'true';
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', session.user.id)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin) ||
      session.user.email?.endsWith('@greendottransportation.com');
    
    // Set up the measures query
    let measuresQuery = supabase.from('measures').select(`
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
    `);
    
    // Apply filters if provided
    if (organizationId) {
      // If including member agencies, need to get all member agency IDs
      if (includeMemberAgencies) {
        const { data: organization } = await supabase
          .from('organizations')
          .select('member_agency_ids')
          .eq('id', organizationId)
          .single();
        
        if (organization && organization.member_agency_ids && organization.member_agency_ids.length > 0) {
          // Include parent org and all its member agencies
          const orgIds = [organizationId, ...organization.member_agency_ids];
          measuresQuery = measuresQuery.in('organization_id', orgIds);
        } else {
          measuresQuery = measuresQuery.eq('organization_id', organizationId);
        }
      } else {
        measuresQuery = measuresQuery.eq('organization_id', organizationId);
      }
    }
    
    if (status) {
      measuresQuery = measuresQuery.eq('status', status);
    }
    
    if (!includeInactive && !status) {
      // By default, only show active measures unless includeInactive is true
      measuresQuery = measuresQuery.in('status', ['draft', 'active']);
    }
    
    // If user is not a global admin, check permissions
    if (!isGlobalAdmin) {
      // Get organizations where the user is a member
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id);
      
      if (!memberships || memberships.length === 0) {
        return NextResponse.json({ data: [] });
      }
      
      const orgIds = memberships.map(m => m.organization_id);
      
      // Filter measures by organizations the user belongs to
      if (organizationId && !orgIds.includes(organizationId)) {
        // Check if user has access through measure_organizations
        const { data: measureOrgs } = await supabase
          .from('measure_organizations')
          .select('measure_id')
          .eq('organization_id', organizationId);
        
        if (!measureOrgs || measureOrgs.length === 0) {
          return NextResponse.json({ data: [] });
        }
        
        const measureIds = measureOrgs.map(m => m.measure_id);
        measuresQuery = measuresQuery.in('id', measureIds);
      } else if (!organizationId) {
        // No specific org ID requested, show all measures from user's orgs

measuresQuery = measuresQuery.in('organization_id', orgIds);
      }
    }
    
    // Execute the query
    const { data: measures, error: measuresError } = await measuresQuery.order('created_at', { ascending: false });
    
    if (measuresError) throw measuresError;
    
    let formattedMeasures: Partial<Measure>[] = [];
    
    // Enhance measures data with organization names and other metadata
    if (measures && measures.length > 0) {
      // Get organization names
      const orgIds = Array.from(new Set(measures.map(m => m.organization_id)));
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);
      
      const orgMap: Record<string, string> = organizations ? 
        organizations.reduce((map, org) => ({ ...map, [org.id]: org.name }), {}) :
        {};
      
      // Get parent measure names
      const parentMeasureIds = measures
        .filter(m => m.parent_measure_id)
        .map(m => m.parent_measure_id)
        .filter(Boolean) as string[];
      
      const parentMeasureMap: Record<string, string> = {};
      if (parentMeasureIds.length > 0) {
        const { data: parentMeasures } = await supabase
          .from('measures')
          .select('id, name')
          .in('id', parentMeasureIds);
        
        if (parentMeasures) {
          parentMeasures.forEach(measure => {
            parentMeasureMap[measure.id] = measure.name;
          });
        }
      }
      
      // Get creator names
      const creatorIds = Array.from(new Set(measures.map(m => m.created_by)));
      const { data: creators } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', creatorIds);
      
      const creatorMap: Record<string, string> = {};
      if (creators) {
        creators.forEach(user => {
          creatorMap[user.user_id] = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        });
      }
      
      // Format the measures
      formattedMeasures = measures.map(measure => {
        return {
          id: measure.id,
          name: measure.name,
          code: measure.code,
          description: measure.description,
          organizationId: measure.organization_id,
          organizationName: orgMap[measure.organization_id] || '',
          parentMeasureId: measure.parent_measure_id,
          parentMeasureName: measure.parent_measure_id ? parentMeasureMap[measure.parent_measure_id] : undefined,
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
          createdByName: creatorMap[measure.created_by] || '',
          createdAt: measure.created_at,
          updatedAt: measure.updated_at
        };
      });
      
      // Get project counts for each measure without using group by
      const measureIds = measures.map(m => m.id);
      
      // Project counts - use individual queries for each measure
      const projectCountMap: Record<string, number> = {};
      
      // Get all measure projects and count them in JavaScript
      const { data: allMeasureProjects } = await supabase
        .from('measure_projects')
        .select('measure_id')
        .in('measure_id', measureIds);
      
      if (allMeasureProjects) {
        // Count projects for each measure ID
        measureIds.forEach(measureId => {
          const count = allMeasureProjects.filter(p => p.measure_id === measureId).length;
          projectCountMap[measureId] = count;
        });
      }
      
      // Organization counts - use the same approach
      const orgCountMap: Record<string, number> = {};
      
      const { data: allMeasureOrgs } = await supabase
        .from('measure_organizations')
        .select('measure_id')
        .in('measure_id', measureIds);
      
      if (allMeasureOrgs) {
        // Count organizations for each measure ID
        measureIds.forEach(measureId => {
          const count = allMeasureOrgs.filter(o => o.measure_id === measureId).length;
          orgCountMap[measureId] = count;
        });
      }
      
      // Add counts to measures
      formattedMeasures = formattedMeasures.map(measure => ({
        ...measure,
        projectCount: measure.id ? projectCountMap[measure.id] || 0 : 0,
        organizationCount: measure.id ? orgCountMap[measure.id] || 0 : 0
      }));
    }
    
    return NextResponse.json({ data: formattedMeasures });
  } catch (error: any) {
    logger.error('Error fetching measures:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch measures' },
      { status: 500 }
    );
  }
}

// POST /api/measures - Create a new measure
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
    if (!requestData.name || !requestData.code || !requestData.organizationId) {
      return NextResponse.json(
        { error: 'Name, code, and organization ID are required' },
        { status: 400 }
      );
    }
    
    // Check if user has admin permissions for the organization
    const { data: membership, error: _membershipError } = await supabase
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
      (userData?.metadata && userData.metadata.isGlobalAdmin) ||
      session.user.email?.endsWith('@greendottransportation.com');
    
    const isOrgAdmin = membership?.role === 'org_admin';
    
    // Only global admins or organization admins can create measures
    if (!isGlobalAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Only organization admins can create measures' },
        { status: 403 }
      );
    }
    
    // Check if this measure is linked to a parent measure
    if (requestData.parentMeasureId) {
      // Check if parent measure exists
      const { data: parentMeasure, error: parentError } = await supabase
        .from('measures')
        .select('id')
        .eq('id', requestData.parentMeasureId)
        .single();
      
      if (parentError || !parentMeasure) {
        return NextResponse.json(
          { error: 'Parent measure not found' },
          { status: 400 }
        );
      }
    }
    
    // Prepare measure data for insertion
    const measureData = {
      name: requestData.name,
      code: requestData.code,
      description: requestData.description || '',
      organization_id: requestData.organizationId,
      parent_measure_id: requestData.parentMeasureId || null,
      start_date: requestData.startDate || null,
      end_date: requestData.endDate || null,
      status: requestData.status || 'draft',
      funding_amount: requestData.fundingAmount || null,
      funding_currency: requestData.fundingCurrency || 'USD',
      reporting_frequency: requestData.reportingFrequency || null,
      reporting_requirements: requestData.reportingRequirements || null,
      metadata: requestData.metadata || {},
      custom_reporting_fields: requestData.customReportingFields || [],
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert the measure
    const { data: measure, error: measureError } = await supabase
      .from('measures')
      .insert(measureData)
      .select()
      .single();
    
    if (measureError) throw measureError;
    
    // If this measure has a parent, also create the link in measure_organizations
    if (requestData.parentMeasureId) {
      // Get parent measure's organization
      const { data: parentMeasureData } = await supabase
        .from('measures')
        .select('organization_id')
        .eq('id', requestData.parentMeasureId)
        .single();
      
      if (parentMeasureData) {
        // Create link between this measure's organization and parent measure
        await supabase
          .from('measure_organizations')
          .insert({
            measure_id: requestData.parentMeasureId,
            organization_id: requestData.organizationId,
            role: 'member',
            created_at: new Date().toISOString()
          });
        
        // Also create link between parent organization and this measure
        await supabase
          .from('measure_organizations')
          .insert({
            measure_id: measure.id,
            organization_id: parentMeasureData.organization_id,
            role: 'owner',
            created_at: new Date().toISOString()
          });
      }
    }
    
    // Format the response
    const formattedMeasure: Measure = {
      id: measure.id,
      name: measure.name,
      code: measure.code,
      description: measure.description,
      organizationId: measure.organization_id,
      parentMeasureId: measure.parent_measure_id,
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
      createdAt: measure.created_at,
      updatedAt: measure.updated_at
    };
    
    return NextResponse.json({ data: formattedMeasure }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating measure:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create measure' },
      { status: 500 }
    );
  }
} 