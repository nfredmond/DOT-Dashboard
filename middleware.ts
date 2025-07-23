import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Log the request for debugging
    console.log(`Middleware: Processing request for ${pathname}`);
    
    // Handle root path redirect
    if (pathname === '/') {
      console.log('Middleware: Redirecting from / to /homepage');
      return NextResponse.redirect(new URL('/homepage', request.url));
    }
    
    // Allow all other requests to proceed
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, just continue with the request
    return NextResponse.next();
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public).*)',
  ],
} 