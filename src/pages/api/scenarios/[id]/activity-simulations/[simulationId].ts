import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createRouteHandler } from '@/lib/api-utils';
import { ActivitySimulationService } from '@/lib/camp/ActivitySimulationService';
import { supabase } from '@/lib/supabase-client';

/**
 * API handler for managing individual activity-based simulations
 * 
 * GET /api/scenarios/:id/activity-simulations/:simulationId - Get a specific simulation
 * DELETE /api/scenarios/:id/activity-simulations/:simulationId - Delete a simulation
 */
export default createRouteHandler({
  GET: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { id: scenarioId, simulationId } = req.query;
      
      // Verify the scenario exists and user has access
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
      
      if (scenarioError || !scenario) {
        return res.status(404).json({ error: 'Scenario not found' });
      }
      
      // Get the specific simulation run
      try {
        const simulationRun = await ActivitySimulationService.getSimulationRun(
          simulationId as string
        );
        
        // Verify this simulation belongs to the scenario
        if (simulationRun.scenario_id !== scenarioId) {
          return res.status(404).json({ error: 'Simulation not found in this scenario' });
        }
        
        return res.status(200).json(simulationRun);
      } catch (error) {
        return res.status(404).json({ error: 'Simulation not found' });
      }
    } catch (error) {
      console.error('Error retrieving simulation run:', error);
      return res.status(500).json({ 
        error: 'Failed to retrieve simulation run',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  DELETE: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { id: scenarioId, simulationId } = req.query;
      
      // Verify the scenario exists and user has access
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
      
      if (scenarioError || !scenario) {
        return res.status(404).json({ error: 'Scenario not found' });
      }
      
      // Verify the simulation exists and belongs to this scenario
      const { data: simulationRun, error: simulationError } = await supabase
        .from('activity_simulation_runs')
        .select('*')
        .eq('id', simulationId)
        .single();
      
      if (simulationError || !simulationRun) {
        return res.status(404).json({ error: 'Simulation not found' });
      }
      
      if (simulationRun.scenario_id !== scenarioId) {
        return res.status(404).json({ error: 'Simulation not found in this scenario' });
      }
      
      // Delete the simulation and all associated data
      await ActivitySimulationService.deleteSimulationRun(simulationId as string);
      
      return res.status(200).json({ message: 'Simulation deleted successfully' });
    } catch (error) {
      console.error('Error deleting simulation run:', error);
      return res.status(500).json({ 
        error: 'Failed to delete simulation run',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}); 