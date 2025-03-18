/**
 * Model Context Protocol (MCP) Service
 * 
 * Manages connections to MCP-compatible servers
 * Provides streaming API for LLM text generation with MCP servers
 */

import { getEnvVariable } from '@/lib/env-service';

/**
 * MCP Server Configuration Interface
 */
export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  isActive: boolean;
  capabilities: MCPCapability[];
  models?: string[];
  maxTokens?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * MCP Capabilities
 * These represent the different functions an MCP server can perform
 */
export enum MCPCapability {
  CHAT = 'chat',
  COMPLETION = 'completion',
  EMBEDDING = 'embedding',
  ANALYSIS = 'analysis',
  PLANNING = 'planning',
  WEB_BROWSE = 'web_browse',
  CODE_INTERPRETER = 'code_interpreter',
  FILE_SEARCH = 'file_search',
  FUNCTION_CALLING = 'function_calling',
  MULTI_MODAL = 'multi_modal',
  VOICE_RECOGNITION = 'voice_recognition',
  TEXT_TO_SPEECH = 'text_to_speech'
}

/**
 * MCP Function Call Interface
 */
export interface MCPFunctionCall {
  name: string;
  arguments: Record<string, any>;
}

/**
 * MCP Tool Interface
 */
export interface MCPTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * MCP Request Options Interface
 */
export interface MCPRequestOptions {
  prompt: string;
  system_prompt?: string;
  max_tokens?: number;
  temperature?: number;
  model?: string;
  stream?: boolean;
  tools?: MCPTool[];
  capabilities?: MCPCapability[];
}

/**
 * MCP Stream Handler Type
 */
export type MCPStreamHandler = (chunk: any) => void;

/**
 * Get all configured MCP servers
 * @returns Array of MCP server configurations
 */
export function getMCPServers(): MCPServerConfig[] {
  // This would typically come from localStorage or a backend service
  const storedServers = typeof window !== 'undefined' 
    ? localStorage.getItem('mcp_servers') 
    : null;
    
  if (storedServers) {
    try {
      return JSON.parse(storedServers);
    } catch (e) {
      console.error('Failed to parse MCP servers from storage', e);
    }
  }
  
  return [];
}

/**
 * Get all active MCP servers
 * @returns Array of active MCP server configurations
 */
export function getActiveMCPServers(): MCPServerConfig[] {
  return getMCPServers().filter(server => server.isActive);
}

/**
 * Check if a specific MCP capability is available in any active server
 * @param capability The capability to check for
 * @returns True if any active server has the capability
 */
export function hasMCPCapability(capability: MCPCapability): boolean {
  const activeServers = getActiveMCPServers();
  return activeServers.some(server => 
    server.capabilities.includes(capability)
  );
}

/**
 * Get the first available MCP server with a specific capability
 * @param capability The capability to check for
 * @returns MCP server with the capability, or null if none found
 */
export function getMCPServerWithCapability(capability: MCPCapability): MCPServerConfig | null {
  const activeServers = getActiveMCPServers();
  return activeServers.find(server => 
    server.capabilities.includes(capability)
  ) || null;
}

/**
 * Send a request to an MCP server
 * @param server The MCP server configuration
 * @param options Request options
 * @param streamHandler Optional handler for streaming responses
 * @returns Promise resolving to the MCP response
 */
export async function sendMCPRequest(
  server: MCPServerConfig,
  options: MCPRequestOptions,
  streamHandler?: MCPStreamHandler
): Promise<any> {
  try {
    const apiKey = server.apiKey || getEnvVariable('MCP_API_KEY', '');
    
    const response = await fetch(server.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : ''
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error(`MCP server error: ${response.status} ${response.statusText}`);
    }
    
    // Handle streaming
    if (options.stream && streamHandler && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') continue;
          
          try {
            const dataMatch = line.match(/^data: (.+)$/);
            if (dataMatch) {
              const json = JSON.parse(dataMatch[1]);
              streamHandler(json);
            }
          } catch (e) {
            console.error('Error parsing MCP stream chunk', e);
          }
        }
      }
      
      return { success: true, message: 'Stream completed' };
    } else {
      // Non-streaming response
      const data = await response.json();
      return data;
    }
    
  } catch (error) {
    console.error('MCP request error:', error);
    throw error;
  }
}

/**
 * Send a completion request to an MCP server
 * @param prompt The prompt text
 * @param options Additional completion options
 * @param streamHandler Optional handler for streaming responses
 * @returns Promise resolving to the completion result
 */
export async function sendMCPCompletion(
  prompt: string,
  options: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
    stream?: boolean;
    tools?: MCPTool[];
  } = {},
  streamHandler?: MCPStreamHandler
): Promise<string> {
  const activeMCPServers = getActiveMCPServers();
  
  if (activeMCPServers.length === 0) {
    throw new Error('No active MCP servers available');
  }
  
  // Find a server with completion capability
  const server = activeMCPServers.find(s => 
    s.capabilities.includes(MCPCapability.COMPLETION) || 
    s.capabilities.includes(MCPCapability.CHAT)
  );
  
  if (!server) {
    throw new Error('No MCP server with completion capability available');
  }
  
  const requestOptions: MCPRequestOptions = {
    prompt,
    system_prompt: options.systemPrompt,
    max_tokens: options.maxTokens || 1000,
    temperature: options.temperature || 0.7,
    model: options.model,
    stream: options.stream,
    tools: options.tools,
    capabilities: [MCPCapability.COMPLETION]
  };
  
  if (options.stream && streamHandler) {
    // For streaming, collect chunks and return the full text at the end
    let fullResponse = '';
    
    await sendMCPRequest(server, requestOptions, (chunk) => {
      if (chunk.choices && chunk.choices.length > 0) {
        const content = chunk.choices[0].delta?.content || chunk.choices[0].text || '';
        fullResponse += content;
        streamHandler(chunk);
      }
    });
    
    return fullResponse;
  } else {
    // For non-streaming, just return the text
    const response = await sendMCPRequest(server, requestOptions);
    
    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message?.content || response.choices[0].text || '';
    }
    
    return '';
  }
}

/**
 * MCP Service - Model Context Protocol
 * 
 * Integrates with MCP protocol to enhance LLM interactions
 */

// MCP Request interface
export interface MCPRequest {
  input: string;
  response?: string;
  context?: Record<string, any>;
  capabilities?: MCPCapability[];
}

// MCP Response interface
export interface MCPResponse {
  output: string;
  action?: string;
  metadata?: Record<string, any>;
  shouldUseAgent?: boolean;
}

/**
 * Process a request through the Model Context Protocol
 * 
 * @param request The MCP request to process
 * @returns The processed MCP response
 */
export async function processWithMCP(request: MCPRequest): Promise<MCPResponse> {
  try {
    const { input, response, context = {}, capabilities } = request;
    
    // Check if we should process with MCP
    if (!shouldUseMCP()) {
      // Return the original response if MCP is not enabled
      return {
        output: response || '',
        shouldUseAgent: false
      };
    }
    
    // Default capabilities if not provided
    const requestCapabilities = capabilities || [MCPCapability.CHAT];
    
    // Add special capabilities for voice
    if (context.isVoiceInput) {
      requestCapabilities.push(MCPCapability.VOICE_RECOGNITION);
    }
    
    // Check if this requires an agent
    const requiresAgent = determineIfAgentRequired(input, requestCapabilities);
    
    // Process with MCP API
    const mcpResponse = await callMCPService(input, response, context, requestCapabilities);
    
    return {
      ...mcpResponse,
      shouldUseAgent: requiresAgent
    };
  } catch (error) {
    console.error('Error processing with MCP:', error);
    
    // Return original response in case of error
    return {
      output: request.response || '',
      shouldUseAgent: false,
      metadata: {
        error: `MCP processing failed: ${error instanceof Error ? error.message : String(error)}`
      }
    };
  }
}

/**
 * Determine if we should use MCP for processing
 * @returns True if MCP should be used
 */
function shouldUseMCP(): boolean {
  return process.env.ENABLE_MCP === 'true' || false;
}

/**
 * Determine if an agent should be used based on the input and capabilities
 * 
 * @param input The user input
 * @param capabilities The requested capabilities
 * @returns True if an agent should be used
 */
function determineIfAgentRequired(input: string, capabilities: MCPCapability[]): boolean {
  // Check for complex capabilities that typically require agents
  const complexCapabilities = [
    MCPCapability.ANALYSIS,
    MCPCapability.PLANNING,
    MCPCapability.WEB_BROWSE,
    MCPCapability.CODE_INTERPRETER
  ];
  
  const hasComplexCapability = capabilities.some(cap => 
    complexCapabilities.includes(cap));
  
  if (hasComplexCapability) {
    return true;
  }
  
  // Check input for phrases that suggest agent use
  const agentTriggerPhrases = [
    'analyze',
    'plan',
    'search',
    'find',
    'create',
    'calculate',
    'compute'
  ];
  
  const lowerInput = input.toLowerCase();
  return agentTriggerPhrases.some(phrase => lowerInput.includes(phrase));
}

/**
 * Make the actual API call to the MCP service
 * 
 * @param input User input
 * @param response Initial LLM response if available
 * @param context Contextual information
 * @param capabilities Required capabilities
 * @returns MCP response
 */
async function callMCPService(
  input: string,
  response?: string,
  _context: Record<string, any> = {},
  capabilities: MCPCapability[] = [MCPCapability.CHAT]
): Promise<MCPResponse> {
  // In a real implementation, this would call an external MCP service
  // For now, we'll simulate the response
  
  // For voice inputs, enhance the response for speech
  if (capabilities.includes(MCPCapability.VOICE_RECOGNITION)) {
    const enhancedResponse = response ? 
      makeResponseVoiceFriendly(response) : 
      'I understood your voice input but couldn\'t process it.';
    
    return {
      output: enhancedResponse,
      action: 'speak',
      metadata: {
        isVoiceResponse: true,
        processedByMCP: true
      }
    };
  }
  
  // For other capabilities, just pass through for now
  return {
    output: response || 'Processed by MCP',
    metadata: {
      processedByMCP: true,
      capabilities: capabilities
    }
  };
}

/**
 * Make a response more appropriate for voice output
 * 
 * @param text The text to modify
 * @returns Voice-friendly text
 */
function makeResponseVoiceFriendly(text: string): string {
  // Remove markdown formatting
  let cleaned = text
    .replace(/\*\*/g, '')                   // Remove bold markers
    .replace(/\*/g, '')                     // Remove italic markers
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')   // Replace markdown links with just the text
    .replace(/^#+ /gm, '')                  // Remove heading markers
    .replace(/```[\s\S]*?```/g, 'code snippet') // Replace code blocks
    .replace(/`([^`]+)`/g, '$1')            // Remove inline code formatting
    .replace(/\n\n+/g, '\n')                // Reduce multiple newlines
    .replace(/\n- /g, '\n• ');              // Make bullet points more speech-friendly
  
  // Remove common chat prefixes
  cleaned = cleaned
    .replace(/^(I'll|I'd|I'm|I've|I|Let me) (help you|assist you|answer that|respond to that|address that)\.?\s*/i, '')
    .replace(/^Sure[,!]?\s*/i, '')
    .replace(/^Of course[,!]?\s*/i, '');
  
  return cleaned.trim();
} 