/**
 * Sesame Service
 * 
 * Integration with Sesame CSM (Conversational Speech Model) for text-to-speech
 */

import { Blob } from 'node:buffer';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';

// Types for Sesame CSM generator
interface Segment {
  text: string;
  speaker: number;
  audio?: any; // Audio tensor in production
}

interface SesameTTSOptions {
  text: string;
  speaker: number;
  context?: Segment[];
  maxAudioLengthMs?: number;
  temperature?: number;
}

// Constants
const SESAME_SUPPORTED = process.env.SESAME_CSM_PATH ? true : false;
const SESAME_MODELS_DIR = process.env.SESAME_MODELS_DIR || './models/sesame';
const LLAMA_MODEL_PATH = process.env.SESAME_LLAMA_MODEL_PATH || 'sesame/llama-3.2-1b';
const CSM_MODEL_PATH = process.env.SESAME_CSM_MODEL_PATH || 'sesame/csm-1b';

/**
 * Synthesizes speech using Sesame CSM
 * This implementation uses an external process to run the Python code
 * 
 * @param options Options for text-to-speech generation
 * @returns Promise resolving to the generated audio as Buffer
 */
export async function synthesizeSpeech(
  options: SesameTTSOptions
): Promise<Buffer> {
  // Check if Sesame is available
  if (!SESAME_SUPPORTED) {
    throw new Error('Sesame CSM is not configured. Set SESAME_CSM_PATH environment variable.');
  }
  
  try {
    // Prepare a temporary directory for the output
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tmpDir, { recursive: true });
    
    // Create a unique filename for this request
    const outputFile = path.join(tmpDir, `speech_${Date.now()}.wav`);
    
    // Create a script file to run with the Sesame CSM code
    const scriptFile = path.join(tmpDir, `sesame_script_${Date.now()}.py`);
    
    // Create the Python script content
    const pythonScript = generatePythonScript(options, outputFile);
    await fs.writeFile(scriptFile, pythonScript);
    
    // Execute the Python script
    execSync(`python ${scriptFile}`, { 
      stdio: 'inherit'
    });
    
    // Read the generated audio file
    const audioBuffer = await fs.readFile(outputFile);
    
    // Clean up temp files
    await fs.unlink(scriptFile);
    await fs.unlink(outputFile);
    
    return audioBuffer;
  } catch (error) {
    console.error('Sesame CSM synthesis error:', error);
    throw new Error(`Sesame CSM synthesis failed: ${error}`);
  }
}

/**
 * Generates a Python script to run Sesame CSM
 * 
 * @param options TTS options
 * @param outputFile Path to save the output audio
 * @returns Python script as string
 */
function generatePythonScript(
  options: SesameTTSOptions,
  outputFile: string
): string {
  return `
import sys
import os
import torch
import torchaudio
from huggingface_hub import hf_hub_download

# Add the Sesame CSM path to Python path
sys.path.append("${process.env.SESAME_CSM_PATH}")

# Import generator after setting path
from generator import load_csm_1b

# Check available device
if torch.backends.mps.is_available():
    device = "mps"
elif torch.cuda.is_available():
    device = "cuda"
else:
    device = "cpu"

# Load the model
model_path = hf_hub_download(repo_id="${CSM_MODEL_PATH}", filename="ckpt.pt")
generator = load_csm_1b(model_path, device)

# Generate audio
audio = generator.generate(
    text="${options.text.replace(/"/g, '\\"')}",
    speaker=${options.speaker},
    context=[],
    max_audio_length_ms=${options.maxAudioLengthMs || 10000},
    temperature=${options.temperature || 0.7}
)

# Save the audio
torchaudio.save("${outputFile}", audio.unsqueeze(0).cpu(), generator.sample_rate)
print(f"Audio saved to ${outputFile}")
  `;
}

/**
 * Get available speaker IDs for Sesame CSM
 * @returns Array of available speaker IDs
 */
export function getAvailableSpeakers(): number[] {
  // Sesame CSM 1B has speakers 0-7 available
  return [0, 1, 2, 3, 4, 5, 6, 7];
}

/**
 * Checks if Sesame CSM is properly configured
 * @returns True if Sesame CSM is configured, false otherwise
 */
export function isSesameAvailable(): boolean {
  return SESAME_SUPPORTED;
} 