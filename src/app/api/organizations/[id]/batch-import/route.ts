import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

interface ProjectData {
  id?: string;
  name: string;
  description?: string;
  location?: string;
  category?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  estimated_cost?: number;
  allocated_budget?: number;
  organization_id?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  is_member_agency_project?: boolean;
  parent_org_id?: string;
  reporting_data?: ReportingDataItem[];
}

interface ReportingDataItem {
  id: string;
  fieldId: string;
  fieldName: string;
  value: any;
  reportedAt: string | null;
  reportedBy: string | null;
  reportPeriod: string | null;
  notes: string | null;
}

interface ImportRow {
  id?: string;
  name?: string;
  description?: string;
  location?: string;
  category?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  estimated_cost?: string;
  allocated_budget?: string;
  member_agency_id?: string;
  member_agency_name?: string;
  [key: string]: any;
}

interface ImportResults {
  created: any[];
  updated: any[];
  errors: any[];
  total: number;
}

interface ReportingUpdate {
  fieldId: string;
  value: any;
}

// POST /api/organizations/[id]/batch-import - Process batch uploads for an organization
export async function POST(
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
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const reportPeriod = formData.get('reportPeriod') as string;
    const updateExisting = formData.get('updateExisting') === 'true';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to import data for this organization
    const { data: membership, error: _membershipError } = await supabase
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
    
    const isOrgAdmin = membership?.role === 'org_admin';
    
    if (!isGlobalAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Only organization admins can perform batch imports' },
        { status: 403 }
      );
    }
    
    // Check organization details - is it a parent or member agency?
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('is_parent, parent_id, settings, name, member_agency_ids')
      .eq('id', organizationId)
      .single();
    
    if (orgError) throw orgError;
    
    // Process the file content - this example assumes CSV format
    // In a real implementation, you would handle different file formats and more complex processing
    const text = await file.text();
    const parsedData = parseCSV(text);
    
    // Storage for results
    const results: ImportResults = {
      created: [],
      updated: [],
      errors: [],
      total: parsedData.length
    };
    
    // Process each row in the imported data
    for (const row of parsedData) {
      try {
        // Skip rows without required data
        if (!row.name) {
          results.errors.push({ row, error: 'Project name is required' });
          continue;
        }
        
        // Determine if this is a new project or an update
        let existingProject: ProjectData | null = null;
        if (row.id) {
          // Try to find existing project by ID
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', row.id)
            .single();
          
          if (!projectError) {
            existingProject = project as ProjectData;
          }
        } else if (row.name && updateExisting) {
          // Try to find by name match
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('organization_id', organizationId)
            .ilike('name', row.name)
            .limit(1);
          
          if (!projectsError && projects && projects.length > 0) {
            existingProject = projects[0] as ProjectData;
          }
        }
        
        if (existingProject && !updateExisting) {
          results.errors.push({ 
            row, 
            error: 'Project already exists and updateExisting is false',
            projectId: existingProject.id
          });
          continue;
        }
        
        // Prepare project data
        const projectData: ProjectData = {
          name: row.name,
          description: row.description || (existingProject?.description || ''),
          location: row.location || (existingProject?.location || ''),
          category: row.category || (existingProject?.category || 'Other'),
          status: row.status || (existingProject?.status || 'draft'),
          
          // Dates
          updated_at: new Date().toISOString(),
          updated_by: session.user.id
        };
        
        // Only set these fields if provided in the import
        if (row.start_date) projectData.start_date = row.start_date;
        if (row.end_date) projectData.end_date = row.end_date;
        if (row.estimated_cost) projectData.estimated_cost = parseFloat(row.estimated_cost);
        if (row.allocated_budget) projectData.allocated_budget = parseFloat(row.allocated_budget);
        
        // Handle reported data fields for parent organizations
        if (organization.is_parent && organization.settings?.customReportingFields) {
          // Find matching member agency by name or ID
          const memberAgencyId = row.member_agency_id || 
                              (row.member_agency_name ? 
                                await findMemberAgencyByName(supabase, row.member_agency_name, organization.member_agency_ids) : 
                                null);
          
          if (!memberAgencyId) {
            results.errors.push({ 
              row, 
              error: 'Member agency not specified or not found' 
            });
            continue;
          }
          
          // For an existing project from a member agency, we need to update its reporting data
          if (existingProject && existingProject.is_member_agency_project) {
            // Extract reporting values from the import row
            const reportingUpdates = extractReportingData(row, organization.settings.customReportingFields);
            
            if (reportingUpdates.length > 0) {
              // Update existing reporting data
              const existingReportingData = existingProject.reporting_data || [];
              const updatedReportingData = existingReportingData.map(item => {
                const update = reportingUpdates.find(u => u.fieldId === item.fieldId);
                if (update) {
                  return {
                    ...item,
                    value: update.value,
                    reportedAt: new Date().toISOString(),
                    reportedBy: session.user.id,
                    reportPeriod: reportPeriod || item.reportPeriod
                  };
                }
                return item;
              });
              
              projectData.reporting_data = updatedReportingData;
            }
          }
        }
        
        // If this is a member agency
        if (organization.parent_id) {
          // Always mark member agency projects appropriately
          projectData.is_member_agency_project = true;
          projectData.parent_org_id = organization.parent_id;
          
          // Handle reporting fields from the parent organization
          // This would need to fetch the parent organization's reporting field definitions
          const { data: parentOrg, error: parentOrgError } = await supabase
            .from('organizations')
            .select('settings')
            .eq('id', organization.parent_id)
            .single();
          
          if (!parentOrgError && parentOrg?.settings?.customReportingFields) {
            const reportingUpdates = extractReportingData(row, parentOrg.settings.customReportingFields);
            
            if (existingProject) {
              // Update existing reporting data
              const existingReportingData = existingProject.reporting_data || [];
              const updatedReportingData = existingReportingData.map(item => {
                const update = reportingUpdates.find(u => u.fieldId === item.fieldId);
                if (update) {
                  return {
                    ...item,
                    value: update.value,
                    reportedAt: new Date().toISOString(),
                    reportedBy: session.user.id,
                    reportPeriod: reportPeriod || item.reportPeriod
                  };
                }
                return item;
              });
              
              projectData.reporting_data = updatedReportingData;
            } else {
              // Initialize new reporting data
              projectData.reporting_data = parentOrg.settings.customReportingFields.map(field => {
                const update = reportingUpdates.find(u => u.fieldId === field.id);
                return {
                  id: crypto.randomUUID(),
                  fieldId: field.id,
                  fieldName: field.name,
                  value: update ? update.value : null,
                  reportedAt: update ? new Date().toISOString() : null,
                  reportedBy: update ? session.user.id : null,
                  reportPeriod: reportPeriod || null,
                  notes: null
                };
              });
            }
          }
        }
        
        // Insert or update the project
        if (existingProject) {
          const { data: updated, error: updateError } = await supabase
            .from('projects')
            .update(projectData)
            .eq('id', existingProject.id)
            .select()
            .single();
          
          if (updateError) throw updateError;
          
          results.updated.push(updated);
        } else {
          // Add required fields for new projects
          projectData.organization_id = organizationId;
          projectData.created_at = new Date().toISOString();
          projectData.created_by = session.user.id;
          
          const { data: created, error: createError } = await supabase
            .from('projects')
            .insert(projectData)
            .select()
            .single();
          
          if (createError) throw createError;
          
          results.created.push(created);
        }
      } catch (error: any) {
        logger.error('Error processing row:', error, row);
        results.errors.push({ row, error: error.message || 'Unknown error' });
      }
    }
    
    return NextResponse.json({
      data: {
        results,
        filename: file.name,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error processing batch import:', error);
    return NextResponse.json(
      { error: 'Failed to process batch import' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV data
// In a real implementation, you'd use a proper CSV parsing library
function parseCSV(text: string): ImportRow[] {
  // Simple CSV parsing for demonstration
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).filter(line => line.trim().length > 0).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: ImportRow = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
}

// Helper function to find a member agency by name
async function findMemberAgencyByName(
  supabase: any, 
  name: string, 
  memberAgencyIds: string[]
): Promise<string | null> {
  if (!memberAgencyIds || memberAgencyIds.length === 0) return null;
  
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .in('id', memberAgencyIds)
    .ilike('name', `%${name}%`)
    .limit(1);
  
  if (error || !data || data.length === 0) return null;
  
  return data[0].id;
}

// Helper function to extract reporting data from a row
import logger from '../../../../../lib/logger';

function extractReportingData(row: ImportRow, fields: any[]): ReportingUpdate[] {
  const reportingUpdates: ReportingUpdate[] = [];
  
  for (const field of fields) {
    const fieldKey = `reporting_${field.id}`;
    const altFieldKey = field.name.toLowerCase().replace(/\s+/g, '_');
    
    if (row[fieldKey] !== undefined) {
      reportingUpdates.push({
        fieldId: field.id,
        value: row[fieldKey]
      });
    } else if (row[altFieldKey] !== undefined) {
      reportingUpdates.push({
        fieldId: field.id,
        value: row[altFieldKey]
      });
    }
  }
  
  return reportingUpdates;
} 