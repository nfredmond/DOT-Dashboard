import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/middleware';

// Get the app domain from environment variables
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'planningmanager.ai';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Check if the request is for our domain
  const hostname = request.headers.get('host') || '';
  const isPrimaryDomain = hostname.includes(APP_DOMAIN);
  
  // Redirect root path to homepage with highest priority
  // Note: The root page ('/') is still accessible as a separate route in the codebase
  // but we want authenticated users to see the dashboard by default
  if (pathname === '/') {
    console.log('Redirecting from root to homepage via middleware with highest priority');
    return NextResponse.redirect(new URL('/homepage', request.url));
  }
  
  // Only proceed with auth checks for non-root paths
  const { supabase, response } = createClient(request);
  
  // Check auth status
  const { data: { session } } = await supabase.auth.getSession();
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/homepage',
    '/projects',
    '/reports',
    '/settings',
    '/user-management',
    '/project-scoring',
    '/project-mapping',
    '/community',
    '/admin-panel',
    '/llm-assistant',
    '/scenarios'
  ];
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  
  // Proper authentication check
  
  // If the user is not authenticated and trying to access a protected route
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    console.log(`Redirecting unauthenticated user from ${pathname} to login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If the user is authenticated and trying to access login/register
  if (session && publicRoutes.includes(pathname)) {
    console.log(`Redirecting authenticated user from ${pathname} to homepage`);
    return NextResponse.redirect(new URL('/homepage', request.url));
  }
  
  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones we want to exclude
     * NOTE: Explicitly match root path '/'
     */
    '/',
    '/((?!_next/static|_next/image|favicon.ico|favicons|public).*)',
  ],
} 