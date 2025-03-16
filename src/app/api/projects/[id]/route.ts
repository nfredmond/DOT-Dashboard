import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// GET /api/projects/[id] - Get a specific project
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
    // Get the project with organization details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        organization:organization_id (
          id,
          name,
          logo_url
        ),
        created_by_user:created_by (
          id,
          email,
          profile_image
        ),
        updated_by_user:updated_by (
          id,
          email,
          profile_image
        )
      `)
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw projectError;
    }
    
    // Check if user has access to the project
    if (project.visibility !== 'public') {
      // Check if user is a member of the organization
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', project.organization_id)
        .eq('user_id', session.user.id)
        .single();
      
      // If not public and user is not a member, deny access
      if (membershipError && project.visibility !== 'public') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    
    // Get task count
    const { count: taskCount, error: taskCountError } = await supabase
      .from('project_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);
    
    // Get comment count
    const { count: commentCount, error: commentCountError } = await supabase
      .from('project_comments')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);
    
    // Get document count
    const { count: documentCount, error: documentCountError } = await supabase
      .from('project_documents')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);
    
    // Add counts to the project data
    const projectWithCounts = {
      ...project,
      task_count: taskCount || 0,
      comment_count: commentCount || 0,
      document_count: documentCount || 0
    };
    
    return NextResponse.json({ data: projectWithCounts });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a specific project
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
    // Check if user has edit access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw projectError;
    }
    
    // Check if user is a member with edit permissions
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', session.user.id)
      .single();
    
    if (membershipError || !membership || !['admin', 'member'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Prepare update data
    const updateData: Record<string, any> = {};
    
    // Only update fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.postal_code !== undefined) updateData.postal_code = body.postal_code;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.budget !== undefined) updateData.budget = body.budget;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url;
    
    // Add updated timestamp and user
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = session.user.id;
    
    // Update the project
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select(`
        *,
        organization:organization_id (
          id,
          name,
          logo_url
        ),
        created_by_user:created_by (
          id,
          email,
          profile_image
        ),
        updated_by_user:updated_by (
          id,
          email,
          profile_image
        )
      `)
      .single();
    
    if (updateError) throw updateError;
    
    return NextResponse.json({ data: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a specific project
export async function DELETE(
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
    // Check if user has admin access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw projectError;
    }
    
    // Check if user is an admin of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();
    
    if (membershipError) {
      return NextResponse.json(
        { error: 'Only organization admins can delete projects' },
        { status: 403 }
      );
    }
    
    // Delete all related records first
    
    // 1. Delete tasks
    const { error: tasksError } = await supabase
      .from('project_tasks')
      .delete()
      .eq('project_id', projectId);
    
    if (tasksError) throw tasksError;
    
    // 2. Delete comments
    const { error: commentsError } = await supabase
      .from('project_comments')
      .delete()
      .eq('project_id', projectId);
    
    if (commentsError) throw commentsError;
    
    // 3. Get document storage paths
    const { data: documents, error: documentsQueryError } = await supabase
      .from('project_documents')
      .select('storage_path')
      .eq('project_id', projectId);
    
    if (documentsQueryError) throw documentsQueryError;
    
    // 4. Delete document files from storage
    if (documents && documents.length > 0) {
      const storagePaths = documents.map(doc => doc.storage_path);
      
      const { error: storageError } = await supabase
        .storage
        .from('project-documents')
        .remove(storagePaths);
      
      if (storageError) {
        console.error('Error deleting document files from storage:', storageError);
        // Continue with deletion even if storage deletion fails
      }
    }
    
    // 5. Delete document records
    const { error: documentsError } = await supabase
      .from('project_documents')
      .delete()
      .eq('project_id', projectId);
    
    if (documentsError) throw documentsError;
    
    // 6. Delete geospatial files
    const { error: geospatialError } = await supabase
      .from('geospatial_files')
      .delete()
      .eq('project_id', projectId);
    
    if (geospatialError) throw geospatialError;
    
    // Finally, delete the project
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
} 