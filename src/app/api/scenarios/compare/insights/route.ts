import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { generateComparativeInsights } from '@/lib/scenario-insights-service';
import logger from '../../../../../lib/logger';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user's organization ID
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !userProfile || !userProfile.organization_id) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 403 }
      );
    }
    
    const organizationId = userProfile.organization_id;
    
    // Get the scenario IDs from the request body
    const body = await req.json();
    const { scenarioIds, baselineScenarioId } = body;
    
    if (!scenarioIds || !Array.isArray(scenarioIds) || scenarioIds.length === 0) {
      return NextResponse.json(
        { error: 'No scenario IDs provided' },
        { status: 400 }
      );
    }
    
    // Check if all scenarios belong to the user's organization
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('id')
      .in('id', scenarioIds)
      .eq('organization_id', organizationId);
    
    if (scenariosError) {
      logger.error('Error verifying scenario ownership:', scenariosError);
      return NextResponse.json(
        { error: 'Failed to verify scenario access' },
        { status: 500 }
      );
    }
    
    // If some scenarios don't belong to the user's organization
    if (scenarios.length !== scenarioIds.length) {
      const foundIds = scenarios.map(s => s.id);
      const unauthorizedIds = scenarioIds.filter(id => !foundIds.includes(id));
      
      return NextResponse.json(
        { 
          error: 'You do not have permission to access some of the specified scenarios',
          unauthorizedScenarioIds: unauthorizedIds
        },
        { status: 403 }
      );
    }
    
    // Check if we already have a recent comparison result for these scenarios
    const { data: existingComparison, error: comparisonError } = await supabase
      .from('scenario_comparisons')
      .select('*')
      .contains('scenario_ids', scenarioIds)
      .eq('baseline_scenario_id', baselineScenarioId || null)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!comparisonError && existingComparison && existingComparison.length > 0) {
      // Check if comparison is recent (within the last hour)
      const existingTimestamp = new Date(existingComparison[0].created_at).getTime();
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      if (existingTimestamp > oneHourAgo) {
        // Return the cached comparison result
        return NextResponse.json({
          insights: existingComparison[0].comparison_insights,
          metrics: existingComparison[0].metrics_data,
          cached: true,
          timestamp: existingComparison[0].created_at
        });
      }
    }
    
    // Generate new comparative insights
    const insightsResult = await generateComparativeInsights(scenarioIds, baselineScenarioId);
    
    if (!insightsResult) {
      return NextResponse.json(
        { error: 'Failed to generate comparative insights' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      insights: insightsResult.insights,
      metrics: insightsResult.metrics,
      cached: false,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error generating scenario comparison insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user's organization ID
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !userProfile || !userProfile.organization_id) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const scenarioIds = url.searchParams.get('ids')?.split(',') || [];
    const baselineScenarioId = url.searchParams.get('baseline') || undefined;
    
    if (scenarioIds.length === 0) {
      return NextResponse.json(
        { error: 'No scenario IDs provided' },
        { status: 400 }
      );
    }
    
    // Get the latest comparison result
    const { data: comparison, error: comparisonError } = await supabase
      .from('scenario_comparisons')
      .select('*')
      .contains('scenario_ids', scenarioIds)
      .eq('baseline_scenario_id', baselineScenarioId || null)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (comparisonError) {
      logger.error('Error fetching comparison results:', comparisonError);
      return NextResponse.json(
        { error: 'Failed to fetch comparison results' },
        { status: 500 }
      );
    }
    
    if (!comparison || comparison.length === 0) {
      return NextResponse.json(
        { error: 'No comparison results found for the specified scenarios' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      insights: comparison[0].comparison_insights,
      metrics: comparison[0].metrics_data,
      timestamp: comparison[0].created_at
    });
    
  } catch (error) {
    logger.error('Error retrieving scenario comparison insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 