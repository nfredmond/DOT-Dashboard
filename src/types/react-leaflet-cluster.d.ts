import { ReactNode } from 'react';
import { MarkerClusterGroupOptions } from 'leaflet.markercluster';

declare module 'react-leaflet-cluster' {
  interface MarkerClusterGroupProps extends MarkerClusterGroupOptions {
    children?: ReactNode;
  }
  
  // Default export
  const MarkerClusterGroup: React.FC<MarkerClusterGroupProps>;
  export default MarkerClusterGroup;
} 