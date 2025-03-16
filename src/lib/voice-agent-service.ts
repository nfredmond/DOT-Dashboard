/**
 * Voice Agent Service
 * 
 * Provides functionality for processing voice commands through the agent system.
 * This service acts as the bridge between voice input and the application's
 * intelligent agent capabilities.
 * 
 * Features:
 * - Speech transcription using Whisper
 * - Command processing through LLM
 * - Integration with Model Context Protocol (MCP)
 * - Response generation using LLM or Agent
 * - Special command handling
 * 
 * @module voice-agent-service
 */

import { transcribeSpeech, VoiceSettings, defaultVoiceSettings } from './voice-service';
import type { AgentContext } from './agent-sdk';
import { processWithLLM } from '@/lib/llm-service';
import { MCPRequest, MCPResponse, processWithMCP } from '@/lib/mcp-service';

/**
 * Result of processing a voice command
 * 
 * @property command - The transcribed voice command
 * @property processed - Whether the command was successfully processed
 * @property response - The response text to the command
 * @property action - Optional action to take (e.g., 'take_screenshot')
 * @property metadata - Optional additional data from processing
 */
export interface VoiceCommandResult {
  command?: string;
  processed: boolean;
  response?: string;
  action?: string;
  metadata?: Record<string, any>;
}

/**
 * Types of voice commands that can be processed
 */
export enum VoiceCommandType {
  NAVIGATION = 'navigation',
  ACTION = 'action',
  QUESTION = 'question',
  PROJECT_SEARCH = 'project_search',
  PROJECT_CREATE = 'project_create',
  PROJECT_UPDATE = 'project_update',
  TOOL_INVOKE = 'tool_invoke',
  UNKNOWN = 'unknown'
}

export interface VoiceCommandOptions {
  settings?: VoiceSettings;
  context?: AgentContext;
  useAutoResponse?: boolean;
}

/**
 * Process a voice command from audio
 * 
 * This function:
 * 1. Transcribes the audio to text using the specified STT model
 * 2. Processes the command through MCP and Agent systems
 * 3. Returns the results including a response and any actions to take
 * 
 * @param audioBlob - The audio blob containing the voice command
 * @param options - Processing options including context and settings
 * @returns Result of the command processing
 * 
 * @example
 * ```ts
 * const result = await processVoiceCommand(audioBlob, {
 *   context: { currentPage: 'dashboard' },
 *   settings: { 
 *     sttModel: 'whisper',
 *     autoReadResponses: true
 *   }
 * });
 * 
 * console.log(`Command: ${result.command}`);
 * console.log(`Response: ${result.response}`);
 * if (result.action) {
 *   console.log(`Action: ${result.action}`);
 * }
 * ```
 */
export async function processVoiceCommand(
  audioBlob: Blob,
  options: {
    context?: AgentContext;
    settings?: VoiceSettings;
    useAutoResponse?: boolean;
  } = {}
): Promise<VoiceCommandResult> {
  try {
    const settings = options.settings || defaultVoiceSettings;
    
    // Step 1: Transcribe the audio to text
    const transcription = await transcribeSpeech(audioBlob, settings);
    
    if (!transcription.trim()) {
      return {
        command: "",
        processed: false,
        response: "I couldn't understand the audio. Could you please speak more clearly?"
      };
    }
    
    // Step 2: Process special commands if enabled
    if (settings.enableVoiceCommands) {
      const normalizedCommand = transcription.toLowerCase().trim();
      
      // Handle special system commands
      
      // Take screenshot command
      if (normalizedCommand.includes('take screenshot') || 
          normalizedCommand.includes('capture screen') ||
          normalizedCommand.includes('screenshot')) {
        
        return {
          command: transcription,
          processed: true,
          response: 'Taking screenshot',
          action: 'take_screenshot'
        };
      }
      
      // Stop recording command
      if (normalizedCommand === 'stop recording' || 
          normalizedCommand === 'stop listening') {
        
        return {
          command: transcription,
          processed: true,
          response: 'Stopped recording',
          action: 'stop_recording'
        };
      }
      
      // Cancel command
      if (normalizedCommand === 'cancel' || 
          normalizedCommand === 'nevermind') {
        
        return {
          command: transcription,
          processed: true,
          response: 'Cancelled',
          action: 'cancel'
        };
      }
    }
    
    // Step 3: Prepare context for the LLM/MCP/Agent
    const context: AgentContext = {
      ...(options.context || {}),
      isVoiceInput: true,
      voiceSettings: settings
    };
    
    // Step 4: Process the command through our LLM and MCP
    // Import these dynamically to avoid circular dependencies
    const { processWithLLM } = await import('./llm-service');
    const { processWithMCP } = await import('./mcp-service');
    
    // Get initial response from LLM
    const llmResponse = await processWithLLM({
      text: transcription,
      context
    });
    
    // Process through MCP to handle model context protocol
    const mcpResponse = await processWithMCP({
      input: transcription,
      response: llmResponse,
      context
    });
    
    // Step 5: Process through Agent SDK if needed
    let finalResponse = mcpResponse.output || llmResponse;
    let metadata = mcpResponse.metadata || {};
    
    if (mcpResponse.shouldUseAgent) {
      // Import the AgentSDK class from the module
      const { AgentSDK } = await import('./agent-sdk');
      const agentSdk = new AgentSDK();
      const agentMessage = {
        role: 'user' as const,
        content: transcription,
        context
      };
      
      const agentResponse = await agentSdk.processMessage(agentMessage);
      finalResponse = agentResponse.content;
      metadata = { ...metadata, ...agentResponse.metadata };
    }
    
    // Return the processed result
    return {
      command: transcription,
      processed: true,
      response: finalResponse,
      action: mcpResponse.action,
      metadata
    };
  } catch (error) {
    console.error('Error processing voice command:', error);
    
    return {
      processed: false,
      response: `Error processing command: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Handle special voice commands that bypass the LLM/MCP/Agent pipeline
 * 
 * @param command The transcribed command text
 * @param settings Voice settings
 * @returns The result of processing the special command
 */
function handleSpecialCommand(
  command: string,
  settings: VoiceSettings
): VoiceCommandResult {
  // Convert to lowercase for easier matching
  const normalizedCommand = command.toLowerCase().trim();
  
  // Don't process special commands if setting is disabled
  if (!settings.enableVoiceCommands) {
    return { command, processed: false };
  }
  
  // Special command: take screenshot
  if (normalizedCommand.includes('take screenshot') || 
      normalizedCommand.includes('capture screen') ||
      normalizedCommand.includes('screenshot')) {
    
    return {
      command,
      processed: true,
      response: 'Taking screenshot',
      action: 'take_screenshot'
    };
  }
  
  // Special command: stop listening
  if (normalizedCommand.includes('stop listening') || 
      normalizedCommand.includes('stop recording')) {
    
    return {
      command,
      processed: true,
      response: 'Stopping voice recording',
      action: 'stop_recording'
    };
  }
  
  // Special command: cancel
  if (normalizedCommand === 'cancel' || 
      normalizedCommand === 'stop' || 
      normalizedCommand === 'nevermind') {
    
    return {
      command,
      processed: true,
      response: 'Cancelled',
      action: 'cancel'
    };
  }
  
  // No special command matched
  return { command, processed: false };
}

/**
 * Process a text command directly (without audio transcription)
 * 
 * This function is similar to processVoiceCommand but accepts text input directly 
 * instead of an audio blob, bypassing the transcription step.
 * 
 * @param command - The text command to process
 * @param options - Processing options including context and settings
 * @returns Result of the command processing
 * 
 * @example
 * ```ts
 * const result = await processWithTextCommand("What's the weather today?", {
 *   context: { currentPage: 'dashboard' },
 *   settings: defaultVoiceSettings
 * });
 * 
 * console.log(`Response: ${result.response}`);
 * if (result.action) {
 *   console.log(`Action: ${result.action}`);
 * }
 * ```
 */
export async function processWithTextCommand(
  command: string,
  options: {
    context?: AgentContext;
    settings?: VoiceSettings;
  } = {}
): Promise<VoiceCommandResult> {
  try {
    const settings = options.settings || defaultVoiceSettings;
    
    if (!command.trim()) {
      return {
        command: "",
        processed: false,
        response: "No command text provided."
      };
    }
    
    // Process special commands if enabled
    if (settings.enableVoiceCommands) {
      const normalizedCommand = command.toLowerCase().trim();
      
      // Handle special system commands
      
      // Take screenshot command
      if (normalizedCommand.includes('take screenshot') || 
          normalizedCommand.includes('capture screen') ||
          normalizedCommand.includes('screenshot')) {
        
        return {
          command,
          processed: true,
          response: 'Taking screenshot',
          action: 'take_screenshot'
        };
      }
      
      // Cancel command
      if (normalizedCommand === 'cancel' || 
          normalizedCommand === 'nevermind') {
        
        return {
          command,
          processed: true,
          response: 'Cancelled',
          action: 'cancel'
        };
      }
    }
    
    // Prepare context for the LLM/MCP/Agent
    const context: AgentContext = {
      ...(options.context || {}),
      isTextInput: true,
      voiceSettings: settings
    };
    
    // Process the command through our LLM and MCP
    // Import these dynamically to avoid circular dependencies
    const { processWithLLM } = await import('./llm-service');
    const { processWithMCP } = await import('./mcp-service');
    
    // Get initial response from LLM
    const llmResponse = await processWithLLM({
      text: command,
      context
    });
    
    // Process through MCP to handle model context protocol
    const mcpResponse = await processWithMCP({
      input: command,
      response: llmResponse,
      context
    });
    
    // Process through Agent SDK if needed
    let finalResponse = mcpResponse.output || llmResponse;
    let metadata = mcpResponse.metadata || {};
    
    if (mcpResponse.shouldUseAgent) {
      // Import the AgentSDK class from the module
      const { AgentSDK } = await import('./agent-sdk');
      const agentSdk = new AgentSDK();
      const agentMessage = {
        role: 'user' as const,
        content: command,
        context
      };
      
      const agentResponse = await agentSdk.processMessage(agentMessage);
      finalResponse = agentResponse.content;
      metadata = { ...metadata, ...agentResponse.metadata };
    }
    
    // Return the processed result
    return {
      command,
      processed: true,
      response: finalResponse,
      action: mcpResponse.action,
      metadata
    };
  } catch (error) {
    console.error('Error processing text command:', error);
    
    return {
      command,
      processed: false,
      response: `Error processing command: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 