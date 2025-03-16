import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// GET /api/projects/[id]/comments - Get all comments for a project
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
    
    // Get all comments for the project
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select(`
        *,
        user:user_id (
          id,
          email,
          profile_image
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (commentsError) throw commentsError;
    
    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error('Error fetching project comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project comments' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/comments - Create a new comment for a project
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
    
    // Check if user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', session.user.id)
      .single();
    
    if (membershipError) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.content) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    // Prepare comment data
    const commentData = {
      project_id: projectId,
      content: body.content,
      user_id: session.user.id,
      parent_id: body.parent_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert comment
    const { data: comment, error: commentError } = await supabase
      .from('project_comments')
      .insert(commentData)
      .select(`
        *,
        user:user_id (
          id,
          email,
          profile_image
        )
      `)
      .single();
    
    if (commentError) throw commentError;
    
    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating project comment:', error);
    return NextResponse.json(
      { error: 'Failed to create project comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/comments?commentId=123 - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const projectId = params.id;
  
  // Get the comment ID from the query parameters
  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get('commentId');
  
  if (!commentId) {
    return NextResponse.json(
      { error: 'Comment ID is required' },
      { status: 400 }
    );
  }
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if the comment exists and belongs to the project
    const { data: comment, error: commentError } = await supabase
      .from('project_comments')
      .select('id, user_id, project_id')
      .eq('id', commentId)
      .eq('project_id', projectId)
      .single();
    
    if (commentError) {
      if (commentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }
      throw commentError;
    }
    
    // Check if user is the comment author or an admin
    if (comment.user_id !== session.user.id) {
      // Get the project's organization
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('organization_id')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
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
          { error: 'You can only delete your own comments' },
          { status: 403 }
        );
      }
    }
    
    // Delete the comment
    const { error: deleteError } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', commentId);
    
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete project comment' },
      { status: 500 }
    );
  }
} 