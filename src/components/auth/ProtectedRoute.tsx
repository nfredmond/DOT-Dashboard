"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Handle redirect and authorization
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
  
  // Show loading state while checking auth
  if (isLoading || !isAuthorized) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-muted-foreground">Verifying your access...</p>
        </div>
      </div>
    );
  }
  
  // If authenticated and no role required, or role check passes,
  // render the children components
  return <>{children}</>;
} 