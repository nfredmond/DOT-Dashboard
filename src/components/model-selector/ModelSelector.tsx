'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModel } from '@/lib/models/model-context';
import { ModelBadge } from './ModelBadge';




import { ModelType, ModelCapabilities } from '@/lib/models/model-types';

/**
 * Props for the ModelSelector component
 */
export interface ModelSelectorProps {
  /**
   * The currently selected model ID
   */
  value?: string;
  
  /**
   * Callback fired when a model is selected
   * @param model The selected model object
   */
  onChange?: (model: ModelType) => void;
  
  /**
   * Required capabilities that models must have to be included
   */
  requiredCapabilities?: Partial<ModelCapabilities>;
  
  /**
   * Label displayed above the selector
   * @default "Model"
   */
  label?: string;
  
  /**
   * Placeholder text shown when no model is selected
   * @default "Select model..."
   */
  placeholder?: string;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * ModelSelector Component
 * 
 * A dropdown component that allows users to select an AI model from available options. 
 * The component supports filtering models by capabilities and showing model details.
 * 
 * Features:
 * - Display available models in a dropdown with provider icons
 * - Filter models based on required capabilities (thinking, vision, research, code)
 * - Show model badges indicating capabilities
 * - Support for custom model selection
 * - Integration with application-wide model context
 * 
 * @example
 * ```tsx
 * // Basic usage with default settings
 * <ModelSelector />
 * 
 * // With specific capabilities filter
 * <ModelSelector requiredCapabilities={{ thinking: true }} />
 * 
 * // With custom label and placeholder
 * <ModelSelector label="Select Research Model" placeholder="Choose a model..." />
 * 
 * // With onChange handler
 * <ModelSelector onChange={(model) => console.log('Selected model:', model)} />
 * ```
 */
export function ModelSelector({
  onChange,
  taskRequirements,
  allowCustomModels = true,
  className = '',
}: ModelSelectorProps) {
  const {
    selectedModel,
    setSelectedModel,
    standardModels,
    customModels,
  } = useModel();

  // Filter models based on task requirements if provided
  const filteredStandardModels = taskRequirements
    ? standardModels.filter(model =>
        (taskRequirements.requiresThinking ? model.capabilities.thinking : true) &&
        (taskRequirements.requiresVision ? model.capabilities.vision : true) &&
        (taskRequirements.requiresResearch ? model.capabilities.research : true) &&
        (taskRequirements.requiresCodeGen ? model.capabilities.codeGeneration : true)
      )
    : standardModels;

  const filteredCustomModels = taskRequirements
    ? customModels.filter(model =>
        (taskRequirements.requiresThinking ? model.capabilities.thinking : true) &&
        (taskRequirements.requiresVision ? model.capabilities.vision : true) &&
        (taskRequirements.requiresResearch ? model.capabilities.research : true) &&
        (taskRequirements.requiresCodeGen ? model.capabilities.codeGeneration : true)
      )
    : customModels;

  /**
   * Handle model selection change
   */
  const handleChange = (modelId: string) => {
    // Find the selected model
    const model = [...standardModels, ...customModels].find(m => m.id === modelId);
    if (!model) return;
    
    // Update the selected model
    setSelectedModel(model);
    
    // Call the onChange handler if provided
    if (onChange) {
      onChange(model);
    }
  };

  return (
    <Select
      value={selectedModel.id}
      onValueChange={handleChange}
    >
      <SelectTrigger className={`w-[280px] ${className}`}>
        <SelectValue placeholder="Select model">
          <div className="flex items-center space-x-2">
            <ModelBadge model={selectedModel} />
            <span>{selectedModel.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      
      <SelectContent>
        {/* Standard models group */}
        {filteredStandardModels.length > 0 && (
          <SelectGroup>
            <SelectLabel>Standard Models</SelectLabel>
            {filteredStandardModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center space-x-2">
                  <ModelBadge model={model} />
                  <span>{model.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        
        {/* Custom models group (optional) */}
        {allowCustomModels && filteredCustomModels.length > 0 && (
          <SelectGroup>
            <SelectLabel>Custom Models</SelectLabel>
            {filteredCustomModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center space-x-2">
                  <ModelBadge model={model} />
                  <span>{model.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
} 