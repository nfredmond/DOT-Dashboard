import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { runPrioritizationScenario } from '@/lib/scoring-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get('scenarioId');
    
    if (!scenarioId) {
      return NextResponse.json(
        { success: false, error: 'Scenario ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(cookies());
    
    // Get results for the specified scenario
    const { data, error } = await supabase
      .from('prioritization_results')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('rank', { ascending: true });
    
    if (error) {
      console.error('Error fetching scenario results:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch scenario results' },
        { status: 500 }
      );
    }
    
    // If no results found, run the scenario
    if (!data || data.length === 0) {
      try {
        const results = await runPrioritizationScenario(scenarioId);
        
        // Format the results for response
        const formattedResults = results.map(result => ({
          scenarioId: result.scenarioId,
          projectId: result.projectId,
          rank: result.rank,
          normalizedScore: result.normalizedScore,
          categoryScores: result.categoryScores,
          metadata: result.metadata
        }));
        
        return NextResponse.json({ success: true, results: formattedResults });
      } catch (runError) {
        console.error('Error running scenario:', runError);
        return NextResponse.json(
          { success: false, error: 'Failed to run scenario' },
          { status: 500 }
        );
      }
    }
    
    // Format the existing results
    const results = data.map(result => ({
      scenarioId: result.scenario_id,
      projectId: result.project_id,
      rank: result.rank,
      normalizedScore: result.normalized_score,
      categoryScores: result.category_scores,
      metadata: result.metadata
    }));
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error in scenario results API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId } = body;
    
    if (!scenarioId) {
      return NextResponse.json(
        { success: false, error: 'Scenario ID is required' },
        { status: 400 }
      );
    }
    
    // Run the prioritization scenario
    try {
      const results = await runPrioritizationScenario(scenarioId);
      
      // Format the results for response
      const formattedResults = results.map(result => ({
        scenarioId: result.scenarioId,
        projectId: result.projectId,
        rank: result.rank,
        normalizedScore: result.normalizedScore,
        categoryScores: result.categoryScores,
        metadata: result.metadata
      }));
      
      return NextResponse.json({ success: true, results: formattedResults });
    } catch (error) {
      console.error('Error running scenario:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to run scenario' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in run scenario API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 