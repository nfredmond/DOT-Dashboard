// Define project types for sharing between React components and the fallback map
export interface ProjectMarker {
  id: string;
  name: string;
  description: string;
  status: string;
  category: string;
  budget?: number;
  // Geometry data can be one of three types
  geometryType: 'point' | 'line' | 'polygon';
  // For point features
  latitude?: number;
  longitude?: number;
  // For line features (array of points)
  path?: [number, number][];
  // For polygon features (array of points forming a closed shape)
  polygon?: [number, number][];
  // Styling options
  color?: string;
  fillColor?: string;
  weight?: number;
  opacity?: number;
}

// Define map configuration interface for sharing between components
export interface MapConfig {
  basemap: {
    id?: string;
    name?: string;
    url: string;
    attribution: string;
  };
  initialView: {
    center: [number, number];
    zoom: number;
  };
  controls: {
    showZoom?: boolean;
    showGeolocation?: boolean;
    showSearch?: boolean;
  };
}

// Extended Leaflet type declarations
declare global {
  namespace L {
    interface Marker {
      projectData?: ProjectMarker;
      _icon: HTMLElement;
    }
    
    interface Polyline {
      projectData?: ProjectMarker;
    }
    
    interface Polygon {
      projectData?: ProjectMarker;
    }
  }
} 