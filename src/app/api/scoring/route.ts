import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

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

// Mock project scores for demo mode
const _demoProjectScores = {
  'demo1': [
    { id: 'score-1', projectId: 'demo1', criterionId: 'criterion-1', score: 85, notes: 'High impact on pedestrian safety' },
    { id: 'score-2', projectId: 'demo1', criterionId: 'criterion-2', score: 78, notes: 'Serves multiple disadvantaged neighborhoods' },
    { id: 'score-3', projectId: 'demo1', criterionId: 'criterion-3', score: 92, notes: 'Significant reduction in vehicle miles traveled' },
    { id: 'score-4', projectId: 'demo1', criterionId: 'criterion-4', score: 65, notes: 'Moderate congestion relief' },
    { id: 'score-5', projectId: 'demo1', criterionId: 'criterion-5', score: 70, notes: 'Average cost per beneficiary is reasonable' },
    { id: 'score-6', projectId: 'demo1', criterionId: 'criterion-6', score: 88, notes: 'Benefits pedestrians, cyclists, and transit users' }
  ],
  'demo2': [
    { id: 'score-7', projectId: 'demo2', criterionId: 'criterion-1', score: 62, notes: 'Some safety improvements for residential areas' },
    { id: 'score-8', projectId: 'demo2', criterionId: 'criterion-2', score: 94, notes: 'Excellent equity outcomes for disadvantaged communities' },
    { id: 'score-9', projectId: 'demo2', criterionId: 'criterion-3', score: 80, notes: 'Good reduction in greenhouse gas emissions' },
    { id: 'score-10', projectId: 'demo2', criterionId: 'criterion-4', score: 55, notes: 'Limited congestion relief' },
    { id: 'score-11', projectId: 'demo2', criterionId: 'criterion-5', score: 68, notes: 'ROI is below average but acceptable' },
    { id: 'score-12', projectId: 'demo2', criterionId: 'criterion-6', score: 75, notes: 'Primarily benefits pedestrians and housing' }
  ],
  'demo3': [
    { id: 'score-13', projectId: 'demo3', criterionId: 'criterion-1', score: 95, notes: 'Excellent safety improvements for cyclists' },
    { id: 'score-14', projectId: 'demo3', criterionId: 'criterion-2', score: 72, notes: 'Good accessibility for diverse communities' },
    { id: 'score-15', projectId: 'demo3', criterionId: 'criterion-3', score: 88, notes: 'Strong climate benefits from mode shift' },
    { id: 'score-16', projectId: 'demo3', criterionId: 'criterion-4', score: 60, notes: 'Some congestion reduction from mode shift' },
    { id: 'score-17', projectId: 'demo3', criterionId: 'criterion-5', score: 85, notes: 'Very cost effective implementation' },
    { id: 'score-18', projectId: 'demo3', criterionId: 'criterion-6', score: 90, notes: 'Strong benefits for active transportation' }
  ]
};

// Mock prioritization scenarios
const _demoPrioritizationScenarios = [
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

// GET /api/scoring - Get scoring criteria, for demo this returns mock data
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
    return NextResponse.json(demoCriteria);
  }
  
  // Regular database query for authenticated users
  try {
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .order('category');
    
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