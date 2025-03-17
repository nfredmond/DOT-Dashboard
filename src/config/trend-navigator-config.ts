import { 
  Trend, 
  TrendCategory, 
  TimeHorizon, 
  TrendConfidence, 
  ImpactMagnitude,
  PolicyIntervention,
  TrendNavigatorConfig
} from '@/types/trend-navigator';
import { TransportMode, TripPurpose } from '@/types/camp';

/**
 * Default trends available in the TrendNavigator
 */
export const DEFAULT_TRENDS: Trend[] = [
  {
    id: 'telecommuting',
    name: 'Telecommuting Rate',
    description: 'Percentage of workforce that primarily works from home',
    category: TrendCategory.BEHAVIOR,
    baselineValue: 5, // 5% pre-pandemic
    minValue: 0,
    maxValue: 100,
    unit: '%',
    defaultProjection: {
      [TimeHorizon.SHORT_TERM]: 25, // 25% in next 5 years
      [TimeHorizon.MEDIUM_TERM]: 30, // 30% in 6-10 years
      [TimeHorizon.LONG_TERM]: 35, // 35% in 11-30 years
    },
    confidenceLevel: TrendConfidence.MEDIUM,
    source: 'Based on pandemic acceleration and economic sector analysis',
    impactAreas: {
      tripGeneration: ImpactMagnitude.SIGNIFICANT,
      tripDistribution: ImpactMagnitude.MODERATE,
      modeChoice: ImpactMagnitude.MINOR,
      routeChoice: ImpactMagnitude.MINOR
    },
    modifiers: {
      byPurpose: {
        [TripPurpose.WORK]: -0.8, // 80% reduction in commute trips for those telecommuting
        [TripPurpose.SHOPPING]: 0.1, // 10% increase in shopping trips (home deliveries)
      }
    }
  },
  {
    id: 'ev_adoption',
    name: 'Electric Vehicle Adoption',
    description: 'Percentage of vehicles that are electric (BEV and PHEV)',
    category: TrendCategory.TECHNOLOGY,
    baselineValue: 2, // 2% currently
    minValue: 0,
    maxValue: 100,
    unit: '%',
    defaultProjection: {
      [TimeHorizon.SHORT_TERM]: 15, // 15% in next 5 years
      [TimeHorizon.MEDIUM_TERM]: 40, // 40% in 6-10 years
      [TimeHorizon.LONG_TERM]: 80, // 80% in 11-30 years
    },
    confidenceLevel: TrendConfidence.HIGH,
    source: 'Based on manufacturer commitments and policy incentives',
    impactAreas: {
      tripGeneration: ImpactMagnitude.NEGLIGIBLE,
      tripDistribution: ImpactMagnitude.NEGLIGIBLE,
      modeChoice: ImpactMagnitude.MINOR,
      routeChoice: ImpactMagnitude.MINOR
    }
  },
  {
    id: 'urban_density',
    name: 'Urban Density Change',
    description: 'Change in urban core density relative to baseline year',
    category: TrendCategory.LAND_USE,
    baselineValue: 100, // 100% (baseline)
    minValue: 70,
    maxValue: 200,
    unit: '%',
    defaultProjection: {
      [TimeHorizon.SHORT_TERM]: 105, // 5% increase in next 5 years
      [TimeHorizon.MEDIUM_TERM]: 115, // 15% increase in 6-10 years
      [TimeHorizon.LONG_TERM]: 130, // 30% increase in 11-30 years
    },
    confidenceLevel: TrendConfidence.MEDIUM,
    source: 'Based on current zoning reforms and housing market trends',
    impactAreas: {
      tripGeneration: ImpactMagnitude.MINOR,
      tripDistribution: ImpactMagnitude.MODERATE,
      modeChoice: ImpactMagnitude.SIGNIFICANT,
      routeChoice: ImpactMagnitude.MODERATE
    },
    modifiers: {
      byMode: {
        [TransportMode.WALK]: 0.5, // 50% higher walking rate
        [TransportMode.BIKE]: 0.3, // 30% higher biking rate
        [TransportMode.TRANSIT]: 0.4, // 40% higher transit use
        [TransportMode.DRIVE_ALONE]: -0.2 // 20% lower drive alone rate
      }
    }
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Growth',
    description: 'Percentage of retail sales conducted online',
    category: TrendCategory.ECONOMY,
    baselineValue: 15, // 15% baseline
    minValue: 10,
    maxValue: 80,
    unit: '%',
    defaultProjection: {
      [TimeHorizon.SHORT_TERM]: 25, // 25% in next 5 years
      [TimeHorizon.MEDIUM_TERM]: 35, // 35% in 6-10 years
      [TimeHorizon.LONG_TERM]: 50, // 50% in 11-30 years
    },
    confidenceLevel: TrendConfidence.HIGH,
    source: 'Based on retail industry forecasts and consumer behavior surveys',
    impactAreas: {
      tripGeneration: ImpactMagnitude.MODERATE,
      tripDistribution: ImpactMagnitude.MINOR,
      modeChoice: ImpactMagnitude.MINOR,
      routeChoice: ImpactMagnitude.MODERATE
    },
    modifiers: {
      byPurpose: {
        [TripPurpose.SHOPPING]: -0.3, // 30% reduction in shopping trips
      }
    }
  },
  {
    id: 'av_adoption',
    name: 'Autonomous Vehicle Adoption',
    description: 'Percentage of vehicle fleet that is fully autonomous (L4/L5)',
    category: TrendCategory.TECHNOLOGY,
    baselineValue: 0, // 0% baseline
    minValue: 0,
    maxValue: 100,
    unit: '%',
    defaultProjection: {
      [TimeHorizon.SHORT_TERM]: 2, // 2% in next 5 years
      [TimeHorizon.MEDIUM_TERM]: 15, // 15% in 6-10 years
      [TimeHorizon.LONG_TERM]: 50, // 50% in 11-30 years
    },
    confidenceLevel: TrendConfidence.LOW,
    source: 'Based on industry forecasts with high uncertainty',
    impactAreas: {
      tripGeneration: ImpactMagnitude.MINOR,
      tripDistribution: ImpactMagnitude.MODERATE,
      modeChoice: ImpactMagnitude.SIGNIFICANT,
      routeChoice: ImpactMagnitude.SIGNIFICANT
    }
  },
  {
    id: 'population_growth',
    name: 'Population Growth',
    description: 'Annual population growth rate',
    category: TrendCategory.DEMOGRAPHICS,
    baselineValue: 1, // 1% annual growth
    minValue: -2,
    maxValue: 5,
    unit: '%',
    defaultProjection: {
      [TimeHorizon.SHORT_TERM]: 0.9, // 0.9% in next 5 years
      [TimeHorizon.MEDIUM_TERM]: 0.8, // 0.8% in 6-10 years
      [TimeHorizon.LONG_TERM]: 0.7, // 0.7% in 11-30 years
    },
    confidenceLevel: TrendConfidence.MEDIUM,
    source: 'Based on Census Bureau projections',
    impactAreas: {
      tripGeneration: ImpactMagnitude.SIGNIFICANT,
      tripDistribution: ImpactMagnitude.MODERATE,
      modeChoice: ImpactMagnitude.MINOR,
      routeChoice: ImpactMagnitude.MODERATE
    }
  }
];

/**
 * Default policy interventions available in the TrendNavigator
 */
export const DEFAULT_POLICIES: PolicyIntervention[] = [
  {
    id: 'transit_expansion',
    name: 'Transit Service Expansion',
    description: 'Significant expansion of public transit service hours and coverage',
    category: 'transit',
    implementationTimeframe: TimeHorizon.MEDIUM_TERM,
    cost: {
      capital: 500000000, // $500M capital cost
      annual: 50000000, // $50M annual operating cost
      unit: 'USD'
    },
    impacts: {
      tripRateImpact: {
        [TripPurpose.WORK]: 0.02, // 2% more work trips
        [TripPurpose.SHOPPING]: 0.03, // 3% more shopping trips
        [TripPurpose.OTHER]: 0.04 // 4% more other trips
      },
      modeShareImpact: {
        [TransportMode.TRANSIT]: 0.05, // 5 percentage point increase in transit
        [TransportMode.DRIVE_ALONE]: -0.04, // 4 percentage point decrease in driving alone
        [TransportMode.SHARED_RIDE]: -0.01 // 1 percentage point decrease in carpooling
      },
      vmtImpact: -0.02, // 2% reduction in VMT
      emissionsImpact: -0.03, // 3% reduction in emissions
      equityImpact: 0.1, // 10% improvement in equity
      safetyImpact: 0.02 // 2% improvement in safety
    },
    feasibility: 75, // 75/100 feasibility
    stakeholderSupport: 80 // 80/100 stakeholder support
  },
  {
    id: 'congestion_pricing',
    name: 'Congestion Pricing',
    description: 'Implementation of peak-period tolls in congested urban areas',
    category: 'pricing',
    implementationTimeframe: TimeHorizon.MEDIUM_TERM,
    cost: {
      capital: 100000000, // $100M capital cost
      annual: 20000000, // $20M annual operating cost
      unit: 'USD'
    },
    impacts: {
      tripRateImpact: {
        [TripPurpose.WORK]: -0.01, // 1% fewer work trips
        [TripPurpose.SHOPPING]: -0.05, // 5% fewer shopping trips
        [TripPurpose.OTHER]: -0.03 // 3% fewer other trips
      },
      modeShareImpact: {
        [TransportMode.TRANSIT]: 0.07, // 7 percentage point increase in transit
        [TransportMode.DRIVE_ALONE]: -0.08, // 8 percentage point decrease in driving alone
        [TransportMode.SHARED_RIDE]: 0.01 // 1 percentage point increase in carpooling
      },
      vmtImpact: -0.08, // 8% reduction in VMT
      emissionsImpact: -0.09, // 9% reduction in emissions
      equityImpact: -0.05, // 5% decrease in equity (potentially regressive)
      safetyImpact: 0.04 // 4% improvement in safety
    },
    feasibility: 60, // 60/100 feasibility
    stakeholderSupport: 45 // 45/100 stakeholder support
  },
  {
    id: 'bike_infrastructure',
    name: 'Bicycle Infrastructure Network',
    description: 'Comprehensive network of protected bike lanes and bicycle facilities',
    category: 'active_transportation',
    implementationTimeframe: TimeHorizon.SHORT_TERM,
    cost: {
      capital: 50000000, // $50M capital cost
      annual: 2000000, // $2M annual operating cost
      unit: 'USD'
    },
    impacts: {
      tripRateImpact: {
        [TripPurpose.WORK]: 0.01, // 1% more work trips
        [TripPurpose.SHOPPING]: 0.02, // 2% more shopping trips
        [TripPurpose.OTHER]: 0.03 // 3% more other trips
      },
      modeShareImpact: {
        [TransportMode.BIKE]: 0.04, // 4 percentage point increase in biking
        [TransportMode.DRIVE_ALONE]: -0.03, // 3 percentage point decrease in driving alone
        [TransportMode.TRANSIT]: -0.01 // 1 percentage point decrease in transit
      },
      vmtImpact: -0.02, // 2% reduction in VMT
      emissionsImpact: -0.02, // 2% reduction in emissions
      equityImpact: 0.03, // 3% improvement in equity
      safetyImpact: 0.1 // 10% improvement in safety
    },
    feasibility: 85, // 85/100 feasibility
    stakeholderSupport: 70 // 70/100 stakeholder support
  },
  {
    id: 'ev_incentives',
    name: 'Electric Vehicle Incentives',
    description: 'Comprehensive package of EV incentives and charging infrastructure',
    category: 'electrification',
    implementationTimeframe: TimeHorizon.SHORT_TERM,
    cost: {
      capital: 30000000, // $30M capital cost
      annual: 10000000, // $10M annual operating cost
      unit: 'USD'
    },
    impacts: {
      tripRateImpact: {
        [TripPurpose.WORK]: 0, // 0% change in work trips
        [TripPurpose.SHOPPING]: 0, // 0% change in shopping trips
        [TripPurpose.OTHER]: 0 // 0% change in other trips
      },
      modeShareImpact: {
        [TransportMode.DRIVE_ALONE]: 0.01, // 1 percentage point increase in driving alone
        [TransportMode.TRANSIT]: -0.01, // 1 percentage point decrease in transit
      },
      vmtImpact: 0.01, // 1% increase in VMT
      emissionsImpact: -0.15, // 15% reduction in emissions
      equityImpact: -0.02, // 2% decrease in equity
      safetyImpact: 0 // 0% change in safety
    },
    feasibility: 90, // 90/100 feasibility
    stakeholderSupport: 75 // 75/100 stakeholder support
  },
  {
    id: 'tod_zoning',
    name: 'Transit-Oriented Development Zoning',
    description: 'Upzoning and incentives for dense, mixed-use development near transit',
    category: 'land_use',
    implementationTimeframe: TimeHorizon.LONG_TERM,
    cost: {
      capital: 5000000, // $5M capital cost (policy development)
      annual: 1000000, // $1M annual operating cost
      unit: 'USD'
    },
    impacts: {
      tripRateImpact: {
        [TripPurpose.WORK]: 0.02, // 2% more work trips
        [TripPurpose.SHOPPING]: 0.03, // 3% more shopping trips
        [TripPurpose.OTHER]: 0.02 // 2% more other trips
      },
      modeShareImpact: {
        [TransportMode.TRANSIT]: 0.06, // 6 percentage point increase in transit
        [TransportMode.WALK]: 0.04, // 4 percentage point increase in walking
        [TransportMode.BIKE]: 0.02, // 2 percentage point increase in biking
        [TransportMode.DRIVE_ALONE]: -0.12, // 12 percentage point decrease in driving alone
      },
      vmtImpact: -0.1, // 10% reduction in VMT
      emissionsImpact: -0.12, // 12% reduction in emissions
      equityImpact: 0.05, // 5% improvement in equity
      safetyImpact: 0.06 // 6% improvement in safety
    },
    feasibility: 65, // 65/100 feasibility
    stakeholderSupport: 60 // 60/100 stakeholder support
  }
];

/**
 * Default TrendNavigator configuration
 */
export const DEFAULT_TREND_NAVIGATOR_CONFIG: Omit<TrendNavigatorConfig, 'id' | 'agencyId'> = {
  name: 'Standard TrendNavigator Configuration',
  description: 'Default configuration with standard trends and policies',
  availableTrends: DEFAULT_TRENDS,
  availablePolicies: DEFAULT_POLICIES,
  defaultBaseYear: new Date().getFullYear(),
  defaultHorizonYears: [2030, 2040, 2050],
  customMetrics: [
    {
      id: 'climate_resilience',
      name: 'Climate Resilience Index',
      description: 'Measure of transportation system resilience to climate impacts',
      unit: 'score',
      formula: '(adaptation_infrastructure * 0.6) + (redundancy * 0.4)',
      tags: ['climate', 'resilience', 'infrastructure']
    },
    {
      id: 'economic_benefit',
      name: 'Economic Benefit Ratio',
      description: 'Ratio of economic benefits to costs',
      unit: 'ratio',
      formula: 'total_benefits / total_costs',
      tags: ['economic', 'benefit-cost', 'finance']
    }
  ],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}; 