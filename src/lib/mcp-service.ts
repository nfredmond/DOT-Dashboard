import { 
  getMCPServers,
  isMCPEnabled,
  MCPServerConfig,
  MCPCapability
} from './env-service';

/**
 * MCP Function Call
 */
export interface MCPFunctionCall {
  name: string;
  arguments: Record<string, any>;
}

/**
 * MCP Tool Definition
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
 * MCP Request Message
 */
export interface MCPMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

/**
 * MCP Response Configuration
 */
export interface MCPResponseConfig {
  tools?: MCPTool[];
  temperature?: number;
  max_tokens?: number;
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

/**
 * Result of an MCP request
 */
export interface MCPResult {
  message: MCPMessage;
  tool_calls?: MCPFunctionCall[];
  finish_reason: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Check if the MCP capability is available
 */
export function hasMCPCapability(capability: MCPCapability): boolean {
  if (!isMCPEnabled()) {
    return false;
  }
  
  const servers = getMCPServers();
  const activeServers = servers.filter(server => server.isActive);
  
  return activeServers.some(server => server.capabilities.includes(capability));
}

/**
 * Get an appropriate MCP server for the given capability
 */
export function getMCPServerForCapability(capability: MCPCapability): MCPServerConfig | null {
  if (!isMCPEnabled()) {
    return null;
  }
  
  const servers = getMCPServers();
  const activeServers = servers.filter(server => server.isActive);
  
  // Find a server that supports this capability
  return activeServers.find(server => server.capabilities.includes(capability)) || null;
}

/**
 * Send a message to an MCP server
 */
export async function sendMCPMessage(
  messages: MCPMessage[],
  config: MCPResponseConfig = {},
  preferredServer?: MCPServerConfig
): Promise<MCPResult> {
  if (!isMCPEnabled() && !preferredServer) {
    throw new Error('MCP is not enabled');
  }
  
  // Use preferred server or find an appropriate one
  const server = preferredServer || getMCPServers().find(s => s.isActive);
  
  if (!server) {
    throw new Error('No active MCP server available');
  }
  
  // Prepare the request based on the provider
  const endpoint = prepareEndpoint(server);
  const requestPayload = prepareRequestPayload(server, messages, config);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${server.apiKey}`
      },
      body: JSON.stringify(requestPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP server responded with status ${response.status}: ${errorText}`);
    }
    
    const responseData = await response.json();
    
    // Transform the response based on the provider
    return transformResponse(server, responseData);
  } catch (error) {
    console.error('Error communicating with MCP server:', error);
    throw error;
  }
}

/**
 * Prepare the endpoint URL based on the server provider
 */
function prepareEndpoint(server: MCPServerConfig): string {
  const baseUrl = server.url.endsWith('/') ? server.url : `${server.url}/`;
  
  switch (server.provider) {
    case 'openai':
      return `${baseUrl}chat/completions`;
    case 'anthropic':
      return `${baseUrl}messages`;
    case 'meta':
      return `${baseUrl}completions`;
    case 'custom':
    default:
      return `${baseUrl}chat/completions`;
  }
}

/**
 * Prepare the request payload based on the server provider
 */
function prepareRequestPayload(
  server: MCPServerConfig,
  messages: MCPMessage[],
  config: MCPResponseConfig
): any {
  switch (server.provider) {
    case 'openai':
      return {
        model: 'gpt-4o',
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 2000,
        tools: config.tools || [],
        tool_choice: config.tool_choice || 'auto'
      };
      
    case 'anthropic':
      // Transform messages to Anthropic format
      return {
        model: 'claude-3-opus-20240229',
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 2000,
        tools: config.tools || [],
        tool_choice: config.tool_choice || 'auto',
        system: extractSystemMessage(messages)
      };
      
    case 'meta':
      // Transform for Meta's format
      return {
        model: 'llama-3-70b-instruct',
        messages: transformMessagesForMeta(messages),
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 2000
      };
      
    case 'custom':
    default:
      // Use OpenAI format as default
      return {
        model: 'default',
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 2000,
        tools: config.tools || [],
        tool_choice: config.tool_choice || 'auto'
      };
  }
}

/**
 * Extract system message from messages array
 */
function extractSystemMessage(messages: MCPMessage[]): string {
  const systemMessage = messages.find(msg => msg.role === 'system');
  return systemMessage?.content || '';
}

/**
 * Transform messages for Meta's API format
 */
function transformMessagesForMeta(messages: MCPMessage[]): any[] {
  return messages.map(msg => {
    if (msg.role === 'tool') {
      // Meta may not support tool messages directly
      return {
        role: 'assistant',
        content: `Tool Result (${msg.name}): ${msg.content}`
      };
    }
    return msg;
  });
}

/**
 * Transform the response based on the server provider
 */
function transformResponse(server: MCPServerConfig, responseData: any): MCPResult {
  switch (server.provider) {
    case 'openai':
      return {
        message: responseData.choices[0].message,
        tool_calls: responseData.choices[0].message.tool_calls,
        finish_reason: responseData.choices[0].finish_reason,
        usage: responseData.usage
      };
      
    case 'anthropic':
      // Transform Anthropic response to standard format
      return {
        message: {
          role: 'assistant',
          content: responseData.content[0].text
        },
        tool_calls: transformAnthropicToolCalls(responseData.tool_calls),
        finish_reason: responseData.stop_reason,
        usage: responseData.usage
      };
      
    case 'meta':
      // Transform Meta response to standard format
      return {
        message: {
          role: 'assistant',
          content: responseData.choices[0].text
        },
        finish_reason: responseData.choices[0].finish_reason,
        usage: {
          prompt_tokens: responseData.usage?.prompt_tokens || 0,
          completion_tokens: responseData.usage?.completion_tokens || 0,
          total_tokens: responseData.usage?.total_tokens || 0
        }
      };
      
    case 'custom':
    default:
      // Return as is, assuming OpenAI-like format
      return {
        message: responseData.choices[0].message,
        tool_calls: responseData.choices[0].message.tool_calls,
        finish_reason: responseData.choices[0].finish_reason,
        usage: responseData.usage
      };
  }
}

/**
 * Transform Anthropic tool calls to standard format
 */
function transformAnthropicToolCalls(toolCalls: any[] | undefined): MCPFunctionCall[] | undefined {
  if (!toolCalls) return undefined;
  
  return toolCalls.map(tool => ({
    name: tool.name,
    arguments: JSON.parse(tool.input)
  }));
}

/**
 * Execute a tool call from an MCP server
 */
export async function executeMCPToolCall(
  toolCall: MCPFunctionCall
): Promise<{ role: 'tool'; content: string; name: string; tool_call_id?: string }> {
  // Register available tools
  const availableTools: Record<string, (args: any) => Promise<string>> = {
    // File operations
    search_files: async (args) => {
      const { query, extension } = args;
      // Implementation would go here
      return JSON.stringify({ files: [`test-file.${extension || 'txt'}`] });
    },
    
    // Web search operations
    web_search: async (args) => {
      const { query } = args;
      // Implementation would go here
      return JSON.stringify({ results: [`Result for ${query}`] });
    },
    
    // GIS operations
    gis_query: async (args) => {
      const { location, radius } = args;
      // Implementation would go here
      return JSON.stringify({ points: [{ lat: 0, lng: 0, name: 'Test Point' }] });
    },
    
    // Database operations
    database_query: async (args) => {
      const { table, filters } = args;
      // Implementation would go here
      return JSON.stringify({ rows: [{ id: 1, name: 'Test' }] });
    }
  };
  
  try {
    // Check if tool is available
    const toolFunction = availableTools[toolCall.name];
    
    if (!toolFunction) {
      return {
        role: 'tool',
        name: toolCall.name,
        content: JSON.stringify({ error: `Tool '${toolCall.name}' not found` })
      };
    }
    
    // Execute the tool
    const result = await toolFunction(toolCall.arguments);
    
    return {
      role: 'tool',
      name: toolCall.name,
      content: result
    };
  } catch (error) {
    console.error(`Error executing tool ${toolCall.name}:`, error);
    
    return {
      role: 'tool',
      name: toolCall.name,
      content: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      })
    };
  }
}

/**
 * Get available MCP tools
 */
export function getAvailableMCPTools(): MCPTool[] {
  return [
    {
      type: 'function',
      function: {
        name: 'search_files',
        description: 'Search for files in the application',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            },
            extension: {
              type: 'string',
              description: 'Filter by file extension'
            }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for information',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'gis_query',
        description: 'Query geographic information',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location to query'
            },
            radius: {
              type: 'number',
              description: 'The radius in meters'
            }
          },
          required: ['location']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'database_query',
        description: 'Query the database',
        parameters: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'The table to query'
            },
            filters: {
              type: 'object',
              description: 'Filters to apply to the query'
            }
          },
          required: ['table']
        }
      }
    }
  ];
} 