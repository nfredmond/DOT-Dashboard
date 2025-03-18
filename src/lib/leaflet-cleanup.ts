"use client";


// Track initialized map containers to prevent double initialization
const initializedContainers = new Set<string>();

/**
 * Marks a container as initialized to prevent double initialization
 */
export function markContainerAsInitialized(id: string): void {
  if (typeof window !== 'undefined') {
    initializedContainers.add(id);
    
    // Also store in window for cross-instance tracking
    (window as any)._leaflet_initialized_containers = (window as any)._leaflet_initialized_containers || new Set();
    (window as any)._leaflet_initialized_containers.add(id);
  }
}

/**
 * Checks if a container is already initialized
 */
export function isContainerInitialized(id: string): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check our local set
  if (initializedContainers.has(id)) return true;
  
  // Check global set
  const globalSet = (window as any)._leaflet_initialized_containers;
  if (globalSet && globalSet.has(id)) return true;
  
  // Also check DOM for leaflet classes
  const container = document.getElementById(id);
  if (container && container.querySelector('.leaflet-map-pane')) return true;
  
  return false;
}

/**
 * Unmarks a container as initialized so it can be reused
 */
export function unmarkContainerAsInitialized(id: string): void {
  if (typeof window !== 'undefined') {
    initializedContainers.delete(id);
    
    // Also remove from window
    const globalSet = (window as any)._leaflet_initialized_containers;
    if (globalSet) {
      globalSet.delete(id);
    }
  }
}

/**
 * Cleans up a specific Leaflet map by its container ID
 */
export function cleanupLeafletMapById(id: string): void {
  console.log(`Attempting to clean up leaflet map with ID ${id}`);
  
  try {
    // Find the map container
    const container = document.getElementById(id);
    if (!container) {
      console.log(`Map container with ID ${id} not found - proceeding with global cleanup`);
      // Still unmark it as initialized
      unmarkContainerAsInitialized(id);
      
      // Additional cleanup for global instances
      if (typeof window !== 'undefined') {
        // Clean up global map reference if it exists
        if (window.leafletMapInstance) {
          try {
            window.leafletMapInstance.remove();
            window.leafletMapInstance = null;
          } catch (e) {
            console.warn(`Error removing global map instance: ${e}`);
          }
        }
        
        // Clean up any map instances that might still exist
        const globalMaps = (window as any)._leaflet_map_instances || [];
        globalMaps.forEach((map: any) => {
          if (map) {
            try {
              map.remove();
            } catch (e) {
              console.warn('Error removing map instance:', e);
            }
          }
        });
        (window as any)._leaflet_map_instances = [];
        
        // Clean up any leaflet DOM elements that might remain
        try {
          const leafletElements = document.querySelectorAll('[class^="leaflet-"]');
          leafletElements.forEach(el => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        } catch (e) {
          console.warn('Error cleaning up leaflet elements:', e);
        }
      }
      return;
    }

    // Get global Leaflet instances if available
    const globalLeafletMaps = (window as any)._leaflet_map_instances || [];
    
    // Find leaflet map instances associated with this container
    let mapInstance: any = null;
    
    // 1. Check via internal Leaflet properties
    for (const map of globalLeafletMaps) {
      if (map?._container === container) {
        mapInstance = map;
        break;
      }
    }
    
    // 2. Check via DOM containing node
    if (!mapInstance) {
      const mapNodes = container.querySelectorAll('.leaflet-map-pane');
      if (mapNodes.length > 0) {
        // Try to find map instance by searching through all Leaflet maps
        for (const map of globalLeafletMaps) {
          try {
            if (map && map._panes && container.contains(map._panes.mapPane)) {
              mapInstance = map;
              break;
            }
          } catch (e) {
            console.warn(`Error checking map containment: ${e}`);
          }
        }
      }
    }
    
    // If we found a map instance, remove it
    if (mapInstance) {
      try {
        console.log(`Removing map instance for container ${id}`);
        mapInstance.remove();
        
        // Also remove from global registry if it exists
        const globalMaps = (window as any)._leaflet_map_instances || [];
        (window as any)._leaflet_map_instances = globalMaps.filter(
          (m: any) => m !== mapInstance
        );
      } catch (e) {
        console.error(`Error cleaning up leaflet map with ID ${id}:`, e);
      }
    } else {
      console.log(`No map instance found for container ${id}`);
    }
    
    // Clean up any leftover Leaflet elements
    const leafletElements = container.querySelectorAll('[class^="leaflet-"]');
    leafletElements.forEach(el => {
      try {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch (e) {
        console.warn(`Error removing Leaflet element: ${e}`);
      }
    });
    
    // Mark the container as no longer initialized
    unmarkContainerAsInitialized(id);
    
  } catch (e) {
    console.error(`Error cleaning up leaflet map with ID ${id}:`, e);
  }
}

/**
 * Cleans up all Leaflet maps in the document
 */
export function cleanupLeafletMaps(): void {
  try {
    // Store map instances in a global registry for easier cleanup
    const globalLeafletMaps = (window as any)._leaflet_map_instances || [];
    
    console.log(`Found ${globalLeafletMaps.length} leaflet containers to clean up`);
    
    // Remove all map instances
    for (const map of globalLeafletMaps) {
      try {
        if (map && typeof map.remove === 'function') {
          map.remove();
        }
      } catch (e) {
        console.warn('Error removing map:', e);
      }
    }
    
    // Reset the global registry
    (window as any)._leaflet_map_instances = [];
    
    // Clean up custom DOM elements
    document.querySelectorAll('.leaflet-map-wrapper').forEach(wrapper => {
      try {
        const leafletElements = wrapper.querySelectorAll('[class^="leaflet-"]');
        leafletElements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
      } catch (e) {
        console.warn('Error cleaning up wrapper:', e);
      }
    });
    
    // Clear the initialized containers tracking
    initializedContainers.clear();
    (window as any)._leaflet_initialized_containers = new Set();
    
  } catch (e) {
    console.error('Error in cleanupLeafletMaps:', e);
  }
}

/**
 * Resets internal Leaflet global state
 */
export function resetLeafletGlobalState(): void {
  try {
    // Reset various global Leaflet properties
    if (typeof window !== 'undefined') {
      // Reset custom global registry
      (window as any)._leaflet_map_instances = [];
      
      // Clear the initialized containers tracking
      initializedContainers.clear();
      (window as any)._leaflet_initialized_containers = new Set();
      
      // Reset Leaflet's internal state if possible
      if ((window as any).L && (window as any).L.Util && typeof (window as any).L.Util.resetUniqueId === 'function') {
        (window as any).L.Util.resetUniqueId();
      }
      
      // Clean DOM elements with leaflet classes
      document.querySelectorAll('[class^="leaflet-"]').forEach(el => {
        try {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        } catch (e) {
          console.warn('Error removing element:', e);
        }
      });
    }
  } catch (e) {
    console.error('Error in resetLeafletGlobalState:', e);
  }
} 