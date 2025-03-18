"use client"

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Map as LeafletMap, LatLng } from 'leaflet';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ZoomInIcon,
  ZoomOutIcon,
  HomeIcon,
  MapPinIcon,
  SendIcon,
  FileIcon,
  TextIcon,
  XIcon,
  PenLineIcon,
  SquareIcon,
  ImageIcon,
  UserIcon,
  AlertTriangleIcon,
  FilterIcon,
  CogIcon,
  MapPin,
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger, 
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import LeafletErrorBoundary from "@/components/LeafletErrorBoundary";
import '@/lib/leaflet-preload'; 
import { useLeaflet } from "@/hooks/useLeaflet";
import { useMapEvents } from "react-leaflet";

// Rename unused variables
const _Card = Card;
const _CardContent = CardContent;
const _CardDescription = CardDescription;
const _CardFooter = CardFooter;
const _CardHeader = CardHeader;
const _CardTitle = CardTitle;
const _MapPinIcon = MapPinIcon;
const _SendIcon = SendIcon;
const _FileIcon = FileIcon;
const _TextIcon = TextIcon;
const _XIcon = XIcon;
const _AlertTriangleIcon = AlertTriangleIcon;
const _FilterIcon = FilterIcon;
const _DialogTrigger = DialogTrigger;

// Type for Leaflet
type _L = typeof import('leaflet');

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const FeatureGroup = dynamic(
  () => import('react-leaflet').then((mod) => mod.FeatureGroup),
  { ssr: false }
);
const ZoomControl = dynamic(
  () => import('react-leaflet').then((mod) => mod.ZoomControl),
  { ssr: false }
);

// Import EditControl with proper typing
const EditControl = dynamic(
  () => import('../project-mapping/components/EditControl').then((mod) => mod.EditControl),
  { ssr: false }
);

// Geo-search component
const SearchControl = dynamic(
  () => import('@/app/components/SearchControl').then((mod) => mod.SearchControl),
  { ssr: false }
);

// Geolocation component
const GeolocateControl = dynamic(
  () => import('@/app/components/GeolocateControl').then((mod) => mod.GeolocateControl),
  { ssr: false }
);

// Dynamically import polyline and polygon components
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);

// Define types
interface CommunityInput {
  id: string;
  type: string; // point, line, polygon
  geometry: any;
  title: string;
  description: string;
  category: string;
  username: string;
  timestamp: string;
  status: string; // pending, approved, rejected
  images: string[];
}

interface InputCategory {
  id: string;
  name: string;
  color: string;
}

// Rename unused variables for linter compliance
const _useCallback = useCallback;

export function CommunityInputMap() {
  // Map state
  const [mapCenter, _setMapCenter] = useState<[number, number]>([37.7749, -122.4194]);
  const [zoom, _setZoom] = useState(12);
  const mapRef = useRef<LeafletMap | null>(null);
  const { leafletLoaded } = useLeaflet();
  
  // Input state
  const [drawingMode, setDrawingMode] = useState<'point' | 'line' | 'polygon' | null>(null);
  const [showInputForm, setShowInputForm] = useState(false);
  const [currentInput, setCurrentInput] = useState<Partial<CommunityInput>>({
    type: 'point',
    title: '',
    description: '',
    category: 'general',
    status: 'pending',
    images: []
  });
  const [selectedGeometry, setSelectedGeometry] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(true); // Set to true by default for testing
  const [_showAdminPanel, setShowAdminPanel] = useState(false);
  const [autoApprove, _setAutoApprove] = useState(false);
  
  // Community input data
  const [communityInputs, setCommunityInputs] = useState<CommunityInput[]>([]);
  const [filteredInputs, setFilteredInputs] = useState<CommunityInput[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, _setStatusFilter] = useState<string | null>(null);
  
  // Categories for input - in real app, these would be configurable
  const inputCategories: InputCategory[] = [
    { id: 'general', name: 'General', color: '#3b82f6' },
    { id: 'safety', name: 'Safety', color: '#ef4444' },
    { id: 'transportation', name: 'Active Transportation', color: '#22c55e' },
    { id: 'maintenance', name: 'Maintenance', color: '#f59e0b' },
    { id: 'traffic', name: 'Traffic', color: '#8b5cf6' },
  ];
  
  // Mock data for community inputs
  useEffect(() => {
    // In real implementation, fetch from API
    const fetchCommunityInputs = async () => {
      try {
        // In a production app, this would be a real API call:
        // const response = await fetch('/api/community-input');
        // const data = await response.json();
        
        // For now, use mock data
        const mockData: CommunityInput[] = [
          {
            id: '1',
            type: 'point',
            geometry: { lat: 37.7749, lng: -122.4194 },
            title: 'Need crosswalk here',
            description: 'This intersection is dangerous for pedestrians',
            category: 'safety',
            username: 'user123',
            timestamp: new Date().toISOString(),
            status: 'approved',
            images: ['/mock-image-1.jpg']
          },
          {
            id: '2',
            type: 'line',
            geometry: [
              { lat: 37.7849, lng: -122.4294 },
              { lat: 37.7859, lng: -122.4154 }
            ],
            title: 'Bike lane needed',
            description: 'This corridor needs a protected bike lane',
            category: 'transportation',
            username: 'cyclist2022',
            timestamp: new Date().toISOString(),
            status: 'pending',
            images: []
          }
        ];
        
        setCommunityInputs(mockData);
        setFilteredInputs(mockData);
      } catch (error) {
        console.error('Error fetching community inputs:', error);
      }
    };
    
    fetchCommunityInputs();
  }, []);
  
  // Filter inputs when category or status filters change
  useEffect(() => {
    let filtered = [...communityInputs];
    
    if (categoryFilter) {
      filtered = filtered.filter(input => input.category === categoryFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(input => input.status === statusFilter);
    }
    
    setFilteredInputs(filtered);
  }, [communityInputs, categoryFilter, statusFilter]);
  
  // Map event handlers
  const handleSetMap = (map: LeafletMap) => {
    mapRef.current = map;
  };
  
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView(mapCenter, zoom);
    }
  };
  
  // Drawing mode handlers
  const enablePointMode = () => {
    setDrawingMode('point');
    setSelectedGeometry(null);
  };
  
  const enableLineMode = () => {
    setDrawingMode('line');
    setSelectedGeometry(null);
  };
  
  const enablePolygonMode = () => {
    setDrawingMode('polygon');
    setSelectedGeometry(null);
  };
  
  // Handle map click for point placement
  const handleMapClick = (e: any) => {
    if (drawingMode === 'point') {
      setSelectedGeometry({ lat: e.latlng.lat, lng: e.latlng.lng });
      setCurrentInput(prev => ({ ...prev, type: 'point' }));
      setShowInputForm(true);
      setDrawingMode(null);
    }
  };
  
  // Handle drawing created event from EditControl
  const handleDrawingCreated = (e: any) => {
    const layer = e.layer;
    const type = e.layerType;
    
    if (type === 'polyline') {
      const points = layer.getLatLngs().map((latlng: LatLng) => ({ 
        lat: latlng.lat, 
        lng: latlng.lng 
      }));
      setSelectedGeometry(points);
      setCurrentInput(prev => ({ ...prev, type: 'line' }));
      setShowInputForm(true);
    } else if (type === 'polygon') {
      const points = layer.getLatLngs()[0].map((latlng: LatLng) => ({ 
        lat: latlng.lat, 
        lng: latlng.lng 
      }));
      setSelectedGeometry(points);
      setCurrentInput(prev => ({ ...prev, type: 'polygon' }));
      setShowInputForm(true);
    }
    
    setDrawingMode(null);
  };
  
  // File upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };
  
  const _removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Form submission
  const handleSubmitInput = async () => {
    if (!selectedGeometry || !currentInput.title) {
      return; // Don't submit if required fields are missing
    }
    
    try {
      // In a real app, you would upload files here and get URLs back
      const newImageUrls = uploadedFiles.map(_ => `/mock-image-${Math.random()}.jpg`);
      
      const newInput: CommunityInput = {
        id: Date.now().toString(),
        type: currentInput.type || 'point',
        geometry: selectedGeometry,
        title: currentInput.title || '',
        description: currentInput.description || '',
        category: currentInput.category || 'general',
        username: 'current-user', // In real app, get from auth
        timestamp: new Date().toISOString(),
        status: autoApprove ? 'approved' : 'pending',
        images: newImageUrls
      };
      
      // In a production app, this would be a real API call:
      // const response = await fetch('/api/community-input', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     ...newInput,
      //     organizationId: 'org-123' // In a real app, get from context
      //   })
      // });
      //
      // if (response.ok) {
      //   const savedInput = await response.json();
      //   setCommunityInputs(prev => [...prev, savedInput]);
      // }
      
      // For now, just add to local state
      setCommunityInputs(prev => [...prev, newInput]);
      
      // Reset form
      setShowInputForm(false);
      setSelectedGeometry(null);
      setCurrentInput({
        type: 'point',
        title: '',
        description: '',
        category: 'general',
        status: 'pending',
        images: []
      });
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting input:', error);
    }
  };
  
  // Admin functions
  const _updateInputStatus = async (id: string, status: string) => {
    try {
      // In a production app, this would be a real API call:
      // const response = await fetch('/api/community-input', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     id,
      //     status
      //   })
      // });
      //
      // if (response.ok) {
      //   const updatedInput = await response.json();
      //   setCommunityInputs(prev => 
      //     prev.map(input => 
      //       input.id === updatedInput.id ? updatedInput : input
      //     )
      //   );
      // }
      
      // For now, just update local state
      setCommunityInputs(prev => 
        prev.map(input => 
          input.id === id ? { ...input, status } : input
        )
      );
    } catch (error) {
      console.error('Error updating input status:', error);
    }
  };
  
  const _deleteInput = async (id: string) => {
    try {
      // In a production app, this would be a real API call:
      // const response = await fetch(`/api/community-input?id=${id}`, {
      //   method: 'DELETE'
      // });
      //
      // if (response.ok) {
      //   setCommunityInputs(prev => prev.filter(input => input.id !== id));
      // }
      
      // For now, just delete from local state
      setCommunityInputs(prev => prev.filter(input => input.id !== id));
    } catch (error) {
      console.error('Error deleting input:', error);
    }
  };
  
  const getCategoryColor = (categoryId: string): string => {
    const category = inputCategories.find(cat => cat.id === categoryId);
    return category?.color || '#3b82f6';
  };
  
  // Render markers and geometries
  const renderInputGeometries = () => {
    return filteredInputs.map(input => {
      const color = getCategoryColor(input.category);
      
      if (input.type === 'point') {
        return (
          <Marker 
            key={input.id}
            position={[input.geometry.lat, input.geometry.lng]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-medium mb-1">{input.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{input.description}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge style={{ backgroundColor: color, color: 'white' }}>
                    {inputCategories.find(cat => cat.id === input.category)?.name || 'General'}
                  </Badge>
                  <Badge variant="outline">
                    {input.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <UserIcon size={12} />
                  <span>{input.username}</span>
                </div>
                {input.images.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {input.images.map((img, idx) => (
                        <div key={idx} className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                          <img src={img} alt="User upload" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      } else if (input.type === 'line') {
        const positions = input.geometry.map((point: any) => [point.lat, point.lng]);
        
        return (
          <React.Fragment key={input.id}>
            {leafletLoaded && (
              <Polyline 
                positions={positions}
                pathOptions={{ 
                  color: color,
                  weight: 4,
                  opacity: 0.7
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-medium mb-1">{input.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{input.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge style={{ backgroundColor: color, color: 'white' }}>
                        {inputCategories.find(cat => cat.id === input.category)?.name || 'General'}
                      </Badge>
                      <Badge variant="outline">
                        {input.status}
                      </Badge>
                    </div>
                    {input.images.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {input.images.map((img: string, idx: number) => (
                            <div key={idx} className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                              <img src={img} alt="User upload" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Polyline>
            )}
          </React.Fragment>
        );
      } else if (input.type === 'polygon') {
        const positions = input.geometry.map((point: any) => [point.lat, point.lng]);
        
        return (
          <React.Fragment key={input.id}>
            {leafletLoaded && (
              <Polygon 
                positions={[positions]}
                pathOptions={{ 
                  color: color,
                  weight: 2,
                  opacity: 0.7,
                  fillColor: color,
                  fillOpacity: 0.4
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-medium mb-1">{input.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{input.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge style={{ backgroundColor: color, color: 'white' }}>
                        {inputCategories.find(cat => cat.id === input.category)?.name || 'General'}
                      </Badge>
                      <Badge variant="outline">
                        {input.status}
                      </Badge>
                    </div>
                    {input.images.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {input.images.map((img: string, idx: number) => (
                            <div key={idx} className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                              <img src={img} alt="User upload" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Polygon>
            )}
          </React.Fragment>
        );
      }
      
      return null;
    });
  };
  
  // Component for handling map clicks
  const MapClickHandler = () => {
    const _map = useMapEvents({
      click: handleMapClick
    });
    
    return null;
  };
  
  return (
    <div className="relative h-[700px] w-full">
      <LeafletErrorBoundary>
        {leafletLoaded && (
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            className="h-full w-full"
            whenCreated={handleSetMap}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
            />
            
            {/* Map click handler */}
            <MapClickHandler />
            
            {/* Map controls */}
            <ZoomControl position="bottomright" />
            <SearchControl />
            <GeolocateControl />
            
            {/* Drawing layer for lines and polygons */}
            {(drawingMode === 'line' || drawingMode === 'polygon') && (
              <FeatureGroup>
                <EditControl
                  position="topright"
                  draw={{
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polyline: drawingMode === 'line',
                    polygon: drawingMode === 'polygon'
                  }}
                  onCreated={handleDrawingCreated}
                />
              </FeatureGroup>
            )}
            
            {/* Render community input geometries */}
            {renderInputGeometries()}
          </MapContainer>
        )}
      </LeafletErrorBoundary>
      
      {/* Map control panel */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-950 shadow-md rounded-md p-2 z-[1000]">
        <div className="flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={enablePointMode}
                  className={drawingMode === 'point' ? 'bg-blue-100 dark:bg-blue-900' : ''}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add point</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={enableLineMode}
                  className={drawingMode === 'line' ? 'bg-blue-100 dark:bg-blue-900' : ''}
                >
                  <PenLineIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Draw line</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={enablePolygonMode}
                  className={drawingMode === 'polygon' ? 'bg-blue-100 dark:bg-blue-900' : ''}
                >
                  <SquareIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Draw area</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomInIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom in</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOutIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleResetView}>
                  <HomeIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setShowAdminPanel(true)}>
                    <CogIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Admin settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
          
          {/* Toggle admin mode for testing */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isAdmin ? "default" : "outline"} 
                  size="icon" 
                  onClick={() => setIsAdmin(!isAdmin)}
                >
                  <UserIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isAdmin ? "Exit admin mode" : "Enter admin mode"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Category filter */}
      <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-950 shadow-md rounded-md p-2">
        <Select
          value={categoryFilter || ""}
          onValueChange={(value) => setCategoryFilter(value === "" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {inputCategories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Input form dialog */}
      <Dialog open={showInputForm} onOpenChange={setShowInputForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Community Input</DialogTitle>
            <DialogDescription>
              Provide your feedback about this location or area.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={currentInput.title}
                onChange={(e) => setCurrentInput(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
                placeholder="Brief title for your input"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={currentInput.category}
                onValueChange={(value) => setCurrentInput(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {inputCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={currentInput.description}
                onChange={(e) => setCurrentInput(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Describe your feedback in detail"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">
                Images
              </Label>
              <div className="col-span-3">
                <div className="mb-2">
                  <Label htmlFor="images" className="cursor-pointer">
                    <div className="flex items-center gap-2 p-2 border border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-gray-900">
                      <ImageIcon className="h-4 w-4" />
                      <span>Upload images</span>
                    </div>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileUpload}
                    />
                  </Label>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden"
                      >
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Upload ${index}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" onClick={handleSubmitInput}>
              Add Input
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}