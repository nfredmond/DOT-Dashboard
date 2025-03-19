'use client';

import { useState, useEffect } from 'react';
import { VoiceSettings, defaultVoiceSettings } from '@/lib/voice-service';
import { useToast } from '@/components/ui/use-toast';
import VoiceModelSettings from '@/components/admin/VoiceModelSettings';

export default function VoiceSettingsClient() {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/voice-settings');
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        } else {
          // If failed to load, use defaults
          setSettings(defaultVoiceSettings);
          
          toast({
            title: 'Failed to load settings',
            description: 'Using default settings instead.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading voice settings:', error);
        setSettings(defaultVoiceSettings);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [toast]);
  
  // Save settings handler
  const handleSaveSettings = async (newSettings: VoiceSettings) => {
    try {
      const response = await fetch('/api/admin/voice-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: newSettings }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      // Update local state
      setSettings(newSettings);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving settings:', error);
      return Promise.reject(error);
    }
  };
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }
  
  return (
    <VoiceModelSettings 
      initialSettings={settings || defaultVoiceSettings}
      onSave={handleSaveSettings}
    />
  );
} 