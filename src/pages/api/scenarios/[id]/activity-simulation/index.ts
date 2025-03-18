import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getSupabaseServerClient } from '@/lib/supabase';
import { PopulationSynthesis } from '@/lib/camp/activity-model/PopulationSynthesis';
import { ActivityGeneration } from '@/lib/camp/activity-model/ActivityGeneration';
import { TravelItineraryGeneration } from '@/lib/camp/activity-model/TravelItineraryGeneration';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const supabase = getSupabaseServerClient();
  const { id: scenarioId } = req.query;

  if (!scenarioId || typeof scenarioId !== 'string') {
    return res.status(400).json({ message: 'Scenario ID is required' });
  }

  // Check if the user has access to the scenario
  const { data: scenario, error: scenarioError } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (scenarioError || !scenario) {
    return res.status(404).json({ message: 'Scenario not found' });
  }

  if (scenario.user_id !== session.user.id) {
    return res.status(403).json({ message: 'Not authorized to access this scenario' });
  }

  switch (req.method) {
    case 'GET':
      return getSimulationRuns(req, res, supabase, scenarioId);
    case 'POST':
      return startSimulation(req, res, supabase, scenarioId, scenario);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

// Get all simulation runs for a scenario
async function getSimulationRuns(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  scenarioId: string
) {
  const { data, error } = await supabase
    .from('activity_simulation_runs')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching simulation runs:', error);
    return res.status(500).json({ message: 'Failed to fetch simulation runs', error });
  }

  return res.status(200).json(data || []);
}

// Start a new simulation run
async function startSimulation(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  scenarioId: string,
  scenario: any
) {
  const { name, description, parameters } = req.body;

  if (!name || !parameters) {
    return res.status(400).json({ message: 'Name and parameters are required' });
  }

  try {
    // Create a new simulation run record
    const { data: runData, error: runError } = await supabase
      .from('activity_simulation_runs')
      .insert({
        scenario_id: scenarioId,
        name,
        description,
        parameters,
        status: 'running',
        results: null,
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating simulation run:', runError);
      return res.status(500).json({ message: 'Failed to create simulation run', error: runError });
    }

    // Start the simulation process asynchronously
    // This would ideally be handled by a background job, but for simplicity, we'll run it in the request
    simulateActivities(supabase, scenarioId, runData.id, parameters, scenario)
      .then(() => {
        console.log(`Simulation ${runData.id} completed successfully`);
      })
      .catch((error) => {
        console.error(`Simulation ${runData.id} failed:`, error);
        // Update the simulation status to failed
        supabase
          .from('activity_simulation_runs')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', runData.id);
      });

    return res.status(201).json(runData);
  } catch (error) {
    console.error('Error starting simulation:', error);
    return res.status(500).json({ message: 'Failed to start simulation', error });
  }
}

// Run the activity-based simulation process
async function simulateActivities(
  supabase: any,
  scenarioId: string,
  runId: string,
  parameters: any,
  scenario: any
) {
  try {
    // Step 1: Generate synthetic population
    const populationSynthesis = new PopulationSynthesis(
      scenarioId,
      parameters,
      supabase
    );
    const personAgents = await populationSynthesis.generatePopulation();

    // Step 2: Generate activities for the population
    const activityGeneration = new ActivityGeneration(
      scenarioId,
      parameters,
      personAgents,
      supabase
    );
    const activities = await activityGeneration.generateActivities();

    // Step 3: Generate travel itineraries between activities
    const travelGeneration = new TravelItineraryGeneration(
      scenarioId,
      parameters,
      personAgents,
      activities,
      scenario.network_data, // Use the network data from the scenario
      supabase
    );
    const travelItineraries = await travelGeneration.generateItineraries();

    // Step 4: Process results and calculate metrics
    const results = await processResults(
      supabase,
      scenarioId,
      runId,
      personAgents,
      activities,
      travelItineraries
    );

    // Step 5: Update the simulation run with results
    const { error: updateError } = await supabase
      .from('activity_simulation_runs')
      .update({
        status: 'completed',
        results,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (updateError) {
      throw new Error(`Failed to update simulation results: ${updateError.message}`);
    }

    return results;
  } catch (error) {
    // Update the simulation status to failed
    const { error: updateError } = await supabase
      .from('activity_simulation_runs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (updateError) {
      console.error('Failed to update simulation status:', updateError);
    }

    throw error;
  }
}

// Process simulation results and calculate metrics
async function processResults(
  supabase: any,
  scenarioId: string,
  runId: string,
  personAgents: any[],
  activities: any[],
  travelItineraries: any[]
) {
  // Calculate basic statistics
  const totalPersons = personAgents.length;
  const totalActivities = activities.length;
  const totalTrips = travelItineraries.length;

  // Calculate mode split
  const modeSplit = travelItineraries.reduce((acc, trip) => {
    acc[trip.mode] = (acc[trip.mode] || 0) + 1;
    return acc;
  }, {});

  // Calculate trips by purpose
  const tripsByPurpose = activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {});

  // Calculate trips by time of day
  const tripsByHour = travelItineraries.reduce((acc, trip) => {
    const hour = new Date(trip.departure_time).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  // Find peak hour
  const peakHour = Object.entries(tripsByHour)
    .sort((a, b) => b[1] - a[1])
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))[0];

  return {
    summary: {
      total_persons: totalPersons,
      total_activities: totalActivities,
      total_trips: totalTrips,
      peak_hour: peakHour,
    },
    mode_split: Object.entries(modeSplit).map(([mode, count]) => ({
      mode,
      count,
      percentage: (count as number) / totalTrips,
    })),
    trips_by_purpose: Object.entries(tripsByPurpose).map(([purpose, count]) => ({
      purpose,
      count,
      percentage: (count as number) / totalActivities,
    })),
    temporal_distribution: Object.entries(tripsByHour).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
      percentage: (count as number) / totalTrips,
    })),
  };
} 