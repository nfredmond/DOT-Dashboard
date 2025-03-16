"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Loader2, TerminalSquare, Bot, BrainCircuit, ChevronRight, Navigation, Search, HelpCircle, Terminal } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentType } from '@/lib/agents-service';
import { VoiceCommandType } from '@/lib/voice-agent-service';

interface VoiceInputOutputProps {
  className?: string;
  onTranscriptSubmit?: (transcript: string) => void;
  placeholder?: string;
  showResponseTab?: boolean;
}

export function VoiceInputOutput({
  className,
  onTranscriptSubmit,
  placeholder = "Voice input will appear here...",
  showResponseTab = true
}: VoiceInputOutputProps) {
  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    clearTranscript,
    speak,
    stopSpeaking,
    isSpeaking,
    voiceEnabled,
    processVoiceCommand,
    isProcessingVoiceCommand,
    lastVoiceResponse,
    voiceSettings,
    updateVoiceSettings,
    lastCommandType,
    suggestedActions,
    executeSuggestedAction
  } = useVoice();

  const [displayTranscript, setDisplayTranscript] = useState('');
  const [activeTab, setActiveTab] = useState<string>("input");
  
  // Update display transcript when transcript changes
  useEffect(() => {
    setDisplayTranscript(transcript);
  }, [transcript]);
  
  // Switch to response tab when we get a new response
  useEffect(() => {
    if (lastVoiceResponse && showResponseTab) {
      setActiveTab("response");
    }
  }, [lastVoiceResponse, showResponseTab]);

  const handleSubmitTranscript = async () => {
    if (transcript.trim()) {
      // Process with the built-in voice command processor
      await processVoiceCommand(transcript);
      
      // Also call the custom handler if provided
      if (onTranscriptSubmit) {
        onTranscriptSubmit(transcript);
      }
    }
  };
  
  const toggleAgentType = () => {
    const types = Object.values(AgentType);
    const currentIndex = types.indexOf(voiceSettings.preferredAgentType);
    const nextIndex = (currentIndex + 1) % types.length;
    updateVoiceSettings({ preferredAgentType: types[nextIndex] });
  };
  
  const getAgentTypeIcon = () => {
    switch (voiceSettings.preferredAgentType) {
      case AgentType.ANALYSIS:
        return <BrainCircuit size={16} />;
      case AgentType.PLANNING:
        return <Bot size={16} />;
      case AgentType.BROWSER:
        return <TerminalSquare size={16} />;
      case AgentType.COMPUTER:
        return <TerminalSquare size={16} />;
      default:
        return <Bot size={16} />;
    }
  };

  // Get a suitable icon for a specific command type
  const getCommandTypeIcon = (type: VoiceCommandType | null) => {
    if (!type) return null;
    
    switch (type) {
      case VoiceCommandType.NAVIGATION:
        return <Navigation size={16} />;
      case VoiceCommandType.ACTION:
        return <TerminalSquare size={16} />;
      case VoiceCommandType.PROJECT_SEARCH:
        return <Search size={16} />;
      case VoiceCommandType.PROJECT_CREATE:
      case VoiceCommandType.PROJECT_UPDATE:
        return <Bot size={16} />;
      case VoiceCommandType.QUESTION:
        return <HelpCircle size={16} />;
      case VoiceCommandType.TOOL_INVOKE:
        return <Terminal size={16} />;
      default:
        return null;
    }
  };

  if (!voiceEnabled) {
    return null;
  }

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Voice Assistant</h3>
              {isProcessingVoiceCommand && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 animate-pulse">
                  Processing...
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-8 w-8",
                        voiceSettings.useMCP ? "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800" : ""
                      )}
                      onClick={() => updateVoiceSettings({ useMCP: !voiceSettings.useMCP })}
                    >
                      <TerminalSquare size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {voiceSettings.useMCP ? "Using MCP Agent (click to toggle)" : "Using standard LLM (click to toggle)"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {voiceSettings.useMCP && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleAgentType}
                      >
                        {getAgentTypeIcon()}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {`Agent type: ${voiceSettings.preferredAgentType} (click to change)`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-8 w-8",
                        isListening ? "bg-red-100 text-red-600 border-red-300 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800" : ""
                      )}
                      onClick={isListening ? stopListening : startListening}
                      disabled={isProcessingVoiceCommand}
                    >
                      {isProcessingVoiceCommand ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isListening ? (
                        <MicOff size={16} />
                      ) : (
                        <Mic size={16} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isListening ? "Stop listening" : "Start listening"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {(displayTranscript || lastVoiceResponse) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          isSpeaking ? "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800" : ""
                        )}
                        onClick={isSpeaking ? stopSpeaking : () => speak(activeTab === "input" ? displayTranscript : (lastVoiceResponse || ""))}
                      >
                        {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isSpeaking ? "Stop speaking" : "Read text aloud"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          {showResponseTab && (lastVoiceResponse || displayTranscript) ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger value="input">Input</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>
              
              <TabsContent value="input" className="m-0">
                <div className="relative">
                  <div 
                    className={cn(
                      "min-h-[100px] max-h-[200px] p-3 border rounded bg-muted/30 text-sm relative resize-none overflow-auto",
                      displayTranscript ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {displayTranscript || placeholder}
                  </div>
                  
                  {displayTranscript && (
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={clearTranscript}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={handleSubmitTranscript}
                        disabled={isProcessingVoiceCommand}
                      >
                        {isProcessingVoiceCommand ? (
                          <>
                            <Loader2 size={12} className="mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : "Submit"}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="response" className="m-0">
                <div className="space-y-3">
                  <div 
                    className={cn(
                      "min-h-[100px] max-h-[200px] p-3 border rounded bg-muted/30 text-sm overflow-auto",
                      lastVoiceResponse ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {lastVoiceResponse || "No response yet"}
                  </div>
                  
                  {lastCommandType && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Command type:</span>
                      <Badge variant="outline" className="h-5 text-xs flex items-center gap-1">
                        {getCommandTypeIcon(lastCommandType)}
                        <span>{lastCommandType}</span>
                      </Badge>
                    </div>
                  )}
                  
                  {suggestedActions && suggestedActions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Suggested actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedActions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs flex items-center gap-1"
                            onClick={() => executeSuggestedAction(action)}
                          >
                            {action.type === 'navigate' && <Navigation size={12} />}
                            {action.type === 'search' && <Search size={12} />}
                            <span>{action.description}</span>
                            <ChevronRight size={12} />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="relative">
              <div 
                className={cn(
                  "min-h-[80px] p-2 border rounded bg-muted/40 text-sm relative resize-none overflow-auto",
                  displayTranscript ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {displayTranscript || placeholder}
              </div>
              
              {displayTranscript && (
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={clearTranscript}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleSubmitTranscript}
                    disabled={isProcessingVoiceCommand}
                  >
                    {isProcessingVoiceCommand ? (
                      <>
                        <Loader2 size={12} className="mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : "Submit"}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {voiceSettings.commandPrefix && (
            <p className="text-xs text-muted-foreground mt-1">
              Say "{voiceSettings.commandPrefix} [command]" to use voice commands
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 