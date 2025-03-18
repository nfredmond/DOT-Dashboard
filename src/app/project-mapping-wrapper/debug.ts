import logger from '../../lib/logger';
"use client";

/**
 * Debug utility to diagnose Leaflet map loading issues
 * This can be imported in the project-mapping-wrapper page to help identify problems
 */

export function debugLeafletLoading() {
  if (typeof window === 'undefined') return;
  
  logger.log('=============================================');
  logger.log('LEAFLET DEBUG INFORMATION');
  logger.log('=============================================');
  
  // Check if Leaflet is loaded
  logger.log('Leaflet global:', !!window.L);
  
  // Check for map instances
  logger.log('Leaflet map instances:', window._leaflet_map_instances?.length || 0);
  logger.log('Current map instance:', !!window.leafletMapInstance);
  
  // Check for DOM elements
  const leafletElements = document.querySelectorAll('[class^="leaflet-"]');
  logger.log('Leaflet DOM elements:', leafletElements.length);
  
  // Check for containers
  const containers = document.querySelectorAll('.leaflet-container');
  logger.log('Leaflet containers:', containers.length);
  
  // Check for CSS
  const leafletCSS = document.querySelector('link[href*="leaflet.css"]');
  logger.log('Leaflet CSS loaded:', !!leafletCSS);
  
  // Check if window has issues
  try {
    logger.log('Window dimensions:', window.innerWidth, window.innerHeight);
    logger.log('Document dimensions:', document.documentElement.clientWidth, document.documentElement.clientHeight);
  } catch (e) {
    logger.error('Error checking window dimensions:', e);
  }
  
  logger.log('=============================================');
}

export function fixLeafletContainers() {
  if (typeof window === 'undefined') return;
  
  try {
    // Find all map containers
    const containers = document.querySelectorAll('.leaflet-container');
    logger.log(`Found ${containers.length} leaflet containers to fix`);
    
    containers.forEach((container, index) => {
      try {
        // Force visibility and dimensions
        (container as HTMLElement).style.display = 'block';
        (container as HTMLElement).style.visibility = 'visible';
        (container as HTMLElement).style.minWidth = '300px';
        (container as HTMLElement).style.minHeight = '300px';
        
        logger.log(`Fixed container ${index+1}`);
      } catch (e) {
        logger.warn(`Error fixing container ${index+1}:`, e);
      }
    });
    
    // Also check for map wrappers
    const wrappers = document.querySelectorAll('[data-leaflet-container-id]');
    logger.log(`Found ${wrappers.length} map wrappers to fix`);
    
    wrappers.forEach((wrapper, index) => {
      try {
        // Force visibility and dimensions
        (wrapper as HTMLElement).style.display = 'block';
        (wrapper as HTMLElement).style.visibility = 'visible';
        (wrapper as HTMLElement).style.minWidth = '300px';
        (wrapper as HTMLElement).style.minHeight = '300px';
        
        logger.log(`Fixed wrapper ${index+1}`);
      } catch (e) {
        logger.warn(`Error fixing wrapper ${index+1}:`, e);
      }
    });
    
    // Try to force a resize
    window.dispatchEvent(new Event('resize'));
    
    // Try to invalidate any existing map
    if (window.leafletMapInstance) {
      try {
        window.leafletMapInstance.invalidateSize(true);
      } catch (e) {
        logger.warn('Error invalidating map size:', e);
      }
    }
  } catch (e) {
    logger.error('Error in fixLeafletContainers:', e);
  }
} 