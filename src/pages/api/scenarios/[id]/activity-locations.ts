import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createRouteHandler } from '@/lib/api-utils';
import { supabase } from '@/lib/supabase-client';

/**
 * API endpoint for fetching activity locations for a scenario
 * 
 * GET /api/scenarios/:id/activity-locations
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
      
      // Fetch activity locations for this scenario
      const { data: locations, error: locationsError } = await supabase
        .from('activity_locations')
        .select('*')
        .eq('scenario_id', scenarioId);
      
      if (locationsError) {
        console.error('Error fetching activity locations:', locationsError);
        return res.status(500).json({ error: 'Failed to fetch activity locations' });
      }
      
      return res.status(200).json(locations || []);
    } catch (error) {
      console.error('Error in activity locations endpoint:', error);
      return res.status(500).json({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}); 