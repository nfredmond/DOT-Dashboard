"use client";

import React, { useEffect, useCallback } from 'react';
import { getProjectsData, syncWithMainMap } from './fallback-map';
import type { MapConfig } from './fallback-map-types';
import { useProjects } from '@/contexts/ProjectsContext';
import type { Project } from '@/contexts/ProjectsContext';

/**
 * MapBridge component acts as a mediator between the main Leaflet map
 * and the fallback map implementation. It ensures both maps use the same
 * project data and configuration settings.
 */
const MapBridge: React.FC<{
  mainMapProjects?: any[];
  mainMapConfig?: any; // More generic type to avoid type mismatches
  onFallbackMapProjects?: (projects: any[]) => void;
}> = ({ 
  mainMapProjects, 
  mainMapConfig,
  onFallbackMapProjects 
}) => {
  // Get projects from the central context
  const { projects: contextProjects } = useProjects();
  
  // When main map projects change, update the fallback map
  useEffect(() => {
    if (mainMapProjects && mainMapProjects.length > 0) {
      console.log('MapBridge: Syncing main map projects to fallback map', mainMapProjects.length);
      syncWithMainMap(mainMapProjects);
    }
  }, [mainMapProjects]);
  
  // When context projects change, update both maps
  useEffect(() => {
    if (contextProjects && contextProjects.length > 0) {
      console.log('MapBridge: Syncing context projects to maps', contextProjects.length);
      syncWithMainMap(contextProjects);
      
      // If there's a callback to update the main map, call it
      if (onFallbackMapProjects) {
        onFallbackMapProjects(contextProjects);
      }
    }
  }, [contextProjects, onFallbackMapProjects]);
  
  // When main map config changes, apply to fallback map
  useEffect(() => {
    if (mainMapConfig) {
      console.log('MapBridge: Main map config updated');
      // This would update fallback map config in a real implementation
      // For now, we're already passing config when initializing the map
    }
  }, [mainMapConfig]);
  
  // Share fallback map projects with the main map when requested
  const shareFallbackData = useCallback(() => {
    if (onFallbackMapProjects) {
      const projects = getProjectsData();
      console.log('MapBridge: Sharing fallback map projects with main map', projects.length);
      onFallbackMapProjects(projects);
    }
  }, [onFallbackMapProjects]);
  
  // Set up event listeners for map communication
  useEffect(() => {
    // Listen for project changes in the fallback map
    const handleFallbackProjectUpdate = () => {
      shareFallbackData();
    };
    
    // Listen for map ready events
    const handleMapReady = () => {
      console.log('MapBridge: Fallback map is ready');
      shareFallbackData();
    };
    
    // Listen for app-wide project updates (from any part of the app)
    const handleAppProjectsUpdated = (event: CustomEvent<{ projects: Project[] }>) => {
      const { projects } = event.detail;
      console.log('MapBridge: Received app-projects-updated event with', projects.length, 'projects');
      
      // Update both maps with the new projects
      if (projects && projects.length > 0) {
        syncWithMainMap(projects);
        
        if (onFallbackMapProjects) {
          onFallbackMapProjects(projects);
        }
      }
    };
    
    // Set up event listeners
    window.addEventListener('fallback-projects-updated', handleFallbackProjectUpdate);
    window.addEventListener('leaflet-map-ready', handleMapReady);
    window.addEventListener('app-projects-updated', handleAppProjectsUpdated as EventListener);
    
    // Clean up listeners on unmount
    return () => {
      window.removeEventListener('fallback-projects-updated', handleFallbackProjectUpdate);
      window.removeEventListener('leaflet-map-ready', handleMapReady);
      window.removeEventListener('app-projects-updated', handleAppProjectsUpdated as EventListener);
    };
  }, [shareFallbackData, onFallbackMapProjects]);
  
  // This component doesn't render anything visible
  return null;
};

export default MapBridge; 