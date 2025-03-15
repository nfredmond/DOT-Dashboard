// Declare global Leaflet object
declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

// Declare CSS modules
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Declare specific Leaflet CSS modules
declare module 'leaflet/dist/leaflet.css';
declare module 'leaflet-draw/dist/leaflet.draw.css';
declare module 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

export {}; 