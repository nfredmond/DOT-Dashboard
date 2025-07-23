import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { z } from 'zod';
import {
  executeAgentTask,
  performDeepResearch,
  analyzeScreenshot,
  generatePlanningCode,
  analyzeTransportationData
} from '@/lib/openai-agents';

export const dynamic = 'force-dynamic';

// Schema validation
const agentRequestSchema = z.object({
  taskType: z.enum(['research', 'computer_use', 'data_analysis', 'code_generation']),
  action: z.string(),
  data: z.any().optional(),
  projectId: z.string().uuid().optional()
});

// POST handler to execute agent tasks
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = agentRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { taskType, action, data, projectId } = validationResult.data;
    
    // Check project access if projectId provided
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('organization_id')
        .eq('id', projectId)
        .single();
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      // Check user has access to the project's organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', project.organization_id)
        .eq('user_id', user.id)
        .single();
      
      if (!membership) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }
    
    // Execute agent task based on type and action
    let result;
    
    switch (taskType) {
      case 'research':
        if (action === 'deep_research') {
          result = await performDeepResearch(data.topic, projectId);
        } else {
          result = await executeAgentTask({
            id: `research-${Date.now()}`,
            type: 'research',
            description: data.query || data.topic,
            projectId,
            userId: user.id
          });
        }
        break;
        
      case 'computer_use':
        if (action === 'analyze_screenshot' && data.imageUrl) {
          result = await analyzeScreenshot(data.imageUrl, data.context);
        } else {
          result = await executeAgentTask({
            id: `computer-${Date.now()}`,
            type: 'computer_use',
            description: data.task || 'Analyze and provide computer use guidance',
            context: data,
            userId: user.id
          });
        }
        break;
        
      case 'data_analysis':
        if (action === 'analyze_transportation_data') {
          result = await analyzeTransportationData(
            data.dataset,
            data.analysisType || 'general'
          );
        } else {
          result = await executeAgentTask({
            id: `analysis-${Date.now()}`,
            type: 'data_analysis',
            description: data.analysisRequest || 'Analyze the provided data',
            context: data,
            projectId,
            userId: user.id
          });
        }
        break;
        
      case 'code_generation':
        if (action === 'generate_planning_code') {
          result = await generatePlanningCode(
            data.requirements,
            data.language || 'typescript'
          );
        } else {
          result = await executeAgentTask({
            id: `codegen-${Date.now()}`,
            type: 'code_generation',
            description: data.codeRequest || 'Generate code based on requirements',
            context: data,
            userId: user.id
          });
        }
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid task type' },
          { status: 400 }
        );
    }
    
    // Log the agent activity
    await supabase
      .from('agent_activities')
      .insert({
        user_id: user.id,
        task_type: taskType,
        action,
        project_id: projectId,
        success: result.success,
        duration_ms: result.metadata?.duration,
        created_at: new Date().toISOString()
      });
    
    logger.info(`Agent task executed: ${taskType}/${action} by user ${user.id}`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    logger.error('Error in POST /api/agents/execute:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 