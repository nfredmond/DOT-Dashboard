import { getEnvVariable } from "./env-service";
import { openai } from '@/lib/openai-service';
import type { ChatCompletionMessageParam } from 'openai/resources';

// LLM providers
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  META = 'meta',
}

// Model types to use based on the task complexity and requirements
export enum ModelType {
  FAST = 'fast',      // For quick, simple responses
  BALANCED = 'balanced', // Good balance of quality and speed
  POWERFUL = 'powerful',  // For complex analysis and generation
}

// Template categories for transportation planning
export enum PromptTemplate {
  PROJECT_SUMMARY = 'project_summary',
  GRANT_ANALYSIS = 'grant_analysis',
  ENVIRONMENTAL_IMPACT = 'environmental_impact',
  PUBLIC_ENGAGEMENT = 'public_engagement',
  EQUITY_ASSESSMENT = 'equity_assessment',
  MOBILITY_ANALYSIS = 'mobility_analysis',
}

// Response formats
export enum ResponseFormat {
  TEXT = 'text',
  JSON = 'json',
  MARKDOWN = 'markdown',
}

interface LLMOptions {
  provider?: LLMProvider;
  modelType?: ModelType;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
}

/**
 * Get the API key for the specified LLM provider
 * @param provider The LLM provider
 * @returns The API key
 */
function getApiKey(provider: LLMProvider): string {
  switch (provider) {
    case LLMProvider.OPENAI:
      return getEnvVariable('OPENAI_API_KEY', '');
    case LLMProvider.ANTHROPIC:
      return getEnvVariable('ANTHROPIC_API_KEY', '');
    case LLMProvider.META:
      return getEnvVariable('META_AI_API_KEY', '');
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Get the API endpoint for the specified LLM provider
 * @param provider The LLM provider
 * @returns The API endpoint
 */
function getApiEndpoint(provider: LLMProvider): string {
  switch (provider) {
    case LLMProvider.OPENAI:
      return 'https://api.openai.com/v1/chat/completions';
    case LLMProvider.ANTHROPIC:
      return 'https://api.anthropic.com/v1/messages';
    case LLMProvider.META:
      return 'https://api.llama-api.com/v1/chat/completions'; // Example endpoint, replace with actual
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Map the model type to a specific model from the provider
 * @param provider The LLM provider
 * @param modelType The model type
 * @returns The specific model identifier
 */
function getModelName(provider: LLMProvider, modelType: ModelType): string {
  switch (provider) {
    case LLMProvider.OPENAI:
      switch (modelType) {
        case ModelType.FAST:
          return 'gpt-3.5-turbo';
        case ModelType.BALANCED:
          return 'gpt-4o-mini';
        case ModelType.POWERFUL:
          return 'gpt-4o';
        default:
          return 'gpt-4o-mini';
      }
    case LLMProvider.ANTHROPIC:
      switch (modelType) {
        case ModelType.FAST:
          return 'claude-3-haiku-20240307';
        case ModelType.BALANCED:
          return 'claude-3-7-sonnet-20240620';
        case ModelType.POWERFUL:
          return 'claude-3-opus-20240229';
        default:
          return 'claude-3-7-sonnet-20240620';
      }
    case LLMProvider.META:
      switch (modelType) {
        case ModelType.FAST:
          return 'llama-3-8b';
        case ModelType.BALANCED:
          return 'llama-3-70b';
        case ModelType.POWERFUL:
          return 'llama-3-70b';
        default:
          return 'llama-3-70b';
      }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get a prompt template for a specific task
 * @param template The template type
 * @returns The prompt template
 */
function getPromptTemplate(template: PromptTemplate): string {
  switch (template) {
    case PromptTemplate.PROJECT_SUMMARY:
      return `You are a transportation planning assistant helping to summarize a project. 
      Please create a comprehensive but concise summary of the following transportation project:
      
      PROJECT DETAILS:
      {project_details}
      
      Your summary should include:
      1. Key project goals and objectives
      2. Expected benefits to the community
      3. Timeline and major milestones
      4. Budget overview
      5. Key stakeholders
      
      Keep your response under 500 words and focus on information that would be most relevant to the public and decision-makers.`;
    
    case PromptTemplate.GRANT_ANALYSIS:
      return `You are a transportation grant specialist analyzing a potential funding opportunity. 
      Please assess the following project's fit with the grant requirements:
      
      PROJECT:
      {project_details}
      
      GRANT REQUIREMENTS:
      {grant_requirements}
      
      Please provide:
      1. Overall assessment of project-grant alignment (scale 1-10)
      2. Key strengths of the application
      3. Potential weaknesses or gaps
      4. Specific recommendations to improve alignment
      5. Suggested performance metrics to include
      
      Focus on concrete, actionable feedback to maximize the chance of securing funding.`;
    
    case PromptTemplate.ENVIRONMENTAL_IMPACT:
      return `You are an environmental impact specialist evaluating a transportation project. 
      Based on the following project details, provide an assessment of potential environmental impacts:
      
      PROJECT:
      {project_details}
      
      Please include:
      1. Summary of potential environmental impacts (positive and negative)
      2. Key areas requiring detailed study
      3. Potential mitigation strategies
      4. Relevant environmental regulations to consider
      5. Recommendations for minimizing negative impacts
      
      Your analysis should be balanced, acknowledging both potential benefits and concerns.`;
    
    case PromptTemplate.PUBLIC_ENGAGEMENT:
      return `You are a public engagement specialist for transportation projects.
      Based on the following project details, suggest an effective public engagement strategy:
      
      PROJECT:
      {project_details}
      
      COMMUNITY CONTEXT:
      {community_context}
      
      Please provide:
      1. Overall engagement approach
      2. Key stakeholder groups to target
      3. Recommended engagement formats (meetings, surveys, etc.)
      4. Potential discussion topics and questions
      5. Strategies for reaching underrepresented communities
      
      Focus on creating inclusive, meaningful engagement that will gather valuable feedback and build community support.`;
    
    case PromptTemplate.EQUITY_ASSESSMENT:
      return `You are an equity analysis specialist for transportation projects.
      Please assess the equity implications of the following project:
      
      PROJECT:
      {project_details}
      
      DEMOGRAPHIC DATA:
      {demographic_data}
      
      Please provide:
      1. Overall equity assessment
      2. Potential benefits to disadvantaged communities
      3. Potential burdens or concerns
      4. Recommendations for improving equity outcomes
      5. Suggested metrics for monitoring equity impacts
      
      Your analysis should consider factors such as access, affordability, safety, and community impact across different demographic groups.`;
    
    case PromptTemplate.MOBILITY_ANALYSIS:
      return `You are a mobility analyst evaluating a transportation project.
      Based on the following information, assess how the project will affect mobility in the area:
      
      PROJECT:
      {project_details}
      
      CURRENT CONDITIONS:
      {current_conditions}
      
      Please provide:
      1. Expected changes to travel times
      2. Impacts on different transportation modes
      3. Accessibility improvements
      4. Potential bottlenecks or concerns
      5. Recommendations for maximizing mobility benefits
      
      Consider all transportation modes (driving, transit, walking, cycling) and effects on different trip purposes (commuting, shopping, recreation, etc.).`;
    
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

/**
 * Standard interface for sending completion request to an LLM provider
 * @param prompt The prompt to send
 * @param options Configuration options
 * @returns The model response
 */
export async function getCompletion(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const {
    provider = LLMProvider.OPENAI,
    modelType = ModelType.BALANCED,
    temperature = 0.7,
    maxTokens = 1000,
    responseFormat = ResponseFormat.TEXT
  } = options;

  const apiKey = getApiKey(provider);
  if (!apiKey) {
    throw new Error(`API key not configured for ${provider}. Please check your environment variables.`);
  }

  const endpoint = getApiEndpoint(provider);
  const model = getModelName(provider, modelType);

  try {
    let requestBody: any;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Format request based on provider
    switch (provider) {
      case LLMProvider.OPENAI:
        headers['Authorization'] = `Bearer ${apiKey}`;
        requestBody = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
          ...(responseFormat === ResponseFormat.JSON ? { response_format: { type: 'json_object' } } : {})
        };
        break;
        
      case LLMProvider.ANTHROPIC:
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        requestBody = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        };
        break;
        
      case LLMProvider.META:
        headers['Authorization'] = `Bearer ${apiKey}`;
        requestBody = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        };
        break;
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Extract response text based on provider format
    let responseText: string;
    switch (provider) {
      case LLMProvider.OPENAI:
        responseText = data.choices[0].message.content;
        break;
      case LLMProvider.ANTHROPIC:
        // Ensure proper handling of different content block types
        const content = data.content[0];
        if (content && 'text' in content) {
          responseText = content.text;
        } else {
          responseText = ""; // Fallback if the content block doesn't have text
        }
        break;
      case LLMProvider.META:
        responseText = data.choices[0].message.content;
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return responseText;
  } catch (error) {
    console.error(`Error calling ${provider} API:`, error);
    throw error;
  }
}

/**
 * Generate a project summary
 * @param projectDetails The project details
 * @param options LLM options
 * @returns A summary of the project
 */
export async function generateProjectSummary(
  projectDetails: string,
  options: LLMOptions = {}
): Promise<string> {
  const template = getPromptTemplate(PromptTemplate.PROJECT_SUMMARY);
  const prompt = template.replace('{project_details}', projectDetails);
  
  return getCompletion(prompt, options);
}

/**
 * Analyze a grant opportunity for a project
 * @param projectDetails The project details
 * @param grantRequirements The grant requirements
 * @param options LLM options
 * @returns An analysis of the project's fit with the grant
 */
export async function analyzeGrantOpportunity(
  projectDetails: string,
  grantRequirements: string,
  options: LLMOptions = {}
): Promise<string> {
  const template = getPromptTemplate(PromptTemplate.GRANT_ANALYSIS);
  const prompt = template
    .replace('{project_details}', projectDetails)
    .replace('{grant_requirements}', grantRequirements);
  
  return getCompletion(prompt, {
    ...options,
    modelType: ModelType.POWERFUL, // Use powerful model for grant analysis
  });
}

/**
 * Assess the environmental impact of a project
 * @param projectDetails The project details
 * @param options LLM options
 * @returns An environmental impact assessment
 */
export async function assessEnvironmentalImpact(
  projectDetails: string,
  options: LLMOptions = {}
): Promise<string> {
  const template = getPromptTemplate(PromptTemplate.ENVIRONMENTAL_IMPACT);
  const prompt = template.replace('{project_details}', projectDetails);
  
  return getCompletion(prompt, options);
}

/**
 * Generate a public engagement strategy
 * @param projectDetails The project details
 * @param communityContext Information about the community
 * @param options LLM options
 * @returns A public engagement strategy
 */
export async function generatePublicEngagementStrategy(
  projectDetails: string,
  communityContext: string,
  options: LLMOptions = {}
): Promise<string> {
  const template = getPromptTemplate(PromptTemplate.PUBLIC_ENGAGEMENT);
  const prompt = template
    .replace('{project_details}', projectDetails)
    .replace('{community_context}', communityContext);
  
  return getCompletion(prompt, options);
}

/**
 * Assess the equity implications of a project
 * @param projectDetails The project details
 * @param demographicData Demographic data about the area
 * @param options LLM options
 * @returns An equity assessment
 */
export async function assessEquityImplications(
  projectDetails: string,
  demographicData: string,
  options: LLMOptions = {}
): Promise<string> {
  const template = getPromptTemplate(PromptTemplate.EQUITY_ASSESSMENT);
  const prompt = template
    .replace('{project_details}', projectDetails)
    .replace('{demographic_data}', demographicData);
  
  return getCompletion(prompt, {
    ...options,
    modelType: ModelType.POWERFUL, // Use powerful model for equity assessment
  });
}

/**
 * Analyze mobility impacts of a project
 * @param projectDetails The project details
 * @param currentConditions Information about current transportation conditions
 * @param options LLM options
 * @returns A mobility analysis
 */
export async function analyzeMobilityImpacts(
  projectDetails: string,
  currentConditions: string,
  options: LLMOptions = {}
): Promise<string> {
  const template = getPromptTemplate(PromptTemplate.MOBILITY_ANALYSIS);
  const prompt = template
    .replace('{project_details}', projectDetails)
    .replace('{current_conditions}', currentConditions);
  
  return getCompletion(prompt, options);
}

/**
 * LLM Service
 * 
 * Provides functionality for processing text through language models
 */

// Types for LLM processing
export interface LLMProcessOptions {
  text: string;
  context?: Record<string, any>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Process text through a language model
 * 
 * @param options Options for processing the text
 * @returns The processed text response
 */
export async function processWithLLM(options: LLMProcessOptions): Promise<string> {
  try {
    const {
      text,
      context = {},
      model = 'gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt
    } = options;
    
    // Prepare the messages array
    const messages: ChatCompletionMessageParam[] = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    } else {
      // Default system prompt
      messages.push({
        role: 'system',
        content: 'You are a helpful AI assistant for a transportation planning application. ' +
          'Provide accurate, concise, and relevant information to the user\'s query.'
      });
    }
    
    // Add context if available
    if (Object.keys(context).length > 0) {
      const contextString = JSON.stringify(context, null, 2);
      messages.push({
        role: 'system',
        content: `Current context information:\n${contextString}`
      });
    }
    
    // Add the user's message
    messages.push({
      role: 'user',
      content: text
    });
    
    // Send to the OpenAI API
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    });
    
    // Return the generated text
    return response.choices[0]?.message?.content || 'No response generated';
    
  } catch (error) {
    console.error('Error processing with LLM:', error);
    throw new Error(`LLM processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
} 