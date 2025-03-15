import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ProjectCategory, ProjectStatus, ProjectPriority, EnvironmentalStatus, EnvironmentalDocumentType, ProjectPhaseName } from '@/types/project';

// Define the structure for custom wizard fields
export interface CustomField {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[]; // For select fields
  defaultValue?: string | number | boolean;
  category: WizardCategory; // Which section this field belongs to
}

export type WizardCategory = 
  | 'basic'
  | 'location'
  | 'funding' 
  | 'environmental'
  | 'construction'
  | 'scoring'
  | 'benefits'
  | 'attachments'
  | 'custom';

export interface WizardStep {
  id: WizardCategory;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
  required: boolean;
}

export interface ScoringCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
}

export interface ProjectWizardConfig {
  steps: WizardStep[];
  customFields: CustomField[];
  scoringCriteria: ScoringCriteria[];
  projectCategories: ProjectCategory[];
  projectStatuses: ProjectStatus[];
  projectPriorities: ProjectPriority[];
  environmentalStatuses: EnvironmentalStatus[];
  environmentalDocumentTypes: EnvironmentalDocumentType[];
  projectPhaseNames: ProjectPhaseName[];
  allowAiAssistance: boolean;
  requireApproval: boolean;
  enabledClientTypes: string[]; // E.g., 'transportation', 'construction', etc.
}

// Define a default wizard configuration
const defaultWizardConfig: ProjectWizardConfig = {
  steps: [
    { id: 'basic', title: 'Basic Information', description: 'Project name, description and basic details', enabled: true, order: 1, required: true },
    { id: 'location', title: 'Location & Mapping', description: 'Geographic location and mapping details', enabled: true, order: 2, required: true },
    { id: 'funding', title: 'Funding & Budget', description: 'Project budget and funding sources', enabled: true, order: 3, required: true },
    { id: 'environmental', title: 'Environmental Documentation', description: 'NEPA/CEQA status and documentation', enabled: true, order: 4, required: false },
    { id: 'construction', title: 'Project Timeline', description: 'Phases, milestones, and deadlines', enabled: true, order: 5, required: false },
    { id: 'scoring', title: 'Project Scoring', description: 'Score the project across multiple criteria', enabled: true, order: 6, required: false },
    { id: 'benefits', title: 'Benefits & Metrics', description: 'Expected benefits and performance metrics', enabled: true, order: 7, required: false },
    { id: 'attachments', title: 'Attachments', description: 'Upload supporting documents', enabled: true, order: 8, required: false },
    { id: 'custom', title: 'Additional Fields', description: 'Custom fields specific to your organization', enabled: true, order: 9, required: false },
  ],
  customFields: [],
  scoringCriteria: [
    { id: 'safety', name: 'Safety', description: 'Reduces accidents and improves safety for all road users', weight: 20, enabled: true },
    { id: 'equity', name: 'Equity', description: 'Provides benefits to disadvantaged communities', weight: 15, enabled: true },
    { id: 'climate', name: 'Climate', description: 'Reduces greenhouse gas emissions and supports climate goals', weight: 15, enabled: true },
    { id: 'congestion', name: 'Congestion Relief', description: 'Reduces traffic congestion and improves travel times', weight: 20, enabled: true },
    { id: 'costEffectiveness', name: 'Cost Effectiveness', description: 'Provides good value for the investment', weight: 15, enabled: true },
    { id: 'multimodal', name: 'Multimodal', description: 'Supports multiple transportation modes', weight: 15, enabled: true },
  ],
  projectCategories: ['Transit', 'Highway', 'Pedestrian', 'Bicycle', 'Multimodal', 'Bridge', 'Safety', 'Operational', 'Technology', 'Planning', 'Other'],
  projectStatuses: ['Planned', 'Approved', 'In Progress', 'On Hold', 'Delayed', 'Completed', 'Cancelled'],
  projectPriorities: ['Low', 'Medium', 'High', 'Critical'],
  environmentalStatuses: ['Not Started', 'In Progress', 'Exempt', 'Completed', 'Not Required'],
  environmentalDocumentTypes: [
    'Categorical Exclusion',
    'FONSI',
    'EIS',
    'EIR',
    'Negative Declaration',
    'Mitigated Negative Declaration',
    'Statutory Exemption',
    'Categorical Exemption',
    'Not Required',
    'Other'
  ],
  projectPhaseNames: [
    'Planning',
    'Preliminary Engineering',
    'Environmental Documentation',
    'Design',
    'Right of Way',
    'PS&E',
    'Construction',
    'Project Closeout'
  ],
  allowAiAssistance: true,
  requireApproval: false,
  enabledClientTypes: ['transportation', 'construction'],
};

// Create the context with default values
interface ProjectWizardContextType {
  config: ProjectWizardConfig;
  updateConfig: (config: Partial<ProjectWizardConfig>) => void;
  addCustomField: (field: CustomField) => void;
  removeCustomField: (fieldId: string) => void;
  updateCustomField: (fieldId: string, updates: Partial<CustomField>) => void;
  updateScoringCriteria: (criteriaId: string, updates: Partial<ScoringCriteria>) => void;
  addScoringCriteria: (criteria: ScoringCriteria) => void;
  removeScoringCriteria: (criteriaId: string) => void;
  resetToDefault: () => void;
  isStepEnabled: (stepId: WizardCategory) => boolean;
  getEnabledSteps: () => WizardStep[];
}

const ProjectWizardContext = createContext<ProjectWizardContextType | undefined>(undefined);

interface ProjectWizardProviderProps {
  children: ReactNode;
}

export const ProjectWizardProvider: React.FC<ProjectWizardProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<ProjectWizardConfig>(defaultWizardConfig);

  const updateConfig = (updates: Partial<ProjectWizardConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const addCustomField = (field: CustomField) => {
    setConfig(prev => ({
      ...prev,
      customFields: [...prev.customFields, field]
    }));
  };

  const removeCustomField = (fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f.id !== fieldId)
    }));
  };

  const updateCustomField = (fieldId: string, updates: Partial<CustomField>) => {
    setConfig(prev => ({
      ...prev,
      customFields: prev.customFields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const updateScoringCriteria = (criteriaId: string, updates: Partial<ScoringCriteria>) => {
    setConfig(prev => ({
      ...prev,
      scoringCriteria: prev.scoringCriteria.map(criteria => 
        criteria.id === criteriaId ? { ...criteria, ...updates } : criteria
      )
    }));
  };

  const addScoringCriteria = (criteria: ScoringCriteria) => {
    setConfig(prev => ({
      ...prev,
      scoringCriteria: [...prev.scoringCriteria, criteria]
    }));
  };

  const removeScoringCriteria = (criteriaId: string) => {
    setConfig(prev => ({
      ...prev,
      scoringCriteria: prev.scoringCriteria.filter(c => c.id !== criteriaId)
    }));
  };

  const resetToDefault = () => {
    setConfig(defaultWizardConfig);
  };

  const isStepEnabled = (stepId: WizardCategory) => {
    const step = config.steps.find(s => s.id === stepId);
    return step ? step.enabled : false;
  };

  const getEnabledSteps = () => {
    return config.steps
      .filter(step => step.enabled)
      .sort((a, b) => a.order - b.order);
  };

  return (
    <ProjectWizardContext.Provider value={{
      config,
      updateConfig,
      addCustomField,
      removeCustomField,
      updateCustomField,
      updateScoringCriteria,
      addScoringCriteria,
      removeScoringCriteria,
      resetToDefault,
      isStepEnabled,
      getEnabledSteps
    }}>
      {children}
    </ProjectWizardContext.Provider>
  );
};

export const useProjectWizard = (): ProjectWizardContextType => {
  const context = useContext(ProjectWizardContext);
  if (context === undefined) {
    throw new Error('useProjectWizard must be used within a ProjectWizardProvider');
  }
  return context;
}; 