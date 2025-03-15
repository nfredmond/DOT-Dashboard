/**
 * Custom MarkerClusterGroup component for Next.js
 * This is a simplified version that doesn't rely on problematic image imports
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import 'leaflet.markercluster';

// Add CSS for the clusters
if (typeof document !== 'undefined') {
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
}

// Custom icon creation function
function createClusterCustomIcon(cluster: any) {
  const count = cluster.getChildCount();
  let size = 'small';
  
  if (count > 100) {
    size = 'large';
  } else if (count > 20) {
    size = 'medium';
  }
  
  return L.divIcon({
    html: `<div class="cluster-marker cluster-marker-${size}">${count}</div>`,
    className: 'custom-cluster-marker',
    iconSize: L.point(40, 40)
  });
}

interface MarkerClusterGroupProps {
  children: React.ReactNode;
  chunkedLoading?: boolean;
  zoomToBoundsOnClick?: boolean;
  showCoverageOnHover?: boolean;
  spiderfyOnMaxZoom?: boolean;
  removeOutsideVisibleBounds?: boolean;
  animate?: boolean;
  maxClusterRadius?: number;
}

export default function MarkerClusterGroup({
  children,
  chunkedLoading = false,
  zoomToBoundsOnClick = true,
  showCoverageOnHover = true,
  spiderfyOnMaxZoom = true,
  removeOutsideVisibleBounds = true,
  animate = true,
  maxClusterRadius = 80,
}: MarkerClusterGroupProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const childrenRef = useRef(children);

  // Update children ref when children change
  useEffect(() => {
    childrenRef.current = children;
  }, [children]);

  // Initialize the cluster group
  useEffect(() => {
    if (!map) return;

    // Create cluster group with options
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading,
      zoomToBoundsOnClick,
      showCoverageOnHover,
      spiderfyOnMaxZoom,
      removeOutsideVisibleBounds,
      animate,
      maxClusterRadius,
      disableClusteringAtZoom: map.getMaxZoom() || 18, // Use map's maxZoom or default to 18
      maxZoom: map.getMaxZoom() || 18, // Use map's maxZoom or default to 18
      iconCreateFunction: createClusterCustomIcon
    });

    // Add to map
    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Cleanup
    return () => {
      map.removeLayer(clusterGroup);
      clusterGroupRef.current = null;
      markersRef.current = [];
    };
  }, [
    map,
    chunkedLoading,
    zoomToBoundsOnClick,
    showCoverageOnHover,
    spiderfyOnMaxZoom,
    removeOutsideVisibleBounds,
    animate,
    maxClusterRadius
  ]);

  // Process children to extract markers
  useEffect(() => {
    if (!clusterGroupRef.current) return;

    // Clear existing markers
    clusterGroupRef.current.clearLayers();
    markersRef.current = [];

    // Function to recursively process children and extract markers
    const processChildren = (children: React.ReactNode) => {
      React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;

        // If it's a Marker component, extract the marker instance
        if (child.type === 'Marker' && child.props._leafletRef) {
          const marker = child.props._leafletRef;
          markersRef.current.push(marker);
          clusterGroupRef.current?.addLayer(marker);
        }
        
        // Recursively process children
        if (child.props.children) {
          processChildren(child.props.children);
        }
      });
    };

    // Process the children
    processChildren(childrenRef.current);
  }, [children]);

  return null;
} 