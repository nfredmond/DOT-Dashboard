import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import logger from '../../../../../../lib/logger';


// PATCH /api/projects/[id]/tasks/[taskId] - Update a specific task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const supabase = createClient(cookies());
  const projectId = params.id;
  const taskId = params.taskId;
  
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
    
    // Check if the task exists and belongs to the project
    const { data: _task, error: taskError } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('id', taskId)
      .eq('project_id', projectId)
      .single();
    
    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      throw taskError;
    }
    
    // Parse request body
    const body = await request.json();
    
    // Prepare update data
    const updateData: Record<string, any> = {};
    
    // Only update fields that are provided
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.assigned_to !== undefined) updateData.user_id = body.assigned_to;
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = session.user.id;
    
    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('project_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return NextResponse.json({ data: updatedTask });
  } catch (error) {
    logger.error('Error updating project task:', error);
    return NextResponse.json(
      { error: 'Failed to update project task' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/tasks/[taskId] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const supabase = createClient(cookies());
  const projectId = params.id;
  const taskId = params.taskId;
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if user has access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('organization_id, visibility')
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
      const { data: _membership, error: membershipError } = await supabase
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
    
    // Get the task
    const { data: task, error: taskError } = await supabase
      .from('project_tasks')
      .select(`
        *,
        assigned_to:user_id (
          id,
          email,
          profile_image
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
      .eq('id', taskId)
      .eq('project_id', projectId)
      .single();
    
    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      throw taskError;
    }
    
    return NextResponse.json({ data: task });
  } catch (error) {
    logger.error('Error fetching project task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project task' },
      { status: 500 }
    );
  }
} 