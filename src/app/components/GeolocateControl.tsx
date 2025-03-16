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
      className={`bg-white shadow-md h-9 w-9 rounded-md border-gray-200 ${className}`}
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
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Force it to be ready after a short timeout
    setTimeout(() => {
      setLeafletReady(true);
      console.log('GeolocateControl: Force ready after timeout');
    }, 2000);
    
    return () => {};
  }, []);
  
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not available in your browser");
      return;
    }
    
    // Show loading spinner
    setLoading(true);
    
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,          // Increased timeout to 10 seconds
      maximumAge: 0            // Don't use cached position
    };
    
    navigator.geolocation.getCurrentPosition(
      // Success
      (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          console.log("Geolocation success:", latitude, longitude);
          
          // Use the map instance directly
          if ((window as any).leafletMapInstance) {
            (window as any).leafletMapInstance.flyTo([latitude, longitude], props.zoomLevel || 14);
            
            // Add a marker at the user's location
            const L = (window as any).L;
            if (L) {
              // Remove existing user location marker if it exists
              if ((window as any).userLocationMarker) {
                (window as any).leafletMapInstance.removeLayer((window as any).userLocationMarker);
              }
              
              // Create a new marker
              (window as any).userLocationMarker = L.circle([latitude, longitude], {
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.3,
                radius: 100,
                weight: 2
              }).addTo((window as any).leafletMapInstance);
            }
          }
        } catch (error) {
          console.error('Error flying to location:', error);
          alert("Could not pan to your location");
        }
        
        // Reset loading state
        setLoading(false);
      },
      // Error
      (error) => {
        console.error('Geolocation error code:', error.code, 'message:', error.message);
        let errorMessage = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "You denied the request for geolocation. Please enable location services in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please try again later or check your device's location settings.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out. Please try again.";
            break;
        }
        
        alert(errorMessage);
        
        // Reset loading state
        setLoading(false);
      },
      // Options
      geoOptions
    );
  };
  
  // Don't render on server
  if (!mounted) return null;
  
  // For the fixed geolocate component, we'll render it directly
  return (
    <Button
      variant="outline"
      size="icon"
      className="bg-white shadow-md h-9 w-9 rounded-md border border-gray-200 flex items-center justify-center"
      title="Find my location"
      onClick={handleGeolocation}
      disabled={loading}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-b-transparent rounded-full animate-spin" />
      ) : (
        <Locate className="h-4 w-4" />
      )}
    </Button>
  );
} 