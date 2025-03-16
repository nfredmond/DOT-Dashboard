import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { 
  compareScenarios, 
  refineScenario 
} from '@/lib/analysis/scenario-service';

// GET all scenarios for a project
export async function GET(
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
    
    // Get scenarios for the project
    const scenarios = await db.projectScenario.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching scenarios' },
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
    console.error('Error creating scenario:', error);
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
    const comparison = await compareScenarios(project, scenario1, scenario2);
    
    // Save comparison result
    const comparisonRecord = await db.scenarioComparison.create({
      data: {
        projectId,
        scenario1Id,
        scenario2Id,
        comparison: comparison.comparison,
        recommendation: comparison.recommendation,
        scores: comparison.scores,
        createdBy: session.user.id,
      },
    });
    
    return NextResponse.json({
      ...comparison,
      id: comparisonRecord.id,
    });
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while comparing scenarios' },
      { status: 500 }
    );
  }
} 