import { useEffect, useState, useCallback, useRef } from 'react';
import { Project } from '@/types/project';
import { useProjects } from '@/contexts/ProjectsContext';
import { 
  registerProjectEventListener, 
  projectToGeoJSON, 
  flyToProject 
} from '@/lib/map/project-map-integration';

/**
 * Hook for integrating with map components
 * @param mapRef Reference to a Leaflet map instance
 * @returns Object with map integration utilities
 */
export function useMapIntegration(mapRef: React.MutableRefObject<any>) {
  const { projects, filteredProjects, addProject, updateProject, deleteProject } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const eventListenerRef = useRef<(() => void) | null>(null);

  // Convert projects to GeoJSON for map display
  const projectsAsGeoJSON = useCallback(() => {
    return filteredProjects
      .map(projectToGeoJSON)
      .filter(Boolean); // Remove null values
  }, [filteredProjects]);

  // Focus on a specific project
  const focusProject = useCallback((projectId: string, zoom?: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project && mapRef.current) {
      setSelectedProject(project);
      flyToProject(mapRef.current, project, zoom);
    }
  }, [projects, mapRef]);

  // Handle project selection on the map
  const handleProjectSelect = useCallback((projectId: string) => {
    focusProject(projectId);
  }, [focusProject]);

  // Create a new project at a specific location
  const createProjectAtLocation = useCallback((lat: number, lng: number) => {
    const newProject: Partial<Project> = {
      name: 'New Project',
      description: 'Project description',
      status: 'Planning', // Assuming this is a valid ProjectStatus
      category: 'Other',
      coordinates: {
        latitude: lat,
        longitude: lng
      }
    };
    
    return newProject;
  }, []);

  // Setup event listeners for project updates
  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up previous listener if it exists
    if (eventListenerRef.current) {
      eventListenerRef.current();
      eventListenerRef.current = null;
    }

    // Register a new listener
    const cleanup = registerProjectEventListener((eventType, projectData) => {
      if (!mapRef.current) return;

      switch (eventType) {
        case 'add':
          // Handle project added
          break;
        case 'update':
          // Handle project updated
          if (selectedProject?.id === projectData.id) {
            setSelectedProject(projectData as Project);
          }
          break;
        case 'delete':
          // Handle project deleted
          if (selectedProject?.id === projectData.id) {
            setSelectedProject(null);
          }
          break;
      }
    });

    eventListenerRef.current = cleanup;

    // Clean up when component unmounts
    return () => {
      if (eventListenerRef.current) {
        eventListenerRef.current();
      }
    };
  }, [mapRef, selectedProject]);

  return {
    projects,
    filteredProjects,
    selectedProject,
    setSelectedProject,
    addProject,
    updateProject,
    deleteProject,
    projectsAsGeoJSON,
    focusProject,
    handleProjectSelect,
    createProjectAtLocation
  };
} 