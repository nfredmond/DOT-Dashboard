import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { runTrendNavigatorScenario } from '@/lib/trend-navigator-service';
import { runCAMPModel } from '@/lib/camp-runner';

/**
 * POST /api/scenarios/[id]/run
 * 
 * Runs a scenario using the CAMP model
 */
export async function POST(
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
    
    // Parse request body for options
    const body = await req.json();
    const options = body.options || {};
    
    // Create a model run record
    const { data: modelRun, error: runError } = await supabase
      .from('camp_model_runs')
      .insert([{
        scenario_id: params.id,
        model_config_id: body.modelConfigId, // This should be passed or retrieved from config
        status: 'QUEUED',
        options: options,
        parameters: {}, // Will be populated during processing
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (runError) {
      console.error('Error creating model run:', runError);
      return NextResponse.json(
        { error: 'Failed to initiate scenario run' },
        { status: 500 }
      );
    }
    
    // Start the model run asynchronously
    // In a production environment, this would be handled by a queue system
    // For simplicity, we're starting it directly here
    startModelRun(modelRun.id, params.id, options).catch(err => {
      console.error(`Error running model for scenario ${params.id}:`, err);
      
      // Update the run status to ERROR
      supabase
        .from('camp_model_runs')
        .update({
          status: 'ERROR',
          error_message: err.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', modelRun.id)
        .then(() => {
          console.log(`Updated model run ${modelRun.id} status to ERROR`);
        })
        .catch(updateErr => {
          console.error(`Failed to update model run ${modelRun.id} status:`, updateErr);
        });
    });
    
    // Return the model run info
    return NextResponse.json({
      id: modelRun.id,
      status: 'QUEUED',
      message: 'Scenario run has been queued for processing'
    }, { status: 202 }); // 202 Accepted
  } catch (error: any) {
    console.error('Error running scenario:', error.message);
    
    return NextResponse.json(
      { error: 'Failed to run scenario' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scenarios/[id]/run
 * 
 * Gets the status of the latest model run for a scenario
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
    
    // Get the latest model run for this scenario
    const { data: modelRuns, error } = await supabase
      .from('camp_model_runs')
      .select('*')
      .eq('scenario_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching model runs:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve model run status' },
        { status: 500 }
      );
    }
    
    if (!modelRuns || modelRuns.length === 0) {
      return NextResponse.json({
        status: 'NOT_FOUND',
        message: 'No model runs found for this scenario'
      });
    }
    
    const latestRun = modelRuns[0];
    
    return NextResponse.json({
      id: latestRun.id,
      status: latestRun.status,
      progress: latestRun.progress,
      createdAt: latestRun.created_at,
      startedAt: latestRun.started_at,
      completedAt: latestRun.completed_at,
      errorMessage: latestRun.error_message
    });
  } catch (error: any) {
    console.error('Error getting run status:', error.message);
    
    return NextResponse.json(
      { error: 'Failed to get run status' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to run the model in the background
 */
async function startModelRun(runId: string, scenarioId: string, options: any) {
  const supabase = createClient();
  
  try {
    // Update the run status to RUNNING
    await supabase
      .from('camp_model_runs')
      .update({
        status: 'RUNNING',
        started_at: new Date().toISOString()
      })
      .eq('id', runId);
    
    // Run the model
    const modelRun = await runCAMPModel(scenarioId, options);
    
    // Update the run status to COMPLETED
    await supabase
      .from('camp_model_runs')
      .update({
        status: 'COMPLETED',
        progress: 100,
        results: modelRun.results,
        completed_at: new Date().toISOString()
      })
      .eq('id', runId);
    
    // If successful, store the results in scenario_results
    if (modelRun.results) {
      const scenarioResults = {
        scenario_id: scenarioId,
        model_run_id: runId,
        horizon_years: modelRun.results.horizonYears || [new Date().getFullYear() + 10],
        aggregate_metrics: modelRun.results.aggregateMetrics || {},
        spatial_results: modelRun.results.spatialResults || null,
        comparison_to_baseline: modelRun.results.comparisonToBaseline || null,
        generated_at: new Date().toISOString()
      };
      
      // Check if results already exist for this scenario
      const { data: existingResults } = await supabase
        .from('scenario_results')
        .select('id')
        .eq('scenario_id', scenarioId);
      
      if (existingResults && existingResults.length > 0) {
        // Update existing results
        await supabase
          .from('scenario_results')
          .update(scenarioResults)
          .eq('scenario_id', scenarioId);
      } else {
        // Insert new results
        await supabase
          .from('scenario_results')
          .insert([scenarioResults]);
      }
    }
    
    return modelRun;
  } catch (error) {
    console.error(`Error in model run ${runId}:`, error);
    
    // Update the run status to ERROR
    await supabase
      .from('camp_model_runs')
      .update({
        status: 'ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', runId);
    
    throw error;
  }
} 