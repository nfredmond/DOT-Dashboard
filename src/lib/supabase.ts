import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Environment variables should be defined in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a Supabase client for browser usage
export const getSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Create a Supabase client for server-side usage
export const getSupabaseServerClient = () => {
  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
};

// Create a Supabase client with service role for admin operations
export const getSupabaseAdminClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}; 