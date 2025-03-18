/**
 * Text-to-Speech API Endpoint
 * 
 * This API route handles text-to-speech conversion requests,
 * supporting multiple TTS providers including OpenAI and Sesame CSM.
 * 
 * Endpoint: POST /api/voice/synthesize
 * 
 * Request body:
 * {
 *   text: string;       // Text to convert to speech
 *   model: string;      // TTS model to use ('openai', 'sesame-csm', 'elevenlabs')
 *   voice: string;      // Voice ID to use (model-specific)
 *   speed: number;      // Speech rate (0.5-2.0, default: 1.0)
 * }
 * 
 * Response:
 * - 200 OK: Audio data (audio/mpeg)
 * - 400 Bad Request: Invalid request parameters
 * - 500 Internal Server Error: TTS service error
 * 
 * @module api/voice/synthesize
 */

import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai-service';
import logger from '../../../../lib/logger';


/**
 * Handle POST requests to synthesize text to speech
 * 
 * @param request - The incoming request containing text and TTS parameters
 * @returns Audio data as a response stream
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text, model = 'openai', voice = 'nova', speed = 1.0 } = body;
    
    // Validate the required parameters
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    // Process based on the requested model
    if (model === 'openai') {
      return await synthesizeWithOpenAI(text, voice, speed);
    } else if (model === 'sesame-csm') {
      return await synthesizeWithSesameCsm(text, voice, speed);
    } else if (model === 'elevenlabs') {
      return await synthesizeWithElevenLabs(text, voice, speed);
    } else {
      return NextResponse.json(
        { error: `Unsupported TTS model: ${model}` },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Speech synthesis error:', error);
    return NextResponse.json(
      { error: `Speech synthesis failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

/**
 * Synthesize speech using OpenAI's TTS API
 * 
 * @param text - Text to convert to speech
 * @param voice - OpenAI voice ID ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')
 * @param speed - Speech rate (0.5-2.0)
 * @returns Audio data as a response stream
 */
async function synthesizeWithOpenAI(text: string, voice: string, speed: number) {
  try {
    // Validate voice and speed parameters
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
    type ValidVoice = typeof validVoices[number];
    
    // Make sure voice is one of the valid options
    const safeVoice: ValidVoice = validVoices.includes(voice as ValidVoice) 
      ? (voice as ValidVoice) 
      : 'nova';
    
    const safeSpeed = Math.max(0.5, Math.min(2.0, speed));
    
    // Call the OpenAI API
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: safeVoice,
      input: text,
      speed: safeSpeed,
    });
    
    // Get the audio data as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    
    // Return the audio data
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    logger.error('OpenAI TTS error:', error);
    throw new Error(`OpenAI TTS failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Synthesize speech using Sesame CSM's TTS API
 * (Note: Implementation placeholder for Sesame CSM)
 * 
 * @param text - Text to convert to speech
 * @param voice - Voice ID for Sesame CSM
 * @param speed - Speech rate
 * @returns Audio data as a response stream
 */
async function synthesizeWithSesameCsm(_text: string, _voice: string, _speed: number) {
  // Implementation would go here - placeholder for now
  // This would call the Sesame CSM API with the appropriate parameters
  
  // For now, return an error response
  return NextResponse.json(
    { error: 'Sesame CSM TTS not implemented yet' },
    { status: 501 }
  );
}

/**
 * Synthesize speech using ElevenLabs' TTS API
 * (Note: Implementation placeholder for ElevenLabs)
 * 
 * @param text - Text to convert to speech
 * @param voice - Voice ID for ElevenLabs
 * @param speed - Speech rate
 * @returns Audio data as a response stream
 */
async function synthesizeWithElevenLabs(_text: string, _voice: string, _speed: number) {
  // Implementation would go here - placeholder for now
  // This would call the ElevenLabs API with the appropriate parameters
  
  // For now, return an error response
  return NextResponse.json(
    { error: 'ElevenLabs TTS not implemented yet' },
    { status: 501 }
  );
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

/**
 * Configuration for the API route
 */
export const config = {
  api: {
    responseLimit: false,
  },
}; 