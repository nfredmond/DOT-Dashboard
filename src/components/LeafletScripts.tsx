"use client";

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { styleUrls } from '@/styles/leaflet-styles';
import { ensureLeafletLoaded } from '@/lib/leaflet-preload';

interface LeafletScriptsProps {
  onLoad?: () => void;
}

const LeafletScripts = ({ onLoad }: LeafletScriptsProps) => {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    // Function to add a CSS link to the head
    const addCssLink = (href: string, integrity?: string) => {
      // Skip if already added
      if (document.querySelector(`link[href="${href}"]`)) {
        return null;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      if (integrity) {
        link.integrity = integrity;
        link.crossOrigin = '';
      }
      document.head.appendChild(link);
      return link;
    };
    
    // Add all needed CSS files
    const links = [
      addCssLink(styleUrls.leaflet, 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='),
      addCssLink(styleUrls.leafletDraw),
      addCssLink(styleUrls.customCompat)
    ].filter(Boolean);
    
    // Ensure Leaflet is properly loaded
    const isLoaded = ensureLeafletLoaded();
    if (isLoaded && !scriptsLoaded) {
      setScriptsLoaded(true);
      onLoad?.();
    }
    
    // Clean up function
    return () => {
      links.forEach(link => {
        if (link && document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [scriptsLoaded, onLoad]);
  
  const handleScriptLoad = () => {
    setScriptsLoaded(true);
    onLoad?.();
  };
  
  return (
    <>
      {/* External scripts that might be needed */}
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin="anonymous"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />
      <Script
        src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"
        strategy="lazyOnload"
      />
      <Script 
        src="https://unpkg.com/leaflet-defaulticon-compatibility@0.1.2/dist/leaflet-defaulticon-compatibility.js"
        strategy="lazyOnload"
      />
    </>
  );
};

export default LeafletScripts; 