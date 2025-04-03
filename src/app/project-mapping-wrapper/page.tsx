"use client";

import { useState, useEffect } from 'react';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProjectsProvider } from '@/contexts/ProjectsContext';
import { MapboxProjectMappingWrapper } from '@/app/components/MapboxProjectMappingWrapper';

export default function ProjectMappingWrapper() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state after a short delay to ensure client-side only rendering
  useEffect(() => {
    // Set a timeout to ensure DOM is fully available
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Wait for component to be mounted before rendering the map
  if (!isMounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <div className="mt-4 text-sm text-muted-foreground">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <SupabaseProvider>
      <AuthProvider>
        <ProjectsProvider>
          <div className="h-screen w-full flex flex-col overflow-hidden">
            <div className="flex-1 relative w-full h-full border-0 m-0 p-0">
              <MapboxProjectMappingWrapper 
                height="100%"
                width="100%"
                initialMapZoom={12}
                initialMapCenter={[-121.0149, 39.2615]} // Nevada City, CA (lng, lat)
              />
            </div>
          </div>
        </ProjectsProvider>
      </AuthProvider>
    </SupabaseProvider>
  );
} 