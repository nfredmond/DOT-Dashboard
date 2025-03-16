/**
 * Agents Service
 * 
 * Provides functionality for running AI agent queries using either OpenAI's API
 * or Model Context Protocol (MCP) servers
 */

import { OpenAI } from 'openai';
import { getEnvVariable } from './env-service';
import {
  hasMCPAgentCapability,
  chooseBestMCPServerForAgent,
  formatMCPAgentRequest,
  processMCPAgentResponseChunks,
  shouldPreferMCPOverOpenAI,
  hasOpenAIAPIKey
} from './mcp-agents-utils';

import {
  sendMCPRequest,
  MCPCapability,
  MCPServerConfig,
  MCPRequestOptions
} from './mcp-service';

/**
 * Types of agents available
 */
export enum AgentType {
  ANALYSIS = 'analysis',    // Project analysis (cost-benefit, environmental, equity, etc.)
  PLANNING = 'planning',    // Project planning and scenario development
  BROWSER = 'browser',      // Web browsing for research
  COMPUTER = 'computer'     // Code/data interpretation and analysis
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
  prompt: string;
  agentType: AgentType;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: any[];
  streamHandler?: (event: { type: string; delta?: string }) => void;
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
 * Run a query using an AI agent
 * 
 * This function will choose between OpenAI API and MCP server
 * based on available configuration and capabilities
 * 
 * @param options Query options 
 * @returns Response from the agent
 */
export async function runAgentQuery(
  options: AgentQueryOptions
): Promise<string> {
  const { prompt, agentType, systemPrompt, maxTokens, tools, streamHandler } = options;
  
  const hasOpenAI = hasOpenAIAPIKey();
  const hasMCP = hasMCPAgentCapability(agentType);
  const preferMCP = shouldPreferMCPOverOpenAI();
  
  if ((preferMCP || !hasOpenAI) && hasMCP) {
    return runMCPAgentQuery({
      prompt,
      agentType,
      systemPrompt,
      maxTokens,
      streamHandler
    });
  } else if (hasOpenAI) {
    return runOpenAIFallbackQuery({
      prompt,
      agentType,
      systemPrompt,
      maxTokens,
      tools,
      streamHandler
    });
  } else {
    throw new Error('No agent service is available. Please configure either OpenAI API key or MCP servers.');
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
      prompt: enhancedQuery,
      agentType,
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