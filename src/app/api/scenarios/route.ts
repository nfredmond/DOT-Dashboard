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

/**
 * GET /api/scenarios
 * 
 * Retrieves all scenarios for the authenticated user's organization
 */
export async function GET(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get organization ID from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('user_id', session.user.id)
      .single();
    
    if (!profile?.agency_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }
    
    // Get organization's TrendNavigator config
    const { data: config } = await supabase
      .from('trend_navigator_configs')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .limit(1)
      .single();
    
    if (!config) {
      return NextResponse.json(
        { error: 'No TrendNavigator configuration found for your organization' },
        { status: 400 }
      );
    }
    
    // Get scenarios for the organization
    const { data: scenarios } = await supabase
      .from('scenarios')
      .select('*')
      .eq('organization_id', profile.agency_id)
      .order('updated_at', { ascending: false });
    
    return NextResponse.json(scenarios || []);
  } catch (error: any) {
    console.error('Error retrieving scenarios:', error.message);
    
    return NextResponse.json(
      { error: 'Failed to retrieve scenarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenarios
 * 
 * Creates a new scenario
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get organization ID from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, agency_id')
      .eq('user_id', session.user.id)
      .single();
    
    if (!profile?.agency_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Create new scenario
    const scenarioData = {
      name: body.name,
      description: body.description || '',
      base_year: body.baseYear || new Date().getFullYear(),
      horizon_years: body.horizonYears || [new Date().getFullYear() + 10],
      assumptions: body.assumptions || [],
      policy_packages: body.policyPackages || [],
      tags: body.tags || [],
      created_by: profile.id,
      organization_id: profile.agency_id,
      baseline_scenario_id: body.baselineScenarioId || null
    };
    
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .insert([scenarioData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating scenario:', error);
      return NextResponse.json(
        { error: 'Failed to create scenario' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(scenario, { status: 201 });
  } catch (error: any) {
    console.error('Error creating scenario:', error.message);
    
    return NextResponse.json(
      { error: 'Failed to create scenario' },
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
    console.error('Error comparing scenarios:', error);
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
    console.error('Error refining scenario:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while refining the scenario' },
      { status: 500 }
    );
  }
} 