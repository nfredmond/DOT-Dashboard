'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AIModel, getDefaultModel } from './model-types';
import { ModelService } from './model-service';

/**
 * Type definition for the Model Context
 * Provides access to model selection state and functions
 */
interface ModelContextType {
  /** Currently selected model */
  selectedModel: AIModel;
  
  /** All available models (standard + custom) */
  availableModels: AIModel[];
  
  /** Only standard (built-in) models */
  standardModels: AIModel[];
  
  /** Only user-defined custom models */
  customModels: AIModel[];
  
  /** Function to change the selected model */
  setSelectedModel: (model: AIModel) => void;
  
  /** Function to add a new custom model */
  addCustomModel: (model: AIModel) => AIModel;
  
  /** Function to remove a custom model by ID */
  removeCustomModel: (modelId: string) => boolean;
  
  /** Function to check if the current model is suitable for a task */
  isModelSuitableForTask: (taskRequirements: {
    requiresThinking?: boolean;
    requiresVision?: boolean;
    requiresResearch?: boolean;
    requiresCodeGen?: boolean;
  }) => boolean;
  
  /** Function to get all models suitable for a task */
  getModelsForTask: (taskRequirements: {
    requiresThinking?: boolean;
    requiresVision?: boolean;
    requiresResearch?: boolean;
    requiresCodeGen?: boolean;
  }) => AIModel[];
  
  /** Function to get the best model for a task */
  getBestModelForTask: (taskRequirements: {
    requiresThinking?: boolean;
    requiresVision?: boolean;
    requiresResearch?: boolean;
    requiresCodeGen?: boolean;
  }) => AIModel;
}

// Create context with default values
const ModelContext = createContext<ModelContextType>({
  selectedModel: getDefaultModel(),
  availableModels: [],
  standardModels: [],
  customModels: [],
  setSelectedModel: () => {},
  addCustomModel: () => getDefaultModel(),
  removeCustomModel: () => false,
  isModelSuitableForTask: () => true,
  getModelsForTask: () => [],
  getBestModelForTask: () => getDefaultModel(),
});

// Provider props
interface ModelProviderProps {
  children: ReactNode;
}

/**
 * Model Provider Component
 * 
 * Provides model selection context to the application.
 * Manages:
 * - Selected model state
 * - Available models (standard and custom)
 * - Model selection persistence
 * - Task-specific model recommendations
 * 
 * This provider should be placed high in the component tree
 * to make model selection available throughout the application.
 * 
 * @example
 * ```tsx
 * <ModelProvider>
 *   <App />
 * </ModelProvider>
 * ```
 */
export function ModelProvider({ children }: ModelProviderProps) {
  // State for models
  const [selectedModel, setSelectedModelState] = useState<AIModel>(getDefaultModel());
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [standardModels, setStandardModels] = useState<AIModel[]>([]);
  const [customModels, setCustomModels] = useState<AIModel[]>([]);

  // Initialize on client side only
  useEffect(() => {
    // Load models
    const allModels = ModelService.getAllModels();
    const stdModels = ModelService.getStandardModels();
    const custModels = ModelService.getCustomModels();
    
    setAvailableModels(allModels);
    setStandardModels(stdModels);
    setCustomModels(custModels);
    
    // Load selected model
    const selectedModelId = ModelService.getSelectedModelId();
    const model = allModels.find(m => m.id === selectedModelId) || getDefaultModel();
    setSelectedModelState(model);
  }, []);

  /**
   * Sets the selected model and persists the selection
   */
  const setSelectedModel = (model: AIModel) => {
    setSelectedModelState(model);
    ModelService.setSelectedModelId(model.id);
  };

  /**
   * Adds a custom model to the application
   */
  const addCustomModel = (model: AIModel): AIModel => {
    const addedModel = ModelService.addCustomModel(model);
    setCustomModels(ModelService.getCustomModels());
    setAvailableModels(ModelService.getAllModels());
    return addedModel;
  };

  /**
   * Removes a custom model from the application
   */
  const removeCustomModel = (modelId: string): boolean => {
    const removed = ModelService.removeCustomModel(modelId);
    if (removed) {
      setCustomModels(ModelService.getCustomModels());
      setAvailableModels(ModelService.getAllModels());
      
      // If this was the selected model, update state
      if (selectedModel.id === modelId) {
        const defaultModel = getDefaultModel();
        setSelectedModelState(defaultModel);
      }
    }
    return removed;
  };

  /**
   * Checks if the currently selected model is suitable for a task
   */
  const isModelSuitableForTask = (taskRequirements: {
    requiresThinking?: boolean;
    requiresVision?: boolean;
    requiresResearch?: boolean;
    requiresCodeGen?: boolean;
  }): boolean => {
    return ModelService.isModelSuitableForTask(selectedModel, taskRequirements);
  };

  /**
   * Gets all models suitable for a task
   */
  const getModelsForTask = (taskRequirements: {
    requiresThinking?: boolean;
    requiresVision?: boolean;
    requiresResearch?: boolean;
    requiresCodeGen?: boolean;
  }): AIModel[] => {
    return ModelService.getModelsForTask(taskRequirements);
  };

  /**
   * Gets the best model for a task
   */
  const getBestModelForTask = (taskRequirements: {
    requiresThinking?: boolean;
    requiresVision?: boolean;
    requiresResearch?: boolean;
    requiresCodeGen?: boolean;
  }): AIModel => {
    return ModelService.getBestModelForTask(taskRequirements);
  };

  // Build context value
  const value = {
    selectedModel,
    availableModels,
    standardModels,
    customModels,
    setSelectedModel,
    addCustomModel,
    removeCustomModel,
    isModelSuitableForTask,
    getModelsForTask,
    getBestModelForTask,
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
}

/**
 * Custom hook for accessing the model context
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { selectedModel, setSelectedModel } = useModel();
 *   
 *   return (
 *     <div>Current model: {selectedModel.name}</div>
 *   );
 * }
 * ```
 */
export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
} 