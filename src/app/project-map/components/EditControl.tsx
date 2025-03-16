import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
// Try to import leaflet-draw, but handle potential failure
// Use useEffect to properly handle the dynamic import on client-side only
const importLeafletDraw = () => {
  if (typeof window === 'undefined') return; // Skip during SSR
  
  // Attempt to import using dynamic import
  import('leaflet-draw')
    .then(() => console.log('Leaflet-draw imported successfully'))
    .catch(error => {
      console.warn('Could not import leaflet-draw, will attempt to fetch directly:', error);
      
      // We'll try to load leaflet-draw via script tag instead
      if (!window.L?.Draw) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
        script.async = true;
        script.onload = () => console.log('Leaflet-draw loaded via CDN');
        script.onerror = () => console.error('Failed to load leaflet-draw via CDN');
        document.head.appendChild(script);
      }
    });
};

// Define proper event types
interface DrawEvent {
  layer: L.Layer;
  layerType: string;
}

// Export the interface
export interface EditControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  draw?: {
    polyline?: boolean;
    polygon?: boolean;
    rectangle?: boolean;
    circle?: boolean;
    marker?: boolean;
    circlemarker?: boolean;
  };
  edit?: {
    edit?: boolean;
    remove?: boolean;
  };
  onCreated?: (e: DrawEvent) => void;
  onEdited?: (e: any) => void;
  onDeleted?: (e: any) => void;
}

/**
 * A simplified EditControl component that doesn't use useLeafletContext
 * Note: This must ONLY be used inside a MapContainer component
 */
export const EditControl = (props: EditControlProps) => {
  // SSR check
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Import leaflet-draw when component mounts
    importLeafletDraw();
    
    // Wait a short time to ensure map is mounted before checking for Leaflet
    const timer = setTimeout(() => {
      if (!window.L) {
        console.warn('EditControl: Leaflet is not available yet');
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Don't render during SSR
  if (!mounted) return null;
  
  // Check if we have L properly initialized
  if (typeof window === 'undefined' || !window.L) {
    console.warn('EditControl: Leaflet is not available yet');
    return null;
  }
  
  // Check if we're inside a MapContainer by looking for the container element 
  // This is a cheap check that should fail fast if we're outside a MapContainer
  if (!document.querySelector('.leaflet-container')) {
    console.warn('EditControl: No Leaflet container found. Make sure this component is used inside a MapContainer.');
    return null;
  }
  
  return <EditControlClient {...props} />;
};

// The client-side implementation
const EditControlClient = ({
  position = 'topleft',
  draw = {},
  edit = {},
  onCreated,
  onEdited,
  onDeleted
}: EditControlProps) => {
  const controlRef = useRef<L.Control.Draw | null>(null);
  const isSetupRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // First check if the map container exists
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('EditControl: Checking if map container exists');
    
    // Wait a bit before trying to set up the control to ensure the map is fully initialized
    const initialDelay = setTimeout(() => {
      const container = document.querySelector('.leaflet-container');
      if (container) {
        console.log('EditControl: Map container found with class .leaflet-container');
        setIsMapReady(true);
      } else {
        console.warn('EditControl: No Leaflet container found initially. Will retry with polling.');
        
        // Fall back to polling if not found initially
        let attempts = 0;
        const maxAttempts = 30; // 30 * 100ms = 3 seconds max wait time
        
        const interval = setInterval(() => {
          attempts++;
          const container = document.querySelector('.leaflet-container');
          if (container) {
            console.log(`EditControl: Map container found after ${attempts} attempts`);
            setIsMapReady(true);
            clearInterval(interval);
          } else if (attempts >= maxAttempts) {
            console.warn('EditControl: Gave up waiting for map container after max attempts');
            clearInterval(interval);
          }
        }, 100);
        
        return () => clearInterval(interval);
      }
    }, 500); // Wait 500ms before first attempt
    
    return () => clearTimeout(initialDelay);
  }, []);
  
  // This will run only on the client after map is confirmed ready
  useEffect(() => {
    // Safety check to ensure we're in a browser environment with map ready
    if (typeof window === 'undefined' || !window.L || !isMapReady) {
      return;
    }
    
    // Avoid running the setup multiple times
    if (isSetupRef.current) return;
    
    console.log('EditControl: Map is ready, setting up with delay');
    
    // Setup with a longer delay to ensure the map is fully initialized
    const setupTimeout = setTimeout(() => {
      try {
        console.log('EditControl: Attempting to set up control');
        // Find the Leaflet map container
        const container = document.querySelector('.leaflet-container');
        if (!container) {
          console.warn('EditControl: No Leaflet container found. Make sure your map is rendered.');
          return;
        }
        
        console.log('EditControl: Found container, searching for map instance');
        
        // Look for the Leaflet map instance - improved method
        let mapInstance: L.Map | null = null;
        
        // Skip trying to use react-leaflet directly, focus on DOM-based approaches
        // First try: Using _leaflet_id attribute on container
        if (container && (container as any)._leaflet_id) {
          const candidateMap = (window.L.map as any)._byId && (window.L.map as any)._byId[(container as any)._leaflet_id];
          if (candidateMap) mapInstance = candidateMap as L.Map;
        }
        
        // Second try: Using the legacy approach of map instances array
        if (!mapInstance && (window.L.map as any)._mapInstances && (window.L.map as any)._mapInstances.length > 0) {
          mapInstance = (window.L.map as any)._mapInstances[0] as L.Map;
        }
        
        // Third try: Look for objects with _leaflet_id directly on the container
        if (!mapInstance) {
          // If the container has a _leaflet property that has a map reference
          const containerLeaflet = (container as any)._leaflet;
          if (containerLeaflet && containerLeaflet.map) {
            mapInstance = containerLeaflet.map as L.Map;
          }
        }
        
        // Fourth try: Find any Leaflet map instance in the document
        if (!mapInstance) {
          const mapContainers = document.querySelectorAll('.leaflet-container');
          for (let i = 0; i < mapContainers.length; i++) {
            const el = mapContainers[i] as any;
            if (el._leaflet && el._leaflet.map) {
              mapInstance = el._leaflet.map as L.Map;
              break;
            }
          }
        }
        
        if (!mapInstance) {
          console.warn('EditControl: Unable to find Leaflet map instance after all attempts.');
          return;
        }
        
        console.log('EditControl: Found map instance:', mapInstance);
        
        // Find a FeatureGroup to use for the editable layers
        let featureGroup: L.FeatureGroup | null = null;
        mapInstance.eachLayer((layer: any) => {
          if (layer instanceof L.FeatureGroup) {
            featureGroup = layer;
          }
        });
        
        // If no feature group exists, create one and add it to the map
        if (!featureGroup) {
          featureGroup = new L.FeatureGroup();
          mapInstance.addLayer(featureGroup);
        }
        
        // Set up the draw control options
        const drawOptions = {
          position,
          draw: {
            polyline: draw.polyline ? {} : false,
            polygon: draw.polygon ? {} : false,
            rectangle: draw.rectangle ? {} : false,
            circle: draw.circle ? {} : false,
            marker: draw.marker ? {} : false,
            circlemarker: draw.circlemarker ? {} : false,
          },
          edit: {
            featureGroup,
            edit: edit.edit ? {} : false,
            remove: edit.remove ? true : false,
          }
        };
        
        // Create and add the draw control
        const drawControl = new L.Control.Draw(drawOptions);
        mapInstance.addControl(drawControl);
        controlRef.current = drawControl;
        console.log('EditControl: Successfully added draw control to map');
        
        // Set up event handlers
        if (onCreated) mapInstance.on(L.Draw.Event.CREATED, (e: any) => onCreated(e as DrawEvent));
        if (onEdited) mapInstance.on(L.Draw.Event.EDITED, (e: any) => onEdited(e));
        if (onDeleted) mapInstance.on(L.Draw.Event.DELETED, (e: any) => onDeleted(e));
        
        isSetupRef.current = true;
      } catch (error) {
        console.error('Error setting up EditControl:', error);
      }
    }, 800); // Increase timeout to 800ms to give more time for map initialization
    
    // Clean up
    return () => {
      clearTimeout(setupTimeout);
      
      if (controlRef.current) {
        try {
          // Find the map instance
          const mapInstance = (window.L.map as any)._mapInstances?.[0];
          if (!mapInstance) return;
          
          // Remove event listeners
          mapInstance.off(L.Draw.Event.CREATED);
          mapInstance.off(L.Draw.Event.EDITED);
          mapInstance.off(L.Draw.Event.DELETED);
          
          // Remove the control
          mapInstance.removeControl(controlRef.current);
        } catch (error) {
          console.error('Error cleaning up EditControl:', error);
        }
      }
    };
  }, [position, draw, edit, onCreated, onEdited, onDeleted, isMapReady]);
  
  // This component doesn't render anything visible
  return null;
}; 