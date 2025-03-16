"use client";

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { resetLeafletGlobalState } from '@/lib/leaflet-cleanup';

// Ensure leaflet CSS is loaded
import 'leaflet/dist/leaflet.css';

// Dynamically import the ProjectMapping component to avoid SSR issues
const ProjectMapping = dynamic(
  () => import('./ProjectMapping').then(mod => mod.ProjectMapping),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] w-full border rounded-md bg-slate-50">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <div className="text-sm text-muted-foreground">Loading map...</div>
        </div>
      </div>
    )
  }
);

interface ProjectMappingWrapperProps {
  height?: number;
  width?: string;
  className?: string;
  initialMapZoom?: number;
  initialMapCenter?: [number, number];
}

export default function ProjectMappingWrapper({
  height = 600,
  width = '100%',
  className = '',
  initialMapZoom = 13,
  initialMapCenter = [39.2615, -121.0149], // Nevada City, CA
}: ProjectMappingWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapId = useRef(`map-wrapper-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Reset Leaflet state when component mounts
    resetLeafletGlobalState();
    
    // Add a delay to make sure DOM is fully rendered
    const timer = setTimeout(() => {
      setIsMounted(true);
      console.log('ProjectMappingWrapper mounted');
    }, 300);

    return () => {
      clearTimeout(timer);
      resetLeafletGlobalState();
    };
  }, []);

  // Force container dimensions after mount
  useEffect(() => {
    if (!mapContainerRef.current || !isMounted) return;
    
    const container = mapContainerRef.current;
    container.style.height = `${height}px`;
    container.style.width = width;
    container.style.minHeight = '500px';
    
    // Force a resize event to help Leaflet calculate dimensions properly
    window.dispatchEvent(new Event('resize'));
  }, [isMounted, height, width]);

  return (
    <div 
      id={mapId.current}
      ref={mapContainerRef} 
      className={`relative border rounded-lg overflow-hidden ${className}`}
      style={{ 
        height: `${height}px`, 
        width, 
        minHeight: '500px'
      }}
      data-testid="project-mapping-wrapper"
    >
      {isMounted && (
        <ProjectMapping 
          height={`${height}px`}
          width={width}
          initialZoom={initialMapZoom}
          initialCenter={initialMapCenter}
        />
      )}
    </div>
  );
} 