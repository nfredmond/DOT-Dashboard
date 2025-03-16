"use client"

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Get auth context but don't throw if not available
  const context = useContext(AuthContext);
  
  // If context is undefined, we're outside an AuthProvider
  const isAuthenticated = context?.isAuthenticated || false;
  const isLoading = context?.isLoading || false;
  const user = context?.user || null;

  useEffect(() => {
    // If we don't have an auth context, redirect to login
    if (!context) {
      router.push('/login');
      return;
    }
    
    // If authentication check is complete
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/login');
      } 
      // If authenticated but role is required and user doesn't have it
      else if (requiredRole && user?.role !== requiredRole) {
        router.push('/homepage');
      }
      // User is authenticated and has required role (or no role required)
      else {
        setIsAuthorized(true);
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, router, user?.role, context]);

  // If no auth context or loading/unauthorized, show loading state
  if (!context || isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Render children only if authenticated and authorized
  return <>{children}</>;
} 