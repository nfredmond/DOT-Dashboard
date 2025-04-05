"use client"

import React, { useRef, useEffect, ReactNode, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have an auth hook
import { getUserMapPreferences, initMapboxToken, enable3DTerrain } from '@/lib/map-utils';

interface BaseMapProps {
  initialCenter: [number, number];
  initialZoom: number;
  style?: string;
  children?: ReactNode;
  onMapLoad?: (map: mapboxgl.Map) => void;
  className?: string;
  mapOptions?: Partial<mapboxgl.MapOptions>;
  userId?: string; // Optional user ID to load preferences
  useUserPreferences?: boolean; // Whether to use user preferences
  enable3D?: boolean; // Whether to enable 3D terrain
}

const BaseMap: React.FC<BaseMapProps> = ({
  initialCenter,
  initialZoom,
  style = 'mapbox://styles/mapbox/streets-v12',
  children,
  onMapLoad,
  className = 'h-full w-full',
  mapOptions = {},
  userId,
  useUserPreferences = true,
  enable3D = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { user } = useAuth?.() || { user: null };
  
  // If userId is not provided but we have a logged-in user, use that ID
  const effectiveUserId = userId || (user?.id as string);
  
  // Apply user preferences if available and requested
  useEffect(() => {
    if (!useUserPreferences || !effectiveUserId) return;
    
    // Try to get user preferences
    const userPrefs = getUserMapPreferences(effectiveUserId);
    if (!userPrefs) return;
    
    // Update map with user preferences if available
    if (map.current && mapLoaded) {
      // Update style if user has a preference
      if (userPrefs.mapStyle) {
        map.current.setStyle(userPrefs.mapStyle);
      }
      
      // Update center and zoom if user has preferences
      if (userPrefs.defaultCenter && userPrefs.defaultZoom) {
        map.current.setCenter(userPrefs.defaultCenter);
        map.current.setZoom(userPrefs.defaultZoom);
      }
      
      // Enable 3D terrain if user prefers it
      if (userPrefs.enable3D && !enable3D) {
        enable3DTerrain(map.current);
      }
    }
  }, [effectiveUserId, useUserPreferences, mapLoaded, enable3D]);

  // Set your Mapbox token here or in an environment variable
  useEffect(() => {
    // Try to get a user-specific token from preferences if available
    let userToken;
    if (effectiveUserId && useUserPreferences) {
      const userPrefs = getUserMapPreferences(effectiveUserId);
      userToken = userPrefs?.mapboxToken;
    }
    
    // Initialize token with user preference or environment variable
    initMapboxToken(userToken);
  }, [effectiveUserId, useUserPreferences]);
  
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center: initialCenter,
      zoom: initialZoom,
      ...mapOptions
    });
    
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    mapInstance.on('load', () => {
      setMapLoaded(true);
      
      // Enable 3D terrain if requested
      if (enable3D) {
        enable3DTerrain(mapInstance);
      }
      
      if (onMapLoad) {
        onMapLoad(mapInstance);
      }
    });
    
    map.current = mapInstance;
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update center and zoom if they change
  useEffect(() => {
    if (!map.current) return;
    
    map.current.setCenter(initialCenter);
    map.current.setZoom(initialZoom);
  }, [initialCenter, initialZoom]);

  // Update style if it changes
  useEffect(() => {
    if (!map.current) return;
    
    map.current.setStyle(style);
  }, [style]);

  return (
    <div ref={mapContainer} className={className}>
      {mapLoaded && children}
    </div>
  );
};

export default BaseMap; 