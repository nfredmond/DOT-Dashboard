/**
 * Agents Service
 * 
 * Provides functionality for running AI agent queries using either OpenAI's API
 * or Model Context Protocol (MCP) servers
 */

import { OpenAI } from 'openai';
import { getEnvVariable } from './env-service';
import {
  chooseBestMCPServerForAgent,
  processMCPAgentResponseChunks
} from './mcp-agents-utils';

import {
  sendMCPRequest,
  MCPCapability,
  MCPRequestOptions
} from './mcp-service';

import { createClient } from '@/lib/supabase/client';

/**
 * Types of agents available
 */
export enum AgentType {
  GENERAL = 'general',
  SCENARIO_ANALYSIS = 'scenario_analysis',
  SCENARIO_INSIGHTS = 'scenario_insights',
  SCENARIO_ASPECT_ANALYSIS = 'scenario_aspect_analysis',
  POLICY_RECOMMENDATIONS = 'policy_recommendations',
  COMPARISON = 'comparison'
}

/**
 * Agent context interface for providing project data
 */
export interface AgentContext {
  projectId?: string;
  projectName?: string;
  projectLocation?: string;
  projectType?: string;
  [key: string]: any;  // Allow additional context properties
}

/**
 * Options for agent queries
 */
export interface AgentQueryOptions {
  context?: Record<string, any>;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentQueryResponse {
  result: any;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  created?: number;
  model?: string;
}

/**
 * Get an OpenAI client for making API calls
 */
function getOpenAIClient(): OpenAI {
  const apiKey = getEnvVariable('OPENAI_API_KEY');
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
}

/**
 * Run a query with an AI agent
 * 
 * @param options The query options
 * @returns The agent response
 */
export async function runAgentQuery(options: {
  type: AgentType;
  query: string;
  context?: Record<string, any>;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<AgentQueryResponse> {
  try {
    const supabase = createClient();
    
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('User not authenticated');
    }
    
    // Prepare the API payload
    const payload = {
      type: options.type,
      query: options.query,
      context: options.context || {},
      modelConfig: {
        modelName: options.modelName || 'claude-3-sonnet-20240229',
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 4000
      }
    };
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('run-agent', {
      body: payload
    });
    
    if (error) {
      console.error('Error running agent query:', error);
      throw error;
    }
    
    return data as AgentQueryResponse;
  } catch (error) {
    console.error('Error in runAgentQuery:', error);
    throw error;
  }
}

/**
 * Run a streaming agent query with context
 * This is a wrapper around the runAgentQuery function to support the LLMContext
 * 
 * @param agentType The type of agent to use
 * @param query The query to send to the agent
 * @param context Additional context for the agent
 * @param onEvent Optional callback for streaming events
 * @returns Object with agent response
 */
export async function runAgentQueryStreamed(
  agentType: AgentType,
  query: string,
  context: AgentContext = {},
  onEvent?: (event: any) => void
): Promise<{ response: string }> {
  // Enhance the query with context if available
  const enhancedQuery = enhanceQueryWithContext(query, context);
  
  let fullResponse = '';
  
  // Run the query with streaming
  try {
    fullResponse = await runAgentQuery({
      type: agentType,
      query: enhancedQuery,
      context: context,
      streamHandler: onEvent ? (event) => {
        // Forward the event to the callback
        onEvent(event);
      } : undefined
    });
    
    return { response: fullResponse };
  } catch (error) {
    console.error('Error in runAgentQueryStreamed:', error);
    return { response: 'An error occurred while processing your request.' };
  }
}

/**
 * Enhance a query with context information
 */
function enhanceQueryWithContext(query: string, context: AgentContext): string {
  if (!context || Object.keys(context).length === 0) {
    return query;
  }
  
  // Build context string from available properties
  const contextParts = [];
  
  if (context.projectName) contextParts.push(`Project name: ${context.projectName}`);
  if (context.projectLocation) contextParts.push(`Location: ${context.projectLocation}`);
  if (context.projectType) contextParts.push(`Project type: ${context.projectType}`);
  
  // Add any other context properties
  Object.entries(context).forEach(([key, value]) => {
    if (!['projectId', 'projectName', 'projectLocation', 'projectType'].includes(key) && value) {
      contextParts.push(`${key}: ${value}`);
    }
  });
  
  if (contextParts.length === 0) {
    return query;
  }
  
  // Combine the context with the query
  return `
Context:
${contextParts.join('\n')}

Query:
${query}
`.trim();
}

/**
 * Run a query using OpenAI's API as a fallback for Agents
 * 
 * @param options Query options
 * @returns Response from the model
 */
async function runOpenAIFallbackQuery(
  options: AgentQueryOptions
): Promise<string> {
  const { prompt, agentType, systemPrompt, maxTokens, streamHandler } = options;
  
  try {
    const openai = getOpenAIClient();
    const finalSystemPrompt = systemPrompt || getSystemPromptForAgent(agentType);

    if (streamHandler) {
      // Handle streaming
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens || 2000,
        temperature: 0.7,
        stream: true
      });
      
      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          streamHandler({ type: 'text', delta: content });
        }
      }
      
      return fullResponse;
    } else {
      // Non-streaming response
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens || 2000,
        temperature: 0.7
      });
      
      return response.choices[0].message.content || "No response generated";
    }
  } catch (error) {
    console.error('Error running OpenAI fallback:', error);
    throw error;
  }
}

/**
 * Run a query using a Model Context Protocol (MCP) server
 * 
 * @param options Query options
 * @returns Response from the agent
 */
async function runMCPAgentQuery(
  options: AgentQueryOptions
): Promise<string> {
  const { prompt, agentType, systemPrompt, maxTokens, streamHandler } = options;
  
  try {
    // Choose the best server for this agent type
    const server = chooseBestMCPServerForAgent(agentType);
    
    if (!server) {
      throw new Error(`No MCP server available with ${agentType} capability`);
    }
    
    // Format the MCP request
    const mcpRequest: MCPRequestOptions = {
      prompt: prompt,
      system_prompt: systemPrompt || getSystemPromptForAgent(agentType),
      max_tokens: maxTokens,
      stream: Boolean(streamHandler),
      capabilities: [mapAgentTypeToMCPCapability(agentType)]
    };
    
    // Collect response chunks
    const responseChunks: any[] = [];
    
    // Send the request to MCP server
    await sendMCPRequest(server, mcpRequest, (chunk) => {
      responseChunks.push(chunk);
      
      // Forward to stream handler if provided
      if (streamHandler && chunk.choices && chunk.choices.length > 0) {
        const delta = chunk.choices[0].delta?.content || '';
        if (delta) {
          streamHandler({ type: 'token', delta });
        }
      }
    });
    
    // Process response chunks into complete response
    return processMCPAgentResponseChunks(responseChunks);
  } catch (error) {
    console.error('Error running MCP agent:', error);
    throw error;
  }
}

/**
 * Map an agent type to MCP capability
 */
function mapAgentTypeToMCPCapability(agentType: AgentType): MCPCapability {
  switch (agentType) {
    case AgentType.ANALYSIS:
      return MCPCapability.ANALYSIS;
    case AgentType.PLANNING:
      return MCPCapability.PLANNING;
    case AgentType.BROWSER:
      return MCPCapability.WEB_BROWSE;
    case AgentType.COMPUTER:
      return MCPCapability.CODE_INTERPRETER;
    default:
      return MCPCapability.CHAT;
  }
}

/**
 * Get a system prompt for an agent type
 * 
 * @param agentType The agent type
 * @returns System prompt string
 */
function getSystemPromptForAgent(agentType: AgentType): string {
  switch (agentType) {
    case AgentType.ANALYSIS:
      return "You are a transportation analysis expert. Your job is to analyze transportation projects and provide insights on their impacts, benefits, and challenges. Be thorough, data-driven, and consider multiple perspectives in your analysis.";
    
    case AgentType.PLANNING:
      return "You are a transportation planning expert. Your job is to help develop and evaluate transportation project alternatives, considering feasibility, timeline, budget, and impacts. Be creative yet practical in your planning recommendations.";
    
    case AgentType.BROWSER:
      return "You are a research assistant with web browsing capabilities. Find information online that helps with transportation planning and analysis tasks. Provide accurate information and cite your sources.";
    
    case AgentType.COMPUTER:
      return "You are a computational assistant with data analysis and code interpretation capabilities. Analyze transportation data, create visualizations, and provide quantitative insights to support decision-making.";
    
    default:
      return "You are an AI assistant helping with transportation planning tasks.";
  }
}

/**
 * Format scenario data for agent consumption
 * 
 * @param scenarioId Scenario ID
 * @param includeResults Whether to include results
 * @returns Formatted scenario data
 */
export async function formatScenarioForAgent(scenarioId: string, includeResults = true): Promise<Record<string, any>> {
  try {
    const supabase = createClient();
    
    // Get scenario data
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select(`
        *,
        ${includeResults ? 'results:scenario_results(*),' : ''}
        baseline:baseline_scenario_id(id, name)
      `)
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError || !scenario) {
      console.error('Error fetching scenario:', scenarioError);
      throw new Error('Failed to fetch scenario data');
    }
    
    // Format the data for the agent
    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      baseYear: scenario.base_year,
      horizonYears: scenario.horizon_years,
      assumptions: scenario.assumptions,
      policyPackages: scenario.policy_packages,
      tags: scenario.tags,
      baseline: scenario.baseline,
      results: scenario.results,
      createdAt: scenario.created_at,
      updatedAt: scenario.updated_at
    };
  } catch (error) {
    console.error('Error formatting scenario for agent:', error);
    throw error;
  }
}

/**
 * Get AI-powered policy recommendations based on scenario results
 * 
 * @param scenarioId Scenario ID
 * @returns Policy recommendations
 */
export async function getPolicyRecommendations(scenarioId: string): Promise<any> {
  try {
    // Format scenario data
    const scenarioData = await formatScenarioForAgent(scenarioId);
    
    // Run agent query
    const response = await runAgentQuery({
      type: AgentType.POLICY_RECOMMENDATIONS,
      query: 'Recommend policies to improve this scenario',
      context: { scenario: scenarioData }
    });
    
    return response.result;
  } catch (error) {
    console.error('Error getting policy recommendations:', error);
    throw error;
  }
}

/**
 * Get AI-powered comparison between two scenarios
 * 
 * @param scenarioId1 First scenario ID
 * @param scenarioId2 Second scenario ID
 * @returns Comparison results
 */
export async function compareScenarios(scenarioId1: string, scenarioId2: string): Promise<any> {
  try {
    // Format scenario data
    const scenario1Data = await formatScenarioForAgent(scenarioId1);
    const scenario2Data = await formatScenarioForAgent(scenarioId2);
    
    // Run agent query
    const response = await runAgentQuery({
      type: AgentType.COMPARISON,
      query: 'Compare these two scenarios',
      context: {
        scenario1: scenario1Data,
        scenario2: scenario2Data
      }
    });
    
    return response.result;
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    throw error;
  }
} 