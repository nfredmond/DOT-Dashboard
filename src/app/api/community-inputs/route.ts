import { NextRequest, NextResponse } from 'next/server';import { createClient } from '@/lib/supabase/server';import { cookies } from 'next/headers';import logger from '@/lib/logger';import { z } from 'zod';import { runAgentQuery, AgentType } from '@/lib/agents-service';import { triggerCommunityInputUpdate } from '@/lib/realtime/pusher-server';

export const dynamic = 'force-dynamic';

// Schema validation
const createInputSchema = z.object({
  type: z.enum(['point', 'line', 'polygon']),
  geometry: z.any(), // GeoJSON geometry
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  category: z.string(),
  images: z.array(z.string()).optional().default([]),
  projectId: z.string().uuid().optional()
});

const updateInputSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'archived']),
  moderationNote: z.string().optional()
});

// GET handler to fetch community inputs
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let query = supabase
      .from('community_inputs')
      .select(`
        *,
        category:community_input_categories!category_id(*),
        images:community_input_images(*),
        votes:community_input_votes(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category_key', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Error fetching community inputs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community inputs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        limit,
        offset,
        total: data?.length || 0
      }
    });
    
  } catch (error) {
    logger.error('Error in GET /api/community-inputs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler to create a new community input
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get organization from user metadata
    const organizationId = user.user_metadata?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createInputSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const inputData = validationResult.data;
    
    // Get organization settings
    const { data: orgSettings } = await supabase
      .from('organization_community_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();
    
    const settings = orgSettings || {
      requires_approval: true,
      use_llm_moderation: true,
      llm_auto_approve_threshold: 0.8
    };
    
    // Get category details
    const { data: category } = await supabase
      .from('community_input_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('key', inputData.category)
      .single();
    
    if (!category) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }
    
    // Auto-categorize with LLM if enabled
    let llmCategory = null;
    let llmConfidence = null;
    
    if (settings.use_llm_moderation) {
      try {
        // Get all categories for this organization
        const { data: categories } = await supabase
          .from('community_input_categories')
          .select('key, name')
          .eq('organization_id', organizationId)
          .eq('is_active', true);
        
        const categoryList = categories?.map(c => `${c.key}: ${c.name}`).join(', ') || '';
        
                const llmResponse = await runAgentQuery({          type: AgentType.ANALYSIS,          query: `Categorize the following community input into one of these categories: ${categoryList}          Title: ${inputData.title}Description: ${inputData.description}Respond with a JSON object containing:- category: the most appropriate category key- confidence: a confidence score between 0 and 1`,          context: { categories }        });
        
        if (llmResponse?.result) {
          const result = typeof llmResponse.result === 'string' 
            ? JSON.parse(llmResponse.result) 
            : llmResponse.result;
          llmCategory = result.category;
          llmConfidence = result.confidence;
        }
      } catch (error) {
        logger.error('Error in LLM categorization:', error);
      }
    }
    
    // Determine status based on settings and LLM confidence
    let status = 'pending';
    if (!settings.requires_approval) {
      status = 'approved';
    } else if (
      settings.use_llm_moderation && 
      llmConfidence && 
      llmConfidence >= settings.llm_auto_approve_threshold
    ) {
      status = 'approved';
    }
    
    // Create the community input
    const { data: newInput, error: insertError } = await supabase
      .from('community_inputs')
      .insert({
        organization_id: organizationId,
        type: inputData.type,
        geometry: inputData.geometry,
        title: inputData.title,
        description: inputData.description,
        category_id: category.id,
        category_key: category.key,
        user_id: user.id,
        username: user.user_metadata?.name || user.email || 'Anonymous',
        user_email: user.email,
        status,
        llm_category: llmCategory,
        llm_confidence: llmConfidence,
        project_id: inputData.projectId
      })
      .select()
      .single();
    
    if (insertError) {
      logger.error('Error creating community input:', insertError);
      return NextResponse.json(
        { error: 'Failed to create community input' },
        { status: 500 }
      );
    }
    
    // Handle image uploads if any
    if (inputData.images && inputData.images.length > 0) {
      const imageRecords = inputData.images.map((url, index) => ({
        input_id: newInput.id,
        url,
        display_order: index
      }));
      
      const { error: imageError } = await supabase
        .from('community_input_images')
        .insert(imageRecords);
      
      if (imageError) {
        logger.error('Error saving images:', imageError);
      }
    }
    
    // Log activity
    logger.info(`Community input created: ${newInput.id} by user ${user.id}`);
    
    return NextResponse.json({
      success: true,
      data: newInput
    });
    
  } catch (error) {
    logger.error('Error in POST /api/community-inputs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler to update community input (admin moderation)
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
    const validationResult = updateInputSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { id, status, moderationNote } = validationResult.data;
    
    // Get the input to check organization
    const { data: input } = await supabase
      .from('community_inputs')
      .select('organization_id')
      .eq('id', id)
      .single();
    
    if (!input) {
      return NextResponse.json(
        { error: 'Community input not found' },
        { status: 404 }
      );
    }
    
    // Check if user is admin/editor for this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', input.organization_id)
      .eq('user_id', user.id)
      .single();
    
    if (!membership || !['admin', 'editor'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Editor access required' },
        { status: 403 }
      );
    }
    
    // Update the input
    const { data: updatedInput, error: updateError } = await supabase
      .from('community_inputs')
      .update({
        status,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
        moderation_note: moderationNote
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      logger.error('Error updating community input:', updateError);
      return NextResponse.json(
        { error: 'Failed to update community input' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedInput
    });
    
  } catch (error) {
    logger.error('Error in PATCH /api/community-inputs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a community input
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Get the input to check ownership/organization
    const { data: input } = await supabase
      .from('community_inputs')
      .select('organization_id, user_id')
      .eq('id', id)
      .single();
    
    if (!input) {
      return NextResponse.json(
        { error: 'Community input not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns the input or is admin
    let canDelete = input.user_id === user.id;
    
    if (!canDelete) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', input.organization_id)
        .eq('user_id', user.id)
        .single();
      
      canDelete = membership !== null && ['admin', 'editor'].includes(membership.role);
    }
    
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden - You cannot delete this input' },
        { status: 403 }
      );
    }
    
    // Delete the input (images will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('community_inputs')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      logger.error('Error deleting community input:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete community input' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Community input deleted successfully'
    });
    
  } catch (error) {
    logger.error('Error in DELETE /api/community-inputs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 