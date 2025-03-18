import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createRouteHandler } from '@/lib/api-utils';
import { supabase } from '@/lib/supabase-client';

/**
 * @api {get} /api/scenarios/:id/activity-simulations/:simulationId/activities Get Activities
 * @apiDescription Gets all activities for a specific simulation run
 * @apiName GetActivities
 * @apiGroup ActivitySimulation
 * 
 * @apiParam {String} id Scenario ID
 * @apiParam {String} simulationId Simulation ID
 * 
 * @apiSuccess {Array} activities List of activities
 */
export default createRouteHandler({
  GET: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { id: scenarioId, simulationId } = req.query;
      
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500); // Cap at 500
      const offset = (page - 1) * limit;
      
      // Parse sorting parameters
      const sort = (req.query.sort as string) || 'start_time';
      const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
      
      // Filter parameters
      const activityType = req.query.activity_type as string;
      const locationId = req.query.location_id as string;
      const personId = req.query.person_id as string;
      
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
      
      // Build the query
      let query = supabase
        .from('activities')
        .select('*', { count: 'exact' })
        .eq('simulation_run_id', simulationId);
      
      // Apply filters if provided
      if (activityType) {
        query = query.eq('activity_type', activityType);
      }
      
      if (locationId) {
        query = query.eq('activity_location_id', locationId);
      }
      
      if (personId) {
        query = query.eq('person_agent_id', personId);
      }
      
      // Apply sorting and pagination
      const { data: activities, error: activitiesError, count } = await query
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);
      
      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        return res.status(500).json({ error: 'Failed to fetch activities' });
      }
      
      // Return paginated results with metadata
      return res.status(200).json({
        data: activities || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: count ? Math.ceil(count / limit) : 0
        }
      });
    } catch (error) {
      console.error('Error in activities endpoint:', error);
      return res.status(500).json({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}); 