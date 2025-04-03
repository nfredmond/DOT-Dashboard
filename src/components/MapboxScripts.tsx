'use client';

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
      {/* Mapbox GL JS will load from npm package, but add a fallback for browsers */}
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
        strategy="lazyOnload"
        onLoad={() => logger.info('Mapbox script loaded')}
      />
      
      {/* Fallback for older browsers */}
      <Script id="mapbox-detect">
        {`
          document.addEventListener('DOMContentLoaded', function() {
            if (typeof mapboxgl === 'undefined') {
              if (window.logger) {
                window.logger.info('Mapbox not detected, loading fallback');
              }
              var script = document.createElement('script');
              script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
              script.onload = function() {
                if (window.logger) {
                  window.logger.info('Mapbox loaded via fallback script');
                }
              };
              document.head.appendChild(script);
            }
          });
        `}
      </Script>
    </>
  );
} 