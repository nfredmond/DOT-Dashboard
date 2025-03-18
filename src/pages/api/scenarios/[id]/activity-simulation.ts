import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase-client';
import { runActivitySimulation, getSimulationRuns, getSimulationRun } from '@/lib/camp/activity-model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

/**
 * API endpoint for managing activity-based simulations
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  try {
    // Get the authenticated session
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: scenarioId } = req.query;
    
    // Validate the scenario ID is a string
    if (!scenarioId || typeof scenarioId !== 'string') {
      return res.status(400).json({ error: 'Invalid scenario ID' });
    }
    
    // Check if the user has access to this scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*, organizations(*)')
      .eq('id', scenarioId)
      .single();
      
    if (scenarioError || !scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    
    // Get the organization for this scenario
    const organizationId = scenario.organization_id;
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Get simulation runs for this scenario
        if (req.query.runId) {
          // Get a specific simulation run
          const simulationRun = await getSimulationRun(req.query.runId as string);
          
          if (!simulationRun) {
            return res.status(404).json({ error: 'Simulation run not found' });
          }
          
          return res.status(200).json(simulationRun);
        } else {
          // Get all simulation runs
          const simulationRuns = await getSimulationRuns(scenarioId);
          return res.status(200).json(simulationRuns);
        }
        
      case 'POST':
        // Start a new simulation run
        const { name, description, parameters, config } = req.body;
        
        if (!parameters) {
          return res.status(400).json({ error: 'Simulation parameters are required' });
        }
        
        // Run the simulation
        try {
          const results = await runActivitySimulation(
            scenarioId,
            parameters,
            organizationId,
            session.user.id,
            name,
            description,
            config
          );
          
          return res.status(200).json({ 
            success: true, 
            results 
          });
        } catch (error: any) {
          console.error('Failed to run activity simulation:', error);
          return res.status(500).json({ 
            error: 'Failed to run activity simulation', 
            message: error.message 
          });
        }
        
      case 'DELETE':
        // Delete a simulation run
        const { runId } = req.query;
        
        if (!runId || typeof runId !== 'string') {
          return res.status(400).json({ error: 'Simulation run ID is required' });
        }
        
        const { error: deleteError } = await supabase
          .from('activity_simulation_runs')
          .delete()
          .eq('id', runId)
          .eq('scenario_id', scenarioId);
          
        if (deleteError) {
          return res.status(500).json({ 
            error: 'Failed to delete simulation run', 
            message: deleteError.message 
          });
        }
        
        return res.status(200).json({ success: true });
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in activity simulation API:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
} 