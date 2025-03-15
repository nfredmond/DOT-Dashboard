"use client"

import React, { useState, useEffect } from 'react';
import { Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Portal } from '@/components/ui/portal';

interface GeolocateControlProps {
  zoomLevel?: number;
  className?: string;
}

// Loading state while initialization is in progress
function GeolocateControlLoading({ className = '' }: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="icon"
      disabled
      className={`bg-white shadow-md ${className}`}
    >
      <Spinner size="sm" />
    </Button>
  );
}

// Check if Leaflet is truly ready (with multiple safety checks)
const checkLeafletReady = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check for Leaflet global objects
    if (!(window as any).L) return false;
    
    // Check for leaf container
    const container = document.querySelector('.leaflet-container');
    if (!container) return false;
    
    // Check for key Leaflet elements
    const hasLeafletPanes = !!document.querySelector('.leaflet-pane');
    const hasLeafletControls = !!document.querySelector('.leaflet-control-container');
    
    // Check for Leaflet map instance
    const hasMapInstance = !!(window as any).leafletMapInstance;
    
    return hasLeafletPanes && hasLeafletControls && hasMapInstance;
  } catch (error) {
    console.error('Error checking Leaflet readiness:', error);
    return false;
  }
};

// This is a wrapper component that can be used anywhere
export function GeolocateControl(props: GeolocateControlProps) {
  const [mounted, setMounted] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Add a global event listener for map initialization
    const handleMapReady = () => {
      console.log('GeolocateControl: Detected map ready event');
      // Wait a bit longer to make absolutely sure everything is ready
      setTimeout(() => {
        if (checkLeafletReady()) {
          console.log('GeolocateControl: Leaflet confirmed ready, rendering geolocate control');
          setLeafletReady(true);
        }
      }, 1000); // Extra safety delay
    };
    
    // Listen for our custom event
    window.addEventListener('leaflet-map-ready', handleMapReady);
    
    // Also check periodically in case we missed the event
    const checkIntervals = [100, 500, 1000, 2000, 3000, 5000];
    
    checkIntervals.forEach(delay => {
      setTimeout(() => {
        if (!leafletReady && checkLeafletReady()) {
          console.log(`GeolocateControl: Leaflet detected as ready after ${delay}ms`);
          setLeafletReady(true);
        }
      }, delay);
    });
    
    return () => {
      window.removeEventListener('leaflet-map-ready', handleMapReady);
    };
  }, [leafletReady]);
  
  // Don't render on server
  if (!mounted) return null;
  
  // Show loading state while waiting
  if (!leafletReady) {
    return <GeolocateControlLoading className={props.className} />;
  }
  
  // IMPORTANT: Instead of rendering components that use Leaflet hooks directly,
  // we create a script that will inject our button into the Leaflet control container
  return (
    <Portal>
      <div 
        id="map-geolocate-container" 
        className={`${props.className || ''}`}
        data-zoomlevel={props.zoomLevel || 14}
      >
        <GeolocateControlLoading />
        
        {/* Inject a script that creates our geolocate button inside the map context */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // Make sure we're on the client
            if (typeof window === 'undefined') return;
            
            // Wait for next tick to ensure DOM is ready
            setTimeout(() => {
              try {
                // Get the geolocate container
                const geolocateContainer = document.getElementById('map-geolocate-container');
                if (!geolocateContainer) return;
                
                // Find the map's control container where we'll inject our control
                const controlContainer = document.querySelector('.leaflet-control-container .leaflet-bottom.leaflet-left');
                if (!controlContainer) {
                  console.error("Couldn't find Leaflet control container");
                  return;
                }
                
                // Create a new control container
                const newControl = document.createElement('div');
                newControl.className = 'leaflet-control leaflet-bar geolocate-control';
                newControl.appendChild(geolocateContainer);
                controlContainer.appendChild(newControl);
                
                // Add the actual functionality
                const zoomLevel = parseInt(geolocateContainer.dataset.zoomlevel || '14');
                const button = geolocateContainer.querySelector('button');
                
                if (button) {
                  // Remove the disabled state
                  button.disabled = false;
                  
                  // Replace the spinner with the locate icon
                  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><polygon points="12 22 18 16 15 16 15 10 9 10 9 16 6 16"></polygon><circle cx="12" cy="5" r="3"></circle></svg>';
                  
                  // Set title
                  button.title = "Find my location";
                  
                  // Add click handler
                  button.addEventListener('click', () => {
                    if (!navigator.geolocation) {
                      alert("Geolocation is not available in your browser");
                      return;
                    }
                    
                    // Show loading spinner
                    const originalContent = button.innerHTML;
                    button.innerHTML = '<div class="w-4 h-4 border-2 border-b-transparent rounded-full animate-spin"></div>';
                    button.disabled = true;
                    
                    navigator.geolocation.getCurrentPosition(
                      // Success
                      (position) => {
                        const { latitude, longitude } = position.coords;
                        
                        try {
                          // Use the map instance directly
                          if (window.leafletMapInstance) {
                            window.leafletMapInstance.flyTo([latitude, longitude], zoomLevel);
                          }
                        } catch (error) {
                          console.error('Error flying to location:', error);
                          alert("Could not pan to your location");
                        }
                        
                        // Restore button state
                        button.innerHTML = originalContent;
                        button.disabled = false;
                      },
                      // Error
                      (error) => {
                        console.error('Geolocation error:', error);
                        let errorMessage = "Unable to get your location";
                        
                        switch (error.code) {
                          case error.PERMISSION_DENIED:
                            errorMessage = "You denied the request for geolocation";
                            break;
                          case error.POSITION_UNAVAILABLE:
                            errorMessage = "Location information is unavailable";
                            break;
                          case error.TIMEOUT:
                            errorMessage = "The request to get your location timed out";
                            break;
                        }
                        
                        alert(errorMessage);
                        
                        // Restore button state
                        button.innerHTML = originalContent;
                        button.disabled = false;
                      },
                      // Options
                      {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                      }
                    );
                  });
                }
                
                console.log("Geolocate control injected into Leaflet control container");
                
                // Dispatch an event to signal that the geolocate component is ready
                const event = new CustomEvent('geolocate-control-ready');
                window.dispatchEvent(event);
              } catch (error) {
                console.error("Error setting up geolocate control:", error);
              }
            }, 100);
          })();
        `}} />
      </div>
    </Portal>
  );
} 