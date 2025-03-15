"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

// This is a simplified version for demonstration
// In a real app, this would check with your auth provider
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Simulate auth check with a timeout
    const checkAuth = setTimeout(() => {
      // For demo, always authenticate
      setIsAuthenticated(true);
      
      // In a real app, you would check session/token:
      // const token = localStorage.getItem('authToken');
      // setIsAuthenticated(!!token);
    }, 500);
    
    return () => clearTimeout(checkAuth);
  }, []);
  
  return { isAuthenticated };
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // Handle redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-muted-foreground">Verifying your access...</p>
        </div>
      </div>
    );
  }
  
  // Show loading while redirecting to login
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  // If authenticated and no role required, or role check passes,
  // render the children components
  return <>{children}</>;
} 