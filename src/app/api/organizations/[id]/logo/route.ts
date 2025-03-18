import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import logger from '../../../../../lib/logger';


// POST /api/organizations/[id]/logo - Upload a logo for an organization
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const organizationId = params.id;
    
    // Check if user has permission to update this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .single();
    
    if (!membership || !['org_admin', 'global_admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to update this organization' },
        { status: 403 }
      );
    }
    
    // Get the form data with the file
    const formData = await request.formData();
    const logoFile = formData.get('logo') as File;
    
    if (!logoFile) {
      return NextResponse.json(
        { error: 'No logo file provided' },
        { status: 400 }
      );
    }
    
    // Check file type
    const fileType = logoFile.type;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and SVG are allowed.' },
        { status: 400 }
      );
    }
    
    // Check file size (max 2MB)
    if (logoFile.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }
    
    // Upload to Supabase Storage
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `org_${organizationId}_${Date.now()}.${fileExt}`;
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from('organization_logos')
      .upload(fileName, logoFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      logger.error('Error uploading logo:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      );
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('organization_logos')
      .getPublicUrl(fileName);
    
    // Update the organization with the logo URL
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', organizationId)
      .select()
      .single();
    
    if (updateError) {
      logger.error('Error updating organization:', updateError);
      return NextResponse.json(
        { error: 'Failed to update organization with logo URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      data: { 
        logoUrl: publicUrl,
        organization 
      } 
    });
  } catch (error) {
    logger.error('Error handling logo upload:', error);
    return NextResponse.json(
      { error: 'Failed to process logo upload' },
      { status: 500 }
    );
  }
} 