import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import logger from "@/lib/logger";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
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
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}; 