"use client"

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Portal } from '@/components/ui/portal';

interface SearchResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

interface SearchControlProps {
  className?: string;
  placeholder?: string;
  apiEndpoint?: string;
  onResult?: (results: SearchResult[]) => void;
}

// Loading state while dynamic import is in progress
function SearchControlLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-1">
        <Input
          type="text"
          placeholder="Loading search..."
          disabled
          className="bg-white shadow-md"
        />
        <Button 
          variant="outline" 
          size="icon" 
          disabled
          className="bg-white shadow-md"
        >
          <Spinner size="sm" />
        </Button>
      </div>
    </div>
  );
}

// Instead of using dynamic imports, we'll use a Portal approach
export function SearchControl(props: SearchControlProps) {
  const [mounted, setMounted] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  
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
  
  useEffect(() => {
    setMounted(true);
    
    // Add a global event listener for map initialization
    const handleMapReady = () => {
      console.log('SearchControl: Detected map ready event');
      // Wait a bit longer to make absolutely sure everything is ready
      setTimeout(() => {
        if (checkLeafletReady()) {
          console.log('SearchControl: Leaflet confirmed ready, rendering search component');
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
          console.log(`SearchControl: Leaflet detected as ready after ${delay}ms`);
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
    return <SearchControlLoading className={props.className} />;
  }
  
  // IMPORTANT: Instead of rendering components that use Leaflet hooks directly,
  // we create a <script> tag that will inject our component into the map container
  // This ensures we're truly inside the Leaflet context
  return (
    <Portal>
      <div 
        id="map-search-container" 
        className={`absolute z-[9999] top-4 right-4 ${props.className || ''}`}
        data-placeholder={props.placeholder || 'Search location...'}
      >
        <SearchControlLoading className="" />
        
        {/* Inject a script that creates our search component inside the map context */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // Make sure we're on the client
            if (typeof window === 'undefined') return;
            
            // Wait for next tick to ensure DOM is ready
            setTimeout(() => {
              try {
                // Get the search container
                const searchContainer = document.getElementById('map-search-container');
                if (!searchContainer) return;
                
                // Find the map's control container where we'll inject our control
                const controlContainer = document.querySelector('.leaflet-control-container .leaflet-top.leaflet-right');
                if (!controlContainer) {
                  console.error("Couldn't find Leaflet control container");
                  return;
                }
                
                // Create a new control container
                const newControl = document.createElement('div');
                newControl.className = 'leaflet-control leaflet-bar search-control';
                newControl.appendChild(searchContainer);
                controlContainer.appendChild(newControl);
                
                // Signal that search is ready
                console.log("Map search injected into Leaflet control container");
                
                // Dispatch an event to signal that the search component is ready
                const event = new CustomEvent('search-control-ready');
                window.dispatchEvent(event);
              } catch (error) {
                console.error("Error setting up map search:", error);
              }
            }, 100);
          })();
        `}} />
      </div>
    </Portal>
  );
} 