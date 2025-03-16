"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  submitLLMQuery, 
  submitEnhancedLLMQuery, 
  generatePrompt, 
  LLMRequest, 
  LLMResponse 
} from '@/lib/llm/llmService';
import { 
  getProjectDemographicContext, 
  getProjectSafetyContext 
} from '@/lib/llm/dataUtils';
import {
  runAgentQuery,
  runAgentQueryStreamed,
  AgentType,
  AgentContext as AgentCtx
} from '@/lib/agents-service';

interface LLMContextType {
  isLoading: boolean;
  lastResponse: LLMResponse | null;
  error: string | null;
  sendQuery: (request: LLMRequest) => Promise<LLMResponse>;
  sendProjectAnalysisQuery: (projectData: any) => Promise<LLMResponse>;
  sendEnhancedProjectAnalysisQuery: (projectData: any) => Promise<LLMResponse>;
  sendScoreJustificationQuery: (scoreData: any) => Promise<LLMResponse>;
  sendGrantAlignmentQuery: (grantData: any) => Promise<LLMResponse>;
  sendSafetyAnalysisQuery: (projectData: any) => Promise<LLMResponse>;
  sendEquityAnalysisQuery: (projectData: any) => Promise<LLMResponse>;
  sendAgentQuery: (query: string, agentType: AgentType, projectData?: any) => Promise<LLMResponse>;
  sendStreamedAgentQuery: (
    query: string, 
    agentType: AgentType, 
    projectData?: any,
    onEvent?: (event: any) => void
  ) => Promise<LLMResponse>;
  reset: () => void;
}

const LLMContext = createContext<LLMContextType | undefined>(undefined);

export const useLLM = () => {
  const context = useContext(LLMContext);
  if (context === undefined) {
    throw new Error('useLLM must be used within an LLMProvider');
  }
  return context;
};

interface LLMProviderProps {
  children: ReactNode;
}

export function LLMProvider({ children }: LLMProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<LLMResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generic function to send a query to the LLM service
  const sendQuery = async (request: LLMRequest): Promise<LLMResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await submitLLMQuery(request);
      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for project analysis
  const sendProjectAnalysisQuery = async (projectData: any): Promise<LLMResponse> => {
    const prompt = generatePrompt('project-analysis', projectData);
    
    return sendQuery({
      query: prompt,
      context: JSON.stringify(projectData),
      project_id: projectData.id,
      options: {
        temperature: 0.5, // Lower temperature for more factual responses
      }
    });
  };

  // Enhanced project analysis with census and SWITRS data
  const sendEnhancedProjectAnalysisQuery = async (projectData: any): Promise<LLMResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create the request object with location data for enhancement
      const request: LLMRequest = {
        query: generatePrompt('project-analysis', projectData),
        context: JSON.stringify(projectData),
        project_id: projectData.id,
        project_location: projectData.location,
        project_county: projectData.county || extractCountyFromLocation(projectData.location),
        project_state: projectData.state || 'CA',
        project_name: projectData.name,
        project_type: projectData.category,
        options: {
          temperature: 0.5,
        }
      };
      
      // Use the enhanced query function that fetches census/SWITRS data
      const response = await submitEnhancedLLMQuery(request);
      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for score justification
  const sendScoreJustificationQuery = async (scoreData: any): Promise<LLMResponse> => {
    const prompt = generatePrompt('score-justification', scoreData);
    
    return sendQuery({
      query: prompt,
      context: JSON.stringify(scoreData),
      project_id: scoreData.projectId,
      options: {
        temperature: 0.4, // Lower temperature for more consistent justifications
      }
    });
  };

  // Helper function for grant alignment analysis
  const sendGrantAlignmentQuery = async (grantData: any): Promise<LLMResponse> => {
    const prompt = generatePrompt('grant-alignment', grantData);
    
    return sendQuery({
      query: prompt,
      context: JSON.stringify(grantData),
      project_id: grantData.projectId,
      options: {
        temperature: 0.5,
        max_tokens: 1500, // Allow for longer responses for detailed analysis
      }
    });
  };

  // Helper function for safety analysis using SWITRS data
  const sendSafetyAnalysisQuery = async (projectData: any): Promise<LLMResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Extract county from location if not provided
      const county = projectData.county || extractCountyFromLocation(projectData.location);
      
      if (!county) {
        throw new Error("County information is required for safety analysis");
      }
      
      // Get safety context from SWITRS data
      const safetyContext = await getProjectSafetyContext(
        projectData.location,
        county
      );
      
      // Generate prompt with safety data
      const prompt = generatePrompt('safety-analysis', {
        projectName: projectData.name,
        projectType: projectData.category,
        description: projectData.description,
        location: projectData.location,
        safetyContext: safetyContext.safetySummary
      });
      
      // Enhanced context with safety data
      const enhancedContext = {
        ...projectData,
        safetyData: safetyContext
      };
      
      const response = await submitLLMQuery({
        query: prompt,
        context: JSON.stringify(enhancedContext),
        project_id: projectData.id,
        options: {
          temperature: 0.4,
          max_tokens: 1200,
        }
      });
      
      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for equity analysis using Census data
  const sendEquityAnalysisQuery = async (projectData: any): Promise<LLMResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Extract county from location if not provided
      const county = projectData.county || extractCountyFromLocation(projectData.location);
      
      // Get demographic context from Census data
      const demographicContext = await getProjectDemographicContext(
        projectData.location,
        county,
        projectData.state || 'CA'
      );
      
      // Generate prompt with demographic data
      const prompt = generatePrompt('equity-analysis', {
        projectName: projectData.name,
        projectType: projectData.category,
        description: projectData.description,
        location: projectData.location,
        demographicContext: demographicContext.demographicSummary
      });
      
      // Enhanced context with demographic data
      const enhancedContext = {
        ...projectData,
        demographicData: demographicContext
      };
      
      const response = await submitLLMQuery({
        query: prompt,
        context: JSON.stringify(enhancedContext),
        project_id: projectData.id,
        options: {
          temperature: 0.4,
          max_tokens: 1200,
        }
      });
      
      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // New function to send a query to an OpenAI Agent
  const sendAgentQuery = async (
    query: string, 
    agentType: AgentType, 
    projectData?: any
  ): Promise<LLMResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create agent context from project data
      const agentContext: AgentCtx = projectData ? {
        projectId: projectData.id,
        projectName: projectData.name,
        projectLocation: projectData.location,
        projectType: projectData.category,
      } : {};
      
      // Run the agent query
      const result = await runAgentQuery(agentType, query, agentContext);
      
      // Format response to match LLM response interface
      const response: LLMResponse = {
        response: result.response,
        model: `openai-agent-${agentType}`,
        tokens_used: 0, // Not tracked the same way as regular LLMs
        feedback_id: `agent-${Date.now()}`,
      };
      
      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send a streaming agent query
  const sendStreamedAgentQuery = async (
    query: string, 
    agentType: AgentType, 
    projectData?: any,
    onEvent?: (event: any) => void
  ): Promise<LLMResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create agent context from project data
      const agentContext: AgentCtx = projectData ? {
        projectId: projectData.id,
        projectName: projectData.name,
        projectLocation: projectData.location,
        projectType: projectData.category,
      } : {};
      
      // Run the agent query with streaming
      const result = await runAgentQueryStreamed(agentType, query, agentContext, onEvent);
      
      // Format response to match LLM response interface
      const response: LLMResponse = {
        response: result.response,
        model: `openai-agent-${agentType}`,
        tokens_used: 0, // Not tracked the same way as regular LLMs
        feedback_id: `agent-${Date.now()}`,
      };
      
      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the LLM state
  const reset = () => {
    setLastResponse(null);
    setError(null);
  };

  // Utility function to extract county from location string
  const extractCountyFromLocation = (location: string): string | undefined => {
    if (!location) return undefined;
    
    // Try to extract county from "City, County County" format
    const countyMatch = location.match(/,\s*([^,]+)\s+County/i);
    if (countyMatch && countyMatch[1]) {
      return countyMatch[1].trim();
    }
    
    // For California locations, try to determine county based on city
    // This is a simplified example - in a real app you'd use a more comprehensive lookup
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

  const value = {
    isLoading,
    lastResponse,
    error,
    sendQuery,
    sendProjectAnalysisQuery,
    sendEnhancedProjectAnalysisQuery,
    sendScoreJustificationQuery,
    sendGrantAlignmentQuery,
    sendSafetyAnalysisQuery,
    sendEquityAnalysisQuery,
    sendAgentQuery,
    sendStreamedAgentQuery,
    reset,
  };

  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>;
} 