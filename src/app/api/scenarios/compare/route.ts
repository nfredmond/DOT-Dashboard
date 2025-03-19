import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import logger from '../../../../lib/logger';

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
    
    // Fetch all scenarios for the given IDs (that belong to the user's organization)
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('*')
      .in('id', scenarioIds)
      .eq('organization_id', organizationId);
    
    if (scenariosError) {
      logger.error('Error fetching scenarios:', scenariosError);
      return NextResponse.json(
        { error: 'Failed to fetch scenarios' },
        { status: 500 }
      );
    }
    
    // If some scenarios don't exist or don't belong to the user's organization
    if (scenarios.length !== scenarioIds.length) {
      const foundIds = scenarios.map(s => s.id);
      const missingIds = scenarioIds.filter(id => !foundIds.includes(id));
      
      return NextResponse.json(
        { 
          error: 'Some scenarios were not found or you do not have permission to access them',
          missingScenarioIds: missingIds
        },
        { status: 404 }
      );
    }
    
    // Fetch the results for all scenarios
    const { data: results, error: resultsError } = await supabase
      .from('scenario_results')
      .select('*')
      .in('scenario_id', scenarioIds)
      .order('created_at', { ascending: false });
    
    if (resultsError) {
      logger.error('Error fetching scenario results:', resultsError);
      return NextResponse.json(
        { error: 'Failed to fetch scenario results' },
        { status: 500 }
      );
    }
    
    // Group results by scenario ID (taking the latest result for each scenario)
    const latestResultsByScenarioId: Record<string, any> = {};
    
    for (const result of results) {
      const scenarioId = result.scenario_id;
      if (!latestResultsByScenarioId[scenarioId] || 
          new Date(result.created_at) > new Date(latestResultsByScenarioId[scenarioId].created_at)) {
        latestResultsByScenarioId[scenarioId] = result;
      }
    }
    
    // Prepare the response data
    const comparisonData = {
      scenarios,
      results: latestResultsByScenarioId,
      baseline: baselineScenarioId ? latestResultsByScenarioId[baselineScenarioId] : null
    };
    
    return NextResponse.json(comparisonData);
    
  } catch (error) {
    logger.error('Error in scenario comparison:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 