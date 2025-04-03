/**
 * Model Types Module
 * 
 * This module defines the core type system for AI models used throughout the application.
 * It includes model capabilities, provider information, and predefined model configurations.
 * 
 * The type system is designed to:
 * - Support multiple model providers (Anthropic, OpenAI, etc.)
 * - Track model capabilities (thinking, vision, research, code generation)
 * - Allow for custom model configurations
 * - Provide default models for different tasks
 * 
 * @example
 * ```tsx
 * // Access predefined models
 * const defaultModel = DEFAULT_MODEL;
 * const researchModel = RESEARCH_MODEL;
 * 
 * // Check model capabilities
 * if (model.capabilities.thinking) {
 *   // Use thinking capabilities...
 * }
 * 
 * // Create custom model configuration
 * const customModel: ModelType = {
 *   id: 'my-custom-model',
 *   name: 'My Custom Model',
 *   provider: 'anthropic',
 *   apiEndpoint: 'https://api.anthropic.com/v1/messages',
 *   capabilities: {
 *     thinking: true,
 *     vision: false,
 *     research: true,
 *     code: false
 *   }
 * };
 * ```
 */

/**
 * Supported model providers in the application
 * - anthropic: Models from Anthropic (Claude family)
 * - openai: Models from OpenAI (GPT family)
 * - meta: Models from Meta (Llama family)
 * - google: Models from Google (Gemma family)
 * - deepseek: Models from DeepSeek (DeepSeek family)
 * - xai: Models from xAI (Grok family)
 * - custom: User-defined custom models
 */
export type ModelProvider = 
  | 'anthropic' 
  | 'openai' 
  | 'meta' 
  | 'google' 
  | 'deepseek'
  | 'xai'
  | 'custom';

/**
 * Capabilities that an AI model can have
 */
export interface ModelCapabilities {
  /**
   * Can perform multi-step reasoning
   */
  thinking: boolean;
  
  /**
   * Supports streaming responses
   */
  streaming: boolean;
  
  /**
   * Can process and analyze images
   */
  vision: boolean;
  
  /**
   * Supports function calling
   */
  functionCalling: boolean;
  
  /**
   * Supports longer context windows
   */
  longContext: boolean;
  
  /**
   * Proficient at code generation and analysis
   */
  codeGeneration: boolean;
  
  /**
   * Specialized for research tasks
   */
  research: boolean;
}

/**
 * Core model type definition
 */
export interface ModelType {
  /**
   * Unique identifier for the model
   */
  id: string;
  
  /**
   * Display name of the model
   */
  name: string;
  
  /**
   * Provider ID (e.g., 'anthropic', 'openai')
   */
  provider: string;
  
  /**
   * Model capabilities
   */
  capabilities: ModelCapabilities;
  
  /**
   * API endpoint for the model
   */
  apiEndpoint?: string;
  
  /**
   * Whether this is a custom user-defined model
   */
  isCustom?: boolean;
  
  /**
   * Additional model-specific configuration
   */
  config?: Record<string, any>;
}

/**
 * Base interface for all AI models in the application
 * 
 * @property id - Unique identifier for the model
 * @property name - Display name of the model
 * @property provider - The provider of the model
 * @property maxTokens - Maximum number of tokens the model can process
 * @property capabilities - Capability flags for the model
 * @property contextWindow - Size of the context window in tokens
 * @property description - Human-readable description of the model
 * @property priority - Priority order (lower number = higher priority)
 * @property isDefault - Whether this is the default model
 * @property isCustom - Whether this is a user-defined custom model
 */
export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  maxTokens: number;
  capabilities: ModelCapabilities;
  contextWindow: number;
  description: string;
  priority: number; // Lower number = higher priority
  isDefault?: boolean;
  isCustom?: boolean;
}

/**
 * Standard models available in the application, in order of priority
 * 1. Claude 3.7 Sonnet Thinking (default)
 * 2. Claude 3.7 Sonnet
 * 3. OpenAI o3-mini
 * 4. OpenAI o3-mini-thinking
 * 5. OpenAI o1-pro (research)
 * 6. Meta Llama 3
 * 7. Google GEMMA 3
 * 8. DeepSeek R1
 * 9. xAI Grok 3
 * 10. xAI Grok 3 Thinking
 */
export const standardModels: AIModel[] = [
  {
    id: 'claude-3-7-sonnet-thinking',
    name: 'Claude 3.7 Sonnet Thinking',
    provider: 'anthropic',
    maxTokens: 200000,
    capabilities: {
      thinking: true,
      streaming: true,
      vision: true,
      functionCalling: true,
      longContext: true,
      codeGeneration: true,
      research: true,
    },
    contextWindow: 200000,
    description: 'Most powerful Claude model with thinking capabilities for complex reasoning',
    priority: 1,
    isDefault: true
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    maxTokens: 200000,
    capabilities: {
      thinking: false,
      streaming: true,
      vision: true,
      functionCalling: true,
      longContext: true,
      codeGeneration: true,
      research: true,
    },
    contextWindow: 200000,
    description: 'Fast and powerful Claude model for general tasks',
    priority: 2
  },
  {
    id: 'openai-o3-mini',
    name: 'OpenAI o3-mini',
    provider: 'openai',
    maxTokens: 128000,
    capabilities: {
      thinking: false,
      streaming: true,
      vision: true,
      functionCalling: true,
      longContext: true,
      codeGeneration: true,
      research: false,
    },
    contextWindow: 128000,
    description: 'Compact OpenAI model with good performance',
    priority: 3
  },
  {
    id: 'openai-o3-mini-thinking',
    name: 'OpenAI o3-mini-thinking',
    provider: 'openai',
    maxTokens: 128000,
    capabilities: {
      thinking: true,
      streaming: true,
      vision: true,
      functionCalling: true,
      longContext: true,
      codeGeneration: true,
      research: false,
    },
    contextWindow: 128000,
    description: 'Compact OpenAI model with thinking capabilities',
    priority: 4
  },
  {
    id: 'openai-o1-pro',
    name: 'OpenAI o1-pro',
    provider: 'openai',
    maxTokens: 128000,
    capabilities: {
      thinking: false,
      streaming: true,
      vision: true,
      functionCalling: true,
      longContext: true,
      codeGeneration: false,
      research: true,
    },
    contextWindow: 128000,
    description: 'Research-oriented model for deep thinking tasks',
    priority: 5
  },
  {
    id: 'meta-llama-3',
    name: 'Llama 3',
    provider: 'meta',
    maxTokens: 100000,
    capabilities: {
      thinking: false,
      streaming: true,
      vision: false,
      functionCalling: true,
      longContext: true,
      codeGeneration: true,
      research: false,
    },
    contextWindow: 100000,
    description: 'Meta\'s open-source model with strong general capabilities',
    priority: 6
  },
  {
    id: 'google-gemma-3',
    name: 'GEMMA 3',
    provider: 'google',
    maxTokens: 128000,
    capabilities: {
      thinking: false,
      streaming: true,
      vision: true,
      functionCalling: true,
      longContext: true,
      codeGeneration: true,
      research: false,
    },
    contextWindow: 128000,
    description: 'Google\'s versatile general-purpose model',
    priority: 7
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    maxTokens: 128000,
    capabilities: {
      thinking: false,
      streaming: true,
      vision: false,
      functionCalling: true,
      longContext: true,
      codeGeneration: true,
      research: false,
    },
    contextWindow: 128000,
    description: 'DeepSeek\'s powerful reasoning model',
    priority: 8
  },
  {
    id: 'xai-grok-3',
    name: 'Grok 3',
    provider: 'xai',
    maxTokens: 128000,
    capabilities: {
      thinking: false,
      streaming: true,
      vision: true,
      functionCalling: true,
      longContext: true,
      codeGeneration: true,
      research: false,
    },
    contextWindow: 128000,
    description: 'xAI\'s generalist model with witty responses',
    priority: 9
  },
  {
    id: 'xai-grok-3-thinking',
    name: 'Grok 3 Thinking',
    provider: 'xai',
    maxTokens: 128000,
    capabilities: {
      thinking: true,
      streaming: true,
      vision: true,
      functionCalling: true,
      longContext: true,
      codeGeneration: true,
      research: false,
    },
    contextWindow: 128000,
    description: 'xAI\'s model with thinking capabilities for complex tasks',
    priority: 10
  }
];

/**
 * Gets the default model, which is the model with isDefault=true or the first model if none is marked as default
 * Currently, Claude 3.7 Sonnet Thinking is the default model
 * 
 * @returns The default AI model
 */
export function getDefaultModel(): AIModel {
  const defaultModel = standardModels.find(model => model.isDefault);
  return defaultModel || standardModels[0];
}

/**
 * Creates a custom model with the provided parameters
 * 
 * @param id - Unique identifier for the custom model
 * @param name - Display name for the custom model
 * @param provider - The provider of the model
 * @param contextWindow - Size of the context window in tokens (defaults to 4000)
 * @param capabilities - Optional capability flags to override defaults
 * @returns A new custom AIModel instance
 */
export function createCustomModel(
  id: string,
  name: string,
  provider: ModelProvider,
  contextWindow: number = 4000,
  capabilities: Partial<ModelCapabilities> = {}
): AIModel {
  return {
    id,
    name,
    provider,
    maxTokens: contextWindow,
    contextWindow,
    capabilities: {
      thinking: false,
      streaming: true,
      vision: false,
      functionCalling: false,
      longContext: false,
      codeGeneration: false,
      research: false,
      ...capabilities
    },
    description: `Custom model: ${name}`,
    priority: 999,
    isCustom: true
  };
} 