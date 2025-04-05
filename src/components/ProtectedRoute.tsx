"use client"

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  requiredRole?: string;
}

export function ProtectedRoute({ children, adminOnly = false, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (adminOnly && user?.role !== "admin") {
        router.push("/dashboard");
      } else if (requiredRole && user?.role !== requiredRole) {
        router.push("/homepage");
      }
    }
  }, [isAuthenticated, isLoading, router, adminOnly, requiredRole, user]);

  // During server-side rendering or loading, show a loading spinner
  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // On the client, if not authenticated, don't render children (router will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // If admin only and user is not admin, don't render children (router will redirect)
  if (adminOnly && user?.role !== "admin") {
    return null;
  }

  // If required role is specified and user doesn't have that role, don't render children
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // User is authenticated and has required permissions, render the protected content
  return <>{children}</>;
} 