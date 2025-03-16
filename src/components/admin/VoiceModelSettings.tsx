'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { VoiceSettings, defaultVoiceSettings, VoiceModelType, TranscriptionModelType } from '@/lib/voice-service';
import { useToast } from '@/components/ui/use-toast';
import { isSesameAvailable, getAvailableSpeakers } from '@/lib/sesame-service';

interface VoiceModelSettingsProps {
  initialSettings?: VoiceSettings;
  onSave?: (settings: VoiceSettings) => Promise<void>;
}

export default function VoiceModelSettings({ 
  initialSettings = defaultVoiceSettings,
  onSave
}: VoiceModelSettingsProps) {
  const [settings, setSettings] = useState<VoiceSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [sesameAvailable, setSesameAvailable] = useState(false);
  const [speakerIds, setSpeakerIds] = useState<number[]>([]);
  const { toast } = useToast();
  
  // Check if Sesame is available on component mount
  useEffect(() => {
    const checkSesame = async () => {
      try {
        // This would need to be a server request in production
        // as isSesameAvailable() is a server-side function
        const response = await fetch('/api/admin/check-sesame');
        const data = await response.json();
        
        setSesameAvailable(data.available);
        
        if (data.available) {
          setSpeakerIds(data.speakers || [0, 1, 2, 3, 4, 5, 6, 7]);
        }
      } catch (error) {
        console.error('Error checking Sesame availability:', error);
        setSesameAvailable(false);
      }
    };
    
    checkSesame();
  }, []);
  
  // Handle saving settings
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    
    try {
      await onSave(settings);
      
      toast({
        title: 'Settings saved',
        description: 'Voice model settings have been updated.',
      });
    } catch (error) {
      console.error('Error saving voice settings:', error);
      
      toast({
        title: 'Error saving settings',
        description: 'There was a problem saving your settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle TTS model change
  const handleTTSModelChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      ttsModel: value as VoiceModelType,
      // Reset voice to appropriate default for the selected model
      ttsVoice: value === 'sesame_csm' ? 'speaker_0' : 'alloy',
    }));
  };
  
  // Handle STT model change
  const handleSTTModelChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      sttModel: value as TranscriptionModelType,
      // Reset whisper model to default if needed
      whisperModel: value === 'whisper' ? 'whisper-1' : prev.whisperModel,
    }));
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Voice Model Settings</CardTitle>
        <CardDescription>
          Configure speech-to-text and text-to-speech models
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="tts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tts">Text-to-Speech</TabsTrigger>
            <TabsTrigger value="stt">Speech-to-Text</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tts" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tts-model">Text-to-Speech Model</Label>
                <Select
                  value={settings.ttsModel}
                  onValueChange={handleTTSModelChange}
                >
                  <SelectTrigger id="tts-model">
                    <SelectValue placeholder="Select TTS model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sesame_csm">
                      Sesame CSM (March 2025)
                      {!sesameAvailable && " - Not configured"}
                    </SelectItem>
                    <SelectItem value="openai_tts">
                      OpenAI TTS
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {settings.ttsModel === 'sesame_csm' && !sesameAvailable && (
                  <p className="text-amber-600 text-sm">
                    Sesame CSM is not configured. Check environment variables.
                  </p>
                )}
              </div>
              
              {/* Voice selection for the chosen model */}
              <div className="space-y-2">
                <Label htmlFor="tts-voice">Voice</Label>
                {settings.ttsModel === 'sesame_csm' ? (
                  <Select
                    value={settings.ttsVoice}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, ttsVoice: value }))}
                  >
                    <SelectTrigger id="tts-voice">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {speakerIds.map((id) => (
                        <SelectItem key={id} value={`speaker_${id}`}>
                          Speaker {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={settings.ttsVoice}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, ttsVoice: value }))}
                  >
                    <SelectTrigger id="tts-voice">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tts-speed">Speech Speed: {settings.ttsSpeed.toFixed(1)}</Label>
                </div>
                <Slider
                  id="tts-speed"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[settings.ttsSpeed]}
                  onValueChange={(value) => setSettings((prev) => ({ ...prev, ttsSpeed: value[0] }))}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="stt" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stt-model">Speech-to-Text Model</Label>
                <Select
                  value={settings.sttModel}
                  onValueChange={handleSTTModelChange}
                >
                  <SelectTrigger id="stt-model">
                    <SelectValue placeholder="Select STT model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whisper">OpenAI Whisper (Default)</SelectItem>
                    <SelectItem value="other" disabled>
                      Other models (Coming soon)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {settings.sttModel === 'whisper' && (
                <div className="space-y-2">
                  <Label htmlFor="whisper-model">Whisper Model</Label>
                  <Select
                    value={settings.whisperModel}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, whisperModel: value }))}
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
        </Tabs>
        
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">General Voice Settings</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-transcribe">Auto-Transcribe Voice Input</Label>
              <p className="text-muted-foreground text-sm">
                Automatically transcribe voice when recording stops
              </p>
            </div>
            <Switch
              id="auto-transcribe"
              checked={settings.autoTranscribe}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoTranscribe: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-read">Auto-Read Responses</Label>
              <p className="text-muted-foreground text-sm">
                Automatically read AI responses using text-to-speech
              </p>
            </div>
            <Switch
              id="auto-read"
              checked={settings.autoReadResponses}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoReadResponses: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="voice-commands">Enable Voice Commands</Label>
              <p className="text-muted-foreground text-sm">
                Process special voice commands like "take screenshot"
              </p>
            </div>
            <Switch
              id="voice-commands"
              checked={settings.enableVoiceCommands}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableVoiceCommands: checked }))}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setSettings(initialSettings)}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
} 