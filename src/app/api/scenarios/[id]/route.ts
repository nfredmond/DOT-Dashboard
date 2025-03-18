import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import logger from '../../../../lib/logger';


/**
 * GET /api/scenarios/[id]
 * 
 * Retrieves a single scenario by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get scenario
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .select(`
        *,
        results:scenario_results(*)
      `)
      .eq('id', params.id)
      .single();
    
    if (error) {
      logger.error('Error fetching scenario:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Scenario not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to retrieve scenario' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(scenario);
  } catch (error: any) {
    logger.error('Error retrieving scenario:', error.message);
    
    return NextResponse.json(
      { error: 'Failed to retrieve scenario' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scenarios/[id]
 * 
 * Updates a scenario
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate the scenario exists
    const { data: existingScenario, error: fetchError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (fetchError || !existingScenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }
    
    // Update scenario
    const updates = {
      name: body.name || existingScenario.name,
      description: body.description !== undefined ? body.description : existingScenario.description,
      horizon_years: body.horizonYears || existingScenario.horizon_years,
      assumptions: body.assumptions || existingScenario.assumptions,
      policy_packages: body.policyPackages || existingScenario.policy_packages,
      tags: body.tags || existingScenario.tags,
      baseline_scenario_id: body.baselineScenarioId || existingScenario.baseline_scenario_id,
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedScenario, error } = await supabase
      .from('scenarios')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating scenario:', error);
      return NextResponse.json(
        { error: 'Failed to update scenario' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedScenario);
  } catch (error: any) {
    logger.error('Error updating scenario:', error.message);
    
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scenarios/[id]
 * 
 * Deletes a scenario
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Validate the scenario exists
    const { data: existingScenario, error: fetchError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (fetchError || !existingScenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }
    
    // Delete scenario
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      logger.error('Error deleting scenario:', error);
      return NextResponse.json(
        { error: 'Failed to delete scenario' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error deleting scenario:', error.message);
    
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
} 