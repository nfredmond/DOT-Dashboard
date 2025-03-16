/**
 * Text Command Processing API Endpoint
 * 
 * This API route handles the processing of text-based commands through the agent system.
 * It's similar to the voice command processing, but accepts text input directly instead
 * of audio files that need transcription.
 * 
 * Endpoint: POST /api/voice/process-text-command
 * 
 * Request body:
 * {
 *   command: string;     // The text command to process
 *   context?: object;    // Optional contextual information for processing
 *   settings?: object;   // Optional voice settings
 * }
 * 
 * Response:
 * - 200 OK: { command, processed, response, action, metadata }
 * - 400 Bad Request: Invalid request parameters or missing command
 * - 500 Internal Server Error: Processing error
 * 
 * @module api/voice/process-text-command
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWithTextCommand } from '@/lib/voice-agent-service';
import { defaultVoiceSettings, VoiceSettings } from '@/lib/voice-service';
import { AgentContext } from '@/lib/agent-sdk';

/**
 * Handle POST requests for processing text commands
 * 
 * @param request - The incoming request containing the text command and options
 * @returns JSON containing the command processing results
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { command, context = {}, settings = {} } = body;
    
    // Validate the command parameter
    if (!command || typeof command !== 'string' || !command.trim()) {
      return NextResponse.json(
        { error: 'Text command is required' },
        { status: 400 }
      );
    }
    
    // Merge settings with defaults
    const mergedSettings: VoiceSettings = {
      ...defaultVoiceSettings,
      ...settings
    };
    
    // Prepare context for processing
    const processingContext: AgentContext = {
      ...context,
      isTextInput: true,
      timestamp: new Date().toISOString()
    };
    
    // Process the text command
    const result = await processWithTextCommand(command, {
      context: processingContext,
      settings: mergedSettings
    });
    
    // Return the processing result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Text command processing error:', error);
    return NextResponse.json(
      { 
        processed: false,
        error: `Text command processing failed: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests (for CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 