/**
 * Voice Command Processing API Endpoint
 * 
 * This API route handles the processing of voice commands through the agent system.
 * It accepts audio input containing a voice command, transcribes it, and processes
 * the command to generate a response and potentially trigger actions.
 * 
 * Endpoint: POST /api/voice/process-command
 * 
 * Request body (multipart form data):
 * - file: Audio Blob/File - The audio file containing the voice command
 * - context?: string (JSON) - Optional contextual information for processing
 * - settings?: string (JSON) - Optional voice settings
 * 
 * Response:
 * - 200 OK: { command, processed, response, action, metadata }
 * - 400 Bad Request: Invalid request parameters or missing audio
 * - 500 Internal Server Error: Processing error
 * 
 * @module api/voice/process-command
 */

import { NextRequest, NextResponse } from 'next/server';
import { processVoiceCommand } from '@/lib/voice-agent-service';
import { defaultVoiceSettings, VoiceSettings } from '@/lib/voice-service';
import { AgentContext } from '@/lib/agent-sdk';

/**
 * Handle POST requests for processing voice commands
 * 
 * @param request - The incoming request containing the audio file and options
 * @returns JSON containing the command processing results
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('file') as Blob | null;
    
    // Get optional context and settings if provided
    const contextStr = formData.get('context') as string || '{}';
    const settingsStr = formData.get('settings') as string || '{}';
    
    let context: AgentContext = {};
    let settings: Partial<VoiceSettings> = {};
    
    try {
      // Parse the JSON strings
      context = JSON.parse(contextStr);
      settings = JSON.parse(settingsStr);
    } catch (e) {
      console.warn('Failed to parse context or settings JSON:', e);
      // Continue with defaults
    }
    
    // Validate the audio file
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }
    
    // Merge settings with defaults
    const mergedSettings: VoiceSettings = {
      ...defaultVoiceSettings,
      ...settings
    };
    
    // Process the voice command
    const result = await processVoiceCommand(audioFile, {
      context,
      settings: mergedSettings
    });
    
    // Return the processing result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Voice command processing error:', error);
    return NextResponse.json(
      { 
        processed: false,
        error: `Voice command processing failed: ${error instanceof Error ? error.message : String(error)}` 
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