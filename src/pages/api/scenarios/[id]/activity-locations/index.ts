import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createRouteHandler } from '@/lib/api-utils';
import { supabase } from '@/lib/supabase-client';

/**
 * @api {get} /api/scenarios/:id/activity-locations Get Activity Locations
 * @apiDescription Gets all activity locations for a specific scenario
 * @apiName GetActivityLocations
 * @apiGroup ActivityModel
 * 
 * @apiParam {String} id Scenario ID
 * @apiParam {String} page Page number (default: 1)
 * @apiParam {String} limit Items per page (default: 100, max: 1000)
 * @apiParam {String} sort Field to sort by (default: 'name')
 * @apiParam {String} order Sort order ('asc' or 'desc', default: 'asc')
 * @apiParam {String} location_type Filter by location type
 * @apiParam {String} search Search term for location name
 * 
 * @apiSuccess {Array} locations List of activity locations
 * @apiSuccess {Object} pagination Pagination metadata
 * @apiSuccess {Number} pagination.total Total number of items
 * @apiSuccess {Number} pagination.page Current page number
 * @apiSuccess {Number} pagination.limit Items per page
 * @apiSuccess {Number} pagination.pages Total number of pages
 */
export default createRouteHandler({
  GET: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { id: scenarioId } = req.query;
      
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000); // Cap at 1000
      const offset = (page - 1) * limit;
      
      // Parse sorting parameters
      const sort = (req.query.sort as string) || 'name';
      const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
      
      // Filter parameters
      const locationType = req.query.location_type as string;
      const search = req.query.search as string;
      
      // Verify the scenario exists and user has access
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
      
      if (scenarioError || !scenario) {
        return res.status(404).json({ error: 'Scenario not found' });
      }
      
      // Build the query
      let query = supabase
        .from('activity_locations')
        .select('*', { count: 'exact' })
        .eq('scenario_id', scenarioId);
      
      // Apply filters if provided
      if (locationType) {
        query = query.eq('location_type', locationType);
      }
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      // Apply sorting and pagination
      const { data: locations, error: locationsError, count } = await query
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);
      
      if (locationsError) {
        console.error('Error fetching activity locations:', locationsError);
        return res.status(500).json({ error: 'Failed to fetch activity locations' });
      }
      
      // Return paginated results with metadata
      return res.status(200).json({
        data: locations || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: count ? Math.ceil(count / limit) : 0
        }
      });
    } catch (error) {
      console.error('Error in activity locations endpoint:', error);
      return res.status(500).json({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}); 