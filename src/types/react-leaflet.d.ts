import { Map as LeafletMap } from 'leaflet';
import { ReactNode } from 'react';

declare module 'react-leaflet' {
  export interface MapContainerProps {
    center: [number, number];
    zoom: number;
    style?: React.CSSProperties;
    zoomControl?: boolean;
    children?: ReactNode;
    whenCreated?: (map: LeafletMap) => void;
    maxBoundsViscosity?: number;
    boundsOptions?: {
      padding: [number, number];
    };
  }

  export interface TileLayerProps {
    url: string;
    attribution?: string;
  }

  export interface LayersControlProps {
    position?: string;
    children?: ReactNode;
  }

  export interface FeatureGroupProps {
    children?: ReactNode;
  }

  export interface MarkerProps {
    position: [number, number];
    icon?: any;
    children?: ReactNode;
  }

  export interface PopupProps {
    children?: ReactNode;
  }

  export class MapContainer extends React.Component<MapContainerProps, unknown> {}
  export class TileLayer extends React.Component<TileLayerProps, unknown> {}
  export class Marker extends React.Component<MarkerProps, unknown> {}
  export class Popup extends React.Component<PopupProps, unknown> {}
  export class FeatureGroup extends React.Component<FeatureGroupProps, unknown> {}
  
  export class LayersControl extends React.Component<LayersControlProps, unknown> {
    static BaseLayer: React.FC<{
      checked?: boolean;
      name: string;
      children?: ReactNode;
    }>;
    static Overlay: React.FC<{
      checked?: boolean;
      name: string;
      children?: ReactNode;
    }>;
  }

  export function useMap(): LeafletMap;
  export function useMapEvents(handlers: any): LeafletMap;
}

declare module 'react-leaflet-cluster' {
  import { ReactNode } from 'react';
  
  interface MarkerClusterGroupProps {
    children?: ReactNode;
    chunkedLoading?: boolean;
  }
  
  export default class MarkerClusterGroup extends React.Component<MarkerClusterGroupProps, unknown> {}
}

// CSS module declarations
declare module 'leaflet/dist/leaflet.css';
declare module 'leaflet-draw/dist/leaflet.draw.css';
declare module 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// Add window augmentation for Leaflet
interface Window {
  L: typeof import('leaflet');
  _leaflet?: any;
} 