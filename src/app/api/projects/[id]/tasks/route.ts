import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// GET /api/projects/[id]/tasks - Get all tasks for a project
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
    
    // Get all tasks for the project
    const { data: tasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select(`
        *,
        assigned_to:user_id (
          id,
          email,
          profile_image
        )
      `)
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });
    
    if (tasksError) throw tasksError;
    
    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project tasks' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/tasks - Create a new task for a project
export async function POST(
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
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }
    
    // Prepare task data
    const taskData = {
      project_id: projectId,
      title: body.title,
      description: body.description || null,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      due_date: body.due_date || null,
      user_id: body.assigned_to || null,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert task
    const { data: task, error: taskError } = await supabase
      .from('project_tasks')
      .insert(taskData)
      .select()
      .single();
    
    if (taskError) throw taskError;
    
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error('Error creating project task:', error);
    return NextResponse.json(
      { error: 'Failed to create project task' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/tasks?taskId=123 - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const projectId = params.id;
  
  // Get the task ID from the query parameters
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  
  if (!taskId) {
    return NextResponse.json(
      { error: 'Task ID is required' },
      { status: 400 }
    );
  }
  
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
    const { data: task, error: taskError } = await supabase
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
    
    // Delete the task
    const { error: deleteError } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId);
    
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project task:', error);
    return NextResponse.json(
      { error: 'Failed to delete project task' },
      { status: 500 }
    );
  }
} 