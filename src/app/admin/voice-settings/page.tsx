import { Metadata } from 'next';
import VoiceSettingsClient from './VoiceSettingsClient';

export const metadata: Metadata = {
  title: 'Voice Model Settings | Admin',
  description: 'Configure voice recognition and synthesis models',
};

export default function VoiceSettingsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Voice Model Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure voice recognition (Whisper) and voice synthesis (Sesame CSM) models
        </p>
      </div>
      
      <div className="grid gap-8">
        <div className="grid gap-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
            <h3 className="font-medium text-amber-800">About Voice Models</h3>
            <p className="text-amber-700 text-sm mt-1">
              This application uses OpenAI's Whisper for speech-to-text (the default) and 
              Sesame's CSM (released March 2025) for text-to-speech. Both require API keys and proper configuration.
            </p>
          </div>
          
          <VoiceSettingsClient />
        </div>
        
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Environment Variables</h2>
          <p className="text-muted-foreground">
            The following environment variables need to be configured for voice models:
          </p>
          
          <div className="bg-muted p-4 rounded-md overflow-auto">
            <pre className="text-sm">
              <code>{`# OpenAI API Key (required for Whisper and OpenAI TTS)
OPENAI_API_KEY=your_openai_api_key_here

# Sesame CSM Configuration (optional)
SESAME_CSM_PATH=/path/to/sesame/csm  # Path to Sesame CSM repository
SESAME_MODELS_DIR=/path/to/models    # Directory for downloaded models
SESAME_CSM_MODEL_PATH=sesame/csm-1b  # HuggingFace repo for CSM model (defaults to sesame/csm-1b)
SESAME_LLAMA_MODEL_PATH=sesame/llama-3.2-1b  # HuggingFace repo for Llama model`}</code>
            </pre>
          </div>
          
          <p className="text-sm text-muted-foreground">
            You must restart the server after changing these environment variables.
          </p>
        </div>
      </div>
    </div>
  );
} 