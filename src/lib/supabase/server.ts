import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async (cookieStore?: ReturnType<typeof cookies>) => {
  // If cookieStore is not provided, use an empty implementation to prevent crashes
  if (!cookieStore) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            console.warn("No cookieStore provided when trying to get cookie:", name);
            return undefined;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.warn("No cookieStore provided when trying to set cookie:", name);
          },
          remove(name: string, options: CookieOptions) {
            console.warn("No cookieStore provided when trying to remove cookie:", name);
          },
        },
      }
    );
  }
  
  // Resolve the Promise to get the actual ReadonlyRequestCookies
  const resolvedCookieStore = await cookieStore;
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return resolvedCookieStore.get(name)?.value;
          } catch (error) {
            console.warn("Error getting cookie:", name);
            return undefined;
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            resolvedCookieStore.set({ name, value, ...options });
          } catch (error) {
            console.warn("Error setting cookie:", name);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            resolvedCookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.warn("Error removing cookie:", name);
          }
        },
      },
    }
  );
}; 