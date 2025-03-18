'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mic, MicOff, Volume2, Send } from 'lucide-react';
import { 
  startRecording, 
  stopRecording,
  textToSpeech,
  playAudio,
  VoiceSettings,
  defaultVoiceSettings
} from '@/lib/voice-service';
import { VoiceCommandResult } from '@/lib/voice-agent-service';
import { AgentContext } from '@/lib/agent-sdk';

/**
 * Props for the VoiceAgent component
 */
interface VoiceAgentProps {
  /** Custom voice settings to override defaults */
  voiceSettings?: VoiceSettings;
  
  /** Initial context for the agent */
  initialContext?: AgentContext;
  
  /** Callback fired when a command is processed */
  onCommandProcessed?: (result: VoiceCommandResult) => void;
  
  /** Additional CSS class name */
  className?: string;
}

/**
 * VoiceAgent Component
 * 
 * A full-featured voice interface component that enables voice interaction
 * with the application's AI systems including LLM, MCP, and Agent SDK.
 * 
 * Features:
 * - Voice recording with visual feedback
 * - Command transcription using Whisper
 * - Text-to-speech responses using OpenAI TTS or Sesame CSM
 * - Visual display of transcribed text and responses
 * - Manual text input option
 * - Error handling and status feedback
 * 
 * This component displays as a card with recording controls, text display,
 * and response areas.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <VoiceAgent />
 * 
 * // With custom settings
 * <VoiceAgent 
 *   voiceSettings={{
 *     ...defaultVoiceSettings,
 *     autoTranscribe: true,
 *     autoReadResponses: true,
 *     ttsModel: 'openai_tts'
 *   }}
 *   initialContext={{
 *     currentPage: 'dashboard',
 *     userId: '123'
 *   }}
 *   onCommandProcessed={(result) => {
 *     logger.log('Processed command:', result);
 *   }}
 * />
 * ```
 */
export default function VoiceAgent({
  voiceSettings = defaultVoiceSettings,
  initialContext = {},
  onCommandProcessed,
  className = ''
}: VoiceAgentProps) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // Transcription state
  const [transcribedText, setTranscribedText] = useState('');
  const [_isTranscribing, _setIsTranscribing] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  
  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Context state
  const [context, _setContext] = useState<AgentContext>(initialContext);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Reset timer when recording stops
  useEffect(() => {
    if (!isRecording && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isRecording]);
  
  /**
   * Starts audio recording from the microphone
   */
  const handleStartRecording = async () => {
    try {
      setError(null);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording
      const { mediaRecorder: recorder, stream } = await startRecording();
      setMediaRecorder(recorder);
      setMediaStream(stream);
      
      // Set up timer to track recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError(`Microphone access error: ${err instanceof Error ? err.message : String(err)}`);
      setIsRecording(false);
    }
  };
  
  /**
   * Stops audio recording and processes the result
   */
  const handleStopRecording = async () => {
    if (!mediaRecorder || !mediaStream) {
      setIsRecording(false);
      return;
    }
    
    try {
      setIsRecording(false);
      
      // Stop recording and get audio blob
      const blob = await stopRecording(mediaRecorder, mediaStream);
      setAudioBlob(blob);
      
      // Auto-transcribe if enabled
      if (voiceSettings.autoTranscribe) {
        await handleProcessVoiceCommand(blob);
      }
    } catch (err) {
      setError(`Recording error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  /**
   * Processes a voice command using the agent system
   */
  const handleProcessVoiceCommand = async (blob?: Blob) => {
    const audioToProcess = blob || audioBlob;
    
    if (!audioToProcess) {
      setError('No audio recording available');
      return;
    }
    
    try {
      setError(null);
      setIsProcessing(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', audioToProcess);
      formData.append('context', JSON.stringify(context));
      formData.append('settings', JSON.stringify(voiceSettings));
      
      // Send to the API
      const response = await fetch('/api/voice/process-command', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process voice command');
      }
      
      // Parse the response
      const result: VoiceCommandResult = await response.json();
      
      // Update state with the results
      setTranscribedText(result.command || '');
      setResponse(result.response || null);
      setLastAction(result.action || null);
      
      // Call the callback if provided
      if (onCommandProcessed) {
        onCommandProcessed(result);
      }
      
      // Speak the response if auto-read is enabled
      if (voiceSettings.autoReadResponses && result.response) {
        handleSpeakResponse(result.response);
      }
      
      // Handle special actions
      handleSpecialAction(result.action);
      
    } catch (err) {
      setError(`Processing error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Processes text input as a command
   */
  const handleSendText = async () => {
    if (!transcribedText.trim()) {
      return;
    }
    
    try {
      setError(null);
      setIsProcessing(true);
      
      // Create request data for text-based processing
      const requestData = {
        command: transcribedText,
        context: context,
        settings: voiceSettings
      };
      
      // Call API to process the text command
      const response = await fetch('/api/voice/process-text-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process text command');
      }
      
      // Parse the response
      const result: VoiceCommandResult = await response.json();
      
      // Update state with the results
      setResponse(result.response || null);
      setLastAction(result.action || null);
      
      // Call the callback if provided
      if (onCommandProcessed) {
        onCommandProcessed(result);
      }
      
      // Speak the response if auto-read is enabled
      if (voiceSettings.autoReadResponses && result.response) {
        handleSpeakResponse(result.response);
      }
      
      // Handle special actions
      handleSpecialAction(result.action);
      
    } catch (err) {
      setError(`Processing error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Speaks the provided text using text-to-speech
   */
  const handleSpeakResponse = async (text: string) => {
    if (isSpeaking || !text) return;
    
    try {
      setIsSpeaking(true);
      
      // Convert text to speech
      const speechBlob = await textToSpeech(text, voiceSettings);
      
      // Play the audio
      await playAudio(speechBlob);
    } catch (err) {
      logger.error('Speech error:', err);
    } finally {
      setIsSpeaking(false);
    }
  };
  
  /**
   * Handles special actions from the voice command result
import logger from '../lib/logger';

   */
  const handleSpecialAction = (action: string | undefined) => {
    if (!action) return;
    
    switch (action) {
      case 'take_screenshot':
        // Trigger screenshot capture - could dispatch an event
        logger.log('Screenshot action received');
        break;
        
      case 'stop_recording':
        // Already handled by stopping recording
        break;
        
      case 'cancel':
        // Reset state
        setTranscribedText('');
        setResponse(null);
        setLastAction(null);
        break;
        
      default:
        // Handle other actions if needed
        break;
    }
  };
  
  /**
   * Formats recording time as MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Voice Agent</span>
          {lastAction && (
            <Badge variant="outline" className="ml-2 text-xs">
              {lastAction.replace('_', ' ')}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Voice interface using {voiceSettings.sttModel === 'whisper' ? 'OpenAI Whisper' : 'Sesame CSM'} and {voiceSettings.ttsModel === 'openai_tts' ? 'OpenAI TTS' : 'Sesame CSM'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Recording controls */}
        <div className="flex items-center justify-between">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className="flex items-center gap-2"
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4" />
                Stop Recording ({formatTime(recordingTime)})
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>
          
          {response && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSpeakResponse(response)}
              disabled={isSpeaking}
            >
              {isSpeaking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Transcribed text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Your voice input:
            </div>
            {isProcessing && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Processing...
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Textarea
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder="Voice input will appear here..."
              className="resize-none min-h-[80px]"
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="self-end"
              onClick={handleSendText}
              disabled={isProcessing || !transcribedText.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Response */}
        {response && (
          <div className="bg-muted p-3 rounded-md">
            <div className="text-sm font-medium mb-1">Response:</div>
            <div className="text-sm whitespace-pre-wrap">{response}</div>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground flex justify-between">
        <div>
          TTS: {voiceSettings.ttsModel === 'sesame_csm' ? 'Sesame CSM' : 'OpenAI TTS'}
        </div>
        <div>
          STT: {voiceSettings.sttModel === 'whisper' ? 'OpenAI Whisper' : 'Other'}
        </div>
      </CardFooter>
    </Card>
  );
} 