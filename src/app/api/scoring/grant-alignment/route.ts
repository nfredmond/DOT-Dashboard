import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getProjectGrantAlignment } from '@/lib/scoring-service';
import { analyzeGrantOpportunity } from '@/lib/llm-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Get grant alignment for the specified project
    try {
      const alignments = await getProjectGrantAlignment(projectId);
      
      return NextResponse.json({ success: true, alignments });
    } catch (error) {
      console.error('Error fetching grant alignments:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch grant alignments' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in grant alignment API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, grantId } = body;
    
    if (!projectId || !grantId) {
      return NextResponse.json(
        { success: false, error: 'Project ID and Grant ID are required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(cookies());
    
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (projectError) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch project details' },
        { status: 500 }
      );
    }
    
    // Get grant details
    const { data: grant, error: grantError } = await supabase
      .from('grants')
      .select('*')
      .eq('id', grantId)
      .single();
      
    if (grantError) {
      console.error('Error fetching grant:', grantError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch grant details' },
        { status: 500 }
      );
    }
    
    // Get project scores
    const { data: scores, error: scoresError } = await supabase
      .from('scoring')
      .select('*, criteria:criteria_id(*)')
      .eq('project_id', projectId);
      
    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch project scores' },
        { status: 500 }
      );
    }
    
    // Prepare detailed project information
    const projectDetails = JSON.stringify({
      name: project.name,
      description: project.description,
      type: project.type,
      location: project.location,
      budget: project.metadata?.budget,
      scores: scores.map(score => ({
        criterionName: score.criteria.name,
        score: score.score,
        notes: score.notes
      }))
    });
    
    // Prepare grant information
    const grantRequirements = JSON.stringify({
      name: grant.name,
      description: grant.description,
      fundingAmount: grant.metadata?.funding_amount,
      eligibilityCriteria: grant.metadata?.eligibility_criteria,
      deadlines: grant.metadata?.deadlines
    });
    
    try {
      // Use LLM to analyze grant alignment
      const analysisText = await analyzeGrantOpportunity(
        projectDetails,
        grantRequirements
      );
      
      // Parse the LLM response
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        // If not valid JSON, create a simple structure
        analysis = {
          overallScore: 0,
          strengths: [],
          weaknesses: [],
          improvementSuggestions: []
        };
      }
      
      return NextResponse.json({ success: true, analysis });
    } catch (error) {
      console.error('Error analyzing grant alignment:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to analyze grant alignment' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in analyze grant API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 