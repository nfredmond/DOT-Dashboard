"use client"

import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';

interface GeolocateInternalProps {
  zoomLevel?: number;
  className?: string;
  mapRef?: any; // Optional map reference for use outside MapContainer
}

// This component is the ONLY one that calls useMap(), and it's rendered conditionally
// after we've thoroughly verified that we're inside a MapContainer context
const LeafletGeolocate = ({ props }: { props: GeolocateInternalProps }) => {
  const map = useMap(); // This should only be called when we're DEFINITELY inside a MapContainer
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();
  const { zoomLevel = 14, className = '' } = props;
  
  // Log confirmation when successfully mounted with map
  useEffect(() => {
    console.log('✅ LeafletGeolocate: Successfully mounted with Leaflet map context');
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not available",
        description: "Your browser doesn't support geolocation or it's disabled.",
        variant: "destructive"
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      // Success
      (position) => {
        const { latitude, longitude } = position.coords;
        try {
          map.flyTo([latitude, longitude], zoomLevel);
        } catch (error) {
          console.error('Error flying to location:', error);
          toast({
            title: "Map error",
            description: "Could not pan to your location",
            variant: "destructive"
          });
        }
        setIsLocating(false);
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
        
        toast({
          title: "Geolocation failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        setIsLocating(false);
      },
      // Options
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleLocate}
      disabled={isLocating}
      className={`bg-white shadow-md ${className}`}
      title="Find my location"
    >
      {isLocating ? <Spinner size="sm" /> : <Locate className="h-4 w-4" />}
    </Button>
  );
};

// This is a placeholder button that looks like the geolocate control but is disabled
const GeolocatePlaceholder = ({ className = '' }: { className?: string }) => (
  <Button
    variant="outline"
    size="icon"
    disabled={true}
    className={`bg-white shadow-md ${className}`}
    title="Find my location (loading...)"
  >
    <Spinner size="sm" />
  </Button>
);

// Check if we're truly inside a Leaflet context using DOM cues
const verifyLeafletContext = () => {
  try {
    // Deeper check to verify we're truly inside a MapContainer's React context
    const container = document.querySelector('.leaflet-container');
    if (!container) return false;
    
    // Check if Leaflet is globally available
    if (!(window as any).L) return false;
    
    // Ensure the Leaflet container has proper Leaflet classes applied
    // which indicates Leaflet has initialized its DOM
    const hasLeafletPanes = !!document.querySelector('.leaflet-pane');
    const hasLeafletControls = !!document.querySelector('.leaflet-control-container');
    
    return hasLeafletPanes && hasLeafletControls;
  } catch (error) {
    console.error('Error verifying Leaflet context:', error);
    return false;
  }
};

// Export the wrapper component
export function GeolocateInternal(props: GeolocateInternalProps) {
  // Always define hooks unconditionally at the top
  const [mounted, setMounted] = useState(false);
  const [leafletContextReady, setLeafletContextReady] = useState(false);
  
  // Track mounting
  useEffect(() => {
    console.log('GeolocateInternal: Component mounted in browser environment');
    setMounted(true);
    
    // Attempt to verify Leaflet context several times with increasing delays
    // This ensures we don't try to render before Leaflet is fully initialized
    const checkAttempts = [100, 500, 1000, 2000, 3000]; // Increasing delays
    
    // Recursive function to check with increasing delays
    const attemptVerification = (attempts: number[]) => {
      if (attempts.length === 0) {
        console.warn('GeolocateInternal: Failed to verify Leaflet context after all attempts');
        return;
      }
      
      const delay = attempts[0];
      const remainingAttempts = attempts.slice(1);
      
      setTimeout(() => {
        const isReady = verifyLeafletContext();
        console.log(`GeolocateInternal: Leaflet context check after ${delay}ms:`, isReady);
        
        if (isReady) {
          console.log('GeolocateInternal: Leaflet context verified, rendering geolocate component');
          setLeafletContextReady(true);
        } else if (remainingAttempts.length > 0) {
          // Try again with the next delay
          attemptVerification(remainingAttempts);
        }
      }, delay);
    };
    
    // Start the verification process
    attemptVerification(checkAttempts);
    
    return () => {
      // Clean up if component unmounts
      setLeafletContextReady(false);
    };
  }, []);
  
  // Don't render anything on server
  if (!mounted) {
    return null;
  }
  
  // While checking, show a placeholder
  if (!leafletContextReady) {
    return <GeolocatePlaceholder className={props.className} />;
  }
  
  // Only after thorough verification, render the component that uses Leaflet hooks
  try {
    console.log('GeolocateInternal: Rendering Leaflet-dependent geolocate component');
    return <LeafletGeolocate props={props} />;
  } catch (error) {
    console.error('Error rendering LeafletGeolocate:', error);
    return <GeolocatePlaceholder className={props.className} />;
  }
} 