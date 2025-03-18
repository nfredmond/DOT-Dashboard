import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getSupabaseServerClient } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const supabase = getSupabaseServerClient();
  const { id: scenarioId, runId } = req.query;

  if (!scenarioId || typeof scenarioId !== 'string') {
    return res.status(400).json({ message: 'Scenario ID is required' });
  }

  if (!runId || typeof runId !== 'string') {
    return res.status(400).json({ message: 'Run ID is required' });
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
      return getSimulationRun(req, res, supabase, scenarioId, runId);
    case 'DELETE':
      return deleteSimulationRun(req, res, supabase, scenarioId, runId);
    default:
      res.setHeader('Allow', ['GET', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

// Get a specific simulation run
async function getSimulationRun(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  scenarioId: string,
  runId: string
) {
  const { data, error } = await supabase
    .from('activity_simulation_runs')
    .select('*')
    .eq('id', runId)
    .eq('scenario_id', scenarioId)
    .single();

  if (error) {
    console.error('Error fetching simulation run:', error);
    return res.status(500).json({ message: 'Failed to fetch simulation run', error });
  }

  if (!data) {
    return res.status(404).json({ message: 'Simulation run not found' });
  }

  return res.status(200).json(data);
}

// Delete a simulation run
async function deleteSimulationRun(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  scenarioId: string,
  runId: string
) {
  try {
    // First, delete related data
    // Delete travel itineraries
    const { error: itinerariesError } = await supabase
      .from('travel_itineraries')
      .delete()
      .eq('simulation_run_id', runId);

    if (itinerariesError) {
      console.error('Error deleting travel itineraries:', itinerariesError);
      return res.status(500).json({ 
        message: 'Failed to delete simulation run: could not delete travel itineraries', 
        error: itinerariesError 
      });
    }

    // Delete activities
    const { error: activitiesError } = await supabase
      .from('activities')
      .delete()
      .eq('simulation_run_id', runId);

    if (activitiesError) {
      console.error('Error deleting activities:', activitiesError);
      return res.status(500).json({ 
        message: 'Failed to delete simulation run: could not delete activities', 
        error: activitiesError 
      });
    }

    // Delete person agents
    const { error: personsError } = await supabase
      .from('person_agents')
      .delete()
      .eq('simulation_run_id', runId);

    if (personsError) {
      console.error('Error deleting person agents:', personsError);
      return res.status(500).json({ 
        message: 'Failed to delete simulation run: could not delete person agents', 
        error: personsError 
      });
    }

    // Finally, delete the simulation run record
    const { error: runError } = await supabase
      .from('activity_simulation_runs')
      .delete()
      .eq('id', runId)
      .eq('scenario_id', scenarioId);

    if (runError) {
      console.error('Error deleting simulation run:', runError);
      return res.status(500).json({ 
        message: 'Failed to delete simulation run record', 
        error: runError 
      });
    }

    return res.status(200).json({ message: 'Simulation run deleted successfully' });
  } catch (error) {
    console.error('Error deleting simulation run:', error);
    return res.status(500).json({ message: 'Failed to delete simulation run', error });
  }
} 