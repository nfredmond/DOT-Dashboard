/**
 * Voice Service
 * 
 * This service provides comprehensive voice-related functionality including:
 * - Speech-to-text (STT) transcription using OpenAI Whisper
 * - Text-to-speech (TTS) synthesis with multiple model options
 * - Audio recording and playback utilities
 * - Voice settings management
 * 
 * The service integrates with the model selection system to allow for
 * different TTS and STT models based on user preference and task requirements.
 * 
 * @example
 * ```tsx
 * // Basic text-to-speech
 * const audioBlob = await textToSpeech("Hello world");
 * playAudio(audioBlob);
 * 
 * // Start and stop recording
 * const recorder = await startRecording();
 * // ... wait for user to speak ...
 * const audioBlob = await stopRecording(recorder);
 * 
 * // Transcribe speech
 * const transcript = await transcribeSpeech(audioBlob);
 * console.log("User said:", transcript);
 * 
 * // With custom voice settings
 * const settings: VoiceSettings = {
 *   ttsModel: 'openai',
 *   ttsVoice: 'alloy',
 *   autoTranscribe: true,
 *   autoResponse: true
 * };
 * 
 * const audioBlob = await textToSpeech("Hello with custom voice", settings);
 * ```
 */

// For server-side processing

// Types of voice models supported for TTS
export type VoiceModelType = 'openai' | 'sesame-csm' | 'elevenlabs';

// Types of transcription models supported for STT
export type TranscriptionModelType = 'whisper' | 'deepgram';

/**
 * Configuration interface for voice-related settings
 */
export interface VoiceSettings {
  /**
   * Text-to-speech model to use
   * @default 'openai'
   */
  ttsModel: VoiceModelType;
  
  /**
   * Voice to use for TTS (model-specific)
   * For OpenAI: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
   * @default 'nova'
   */
  ttsVoice: string;
  
  /**
   * Speech rate for TTS
   * @default 1.0
   */
  ttsSpeed: number;
  
  /**
   * Automatically transcribe speech when recording stops
   * @default true
   */
  autoTranscribe: boolean;
  
  /**
   * Automatically generate and speak responses
   * @default true
   */
  autoResponse: boolean;
  
  /**
   * Speech-to-text model to use for transcription
   * @default 'whisper'
   */
  sttModel: TranscriptionModelType;
  
  /**
   * Specific Whisper model to use for transcription
   * @default 'whisper-1'
   */
  whisperModel: string;
  
  /**
   * Whether to show transcription on screen
   * @default true
   */
  showTranscription: boolean;
  
  /**
   * UI theme for voice components ('light', 'dark', or 'system')
   * @default 'system'
   */
  theme: 'light' | 'dark' | 'system';
  
  /**
   * Whether special voice commands are enabled (e.g., "take screenshot")
   * @default true
   */
  enableVoiceCommands: boolean;
}

/**
 * Default voice settings used when not explicitly provided
 */
export const defaultVoiceSettings: VoiceSettings = {
  ttsModel: 'openai',
  ttsVoice: 'nova',
  ttsSpeed: 1.0,
  autoTranscribe: true,
  autoResponse: true,
  sttModel: 'whisper',
  whisperModel: 'whisper-1',
  showTranscription: true,
  theme: 'system',
  enableVoiceCommands: true
};

/**
 * Transcribes speech from an audio blob to text
 * 
 * @param audioBlob - The audio blob to transcribe
 * @param settings - Optional voice settings to use
 * @returns Promise resolving to the transcription text
 * 
 * @example
 * ```tsx
 * const audioBlob = await stopRecording(recorder);
 * const transcript = await transcribeSpeech(audioBlob);
 * console.log("Transcribed text:", transcript);
 * ```
 */
export async function transcribeSpeech(
  audioBlob: Blob,
  settings?: Partial<VoiceSettings>
): Promise<string> {
  try {
    // Create form data with the audio
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', settings?.whisperModel || 'whisper-1');
    
    // Send to the API for transcription
    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Speech transcription error:', error);
    throw error;
  }
}

/**
 * Converts text to speech and returns an audio blob
 * 
 * @param text - The text to convert to speech
 * @param settings - Optional voice settings to use
 * @returns Promise resolving to an audio blob
 * 
 * @example
 * ```tsx
 * const audioBlob = await textToSpeech("Hello, how can I help you today?");
 * playAudio(audioBlob);
 * ```
 */
export async function textToSpeech(
  text: string,
  settings?: Partial<VoiceSettings>
): Promise<Blob> {
  try {
    // Prepare request data
    const requestData: any = {
      text,
      model: settings?.ttsModel || 'openai',
      voice: settings?.ttsVoice || 'nova',
      speed: settings?.ttsSpeed || 1.0
    };
    
    // Send to the API for text-to-speech
    const response = await fetch('/api/voice/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`Speech synthesis failed: ${response.statusText}`);
    }
    
    // Get audio data
    const audioData = await response.arrayBuffer();
    return new Blob([audioData], { type: 'audio/mpeg' });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw error;
  }
}

/**
 * Plays audio from a blob or URL
 * 
 * @param audioData - Blob or URL of audio to play
 * @returns Promise that resolves when audio playback completes
 * 
 * @example
 * ```tsx
 * const audioBlob = await textToSpeech("Playing this message");
 * await playAudio(audioBlob);
 * console.log("Audio playback complete");
 * ```
 */
export async function playAudio(audioData: Blob | string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioUrl = typeof audioData === 'string' ? audioData : URL.createObjectURL(audioData);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        if (typeof audioUrl === 'string') {
          URL.revokeObjectURL(audioUrl);
        }
        resolve();
      };
      
      audio.onerror = (event) => {
        if (typeof audioUrl === 'string') {
          URL.revokeObjectURL(audioUrl);
        }
        reject(new Error(`Audio playback error: ${event}`));
      };
      
      audio.play();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Starts audio recording from the user's microphone
 * 
 * @returns Promise resolving to a MediaRecorder object
 * 
 * @example
 * ```tsx
 * const recorder = await startRecording();
 * setIsRecording(true);
 * ```
 */
export async function startRecording(): Promise<MediaRecorder> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const _audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      // Clear the chunks
      audioChunks.length = 0;
    };
    
    mediaRecorder.start();
    
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
}

/**
 * Stops an active recording and returns the recorded audio
 * 
 * @param recorder - The MediaRecorder to stop
 * @returns Promise resolving to a blob of the recorded audio
 * 
 * @example
 * ```tsx
 * const audioBlob = await stopRecording(recorder);
 * setIsRecording(false);
 * ```
 */
export async function stopRecording(recorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve) => {
    const audioChunks: BlobPart[] = [];
    
    // Capture any final data
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    // When recorder is stopped, resolve with the audio blob
    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      resolve(audioBlob);
    };
    
    // Stop the recorder if it's recording
    if (recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      // If already stopped, just resolve with an empty blob
      resolve(new Blob([], { type: 'audio/webm' }));
    }
  });
} 