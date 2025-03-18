import { NextRequest, NextResponse } from 'next/server';
import { processVoiceCommand } from '@/lib/voice-agent-service';
import { AgentType } from '@/lib/agents-service';
import logger from '../../../lib/logger';


/**
 * API handler for processing voice commands
 * 
 * @param request The incoming API request
 * @returns Response with the processed command results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, context, options } = body;
    
    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }
    
    const result = await processVoiceCommand(command, {
      preferMCP: options?.useMCP ?? true,
      agentType: options?.agentType ?? AgentType.ANALYSIS,
      currentPage: context?.currentPage,
      currentProjectId: context?.currentProjectId,
      userContext: context?.userData,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error processing voice command:', error);
    return NextResponse.json(
      { error: 'Failed to process voice command' },
      { status: 500 }
    );
  }
} 