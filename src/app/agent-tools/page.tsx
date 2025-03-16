"use client"

import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Globe, 
  Laptop, 
  Lightbulb, 
  Loader2, 
  FileText, 
  Search, 
  Zap
} from 'lucide-react';
import { useLLM } from '@/contexts/LLMContext';
import { AgentType } from '@/lib/agents-service';

export default function AgentToolsPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentType, setAgentType] = useState<AgentType>(AgentType.ANALYSIS);
  const [streamingOutput, setStreamingOutput] = useState('');
  const [completedOutput, setCompletedOutput] = useState('');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [eventHistory, setEventHistory] = useState<any[]>([]);
  
  const outputRef = useRef<HTMLDivElement>(null);
  const { sendAgentQuery, sendStreamedAgentQuery } = useLLM();
  
  // Scroll to bottom when streaming output updates
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamingOutput]);
  
  const handleQuerySubmit = async () => {
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    setStreamingOutput('');
    setCompletedOutput('');
    setEventHistory([]);
    
    try {
      if (streamingEnabled) {
        await sendStreamedAgentQuery(
          query,
          agentType,
          null,
          (event) => {
            if (event.delta && typeof event.delta === 'string') {
              setStreamingOutput(prev => prev + event.delta);
            }
            
            // Track interesting events for UI display
            if (
              event.type === 'tool_call' || 
              event.type === 'tool_result' || 
              event.type === 'handoff' || 
              event.type === 'final_answer'
            ) {
              setEventHistory(prev => [...prev, event]);
            }
          }
        );
      } else {
        const result = await sendAgentQuery(query, agentType);
        setCompletedOutput(result.response);
      }
    } catch (error) {
      console.error('Error running agent query:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCompletedOutput(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleQuerySubmit();
    }
  };
  
  const getIconForAgentType = (type: AgentType) => {
    switch (type) {
      case AgentType.ANALYSIS:
        return <Lightbulb className="h-5 w-5" />;
      case AgentType.COMPUTER:
        return <Laptop className="h-5 w-5" />;
      case AgentType.BROWSER:
        return <Globe className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };
  
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'tool_call':
        return <Search className="h-4 w-4 text-blue-500" />;
      case 'tool_result':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'handoff':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'final_answer':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  const formatEventDetails = (event: any) => {
    if (event.type === 'tool_call') {
      return `Called tool: ${event.tool_name || 'unknown'}`;
    } else if (event.type === 'tool_result') {
      return `Tool returned result`;
    } else if (event.type === 'handoff') {
      return `Handed off to: ${event.target_agent_name || 'another agent'}`;
    } else if (event.type === 'final_answer') {
      return `Final answer delivered`;
    }
    return JSON.stringify(event);
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">OpenAI Agents Integration</h1>
      <p className="text-muted-foreground mb-8">
        Explore the capabilities of OpenAI's Agents SDK with computer use and web browsing
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                {getIconForAgentType(agentType)}
                <span className="ml-2">
                  {agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent
                </span>
              </CardTitle>
              <CardDescription>
                {agentType === AgentType.ANALYSIS && 'Expert transportation planning analysis'}
                {agentType === AgentType.COMPUTER && 'Access and analyze local files and data'}
                {agentType === AgentType.BROWSER && 'Search the web for information to enhance analysis'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask the ${agentType} agent a question...`}
                  className="w-full min-h-[100px] p-4 border rounded-md bg-background"
                  disabled={isLoading}
                />
                <div className="absolute bottom-3 right-3 flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => setQuery('')}
                    variant="ghost"
                    disabled={!query || isLoading}
                  >
                    Clear
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleQuerySubmit}
                    disabled={!query.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>Submit</>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="streaming"
                  checked={streamingEnabled}
                  onChange={(e) => setStreamingEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="streaming" className="text-sm font-medium">
                  Enable streaming (see results in real-time)
                </label>
              </div>
              
              <div 
                ref={outputRef}
                className="border rounded-md p-4 h-[400px] overflow-y-auto bg-muted/30"
              >
                {isLoading || streamingOutput || completedOutput ? (
                  <div className="whitespace-pre-wrap">
                    {streamingEnabled ? streamingOutput : completedOutput}
                    {isLoading && streamingEnabled && (
                      <span className="inline-block ml-1 animate-pulse">▋</span>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Agent output will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>
                Select agent type and view execution details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue={AgentType.ANALYSIS} value={agentType} onValueChange={(v) => setAgentType(v as AgentType)}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value={AgentType.ANALYSIS}>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger value={AgentType.COMPUTER}>
                    <Laptop className="h-4 w-4 mr-2" />
                    Computer
                  </TabsTrigger>
                  <TabsTrigger value={AgentType.BROWSER}>
                    <Globe className="h-4 w-4 mr-2" />
                    Browser
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value={AgentType.ANALYSIS} className="mt-4">
                  <p className="text-sm">
                    The Analysis Agent provides expert transportation planning analysis
                    with a focus on environmental impacts, equity, economic factors, and safety.
                  </p>
                </TabsContent>
                
                <TabsContent value={AgentType.COMPUTER} className="mt-4">
                  <p className="text-sm">
                    The Computer Agent can search and access files on the system to analyze
                    planning documents, data sets, and related information.
                  </p>
                </TabsContent>
                
                <TabsContent value={AgentType.BROWSER} className="mt-4">
                  <p className="text-sm">
                    The Browser Agent can search the web for transportation planning best practices,
                    regulations, case studies, and other relevant information.
                  </p>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Execution Trace</h3>
                {eventHistory.length > 0 ? (
                  <div className="border rounded-md p-3 max-h-[280px] overflow-y-auto">
                    <ul className="space-y-2">
                      {eventHistory.map((event, index) => (
                        <li key={index} className="flex items-start text-xs">
                          <span className="mr-2 pt-0.5">
                            {getEventIcon(event.type)}
                          </span>
                          <div>
                            <p className="font-medium">
                              {event.type.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </p>
                            <p className="text-muted-foreground">
                              {formatEventDetails(event)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No events recorded yet. Run a query to see agent events.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 