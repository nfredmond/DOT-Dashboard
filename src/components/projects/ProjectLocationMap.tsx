"use client"

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '@/lib/leaflet-preload';

// Fix for Leaflet default marker icon in Next.js
// This is necessary because Leaflet assumes marker assets are available at specific paths
// which doesn't work with Next.js static file serving by default
const fixLeafletIcon = () => {
  // Delete the default icon first
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  // Set up the new paths
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
  });
};

interface ProjectLocationMapProps {
  latitude: number;
  longitude: number;
  projectName: string;
  zoom?: number;
}

const ProjectLocationMap: React.FC<ProjectLocationMapProps> = ({
  latitude,
  longitude,
  projectName,
  zoom = 13,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only run on client side
    setIsMounted(true);
    fixLeafletIcon();
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <Marker position={[latitude, longitude]}>
        <Popup>
          <div>
            <strong>{projectName}</strong>
            <div>Lat: {latitude.toFixed(6)}</div>
            <div>Lng: {longitude.toFixed(6)}</div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default ProjectLocationMap; 