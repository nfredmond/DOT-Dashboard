/**
 * AI Service
 * 
 * Provides a client for AI-powered features in the application.
 * Supports multiple providers (OpenAI, Anthropic) with a unified interface.
 */

import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Define interface for AI client
interface AIClient {
  complete(options: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    stop?: string | string[];
  }): Promise<string>;
}

// OpenAI client implementation
class OpenAIClient implements AIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async complete(options: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    stop?: string | string[];
  }): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: options.prompt }],
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      stop: options.stop
    });

    return response.choices[0]?.message?.content || '';
  }
}

// Anthropic client implementation
class AnthropicClient implements AIClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(options: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    stop?: string | string[];
  }): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      system: 'You are an expert transportation planner and analyst.',
      messages: [{ role: 'user', content: options.prompt }],
      stop_sequences: Array.isArray(options.stop) ? options.stop : options.stop ? [options.stop] : undefined
    });

    return response.content[0]?.text || '';
  }
}

// Factory function to get the appropriate AI client
export async function getAIClient(): Promise<AIClient> {
  // Check for environment variables
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  
  // Preferred provider setting, default to the one we have a key for
  const preferredProvider = process.env.PREFERRED_AI_PROVIDER || 
    (anthropicApiKey ? 'anthropic' : 'openai');
  
  // Try to use the preferred provider first
  if (preferredProvider === 'anthropic' && anthropicApiKey) {
    console.log('Using Anthropic Claude for AI services');
    return new AnthropicClient(anthropicApiKey);
  } else if (preferredProvider === 'openai' && openaiApiKey) {
    console.log('Using OpenAI GPT for AI services');
    return new OpenAIClient(openaiApiKey);
  }
  
  // Fallback to any available provider
  if (anthropicApiKey) {
    console.log('Falling back to Anthropic Claude for AI services');
    return new AnthropicClient(anthropicApiKey);
  } else if (openaiApiKey) {
    console.log('Falling back to OpenAI GPT for AI services');
    return new OpenAIClient(openaiApiKey);
  }
  
  // If no API keys are available, throw an error
  throw new Error('No AI provider API keys found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variables.');
}

// Utility function to stream AI responses
export async function streamAIResponse(
  prompt: string, 
  onChunk: (chunk: string) => void,
  options: {
    max_tokens?: number;
    temperature?: number;
    stop?: string | string[];
  } = {}
): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not found. Streaming requires OpenAI.');
  }
  
  const openai = new OpenAI({ apiKey: openaiApiKey });
  let fullResponse = '';
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: options.max_tokens,
    temperature: options.temperature,
    stop: options.stop,
    stream: true
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullResponse += content;
      onChunk(content);
    }
  }
  
  return fullResponse;
} 