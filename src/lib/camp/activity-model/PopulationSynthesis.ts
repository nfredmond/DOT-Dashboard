/**
 * Population Synthesis Module
 * 
 * Responsible for generating a synthetic population of person agents representing the study area.
 * Uses iterative proportional fitting (IPF) or similar methods to match control totals.
 */

import { supabase } from '@/lib/supabase-client';
import { PersonAgent, ModelParameters } from '@/types/camp';
import { v4 as uuidv4 } from 'uuid';

export class PopulationSynthesis {
  private scenarioId: string;
  private zoneData: any;
  private parameters: ModelParameters;
  private supabase: any;
  private simulationRunId: string = '';

  constructor(scenarioId: string, zoneData: any, parameters: ModelParameters, supabase: any) {
    this.scenarioId = scenarioId;
    this.zoneData = zoneData;
    this.parameters = parameters;
    this.supabase = supabase;
  }

  /**
   * Generate synthetic population based on control totals
   */
  public async synthesizePopulation(): Promise<PersonAgent[]> {
    console.log('Synthesizing population...');
    
    if (!this.parameters.activity_based?.population_synthesis) {
      throw new Error('Activity-based population synthesis parameters are not defined');
    }

    const popParams = this.parameters.activity_based.population_synthesis;
    const zones = this.zoneData.zones;
    const syntheticPopulation: PersonAgent[] = [];
    
    // Get seed households if available, otherwise create from scratch
    const seedHouseholds = await this.getSeedHouseholds();
    
    // For each zone, generate the appropriate number of persons
    for (const zoneId in zones) {
      const zone = zones[zoneId];
      
      // Calculate how many persons to generate
      const targetPopulation = Math.round(zone.population * popParams.seed_penetration_rate);
      
      // Determine household distribution for this zone
      const householdSizeDistribution = this.calculateHouseholdSizeDistribution(zone, popParams);
      const householdIncomeDistribution = this.calculateHouseholdIncomeDistribution(zone, popParams);
      const householdVehicleDistribution = this.calculateHouseholdVehicleDistribution(zone, popParams);
      
      // Generate households
      const households = this.generateHouseholds(
        zoneId, 
        targetPopulation, 
        householdSizeDistribution,
        householdIncomeDistribution,
        householdVehicleDistribution,
        seedHouseholds
      );
      
      // For each household, generate persons
      let personCount = 0;
      for (const household of households) {
        const persons = this.generatePersonsInHousehold(
          household,
          zoneId,
          popParams
        );
        
        syntheticPopulation.push(...persons);
        personCount += persons.length;
      }
      
      console.log(`Generated ${personCount} persons in ${households.length} households for zone ${zoneId}`);
    }
    
    // Store the synthetic population in the database
    await this.storePopulation(syntheticPopulation);
    
    return syntheticPopulation;
  }
  
  /**
   * Get seed households from the database if available
   */
  private async getSeedHouseholds(): Promise<any[]> {
    // Check if we have seed households in the database
    const { data, error } = await supabase
      .from('seed_households')
      .select('*')
      .limit(1000);
      
    if (error) {
      console.error('Error fetching seed households:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Calculate household size distribution for a zone
   */
  private calculateHouseholdSizeDistribution(zone: any, popParams: any): Record<number, number> {
    // Use control totals if available, otherwise use defaults
    if (zone.household_size_distribution) {
      return zone.household_size_distribution;
    }
    
    // Default distribution
    return {
      1: 0.28, // 1-person households
      2: 0.34, // 2-person households
      3: 0.15, // 3-person households
      4: 0.13, // 4-person households
      5: 0.07, // 5-person households
      6: 0.03  // 6+ person households
    };
  }
  
  /**
   * Calculate household income distribution for a zone
   */
  private calculateHouseholdIncomeDistribution(zone: any, popParams: any): Record<string, number> {
    // Use control totals if available, otherwise use defaults
    if (zone.household_income_distribution) {
      return zone.household_income_distribution;
    }
    
    // Default distribution
    return {
      'low': 0.3,    // Low income
      'medium': 0.5, // Medium income
      'high': 0.2    // High income
    };
  }
  
  /**
   * Calculate household vehicle distribution for a zone
   */
  private calculateHouseholdVehicleDistribution(zone: any, popParams: any): Record<number, number> {
    // Use control totals if available, otherwise use defaults
    if (zone.household_vehicle_distribution) {
      return zone.household_vehicle_distribution;
    }
    
    // Default distribution - can be adjusted based on zone characteristics
    const transitAccess = zone.transit_accessibility || 0;
    const density = zone.population / (zone.area || 1);
    
    let zeroCarPct = 0.1 + (transitAccess * 0.2) + (Math.min(density / 10000, 1) * 0.1);
    
    return {
      0: zeroCarPct,           // 0 vehicles
      1: 0.4,                  // 1 vehicle
      2: 0.4 - (zeroCarPct - 0.1), // 2 vehicles
      3: 0.1                   // 3+ vehicles
    };
  }
  
  /**
   * Generate households for a zone
   */
  private generateHouseholds(
    zoneId: string,
    targetPopulation: number,
    householdSizeDistribution: Record<number, number>,
    householdIncomeDistribution: Record<string, number>,
    householdVehicleDistribution: Record<number, number>,
    seedHouseholds: any[]
  ): any[] {
    const households = [];
    let currentPopulation = 0;
    let householdId = 1;
    
    // Keep generating households until we reach the target population
    while (currentPopulation < targetPopulation) {
      // Sample household size
      const householdSize = this.sampleFromDistribution(householdSizeDistribution);
      
      // Sample household income
      const householdIncome = this.sampleFromDistribution(householdIncomeDistribution);
      
      // Sample household vehicles
      const householdVehicles = this.sampleFromDistribution(householdVehicleDistribution);
      
      // Create the household
      const household = {
        id: `${zoneId}_${householdId}`,
        zoneId: zoneId,
        size: householdSize,
        income: householdIncome,
        vehicles: householdVehicles
      };
      
      households.push(household);
      currentPopulation += householdSize;
      householdId++;
    }
    
    return households;
  }
  
  /**
   * Generate persons within a household
   */
  private generatePersonsInHousehold(
    household: any,
    zoneId: string,
    popParams: any
  ): PersonAgent[] {
    const persons: PersonAgent[] = [];
    const householdSize = household.size;
    
    // Age distribution parameters
    const ageDistribution = popParams.controls.age_distribution || {
      'child': 0.2,      // 0-15
      'youth': 0.1,      // 16-18
      'young_adult': 0.2, // 19-24
      'adult': 0.3,      // 25-44
      'middle_age': 0.15, // 45-64
      'senior': 0.05     // 65+
    };
    
    // Employment distribution parameters
    const employmentDistribution = popParams.controls.employment_status || {
      'full_time': 0.5,
      'part_time': 0.15,
      'unemployed': 0.1,
      'retired': 0.1,
      'student': 0.15
    };
    
    // For each person in the household
    for (let i = 0; i < householdSize; i++) {
      // Determine if this is the head of household
      const isHead = i === 0;
      
      // Sample age category
      const ageCategory = this.sampleFromDistribution(ageDistribution);
      
      // Convert age category to actual age
      const age = this.ageFromCategory(ageCategory);
      
      // Sample employment status based on age
      const employmentStatus = this.sampleEmploymentStatus(age, employmentDistribution);
      
      // Determine student status based on age
      const studentStatus = this.determineStudentStatus(age, employmentStatus);
      
      // Work and school zones - will be assigned later in more detail
      const workZoneId = employmentStatus === 'full_time' || employmentStatus === 'part_time' 
        ? this.selectWorkZone(zoneId) 
        : undefined;
        
      const schoolZoneId = studentStatus === 'full_time' || studentStatus === 'part_time'
        ? this.selectSchoolZone(zoneId, age)
        : undefined;
      
      // Generate the person
      const person: PersonAgent = {
        scenarioId: this.scenarioId,
        homeZoneId: zoneId,
        workZoneId,
        schoolZoneId,
        age,
        gender: Math.random() < 0.5 ? 'female' : 'male',
        employmentStatus,
        studentStatus,
        householdId: household.id,
        householdIncomeGroup: household.income,
        householdSize: householdSize,
        householdVehicles: household.vehicles,
        driverLicense: age >= 16 && Math.random() < 0.9,
        hasTransitPass: this.determineTransitPass(zoneId, employmentStatus, studentStatus),
        hasMobilityLimitation: this.determineMobilityLimitation(age),
        simulationWeight: 1.0 / popParams.seed_penetration_rate
      };
      
      persons.push(person);
    }
    
    return persons;
  }
  
  /**
   * Sample a value from a discrete distribution
   */
  private sampleFromDistribution(distribution: Record<string | number, number>): any {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [value, probability] of Object.entries(distribution)) {
      cumulative += probability;
      if (rand < cumulative) {
        return value;
      }
    }
    
    // Fallback - return the last key
    return Object.keys(distribution)[Object.keys(distribution).length - 1];
  }
  
  /**
   * Convert age category to actual age
   */
  private ageFromCategory(category: string): number {
    const ageRanges = {
      'child': [0, 15],
      'youth': [16, 18],
      'young_adult': [19, 24],
      'adult': [25, 44],
      'middle_age': [45, 64],
      'senior': [65, 90]
    };
    
    const range = ageRanges[category as keyof typeof ageRanges];
    if (!range) return 30; // Default adult age
    
    return Math.floor(range[0] + Math.random() * (range[1] - range[0]));
  }
  
  /**
   * Sample employment status based on age and distribution
   */
  private sampleEmploymentStatus(age: number, distribution: Record<string, number>): string {
    // Adjust distribution based on age
    const adjustedDistribution = { ...distribution };
    
    if (age < 16) {
      // Children don't work
      return 'none';
    } else if (age < 19) {
      // Teens mostly don't work or work part-time
      adjustedDistribution.full_time = 0.05;
      adjustedDistribution.part_time = 0.3;
      adjustedDistribution.unemployed = 0.05;
      adjustedDistribution.student = 0.6;
      adjustedDistribution.retired = 0;
    } else if (age < 25) {
      // Young adults - mix of students and workers
      adjustedDistribution.full_time = 0.3;
      adjustedDistribution.part_time = 0.3;
      adjustedDistribution.unemployed = 0.1;
      adjustedDistribution.student = 0.3;
      adjustedDistribution.retired = 0;
    } else if (age < 65) {
      // Working age adults
      adjustedDistribution.full_time = 0.7;
      adjustedDistribution.part_time = 0.1;
      adjustedDistribution.unemployed = 0.1;
      adjustedDistribution.student = 0.1;
      adjustedDistribution.retired = 0;
    } else {
      // Seniors
      adjustedDistribution.full_time = 0.1;
      adjustedDistribution.part_time = 0.1;
      adjustedDistribution.unemployed = 0.1;
      adjustedDistribution.student = 0;
      adjustedDistribution.retired = 0.7;
    }
    
    return this.sampleFromDistribution(adjustedDistribution);
  }
  
  /**
   * Determine student status based on age and employment
   */
  private determineStudentStatus(age: number, employmentStatus: string): string {
    if (age < 5) return 'none';
    if (age < 19) return 'full_time';
    
    if (age < 25) {
      if (employmentStatus === 'student') return 'full_time';
      if (employmentStatus === 'part_time') return Math.random() < 0.5 ? 'part_time' : 'none';
      return Math.random() < 0.3 ? 'part_time' : 'none';
    }
    
    if (age < 35) {
      if (employmentStatus === 'student') return 'full_time';
      return Math.random() < 0.1 ? 'part_time' : 'none';
    }
    
    // Older adults have lower probability of being students
    return Math.random() < 0.05 ? 'part_time' : 'none';
  }
  
  /**
   * Select a work zone based on the home zone
   */
  private selectWorkZone(homeZoneId: string): string {
    // This would be based on work location choice model
    // For now, use a simple placeholder
    const zoneIds = Object.keys(this.zoneData.zones);
    const randomZoneIndex = Math.floor(Math.random() * zoneIds.length);
    
    // 30% chance of working in the home zone
    if (Math.random() < 0.3) {
      return homeZoneId;
    }
    
    return zoneIds[randomZoneIndex];
  }
  
  /**
   * Select a school zone based on the home zone and age
   */
  private selectSchoolZone(homeZoneId: string, age: number): string {
    // This would be based on school location choice model
    // For now, use a simple placeholder
    const zoneIds = Object.keys(this.zoneData.zones);
    
    if (age < 15) {
      // Elementary/middle school - likely close to home
      return homeZoneId;
    } else if (age < 19) {
      // High school - might be in another zone
      const nearbyZones = this.getNearbyZones(homeZoneId, 1);
      return nearbyZones[Math.floor(Math.random() * nearbyZones.length)];
    } else {
      // College/university - could be anywhere
      const randomZoneIndex = Math.floor(Math.random() * zoneIds.length);
      return zoneIds[randomZoneIndex];
    }
  }
  
  /**
   * Get nearby zones within a certain distance
   */
  private getNearbyZones(zoneId: string, maxDistance: number): string[] {
    // In a real implementation, this would use spatial data
    // For now, return all zones as a placeholder
    const allZones = Object.keys(this.zoneData.zones);
    return [zoneId, ...allZones.filter(z => z !== zoneId)];
  }
  
  /**
   * Determine if person has a transit pass
   */
  private determineTransitPass(
    zoneId: string,
    employmentStatus: string,
    studentStatus: string
  ): boolean {
    const zone = this.zoneData.zones[zoneId];
    const transitAccess = zone.transit_accessibility || 0;
    
    // Higher likelihood in transit-accessible areas
    let baseProbability = 0.1 + (transitAccess * 0.4);
    
    // Students and full-time workers more likely to have transit passes
    if (studentStatus === 'full_time') baseProbability += 0.2;
    if (employmentStatus === 'full_time') baseProbability += 0.1;
    
    return Math.random() < baseProbability;
  }
  
  /**
   * Determine if person has mobility limitations
   */
  private determineMobilityLimitation(age: number): boolean {
    // Probability increases with age
    let probability = 0.01;
    
    if (age > 65) probability = 0.1;
    if (age > 75) probability = 0.2;
    if (age > 85) probability = 0.3;
    
    return Math.random() < probability;
  }
  
  /**
   * Store the synthetic population in the database
   */
  private async storePopulation(population: PersonAgent[]): Promise<void> {
    // Delete any existing persons for this scenario
    await supabase
      .from('person_agents')
      .delete()
      .eq('scenario_id', this.scenarioId);
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 100;
    
    for (let i = 0; i < population.length; i += batchSize) {
      const batch = population.slice(i, i + batchSize);
      
      // Convert to database format
      const dbRecords = batch.map(person => ({
        scenario_id: person.scenarioId,
        home_zone_id: person.homeZoneId,
        work_zone_id: person.workZoneId,
        school_zone_id: person.schoolZoneId,
        age: person.age,
        gender: person.gender,
        employment_status: person.employmentStatus,
        student_status: person.studentStatus,
        household_id: person.householdId,
        household_income_group: person.householdIncomeGroup,
        household_size: person.householdSize,
        household_vehicles: person.householdVehicles,
        driver_license: person.driverLicense,
        has_transit_pass: person.hasTransitPass,
        has_mobility_limitation: person.hasMobilityLimitation,
        simulation_weight: person.simulationWeight
      }));
      
      const { error } = await supabase
        .from('person_agents')
        .insert(dbRecords);
      
      if (error) {
        console.error('Error storing synthetic population:', error);
        throw error;
      }
    }
    
    console.log(`Successfully stored ${population.length} person agents in the database`);
  }

  /**
   * Generate a synthetic population based on parameter definitions
   * 
   * @returns Array of generated person agents
   */
  public async generatePopulation(): Promise<Map<string, PersonAgent>> {
    console.log('Generating synthetic population...');
    
    if (!this.parameters.activity_based?.population) {
      throw new Error('Activity-based population parameters are not defined');
    }

    const popParams = this.parameters.activity_based.population;
    const personAgents: Map<string, PersonAgent> = new Map();
    const households: Record<string, any> = {};
    
    try {
      // Get first simulation run to set the ID
      const { data: runData } = await this.supabase
        .from('activity_simulation_runs')
        .select('id')
        .eq('scenario_id', this.scenarioId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (runData && runData.length > 0) {
        this.simulationRunId = runData[0].id;
      } else {
        throw new Error('No simulation run found for this scenario');
      }

      // Generate households
      const targetPopulationSize = popParams.target_size || 1000;
      const householdSizes = this.generateHouseholdSizes(popParams, targetPopulationSize);
      
      // Create household objects
      let totalPersons = 0;
      for (let i = 0; i < householdSizes.length; i++) {
        const householdSize = householdSizes[i];
        const householdId = uuidv4();
        households[householdId] = {
          id: householdId,
          size: householdSize,
          persons: []
        };
        totalPersons += householdSize;
      }
      
      console.log(`Created ${Object.keys(households).length} households with ${totalPersons} total persons`);
      
      // Generate person agents for each household
      let personCount = 0;
      for (const householdId in households) {
        const household = households[householdId];
        
        // Generate person for each household member
        for (let i = 0; i < household.size; i++) {
          const personId = uuidv4();
          const person = this.generatePerson(personId, householdId, popParams);
          
          personAgents.set(personId, person);
          household.persons.push(personId);
          personCount++;
          
          // Store person in database in batches to avoid request size limits
          if (personCount % 100 === 0 || personCount === totalPersons) {
            await this.storePersonAgents(Array.from(personAgents.values()).slice(Math.max(0, personCount - 100), personCount));
            console.log(`Stored ${Math.min(personCount, 100)} person agents (${personCount}/${totalPersons})`);
          }
        }
      }
      
      return personAgents;
    } catch (error) {
      console.error('Error generating population:', error);
      throw error;
    }
  }
  
  /**
   * Generate array of household sizes based on distribution
   */
  private generateHouseholdSizes(popParams: any, targetPopulationSize: number): number[] {
    const householdSizes: number[] = [];
    let totalPersons = 0;
    
    // If household size distribution is defined, use it
    if (popParams.household_sizes && popParams.household_sizes.length > 0) {
      const sizesDistribution = popParams.household_sizes;
      
      // Create cumulative distribution
      const cumulativeDistribution: Array<{ size: number, cumProb: number }> = [];
      let cumProb = 0;
      
      for (const sizeObj of sizesDistribution) {
        cumProb += sizeObj.percentage;
        cumulativeDistribution.push({
          size: sizeObj.size,
          cumProb: cumProb
        });
      }
      
      // Generate households until we reach the target population
      while (totalPersons < targetPopulationSize) {
        // Sample from distribution
        const rand = Math.random();
        let selectedSize = 2; // Default to 2-person household
        
        for (const item of cumulativeDistribution) {
          if (rand <= item.cumProb) {
            selectedSize = item.size;
            break;
          }
        }
        
        householdSizes.push(selectedSize);
        totalPersons += selectedSize;
      }
    } else {
      // Use default distribution if not specified
      const defaultSizeDistribution = [
        { size: 1, prob: 0.3 },
        { size: 2, prob: 0.35 },
        { size: 3, prob: 0.15 },
        { size: 4, prob: 0.12 },
        { size: 5, prob: 0.05 },
        { size: 6, prob: 0.03 }
      ];
      
      // Generate households until we reach the target population
      while (totalPersons < targetPopulationSize) {
        const rand = Math.random();
        let cumProb = 0;
        let selectedSize = 2; // Default
        
        for (const item of defaultSizeDistribution) {
          cumProb += item.prob;
          if (rand <= cumProb) {
            selectedSize = item.size;
            break;
          }
        }
        
        householdSizes.push(selectedSize);
        totalPersons += selectedSize;
      }
    }
    
    return householdSizes;
  }
  
  /**
   * Generate an individual person agent
   */
  private generatePerson(personId: string, householdId: string, popParams: any): PersonAgent {
    // Generate age based on distribution
    const age = this.generateAge(popParams.age_distribution);
    
    // Generate gender based on gender ratio
    const gender = this.generateGender(popParams.gender_ratio || 0.5);
    
    // Generate income level
    const incomeLevel = this.generateIncomeLevel(popParams.income_levels);
    
    // Generate occupation
    const occupation = this.generateOccupation(popParams.occupations, age);
    
    // Additional properties as needed
    const properties = {
      has_vehicle: Math.random() < 0.7,
      has_transit_pass: Math.random() < 0.3,
      has_bicycle: Math.random() < 0.4
    };
    
    return {
      id: personId,
      simulation_run_id: this.simulationRunId,
      household_id: householdId,
      age,
      gender,
      income_level: incomeLevel,
      occupation,
      properties,
      created_at: new Date().toISOString()
    };
  }
  
  /**
   * Generate age based on distribution parameters
   */
  private generateAge(ageDistribution: any): number {
    if (!ageDistribution) {
      // Default: normal distribution with mean 35, std dev 15, min 0, max 100
      return this.generateNormalDistribution(35, 15, 0, 100);
    }
    
    return this.generateNormalDistribution(
      ageDistribution.mean || 35,
      ageDistribution.std_dev || 15,
      ageDistribution.min || 0,
      ageDistribution.max || 100
    );
  }
  
  /**
   * Generate gender based on gender ratio
   * @param maleRatio - Proportion of population that should be male (0-1)
   */
  private generateGender(maleRatio: number): string {
    return Math.random() < maleRatio ? 'male' : 'female';
  }
  
  /**
   * Generate income level based on distribution
   */
  private generateIncomeLevel(incomeLevels: any[]): string {
    if (!incomeLevels || incomeLevels.length === 0) {
      // Default income levels if not specified
      const defaultLevels = [
        { name: 'low', percentage: 0.3 },
        { name: 'medium', percentage: 0.5 },
        { name: 'high', percentage: 0.2 }
      ];
      
      return this.sampleFromDistribution(defaultLevels);
    }
    
    return this.sampleFromDistribution(incomeLevels);
  }
  
  /**
   * Generate occupation based on distribution and age
   */
  private generateOccupation(occupations: any[], age: number): string {
    // Filter out implausible occupations based on age
    if (age < 16) {
      return 'student';
    }
    
    if (age >= 65) {
      const retirementProb = (age - 65) / 20; // Probability increases with age
      if (Math.random() < retirementProb) {
        return 'retired';
      }
    }
    
    if (!occupations || occupations.length === 0) {
      // Default occupations if not specified
      const defaultOccupations = [
        { name: 'employed_full_time', percentage: 0.5 },
        { name: 'employed_part_time', percentage: 0.15 },
        { name: 'student', percentage: 0.15 },
        { name: 'unemployed', percentage: 0.1 },
        { name: 'retired', percentage: 0.1 }
      ];
      
      return this.sampleFromDistribution(defaultOccupations);
    }
    
    return this.sampleFromDistribution(occupations);
  }
  
  /**
   * Generate a value from a normal distribution
   */
  private generateNormalDistribution(mean: number, stdDev: number, min: number, max: number): number {
    // Box-Muller transform for normal distribution
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    
    let value = mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    
    // Clamp to min/max
    value = Math.max(min, Math.min(max, value));
    
    // Return integer value
    return Math.round(value);
  }
  
  /**
   * Sample a value from a distribution object
   */
  private sampleFromDistribution(distribution: any[]): string {
    const rand = Math.random();
    let cumProb = 0;
    
    for (const item of distribution) {
      cumProb += item.percentage;
      if (rand <= cumProb) {
        return item.name;
      }
    }
    
    // If we somehow get here, return the first item
    return distribution[0].name;
  }
  
  /**
   * Store person agents in the database
   */
  private async storePersonAgents(persons: PersonAgent[]): Promise<void> {
    if (persons.length === 0) return;
    
    try {
      const { error } = await this.supabase
        .from('person_agents')
        .insert(persons);
      
      if (error) {
        console.error('Error storing person agents:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to store person agents:', error);
      throw error;
    }
  }
} 