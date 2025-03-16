"use client";

/**
 * Debug utility to diagnose Leaflet map loading issues
 * This can be imported in the project-mapping-wrapper page to help identify problems
 */

export function debugLeafletLoading() {
  if (typeof window === 'undefined') return;
  
  console.log('=============================================');
  console.log('LEAFLET DEBUG INFORMATION');
  console.log('=============================================');
  
  // Check if Leaflet is loaded
  console.log('Leaflet global:', !!window.L);
  
  // Check for map instances
  console.log('Leaflet map instances:', window._leaflet_map_instances?.length || 0);
  console.log('Current map instance:', !!window.leafletMapInstance);
  
  // Check for DOM elements
  const leafletElements = document.querySelectorAll('[class^="leaflet-"]');
  console.log('Leaflet DOM elements:', leafletElements.length);
  
  // Check for containers
  const containers = document.querySelectorAll('.leaflet-container');
  console.log('Leaflet containers:', containers.length);
  
  // Check for CSS
  const leafletCSS = document.querySelector('link[href*="leaflet.css"]');
  console.log('Leaflet CSS loaded:', !!leafletCSS);
  
  // Check if window has issues
  try {
    console.log('Window dimensions:', window.innerWidth, window.innerHeight);
    console.log('Document dimensions:', document.documentElement.clientWidth, document.documentElement.clientHeight);
  } catch (e) {
    console.error('Error checking window dimensions:', e);
  }
  
  console.log('=============================================');
}

export function fixLeafletContainers() {
  if (typeof window === 'undefined') return;
  
  try {
    // Find all map containers
    const containers = document.querySelectorAll('.leaflet-container');
    console.log(`Found ${containers.length} leaflet containers to fix`);
    
    containers.forEach((container, index) => {
      try {
        // Force visibility and dimensions
        (container as HTMLElement).style.display = 'block';
        (container as HTMLElement).style.visibility = 'visible';
        (container as HTMLElement).style.minWidth = '300px';
        (container as HTMLElement).style.minHeight = '300px';
        
        console.log(`Fixed container ${index+1}`);
      } catch (e) {
        console.warn(`Error fixing container ${index+1}:`, e);
      }
    });
    
    // Also check for map wrappers
    const wrappers = document.querySelectorAll('[data-leaflet-container-id]');
    console.log(`Found ${wrappers.length} map wrappers to fix`);
    
    wrappers.forEach((wrapper, index) => {
      try {
        // Force visibility and dimensions
        (wrapper as HTMLElement).style.display = 'block';
        (wrapper as HTMLElement).style.visibility = 'visible';
        (wrapper as HTMLElement).style.minWidth = '300px';
        (wrapper as HTMLElement).style.minHeight = '300px';
        
        console.log(`Fixed wrapper ${index+1}`);
      } catch (e) {
        console.warn(`Error fixing wrapper ${index+1}:`, e);
      }
    });
    
    // Try to force a resize
    window.dispatchEvent(new Event('resize'));
    
    // Try to invalidate any existing map
    if (window.leafletMapInstance) {
      try {
        window.leafletMapInstance.invalidateSize(true);
      } catch (e) {
        console.warn('Error invalidating map size:', e);
      }
    }
  } catch (e) {
    console.error('Error in fixLeafletContainers:', e);
  }
} 