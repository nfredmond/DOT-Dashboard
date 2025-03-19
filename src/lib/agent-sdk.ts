/**
 * Agent SDK
 * 
 * Interface for communication with agent systems in the application
 */
import logger from '@/lib/logger';

// Types for agent interactions
export interface AgentContext {
  currentPage?: string;
  currentProjectId?: string;
  userId?: string;
  isVoiceInput?: boolean;
  [key: string]: any;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  context?: AgentContext;
  metadata?: Record<string, any>;
}

export interface MessageResponse {
  content: string;
  metadata?: Record<string, any>;
}

export enum AgentType {
  GENERAL = 'general',
  ANALYSIS = 'analysis',
  PLANNING = 'planning',
  VOICE = 'voice'
}

export enum AgentIntent {
  QUESTION = 'question',
  COMMAND = 'command',
  NAVIGATION = 'navigation',
  SEARCH = 'search',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UNKNOWN = 'unknown'
}

/**
 * Agent SDK class for interacting with AI agents
 */
export class AgentSDK {
  private config: Record<string, any>;
  
  constructor(config: Record<string, any> = {}) {
    this.config = {
      defaultAgentType: AgentType.GENERAL,
      useVoiceOptimization: true,
      enableLogging: false,
      ...config
    };
  }
  
  /**
   * Process a message with the appropriate agent
   * 
   * @param message The message to process
   * @param agentType Optional agent type override
   * @returns Promise resolving to the agent response
   */
  async processMessage(
    message: Message,
    agentType?: AgentType
  ): Promise<MessageResponse> {
    try {
      // Determine the best agent type if not specified
      const selectedAgentType = agentType || this.determineAgentType(message);
      
      // Check if this is a voice message
      const isVoiceMessage = message.context?.isVoiceInput || false;
      
      // Optimize for voice if needed
      if (isVoiceMessage && this.config.useVoiceOptimization) {
        message = this.optimizeForVoice(message);
      }
      
      // Detect intent
      const intent = this.detectIntent(message);
      
      // Process with appropriate agent based on type and intent
      return await this.processWithAgent(message, selectedAgentType, intent);
    } catch (error) {
      logger.error('Error processing message with agent:', error);
      
      return {
        content: `Sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          error: true,
          errorType: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * Determine the most appropriate agent type for a message
   * 
   * @param message The message to process
   * @returns The determined agent type
   */
  private determineAgentType(message: Message): AgentType {
    // If it's a voice message, prefer the voice agent
    if (message.context?.isVoiceInput) {
      return AgentType.VOICE;
    }
    
    // Check for analysis keywords
    const analysisKeywords = ['analyze', 'statistics', 'report', 'data', 'trends'];
    if (analysisKeywords.some(kw => message.content.toLowerCase().includes(kw))) {
      return AgentType.ANALYSIS;
    }
    
    // Check for planning keywords
    const planningKeywords = ['plan', 'schedule', 'timeline', 'roadmap'];
    if (planningKeywords.some(kw => message.content.toLowerCase().includes(kw))) {
      return AgentType.PLANNING;
    }
    
    // Default to general agent
    return this.config.defaultAgentType;
  }
  
  /**
   * Optimize a message for voice processing
   * 
   * @param message The message to optimize
   * @returns The optimized message
   */
  private optimizeForVoice(message: Message): Message {
    // Add voice-specific metadata
    const optimizedMessage = {
      ...message,
      metadata: {
        ...message.metadata,
        optimizedForVoice: true,
        responseFormat: 'concise'
      }
    };
    
    return optimizedMessage;
  }
  
  /**
   * Detect the intent of a message
   * 
   * @param message The message to analyze
   * @returns The detected intent
   */
  private detectIntent(message: Message): AgentIntent {
    const content = message.content.toLowerCase();
    
    // Command intent
    if (content.startsWith('please') || 
        content.includes('can you') || 
        content.includes('could you')) {
      return AgentIntent.COMMAND;
    }
    
    // Navigation intent
    if (content.includes('go to') || 
        content.includes('navigate to') || 
        content.includes('show me') || 
        content.includes('open')) {
      return AgentIntent.NAVIGATION;
    }
    
    // Search intent
    if (content.includes('search for') || 
        content.includes('find') || 
        content.includes('look up')) {
      return AgentIntent.SEARCH;
    }
    
    // Create intent
    if (content.includes('create') || 
        content.includes('make') || 
        content.includes('add')) {
      return AgentIntent.CREATE;
    }
    
    // Update intent
    if (content.includes('update') || 
        content.includes('change') || 
        content.includes('modify')) {
      return AgentIntent.UPDATE;
    }
    
    // Delete intent
    if (content.includes('delete') || 
        content.includes('remove') || 
        content.includes('get rid of')) {
      return AgentIntent.DELETE;
    }
    
    // Default to question intent
    return AgentIntent.QUESTION;
  }
  
  /**
   * Process a message with the appropriate agent
   * 
   * @param message The message to process
   * @param agentType The type of agent to use
   * @param intent The detected intent
   * @returns Promise resolving to the agent response
   */
  private async processWithAgent(
    message: Message,
    agentType: AgentType,
    intent: AgentIntent
  ): Promise<MessageResponse> {
    // In a real implementation, this would call different agent implementations
    // For now, we'll simulate the response
    
    if (this.config.enableLogging) {
      logger.log(`Processing with agent: ${agentType}, intent: ${intent}`);
    }
    
    // For voice agent, optimize the response for speech
    if (agentType === AgentType.VOICE) {
      return {
        content: `I processed your voice request: "${message.content}" with intent ${intent}`,
        metadata: {
          intent,
          agentType,
          isVoiceOptimized: true
        }
      };
    }
    
    // For other agent types, return a generic response
    return {
      content: `I processed your request with the ${agentType} agent.`,
      metadata: {
        intent,
        agentType
      }
    };
  }
} 