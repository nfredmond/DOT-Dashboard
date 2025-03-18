import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Mock scoring criteria data for demo mode
const demoCriteria = [
  {
    id: 'criterion-1',
    name: 'Safety',
    description: 'Impact on transportation safety and crash reduction',
    weight: 0.25,
    category: 'Safety',
    isActive: true,
    type: 'numeric'
  },
  {
    id: 'criterion-2',
    name: 'Equity',
    description: 'Benefits to disadvantaged communities',
    weight: 0.20,
    category: 'Equity',
    isActive: true,
    type: 'numeric'
  },
  {
    id: 'criterion-3',
    name: 'Climate Impact',
    description: 'Reduction in greenhouse gas emissions',
    weight: 0.15,
    category: 'Environment',
    isActive: true,
    type: 'numeric'
  },
  {
    id: 'criterion-4',
    name: 'Congestion Reduction',
    description: 'Impact on traffic congestion',
    weight: 0.15,
    category: 'Mobility',
    isActive: true,
    type: 'numeric'
  },
  {
    id: 'criterion-5',
    name: 'Cost Effectiveness',
    description: 'Value for money and return on investment',
    weight: 0.15,
    category: 'Economic',
    isActive: true,
    type: 'numeric'
  },
  {
    id: 'criterion-6',
    name: 'Multimodal Benefits',
    description: 'Benefits to multiple transportation modes',
    weight: 0.10,
    category: 'Mobility',
    isActive: true,
    type: 'numeric'
  }
];

// Mock prioritization scenarios
const demoPrioritizationScenarios = [
  {
    id: 'scenario-1',
    name: 'Default Scoring',
    description: 'Standard weighting of all criteria',
    criteriaWeights: demoCriteria.reduce((acc, c) => {
      acc[c.id] = c.weight;
      return acc;
    }, {}),
    filterSettings: {},
    agencyId: 'demo-agency',
    createdBy: 'demo-user',
    createdAt: new Date().toISOString()
  },
  {
    id: 'scenario-2',
    name: 'Safety Focus',
    description: 'Prioritizes safety improvements over other criteria',
    criteriaWeights: {
      'criterion-1': 0.4,
      'criterion-2': 0.15,
      'criterion-3': 0.1,
      'criterion-4': 0.1,
      'criterion-5': 0.15,
      'criterion-6': 0.1
    },
    filterSettings: {},
    agencyId: 'demo-agency',
    createdBy: 'demo-user',
    createdAt: new Date().toISOString()
  },
  {
    id: 'scenario-3',
    name: 'Climate Priority',
    description: 'Focus on environmental benefits and emissions reduction',
    criteriaWeights: {
      'criterion-1': 0.15,
      'criterion-2': 0.15,
      'criterion-3': 0.4,
      'criterion-4': 0.1,
      'criterion-5': 0.1,
      'criterion-6': 0.1
    },
    filterSettings: {},
    agencyId: 'demo-agency',
    createdBy: 'demo-user',
    createdAt: new Date().toISOString()
  }
];

// GET /api/scoring/scenarios - Get prioritization scenarios
export async function GET(_request: NextRequest) {
  // Get session
  const supabase = createClient(cookies());
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check for demo mode
  const demoCookie = cookies().get('planning_manager_demo_mode');
  const isDemo = !session && demoCookie?.value === 'true';
  
  if (!session && !isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // If in demo mode, return mock data
  if (isDemo) {
    return NextResponse.json(demoPrioritizationScenarios);
  }
  
  // Regular database query for authenticated users
  try {
    const { data, error } = await supabase
      .from('prioritization_scenarios')
      .select('*');
    
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

// POST /api/scoring/scenarios - Create a new prioritization scenario
export async function POST(request: NextRequest) {
  // Get session
  const supabase = createClient(cookies());
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check for demo mode
  const demoCookie = cookies().get('planning_manager_demo_mode');
  const isDemo = !session && demoCookie?.value === 'true';
  
  if (!session && !isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    // If in demo mode, return mock scenario with an id
    if (isDemo) {
      return NextResponse.json({
        ...body,
        id: `demo-scenario-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: 'demo-user'
      });
    }
    
    // Regular database query for authenticated users
    const { data, error } = await supabase
      .from('prioritization_scenarios')
      .insert({
        ...body,
        created_by: session?.user?.id
      })
      .select()
      .single();
    
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