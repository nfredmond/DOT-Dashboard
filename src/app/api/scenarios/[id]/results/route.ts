import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scenarioId = params.id;
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
    
    // Verify that the scenario belongs to the user's organization
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('id, organization_id')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError || !scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }
    
    if (scenario.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this scenario' },
        { status: 403 }
      );
    }
    
    // Get the latest scenario result
    const { data: results, error: resultsError } = await supabase
      .from('scenario_results')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (resultsError) {
      console.error('Error fetching scenario results:', resultsError);
      return NextResponse.json(
        { error: 'Failed to fetch scenario results' },
        { status: 500 }
      );
    }
    
    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'No results found for this scenario' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(results[0]);
    
  } catch (error) {
    console.error('Error in getting scenario results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 