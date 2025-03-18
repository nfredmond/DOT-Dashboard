import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { 
  generateScenarioInsights,
  analyzeScenarioAspect
} from '@/lib/scenario-insights-service';
import logger from '../../../../../lib/logger';


/**
 * GET /api/scenarios/[id]/insights
 * 
 * Retrieves AI-generated insights for a scenario
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
    
    // Get scenario insights
    const { data: insights, error } = await supabase
      .from('scenario_insights')
      .select('*')
      .eq('scenario_id', params.id)
      .single();
    
    if (error) {
      // If not found, it's not an error - just return empty insights
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          summary: '',
          keyFindings: [],
          recommendations: []
        });
      }
      
      logger.error('Error fetching scenario insights:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve scenario insights' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      summary: insights.summary || '',
      keyFindings: insights.key_findings || [],
      recommendations: insights.recommendations || [],
      charts: insights.charts || []
    });
  } catch (error: any) {
    logger.error('Error retrieving scenario insights:', error.message);
    
    return NextResponse.json(
      { error: 'Failed to retrieve scenario insights' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenarios/[id]/insights
 * 
 * Generates new AI insights for a scenario
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
    
    // Validate the scenario exists and has results
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select(`
        *,
        results:scenario_results(*)
      `)
      .eq('id', params.id)
      .single();
    
    if (scenarioError || !scenario) {
      logger.error('Error fetching scenario:', scenarioError);
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }
    
    if (!scenario.results) {
      return NextResponse.json(
        { error: 'No results available for this scenario. Run the scenario first.' },
        { status: 400 }
      );
    }
    
    // Parse request body for options
    const body = await req.json();
    const options = body.options || {};
    
    // Generate insights
    const insights = await generateScenarioInsights(params.id, options);
    
    if (!insights) {
      return NextResponse.json(
        { error: 'Failed to generate insights' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(insights);
  } catch (error: any) {
    logger.error('Error generating scenario insights:', error.message);
    
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scenarios/[id]/insights/[aspect]
 * 
 * Gets detailed insights for a specific aspect of the scenario
 */
export async function GET_aspect(
  req: NextRequest,
  { params }: { params: { id: string; aspect: string } }
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
    
    // Validate aspect
    const validAspects = ['emissions', 'congestion', 'equity', 'transit'];
    if (!validAspects.includes(params.aspect)) {
      return NextResponse.json(
        { error: 'Invalid aspect. Valid options: emissions, congestion, equity, transit' },
        { status: 400 }
      );
    }
    
    // Get the baseline scenario ID if available
    const { data: scenario } = await supabase
      .from('scenarios')
      .select('baseline_scenario_id')
      .eq('id', params.id)
      .single();
    
    // Generate the aspect analysis
    const content = await analyzeScenarioAspect(
      params.id, 
      params.aspect as any,
      scenario?.baseline_scenario_id || null
    );
    
    if (!content) {
      return NextResponse.json(
        { error: `Failed to analyze ${params.aspect} aspect` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ content });
  } catch (error: any) {
    logger.error(`Error analyzing scenario aspect:`, error.message);
    
    return NextResponse.json(
      { error: 'Failed to analyze scenario aspect' },
      { status: 500 }
    );
  }
} 