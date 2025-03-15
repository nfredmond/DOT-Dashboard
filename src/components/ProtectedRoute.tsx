"use client"

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
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
  }, [isAuthenticated, isLoading, requiredRole, router, user?.role]);

  // Show loading state while checking authentication
  if (isLoading || !isAuthorized) {
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