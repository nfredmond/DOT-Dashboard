"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, SearchIcon } from 'lucide-react';
import { useLLM } from '@/contexts/LLMContext';
import { LLMResponse } from '@/components/LLMResponse';
import { LLMResponse as LLMResponseType } from '@/lib/llm/llmService';

// Mock grants data - in a real app, this would come from the database
const MOCK_GRANTS = [
  {
    id: "grant-1",
    name: "Highway Safety Improvement Program (HSIP)",
    focusAreas: ["Safety", "Infrastructure", "Risk Reduction"],
    requirements: "Projects must address safety issues, reduce severe crashes, and be based on data-driven safety analysis."
  },
  {
    id: "grant-2", 
    name: "Transportation Alternatives Program (TAP)",
    focusAreas: ["Active Transportation", "Pedestrian", "Bicycle", "Safe Routes to School"],
    requirements: "Projects must provide alternative transportation options, enhance safety for non-motorized users, or create safe routes to schools."
  },
  {
    id: "grant-3",
    name: "Congestion Mitigation and Air Quality (CMAQ)",
    focusAreas: ["Air Quality", "Congestion", "Emissions Reduction"],
    requirements: "Projects must demonstrate emissions reduction, address congestion in non-attainment areas, and improve air quality."
  },
  {
    id: "grant-4",
    name: "RAISE Discretionary Grant Program",
    focusAreas: ["Economic Competitiveness", "Environmental Sustainability", "Quality of Life", "Innovation"],
    requirements: "Projects must demonstrate significant local or regional impact, innovation, partnerships, and environmental benefits."
  }
];

interface GrantAlignmentLLMProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectType: string;
}

export function GrantAlignmentLLM({ 
  projectId,
  projectName,
  projectDescription,
  projectType
}: GrantAlignmentLLMProps) {
  const [selectedGrantId, setSelectedGrantId] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<LLMResponseType | null>(null);
  const { isLoading, sendGrantAlignmentQuery } = useLLM();
  
  // Find the selected grant
  const selectedGrant = MOCK_GRANTS.find(grant => grant.id === selectedGrantId);

  // Generate grant alignment analysis
  const analyzeGrantAlignment = async () => {
    if (!projectId || !selectedGrantId || !selectedGrant) return;
    
    try {
      const result = await sendGrantAlignmentQuery({
        projectId,
        projectName,
        projectType,
        description: projectDescription,
        grantName: selectedGrant.name,
        grantFocusAreas: selectedGrant.focusAreas,
        grantRequirements: selectedGrant.requirements
      });
      
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error generating grant alignment analysis:", error);
    }
  };

  // Reset analysis results
  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FileText className="h-5 w-5 mr-2 text-green-500" />
          Grant Alignment Analysis
        </CardTitle>
        <CardDescription>
          Analyze how well your project aligns with grant requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysisResult ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="grant-select">Select a grant program</Label>
              <Select
                value={selectedGrantId}
                onValueChange={setSelectedGrantId}
              >
                <SelectTrigger id="grant-select" className="w-full">
                  <SelectValue placeholder="Select a grant program" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_GRANTS.map((grant) => (
                    <SelectItem key={grant.id} value={grant.id}>
                      {grant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedGrant && (
                <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                  <p className="font-medium">Focus Areas:</p>
                  <p>{selectedGrant.focusAreas.join(", ")}</p>
                  <p className="font-medium mt-2">Requirements:</p>
                  <p>{selectedGrant.requirements}</p>
                </div>
              )}
            </div>
            
            <Button 
              className="w-full mt-4"
              disabled={isLoading || !selectedGrantId}
              onClick={analyzeGrantAlignment}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Analyze Grant Alignment
                </>
              )}
            </Button>
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