import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { runPrioritizationScenario } from '@/lib/scoring-service';

// Mock scenario results for demo mode
const demoScenarioResults = {
  'scenario-1': [
    {
      id: 'result-1',
      scenarioId: 'scenario-1',
      projectId: 'demo1',
      rank: 2,
      normalizedScore: 0.85,
      categoryScores: {
        Safety: 80,
        Equity: 75,
        Environment: 95,
        Mobility: 70,
        Economic: 70
      },
      metadata: {}
    },
    {
      id: 'result-2',
      scenarioId: 'scenario-1',
      projectId: 'demo2',
      rank: 3,
      normalizedScore: 0.78,
      categoryScores: {
        Safety: 60,
        Equity: 95,
        Environment: 80,
        Mobility: 60,
        Economic: 65
      },
      metadata: {}
    },
    {
      id: 'result-3',
      scenarioId: 'scenario-1',
      projectId: 'demo3',
      rank: 1,
      normalizedScore: 0.88,
      categoryScores: {
        Safety: 95,
        Equity: 70,
        Environment: 90,
        Mobility: 70,
        Economic: 85
      },
      metadata: {}
    }
  ],
  'scenario-2': [
    {
      id: 'result-4',
      scenarioId: 'scenario-2',
      projectId: 'demo1',
      rank: 2,
      normalizedScore: 0.82,
      categoryScores: {
        Safety: 80,
        Equity: 75,
        Environment: 95,
        Mobility: 70,
        Economic: 70
      },
      metadata: {}
    },
    {
      id: 'result-5',
      scenarioId: 'scenario-2',
      projectId: 'demo2',
      rank: 3,
      normalizedScore: 0.68,
      categoryScores: {
        Safety: 60,
        Equity: 95,
        Environment: 80,
        Mobility: 60,
        Economic: 65
      },
      metadata: {}
    },
    {
      id: 'result-6',
      scenarioId: 'scenario-2',
      projectId: 'demo3',
      rank: 1,
      normalizedScore: 0.90,
      categoryScores: {
        Safety: 95,
        Equity: 70,
        Environment: 90,
        Mobility: 70,
        Economic: 85
      },
      metadata: {}
    }
  ],
  'scenario-3': [
    {
      id: 'result-7',
      scenarioId: 'scenario-3',
      projectId: 'demo1',
      rank: 1,
      normalizedScore: 0.90,
      categoryScores: {
        Safety: 80,
        Equity: 75,
        Environment: 95,
        Mobility: 70,
        Economic: 70
      },
      metadata: {}
    },
    {
      id: 'result-8',
      scenarioId: 'scenario-3',
      projectId: 'demo2',
      rank: 3,
      normalizedScore: 0.75,
      categoryScores: {
        Safety: 60,
        Equity: 95,
        Environment: 80,
        Mobility: 60,
        Economic: 65
      },
      metadata: {}
    },
    {
      id: 'result-9',
      scenarioId: 'scenario-3',
      projectId: 'demo3',
      rank: 2,
      normalizedScore: 0.85,
      categoryScores: {
        Safety: 95,
        Equity: 70,
        Environment: 90,
        Mobility: 70,
        Economic: 85
      },
      metadata: {}
    }
  ]
};

// GET /api/scoring/scenario-results - Get results for a prioritization scenario
export async function GET(request: NextRequest) {
  // Get session
  const supabase = createClient(cookies());
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check for demo mode
  const demoCookie = cookies().get('rtpa_demo_mode');
  const isDemo = !session && demoCookie?.value === 'true';
  
  if (!session && !isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get the scenario ID from query parameters
  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get('scenarioId');
  
  if (!scenarioId) {
    return NextResponse.json(
      { error: 'Scenario ID is required' },
      { status: 400 }
    );
  }
  
  // If in demo mode, return mock data
  if (isDemo) {
    if (demoScenarioResults[scenarioId as keyof typeof demoScenarioResults]) {
      return NextResponse.json(demoScenarioResults[scenarioId as keyof typeof demoScenarioResults]);
    }
    return NextResponse.json([]);
  }
  
  // Regular database query for authenticated users
  try {
    const { data, error } = await supabase
      .from('prioritization_results')
      .select('*')
      .eq('scenario_id', scenarioId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Format the response
    const results = data.map(result => ({
      id: result.id,
      scenarioId: result.scenario_id,
      projectId: result.project_id,
      rank: result.rank,
      normalizedScore: result.normalized_score,
      categoryScores: result.category_scores,
      metadata: result.metadata || {}
    }));
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/scoring/scenario-results - Run a prioritization scenario and save results
export async function POST(request: NextRequest) {
  // Get session
  const supabase = createClient(cookies());
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check for demo mode
  const demoCookie = cookies().get('rtpa_demo_mode');
  const isDemo = !session && demoCookie?.value === 'true';
  
  if (!session && !isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { scenarioId } = body;
    
    if (!scenarioId) {
      return NextResponse.json(
        { error: 'Scenario ID is required' },
        { status: 400 }
      );
    }
    
    // If in demo mode, return mock results
    if (isDemo) {
      if (demoScenarioResults[scenarioId as keyof typeof demoScenarioResults]) {
        return NextResponse.json({
          success: true,
          results: demoScenarioResults[scenarioId as keyof typeof demoScenarioResults]
        });
      }
      return NextResponse.json({ 
        success: false, 
        error: 'Scenario not found' 
      }, { status: 404 });
    }
    
    // In a real implementation, this would:
    // 1. Run the prioritization algorithm
    // 2. Save the results to the database
    // 3. Return the results
    
    // For now, we'll implement a basic version that just gets the existing results
    const { data, error } = await supabase
      .from('prioritization_results')
      .select('*')
      .eq('scenario_id', scenarioId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Format the response
    const results = data.map(result => ({
      id: result.id,
      scenarioId: result.scenario_id,
      projectId: result.project_id,
      rank: result.rank,
      normalizedScore: result.normalized_score,
      categoryScores: result.category_scores,
      metadata: result.metadata || {}
    }));
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 