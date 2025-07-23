import { NextRequest, NextResponse } from 'next/server';
import { 
  compareScenarios, 
  refineScenario
} from '@/lib/analysis/scenario-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

/**
 * GET /api/scenarios
 * 
 * Retrieves all scenarios for the authenticated user's organization
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(cookies());
    
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeResults = searchParams.get('includeResults') === 'true';
    const status = searchParams.get('status');
    const greenchampModelId = searchParams.get('greenchampModelId');
    const tag = searchParams.get('tag');

    // Build query
    let query = supabase
      .from('scenarios')
      .select(`
        *,
        greenchamp_model:greenchamp_model_configs(*),
        scenario_results(
          id,
          status,
          completedAt,
          metrics,
          spatialResults
        )
      `)
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (greenchampModelId) {
      query = query.eq('greenchampModelId', greenchampModelId);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data: scenarios, error } = await query;

    if (error) {
      logger.error('Error fetching scenarios:', error);
      return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
    }

    // Optionally include full results
    if (includeResults && scenarios) {
      for (const scenario of scenarios) {
        if (scenario.scenario_results?.length > 0) {
          const latestResult = scenario.scenario_results[0];
          const { data: fullResult } = await supabase
            .from('scenario_results')
            .select('*')
            .eq('id', latestResult.id)
            .single();
          
          if (fullResult) {
            scenario.latestResult = fullResult;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: scenarios || [],
      count: scenarios?.length || 0
    });

  } catch (error) {
    logger.error('Error in GET /api/scenarios:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenarios
 * 
 * Creates a new scenario
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(cookies());
    
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
    const validationResult = createScenarioSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const scenarioData = validationResult.data;

    // Check if GreenChAMP model exists and belongs to organization
    if (scenarioData.greenchampModelId) {
      const { data: model, error: modelError } = await supabase
        .from('greenchamp_model_configs')
        .select('id')
        .eq('id', scenarioData.greenchampModelId)
        .eq('organizationId', organizationId)
        .single();

      if (modelError || !model) {
        return NextResponse.json(
          { error: 'Invalid GreenChAMP model ID' },
          { status: 400 }
        );
      }
    }

    // Create scenario
    const newScenario = {
      id: uuidv4(),
      organizationId,
      createdBy: user.id,
      status: 'draft',
      ...scenarioData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data: scenario, error: insertError } = await supabase
      .from('scenarios')
      .insert(newScenario)
      .select()
      .single();

    if (insertError) {
      logger.error('Error creating scenario:', insertError);
      return NextResponse.json(
        { error: 'Failed to create scenario' },
        { status: 500 }
      );
    }

    // If this is based on a GreenChAMP model, copy relevant data
    if (scenarioData.greenchampModelId) {
      const { data: modelConfig } = await supabase
        .from('greenchamp_model_configs')
        .select('zoneSystem, networkConfig, parameters')
        .eq('id', scenarioData.greenchampModelId)
        .single();

      if (modelConfig) {
        // Initialize scenario with GreenChAMP baseline data
        await supabase
          .from('scenarios')
          .update({
            metadata: {
              ...scenario.metadata,
              greenchampBaseline: {
                zoneSystem: modelConfig.zoneSystem,
                networkConfig: modelConfig.networkConfig,
                parameters: modelConfig.parameters
              }
            }
          })
          .eq('id', scenario.id);
      }
    }

    // Log activity
    logger.info(`Scenario created: ${scenario.id} by user ${user.id}`);

    return NextResponse.json({ 
      success: true, 
      data: scenario 
    });

  } catch (error) {
    logger.error('Error in POST /api/scenarios:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Compare two scenarios
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { projectId, scenario1, scenario2 } = body;
    
    if (!projectId || !scenario1 || !scenario2) {
      return NextResponse.json(
        { error: 'Project ID and two scenarios are required' },
        { status: 400 }
      );
    }
    
    // Fetch the project from the database
    const project = await db.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Compare scenarios
    const result = await compareScenarios(project, scenario1, scenario2);
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error comparing scenarios:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while comparing scenarios' },
      { status: 500 }
    );
  }
}

// Refine a scenario based on feedback
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { projectId, scenario, feedback } = body;
    
    if (!projectId || !scenario || !feedback) {
      return NextResponse.json(
        { error: 'Project ID, scenario, and feedback are required' },
        { status: 400 }
      );
    }
    
    // Fetch the project from the database
    const project = await db.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Refine scenario
    const result = await refineScenario(project, scenario, feedback);
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error refining scenario:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while refining the scenario' },
      { status: 500 }
    );
  }
}

// Schema validation for scenario creation
const createScenarioSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  baseYear: z.number().int().min(2000).max(2100),
  horizonYears: z.array(z.number().int().min(2000).max(2100)),
  assumptions: z.record(z.any()).optional(),
  policyPackages: z.array(z.any()).optional(),
  greenchampModelId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional()
});

// Update the scenario
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { id, updateData } = body;
    
    if (!id || !updateData) {
      return NextResponse.json(
        { error: 'ID and update data are required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(cookies());
    
    // Update the scenario
    const { data: updatedScenario, error: updateError } = await supabase
      .from('scenarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update scenario', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedScenario 
    });
  } catch (error) {
    logger.error('Error in PUT /api/scenarios:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete the scenario
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(cookies());
    
    // Delete the scenario
    const { error: deleteError } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete scenario', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: { id } 
    });
  } catch (error) {
    logger.error('Error in DELETE /api/scenarios:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 