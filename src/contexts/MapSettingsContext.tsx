'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

interface MapSettings {
  mapboxToken: string;
  defaultMapStyle: string;
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
  enableClustering: boolean;
  enable3D: boolean;
  showTraffic: boolean;
  showLabels: boolean;
}

interface MapSettingsContextType {
  mapSettings: MapSettings;
  updateMapSettings: (settings: Partial<MapSettings>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const defaultMapSettings: MapSettings = {
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  defaultMapStyle: 'mapbox://styles/mapbox/streets-v12',
  initialCenter: { lat: 37.7749, lng: -122.4194 },
  initialZoom: 11,
  enableClustering: true,
  enable3D: false,
  showTraffic: false,
  showLabels: true
};

const MapSettingsContext = createContext<MapSettingsContextType>({
  mapSettings: defaultMapSettings,
  updateMapSettings: async () => {},
  isLoading: false,
  error: null
});

export function MapSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();
  const [mapSettings, setMapSettings] = useState<MapSettings>(defaultMapSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load map settings on mount and when user changes
  useEffect(() => {
    if (user?.organizationId) {
      loadMapSettings();
    } else {
      // Load from localStorage for non-authenticated users
      const savedSettings = localStorage.getItem('mapSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setMapSettings({ ...defaultMapSettings, ...parsed });
        } catch (e) {
          console.error('Error parsing saved map settings:', e);
        }
      }
      setIsLoading(false);
    }
  }, [user?.organizationId]);

  const loadMapSettings = async () => {
    if (!user?.organizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load organization-specific settings
      const { data, error: fetchError } = await supabase
        .from('organization_settings')
        .select('map_settings')
        .eq('organization_id', user.organizationId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (data?.map_settings) {
        setMapSettings({ ...defaultMapSettings, ...data.map_settings });
      } else {
        // Also check localStorage as fallback
        const savedSettings = localStorage.getItem('mapSettings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            setMapSettings({ ...defaultMapSettings, ...parsed });
          } catch (e) {
            console.error('Error parsing saved map settings:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error loading map settings:', err);
      setError('Failed to load map settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMapSettings = async (newSettings: Partial<MapSettings>) => {
    const updatedSettings = { ...mapSettings, ...newSettings };
    setMapSettings(updatedSettings);
    
    // Save to localStorage immediately for all users
    localStorage.setItem('mapSettings', JSON.stringify(updatedSettings));
    
    // If authenticated, also save to database
    if (user?.organizationId) {
      try {
        const { error: updateError } = await supabase
          .from('organization_settings')
          .upsert({
            organization_id: user.organizationId,
            map_settings: updatedSettings,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'organization_id'
          });
        
        if (updateError) {
          console.error('Error saving map settings to database:', updateError);
          setError('Failed to save map settings');
        }
      } catch (err) {
        console.error('Error updating map settings:', err);
        setError('Failed to update map settings');
      }
    }
  };

  return (
    <MapSettingsContext.Provider value={{ mapSettings, updateMapSettings, isLoading, error }}>
      {children}
    </MapSettingsContext.Provider>
  );
}

export const useMapSettings = () => {
  const context = useContext(MapSettingsContext);
  if (context === undefined) {
    throw new Error('useMapSettings must be used within a MapSettingsProvider');
  }
  return context;
}; 