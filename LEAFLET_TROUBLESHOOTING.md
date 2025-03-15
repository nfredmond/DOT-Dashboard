# Leaflet Map Troubleshooting Guide

## Common Issues and Solutions

### 1. MapContainer Context Errors

"No context provided: useLeafletContext() can only be used in a descendant of `MapContainer`"

This error occurs when React components that depend on Leaflet's context are rendered before the MapContainer is fully initialized or when trying to use Leaflet hooks outside of the MapContainer component.

#### Context Error Solutions

1. **Ensure proper component order**: All Leaflet-dependent components (like Marker, Popup, etc.) must be descendants of MapContainer.

2. **Use dynamic imports with Next.js 14**:
   ```tsx
   import dynamic from 'next/dynamic';
   
   const MapContainer = dynamic(
     () => import('react-leaflet').then((mod) => mod.MapContainer),
     { ssr: false }
   );
   
   const TileLayer = dynamic(
     () => import('react-leaflet').then((mod) => mod.TileLayer),
     { ssr: false }
   );
   ```

3. **Check conditional rendering**: Make sure MapContainer is rendered before any child components that use Leaflet context.

4. **Use useEffect for initialization**:
   ```tsx
   const MapComponent = () => {
     const [isMounted, setIsMounted] = useState(false);
     
     useEffect(() => {
       setIsMounted(true);
     }, []);
     
     if (!isMounted) return <div>Loading map...</div>;
     
     return (
       <MapContainer>
         {/* Leaflet components */}
       </MapContainer>
     );
   };
   ```

### 2. CSS Loading Issues

Sometimes Leaflet styles may not load properly, causing visual issues with maps.

#### CSS Import Solutions

1. **Import CSS files in the correct component**:
   ```tsx
   // In your MapComponent
   import 'leaflet/dist/leaflet.css';
   import 'leaflet-draw/dist/leaflet.draw.css';
   import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
   ```

2. **For Next.js 14, consider importing CSS in a Client Component**:
   ```tsx
   'use client';
   
   import { useEffect } from 'react';
   
   export default function LeafletStyles() {
     useEffect(() => {
       require('leaflet/dist/leaflet.css');
       require('leaflet-draw/dist/leaflet.draw.css');
       require('leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css');
     }, []);
     
     return null;
   }
   ```

3. **Add TypeScript declarations for CSS imports**:
   ```typescript
   // src/global.d.ts
   declare module 'leaflet/dist/leaflet.css';
   declare module 'leaflet-draw/dist/leaflet.draw.css';
   declare module 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
   ```

### 3. Map Rendering Problems

When maps aren't visible or render incorrectly.

#### Visual Rendering Fixes

1. **Ensure the container has explicit height and width**:
   ```tsx
   <div style={{ height: "500px", width: "100%" }}>
     <MapContainer style={{ height: "100%", width: "100%" }} />
   </div>
   ```

2. **Fix marker icon paths** using leaflet-defaulticon-compatibility:
   ```tsx
   import L from 'leaflet';
   import 'leaflet-defaulticon-compatibility';
   import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
   ```

3. **Use a loading indicator** while map resources are loading:
   ```tsx
   {mounted ? (
     <MapContainer>
       {/* Map content */}
     </MapContainer>
   ) : (
     <div className="loading-indicator">Loading map...</div>
   )}
   ```

### 4. Server Component Compatibility

Leaflet requires browser APIs and cannot be used directly in Server Components.

#### Next.js Integration Strategies

1. **Use the 'use client' directive** at the top of files containing Leaflet components:
   ```tsx
   'use client';
   
   import { MapContainer, TileLayer } from 'react-leaflet';
   ```

2. **Create a client component boundary**:
   ```tsx
   // MapWrapper.tsx - Client Component
   'use client';
   
   import { MapContainer, TileLayer } from 'react-leaflet';
   
   export default function MapWrapper({ children }) {
     return (
       <MapContainer>
         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
         {children}
       </MapContainer>
     );
   }
   
   // page.tsx - Server Component
   import MapWrapper from './MapWrapper';
   
   export default function Page() {
     return (
       <div>
         <h1>Map Page</h1>
         <MapWrapper />
       </div>
     );
   }
   ```

### 5. Performance with Large Datasets

Issues when working with many markers or shapes.

#### Optimization Techniques

1. **Use marker clustering**:
   ```tsx
   import MarkerClusterGroup from 'react-leaflet-cluster';
   
   <MapContainer>
     <TileLayer url="..." />
     <MarkerClusterGroup>
       {markers.map((marker) => (
         <Marker position={marker.position} key={marker.id}>
           <Popup>{marker.content}</Popup>
         </Marker>
       ))}
     </MarkerClusterGroup>
   </MapContainer>
   ```

2. **Implement virtualization for markers** that only renders markers in the visible viewport.

## Additional References

- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Leaflet in React Server Components workarounds](https://github.com/PaulLeCam/react-leaflet/issues/969)

