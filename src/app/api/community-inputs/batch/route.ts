import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema validation
const batchUpdateSchema = z.object({
  ids: z.array(z.string().uuid()),
  status: z.enum(['approved', 'rejected']),
  moderationNote: z.string().optional()
});

// PATCH handler for batch moderation
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = batchUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { ids, status, moderationNote } = validationResult.data;
    
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No IDs provided' },
        { status: 400 }
      );
    }
    
    // Get all inputs to check organization
    const { data: inputs } = await supabase
      .from('community_inputs')
      .select('id, organization_id')
      .in('id', ids);
    
    if (!inputs || inputs.length === 0) {
      return NextResponse.json(
        { error: 'No community inputs found' },
        { status: 404 }
      );
    }
    
    // Check if all inputs belong to the same organization
    const organizationId = inputs[0].organization_id;
    const allSameOrg = inputs.every(input => input.organization_id === organizationId);
    
    if (!allSameOrg) {
      return NextResponse.json(
        { error: 'All inputs must belong to the same organization' },
        { status: 400 }
      );
    }
    
    // Check if user is admin/editor for this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    
    if (!membership || !['admin', 'editor'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Editor access required' },
        { status: 403 }
      );
    }
    
    // Update all inputs
    const { data: updatedInputs, error: updateError } = await supabase
      .from('community_inputs')
      .update({
        status,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
        moderation_note: moderationNote
      })
      .in('id', ids)
      .select();
    
    if (updateError) {
      logger.error('Error batch updating community inputs:', updateError);
      return NextResponse.json(
        { error: 'Failed to update community inputs' },
        { status: 500 }
      );
    }
    
    logger.info(`Batch moderated ${updatedInputs?.length} inputs by user ${user.id}`);
    
    return NextResponse.json({
      success: true,
      data: updatedInputs,
      count: updatedInputs?.length || 0
    });
    
  } catch (error) {
    logger.error('Error in PATCH /api/community-inputs/batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 