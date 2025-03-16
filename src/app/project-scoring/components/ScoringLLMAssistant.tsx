"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Lightbulb, 
  Loader2, 
  BarChart4Icon,
  CheckCircle,
  RefreshCw,
  ThumbsUp
} from 'lucide-react';
import { useLLM } from '@/contexts/LLMContext';
import { LLMResponse } from '@/components/LLMResponse';
import { LLMResponse as LLMResponseType } from '@/lib/llm/llmService';
import { Project, ProjectCriterion } from '@/types/project';

interface ScoringLLMAssistantProps {
  project: Project;
  criteria: ProjectCriterion[];
  scores: any[];
  onUpdateScores?: (updatedScores: any[]) => void;
}

export function ScoringLLMAssistant({ 
  project,
  criteria,
  scores,
  onUpdateScores
}: ScoringLLMAssistantProps) {
  const [query, setQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<LLMResponseType | null>(null);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const { isLoading, sendQuery } = useLLM();

  // Generate scoring recommendations
  const generateRecommendations = async () => {
    if (!project) return;
    
    setIsGeneratingRecommendations(true);
    
    try {
      const result = await sendQuery({
        query: `Analyze the following project and provide scoring recommendations for each criterion:
        
Project: ${project.name}
Description: ${project.description}
Category: ${project.category}
Status: ${project.status}

Criteria to score (0-5 scale):
${criteria.map(c => `- ${c.name} (${c.category}): ${c.description}`).join('\n')}

Current scores:
${scores.map(s => `- ${s.name}: ${s.value}/5`).join('\n')}

Please provide specific recommendations for each criterion with justification.`,
        project_id: project.id,
        context: JSON.stringify({
          project,
          criteria,
          scores
        }),
      });
      
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  // Submit custom query
  const handleCustomQuery = async () => {
    if (!project || !query) return;
    
    try {
      const result = await sendQuery({
        query,
        project_id: project.id,
        context: JSON.stringify({
          project,
          criteria,
          scores
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
          AI Scoring Assistant
        </CardTitle>
        <CardDescription>
          Get AI-powered scoring recommendations and insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysisResult ? (
          <>
            <div className="flex gap-2 mb-4">
              <Button 
                onClick={generateRecommendations} 
                disabled={isLoading || isGeneratingRecommendations}
                className="w-full"
              >
                {isGeneratingRecommendations ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <BarChart4Icon className="mr-2 h-4 w-4" />
                    Generate Scoring Recommendations
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <Textarea 
                placeholder="Ask about scoring best practices or for help with a specific criterion..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[120px]"
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
          <div className="space-y-4">
            <LLMResponse 
              content={analysisResult.response}
              feedbackId={analysisResult.feedback_id}
              onReset={handleReset}
            />
            
            {onUpdateScores && (
              <Button 
                className="w-full mt-2" 
                onClick={() => {
                  // In a real implementation, this would parse the LLM response
                  // and extract recommended scores to update the project
                  onUpdateScores(scores.map(score => ({
                    ...score,
                    justification: `AI-recommended score based on project analysis.`
                  })));
                  
                  handleReset();
                }}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Apply Recommendations
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
