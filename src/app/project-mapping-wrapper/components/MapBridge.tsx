"use client";

import { useEffect } from 'react';
import { useProjects, PROJECT_EVENTS, type Project } from '@/contexts/ProjectsContext';

interface MapBridgeProps {
  onProjectAdded?: (project: Project) => void;
  onProjectUpdated?: (project: Project) => void;
  onProjectDeleted?: (project: Project) => void;
  onFallbackMapProjects?: (projects: any[]) => void;
  mainMapProjects?: any[];
  mainMapConfig?: any;
}

/**
 * MapBridge is a component that handles synchronization between the project management system
 * and the maps. It listens for events from the ProjectsContext and propagates them to map components.
 */
export function MapBridge({ 
  onProjectAdded, 
  onProjectUpdated, 
  onProjectDeleted,
  onFallbackMapProjects,
  mainMapProjects,
  mainMapConfig
}: MapBridgeProps) {
  const projectsContext = useProjects();
  const projects = projectsContext?.projects || [];
  
  // Set up event listeners for project changes
  useEffect(() => {
    // Handler for project added events
    const handleProjectAdded = (event: CustomEvent<Project>) => {
      console.log('MapBridge: Project added event received', event.detail);
      onProjectAdded?.(event.detail);
    };
    
    // Handler for project updated events
    const handleProjectUpdated = (event: CustomEvent<Project>) => {
      console.log('MapBridge: Project updated event received', event.detail);
      onProjectUpdated?.(event.detail);
    };
    
    // Handler for project deleted events
    const handleProjectDeleted = (event: CustomEvent<Project>) => {
      console.log('MapBridge: Project deleted event received', event.detail);
      onProjectDeleted?.(event.detail);
    };
    
    // Add event listeners
    window.addEventListener(PROJECT_EVENTS.ADDED, handleProjectAdded as EventListener);
    window.addEventListener(PROJECT_EVENTS.UPDATED, handleProjectUpdated as EventListener);
    window.addEventListener(PROJECT_EVENTS.DELETED, handleProjectDeleted as EventListener);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener(PROJECT_EVENTS.ADDED, handleProjectAdded as EventListener);
      window.removeEventListener(PROJECT_EVENTS.UPDATED, handleProjectUpdated as EventListener);
      window.removeEventListener(PROJECT_EVENTS.DELETED, handleProjectDeleted as EventListener);
    };
  }, [onProjectAdded, onProjectUpdated, onProjectDeleted]);
  
  // Load initial projects
  useEffect(() => {
    // Pass all existing projects to the onProjectAdded handler on initial load
    if (projects.length > 0 && onProjectAdded) {
      console.log('MapBridge: Initializing with', projects.length, 'projects');
      projects.forEach(project => {
        onProjectAdded(project);
      });
    }
  }, [projects, onProjectAdded]);
  
  // This component doesn't render anything - it's just a bridge for events
  return null;
} 