"use client";

import dynamic from 'next/dynamic';

// Dynamic import for Leaflet-related components with no SSR
// This ensures that Leaflet components are only loaded on the client side
export const DynamicMapComponent = (componentPath: string) => {
  return dynamic(() => import(`@/app/${componentPath}`), {
    ssr: false,
    loading: () => (
      <div style={{ 
        height: '500px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <div>Loading map component...</div>
      </div>
    )
  });
};

// Create dynamic imports for each map component - all point to the new consolidated mapping implementation
export const DynamicProjectMapping = dynamic(() => import('@/app/project-mapping/page'), { ssr: false });

// For backward compatibility, point old components to the new implementation
export const DynamicGISMapping = DynamicProjectMapping;
export const DynamicProjectMap = DynamicProjectMapping;

// Create a no-SSR wrapper component
export function NoSSR({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 