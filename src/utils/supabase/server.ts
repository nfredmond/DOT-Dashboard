import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import logger from "@/lib/logger";

export const createClient = async (cookieStore?: Awaited<ReturnType<typeof cookies>>) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    logger.error('Missing Supabase environment variables', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    });
    throw new Error(
      "Supabase URL and Key are required. Please check your environment variables: " +
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  
  // If no cookieStore is provided, await cookies()
  const store = cookieStore || (await cookies());
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            store.set({ name, value, ...options });
          } catch (error) {
            // Handle errors when cookies can't be set in middleware or static routes
            logger.warn('Failed to set cookie', { name, error });
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            store.set({ name, value: '', ...options });
          } catch (error) {
            // Handle errors when cookies can't be removed in middleware or static routes
            logger.warn('Failed to remove cookie', { name, error });
          }
        },
      },
    }
  );
}; 