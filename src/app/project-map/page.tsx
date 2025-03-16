"use client";

import { useEffect, useState, useRef } from 'react';
import { resetLeafletGlobalState } from '@/lib/leaflet-cleanup';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for the map component
const ProjectMapping = dynamic(
  () => import('@/app/components/ProjectMapping').then(mod => mod.ProjectMapping),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[800px] bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    )
  }
);

// Create a stable ID for this page to prevent reinit issues
const STABLE_MAP_ID = `project-map-${Date.now()}`;

export default function ProjectMapPage() {
  const [ready, setReady] = useState(false);
  const mountedRef = useRef(false);
  
  // Setup and cleanup for the map
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    
    console.log("ProjectMapPage: Initializing");
    // Clean up any existing maps
    resetLeafletGlobalState();
    
    // Wait a moment before allowing render
    const timer = setTimeout(() => {
      console.log("ProjectMapPage: Ready to render map");
      setReady(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      resetLeafletGlobalState();
    };
  }, []);
  
  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Project Map</h1>
        <p className="text-muted-foreground">Interactive map showing all projects</p>
      </div>
      
      <div className="flex-1 overflow-hidden relative bg-gray-100">
        {ready && (
          <div className="absolute inset-0">
            <ProjectMapping 
              height="100%"
              width="100%"
              initialZoom={13}
              initialCenter={[39.2615, -121.0149]} // Nevada City, CA
              testingMode={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
