import { NextRequest, NextResponse } from 'next/server';
import { 
  generateScenarios, 
  compareScenarios, 
  refineScenario,
  ScenarioGenerationType
} from '@/lib/analysis/scenario-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { projectId, scenarioType, options } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    if (!Object.values(ScenarioGenerationType).includes(scenarioType as ScenarioGenerationType)) {
      return NextResponse.json(
        { error: 'Invalid scenario type' },
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
    
    // Generate scenarios
    const result = await generateScenarios(
      project, 
      scenarioType as ScenarioGenerationType, 
      options
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating scenarios:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while generating scenarios' },
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