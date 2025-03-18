# GreenChAMP Model Documentation

## Overview

GreenChAMP (Green DOT Chained Activity Modelling Process) is an integrated travel demand modeling framework built into the Planning Manager application. It provides a comprehensive approach to modeling transportation patterns and forecasting future scenarios with a focus on sustainability and accessibility.

## What is GreenChAMP?

GreenChAMP is a modernized implementation of the traditional four-step travel demand model, enhanced with:

- Activity-based modeling concepts
- Machine learning augmentation
- Enhanced environmental impact assessment
- Multi-modal transportation system modeling
- Seamless integration with TrendNavigator for future scenario planning

## Core Components

GreenChAMP follows the classic four-step travel demand modeling structure, with significant enhancements at each stage:

### 1. Trip Generation

This component estimates the number of trips produced and attracted by each transportation analysis zone (TAZ).

**Key Features:**
- Land use-based trip production rates
- Employment-based trip attraction rates
- Time-of-day distribution
- Trip purpose categorization (work, school, shopping, etc.)
- Activity-based modeling augmentation

**Technical Implementation:**
```typescript
// Simplified pseudocode example
function calculateTripProduction(zone, ratesByPurpose) {
  const trips = {};
  
  // Calculate trips by purpose
  for (const [purpose, rate] of Object.entries(ratesByPurpose)) {
    trips[purpose] = zone.population * rate;
  }
  
  // Apply time-of-day factors
  applyTimeOfDayFactors(trips);
  
  return trips;
}
```

### 2. Trip Distribution

This component distributes trips between origins and destinations using gravity models and other distribution techniques.

**Key Features:**
- Gravity model implementation
- Friction factors by trip purpose
- K-factors for calibration
- Origin-Destination matrix generation
- Travel time feedback loop

**Technical Implementation:**
```typescript
// Simplified pseudocode example
function distributeTrips(origins, destinations, frictionFactors) {
  const odMatrix = createMatrix(origins.length, destinations.length);
  
  for (let i = 0; i < origins.length; i++) {
    for (let j = 0; j < destinations.length; j++) {
      const distance = calculateDistance(origins[i], destinations[j]);
      const friction = getFrictionFactor(distance, frictionFactors);
      odMatrix[i][j] = origins[i].trips * destinations[j].attraction * friction;
    }
  }
  
  // Balance and normalize the matrix
  return balanceMatrix(odMatrix);
}
```

### 3. Mode Choice

This component splits trips between available transportation modes.

**Key Features:**
- Multinomial logit model
- Utility functions based on travel time, cost, and convenience
- Mode-specific constants and coefficients
- Accessibility measures
- Mode availability by zone

**Technical Implementation:**
```typescript
// Simplified pseudocode example
function calculateModeShare(tripData, modeParameters) {
  const utilities = {};
  const modeShares = {};
  let sumExp = 0;
  
  // Calculate utility for each mode
  for (const [mode, params] of Object.entries(modeParameters)) {
    utilities[mode] = params.constant + 
                     params.timeCoeff * tripData.time[mode] + 
                     params.costCoeff * tripData.cost[mode];
    
    // Sum of exponentiated utilities for denominator
    sumExp += Math.exp(utilities[mode]);
  }
  
  // Calculate probability for each mode
  for (const mode of Object.keys(modeParameters)) {
    modeShares[mode] = Math.exp(utilities[mode]) / sumExp;
  }
  
  return modeShares;
}
```

### 4. Network Assignment

This component assigns trips to the transportation network.

**Key Features:**
- User equilibrium assignment
- Volume-delay functions
- Capacity constraints
- Iterative assignment process
- Multi-class assignment for different vehicle types
- Transit assignment capabilities

**Technical Implementation:**
```typescript
// Simplified pseudocode example
function assignTrips(network, tripMatrix, assignmentParameters) {
  // Initialize with free-flow travel times
  initializeNetwork(network);
  
  for (let i = 0; i < assignmentParameters.maxIterations; i++) {
    // Find shortest paths
    const paths = findAllShortestPaths(network);
    
    // Assign trips to paths
    assignTripsToNetwork(network, tripMatrix, paths);
    
    // Update link travel times based on volume
    updateLinkTravelTimes(network);
    
    // Check convergence
    if (checkConvergence(network, assignmentParameters.convergenceCriteria)) {
      break;
    }
  }
  
  return {
    network,
    linkVolumes: extractLinkVolumes(network),
    metrics: calculateNetworkMetrics(network)
  };
}
```

## GreenChAMP and Sustainability

The "Green" in GreenChAMP represents our focus on sustainable transportation outcomes:

- **Emissions Modeling**: Detailed calculation of greenhouse gas and criteria pollutant emissions
- **Mode Shift Analysis**: Tools for analyzing shifts to greener transportation modes
- **Climate Impact Assessment**: Long-term climate impact projections
- **Environmental Justice Metrics**: Analysis of impacts on various communities
- **Health Impact Assessment**: Quantification of health benefits from active transportation

## Integration with TrendNavigator

GreenChAMP seamlessly integrates with TrendNavigator to model the impacts of emerging trends:

1. GreenChAMP provides baseline travel patterns
2. TrendNavigator applies trend factors (e.g., telecommuting, e-commerce)
3. GreenChAMP recalculates travel patterns with modified inputs
4. Results are compared to baseline to quantify impacts

## Database Schema

GreenChAMP uses the following database tables:

- `baseline_scenarios`: Stores baseline model inputs and parameters
- `scenario_results`: Stores model outputs and metrics
- `trend_definitions`: Defines available transportation trends (for TrendNavigator)
- `trend_scenarios`: Stores trend impact scenarios and results

## Using GreenChAMP in the Planning Manager

### Setting Up a GreenChAMP Model

1. Navigate to the Modeling section
2. Select "New GreenChAMP Model"
3. Upload or define:
   - Zone data (population, employment, etc.)
   - Network data (links, nodes, etc.)
   - Model parameters (rates, friction factors, etc.)
4. Configure analysis periods (AM Peak, PM Peak, Off-Peak)
5. Run the model

### Viewing Results

After running a GreenChAMP model, you can access:

- Interactive maps of travel flows
- Metrics tables (VMT, VHT, emissions, etc.)
- Mode share charts
- Congestion analysis
- Accessibility metrics

### Technical Requirements

For optimal performance of GreenChAMP models:

- Minimum 8GB RAM recommended
- Modern multi-core processor
- Fast internet connection for cloud-based processing
- WebGL-capable browser for visualization

## API Reference

GreenChAMP exposes the following API endpoints:

```
POST /api/greenchamp/models/run
GET /api/greenchamp/models/{id}
GET /api/greenchamp/models/{id}/results
POST /api/greenchamp/trendnavigator/scenarios
GET /api/greenchamp/trendnavigator/scenarios/{id}/compare
```

## Best Practices

### Model Calibration

To ensure accurate results:

1. Collect ground truth data (traffic counts, transit ridership, etc.)
2. Adjust model parameters to match observed data
3. Validate model outputs against independent data sources
4. Document calibration process and results

### Scenario Development

When creating scenarios:

1. Start with a well-calibrated baseline
2. Make incremental changes to test sensitivity
3. Document all assumptions
4. Compare multiple scenarios rather than relying on a single forecast
5. Include uncertainty analysis

## Summary

GreenChAMP provides a powerful, integrated approach to travel demand modeling within the Planning Manager application. Its focus on sustainability, integration with trend analysis, and user-friendly interface make it an essential tool for modern transportation planning professionals.

For more information, see the [GreenChAMP User Guide](./user-guide/greenchamp.md) or contact the development team for support. 