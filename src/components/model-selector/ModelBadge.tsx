'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AIModel, ModelProvider } from '@/lib/models/model-types';
import { 
  Brain, 
  Code, 
  Search, 
  Eye, 
  Zap,
  Settings,
  BookOpen
} from 'lucide-react';

/**
 * Color mappings for different model providers
 * Each provider has a unique color scheme for visual distinction
 */
const providerColors: Record<ModelProvider, string> = {
  'anthropic': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'openai': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'meta': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'google': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'deepseek': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  'xai': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'custom': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

/**
 * Short abbreviations to display in model badges
 * These are compact representations of each provider
 */
const providerShortNames: Record<ModelProvider, string> = {
  'anthropic': 'ANT',
  'openai': 'OAI',
  'meta': 'META',
  'google': 'GOOG',
  'deepseek': 'DS',
  'xai': 'XAI',
  'custom': 'CUST',
};

/**
 * Props for the ModelBadge component
 */
interface ModelBadgeProps {
  /** The model to display */
  model: AIModel;
  
  /** Whether to show capability icons */
  showCapabilities?: boolean;
  
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ModelBadge Component
 * 
 * Displays a visual badge for an AI model, showing:
 * - Provider (with color coding)
 * - Default status (if applicable)
 * - Model capabilities (optional)
 * 
 * Used in model selection interfaces, settings pages, and anywhere
 * models need to be visually identified.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ModelBadge model={someModel} />
 * 
 * // With capabilities shown
 * <ModelBadge model={someModel} showCapabilities={true} />
 * 
 * // Small size
 * <ModelBadge model={someModel} size="sm" />
 * ```
 */
export function ModelBadge({ 
  model, 
  showCapabilities = false,
  size = 'md' 
}: ModelBadgeProps) {
  const providerColor = providerColors[model.provider] || providerColors.custom;
  const sizeClasses = {
    'sm': 'text-xs px-1.5 py-0.5',
    'md': 'text-sm px-2 py-1',
    'lg': 'text-base px-2.5 py-1.5'
  };
  
  return (
    <div className="flex items-center gap-1.5">
      {/* Provider badge */}
      <Badge 
        variant="outline" 
        className={`${providerColor} ${sizeClasses[size]} font-mono flex items-center gap-1`}
      >
        {providerShortNames[model.provider]}
        {model.isDefault && <span className="ml-1">•</span>}
      </Badge>
      
      {/* Optional capability icons */}
      {showCapabilities && (
        <div className="flex gap-0.5">
          {model.capabilities.thinking && (
            <Badge variant="outline" className="p-1" title="Thinking capabilities">
              <Brain className="h-3 w-3" />
            </Badge>
          )}
          {model.capabilities.codeGeneration && (
            <Badge variant="outline" className="p-1" title="Code generation capabilities">
              <Code className="h-3 w-3" />
            </Badge>
          )}
          {model.capabilities.research && (
            <Badge variant="outline" className="p-1" title="Research capabilities">
              <Search className="h-3 w-3" />
            </Badge>
          )}
          {model.capabilities.vision && (
            <Badge variant="outline" className="p-1" title="Vision capabilities">
              <Eye className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
} 