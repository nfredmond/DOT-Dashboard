"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Lightbulb, 
  Loader2,
  BarChart,
  Users,
  AlertTriangle,
  Globe,
  Laptop
} from 'lucide-react';
import { useLLM } from '@/contexts/LLMContext';
import { LLMResponse } from '@/components/LLMResponse';
import { LLMResponse as LLMResponseType } from '@/lib/llm/llmService';
import { AgentType } from '@/lib/agents-service';

// Import the MappingProject type from the parent component
import type { MappingProject } from '../page';

interface ProjectMapLLMIntegrationProps {
  selectedProject: MappingProject | null;
  onUpdateProject?: (updatedProject: MappingProject) => void;
}

export function ProjectMapLLMIntegration({ selectedProject, onUpdateProject }: ProjectMapLLMIntegrationProps) {
  const [query, setQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<LLMResponseType | null>(null);
  const [analysisType, setAnalysisType] = useState<'general' | 'safety' | 'equity'>('general');
  const [agentMode, setAgentMode] = useState<'standard' | 'agent'>('standard');
  const [agentType, setAgentType] = useState<AgentType>(AgentType.ANALYSIS);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  
  const { 
    isLoading, 
    sendEnhancedProjectAnalysisQuery, 
    sendSafetyAnalysisQuery,
    sendEquityAnalysisQuery,
    sendQuery,
    sendAgentQuery,
    sendStreamedAgentQuery
  } = useLLM();

  // Function to handle project analysis with LLM
  const analyzeProject = async () => {
    if (!selectedProject) return;
    
    try {
      let result: LLMResponseType;
      
      if (agentMode === 'agent') {
        // Use the agent for analysis
        const analysisPrompt = `Please analyze the following transportation project:
          Name: ${selectedProject.name}
          Description: ${selectedProject.description || 'No description provided'}
          Category: ${selectedProject.category || 'Unknown category'}
          Location: ${selectedProject.location || 'Unknown location'}
          Budget: ${selectedProject.allocatedBudget?.toString() || 'Unknown'}
          Status: ${selectedProject.status || 'Unknown status'}
          
          ${agentType === AgentType.BROWSER ? 'Please search for relevant information online to enhance your analysis.' : ''}
          ${agentType === AgentType.COMPUTER ? 'Please search for relevant files or documentation that might help with analysis.' : ''}
          
          Provide a comprehensive analysis including strengths, weaknesses, environmental considerations, 
          equity implications, economic impact, and implementation recommendations.`;
        
        if (isStreaming) {
          setStreamingText('');
          result = await sendStreamedAgentQuery(
            analysisPrompt,
            agentType,
            selectedProject,
            (event) => {
              if (event.delta && typeof event.delta === 'string') {
                setStreamingText(prev => prev + event.delta);
              }
            }
          );
        } else {
          result = await sendAgentQuery(analysisPrompt, agentType, selectedProject);
        }
      } else {
        // Use standard LLM analysis
        switch (analysisType) {
          case 'safety':
            result = await sendSafetyAnalysisQuery({
              id: selectedProject.id,
              name: selectedProject.name,
              description: selectedProject.description,
              category: selectedProject.category,
              location: selectedProject.location,
              county: extractCountyFromLocation(selectedProject.location),
            });
            break;
            
          case 'equity':
            result = await sendEquityAnalysisQuery({
              id: selectedProject.id,
              name: selectedProject.name,
              description: selectedProject.description,
              category: selectedProject.category,
              location: selectedProject.location,
              county: extractCountyFromLocation(selectedProject.location),
            });
            break;
            
          case 'general':
          default:
            result = await sendEnhancedProjectAnalysisQuery({
              id: selectedProject.id,
              name: selectedProject.name,
              description: selectedProject.description,
              category: selectedProject.category,
              location: selectedProject.location,
              budget: selectedProject.allocatedBudget,
              status: selectedProject.status,
              startDate: selectedProject.startDate,
              endDate: selectedProject.endDate,
            });
            break;
        }
      }
      
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error analyzing project:", error);
    }
  };

  // Generate custom query about the project
  const handleCustomQuery = async () => {
    if (!selectedProject || !query) return;
    
    try {
      let result: LLMResponseType;
      
      if (agentMode === 'agent') {
        // Use the agent for custom queries
        if (isStreaming) {
          setStreamingText('');
          result = await sendStreamedAgentQuery(
            query,
            agentType,
            selectedProject,
            (event) => {
              if (event.delta && typeof event.delta === 'string') {
                setStreamingText(prev => prev + event.delta);
              }
            }
          );
        } else {
          result = await sendAgentQuery(query, agentType, selectedProject);
        }
      } else {
        // Use standard LLM for custom queries
        result = await sendQuery({
          query,
          project_id: selectedProject.id,
          project_location: selectedProject.location,
          project_county: extractCountyFromLocation(selectedProject.location),
          context: JSON.stringify(selectedProject),
        });
      }
      
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error processing query:", error);
    }
  };

  // Reset the analysis results
  const handleReset = () => {
    setAnalysisResult(null);
    setQuery('');
    setStreamingText('');
  };
  
  // Utility function to extract county from location string
  const extractCountyFromLocation = (location: string): string | undefined => {
    if (!location) return undefined;
    
    // Try to extract county from "City, County County" format
    const countyMatch = location.match(/,\s*([^,]+)\s+County/i);
    if (countyMatch && countyMatch[1]) {
      return countyMatch[1].trim();
    }
    
    // For California locations, hard-code some common cities to counties
    // In a real app, this would use a comprehensive lookup or geocoding
    const caCountyMap: Record<string, string> = {
      'San Francisco': 'San Francisco',
      'Los Angeles': 'Los Angeles',
      'San Diego': 'San Diego',
      'Sacramento': 'Sacramento',
      'San Jose': 'Santa Clara',
      'Oakland': 'Alameda',
      'Santa Barbara': 'Santa Barbara',
    };
    
    // Check if any city name from our map is in the location
    for (const [city, county] of Object.entries(caCountyMap)) {
      if (location.includes(city)) {
        return county;
      }
    }
    
    return undefined;
  };

  if (!selectedProject) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">Select a project on the map to analyze with LLM</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
          AI Project Analysis
        </CardTitle>
        <CardDescription>
          Get AI-powered insights for {selectedProject.name}
        </CardDescription>
      </CardHeader>
      
      {!analysisResult ? (
        <>
          <CardContent className="space-y-4">
            <Tabs defaultValue="standard" value={agentMode} onValueChange={(v) => setAgentMode(v as 'standard' | 'agent')}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="standard">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Standard LLM
                </TabsTrigger>
                <TabsTrigger value="agent">
                  <Laptop className="h-4 w-4 mr-2" />
                  AI Agent
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="standard">
                <Tabs defaultValue="general" value={analysisType} onValueChange={(v) => setAnalysisType(v as any)}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="general">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      General
                    </TabsTrigger>
                    <TabsTrigger value="safety">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Safety
                    </TabsTrigger>
                    <TabsTrigger value="equity">
                      <Users className="h-4 w-4 mr-2" />
                      Equity
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general">
                    <div className="text-sm text-muted-foreground mb-4">
                      General analysis includes project strengths, weaknesses, environmental impacts, and implementation recommendations.
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="safety">
                    <div className="text-sm text-muted-foreground mb-4">
                      Safety analysis uses SWITRS collision data to provide insights on safety conditions and recommendations.
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="equity">
                    <div className="text-sm text-muted-foreground mb-4">
                      Equity analysis uses Census demographic data to evaluate potential impacts on different community groups.
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              <TabsContent value="agent">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    AI Agents can use advanced capabilities like web searches and file operations to provide more comprehensive analysis.
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Agent capabilities:</p>
                    <Tabs defaultValue={AgentType.ANALYSIS} value={agentType} onValueChange={(v) => setAgentType(v as AgentType)}>
                      <TabsList className="grid grid-cols-3 mb-4">
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
                      
                      <TabsContent value={AgentType.ANALYSIS}>
                        <div className="text-sm text-muted-foreground mb-4">
                          Analysis agent provides detailed transportation project insights with infrastructure planning expertise.
                        </div>
                      </TabsContent>
                      
                      <TabsContent value={AgentType.COMPUTER}>
                        <div className="text-sm text-muted-foreground mb-4">
                          Computer agent can search and access files to provide context-aware planning recommendations.
                        </div>
                      </TabsContent>
                      
                      <TabsContent value={AgentType.BROWSER}>
                        <div className="text-sm text-muted-foreground mb-4">
                          Browser agent can search the web for transportation regulations, case studies, and best practices.
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="streaming"
                        checked={isStreaming}
                        onChange={(e) => setIsStreaming(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="streaming" className="text-sm font-medium">
                        Enable streaming responses (see results in real-time)
                      </label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <Button 
              onClick={analyzeProject} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isStreaming ? 'Processing...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  {agentMode === 'standard' ? (
                    <>
                      {analysisType === 'general' && <Lightbulb className="mr-2 h-4 w-4" />}
                      {analysisType === 'safety' && <AlertTriangle className="mr-2 h-4 w-4" />}
                      {analysisType === 'equity' && <Users className="mr-2 h-4 w-4" />}
                      Analyze {analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Aspects
                    </>
                  ) : (
                    <>
                      {agentType === AgentType.ANALYSIS && <Lightbulb className="mr-2 h-4 w-4" />}
                      {agentType === AgentType.COMPUTER && <Laptop className="mr-2 h-4 w-4" />}
                      {agentType === AgentType.BROWSER && <Globe className="mr-2 h-4 w-4" />}
                      Analyze with {agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent
                    </>
                  )}
                </>
              )}
            </Button>
            
            <div className="space-y-2 pt-4">
              <p className="text-sm font-medium">Or ask a specific question:</p>
              <Textarea 
                placeholder="Ask a specific question about this project..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[80px]"
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleCustomQuery}
                disabled={isLoading || !query}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Submit Query
                  </>
                )}
              </Button>
            </div>
            
            {isStreaming && streamingText && (
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <p className="text-sm font-medium mb-2">Live Response:</p>
                <div className="text-sm whitespace-pre-wrap">{streamingText}</div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="text-xs text-muted-foreground">
            <p>
              {agentMode === 'standard' 
                ? 'Analysis includes real-time data from Census and SWITRS (traffic safety) APIs where available.' 
                : 'Agent analysis can include web search results, file references, and enhanced data analysis capabilities.'}
            </p>
          </CardFooter>
        </>
      ) : (
        <CardContent>
          <LLMResponse 
            content={analysisResult.response}
            feedbackId={analysisResult.feedback_id}
            onReset={handleReset}
          />
        </CardContent>
      )}
    </Card>
  );
}
