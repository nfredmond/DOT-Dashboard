// Project data model types

// Project status options
export type ProjectStatus = 
  | "Draft" 
  | "Planning" 
  | "Approved" 
  | "In Progress" 
  | "On Hold" 
  | "Completed" 
  | "Cancelled";

// Project category options
export type ProjectCategory = 
  | "Highway" 
  | "Transit" 
  | "Bicycle" 
  | "Pedestrian" 
  | "Multimodal" 
  | "Safety" 
  | "Bridge" 
  | "Maintenance"
  | "ITS"
  | "Planning Study"
  | "Other";

// Project funding source options
export type FundingSource = 
  | "Federal" 
  | "State" 
  | "Local" 
  | "Private" 
  | "Grant" 
  | "Mixed";

// NEPA/CEQA document types
export type EnvironmentalDocumentType = 
  | "Categorical Exclusion (CE)" 
  | "Categorical Exemption (CE)" 
  | "Environmental Assessment (EA)" 
  | "Finding of No Significant Impact (FONSI)" 
  | "Environmental Impact Report (EIR)" 
  | "Environmental Impact Statement (EIS)" 
  | "Mitigated Negative Declaration (MND)" 
  | "Negative Declaration (ND)"
  | "Joint NEPA/CEQA Document"
  | "Exempt"
  | "Other";

// Project phase options
export type ProjectPhase = 
  | "Planning" 
  | "Preliminary Engineering" 
  | "Environmental" 
  | "Design" 
  | "Right of Way" 
  | "PS&E" 
  | "Construction" 
  | "Close-out";

// Project scoring criteria
export interface ScoringCriteria {
  safety: number;
  equity: number;
  climate: number;
  congestion: number;
  costEffectiveness: number;
  multimodal: number;
  economicProsperity?: number;
  accessibility?: number;
  stateOfGoodRepair?: number;
  smartMobility?: number;
  vmtReduction?: number;
  ghgReduction?: number;
  publicHealth?: number;
  [key: string]: number | undefined; // For custom criteria
}

// Project funding details
export interface ProjectFunding {
  totalCost: number;
  securedFunding: number;
  fundingGap: number;
  fundingSources: {
    source: string;
    amount: number;
    secured: boolean;
    fiscalYear?: string;
  }[];
  pse: number; // Plans, Specifications & Estimates
  rightOfWay: number;
  construction: number;
  ce: number; // Construction Engineering
  environmentalMitigation?: number;
  contingency?: number;
  [key: string]: any; // For custom funding categories
}

// Environmental compliance
export interface EnvironmentalCompliance {
  documentType: EnvironmentalDocumentType;
  leadAgency: string;
  startDate?: Date;
  completionDate?: Date;
  clearanceDate?: Date;
  permitRequirements?: string[];
  mitigationRequirements?: string[];
  ghgImpact?: number; // In metric tons CO2e
  vmtImpact?: number; // Vehicle miles traveled impact
}

// Project geographic data
export interface ProjectGeography {
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  geometry?: any; // GeoJSON geometry
  length?: number; // In miles for linear projects
  area?: number; // In square miles for area projects
}

// Project schedule
export interface ProjectSchedule {
  planningStart?: Date;
  planningEnd?: Date;
  environmentalStart?: Date;
  environmentalEnd?: Date;
  designStart?: Date;
  designEnd?: Date;
  rightOfWayStart?: Date;
  rightOfWayEnd?: Date;
  constructionStart?: Date;
  constructionEnd?: Date;
  milestones: {
    name: string;
    date: Date;
    completed: boolean;
    description?: string;
  }[];
}

// Transportation metrics
export interface TransportationMetrics {
  vmtReduction?: number;
  ghgReduction?: number;
  congestionReduction?: number;
  safetyImprovement?: number;
  multimodalBenefit?: number;
  jobsCreated?: number;
  travelTimeReduction?: number;
  accessibilityImprovement?: number;
  equityScore?: number;
  costBenefitRatio?: number;
  [key: string]: number | undefined; // For custom metrics
}

// Custom fields configuration
export interface CustomFieldConfig {
  id: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[]; // For select type
  required?: boolean;
  defaultValue?: any;
}

// Main Project interface
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  category: ProjectCategory;
  phase: ProjectPhase;
  lead: string; // Project manager/lead
  sponsor: string; // Agency/organization
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  
  // Core project details
  funding: ProjectFunding;
  schedule: ProjectSchedule;
  geography: ProjectGeography;
  environmental: EnvironmentalCompliance;
  
  // Scoring and metrics
  scoringCriteria: ScoringCriteria;
  transportationMetrics: TransportationMetrics;
  
  // Additional fields
  stakeholders?: string[];
  documents?: {
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }[];
  notes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  
  // Visibility and access control
  isPublic: boolean;
  accessUsers?: string[];
  accessGroups?: string[];

  // Integration with mapping
  mapType?: string;
  layers?: string[];
}

// Project template for creating new projects
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  defaultFields: Partial<Project>;
  customFieldConfigs: CustomFieldConfig[];
  wizardSteps: string[];
}

// AI data ingestion request
export interface ProjectDataIngestionRequest {
  rawData: string;
  format?: string;
  projectIds?: string[]; // For updating existing projects
  createNew?: boolean;
  templateId?: string; // For using a specific template
}

// Project wizard step type
export type WizardStepType = 
  | "basic"
  | "funding"
  | "schedule"
  | "geography"
  | "environmental"
  | "scoring"
  | "metrics"
  | "custom"; 