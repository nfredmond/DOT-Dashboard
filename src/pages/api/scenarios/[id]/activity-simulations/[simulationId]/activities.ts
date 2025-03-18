import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createRouteHandler } from '@/lib/api-utils';
import { supabase } from '@/lib/supabase-client';

/**
 * API endpoint for fetching activities for a specific simulation
 * 
 * GET /api/scenarios/:id/activity-simulations/:simulationId/activities
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
      
      // Fetch activities for this simulation
      // In a real app, you might want to add pagination or limit results
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('simulation_run_id', simulationId)
        .limit(5000); // Reasonable limit to avoid overwhelming the browser
      
      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        return res.status(500).json({ error: 'Failed to fetch activities' });
      }
      
      return res.status(200).json(activities || []);
    } catch (error) {
      console.error('Error in activities endpoint:', error);
      return res.status(500).json({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}); 