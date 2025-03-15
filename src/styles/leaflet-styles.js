// This file is a JavaScript module to handle Leaflet CSS imports
// Next.js will process this correctly since it's a JS file

// Import icons (as paths) from leaflet's assets
export const leafletIconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
export const leafletIcon2xUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
export const leafletShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// We'll load the actual CSS in the LeafletScripts component using useEffect
export const styleUrls = {
  leaflet: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  leafletDraw: 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css',
  customCompat: '/css/leaflet-compat.css'
};

export default {
  leafletIconUrl,
  leafletIcon2xUrl,
  leafletShadowUrl,
  styleUrls
}; 