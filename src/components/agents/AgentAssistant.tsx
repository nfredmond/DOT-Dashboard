'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import {
  Search,
  Monitor,
  BarChart3,
  Code,
  Loader2,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

interface AgentResult {
  success: boolean;
  result?: any;
  error?: string;
  metadata?: {
    duration: number;
    tools_used?: string[];
  };
}

export function AgentAssistant({ projectId }: { projectId?: string }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('research');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AgentResult[]>([]);
  
  // Research state
  const [researchTopic, setResearchTopic] = useState('');
  
  // Computer use state
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [computerContext, setComputerContext] = useState('');
  
  // Data analysis state
  const [analysisData, setAnalysisData] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  
  // Code generation state
  const [codeRequirements, setCodeRequirements] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  
  const executeAgentTask = async (taskType: string, action: string, data: any) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType,
          action,
          data,
          projectId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Agent task failed');
      }
      
      setResults([result, ...results]);
      
      toast({
        title: 'Task Completed',
        description: `${taskType} task completed in ${result.metadata?.duration}ms`,
      });
      
      return result;
    } catch (error) {
      // Agent task error
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute agent task',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResearch = () => {
    if (!researchTopic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a research topic',
        variant: 'destructive'
      });
      return;
    }
    
    executeAgentTask('research', 'deep_research', { topic: researchTopic });
  };
  
  const handleScreenshotAnalysis = () => {
    if (!screenshotUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a screenshot URL',
        variant: 'destructive'
      });
      return;
    }
    
    executeAgentTask('computer_use', 'analyze_screenshot', {
      imageUrl: screenshotUrl,
      context: computerContext
    });
  };
  
  const handleDataAnalysis = () => {
    if (!analysisData.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide data for analysis',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const dataset = JSON.parse(analysisData);
      executeAgentTask('data_analysis', 'analyze_transportation_data', {
        dataset,
        analysisType
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid JSON data format',
        variant: 'destructive'
      });
    }
  };
  
  const handleCodeGeneration = () => {
    if (!codeRequirements.trim()) {
      toast({
        title: 'Error',
        description: 'Please describe the code requirements',
        variant: 'destructive'
      });
      return;
    }
    
    executeAgentTask('code_generation', 'generate_planning_code', {
      requirements: codeRequirements,
      language: codeLanguage
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Agent Assistant
          </CardTitle>
          <CardDescription>
            Use advanced AI agents for research, analysis, and automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="research">
                <Search className="h-4 w-4 mr-2" />
                Research
              </TabsTrigger>
              <TabsTrigger value="computer">
                <Monitor className="h-4 w-4 mr-2" />
                Computer Use
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <BarChart3 className="h-4 w-4 mr-2" />
                Data Analysis
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="h-4 w-4 mr-2" />
                Code Gen
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="research" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Research Topic</label>
                <Textarea
                  placeholder="Enter a transportation planning topic to research..."
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  The AI will search for best practices, case studies, regulations, and provide comprehensive analysis
                </p>
              </div>
              
              <Button onClick={handleResearch} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Start Deep Research
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="computer" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Screenshot URL</label>
                <Input
                  placeholder="https://example.com/screenshot.png"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Context (optional)</label>
                <Textarea
                  placeholder="Provide additional context about what to analyze..."
                  value={computerContext}
                  onChange={(e) => setComputerContext(e.target.value)}
                  rows={2}
                />
              </div>
              
              <Button onClick={handleScreenshotAnalysis} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4 mr-2" />
                    Analyze Screenshot
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="analysis" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Analysis Type</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value)}
                >
                  <option value="general">General Analysis</option>
                  <option value="traffic">Traffic Pattern Analysis</option>
                  <option value="safety">Safety Analysis</option>
                  <option value="environmental">Environmental Impact</option>
                  <option value="economic">Economic Analysis</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Data (JSON format)</label>
                <Textarea
                  placeholder='{"traffic_counts": [100, 150, 200], "locations": ["Main St", "2nd Ave", "Park Blvd"]}'
                  value={analysisData}
                  onChange={(e) => setAnalysisData(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              
              <Button onClick={handleDataAnalysis} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze Data
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Code Requirements</label>
                <Textarea
                  placeholder="Describe the transportation planning feature you need code for..."
                  value={codeRequirements}
                  onChange={(e) => setCodeRequirements(e.target.value)}
                  rows={4}
                />
              </div>
              
              <Button onClick={handleCodeGeneration} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Recent agent task results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {result.metadata?.duration}ms
                      </div>
                    </div>
                    
                    {result.metadata?.tools_used && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Tools:</span>
                        {result.metadata.tools_used.map((tool) => (
                          <Badge key={tool} variant="secondary" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 