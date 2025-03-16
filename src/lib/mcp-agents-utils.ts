/**
 * MCP Agents Utilities
 * 
 * Utilities for integrating Model Context Protocol (MCP) servers with the OpenAI Agents SDK
 * Provides capability detection, tools conversion, and server selection
 */

import { getActiveMCPServers, MCPCapability, MCPServerConfig } from '@/lib/mcp-service';
import { getEnvVariable } from '@/lib/env-service';
// Remove circular dependency
// import { AgentType } from '@/lib/agents-service';

// Define enum locally to avoid circular dependency
enum AgentType {
  ANALYSIS = 'analysis',
  PLANNING = 'planning', 
  BROWSER = 'browser',
  COMPUTER = 'computer'
}

/**
 * MCP Analysis Capability Map
 * Maps agent types to the required MCP capabilities
 */
export const AGENT_TO_MCP_CAPABILITY: Record<AgentType, MCPCapability> = {
  [AgentType.ANALYSIS]: MCPCapability.ANALYSIS,
  [AgentType.PLANNING]: MCPCapability.PLANNING,
  [AgentType.BROWSER]: MCPCapability.WEB_BROWSE,
  [AgentType.COMPUTER]: MCPCapability.CODE_INTERPRETER
};

/**
 * Check if OpenAI API key is available
 * @returns True if OpenAI API key is configured
 */
export function hasOpenAIAPIKey(): boolean {
  const apiKey = getEnvVariable('OPENAI_API_KEY');
  return !!apiKey && apiKey.length > 0;
}

/**
 * Check if any MCP server with the specified capability is available
 * @param capability The capability to check for
 * @returns True if any active MCP server has the specified capability
 */
export function hasMCPCapability(capability: MCPCapability): boolean {
  const activeServers = getActiveMCPServers();
  return activeServers.some(server => 
    server.capabilities.includes(capability)
  );
}

/**
 * Get a list of all MCP servers that have the specified capability
 * @param capability The capability to filter by
 * @returns Array of MCP server configs
 */
export function getMCPServersWithCapability(capability: MCPCapability): MCPServerConfig[] {
  const activeServers = getActiveMCPServers();
  return activeServers.filter(server => 
    server.capabilities.includes(capability)
  );
}

/**
 * Check if MCP has the capability required for a specific agent type
 * @param agentType Agent type to check
 * @returns True if MCP has capability for the agent type
 */
export function hasMCPAgentCapability(agentType: string): boolean {
  const capability = AGENT_TO_MCP_CAPABILITY[agentType as AgentType];
  return hasMCPCapability(capability);
}

/**
 * Determine if any agent functionality is available, either through OpenAI or MCP
 * @returns True if any agent functionality is available
 */
export function isAnyAgentAvailable(): boolean {
  return hasOpenAIAPIKey() || getActiveMCPServers().length > 0;
}

/**
 * Convert MCP tool format to OpenAI Agents SDK format
 * @param mcpTools Array of MCP tools
 * @returns Array of tools in OpenAI Agents SDK format
 */
export function convertMCPToolsToAgentTools(mcpTools: any[]): any[] {
  return mcpTools.map(tool => {
    // Basic conversion for function-calling tools
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    };
  });
}

/**
 * Convert OpenAI Agents SDK tool format to MCP format
 * @param agentTools Array of tools in OpenAI Agents SDK format
 * @returns Array of tools in MCP format
 */
export function convertAgentToolsToMCPTools(agentTools: any[]): any[] {
  return agentTools.map(tool => {
    // Basic conversion for function type tools
    if (tool.type === 'function') {
      return {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      };
    }
    // Handle other tool types if needed
    return tool;
  });
}

/**
 * Choose the best MCP server for an agent type
 * @param agentType Agent type to choose server for
 * @param preferMCP Whether to prefer MCP over OpenAI when available
 * @returns Best MCP server for the agent type, or null if none available
 */
export function chooseBestMCPServerForAgent(
  agentType: string,
  preferMCP: boolean = true
): MCPServerConfig | null {
  const capability = AGENT_TO_MCP_CAPABILITY[agentType as AgentType];
  
  if (!capability) {
    return null;
  }
  
  const servers = getMCPServersWithCapability(capability);
  
  if (servers.length === 0) {
    return null;
  }
  
  // TODO: Implement better server selection logic
  // For now, just return the first server
  return servers[0];
}

/**
 * Format a request for an MCP agent
 * @param prompt The prompt to send to the agent
 * @param agentType The type of agent
 * @param options Additional options
 * @returns Formatted MCP request
 */
export function formatMCPAgentRequest(
  prompt: string,
  agentType: string,
  options: {
    systemPrompt?: string;
    tools?: any[];
    maxTokens?: number;
  } = {}
): Record<string, any> {
  const { systemPrompt, tools, maxTokens } = options;
  
  const capability = AGENT_TO_MCP_CAPABILITY[agentType as AgentType];
  
  return {
    prompt,
    system_prompt: systemPrompt || getSystemPromptForAgentType(agentType),
    max_tokens: maxTokens,
    capabilities: [capability],
    tools: tools ? convertAgentToolsToMCPTools(tools) : undefined
  };
}

/**
 * Get a system prompt for an agent type
 * @param agentType Agent type to get system prompt for
 * @returns System prompt for the agent type
 */
export function getSystemPromptForAgentType(agentType: string): string {
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
 * Process MCP agent response chunks into a complete response
 * @param chunks Array of response chunks from MCP server
 * @returns Concatenated response text
 */
export function processMCPAgentResponseChunks(chunks: any[]): string {
  let fullResponse = '';
  
  for (const chunk of chunks) {
    if (chunk.choices && chunk.choices.length > 0) {
      // Extract message content from each chunk
      const content = chunk.choices[0].delta?.content || '';
      fullResponse += content;
    }
  }
  
  return fullResponse;
}

/**
 * Check if MCP configuration should be preferred over OpenAI
 * @returns True if MCP should be used when both are available
 */
export function shouldPreferMCPOverOpenAI(): boolean {
  // Could be extended to check user preferences, performance metrics, etc.
  const preferMCP = getEnvVariable('PREFER_MCP_OVER_OPENAI', 'false');
  return preferMCP.toLowerCase() === 'true';
} 