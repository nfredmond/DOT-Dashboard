// Project data model types
import { CAMPModelResults } from './camp';
import { ScenarioDefinition, ScenarioResults, ScenarioComparison } from './trend-navigator';
import { BenefitCostAnalysis, BenefitCostAnalysisResult } from './benefit-cost';

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
  netPresentValue?: number;
  internalRateOfReturn?: number;
  paybackPeriod?: number;
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
  id?: string;
  name: string;
  description?: string;
  location?: string;
  type?: string;
  status?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  category?: string;
  priority?: string;
  geoJson?: any;
  scoreData?: Record<ProjectScoreCategory, number>;
  analysisResults?: Record<string, AnalysisResult>;
  scenarios?: ScenarioAnalysis[];
  
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
  
  // CAMP and TrendNavigator integration
  campModelRuns?: CAMPModelResults[];
  trendScenarios?: ScenarioDefinition[];
  trendResults?: ScenarioResults[];
  scenarioComparisons?: ScenarioComparison[];
  selectedBaselineScenarioId?: string;
  selectedAlternativeScenarioIds?: string[];
  
  // Benefit-Cost Analysis integration
  benefitCostAnalyses?: BenefitCostAnalysis[];
  selectedBenefitCostAnalysisId?: string;
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
  | "custom"
  | "camp"
  | "trend-navigator";

// Scenario Analysis
export interface ScenarioAnalysis {
  id: string;
  name: string;
  description: string;
  timeline?: string;
  cost?: number;
  benefits?: string[];
  drawbacks?: string[];
  feasibility?: number;
  createdAt?: string;
  updatedBy?: string;
  
  // Link to CAMP and TrendNavigator
  campModelRunId?: string;
  trendScenarioId?: string;
}

// Collision severity types
export type CollisionSeverity = 'fatal' | 'severe' | 'visible' | 'complaint' | 'pdo';
export type CollisionType = 'pedestrian' | 'bicycle' | 'motorcycle' | 'vehicle' | 'fixed_object' | 'other';

export interface CollisionData {
  totalCollisions: number;
  collisionsPerYear: number;
  collisionsPerMile: number;
  collisionRate: number;
  severityCounts: Record<CollisionSeverity, number>;
  typeCounts: Record<CollisionType, number>;
  timeOfDayCounts: {
    morning: number;
    midday: number;
    evening: number;
    night: number;
  };
  weatherCounts: {
    clear: number;
    rain: number;
    snow: number;
    fog: number;
    other: number;
  };
  hotspots: Array<{
    location: string;
    description: string;
    collisionCount: number;
  }>;
  years: number;
  radius: number;
  location: string;
  source: string;
  lastUpdated: string;
}

export interface AgeDistribution {
  under18: number;
  age18to24: number;
  age25to44: number;
  age45to64: number;
  age65Plus: number;
}

export interface EthnicityDistribution {
  white: number;
  black: number;
  hispanic: number;
  asian: number;
  nativeAmerican: number;
  pacificIslander: number;
  multiRacial: number;
  other: number;
}

export interface DemographicData {
  totalPopulation: number;
  medianIncome: number;
  percentMinority: number;
  percentLowIncome: number;
  percentWithDisability: number;
  percentWithoutVehicle: number;
  ageDistribution?: AgeDistribution;
  ethnicityDistribution?: EthnicityDistribution;
  source?: string;
  year?: number;
}

export enum ProjectScoreCategory {
  SAFETY = 'safety',
  EQUITY = 'equity',
  ENVIRONMENTAL = 'environmental',
  ECONOMIC = 'economic',
  FEASIBILITY = 'feasibility',
  OVERALL = 'overall'
}

// Analysis result types
export enum AnalysisType {
  CAMP_MODEL = 'camp_model',
  TREND_SCENARIO = 'trend_scenario',
  SAFETY = 'safety',
  EQUITY = 'equity',
  ENVIRONMENTAL = 'environmental',
  ECONOMIC = 'economic',
  BENEFIT_COST = 'benefit_cost'
}

export interface AnalysisResult {
  id: string;
  type: AnalysisType;
  name: string;
  description?: string;
  summary: string;
  date: string;
  data: any; // Specific to the analysis type
  scores?: Record<string, number>; // Scoring by category
  createdBy: string;
  aiGenerated: boolean;
}

// CAMP Specific Analysis
export interface CAMPAnalysisResult extends AnalysisResult {
  type: AnalysisType.CAMP_MODEL;
  data: {
    modelRunId: string;
    baselineModelRunId?: string;
    keyMetrics: {
      totalTrips: number;
      vmt: number;
      vht: number;
      modeShares: Record<string, number>;
      tripsByPurpose: Record<string, number>;
    };
    comparisons?: {
      vmtChange: number;
      vhtChange: number;
      modeShareChanges: Record<string, number>;
      congestionChanges: Record<string, number>;
    };
  };
}

// TrendNavigator Specific Analysis
export interface TrendScenarioAnalysisResult extends AnalysisResult {
  type: AnalysisType.TREND_SCENARIO;
  data: {
    scenarioId: string;
    baselineScenarioId?: string;
    horizonYears: number[];
    keyMetrics: Record<number, {
      vmt: number;
      ght: number;
      modeShares: Record<string, number>;
      accessibility: number;
      equity: number;
    }>;
    trendImpacts: {
      trendName: string;
      impactDescription: string;
      magnitude: number;
    }[];
    policyImpacts?: {
      policyName: string;
      impactDescription: string;
      magnitude: number;
    }[];
  };
}

export interface BenefitCostAnalysisResult extends AnalysisResult {
  type: AnalysisType.BENEFIT_COST;
  data: {
    analysisId: string;
    baselineAnalysisId?: string;
    keyMetrics: {
      netPresentValue: number;
      benefitCostRatio: number;
      internalRateOfReturn?: number;
      paybackPeriod?: number;
    };
    benefitBreakdown: Record<string, number>;
    costBreakdown: Record<string, number>;
    sensitivityResults?: {
      criticalVariables: string[];
      switchingPoints: Record<string, number>;
    };
    distributionalResults?: {
      equityScore: number;
      demographicImpacts: Record<string, number>;
    };
  };
} 