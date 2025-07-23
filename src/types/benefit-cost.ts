// import { AnalysisType } from './project';

export enum BenefitCostAnalysisMethod {
  NET_PRESENT_VALUE = 'net_present_value',
  BENEFIT_COST_RATIO = 'benefit_cost_ratio',
  INTERNAL_RATE_OF_RETURN = 'internal_rate_of_return',
  PAYBACK_PERIOD = 'payback_period'
}

export enum BenefitCategory {
  TRAVEL_TIME_SAVINGS = 'Travel Time Savings',
  RELIABILITY = 'Reliability',
  SAFETY = 'Safety',
  EMISSIONS = 'Emissions',
  VEHICLE_OPERATING_COSTS = 'Vehicle Operating Costs',
  HEALTH = 'Health',
  PROPERTY_VALUE = 'Property Value',
  ECONOMIC_DEVELOPMENT = 'Economic Development',
  OTHER = 'Other'
}

export enum CostCategory {
  CAPITAL = 'Capital',
  MAINTENANCE = 'Maintenance',
  OPERATIONS = 'Operations',
  VEHICLES = 'Vehicles',
  OTHER = 'Other'
}

export interface BenefitCostParameter {
  id: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  description?: string;
  source?: string;
  yearValid?: number;
  adjustmentFactor?: number;
}

export interface BenefitCostTimeSeries {
  year: number;
  value: number;
  presentValue?: number;
  category: string;
  subcategory?: string;
  notes?: string;
}

export interface BenefitValueCalculation {
  category: BenefitCategory;
  totalValue: number;
  annualValues: BenefitCostTimeSeries[];
  presentValue: number;
  parameters: Record<string, any>;
  notes?: string;
  id?: string;
  description?: string;
  annualValue?: number;
  growthRate?: number;
}

export interface CostValueCalculation {
  category: CostCategory;
  totalValue: number;
  annualValues: BenefitCostTimeSeries[];
  presentValue: number;
  parameters: Record<string, any>;
  notes?: string;
  id?: string;
  description?: string;
  annualValue?: number;
  growthRate?: number;
}

export interface MonetizationParameters {
  // Keep the index signature for backward compatibility
  [key: string]: number | string | object | undefined;
  
  // Structured parameters for various benefit categories
  valueOfTime?: {
    commuter: number;
    commercial: number;
    freight: number;
  };
  
  // Emissions costs
  emissions?: {
    co2: number; // $ per metric ton
    nox: number; // $ per ton
    pm: number;  // $ per ton
  };
  
  // Safety/accident costs
  accidentCosts?: {
    fatal: number;     // $ per fatal accident
    injury: number;    // $ per injury accident
    propertyDamage: number; // $ per PDO accident
  };
  
  // Vehicle operating costs
  vehicleOperating?: {
    fuelCost: number;     // $ per gallon
    maintenance: number;  // $ per mile
    depreciation: number; // $ per mile
  };
  
  // Health benefits
  health?: {
    walking: number; // $ per mile walked
    biking: number;  // $ per mile biked
  };
  
  // Legacy fields for backward compatibility
  valueOfTime_legacy?: number;
  fatalityCost?: number;
  injuryCost?: number;
  emissionsCostPerTon?: number;
}

export interface SensitivityAnalysis {
  id: string;
  name: string;
  description?: string;
  parameters: {
    parameterName: string;
    baseValue: number;
    lowValue: number;
    highValue: number;
  }[];
  results: {
    parameterName: string;
    lowValueResult: number;
    baseValueResult: number;
    highValueResult: number;
    impact: number; // Percentage change
  }[];
  switchingPoints?: {
    parameterName: string;
    switchingValue: number;
    switchingMetric: string;
  }[];
}

export interface DistributionalAnalysis {
  id: string;
  name: string;
  description?: string;
  demographicGroups: string[];
  benefitDistribution: Record<string, number>;
  costDistribution: Record<string, number>;
  netBenefitDistribution: Record<string, number>;
  equityMetrics: Record<string, number>;
}

export interface MonteCarloSimulation {
  id: string;
  name: string;
  description?: string;
  parameters: {
    parameterName: string;
    distribution: 'normal' | 'uniform' | 'triangular' | 'custom';
    mean?: number;
    standardDeviation?: number;
    min?: number;
    max?: number;
    mode?: number;
    customValues?: number[];
  }[];
  iterations: number;
  results: {
    metric: string;
    mean: number;
    median: number;
    standardDeviation: number;
    percentiles: {
      p5: number;
      p10: number;
      p25: number;
      p75: number;
      p90: number;
      p95: number;
    };
    probabilityPositive: number;
    probabilityThreshold?: {
      threshold: number;
      probability: number;
    };
  }[];
  simulationData?: any; // Full simulation results if stored
}

export interface BenefitCostAnalysis {
  id: string;
  projectId: string;
  scenarioId?: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Core analysis parameters
  discountRate: number;
  baseYear: number;
  analysisHorizon: number;
  
  // Results by method
  netPresentValue: number;
  benefitCostRatio: number;
  internalRateOfReturn?: number;
  paybackPeriod?: number;
  
  // Detailed calculations
  benefits: BenefitValueCalculation[];
  costs: CostValueCalculation[];
  
  // Annual streams
  annualBenefits: BenefitCostTimeSeries[];
  annualCosts: BenefitCostTimeSeries[];
  
  // Monetization parameters used
  parameters: MonetizationParameters;
  
  // Risk and sensitivity analysis
  sensitivityAnalysis?: SensitivityAnalysis;
  monteCarloSimulation?: MonteCarloSimulation;
  distributionalAnalysis?: DistributionalAnalysis;
  
  // Flags and metadata
  isPublic: boolean;
  status: 'draft' | 'reviewed' | 'final';
  methodology: string;
  assumptions: string[];
  limitations: string[];
  tags: string[];
}

export interface BenefitCostAnalysisResult extends BenefitCostAnalysis {
  comparisonId?: string;
  baseline?: {
    netPresentValue: number;
    benefitCostRatio: number;
    internalRateOfReturn?: number;
    paybackPeriod?: number;
  };
  incremental?: {
    netPresentValue: number;
    benefitCostRatio: number;
    internalRateOfReturn?: number;
    paybackPeriod?: number;
  };
  summary: string;
  insights: string[];
  recommendations: string[];
  aiGenerated: boolean;
}

export interface BenefitCostTemplate {
  id: string;
  name: string;
  description: string;
  parameters: MonetizationParameters;
  benefitCategories: BenefitCategory[];
  costCategories: CostCategory[];
  defaultDiscountRate: number;
  defaultAnalysisHorizon: number;
  methodologies?: BenefitCostAnalysisMethod[];
  sensitivityDefaults?: {
    parameters: string[];
    lowAdjustment: number;
    highAdjustment: number;
  };
  distributionalDefaults?: {
    demographicGroups: string[];
  };
  grantProgram?: {
    name: string;
    requirements: string[];
    thresholds: { minBCR?: number; [key: string]: any };
  };
}

export interface BenefitItem {
  id: string;
  category: BenefitCategory;
  description?: string;
  annualValue: number;
  growthRate: number;
  presentValue: number;
}

export interface CostItem {
  id: string;
  category: CostCategory;
  description?: string;
  annualValue: number;
  growthRate: number;
  presentValue: number;
}

export interface BenefitCostCashFlow {
  year: number;
  benefits: number;
  costs: number;
  net: number;
  cumulative: number;
} 