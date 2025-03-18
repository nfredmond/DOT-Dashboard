import { AIModel, standardModels, getDefaultModel } from './model-types';

/**
 * Storage keys for persisting model preferences
 */
const CUSTOM_MODELS_STORAGE_KEY = 'planning-manager-custom-models';
const SELECTED_MODEL_STORAGE_KEY = 'planning-manager-selected-model';

/**
 * Model Service
 * 
 * This service manages AI models used throughout the application. It provides:
 * 
 * - Model registration and discovery
 * - Filtering models by capabilities
 * - Task-specific model selection
 * - Custom model management
 * - Storage of user model preferences
 * 
 * The service maintains a registry of all available models, each with their
 * specific capabilities and configuration. Models can be filtered based on
 * required capabilities (thinking, vision, research, code generation).
 * 
 * @example
 * ```tsx
 * // Get all available models
 * const models = getAvailableModels();
 * 
 * // Get models with specific capabilities
 * const thinkingModels = getModelsWithCapability('thinking');
 * const visionModels = getModelsWithCapability('vision');
 * 
 * // Get the best model for a specific task
 * const researchModel = getBestModelForTask('research');
 * ```
 */
export class ModelService {
  /**
   * Gets all available models (standard + custom), sorted by priority
   * Lower priority numbers are returned first
   * 
   * @returns Array of all available AI models
   */
  static getAllModels(): AIModel[] {
    const customModels = this.getCustomModels();
    return [...standardModels, ...customModels].sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Gets only the standard (built-in) models, sorted by priority
   * 
   * @returns Array of standard models
   */
  static getStandardModels(): AIModel[] {
    return [...standardModels].sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Gets user-defined custom models from localStorage
   * This is only available on the client side
   * 
   * @returns Array of custom models, or empty array if none found
   */
  static getCustomModels(): AIModel[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const customModelsJson = localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY);
      if (!customModelsJson) return [];
      
      const customModels = JSON.parse(customModelsJson) as AIModel[];
      return customModels.map(model => ({
        ...model,
        isCustom: true
      }));
    } catch (error) {
      console.error('Error loading custom models:', error);
      return [];
    }
  }
  
  /**
   * Adds a custom model to the application
   * The model is persisted in localStorage for future sessions
   * 
   * @param model - The model to add
   * @returns The added model with updated properties
   */
  static addCustomModel(model: AIModel): AIModel {
    const customModels = this.getCustomModels();
    
    // Ensure it's marked as custom
    const customModel = {
      ...model,
      isCustom: true,
      priority: 999 + customModels.length,
      isDefault: false
    };
    
    // Add to storage
    const updatedModels = [...customModels, customModel];
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(updatedModels));
    }
    
    return customModel;
  }
  
  /**
   * Removes a custom model from the application
   * If the removed model was the selected model, resets to the default model
   * 
   * @param modelId - ID of the model to remove
   * @returns true if model was found and removed, false otherwise
   */
  static removeCustomModel(modelId: string): boolean {
    const customModels = this.getCustomModels();
    const updatedModels = customModels.filter(model => model.id !== modelId);
    
    if (updatedModels.length === customModels.length) {
      return false; // Model not found
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(updatedModels));
      
      // If this was the selected model, reset to default
      const selectedModelId = this.getSelectedModelId();
      if (selectedModelId === modelId) {
        this.setSelectedModelId(getDefaultModel().id);
      }
    }
    
    return true;
  }
  
  /**
   * Gets the ID of the currently selected model
   * Defaults to the default model if none is selected
   * 
   * @returns The selected model ID
   */
  static getSelectedModelId(): string {
    if (typeof window === 'undefined') {
      return getDefaultModel().id;
    }
    
    const selectedModelId = localStorage.getItem(SELECTED_MODEL_STORAGE_KEY);
    return selectedModelId || getDefaultModel().id;
  }
  
  /**
   * Sets the selected model ID and persists it in localStorage
   * 
   * @param modelId - ID of the model to select
   */
  static setSelectedModelId(modelId: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, modelId);
  }
  
  /**
   * Gets the currently selected model object
   * 
   * @returns The selected model, or default model if the selected one can't be found
   */
  static getSelectedModel(): AIModel {
    const modelId = this.getSelectedModelId();
    const allModels = this.getAllModels();
    
    const model = allModels.find(m => m.id === modelId);
    return model || getDefaultModel();
  }
  
  /**
   * Checks if a specific model is suitable for a given task based on capabilities
   * 
   * @param model - The model to check
   * @param taskRequirements - Required capabilities for the task
   * @returns true if the model meets all requirements, false otherwise
   */
  static isModelSuitableForTask(model: AIModel, taskRequirements: {
    requiresThinking?: boolean;
    requiresVision?: boolean;
    requiresResearch?: boolean;
    requiresCodeGen?: boolean;
  }): boolean {
    const { 
      requiresThinking = false,
      requiresVision = false, 
      requiresResearch = false,
      requiresCodeGen = false
    } = taskRequirements;
    
    if (requiresThinking && !model.capabilities.thinking) return false;
    if (requiresVision && !model.capabilities.vision) return false;
    if (requiresResearch && !model.capabilities.research) return false;
    if (requiresCodeGen && !model.capabilities.codeGeneration) return false;
    
    return true;
  }
  
  /**
   * Gets all models that are suitable for a specific task
   * 
   * @param taskRequirements - Required capabilities for the task
   * @returns Array of suitable models
   */
  static getModelsForTask(taskRequirements: {
    requiresThinking?: boolean;
    requiresVision?: boolean;
    requiresResearch?: boolean;
    requiresCodeGen?: boolean;
  }): AIModel[] {
    return this.getAllModels().filter(model => 
      this.isModelSuitableForTask(model, taskRequirements)
    );
  }
  
  /**
   * Gets the best model for a specific task based on requirements and priority
   * Returns the highest priority (lowest number) model that meets all requirements
   * If no suitable model is found, returns the default model
   * 
   * @param taskRequirements - Required capabilities for the task
   * @returns The best suitable model for the task
   */
  static getBestModelForTask(taskRequirements: {
    requiresThinking?: boolean;
    requiresVision?: boolean;
    requiresResearch?: boolean;
    requiresCodeGen?: boolean;
  }): AIModel {
    const suitableModels = this.getModelsForTask(taskRequirements);
    
    if (suitableModels.length === 0) {
      // No suitable model, return default
      return getDefaultModel();
    }
    
    // Return the highest priority (lowest number) suitable model
    return suitableModels.sort((a, b) => a.priority - b.priority)[0];
  }
} 