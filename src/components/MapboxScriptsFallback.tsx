"use client";

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import logger from '@/lib/logger';

export function MapboxScripts() {
  const pathname = usePathname();
  
  // Only load Mapbox scripts on paths that might use it
  const shouldLoad = pathname && 
    (pathname.includes('/projects') || 
     pathname.includes('/map') || 
     pathname.includes('/trend') ||
     pathname.includes('/admin'));

  // Check if Mapbox token is available
  useEffect(() => {
    if (shouldLoad && typeof window !== 'undefined') {
      if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        logger.warn('Mapbox token not found. Some map features may not work correctly.');
      }
    }
  }, [shouldLoad]);

  if (!shouldLoad) return null;

  return (
    <>
      {/* Mapbox GL JS will load from NPM, this is just for fallback or plugins that load outside of the bundle */}
      <Script
        id="mapbox-gl-js"
        strategy="lazyOnload"
        src="https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.js"
      />
      <Script
        id="mapbox-gl-css"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css';
              document.head.appendChild(link);
            }
          `,
        }}
      />
    </>
  );
}

export default MapboxScripts; 