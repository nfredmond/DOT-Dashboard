import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (client) return client;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key must be provided');
  }
  
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'planningmanager.ai';
  const _appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${appDomain}`;
  
  client = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      storageKey: 'planning-manager-auth',
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-app-domain': appDomain
      }
    }
  });
  
  return client;
} 