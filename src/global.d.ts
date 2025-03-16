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

// Speech recognition API types
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (event: Event) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onstart: (event: Event) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
} 