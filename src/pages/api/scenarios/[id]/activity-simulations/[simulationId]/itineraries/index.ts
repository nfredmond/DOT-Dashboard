import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createRouteHandler } from '@/lib/api-utils';
import { supabase } from '@/lib/supabase-client';

/**
 * @api {get} /api/scenarios/:id/activity-simulations/:simulationId/itineraries Get Travel Itineraries
 * @apiDescription Gets all travel itineraries for a specific simulation run
 * @apiName GetTravelItineraries
 * @apiGroup ActivitySimulation
 * 
 * @apiParam {String} id Scenario ID
 * @apiParam {String} simulationId Simulation ID
 * 
 * @apiSuccess {Array} itineraries List of travel itineraries
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
      const sort = (req.query.sort as string) || 'departure_time';
      const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
      
      // Filter parameters
      const mode = req.query.mode as string;
      const personId = req.query.person_id as string;
      const minDistance = parseInt(req.query.min_distance as string);
      const maxDistance = parseInt(req.query.max_distance as string);
      
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
        .from('travel_itineraries')
        .select('*', { count: 'exact' })
        .eq('simulation_run_id', simulationId);
      
      // Apply filters if provided
      if (mode) {
        query = query.eq('mode', mode);
      }
      
      if (personId) {
        query = query.eq('person_agent_id', personId);
      }
      
      if (!isNaN(minDistance)) {
        query = query.gte('distance_meters', minDistance);
      }
      
      if (!isNaN(maxDistance)) {
        query = query.lte('distance_meters', maxDistance);
      }
      
      // Apply sorting and pagination
      const { data: itineraries, error: itinerariesError, count } = await query
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);
      
      if (itinerariesError) {
        console.error('Error fetching travel itineraries:', itinerariesError);
        return res.status(500).json({ error: 'Failed to fetch travel itineraries' });
      }
      
      // Return paginated results with metadata
      return res.status(200).json({
        data: itineraries || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: count ? Math.ceil(count / limit) : 0
        }
      });
    } catch (error) {
      console.error('Error in travel itineraries endpoint:', error);
      return res.status(500).json({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}); 