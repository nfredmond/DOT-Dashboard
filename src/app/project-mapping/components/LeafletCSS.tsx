'use client';

import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// This component doesn't render anything, it just imports Leaflet CSS on the client
export default function LeafletCSS() {
  useEffect(() => {
    // Ensure marker images are available
    console.log('Leaflet CSS imported');
  }, []);
  
  return null;
} 