import { Project } from "@/types/project";

/**
 * Utility functions for integrating projects with map components
 * and synchronizing between project management and mapping systems
 */

/**
 * Converts a project to GeoJSON format for map display
 * @param project Project data
 * @returns GeoJSON feature object
 */
export const projectToGeoJSON = (project: Project) => {
  // If project already has geometry, use it
  if (project.geometry) {
    return {
      type: "Feature",
      geometry: project.geometry,
      properties: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        category: project.category,
        ceBudget: project.ceBudget,
        projectType: project.type
      }
    };
  }

  // If no geometry but has coordinates, create a point geometry
  if (project.coordinates?.latitude && project.coordinates?.longitude) {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [project.coordinates.longitude, project.coordinates.latitude]
      },
      properties: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        category: project.category,
        ceBudget: project.ceBudget,
        projectType: project.type
      }
    };
  }

  // If no geometry or coordinates, return null
  return null;
};

/**
 * Converts GeoJSON feature to project coordinates
 * @param feature GeoJSON feature
 * @returns Coordinates object { latitude, longitude }
 */
export const geoJSONToCoordinates = (feature: any) => {
  if (!feature || !feature.geometry) return null;

  switch (feature.geometry.type) {
    case "Point":
      return {
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0]
      };
    case "LineString":
    case "Polygon":
      // For lines and polygons, we use the center point
      const bounds = getBoundsFromGeoJSON(feature);
      if (!bounds) return null;
      
      return {
        latitude: (bounds.north + bounds.south) / 2,
        longitude: (bounds.east + bounds.west) / 2
      };
    default:
      return null;
  }
};

/**
 * Gets bounds from a GeoJSON feature
 * @param feature GeoJSON feature
 * @returns Bounds object { north, south, east, west }
 */
export const getBoundsFromGeoJSON = (feature: any) => {
  if (!feature || !feature.geometry) return null;

  let coordinates: number[][] = [];

  switch (feature.geometry.type) {
    case "Point":
      coordinates = [feature.geometry.coordinates];
      break;
    case "LineString":
      coordinates = feature.geometry.coordinates;
      break;
    case "Polygon":
      coordinates = feature.geometry.coordinates[0];
      break;
    default:
      return null;
  }

  if (coordinates.length === 0) return null;

  // Initialize bounds with first coordinate
  let bounds = {
    north: coordinates[0][1],
    south: coordinates[0][1],
    east: coordinates[0][0],
    west: coordinates[0][0]
  };

  // Update bounds with all coordinates
  coordinates.forEach(coord => {
    bounds.north = Math.max(bounds.north, coord[1]);
    bounds.south = Math.min(bounds.south, coord[1]);
    bounds.east = Math.max(bounds.east, coord[0]);
    bounds.west = Math.min(bounds.west, coord[0]);
  });

  return bounds;
};

/**
 * Dispatches a project update event
 * @param eventType Type of event (add, update, delete)
 * @param projectData Project data
 */
export const dispatchProjectEvent = (eventType: 'add' | 'update' | 'delete', projectData: Partial<Project>) => {
  const event = new CustomEvent('project-event', {
    detail: {
      type: eventType,
      project: projectData
    }
  });
  
  window.dispatchEvent(event);
};

/**
 * Registers a listener for project events
 * @param callback Callback function to handle project events
 * @returns Cleanup function to remove the listener
 */
export const registerProjectEventListener = (
  callback: (eventType: 'add' | 'update' | 'delete', projectData: Partial<Project>) => void
) => {
  const handleEvent = (event: CustomEvent) => {
    const { type, project } = event.detail;
    callback(type, project);
  };

  window.addEventListener('project-event', handleEvent as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('project-event', handleEvent as EventListener);
  };
};

/**
 * Synchronizes local storage with project state
 * @param projects Array of projects
 */
export const syncProjectsToLocalStorage = (projects: Project[]) => {
  localStorage.setItem('projects', JSON.stringify(projects));
};

/**
 * Loads projects from local storage
 * @returns Array of projects or empty array if none found
 */
export const loadProjectsFromLocalStorage = (): Project[] => {
  const projectsJson = localStorage.getItem('projects');
  if (!projectsJson) return [];
  
  try {
    return JSON.parse(projectsJson);
  } catch (error) {
    console.error('Failed to parse projects from localStorage:', error);
    return [];
  }
};

/**
 * Stores a draft project in local storage for the project wizard
 * @param partialProject Partial project data
 */
export const storeDraftProject = (partialProject: Partial<Project>) => {
  localStorage.setItem('draftProject', JSON.stringify(partialProject));
};

/**
 * Loads a draft project from local storage
 * @returns Partial project data or null if none found
 */
export const loadDraftProject = (): Partial<Project> | null => {
  const projectJson = localStorage.getItem('draftProject');
  if (!projectJson) return null;
  
  try {
    return JSON.parse(projectJson);
  } catch (error) {
    console.error('Failed to parse draft project from localStorage:', error);
    return null;
  }
};

/**
 * Clears a draft project from local storage
 */
export const clearDraftProject = () => {
  localStorage.removeItem('draftProject');
};

/**
 * Generates a fly-to animation for a project
 * @param map Leaflet map instance
 * @param project Project to fly to
 * @param zoom Zoom level (optional)
 */
export const flyToProject = (map: any, project: Project, zoom?: number) => {
  if (!map || !project) return;
  
  // If project has coordinates, fly to them
  if (project.coordinates?.latitude && project.coordinates?.longitude) {
    map.flyTo(
      [project.coordinates.latitude, project.coordinates.longitude],
      zoom || map.getZoom(),
      { duration: 1 }
    );
    return;
  }
  
  // If project has geometry, create bounds and fly to them
  if (project.geometry) {
    const bounds = getBoundsFromGeoJSON({
      type: "Feature",
      geometry: project.geometry
    });
    
    if (bounds) {
      map.flyToBounds([
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ], { duration: 1, padding: [50, 50] });
    }
  }
}; 