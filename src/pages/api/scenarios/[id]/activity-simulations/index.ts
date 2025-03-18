import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createRouteHandler } from '@/lib/api-utils';
import { ActivitySimulationService } from '@/lib/camp/ActivitySimulationService';
import { supabase } from '@/lib/supabase-client';

/**
 * API handler for managing activity-based simulations
 * 
 * GET /api/scenarios/:id/activity-simulations - List all simulations for a scenario
 * POST /api/scenarios/:id/activity-simulations - Create a new simulation
 */
export default createRouteHandler({
  GET: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { id: scenarioId } = req.query;
      
      // Verify the scenario exists and user has access
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
      
      if (scenarioError || !scenario) {
        return res.status(404).json({ error: 'Scenario not found' });
      }
      
      // Get all simulation runs for the scenario
      const simulationRuns = await ActivitySimulationService.getSimulationRuns(
        scenarioId as string
      );
      
      return res.status(200).json(simulationRuns);
    } catch (error) {
      console.error('Error retrieving simulation runs:', error);
      return res.status(500).json({ 
        error: 'Failed to retrieve simulation runs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  POST: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { id: scenarioId } = req.query;
      
      // Verify the scenario exists and user has access
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
      
      if (scenarioError || !scenario) {
        return res.status(404).json({ error: 'Scenario not found' });
      }
      
      // Get simulation parameters from request body
      const { parameters } = req.body;
      
      if (!parameters) {
        return res.status(400).json({ error: 'Simulation parameters are required' });
      }
      
      // Initialize the simulation service
      const simulationService = new ActivitySimulationService(
        scenarioId as string,
        parameters
      );
      
      // Start the simulation in background and return immediately
      // We'll create the simulation run record first and then update it as the simulation progresses
      const initialRunData = {
        scenario_id: scenarioId as string,
        name: parameters.name || `Simulation run ${new Date().toLocaleDateString()}`,
        description: parameters.description || 'Activity-based simulation run',
        parameters,
        status: 'running',
        results: null,
        error_message: null,
        created_at: new Date().toISOString(),
        completed_at: null
      };
      
      // Create the initial record
      const { data: createdRun, error } = await supabase
        .from('activity_simulation_runs')
        .insert(initialRunData)
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ 
          error: 'Failed to create simulation run',
          details: error.message
        });
      }
      
      // Run the simulation in the background
      // In a production environment, this should be done in a separate process or queue
      simulationService.runSimulation().catch(err => {
        console.error('Error running simulation:', err);
      });
      
      return res.status(201).json(createdRun);
    } catch (error) {
      console.error('Error creating simulation run:', error);
      return res.status(500).json({ 
        error: 'Failed to create simulation run',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}); 