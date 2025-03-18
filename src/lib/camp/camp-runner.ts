import { supabase } from '../supabase-client';
import { processZoneData, processNetworkData } from './data-processing';
import { TripGeneration, TripDistribution, ModeChoice, NetworkAssignment } from './model-components';
import { CAMPConfig, ModelParameters, ScenarioResult, ModelStatus } from '@/types/camp';

/**
 * CAMP Runner Service
 * 
 * Handles the execution of travel demand models based on the CAMP (Comprehensive Activity-based Mobility Planning) methodology.
 * Coordinates the four-step modeling process: trip generation, trip distribution, mode choice, and network assignment.
 */
export class CAMPRunner {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Run the CAMP model for a specific scenario
   */
  public async runModel(
    scenarioId: string, 
    parameters: ModelParameters
  ): Promise<{ success: boolean; message?: string; resultId?: string }> {
    try {
      // Update model run status to "running"
      await this.updateModelRunStatus(scenarioId, 'running');

      // Get scenario data
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .eq('organization_id', this.organizationId)
        .single();

      if (scenarioError || !scenario) {
        throw new Error(`Failed to fetch scenario: ${scenarioError?.message || 'Scenario not found'}`);
      }

      // Get CAMP configuration for this organization
      const { data: campConfig, error: configError } = await supabase
        .from('camp_configs')
        .select('*')
        .eq('organization_id', this.organizationId)
        .single();

      if (configError || !campConfig) {
        throw new Error(`Failed to fetch CAMP configuration: ${configError?.message || 'Configuration not found'}`);
      }

      // Process input data
      const zoneData = await processZoneData(campConfig.zone_data, scenario.base_year, scenario.horizon_years[0]);
      const networkData = await processNetworkData(campConfig.network_data, scenario.assumptions, scenario.policy_packages);

      // Initialize model components
      const tripGeneration = new TripGeneration(zoneData, parameters);
      const tripDistribution = new TripDistribution(parameters);
      const modeChoice = new ModeChoice(parameters, scenario.assumptions);
      const networkAssignment = new NetworkAssignment(networkData, parameters);

      // Execute modeling steps
      console.log('Running trip generation...');
      const tripProduction = await tripGeneration.execute();
      
      console.log('Running trip distribution...');
      const tripMatrix = await tripDistribution.execute(tripProduction);
      
      console.log('Running mode choice...');
      const modalSplits = await modeChoice.execute(tripMatrix);
      
      console.log('Running network assignment...');
      const assignmentResults = await networkAssignment.execute(modalSplits);

      // Process and aggregate results
      const results = this.processResults(
        assignmentResults, 
        modalSplits,
        tripProduction,
        scenario
      );

      // Store results in database
      const { data: resultData, error: resultError } = await supabase
        .from('scenario_results')
        .insert({
          scenario_id: scenarioId,
          results: results,
          congestion: results.congestion,
          emissions: results.emissions,
          accessibility: results.accessibility,
          safety: results.safety,
          equity: results.equity,
          gis_data: results.gis_data,
          zone_metrics: results.zone_metrics,
          network_metrics: results.network_metrics
        })
        .select('id')
        .single();

      if (resultError) {
        throw new Error(`Failed to store results: ${resultError.message}`);
      }

      // Update model run status to "completed"
      await this.updateModelRunStatus(scenarioId, 'completed', null, new Date());

      return { 
        success: true, 
        resultId: resultData.id 
      };
    } catch (error: any) {
      console.error('CAMP model execution failed:', error);
      
      // Update model run status to "failed"
      await this.updateModelRunStatus(scenarioId, 'failed', error.message);
      
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  /**
   * Get the status of a model run
   */
  public async getModelRunStatus(scenarioId: string): Promise<ModelStatus> {
    const { data, error } = await supabase
      .from('camp_model_runs')
      .select('status, error_message, start_time, end_time')
      .eq('scenario_id', scenarioId)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Failed to fetch model run status:', error);
      return {
        status: 'unknown',
        errorMessage: 'Failed to retrieve status',
        startTime: null,
        endTime: null
      };
    }

    return {
      status: data.status,
      errorMessage: data.error_message,
      startTime: data.start_time,
      endTime: data.end_time
    };
  }

  /**
   * Process model results into a structured format
   */
  private processResults(
    assignmentResults: any,
    modalSplits: any,
    tripProduction: any,
    scenario: any
  ): ScenarioResult {
    // Calculate congestion metrics
    const congestion = this.calculateCongestionMetrics(assignmentResults);
    
    // Calculate emissions
    const emissions = this.calculateEmissions(assignmentResults, modalSplits);
    
    // Calculate accessibility
    const accessibility = this.calculateAccessibility(tripProduction, assignmentResults);
    
    // Calculate safety metrics
    const safety = this.calculateSafetyMetrics(assignmentResults, scenario.assumptions);
    
    // Calculate equity metrics
    const equity = this.calculateEquityMetrics(accessibility, tripProduction);
    
    // Prepare GIS data for visualization
    const gisData = this.prepareGISData(assignmentResults, modalSplits, tripProduction);
    
    // Prepare zone-level metrics
    const zoneMetrics = this.prepareZoneMetrics(tripProduction, accessibility);
    
    // Prepare network-level metrics
    const networkMetrics = this.prepareNetworkMetrics(assignmentResults);

    return {
      congestion,
      emissions,
      accessibility,
      safety,
      equity,
      gis_data: gisData,
      zone_metrics: zoneMetrics,
      network_metrics: networkMetrics
    };
  }

  /**
   * Update the status of a model run in the database
   */
  private async updateModelRunStatus(
    scenarioId: string,
    status: string,
    errorMessage: string | null = null,
    endTime: Date | null = null
  ): Promise<void> {
    const now = new Date();
    
    if (status === 'running') {
      // Create a new model run record
      await supabase.from('camp_model_runs').insert({
        scenario_id: scenarioId,
        status: status,
        start_time: now,
        model_parameters: {} // Add parameters if needed
      });
    } else {
      // Update the latest model run record
      const { data } = await supabase
        .from('camp_model_runs')
        .select('id')
        .eq('scenario_id', scenarioId)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        await supabase
          .from('camp_model_runs')
          .update({
            status: status,
            error_message: errorMessage,
            end_time: endTime || now,
            execution_time: endTime ? 
              (endTime.getTime() - new Date(data.start_time).getTime()) / 1000 : 
              (now.getTime() - new Date(data.start_time).getTime()) / 1000
          })
          .eq('id', data.id);
      }
    }
  }

  /**
   * Calculate congestion metrics from assignment results
   */
  private calculateCongestionMetrics(assignmentResults: any) {
    // Calculate Volume-to-Capacity ratios, delay, travel times, etc.
    const vtcRatios = {}; // Map of link ID to V/C ratio
    const delays = {}; // Map of link ID to delay in minutes
    const travelTimes = {}; // Map of link ID to travel time
    
    // Example implementation
    Object.entries(assignmentResults.linkVolumes).forEach(([linkId, volume]: [string, any]) => {
      const capacity = assignmentResults.linkCapacities[linkId] || 1;
      const vtcRatio = volume / capacity;
      vtcRatios[linkId] = vtcRatio;
      
      // Calculate delay using BPR function
      const freeFlowTime = assignmentResults.linkFreeFlowTimes[linkId] || 1;
      const alpha = 0.15;
      const beta = 4;
      const delay = freeFlowTime * (1 + alpha * Math.pow(vtcRatio, beta)) - freeFlowTime;
      delays[linkId] = delay;
      
      travelTimes[linkId] = freeFlowTime + delay;
    });
    
    return {
      average_vtc: Object.values(vtcRatios).reduce((sum: number, val: number) => sum + val, 0) / Object.values(vtcRatios).length,
      total_delay: Object.values(delays).reduce((sum: number, val: number) => sum + val, 0),
      congested_links: Object.values(vtcRatios).filter((ratio: number) => ratio > 0.8).length,
      vtc_ratios: vtcRatios,
      delays: delays,
      travel_times: travelTimes
    };
  }

  /**
   * Calculate emissions based on assignment results and mode splits
   */
  private calculateEmissions(assignmentResults: any, modalSplits: any) {
    // Emission factors by mode (in grams per passenger-km)
    const co2Factors = {
      car: 120,
      bus: 70,
      rail: 35,
      walk: 0,
      bike: 0
    };
    
    const noxFactors = {
      car: 0.4,
      bus: 0.8,
      rail: 0.05,
      walk: 0,
      bike: 0
    };
    
    const pmFactors = {
      car: 0.03,
      bus: 0.04,
      rail: 0.01,
      walk: 0,
      bike: 0
    };
    
    // Calculate vehicle kilometers traveled (VKT) by mode
    const vkt = {};
    for (const mode in modalSplits) {
      const modeShare = modalSplits[mode];
      vkt[mode] = Object.entries(assignmentResults.linkVolumes)
        .reduce((sum, [linkId, volume]: [string, any]) => {
          const length = assignmentResults.linkLengths[linkId] || 0;
          return sum + (volume * modeShare * length);
        }, 0);
    }
    
    // Calculate emissions
    const co2 = Object.entries(vkt).reduce((sum, [mode, kmTraveled]: [string, any]) => {
      return sum + (kmTraveled * co2Factors[mode] / 1000); // Convert to tonnes
    }, 0);
    
    const nox = Object.entries(vkt).reduce((sum, [mode, kmTraveled]: [string, any]) => {
      return sum + (kmTraveled * noxFactors[mode] / 1000); // Convert to kg
    }, 0);
    
    const pm = Object.entries(vkt).reduce((sum, [mode, kmTraveled]: [string, any]) => {
      return sum + (kmTraveled * pmFactors[mode] / 1000); // Convert to kg
    }, 0);
    
    return {
      co2_tonnes: co2,
      nox_kg: nox,
      pm_kg: pm,
      vkt_by_mode: vkt
    };
  }

  /**
   * Calculate accessibility metrics
   */
  private calculateAccessibility(tripProduction: any, assignmentResults: any) {
    // Jobs accessibility within 30 minutes by various modes
    const jobAccessibility = {};
    const healthcareAccessibility = {};
    const educationAccessibility = {};
    const retailAccessibility = {};
    
    // Example calculation (simplified)
    Object.entries(tripProduction.zones).forEach(([zoneId, zoneData]: [string, any]) => {
      jobAccessibility[zoneId] = {
        transit: this.calculateAccessWithinTime(zoneId, 'jobs', 'transit', 30, assignmentResults),
        car: this.calculateAccessWithinTime(zoneId, 'jobs', 'car', 30, assignmentResults),
        walk: this.calculateAccessWithinTime(zoneId, 'jobs', 'walk', 30, assignmentResults)
      };
      
      healthcareAccessibility[zoneId] = {
        transit: this.calculateAccessWithinTime(zoneId, 'healthcare', 'transit', 30, assignmentResults),
        car: this.calculateAccessWithinTime(zoneId, 'healthcare', 'car', 30, assignmentResults),
        walk: this.calculateAccessWithinTime(zoneId, 'healthcare', 'walk', 30, assignmentResults)
      };
      
      // Similar calculations for education and retail access
    });
    
    return {
      job_accessibility: jobAccessibility,
      healthcare_accessibility: healthcareAccessibility,
      education_accessibility: educationAccessibility,
      retail_accessibility: retailAccessibility
    };
  }

  /**
   * Calculate number of opportunities accessible within a given time threshold
   */
  private calculateAccessWithinTime(originZone: string, opportunityType: string, mode: string, timeThreshold: number, assignmentResults: any) {
    // Simplified example - in a real implementation this would use the travel time matrix
    // and zone opportunity data to calculate accessibility
    
    // Placeholder implementation
    const randomFactor = Math.random() * 100000;
    return Math.floor(randomFactor * (mode === 'car' ? 2 : mode === 'transit' ? 1 : 0.5));
  }

  /**
   * Calculate safety metrics
   */
  private calculateSafetyMetrics(assignmentResults: any, scenarioAssumptions: any) {
    // Simplified implementation - would calculate estimated crashes based on volume, facility type
    // and crash modification factors from the scenario assumptions
    
    // Base crash rates per million VMT by facility type
    const baseCrashRates = {
      freeway: 0.8,
      arterial: 2.5,
      collector: 3.0,
      local: 1.5
    };
    
    // Calculate vehicle miles traveled by facility type
    const vmtByFacilityType = {};
    Object.entries(assignmentResults.linkVolumes).forEach(([linkId, volume]: [string, any]) => {
      const facilityType = assignmentResults.linkTypes[linkId] || 'local';
      const length = assignmentResults.linkLengths[linkId] || 0;
      
      if (!vmtByFacilityType[facilityType]) {
        vmtByFacilityType[facilityType] = 0;
      }
      
      vmtByFacilityType[facilityType] += volume * length;
    });
    
    // Calculate expected crashes
    const crashesByFacilityType = {};
    let totalFatalities = 0;
    let totalInjuries = 0;
    let totalPDO = 0; // Property Damage Only
    
    Object.entries(vmtByFacilityType).forEach(([facilityType, vmt]: [string, any]) => {
      const crashRate = baseCrashRates[facilityType] || 2.0;
      const expectedCrashes = vmt * crashRate / 1000000; // per million VMT
      
      crashesByFacilityType[facilityType] = expectedCrashes;
      
      // Distribute crashes by severity (example proportions)
      totalFatalities += expectedCrashes * 0.01; // 1% fatal
      totalInjuries += expectedCrashes * 0.34; // 34% injury
      totalPDO += expectedCrashes * 0.65; // 65% PDO
    });
    
    // Apply crash modification factors from scenario assumptions
    const safetyAssumptions = scenarioAssumptions.safety || {};
    const cmf = safetyAssumptions.crash_modification_factor || 1.0;
    
    return {
      total_crashes: Object.values(crashesByFacilityType).reduce((sum: number, val: number) => sum + val, 0) * cmf,
      crashes_by_facility_type: crashesByFacilityType,
      fatalities: totalFatalities * cmf,
      injuries: totalInjuries * cmf,
      pdo_crashes: totalPDO * cmf
    };
  }

  /**
   * Calculate equity metrics
   */
  private calculateEquityMetrics(accessibility: any, tripProduction: any) {
    // Example: Calculate job accessibility for equity population groups vs. overall population
    const jobAccessByGroup = {
      low_income: 0,
      minority: 0,
      elderly: 0,
      zero_car: 0,
      overall: 0
    };
    
    let lowIncomePop = 0;
    let minorityPop = 0;
    let elderlyPop = 0;
    let zeroCarPop = 0;
    let totalPop = 0;
    
    // Calculate weighted accessibility by population group
    Object.entries(tripProduction.zones).forEach(([zoneId, zoneData]: [string, any]) => {
      const zoneAccessibility = accessibility.job_accessibility[zoneId];
      if (!zoneAccessibility) return;
      
      const transitAccess = zoneAccessibility.transit || 0;
      
      // Population by group in this zone
      const zoneLowIncome = zoneData.low_income_pop || 0;
      const zoneMinority = zoneData.minority_pop || 0;
      const zoneElderly = zoneData.elderly_pop || 0;
      const zoneZeroCar = zoneData.zero_car_households || 0;
      const zoneTotal = zoneData.total_population || 0;
      
      // Sum weighted accessibility
      jobAccessByGroup.low_income += transitAccess * zoneLowIncome;
      jobAccessByGroup.minority += transitAccess * zoneMinority;
      jobAccessByGroup.elderly += transitAccess * zoneElderly;
      jobAccessByGroup.zero_car += transitAccess * zoneZeroCar;
      jobAccessByGroup.overall += transitAccess * zoneTotal;
      
      // Sum population
      lowIncomePop += zoneLowIncome;
      minorityPop += zoneMinority;
      elderlyPop += zoneElderly;
      zeroCarPop += zoneZeroCar;
      totalPop += zoneTotal;
    });
    
    // Calculate average accessibility per person
    const avgAccessByGroup = {
      low_income: lowIncomePop > 0 ? jobAccessByGroup.low_income / lowIncomePop : 0,
      minority: minorityPop > 0 ? jobAccessByGroup.minority / minorityPop : 0,
      elderly: elderlyPop > 0 ? jobAccessByGroup.elderly / elderlyPop : 0,
      zero_car: zeroCarPop > 0 ? jobAccessByGroup.zero_car / zeroCarPop : 0,
      overall: totalPop > 0 ? jobAccessByGroup.overall / totalPop : 0
    };
    
    // Calculate equity ratios (>1 means group has better than average accessibility)
    const equityRatios = {
      low_income: avgAccessByGroup.overall > 0 ? avgAccessByGroup.low_income / avgAccessByGroup.overall : 1,
      minority: avgAccessByGroup.overall > 0 ? avgAccessByGroup.minority / avgAccessByGroup.overall : 1,
      elderly: avgAccessByGroup.overall > 0 ? avgAccessByGroup.elderly / avgAccessByGroup.overall : 1,
      zero_car: avgAccessByGroup.overall > 0 ? avgAccessByGroup.zero_car / avgAccessByGroup.overall : 1
    };
    
    return {
      avg_accessibility_by_group: avgAccessByGroup,
      equity_ratios: equityRatios
    };
  }

  /**
   * Prepare GIS data for visualization
   */
  private prepareGISData(assignmentResults: any, modalSplits: any, tripProduction: any) {
    // Prepare link-level GIS data
    const linkFeatures = Object.entries(assignmentResults.linkVolumes).map(([linkId, volume]: [string, any]) => {
      const capacity = assignmentResults.linkCapacities[linkId] || 1;
      const vtcRatio = volume / capacity;
      
      return {
        type: 'Feature',
        properties: {
          id: linkId,
          volume: volume,
          capacity: capacity,
          vtc_ratio: vtcRatio,
          facility_type: assignmentResults.linkTypes[linkId] || 'unknown',
          congestion_level: this.categorizeCongestion(vtcRatio)
        },
        geometry: assignmentResults.linkGeometries[linkId] || null
      };
    });
    
    // Prepare zone-level GIS data
    const zoneFeatures = Object.entries(tripProduction.zones).map(([zoneId, zoneData]: [string, any]) => {
      return {
        type: 'Feature',
        properties: {
          id: zoneId,
          trips_produced: zoneData.trips_produced || 0,
          trips_attracted: zoneData.trips_attracted || 0,
          population: zoneData.total_population || 0,
          employment: zoneData.total_employment || 0
        },
        geometry: tripProduction.zoneGeometries[zoneId] || null
      };
    });
    
    return {
      links: {
        type: 'FeatureCollection',
        features: linkFeatures
      },
      zones: {
        type: 'FeatureCollection',
        features: zoneFeatures
      }
    };
  }

  /**
   * Categorize congestion level based on V/C ratio
   */
  private categorizeCongestion(vtcRatio: number): string {
    if (vtcRatio < 0.5) return 'free_flow';
    if (vtcRatio < 0.8) return 'moderate';
    if (vtcRatio < 1.0) return 'heavy';
    if (vtcRatio < 1.2) return 'severe';
    return 'gridlock';
  }

  /**
   * Prepare zone-level metrics
   */
  private prepareZoneMetrics(tripProduction: any, accessibility: any) {
    const zoneMetrics = {};
    
    Object.entries(tripProduction.zones).forEach(([zoneId, zoneData]: [string, any]) => {
      zoneMetrics[zoneId] = {
        trips_produced: zoneData.trips_produced || 0,
        trips_attracted: zoneData.trips_attracted || 0,
        population: zoneData.total_population || 0,
        employment: zoneData.total_employment || 0,
        job_accessibility: accessibility.job_accessibility[zoneId] || {}
      };
    });
    
    return zoneMetrics;
  }

  /**
   * Prepare network-level metrics
   */
  private prepareNetworkMetrics(assignmentResults: any) {
    // Calculate total VMT, VHT, average speed
    let totalVMT = 0;
    let totalVHT = 0;
    
    Object.entries(assignmentResults.linkVolumes).forEach(([linkId, volume]: [string, any]) => {
      const length = assignmentResults.linkLengths[linkId] || 0;
      const travelTime = assignmentResults.linkTravelTimes[linkId] || 0;
      
      const vmt = volume * length;
      const vht = volume * travelTime;
      
      totalVMT += vmt;
      totalVHT += vht;
    });
    
    const avgSpeed = totalVHT > 0 ? totalVMT / totalVHT : 0;
    
    return {
      total_vmt: totalVMT,
      total_vht: totalVHT,
      average_speed: avgSpeed
    };
  }
}

export default CAMPRunner; 