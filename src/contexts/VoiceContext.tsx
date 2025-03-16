"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLLM, LLMProvider } from '@/contexts/LLMContext';
import { AgentType } from '@/lib/agents-service';
import { 
  processVoiceCommand as processVoiceAgentCommand, 
  VoiceCommandType, 
  VoiceCommandOptions 
} from '@/lib/voice-agent-service';
import { useRouter } from 'next/navigation';

interface VoiceContextType {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  clearTranscript: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  toggleVoiceEnabled: () => void;
  voiceSettings: VoiceSettings;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  processVoiceCommand: (transcript: string) => Promise<void>;
  isProcessingVoiceCommand: boolean;
  lastVoiceResponse: string | null;
  lastCommandType: VoiceCommandType | null;
  suggestedActions: Array<{type: string; description: string; data?: any}> | undefined;
  executeSuggestedAction: (action: {type: string; description: string; data?: any}) => void;
  currentPage: string;
}

export interface VoiceSettings {
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  preferredVoiceName: string | null;
  autoStart: boolean;
  autoListen: boolean;
  useMCP: boolean;  // Whether to use MCP for voice processing
  preferredAgentType: AgentType; // The preferred agent type for voice commands
  autoReadResponses: boolean; // Automatically read LLM responses
  commandPrefix: string; // Prefix for voice commands (e.g., "Computer")
  autoResponseActions: boolean; // Automatically respond to voice commands
}

const defaultVoiceSettings: VoiceSettings = {
  voiceRate: 1,
  voicePitch: 1,
  voiceVolume: 1,
  preferredVoiceName: null,
  autoStart: false,
  autoListen: false,
  useMCP: true,
  preferredAgentType: AgentType.ANALYSIS,
  autoReadResponses: true,
  commandPrefix: "assistant",
  autoResponseActions: true
};

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

function VoiceProviderContent({ children }: { children: ReactNode }) {
  const llm = useLLM();
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(defaultVoiceSettings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isProcessingVoiceCommand, setIsProcessingVoiceCommand] = useState(false);
  const [lastVoiceResponse, setLastVoiceResponse] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('');
  const [lastCommandType, setLastCommandType] = useState<VoiceCommandType | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<Array<{type: string; description: string; data?: any}> | undefined>(undefined);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        console.warn('Speech recognition not supported by this browser');
        return;
      }
      
      const recognitionInstance = new SpeechRecognitionAPI();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      
      recognitionInstance.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        
        // Auto-process commands if they include the command prefix
        if (voiceSettings.autoListen && voiceEnabled) {
          const lowerTranscript = currentTranscript.toLowerCase();
          const prefix = voiceSettings.commandPrefix.toLowerCase();
          
          if (lowerTranscript.startsWith(prefix)) {
            const command = currentTranscript.substring(prefix.length).trim();
            if (command) {
              processVoiceCommand(command);
              recognitionInstance.stop(); // Stop listening while processing
            }
          }
        }
      };
      
      recognitionInstance.onend = () => {
        if (isListening && !isProcessingVoiceCommand) {
          try {
            recognitionInstance.start();
          } catch (error) {
            console.error('Error restarting recognition:', error);
          }
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech recognition not supported by this browser');
    }
    
    // Load saved voice settings from localStorage
    const savedSettings = localStorage.getItem('voiceSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setVoiceSettings(parsedSettings);
        setVoiceEnabled(!!localStorage.getItem('voiceEnabled'));
      } catch (e) {
        console.error('Failed to parse saved voice settings', e);
      }
    }
    
    // Initialize voice synthesis
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      
      window.speechSynthesis.onvoiceschanged = updateVoices;
      updateVoices();
    } else {
      console.warn('Speech synthesis not supported by this browser');
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isListening, isProcessingVoiceCommand, voiceSettings.autoListen, voiceSettings.commandPrefix, voiceEnabled]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
    localStorage.setItem('voiceEnabled', voiceEnabled ? 'true' : '');
  }, [voiceSettings, voiceEnabled]);

  // Auto-start listening on page load if enabled
  useEffect(() => {
    if (voiceEnabled && voiceSettings.autoListen && recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error auto-starting recognition:', error);
      }
    }
  }, [voiceEnabled, voiceSettings.autoListen, recognition, isListening]);

  // Update current page based on URL for context-aware voice commands
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      let currentPageName = 'unknown';
      
      if (pathname === '/' || pathname === '/homepage') {
        currentPageName = 'dashboard';
      } else if (pathname.startsWith('/projects')) {
        currentPageName = 'projects';
      } else if (pathname.startsWith('/project-mapping')) {
        currentPageName = 'mapping';
      } else if (pathname.startsWith('/reports')) {
        currentPageName = 'reports';
      } else if (pathname.startsWith('/settings')) {
        currentPageName = 'settings';
      } else {
        // Extract the page name from the URL
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          currentPageName = segments[segments.length - 1];
        }
      }
      
      setCurrentPage(currentPageName);
    }
  }, [router]);

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice settings
      utterance.rate = voiceSettings.voiceRate;
      utterance.pitch = voiceSettings.voicePitch;
      utterance.volume = voiceSettings.voiceVolume;
      
      // Set preferred voice if available
      if (voiceSettings.preferredVoiceName) {
        const selectedVoice = availableVoices.find(
          voice => voice.name === voiceSettings.preferredVoiceName
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Restart listening after speech ends if it was previously active
        if (voiceEnabled && voiceSettings.autoListen && recognition && !isListening) {
          try {
            recognition.start();
            setIsListening(true);
          } catch (error) {
            console.error('Error restarting recognition after speech:', error);
          }
        }
      };
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleVoiceEnabled = () => {
    setVoiceEnabled(prev => !prev);
  };

  const updateVoiceSettings = (settings: Partial<VoiceSettings>) => {
    setVoiceSettings(prev => ({
      ...prev,
      ...settings
    }));
  };
  
  // Process voice command using the specialized voice agent service
  const processVoiceCommand = async (command: string) => {
    if (!command.trim() || isProcessingVoiceCommand) return;
    
    try {
      setIsProcessingVoiceCommand(true);
      stopListening();
      clearTranscript();
      
      // Extract current context info
      let projectId: string | undefined;
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        if (pathname.startsWith('/projects/')) {
          const segments = pathname.split('/').filter(Boolean);
          if (segments.length > 1) {
            projectId = segments[1];
          }
        }
      }
      
      // Configure options for voice processing
      const options: VoiceCommandOptions = {
        preferMCP: voiceSettings.useMCP,
        agentType: voiceSettings.preferredAgentType,
        currentPage,
        currentProjectId: projectId,
        userContext: {
          voiceEnabled: true,
          voiceSettings
        }
      };
      
      // Process with specialized voice agent service
      const result = await processVoiceAgentCommand(command, options);
      
      // Save the results
      setLastVoiceResponse(result.response);
      setLastCommandType(result.commandType);
      setSuggestedActions(result.suggestedActions);
      
      // Handle navigation actions automatically if voice navigation is enabled
      if (
        result.suggestedActions && 
        voiceSettings.autoResponseActions && 
        result.commandType === VoiceCommandType.NAVIGATION
      ) {
        const navAction = result.suggestedActions.find(action => action.type === 'navigate');
        if (navAction && navAction.data?.route) {
          router.push(navAction.data.route);
        }
      }
      
      // Auto-read response if enabled
      if (voiceSettings.autoReadResponses) {
        speak(result.response);
      }
      
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMessage = 'Sorry, I encountered an error processing your request. Please try again.';
      setLastVoiceResponse(errorMessage);
      
      if (voiceSettings.autoReadResponses) {
        speak(errorMessage);
      }
    } finally {
      setIsProcessingVoiceCommand(false);
      // Recognition will auto-restart after speech ends if autoListen is enabled
    }
  };
  
  // Execute a suggested action
  const executeSuggestedAction = (action: {type: string; description: string; data?: any}) => {
    if (action.type === 'navigate' && action.data?.route) {
      router.push(action.data.route);
    } else if (action.type === 'search' && action.data?.query) {
      // Implement search functionality based on your app
      console.log('Executing search:', action.data.query);
      
      // Example: Navigate to projects with search param
      router.push(`/projects?search=${encodeURIComponent(action.data.query)}`);
    }
  };

  return (
    <VoiceContext.Provider value={{
      isListening,
      startListening,
      stopListening,
      transcript,
      clearTranscript,
      speak,
      stopSpeaking,
      isSpeaking,
      voiceEnabled,
      toggleVoiceEnabled,
      voiceSettings,
      updateVoiceSettings,
      processVoiceCommand,
      isProcessingVoiceCommand,
      lastVoiceResponse,
      lastCommandType,
      suggestedActions,
      executeSuggestedAction,
      currentPage
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  return (
    <LLMProvider>
      <VoiceProviderContent>{children}</VoiceProviderContent>
    </LLMProvider>
  );
}

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}; 