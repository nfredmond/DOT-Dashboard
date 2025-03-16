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
  const { projects, filteredProjects, addProject, updateProject, deleteProject } = useProjects() || { projects: [], filteredProjects: [], addProject: () => {}, updateProject: () => {}, deleteProject: () => {} };
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
    if (!mapRef?.current) {
      // If direct mapRef is not available, try using window.leafletMapInstance
      if (typeof window !== 'undefined' && window.leafletMapInstance) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          setSelectedProject(project);
          
          // Find the appropriate map feature to focus on
          let found = false;
          
          // Loop through all layers to find the project
          window.leafletMapInstance.eachLayer((layer: any) => {
            if (layer.projectData && layer.projectData.id === projectId) {
              found = true;
              
              // Highlight the layer
              if (layer.setStyle) {
                layer.setStyle({
                  weight: 5,
                  color: '#3b82f6',
                  opacity: 1,
                  fillOpacity: 0.6
                });
              }
              
              // Center map
              if (layer.getLatLng) {
                window.leafletMapInstance.setView(layer.getLatLng(), zoom || 15);
                layer.openPopup();
              } else if (layer.getBounds) {
                window.leafletMapInstance.fitBounds(layer.getBounds(), { padding: [50, 50] });
                // Create popup in the center of the bounds
                const center = layer.getBounds().getCenter();
                window.L.popup()
                  .setLatLng(center)
                  .setContent(`
                    <div class="p-2">
                      <h3 class="font-bold">${project.name}</h3>
                      <p class="text-sm">${project.description}</p>
                      <div class="flex justify-between text-xs mt-2">
                        <span>${project.status}</span>
                        <span>${project.category}</span>
                      </div>
                    </div>
                  `)
                  .openOn(window.leafletMapInstance);
              }
            }
          });
          
          // If we didn't find the project in layers, fall back to coordinates
          if (!found && project.coordinates) {
            const { latitude, longitude } = project.coordinates;
            window.leafletMapInstance.setView([latitude, longitude], zoom || 15);
            
            // Create a popup
            window.L.popup()
              .setLatLng([latitude, longitude])
              .setContent(`
                <div class="p-2">
                  <h3 class="font-bold">${project.name}</h3>
                  <p class="text-sm">${project.description}</p>
                  <div class="flex justify-between text-xs mt-2">
                    <span>${project.status}</span>
                    <span>${project.category}</span>
                  </div>
                </div>
              `)
              .openOn(window.leafletMapInstance);
          }
        }
      }
      return;
    }
    
    const project = projects.find(p => p.id === projectId);
    if (project) {
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
    // Guard against null or undefined mapRef
    if (!mapRef?.current) return;

    // Clean up previous listener if it exists
    if (eventListenerRef.current) {
      eventListenerRef.current();
      eventListenerRef.current = null;
    }

    // Register a new listener
    const cleanup = registerProjectEventListener((eventType, projectData) => {
      if (!mapRef?.current) return;

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