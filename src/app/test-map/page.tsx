"use client"

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LeafletErrorBoundary from "@/components/LeafletErrorBoundary";
import { getMapTiles, getAvailableMapTypes, getDefaultMapType } from "@/lib/map-service";

// Import styles
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const TestMap = () => {
  const [mounted, setMounted] = useState(false);
  const [selectedMapType, setSelectedMapType] = useState(getDefaultMapType());
  
  // Get map tiles from map service
  const mapTiles = getMapTiles();
  const mapOptions = getAvailableMapTypes();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Map</h1>
      <p className="mb-4">This is a simple test map to verify Leaflet is working correctly.</p>
      
      <div className="flex items-center space-x-4 mb-4">
        <label htmlFor="map-type" className="font-medium">Map Type:</label>
        <select 
          id="map-type"
          className="px-3 py-1.5 border rounded-md"
          value={selectedMapType}
          onChange={(e) => setSelectedMapType(e.target.value)}
        >
          {mapOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="h-[600px] border rounded-lg overflow-hidden">
        {mounted ? (
          <LeafletErrorBoundary>
            <MapContainer
              center={[37.7749, -122.4194]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url={mapTiles[selectedMapType].url}
                attribution={mapTiles[selectedMapType].attribution}
                {
                  ...(
                    mapTiles[selectedMapType].accessToken ? 
                    { accessToken: mapTiles[selectedMapType].accessToken as string } : 
                    {}
                  )
                }
              />
            </MapContainer>
          </LeafletErrorBoundary>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4 mx-auto"></div>
              <p>Loading map components...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestMap; 