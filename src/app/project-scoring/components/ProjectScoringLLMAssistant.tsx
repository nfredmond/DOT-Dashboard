"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Loader2, 
  BarChart,
  CheckCircle
} from 'lucide-react';
import { useLLM } from '@/contexts/LLMContext';
import { LLMResponse } from '@/components/LLMResponse';
import { LLMResponse as LLMResponseType } from '@/lib/llm/llmService';

interface ProjectScoringLLMAssistantProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectType: string;
  projectStatus: string;
  criterionName?: string;
  category?: string;
  currentScore?: number;
}

export function ProjectScoringLLMAssistant({ 
  projectId,
  projectName,
  projectDescription,
  projectType,
  projectStatus,
  criterionName,
  category,
  currentScore
}: ProjectScoringLLMAssistantProps) {
  const [query, setQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<LLMResponseType | null>(null);
  const { isLoading, sendScoreJustificationQuery, sendQuery } = useLLM();

  // Generate score justification
  const generateJustification = async () => {
    if (!projectId || !criterionName) return;
    
    try {
      const result = await sendScoreJustificationQuery({
        projectId,
        projectName,
        projectDescription,
        projectType,
        projectStatus,
        criterionName,
        category,
        score: currentScore || 0
      });
      
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error generating score justification:", error);
    }
  };

  // Submit custom query
  const handleCustomQuery = async () => {
    if (!projectId || !query) return;
    
    try {
      const result = await sendQuery({
        query,
        project_id: projectId,
        context: JSON.stringify({
          projectName,
          projectDescription,
          projectType,
          projectStatus,
          criterionName,
          category,
          currentScore
        }),
      });
      
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error processing query:", error);
    }
  };

  // Reset analysis results
  const handleReset = () => {
    setAnalysisResult(null);
    setQuery('');
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-blue-500" />
          AI Scoring Assistant
        </CardTitle>
        <CardDescription>
          {criterionName 
            ? `Get AI-powered insights for scoring ${projectName} on ${criterionName}`
            : `Get AI-powered insights for scoring ${projectName}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysisResult ? (
          <>
            {criterionName && currentScore !== undefined && (
              <div className="flex gap-2 mb-4">
                <Button 
                  onClick={generateJustification} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Generate Score Justification
                    </>
                  )}
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Textarea 
                placeholder="Ask about scoring best practices or for help with a specific criterion..."
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
          </>
        ) : (
          <LLMResponse 
            content={analysisResult.response}
            feedbackId={analysisResult.feedback_id}
            onReset={handleReset}
          />
        )}
      </CardContent>
    </Card>
  );
} 