import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { 
  getBenefitCostAnalyses, 
  getBenefitCostAnalysis, 
  createBenefitCostAnalysis, 
  updateBenefitCostAnalysis, 
  deleteBenefitCostAnalysis, 
  calculateBenefitCostAnalysis,
  performSensitivityAnalysis,
  generateBenefitCostInsights,
  runMonteCarloSimulation
} from '@/lib/benefit-cost-service';
import logger from '@/lib/logger';

// GET /api/projects/[id]/bca - Get all BCA for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const projectId = params.id;
    const userId = session.user.id;
    
    // Check if user has access to this project's organization
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const organizationId = project.organization_id;
    
    // Check membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', userId)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    if (!isGlobalAdmin && !membership) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }
    
    // Check if requesting a specific analysis
    const searchParams = request.nextUrl.searchParams;
    const analysisId = searchParams.get('analysisId');
    
    if (analysisId) {
      const analysis = await getBenefitCostAnalysis(analysisId, organizationId);
      if (!analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      }
      return NextResponse.json(analysis);
    }
    
    // Otherwise return all analyses for this project
    const analyses = await getBenefitCostAnalyses(projectId, organizationId);
    return NextResponse.json(analyses);
  } catch (error) {
    logger.error('Error fetching BCA:', error);
    return NextResponse.json({ error: 'Failed to fetch benefit-cost analyses' }, { status: 500 });
  }
}

// POST /api/projects/[id]/bca - Create a new BCA
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const projectId = params.id;
    const userId = session.user.id;
    
    // Check if user has access to this project's organization
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const organizationId = project.organization_id;
    
    // Check membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', userId)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    if (!isGlobalAdmin && !membership) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Check if this is a calculation request
    if (body.action === 'calculate') {
      const result = await calculateBenefitCostAnalysis(body.analysis);
      return NextResponse.json(result);
    }
    
    // Check if this is a sensitivity analysis request
    if (body.action === 'sensitivity') {
      const result = await performSensitivityAnalysis(
        body.analysis,
        body.parameters,
        body.lowAdjustment,
        body.highAdjustment
      );
      return NextResponse.json(result);
    }
    
    // Check if this is an insights request
    if (body.action === 'insights') {
      const result = await generateBenefitCostInsights(body.analysis, organizationId);
      return NextResponse.json(result);
    }
    
    // Check if this is a Monte Carlo simulation request
    if (body.action === 'monteCarlo') {
      const result = await runMonteCarloSimulation(
        body.analysis,
        body.parameters,
        body.iterations
      );
      return NextResponse.json(result);
    }
    
    // Create a new analysis
    let analysis = body;
    
    // Ensure project ID is set
    analysis.projectId = projectId;
    
    const created = await createBenefitCostAnalysis(analysis, userId, organizationId);
    return NextResponse.json(created);
  } catch (error) {
    logger.error('Error creating BCA:', error);
    return NextResponse.json({ error: 'Failed to create benefit-cost analysis' }, { status: 500 });
  }
}

// PATCH /api/projects/[id]/bca - Update a BCA
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const projectId = params.id;
    const userId = session.user.id;
    
    // Check if user has access to this project's organization
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const organizationId = project.organization_id;
    
    // Check membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', userId)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    if (!isGlobalAdmin && !membership) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const analysisId = searchParams.get('analysisId');
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Update the analysis
    const updated = await updateBenefitCostAnalysis(analysisId, body, organizationId);
    if (!updated) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error updating BCA:', error);
    return NextResponse.json({ error: 'Failed to update benefit-cost analysis' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/bca - Delete a BCA
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const projectId = params.id;
    const userId = session.user.id;
    
    // Check if user has access to this project's organization
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const organizationId = project.organization_id;
    
    // Check membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', userId)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    if (!isGlobalAdmin && !membership) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const analysisId = searchParams.get('analysisId');
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }
    
    const success = await deleteBenefitCostAnalysis(analysisId, organizationId);
    if (!success) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting BCA:', error);
    return NextResponse.json({ error: 'Failed to delete benefit-cost analysis' }, { status: 500 });
  }
} 