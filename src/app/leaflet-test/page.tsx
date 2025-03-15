"use client"

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LeafletErrorBoundary from '@/components/LeafletErrorBoundary';
import { fixLeafletIcon, ensureLeafletCSS } from '@/lib/leaflet-fix';

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function LeafletTest() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Apply Leaflet fixes
    fixLeafletIcon();
    ensureLeafletCSS();
  }, []);

  if (!isMounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4 mx-auto"></div>
          <p>Loading map components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leaflet Test Page</h1>
      <p className="mb-4">Basic map with OpenStreetMap tiles (no API keys required)</p>
      
      <div className="h-[600px] border rounded-lg overflow-hidden">
        <LeafletErrorBoundary>
          <MapContainer
            center={[37.7749, -122.4194]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[37.7749, -122.4194]}>
              <Popup>
                San Francisco
              </Popup>
            </Marker>
          </MapContainer>
        </LeafletErrorBoundary>
      </div>
    </div>
  );
} 