import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { 
  compareScenarios,
  GeneratedScenario
} from '@/lib/analysis/scenario-service';
import logger from '../../../../../lib/logger';


// Sample demo scenarios data
const demoScenarios = {
  'demo1': [
    {
      id: 'scenario1',
      name: 'Baseline Scenario',
      description: 'Current transportation infrastructure without modifications',
      created_at: '2023-10-20',
      updated_at: '2023-11-10',
      feasibility: 0.9,
      status: 'Active',
      cost: 0,
      timeline: '0 months',
      metrics: {
        congestion_reduction: 0,
        safety_improvement: 0,
        accessibility: 0,
        environmental_impact: 0
      }
    },
    {
      id: 'scenario2',
      name: 'Expanded Bus Network',
      description: 'Increasing bus frequency and adding new routes to underserved areas',
      created_at: '2023-10-25',
      updated_at: '2023-11-15',
      feasibility: 0.8,
      status: 'Draft',
      cost: 1200000,
      timeline: '18 months',
      metrics: {
        congestion_reduction: 25,
        safety_improvement: 15,
        accessibility: 35,
        environmental_impact: 20
      }
    },
    {
      id: 'scenario3',
      name: 'Rail Extension',
      description: 'Extending the light rail system to the eastern suburbs',
      created_at: '2023-11-01',
      updated_at: '2023-11-20',
      feasibility: 0.4,
      status: 'Draft',
      cost: 8500000,
      timeline: '60 months',
      metrics: {
        congestion_reduction: 40,
        safety_improvement: 20,
        accessibility: 50,
        environmental_impact: 35
      }
    }
  ],
  'demo2': [
    {
      id: 'scenario4',
      name: 'Current Zoning',
      description: 'Existing zoning regulations with no changes',
      created_at: '2023-09-10',
      updated_at: '2023-11-05',
      feasibility: 0.95,
      status: 'Active',
      cost: 0,
      timeline: '0 months',
      metrics: {
        economic_growth: 5,
        housing_affordability: 10,
        job_creation: 8,
        environmental_sustainability: 15
      }
    },
    {
      id: 'scenario5',
      name: 'Mixed-Use Development',
      description: 'Increasing mixed-use zoning in downtown areas',
      created_at: '2023-09-15',
      updated_at: '2023-11-10',
      feasibility: 0.75,
      status: 'Draft',
      cost: 350000,
      timeline: '24 months',
      metrics: {
        economic_growth: 25,
        housing_affordability: 30,
        job_creation: 35,
        environmental_sustainability: 20
      }
    }
  ],
  'demo3': [
    {
      id: 'scenario6',
      name: 'Current Bicycle Network',
      description: 'Existing bicycle paths and infrastructure',
      created_at: '2023-11-05',
      updated_at: '2023-11-20',
      feasibility: 0.9,
      status: 'Active',
      cost: 0,
      timeline: '0 months',
      metrics: {
        usage_increase: 0,
        safety_improvement: 0,
        accessibility: 0,
        environmental_benefit: 0
      }
    },
    {
      id: 'scenario7',
      name: 'Protected Bike Lanes',
      description: 'Adding protected bike lanes to major thoroughfares',
      created_at: '2023-11-10',
      updated_at: '2023-11-25',
      feasibility: 0.7,
      status: 'Draft',
      cost: 550000,
      timeline: '12 months',
      metrics: {
        usage_increase: 45,
        safety_improvement: 60,
        accessibility: 40,
        environmental_benefit: 30
      }
    }
  ]
};

// GET all scenarios for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check for demo mode
  const demoCookie = cookies().get('planning_manager_demo_mode');
  const isDemo = !session && demoCookie?.value === 'true';
  
  if (!session && !isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // If in demo mode, return mock data
  if (isDemo) {
    // Check if we have demo scenarios for this project
    if (projectId.startsWith('demo') && demoScenarios[projectId as keyof typeof demoScenarios]) {
      return NextResponse.json(demoScenarios[projectId as keyof typeof demoScenarios]);
    }
    return NextResponse.json([]);
  }
  
  // Regular database query for authenticated users
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('project_id', projectId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST a new scenario for a project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const projectId = params.id;
    const data = await req.json();
    
    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Create scenario
    const scenario = await db.projectScenario.create({
      data: {
        ...data,
        projectId,
        createdBy: session.user.id,
      },
    });
    
    return NextResponse.json(scenario);
  } catch (error) {
    logger.error('Error creating scenario:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while creating the scenario' },
      { status: 500 }
    );
  }
}

// PUT - compare two scenarios
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const projectId = params.id;
    const { scenario1Id, scenario2Id } = await req.json();
    
    if (!scenario1Id || !scenario2Id) {
      return NextResponse.json(
        { error: 'Two scenario IDs are required' },
        { status: 400 }
      );
    }
    
    // Get the project
    const project = await db.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Get both scenarios
    const scenario1 = await db.projectScenario.findUnique({
      where: { id: scenario1Id, projectId },
    });
    
    const scenario2 = await db.projectScenario.findUnique({
      where: { id: scenario2Id, projectId },
    });
    
    if (!scenario1 || !scenario2) {
      return NextResponse.json(
        { error: 'One or both scenarios not found' },
        { status: 404 }
      );
    }
    
    // Compare scenarios
    const comparison = await compareScenarios(
      project, 
      scenario1 as unknown as GeneratedScenario, 
      scenario2 as unknown as GeneratedScenario
    );
    
    // Save comparison result
    const comparisonRecord = await db.scenarioComparison.create({
      data: {
        projectId,
        scenario1Id,
        scenario2Id,
        comparison: comparison.comparison,
        recommendation: comparison.recommendation,
        scores: comparison.scores,
        createdById: session.user.id,
      },
    });
    
    return NextResponse.json({
      ...comparison,
      id: comparisonRecord.id,
    });
  } catch (error) {
    logger.error('Error comparing scenarios:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while comparing scenarios' },
      { status: 500 }
    );
  }
} 