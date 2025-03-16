import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

// Mock project scores for demo mode
const demoProjectScores = {
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

// GET /api/scoring/projects/[id] - Get scores for a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  
  // Get session
  const supabase = createClient(cookies());
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check for demo mode
  const demoCookie = cookies().get('rtpa_demo_mode');
  const isDemo = !session && demoCookie?.value === 'true';
  
  if (!session && !isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // If in demo mode, return mock data
  if (isDemo) {
    if (projectId.startsWith('demo') && demoProjectScores[projectId as keyof typeof demoProjectScores]) {
      return NextResponse.json(demoProjectScores[projectId as keyof typeof demoProjectScores]);
    }
    return NextResponse.json([]);
  }
  
  // Regular database query for authenticated users
  try {
    const { data, error } = await supabase
      .from('scoring')
      .select(`
        *,
        criteria:criteria_id(name, weight)
      `)
      .eq('project_id', projectId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const formattedData = data.map(item => ({
      id: item.id,
      projectId: item.project_id,
      criterionId: item.criteria_id,
      score: item.score,
      notes: item.notes || '',
      createdBy: item.created_by,
      createdAt: item.created_at,
      criterionName: item.criteria?.name,
      criterionWeight: item.criteria?.weight * 100 // Convert 0-1 to 0-100
    }));
    
    return NextResponse.json(formattedData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 