/**
 * Speech-to-Text Transcription API Endpoint
 * 
 * This API route handles speech transcription requests using OpenAI's Whisper model.
 * It accepts audio files and returns the transcribed text.
 * 
 * Endpoint: POST /api/voice/transcribe
 * 
 * Request:
 * - Multipart form data with:
 *   - 'file': Audio file (webm, mp3, mp4, mpeg, mpga, m4a, wav, or webm)
 *   - 'model': Whisper model to use (e.g., 'whisper-1')
 *   - 'language': Optional language code (e.g., 'en', 'fr')
 * 
 * Response:
 * - 200 OK: { text: string } - The transcribed text
 * - 400 Bad Request: Invalid request parameters or missing file
 * - 500 Internal Server Error: Transcription service error
 * 
 * @module api/voice/transcribe
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import logger from '../../../../lib/logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure route with App Router format
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds
export const revalidate = 0; // Don't cache results

// Define CORS headers
const _corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle POST requests for audio transcription
 * 
 * @param request - The incoming request containing audio file and parameters
 * @returns JSON containing the transcribed text
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    
    // Get the audio file from the form data
    const audioFile = formData.get('file');
    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }
    
    // Get the model and language parameters
    const model = formData.get('model')?.toString() || 'whisper-1';
    const language = formData.get('language')?.toString();
    
    // Transcribe the audio using OpenAI's Whisper model
    const transcription = await transcribeWithWhisper(audioFile, model, language);
    
    // Return the transcribed text
    return NextResponse.json({ text: transcription });
  } catch (error) {
    logger.error('Transcription error:', error);
    return NextResponse.json(
      { error: `Transcription failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

/**
 * Transcribe audio using OpenAI's Whisper model
 * 
 * @param audioFile - The audio file to transcribe
 * @param model - The Whisper model to use (default: 'whisper-1')
 * @param language - Optional language code for better accuracy
 * @returns The transcribed text
 */
async function transcribeWithWhisper(
  audioFile: Blob,
  model: string = 'whisper-1',
  language?: string
): Promise<string> {
  try {
    // Check if the model is valid
    if (model !== 'whisper-1') {
      logger.warn(`Unsupported Whisper model: ${model}, using 'whisper-1' instead`);
      model = 'whisper-1';
    }
    
    // Convert Blob to File for OpenAI's API
    const file = new File([audioFile], 'audio.webm', { type: audioFile.type });
    
    // Call the OpenAI API
    const transcriptionOptions: any = {
      file,
      model,
    };
    
    // Add language if provided
    if (language) {
      transcriptionOptions.language = language;
    }
    
    const transcription = await openai.audio.transcriptions.create(transcriptionOptions);
    
    return transcription.text;
  } catch (error) {
    logger.error('Whisper transcription error:', error);
    throw new Error(`Whisper transcription failed: ${error instanceof Error ? error.message : String(error)}`);
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