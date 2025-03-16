import VoiceAgent from '@/components/VoiceAgent';
import { defaultVoiceSettings } from '@/lib/voice-service';

export default function VoiceDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Voice + Agent Demo</h1>
        <p className="text-muted-foreground">
          Test voice integration with the Model Context Protocol and Agent SDK
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Voice Command Interface</h2>
          <p className="text-sm text-muted-foreground">
            Click the microphone button and speak your commands. The system uses Whisper for speech-to-text 
            and OpenAI TTS for text-to-speech responses.
          </p>
          
          <VoiceAgent 
            voiceSettings={{
              ...defaultVoiceSettings,
              autoTranscribe: true,
              autoReadResponses: true
              // Using defaults for ttsModel and sttModel
            }}
            initialContext={{
              workspace: 'Planning Manager',
              currentPage: 'voice-demo',
              user: {
                name: 'Demo User',
                role: 'Developer'
              }
            }}
          />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Try with Sesame CSM</h2>
          <p className="text-sm text-muted-foreground">
            For comparison, this version uses Sesame CSM for text-to-speech.
          </p>
          
          <VoiceAgent 
            voiceSettings={{
              ...defaultVoiceSettings,
              autoTranscribe: true,
              autoReadResponses: true,
              ttsModel: 'sesame_csm',
              ttsVoice: 'speaker_0'
            }}
            initialContext={{
              workspace: 'Planning Manager',
              currentPage: 'voice-demo',
              user: {
                name: 'Demo User',
                role: 'Developer'
              }
            }}
            className="border-2 border-dashed border-muted-foreground/20"
          />
        </div>
        
        <div className="space-y-4 md:col-span-2">
          <h2 className="text-xl font-semibold">Command Examples</h2>
          <div className="bg-muted p-4 rounded-md space-y-3">
            <div>
              <h3 className="text-sm font-medium">Basic Commands</h3>
              <ul className="text-sm list-disc list-inside ml-2 text-muted-foreground">
                <li>"What is the current time?"</li>
                <li>"What is my role in the system?"</li>
                <li>"Create a new project called Voice Integration"</li>
                <li>"Show me a summary of my tasks"</li>
                <li>"Take a screenshot of this page"</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Navigation Commands</h3>
              <ul className="text-sm list-disc list-inside ml-2 text-muted-foreground">
                <li>"Go to the dashboard"</li>
                <li>"Open the settings page"</li>
                <li>"Navigate to my profile"</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Agent Commands</h3>
              <ul className="text-sm list-disc list-inside ml-2 text-muted-foreground">
                <li>"Ask the agent to explain this feature"</li>
                <li>"Tell the agent to summarize my recent activity"</li>
                <li>"Have the agent check for important notifications"</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">How it works</h3>
            <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside ml-2">
              <li>Voice input is captured using the browser's MediaRecorder API</li>
              <li>Audio is sent to the server and transcribed using OpenAI's Whisper</li>
              <li>The transcribed text is processed through the Agent SDK</li>
              <li>The MCP (Model Context Protocol) provides context to the LLM</li>
              <li>Responses are synthesized using OpenAI TTS (or Sesame CSM for comparison)</li>
              <li>The entire process happens in seconds for a seamless experience</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 