/**
 * This module patches the react-leaflet-cluster library to use custom CSS-based
 * cluster markers instead of relying on image imports that might break the build.
 */

import L from 'leaflet';

/**
 * Creates a custom icon for clusters using HTML and CSS instead of images
 */
function createClusterCustomIcon(cluster: any) {
  // Get the count of markers in this cluster
  const count = cluster.getChildCount();
  
  // Choose a class based on the count
  let size = 'small';
  if (count > 100) {
    size = 'large';
  } else if (count > 20) {
    size = 'medium';
  }
  
  // Create the HTML for the marker
  return L.divIcon({
    html: `<div class="cluster-marker cluster-marker-${size}">${count}</div>`,
    className: 'custom-cluster-marker',
    iconSize: L.point(40, 40)
  });
}

/**
 * Patches the cluster markers with custom CSS styling
 */
export function patchClusterMarkers() {
  if (typeof window === 'undefined') return;

  // Add the custom CSS for cluster markers
  const style = document.createElement('style');
  style.textContent = `
    .custom-cluster-marker {
      background-color: transparent;
    }
    
    .cluster-marker {
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: bold;
      border-radius: 50%;
      box-shadow: 0 0 0 2px white;
    }
    
    .cluster-marker-small {
      background-color: rgba(181, 226, 140, 0.9);
      width: 30px;
      height: 30px;
    }
    
    .cluster-marker-medium {
      background-color: rgba(241, 211, 87, 0.9);
      width: 35px;
      height: 35px;
    }
    
    .cluster-marker-large {
      background-color: rgba(253, 156, 115, 0.9);
      width: 40px;
      height: 40px;
    }
  `;
  document.head.appendChild(style);

  // Wait for react-leaflet-cluster to be loaded
  setTimeout(() => {
    try {
      // Check if Leaflet is available
      if (typeof L !== 'undefined' && L.MarkerClusterGroup) {
        // Replace the icon creation function with our custom one
        // This will affect any MarkerClusterGroup instance
        if (L.MarkerClusterGroup.prototype) {
          const originalIconCreateFunction = L.MarkerClusterGroup.prototype.options.iconCreateFunction;
          L.MarkerClusterGroup.prototype.options.iconCreateFunction = createClusterCustomIcon;
        }
      }
    } catch (error) {
      console.warn('Could not patch cluster markers:', error);
    }
  }, 500);
}

// Self-execute the patching function when this module is imported
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchClusterMarkers);
  } else {
    patchClusterMarkers();
  }
} 