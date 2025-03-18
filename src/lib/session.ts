import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from './supabase';

export async function getSession(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabaseServerClient();
  
  // Get session from cookie
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    console.error('Session error:', error);
    return null;
  }
  
  return session;
} 