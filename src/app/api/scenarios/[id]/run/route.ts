import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { CAMPRunner } from '@/lib/camp/camp-runner';
import { TrendNavigatorService } from '@/lib/trend-navigator/trend-navigator-service';
import { generateScenarioInsights } from '@/lib/scenario-insights-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for run options
const runOptionsSchema = z.object({
  detailedResults: z.boolean().optional().default(true),
  spatialAnalysis: z.boolean().optional().default(true),
  equityAnalysis: z.boolean().optional().default(true),
  environmentalAnalysis: z.boolean().optional().default(true),
  generateInsights: z.boolean().optional().default(true),
  compareToBaseline: z.boolean().optional().default(false),
  baselineScenarioId: z.string().uuid().optional()
});

// GET endpoint to check run status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scenarioId = params.id;

    // Get the latest run for this scenario
    const { data: latestRun, error } = await supabase
      .from('greenchamp_model_runs')
      .select(`
        *,
        scenario_results(
          id,
          status,
          metrics,
          completedAt
        )
      `)
      .eq('scenarioId', scenarioId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching run status:', error);
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        runId: latestRun.id,
        status: latestRun.status,
        progress: latestRun.progress,
        startedAt: latestRun.createdAt,
        completedAt: latestRun.completedAt,
        error: latestRun.errorMessage,
        results: latestRun.scenario_results?.[0] || null
      }
    });

  } catch (error) {
    logger.error('Error in GET /api/scenarios/[id]/run:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to start a new run
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
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

    const scenarioId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = runOptionsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid run options', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const runOptions = validationResult.data;

    // Get scenario details
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select(`
        *,
        greenchamp_model:greenchamp_model_configs(*)
      `)
      .eq('id', scenarioId)
      .eq('organizationId', organizationId)
      .single();

    if (scenarioError || !scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Check if a run is already in progress
    const { data: existingRun } = await supabase
      .from('greenchamp_model_runs')
      .select('id, status')
      .eq('scenarioId', scenarioId)
      .in('status', ['pending', 'running'])
      .single();

    if (existingRun) {
      return NextResponse.json(
        { error: 'A run is already in progress for this scenario' },
        { status: 409 }
      );
    }

    // Create a new model run record
    const runId = uuidv4();
    const { error: runError } = await supabase
      .from('greenchamp_model_runs')
      .insert({
        id: runId,
        scenarioId,
        organizationId,
        status: 'pending',
        progress: 0,
        options: runOptions,
        createdBy: user.id
      });

    if (runError) {
      logger.error('Error creating model run:', runError);
      return NextResponse.json(
        { error: 'Failed to create model run' },
        { status: 500 }
      );
    }

    // Start the model run asynchronously
    runScenarioAsync(runId, scenario, runOptions, organizationId, user.id);

    return NextResponse.json({
      success: true,
      data: {
        runId,
        status: 'pending',
        message: 'Model run started successfully'
      }
    });

  } catch (error) {
    logger.error('Error in POST /api/scenarios/[id]/run:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Async function to run the scenario
async function runScenarioAsync(
  runId: string,
  scenario: any,
  options: any,
  organizationId: string,
  userId: string
) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  try {
    // Update status to running
    await supabase
      .from('greenchamp_model_runs')
      .update({ 
        status: 'running',
        progress: 10,
        startedAt: new Date().toISOString()
      })
      .eq('id', runId);

    // Initialize services
    const campRunner = new CAMPRunner(organizationId);
    const trendNavigator = new TrendNavigatorService(organizationId);

    // Step 1: Run GreenChAMP model (40% of progress)
    logger.info(`Running GreenChAMP model for scenario ${scenario.id}`);
    
    const modelParams = scenario.greenchamp_model?.parameters || {
      trip_generation: {
        production_rates: { HOME_WORK: 0.8, HOME_OTHER: 2.0 },
        attraction_rates: { HOME_WORK: 0.9, HOME_OTHER: 1.8 }
      },
      trip_distribution: {
        friction_factors: { 
          HOME_WORK: [1.0, 0.9, 0.8, 0.7, 0.6], 
          HOME_OTHER: [1.0, 0.85, 0.7, 0.55, 0.4] 
        }
      },
      mode_choice: {
        constants: { auto: 0, transit: -2.0, walk: -3.5, bike: -3.0 },
        coefficients: { time: -0.03, cost: -0.008 }
      },
      assignment: {
        volume_delay_parameters: { alpha: 0.15, beta: 4.0 },
        convergence_criteria: 0.001,
        max_iterations: 20
      }
    };

    const campResult = await campRunner.runModel(scenario.id, modelParams);
    
    await supabase
      .from('greenchamp_model_runs')
      .update({ progress: 40 })
      .eq('id', runId);

    if (!campResult.success) {
      throw new Error(`GreenChAMP model failed: ${campResult.message}`);
    }

    // Step 2: Apply TrendNavigator projections (30% of progress)
    logger.info(`Applying TrendNavigator projections for scenario ${scenario.id}`);
    
    const trendResults = await trendNavigator.runScenario(scenario.id, {
      baselineResultId: campResult.resultId,
      horizonYears: scenario.horizonYears,
      assumptions: scenario.assumptions,
      policyPackages: scenario.policyPackages
    });

    await supabase
      .from('greenchamp_model_runs')
      .update({ progress: 70 })
      .eq('id', runId);

    // Step 3: Generate comprehensive results (20% of progress)
    const comprehensiveResults = {
      id: uuidv4(),
      scenarioId: scenario.id,
      runId,
      status: 'completed',
      metrics: {
        // GreenChAMP metrics
        vmt: campResult.metrics?.totalVMT || 0,
        vht: campResult.metrics?.totalVHT || 0,
        avgSpeed: campResult.metrics?.avgSpeed || 0,
        congestionIndex: campResult.metrics?.congestionIndex || 0,
        
        // Mode shares
        modeShares: campResult.metrics?.modeShares || {},
        
        // Environmental metrics
        emissions: {
          co2: campResult.metrics?.emissions?.co2 || 0,
          nox: campResult.metrics?.emissions?.nox || 0,
          pm25: campResult.metrics?.emissions?.pm25 || 0
        },
        
        // TrendNavigator projections
        projections: trendResults.projections || {},
        
        // Equity metrics (if enabled)
        equity: options.equityAnalysis ? {
          accessibilityByIncome: trendResults.equity?.accessibilityByIncome || {},
          benefitDistribution: trendResults.equity?.benefitDistribution || {}
        } : null
      },
      spatialResults: options.spatialAnalysis ? {
        zoneMetrics: campResult.zoneResults || {},
        networkFlows: campResult.networkResults || {},
        heatmaps: trendResults.spatialAnalysis || {}
      } : null,
      completedAt: new Date().toISOString()
    };

    // Save results
    const { error: resultError } = await supabase
      .from('scenario_results')
      .insert(comprehensiveResults);

    if (resultError) {
      throw new Error(`Failed to save results: ${resultError.message}`);
    }

    await supabase
      .from('greenchamp_model_runs')
      .update({ progress: 90 })
      .eq('id', runId);

    // Step 4: Generate AI insights (10% of progress)
    if (options.generateInsights) {
      logger.info(`Generating AI insights for scenario ${scenario.id}`);
      
      const insights = await generateScenarioInsights(
        comprehensiveResults,
        scenario,
        'comprehensive'
      );

      await supabase
        .from('scenario_insights')
        .insert({
          scenarioId: scenario.id,
          resultId: comprehensiveResults.id,
          insights,
          generatedBy: userId,
          createdAt: new Date().toISOString()
        });
    }

    // Mark run as completed
    await supabase
      .from('greenchamp_model_runs')
      .update({
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        resultId: comprehensiveResults.id
      })
      .eq('id', runId);

    // Update scenario status
    await supabase
      .from('scenarios')
      .update({
        status: 'completed',
        lastRunAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', scenario.id);

    logger.info(`Scenario run completed successfully: ${runId}`);

  } catch (error) {
    logger.error(`Error running scenario ${runId}:`, error);
    
    // Update run status to failed
    await supabase
      .from('greenchamp_model_runs')
      .update({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString()
      })
      .eq('id', runId);

    // Update scenario status
    await supabase
      .from('scenarios')
      .update({
        status: 'failed',
        updatedAt: new Date().toISOString()
      })
      .eq('id', scenario.id);
  }
} 