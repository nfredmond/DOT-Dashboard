/**
 * CAMP (Chained Activity Modeling Process) Types
 * 
 * These types define the data structures for the CAMP travel demand forecasting tool.
 */

import { GeoJSON } from 'geojson';

/**
 * Transportation Analysis Zone (TAZ)
 */
export interface Zone {
  id: string;
  name: string;
  geometry: GeoJSON;
  population?: number;
  households?: number;
  employment?: {
    retail?: number;
    office?: number;
    industrial?: number;
    other?: number;
    total: number;
  };
  attributes?: Record<string, number | string>;
}

/**
 * Trip purpose categories
 */
export enum TripPurpose {
  HOME_WORK = 'home_work',
  HOME_SHOP = 'home_shop',
  HOME_SCHOOL = 'home_school',
  HOME_OTHER = 'home_other',
  WORK_OTHER = 'work_other',
  OTHER_OTHER = 'other_other'
}

/**
 * Transportation modes
 */
export enum TransportMode {
  DRIVE_ALONE = 'drive_alone',
  SHARED_RIDE_2 = 'shared_ride_2',
  SHARED_RIDE_3_PLUS = 'shared_ride_3_plus',
  TRANSIT = 'transit',
  WALK = 'walk',
  BIKE = 'bike',
  TNC = 'tnc', // Transportation Network Company (Uber, Lyft)
  MICRO_MOBILITY = 'micro_mobility', // Scooters, e-bikes
  OTHER = 'other'
}

/**
 * Time periods for analysis
 */
export enum TimePeriod {
  AM_PEAK = 'am_peak',
  MIDDAY = 'midday',
  PM_PEAK = 'pm_peak',
  EVENING = 'evening',
  NIGHT = 'night',
  DAILY = 'daily'
}

/**
 * Trip generation parameters
 */
export interface TripGenerationParams {
  purpose: TripPurpose;
  productionRate: number;
  attractionRate: number;
  directionality?: number; // Percent outbound (0-1)
  peakHourFactor?: number; // Factor to convert daily to peak hour
  timeOfDayDistribution?: Record<TimePeriod, number>; // Sum should equal 1
}

/**
 * Trip distribution parameters
 */
export interface TripDistributionParams {
  purpose: TripPurpose;
  kFactor?: number;
  frictionFactorA?: number;
  frictionFactorB?: number;
  frictionFactorC?: number;
  maxTravelTime?: number; // Minutes
}

/**
 * Mode choice parameters
 */
export interface ModeChoiceParams {
  purpose: TripPurpose;
  constants: Record<TransportMode, number>;
  coefficients: {
    inVehicleTime?: number;
    outOfVehicleTime?: number;
    cost?: number;
    income?: number;
    carOwnership?: number;
    transitAccess?: number;
    [key: string]: number | undefined;
  };
}

/**
 * Network link properties
 */
export interface NetworkLink {
  id: string;
  fromNode: string;
  toNode: string;
  geometry: GeoJSON;
  length: number; // Miles
  speedLimit: number; // MPH
  freeFlowSpeed?: number; // MPH
  capacity: number; // Vehicles per hour
  lanes: number;
  facilityType: string; // Freeway, arterial, collector, etc.
  attributes?: Record<string, number | string>;
}

/**
 * Origin-Destination (OD) trip matrix
 */
export interface ODMatrix {
  fromZone: string;
  toZone: string;
  trips: number;
  purpose?: TripPurpose;
  mode?: TransportMode;
  timePeriod?: TimePeriod;
}

/**
 * Trip assignment parameters
 */
export interface AssignmentParams {
  method: 'all-or-nothing' | 'incremental' | 'equilibrium' | 'stochastic';
  maxIterations?: number;
  convergenceCriteria?: number;
  volumeDelayFunction?: 'bpr' | 'conical' | 'akcelik' | 'custom';
  alpha?: number; // BPR parameter
  beta?: number; // BPR parameter
}

/**
 * Link flow results from assignment
 */
export interface LinkFlow {
  linkId: string;
  volume: number; // Vehicles per hour
  capacity: number; // Vehicles per hour
  speed: number; // MPH
  travelTime: number; // Minutes
  vCRatio: number; // Volume to capacity ratio
  timePeriod: TimePeriod;
}

/**
 * Mode share results
 */
export interface ModeShare {
  mode: TransportMode;
  trips: number;
  percentage: number;
  passengerMiles?: number;
  purpose?: TripPurpose;
  timePeriod?: TimePeriod;
}

/**
 * CAMP model parameters
 */
export interface CAMPModelParams {
  name: string;
  description?: string;
  baseYear: number;
  forecastYear?: number;
  tripGeneration: TripGenerationParams[];
  tripDistribution: TripDistributionParams[];
  modeChoice: ModeChoiceParams[];
  assignment: AssignmentParams;
  calibrationFactors?: Record<string, number>;
  zoneSystem?: {
    sourceFile?: string;
    zoneCount: number;
  };
  network?: {
    sourceFile?: string;
    linkCount: number;
    nodeCount: number;
  };
}

/**
 * CAMP parameter definition
 */
export interface CAMPParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  required: boolean;
  options?: any[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    [key: string]: any;
  };
}

/**
 * CAMP model type
 */
export type CAMPModelType = 'TDF' | 'ABM' | 'TDFML' | 'ABMML' | 'Custom';

/**
 * Connection details for CAMP model
 */
export interface ConnectionDetails {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  apiKey?: string;
  apiEndpoint?: string;
  filePath?: string;
  connectionType: 'direct' | 'api' | 'file';
  [key: string]: any;
}

/**
 * CAMP Model Run Status
 */
export enum CAMPModelRunStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED'
}

/**
 * CAMP Model Parameters for the TrendNavigator integration
 */
export interface CAMPModelParameters {
  tripGeneration: {
    baseRate: number;
    rateAdjustments: any[];
  };
  tripDistribution: {
    frictionFactorA: number;
    frictionFactorB: number;
    maxDistance: number;
  };
  modeChoice: {
    autoTimeValue: number;
    transitTimeValue: number;
    waitTimeValue: number;
    walkTimeValue: number;
  };
  trafficAssignment: {
    convergenceThreshold: number;
    maxIterations: number;
  };
}

/**
 * CAMP Model Configuration
 */
export interface CAMPModelConfig {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  defaultParameters: CAMPModelParameters;
  createdAt: string;
  updatedAt: string;
}

/**
 * CAMP Model Run
 */
export interface CAMPModelRun {
  id: string;
  scenarioId: string;
  modelConfigId: string;
  status: CAMPModelRunStatus;
  progress?: number;
  options: any;
  parameters: CAMPModelParameters;
  results: CAMPModelResults | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

/**
 * CAMP Results
 */
export interface CAMPResults {
  metrics: Record<string, any>;
  outputFiles?: Record<string, string>;
  visualizations?: Record<string, string>;
}

/**
 * CAMP Model Run Results structure for TrendNavigator integration
 */
export interface CAMPModelResults {
  tripGeneration: {
    totalTrips: number;
    tripsByPurpose: Record<string, number>;
    tripsByZone: Record<string, number>;
  };
  tripDistribution: {
    odMatrix: Record<string, number>;
    averageTripLength: number;
    totalVMT: number;
  };
  modeChoice: {
    modeShares: {
      drive_alone: number;
      shared_ride: number;
      transit: number;
      walk: number;
      bike: number;
      micro_mobility: number;
    };
    modeSharesByPurpose: Record<string, {
      drive_alone: number;
      shared_ride: number;
      transit: number;
      walk: number;
      bike: number;
      micro_mobility: number;
    }>;
  };
  trafficAssignment: {
    linkVolumes: Record<string, number>;
    vht: number;
    vmt: number;
    averageSpeed: number;
    congestionIndex: number;
  };
  emissions: {
    co2: number;
    nox: number;
    pm25: number;
    totalGHG: number;
  };
  accessibility: {
    accessibilityByZone: Record<string, number>;
    equityIndex: number;
    overallAccessibility: number;
  };
}

/**
 * CAMP Model Types
 * 
 * These types define the structure of CAMP model data and requests
 */

/**
 * Status of a CAMP model run
 */
export type RunStatus = 'queued' | 'running' | 'completed' | 'failed';

/**
 * Zone data for the CAMP model
 */
export interface Zone {
  id: number;
  name: string;
  population: number;
  employment: number;
  area: number;
  centroid: [number, number]; // [longitude, latitude]
  geom?: any; // GeoJSON geometry
}

/**
 * Network link data for the CAMP model
 */
export interface NetworkLink {
  id: number;
  fromNode: number;
  toNode: number;
  length: number;  // in kilometers
  freeflowSpeed: number;  // in km/h
  capacity: number;  // in vehicles per hour
  lanes: number;
  type: string;  // 'highway', 'arterial', 'collector', 'local'
  mode: string;  // 'road', 'transit', 'bike', 'walk'
  geom?: any;  // GeoJSON geometry
}

/**
 * CAMP model parameters
 */
export interface CAMPModelParameters {
  // Basic parameters
  baseYear: number;
  horizonYear: number;
  
  // Trip generation parameters
  tripGenerationRate: number;  // Trips per person
  workTripPct: number;  // Percentage of work trips
  nonWorkTripPct: number;  // Percentage of non-work trips
  
  // Mode choice parameters
  autoModePct: number;  // Percentage of auto mode trips
  transitModePct: number;  // Percentage of transit mode trips
  bikeModePct: number;  // Percentage of bike mode trips
  walkModePct: number;  // Percentage of walk mode trips
  
  // Assignment parameters
  peakHourFactor: number;  // Factor to convert daily trips to peak hour
  valueOfTime: number;  // Value of time in dollars per hour
  
  // Vehicle parameters
  occupancyRate: number;  // Average vehicle occupancy
  emissionRate: number;  // CO2 emissions in grams per kilometer
  
  // Autonomous vehicle parameters
  avPenetration: number;  // Percentage of autonomous vehicles
  avCapacityBoost: number;  // Capacity boost factor for autonomous vehicles
  
  // Telecommuting parameters
  telecommutePct: number;  // Percentage of work trips replaced by telecommuting
  
  // Shared mobility parameters
  sharedMobilityPct: number;  // Percentage of trips served by shared mobility
  sharedMobilityEfficiency: number;  // Efficiency factor for shared mobility
  
  // Transit service parameters
  transitServiceLevel: number;  // Transit service level factor (1.0 = baseline)
  transitFare: number;  // Transit fare in dollars
  
  // Active transportation parameters
  bikeInfrastructureLevel: number;  // Bike infrastructure level (1.0 = baseline)
  walkInfrastructureLevel: number;  // Walk infrastructure level (1.0 = baseline)
  
  // Road pricing parameters
  congestionPricingLevel: number;  // Congestion pricing level (0 = no pricing)
  parkingPricingLevel: number;  // Parking pricing level (0 = no pricing)
}

/**
 * Configuration for a CAMP model
 */
export interface CAMPModelConfig {
  id?: string;
  name: string;
  description?: string;
  organizationId: string;
  parameters: CAMPModelParameters;
  modelVersion: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * CAMP run request
 */
export interface CAMPRunRequest {
  scenarioId: string;
  modelConfig: CAMPModelConfig;
  baseYear: number;
  horizonYears: number[];
}

/**
 * CAMP model run metadata
 */
export interface CAMPModelRun {
  id: string;
  scenarioId: string;
  status: RunStatus;
  startTime: string;
  endTime?: string;
  errorMessage?: string;
  resultsUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Results of a CAMP model run for a network link
 */
export interface LinkResult {
  id: number;
  volume: number;  // vehicles per hour
  speed: number;  // km/h
  vcratio: number;  // volume to capacity ratio
  delay: number;  // hours
  emissions: number;  // kg of CO2
}

/**
 * Results of a CAMP model run for a zone
 */
export interface ZoneResult {
  id: number;
  tripsProduced: number;
  tripsAttracted: number;
  accessibility: {
    auto: number;
    transit: number;
    bike: number;
    walk: number;
  };
}

/**
 * Aggregate metrics for a CAMP model run
 */
export interface CAMPMetrics {
  totalVMT: number;  // vehicle miles traveled
  totalVHT: number;  // vehicle hours traveled
  totalDelay: number;  // hours
  totalEmissions: number;  // metric tons of CO2
  averageSpeed: number;  // km/h
  congestionIndex: number;  // 0-1 scale
  accessibilityIndex: number;  // 0-1 scale
  equityIndex: number;  // 0-1 scale
  safetyIndex: number;  // 0-1 scale
}

/**
 * Complete results of a CAMP model run
 */
export interface CAMPResults {
  scenarioId: string;
  runId: string;
  horizonYear: number;
  metrics: CAMPMetrics;
  linkResults: LinkResult[];
  zoneResults: ZoneResult[];
  createdAt: string;
}

// CAMP Model Types

export interface CAMPConfig {
  id: string;
  organization_id: string;
  zone_data: any; // Zone data structure
  network_data: any; // Network data structure
  parameters: ModelParameters;
  calibration_status: string;
  created_at: string;
  updated_at: string;
}

export interface ModelParameters {
  trip_generation: {
    production_rates: Record<string, number>;
    attraction_rates: Record<string, number>;
  };
  trip_distribution: {
    friction_factors: Record<string, number[]>;
    k_factors: Record<string, Record<string, number>>;
  };
  mode_choice: {
    constants: Record<string, number>;
    coefficients: Record<string, number>;
  };
  assignment: {
    volume_delay_parameters: {
      alpha: number;
      beta: number;
    };
    convergence_criteria: number;
    max_iterations: number;
  };
}

export interface ScenarioResult {
  congestion: {
    average_vtc: number;
    total_delay: number;
    congested_links: number;
    vtc_ratios: Record<string, number>;
    delays: Record<string, number>;
    travel_times: Record<string, number>;
  };
  emissions: {
    co2_tonnes: number;
    nox_kg: number;
    pm_kg: number;
    vkt_by_mode: Record<string, number>;
  };
  accessibility: {
    job_accessibility: Record<string, Record<string, number>>;
    healthcare_accessibility: Record<string, Record<string, number>>;
    education_accessibility: Record<string, Record<string, number>>;
    retail_accessibility: Record<string, Record<string, number>>;
  };
  safety: {
    total_crashes: number;
    crashes_by_facility_type: Record<string, number>;
    fatalities: number;
    injuries: number;
    pdo_crashes: number;
  };
  equity: {
    avg_accessibility_by_group: Record<string, number>;
    equity_ratios: Record<string, number>;
  };
  gis_data: {
    links: GeoJSON.FeatureCollection;
    zones: GeoJSON.FeatureCollection;
  };
  zone_metrics: Record<string, ZoneMetrics>;
  network_metrics: {
    total_vmt: number;
    total_vht: number;
    average_speed: number;
  };
}

/**
 * Zone metrics for TrendNavigator integration
 * Represents processed zone data with metrics needed for trend analysis
 */
export interface TrendNavigatorZoneMetrics {
  id: string;
  name?: string;
  population: number;
  employment: number;
  households?: number;
  area?: number; // in square miles or km²
  density?: number;
  income?: number;
  tripProduction: number;
  tripAttraction: number;
  modeShares?: {
    auto: number;
    transit: number;
    walk: number;
    bike: number;
    shared?: number;
    other?: number;
  };
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface ModelStatus {
  status: 'running' | 'completed' | 'failed' | 'unknown';
  errorMessage?: string | null;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
}

export interface ModelRun {
  id: string;
  scenario_id: string;
  model_parameters: ModelParameters;
  status: string;
  error_message?: string | null;
  start_time: string;
  end_time?: string | null;
  execution_time?: number | null;
}

// Namespace for GeoJSON types if not already defined
namespace GeoJSON {
  export interface Geometry {
    type: string;
    coordinates: any;
  }

  export interface Feature {
    type: "Feature";
    geometry: Geometry;
    properties: any;
  }

  export interface FeatureCollection {
    type: "FeatureCollection";
    features: Feature[];
  }
} 