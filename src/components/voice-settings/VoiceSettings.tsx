'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { VoiceSettings as VoiceSettingsType, defaultVoiceSettings } from '@/lib/voice-service';
import { Volume2, Mic, Cog, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Props for the VoiceSettings component
 */
interface VoiceSettingsProps {
  /** Current voice settings */
  settings: VoiceSettingsType;
  
  /** Called when settings are changed */
  onChange: (settings: VoiceSettingsType) => void;
  
  /** Show a reset button to restore defaults */
  showReset?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * OpenAI TTS voices available in the application
 */
const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Versatile neutral voice' },
  { id: 'echo', name: 'Echo', description: 'Senior female voice' },
  { id: 'fable', name: 'Fable', description: 'Male voice with a soft British accent' },
  { id: 'onyx', name: 'Onyx', description: 'Deep male voice' },
  { id: 'nova', name: 'Nova', description: 'Female voice with a warm tone' },
  { id: 'shimmer', name: 'Shimmer', description: 'Young woman with a clear accent' }
];

/**
 * VoiceSettings Component
 * 
 * Provides a user interface for configuring voice-related settings
 * such as text-to-speech model selection, speech-to-text options,
 * and various voice behavior preferences.
 * 
 * Features:
 * - Selection of TTS model provider (OpenAI, Sesame CSM, ElevenLabs)
 * - Voice selection for text-to-speech
 * - Speech rate/speed adjustment
 * - Auto-transcription and auto-response toggles
 * - Speech-to-text model selection
 * - Theme selection for voice components
 * 
 * Settings are organized in tabs for better usability.
 * 
 * @example
 * ```tsx
 * // Basic usage with controlled state
 * const [settings, setSettings] = useState(defaultVoiceSettings);
 * 
 * <VoiceSettings 
 *   settings={settings}
 *   onChange={setSettings}
 * />
 * 
 * // With reset button
 * <VoiceSettings 
 *   settings={settings}
 *   onChange={setSettings}
 *   showReset={true}
 * />
 * ```
 */
export default function VoiceSettings({
  settings,
  onChange,
  showReset = true,
  className = ''
}: VoiceSettingsProps) {
  // Local state for settings
  const [localSettings, setLocalSettings] = useState<VoiceSettingsType>(settings);
  
  // Update local state when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  /**
   * Updates a single setting and propagates the change
   */
  const updateSetting = <K extends keyof VoiceSettingsType>(
    key: K, 
    value: VoiceSettingsType[K]
  ) => {
    const newSettings = {
      ...localSettings,
      [key]: value
    };
    
    setLocalSettings(newSettings);
    onChange(newSettings);
  };
  
  /**
   * Reset all settings to defaults
   */
  const handleResetSettings = () => {
    setLocalSettings(defaultVoiceSettings);
    onChange(defaultVoiceSettings);
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Cog className="h-5 w-5 mr-2" />
          Voice Settings
        </CardTitle>
        <CardDescription>
          Configure text-to-speech and speech-to-text options
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="tts">
          <TabsList className="mb-4">
            <TabsTrigger value="tts">Text to Speech</TabsTrigger>
            <TabsTrigger value="stt">Speech to Text</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
          </TabsList>
          
          {/* Text to Speech Settings */}
          <TabsContent value="tts" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tts-model">TTS Model</Label>
                <Select
                  value={localSettings.ttsModel}
                  onValueChange={(value) => updateSetting('ttsModel', value as any)}
                >
                  <SelectTrigger id="tts-model">
                    <SelectValue placeholder="Select TTS model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI TTS</SelectItem>
                    <SelectItem value="sesame-csm">Sesame CSM</SelectItem>
                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tts-voice">Voice</Label>
                <Select
                  value={localSettings.ttsVoice}
                  onValueChange={(value) => updateSetting('ttsVoice', value)}
                >
                  <SelectTrigger id="tts-voice">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPENAI_VOICES.map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="tts-speed">Speech Rate: {localSettings.ttsSpeed.toFixed(1)}x</Label>
                </div>
                <Slider
                  id="tts-speed"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[localSettings.ttsSpeed]}
                  onValueChange={(values) => updateSetting('ttsSpeed', values[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slower</span>
                  <span>Default</span>
                  <span>Faster</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Speech to Text Settings */}
          <TabsContent value="stt" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stt-model">Speech Recognition Model</Label>
                <Select
                  value={localSettings.sttModel}
                  onValueChange={(value) => updateSetting('sttModel', value as any)}
                >
                  <SelectTrigger id="stt-model">
                    <SelectValue placeholder="Select STT model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whisper">OpenAI Whisper</SelectItem>
                    <SelectItem value="deepgram">Deepgram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {localSettings.sttModel === 'whisper' && (
                <div className="space-y-2">
                  <Label htmlFor="whisper-model">Whisper Model</Label>
                  <Select
                    value={localSettings.whisperModel}
                    onValueChange={(value) => updateSetting('whisperModel', value)}
                  >
                    <SelectTrigger id="whisper-model">
                      <SelectValue placeholder="Select Whisper model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whisper-1">Whisper-1 (Default)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Behavior Settings */}
          <TabsContent value="behavior" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-transcribe">Auto-Transcribe</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically transcribe speech after recording
                  </p>
                </div>
                <Switch
                  id="auto-transcribe"
                  checked={localSettings.autoTranscribe}
                  onCheckedChange={(checked) => updateSetting('autoTranscribe', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-response">Auto-Response</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically speak responses aloud
                  </p>
                </div>
                <Switch
                  id="auto-response"
                  checked={localSettings.autoResponse}
                  onCheckedChange={(checked) => updateSetting('autoResponse', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-transcription">Show Transcription</Label>
                  <p className="text-sm text-muted-foreground">
                    Display transcribed text on screen
                  </p>
                </div>
                <Switch
                  id="show-transcription"
                  checked={localSettings.showTranscription}
                  onCheckedChange={(checked) => updateSetting('showTranscription', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme">UI Theme</Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(value) => updateSetting('theme', value as any)}
                >
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System (Default)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {showReset && (
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground flex gap-1 items-center">
            <Volume2 className="h-4 w-4" />
            <Mic className="h-4 w-4" />
            Voice settings control text-to-speech and speech-to-text behavior
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1"
            onClick={handleResetSettings}
          >
            <RotateCcw className="h-3 w-3" />
            Reset to Defaults
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 