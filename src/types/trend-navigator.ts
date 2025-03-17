/**
 * TrendNavigator Types
 * 
 * These types define the structure of TrendNavigator data and features
 */

import { TransportMode, TripPurpose } from './camp';

/**
 * Time horizons for scenario planning
 */
export enum TimeHorizon {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long'
}

// Type alias to allow using both number and TimeHorizon enum values
export type TimeHorizonValue = number | TimeHorizon;

/**
 * Trend categories
 */
export enum TrendCategory {
  DEMOGRAPHIC = 'demographic',
  ECONOMIC = 'economic',
  TECHNOLOGICAL = 'technological',
  SOCIAL = 'social',
  POLICY = 'policy',
  ENVIRONMENTAL = 'environmental'
}

/**
 * Trend confidence levels
 */
export enum TrendConfidence {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Impact magnitude
 */
export enum ImpactMagnitude {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Trend definition
 */
export interface Trend {
  id: string;
  name: string;
  description: string;
  category: TrendCategory;
  baselineValue: number;
  minValue: number;
  maxValue: number;
  unit: string;
  defaultProjection: TrendProjection;
  confidenceLevel: TrendConfidence;
  source?: string;
  impactAreas: string[];
  modifiers: TrendModifier[];
}

/**
 * Policy Intervention
 */
export interface PolicyIntervention {
  id: string;
  name: string;
  description?: string;
  category: string;
  implementationTimeframe: string;
  cost: number;
  impacts: PolicyImpact[];
  feasibility: number;
  stakeholderSupport: number;
}

/**
 * Scenario assumption - a trend with specific values
 */
export interface ScenarioAssumption {
  id: string;
  name: string;
  description?: string;
  category: string;
  baselineValue: number;
  unit: string;
  values: Record<string, number>; // horizonYear -> value
}

/**
 * Assumption trend types
 */
export type TrendType =
  | 'telecommuting'
  | 'e-commerce'
  | 'autonomous-vehicles'
  | 'shared-mobility'
  | 'micro-mobility'
  | 'transit-innovation'
  | 'urban-delivery'
  | 'population-growth'
  | 'employment-shifts';

/**
 * Policy package types
 */
export type PolicyType =
  | 'transit-investment'
  | 'bike-infrastructure'
  | 'pedestrian-infrastructure'
  | 'congestion-pricing'
  | 'parking-management'
  | 'land-use'
  | 'tdd'
  | 'zero-emission-vehicles'
  | 'first-last-mile';

/**
 * Assumption trend for a scenario
 */
export interface Assumption {
  trendId: TrendType;
  intensity: number;  // 0 (low) to 1 (high) intensity
  description?: string;
}

/**
 * Policy package for a scenario
 */
export interface PolicyPackage {
  policyId: PolicyType;
  intensity: number;  // 0 (low) to 1 (high) intensity
  description?: string;
}

/**
 * Scenario definition
 */
export interface Scenario {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  description: string;
  baseYear: number;
  horizonYears: number[];
  assumptions: Assumption[];
  policyPackages: PolicyPackage[];
  tags: string[];
  baseline_scenario_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Detail metrics for specific categories
 */
export interface CategoryMetrics {
  [key: string]: number;
}

/**
 * Overall metrics across all categories
 */
export interface ScenarioMetrics {
  congestion: CategoryMetrics;
  emissions: CategoryMetrics;
  accessibility: CategoryMetrics;
  equity: CategoryMetrics;
  safety: CategoryMetrics;
}

/**
 * Scenario results
 */
export interface ScenarioResults {
  id: string;
  scenarioId: string;
  horizonYears: number[];
  aggregateMetrics: {
    [year: number]: {
      congestionIndex: number;
      emissionsIndex: number;
      accessibilityIndex: number;
      equityIndex: number;
      safetyIndex: number;
      overallIndex: number;
    };
  };
  metrics: {
    [year: number]: ScenarioMetrics;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Key insights for a scenario result
 */
export interface ScenarioInsight {
  category: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  metricChange?: number;
  recommendation?: string;
}

/**
 * Comprehensive insights for scenario results
 */
export interface ScenarioInsights {
  id: string;
  scenarioId: string;
  summary: string;
  insights: ScenarioInsight[];
  comparisonToBaseline?: string;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * TrendNavigator configuration
 */
export interface TrendNavigatorConfig {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  modelParameters: {
    tripGeneration: {
      baseRate: number;
    };
    modeChoice: {
      constants: {
        auto: number;
        transit: number;
        bike: number;
        walk: number;
      };
    };
    trends: {
      [K in TrendType]?: {
        maxEffectPct: number;
        affectedTrips: string[];
      };
    };
    policies: {
      [K in PolicyType]?: {
        maxEffectPct: number;
        affectedMeasures: string[];
      };
    };
  };
  version: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * TrendNavigator run request
 */
export interface TrendNavigatorRunRequest {
  scenarioId: string;
  campModelConfigId?: string;
  horizonYears?: number[];
  options?: {
    detailedResults?: boolean;
    spatialAnalysis?: boolean;
    equityAnalysis?: boolean;
    comparisonToBaseline?: boolean;
  };
}

/**
 * TrendNavigator analysis templates
 */
export interface TrendAnalysisTemplate {
  id: string;
  name: string;
  description: string;
  trends: string[]; // Trend IDs to include
  policies: string[]; // Policy IDs to include
  defaultHorizonYears: number[];
  comparisonMetrics: ScenarioImpactArea[];
  visualizations: ('chart' | 'map' | 'table' | 'dashboard')[];
  preset: boolean;
}

/**
 * AI-generated scenario recommendation
 */
export interface ScenarioRecommendation {
  id: string;
  name: string;
  description: string;
  trends: Record<string, {
    value: number;
    rationale: string;
  }>;
  policies: string[];
  expectedOutcomes: Record<ScenarioImpactArea, {
    prediction: string;
    confidence: number;
  }>;
  aiRationale: string;
  generatedAt: string;
}

/**
 * Aggregate metrics for scenario results
 */
export interface AggregateMetrics {
  totalVmt: number;
  totalVht: number;
  totalTrips: number;
  ghgEmissions: number;
  congestionIndex: number;
  averageCommute: number;
  accessibilityIndex: number;
  equityIndex: number;
  modeShares: {
    drive_alone: number;
    shared_ride: number;
    transit: number;
    walk: number;
    bike: number;
    micro_mobility: number;
  };
}

/**
 * Spatial result for a zone
 */
export interface SpatialResult {
  zoneId: string;
  metrics: Record<string, number>;
}

/**
 * Baseline comparison metrics
 */
export interface BaselineComparison {
  baselineScenarioId: string;
  horizonYear: number;
  vmtChange: number;
  vhtChange: number;
  ghgEmissionsChange: number;
  transitShareChange: number;
  walkShareChange: number;
  bikeShareChange: number;
}

export interface TrendProjection {
  type: 'linear' | 'exponential' | 'logarithmic' | 'custom';
  parameters?: Record<string, number>;
  values?: Record<string, number>; // For custom projections, year -> value
}

export interface TrendModifier {
  name: string;
  description?: string;
  impactMultiplier: number;
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  unit: string;
  calculator: string; // Function expression or reference
}

export interface RunOptions {
  runType?: 'quick' | 'normal' | 'detailed';
  includeBaseline?: boolean;
  generateSpatialResults?: boolean;
  generateEquityResults?: boolean;
}

export interface SpatialResults {
  zoneMetrics: {
    [year: string]: {
      [zoneId: string]: {
        vmt: number;
        ghgEmissions: number;
        congestionIndex: number;
        modeShares: {
          drive_alone: number;
          carpool: number;
          transit: number;
          walk: number;
          bike: number;
        };
        accessibilityIndex: number;
        equityScore: number;
      }
    }
  };
  linkMetrics: {
    [year: string]: {
      [linkId: string]: {
        volume: number;
        congestionRatio: number;
        transitVolume: number;
      }
    }
  };
}

export interface ZoneMetrics {
  totalTrips: number;
  congestion: number;
  accessibility: number;
}

export interface LinkMetrics {
  volume: number;
  congestion: number;
  speed: number;
}

export interface ComparisonResult {
  referenceScenario: {
    id: string;
    name: string;
  };
  comparedScenarios: Array<{
    scenarioId: string;
    scenarioName: string;
    vmtChange: number;
    vhtChange: number;
    ghgChange: number;
    transitShareChange: number;
    walkShareChange: number;
    bikeShareChange: number;
    congestionChange: number;
    accessibilityChange: number;
    equityChange: number;
  }>;
  horizonYear: number;
}

export interface PolicyImpact {
  area: string;
  magnitude: number;
  direction: 'positive' | 'negative';
}

export interface TrendNavigatorOptions {
  apiEndpoint?: string;
  apiKey?: string;
  defaultHorizonYears?: TimeHorizon[];
} 