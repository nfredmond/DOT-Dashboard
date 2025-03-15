// Global type declarations

// CSS module declarations
declare module '*.css';
declare module 'leaflet/dist/leaflet.css';
declare module 'leaflet-draw/dist/leaflet.draw.css';
declare module 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// Window augmentation for Leaflet
interface Window {
  L: any;
  _leaflet?: any;
}

// Improved declaration for leaflet.markercluster
declare module 'leaflet.markercluster' {
  export interface MarkerClusterGroupOptions {
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    spiderfyOnMaxZoom?: boolean;
    removeOutsideVisibleBounds?: boolean;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    disableClusteringAtZoom?: number;
    maxClusterRadius?: number;
    polygonOptions?: any;
    singleMarkerMode?: boolean;
    spiderLegPolylineOptions?: any;
    spiderfyDistanceMultiplier?: number;
    iconCreateFunction?: (cluster: any) => any;
    chunkedLoading?: boolean;
  }
}

// These modules are imported dynamically
declare module 'leaflet-defaulticon-compatibility'; 