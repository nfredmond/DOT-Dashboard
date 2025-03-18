import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// GET /api/projects/[id]/documents - Get all documents for a project
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
    
    // Get all documents for the project
    const { data: documents, error: documentsError } = await supabase
      .from('project_documents')
      .select(`
        *,
        uploaded_by_user:uploaded_by (
          id,
          email,
          profile_image
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (documentsError) throw documentsError;
    
    return NextResponse.json({ data: documents });
  } catch (error) {
    logger.error('Error fetching project documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project documents' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/documents - Upload a new document for a project
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
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || 'other';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Upload the file to Supabase Storage
    const { data: _uploadData, error: uploadError } = await supabase
      .storage
      .from('project-documents')
      .upload(`${projectId}/${fileName}`, file);
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL for the file
    const { data: { publicUrl } } = supabase
      .storage
      .from('project-documents')
      .getPublicUrl(`${projectId}/${fileName}`);
    
    // Store the document metadata in the database
    const documentData = {
      project_id: projectId,
      name: file.name,
      description: description,
      category: category,
      file_type: file.type,
      file_size: file.size,
      storage_path: `${projectId}/${fileName}`,
      url: publicUrl,
      uploaded_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: document, error: documentError } = await supabase
      .from('project_documents')
      .insert(documentData)
      .select(`
        *,
        uploaded_by_user:uploaded_by (
          id,
          email,
          profile_image
        )
      `)
      .single();
    
    if (documentError) throw documentError;
    
    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    logger.error('Error uploading project document:', error);
    return NextResponse.json(
      { error: 'Failed to upload project document' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/documents?documentId=123 - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const projectId = params.id;
  
  // Get the document ID from the query parameters
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');
  
  if (!documentId) {
    return NextResponse.json(
      { error: 'Document ID is required' },
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
    
    // Get the document to find its storage path
    const { data: document, error: documentError } = await supabase
      .from('project_documents')
      .select('storage_path')
      .eq('id', documentId)
      .eq('project_id', projectId)
      .single();
    
    if (documentError) {
      if (documentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      throw documentError;
    }
    
    // Delete the file from storage
    const { error: storageError } = await supabase
      .storage
      .from('project-documents')
      .remove([document.storage_path]);
    
    if (storageError) {
      logger.error('Error deleting file from storage:', storageError);
      // Continue with deleting the database record even if storage deletion fails
    }
    
    // Delete the document record from the database
import logger from '../../../../../lib/logger';

    const { error: deleteError } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', documentId);
    
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting project document:', error);
    return NextResponse.json(
      { error: 'Failed to delete project document' },
      { status: 500 }
    );
  }
} 