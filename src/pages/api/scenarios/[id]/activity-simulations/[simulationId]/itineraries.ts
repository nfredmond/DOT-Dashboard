import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createRouteHandler } from '@/lib/api-utils';
import { supabase } from '@/lib/supabase-client';

/**
 * API endpoint for fetching travel itineraries for a specific simulation
 * 
 * GET /api/scenarios/:id/activity-simulations/:simulationId/itineraries
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
      
      // Verify the simulation exists and belongs to this scenario
      const { data: simulation, error: simulationError } = await supabase
        .from('activity_simulation_runs')
        .select('*')
        .eq('id', simulationId)
        .eq('scenario_id', scenarioId)
        .single();
      
      if (simulationError || !simulation) {
        return res.status(404).json({ error: 'Simulation not found' });
      }
      
      // Fetch travel itineraries for this simulation
      // Apply a reasonable limit to avoid overwhelming the browser
      const { data: itineraries, error: itinerariesError } = await supabase
        .from('travel_itineraries')
        .select('*')
        .eq('simulation_run_id', simulationId)
        .limit(5000);
      
      if (itinerariesError) {
        console.error('Error fetching travel itineraries:', itinerariesError);
        return res.status(500).json({ error: 'Failed to fetch travel itineraries' });
      }
      
      return res.status(200).json(itineraries || []);
    } catch (error) {
      console.error('Error in travel itineraries endpoint:', error);
      return res.status(500).json({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}); 