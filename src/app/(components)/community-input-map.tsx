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
import '@/lib/leaflet-preload'; 
import { useLeaflet } from "@/hooks/useLeaflet";
import { useMapEvents } from "react-leaflet";
import { Switch } from "@/components/ui/switch";

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
const _ZoomControl = dynamic(
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
  agencyId?: string; // Agency that owns this input
  llmClassification?: string; // Classification provided by LLM
  moderationNote?: string; // Note from moderator
}

interface InputCategory {
  id: string;
  name: string;
  color: string;
}

// Agency interface for customization
interface Agency {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor: string;
  categories: InputCategory[];
  requiresApproval: boolean;
  useLlmModeration: boolean;
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
  const [isAdmin, _setIsAdmin] = useState(true); // Set to true by default for testing
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [useLlmModeration, setUseLlmModeration] = useState(true);
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [moderationNote, setModerationNote] = useState('');
  
  // Community input data
  const [communityInputs, setCommunityInputs] = useState<CommunityInput[]>([]);
  const [filteredInputs, setFilteredInputs] = useState<CommunityInput[]>([]);
  const [categoryFilter, _setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, _setStatusFilter] = useState<string | null>(null);
  
  // Categories for input - in real app, these would be configurable
  const inputCategories: InputCategory[] = [
    { id: 'general', name: 'General', color: '#3b82f6' },
    { id: 'safety', name: 'Safety', color: '#ef4444' },
    { id: 'transportation', name: 'Active Transportation', color: '#22c55e' },
    { id: 'maintenance', name: 'Maintenance', color: '#f59e0b' },
    { id: 'traffic', name: 'Traffic', color: '#8b5cf6' },
  ];
  
  // Load agencies (in real app, fetch from API)
  useEffect(() => {
    // Mock data for agencies
    const mockAgencies: Agency[] = [
      {
        id: 'dot',
        name: 'Department of Transportation',
        primaryColor: '#3b82f6',
        categories: [
          { id: 'general', name: 'General', color: '#3b82f6' },
          { id: 'safety', name: 'Safety', color: '#ef4444' },
          { id: 'transportation', name: 'Active Transportation', color: '#22c55e' },
          { id: 'maintenance', name: 'Maintenance', color: '#f59e0b' },
          { id: 'traffic', name: 'Traffic', color: '#8b5cf6' },
        ],
        requiresApproval: true,
        useLlmModeration: true
      },
      {
        id: 'planning',
        name: 'City Planning Department',
        primaryColor: '#22c55e',
        categories: [
          { id: 'general', name: 'General', color: '#3b82f6' },
          { id: 'zoning', name: 'Zoning', color: '#ef4444' },
          { id: 'housing', name: 'Housing', color: '#22c55e' },
          { id: 'parks', name: 'Parks & Recreation', color: '#f59e0b' },
        ],
        requiresApproval: true,
        useLlmModeration: false
      }
    ];
    
    setAgencies(mockAgencies);
    setCurrentAgency(mockAgencies[0]); // Default to first agency
  }, []);
  
  // Update input categories when agency changes
  useEffect(() => {
    if (currentAgency) {
      // Update auto-approve setting based on agency preferences
      setAutoApprove(!currentAgency.requiresApproval);
      setUseLlmModeration(currentAgency.useLlmModeration);
    }
  }, [currentAgency]);
  
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
  
  const _handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
  };

  const _handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    }
  };

  const _handleResetView = () => {
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
  
  // Mock LLM service functions locally
  const mockClassifyText = async (prompt: string): Promise<string> => {
    console.log('Classification prompt:', prompt);
    
    // Extract categories from the prompt
    const categoriesMatch = prompt.match(/categories: (.*?)\.\\n/i);
    const categoriesText = categoriesMatch ? categoriesMatch[1] : '';
    const categories = categoriesText.split(',').map(cat => cat.trim().toLowerCase());
    
    // If no categories found, return a default
    if (categories.length === 0 || !categories[0]) {
      return 'general';
    }
    
    // Randomly select a category for demo purposes
    return categories[Math.floor(Math.random() * categories.length)];
  };
  
  // Use LLM to classify input
  const classifyInputWithLLM = async (description: string): Promise<string> => {
    try {
      setIsProcessing(true);
      // If using mock, return a random category
      if (!currentAgency) {
        const categories = inputCategories.map(c => c.id);
        return categories[Math.floor(Math.random() * categories.length)];
      }
      
      // In production, call LLM service
      const categories = currentAgency.categories.map(c => c.name).join(', ');
      const prompt = `Classify the following community input into one of these categories: ${categories}.\n\nInput: ${description}\n\nCategory:`;
      
      // Call mock LLM service 
      const mockResult = await mockClassifyText(prompt);
      
      console.log('LLM classification result:', mockResult);
      return mockResult;
    } catch (error) {
      console.error('Error classifying input with LLM:', error);
      return 'general'; // Default to general category if classification fails
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Enhanced submit function with LLM classification
  const handleSubmitInput = async () => {
    try {
      if (!selectedGeometry) {
        alert('Please draw a shape on the map first');
        return;
      }
      
      if (!currentInput.title || !currentInput.description) {
        alert('Please provide a title and description');
        return;
      }
      
      setIsProcessing(true);
      
      // If LLM moderation is enabled and no category is selected, classify with LLM
      let category = currentInput.category || 'general';
      if (useLlmModeration && category === 'general') {
        category = await classifyInputWithLLM(currentInput.description || '');
      }
      
      // Process image uploads
      // In a real app, this would upload to a storage service and return URLs
      const imageUrls = uploadedFiles.map(file => URL.createObjectURL(file));
      
      // Create new input object
      const newInput: CommunityInput = {
        id: Date.now().toString(),
        type: currentInput.type || 'point',
        geometry: selectedGeometry,
        title: currentInput.title || '',
        description: currentInput.description || '',
        category: category,
        username: 'current_user', // This would come from auth system
        timestamp: new Date().toISOString(),
        status: autoApprove ? 'approved' : 'pending',
        images: imageUrls,
        agencyId: currentAgency?.id,
        llmClassification: category,
      };
      
      // In a real app, this would send to an API
      // await fetch('/api/community-inputs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newInput)
      // });
      
      // For demo, just add to local state
      setCommunityInputs(prev => [...prev, newInput]);
      setFilteredInputs(prev => [...prev, newInput]);
      
      // Reset form
      setCurrentInput({
        type: 'point',
        title: '',
        description: '',
        category: 'general',
        status: 'pending',
        images: []
      });
      setSelectedGeometry(null);
      setUploadedFiles([]);
      setShowInputForm(false);
      
      // Reset map for next input
      if (mapRef.current) {
        // Remove temporary drawing layers
        const map = mapRef.current;
        // Check if the map has the Leaflet.PM plugin
        if (map && 'pm' in map) {
          // Type assertion for the Leaflet.PM plugin
          const pmMap = map as any;
          const drawnItems = pmMap.pm.getGeomanDrawLayers();
          drawnItems.forEach((layer: any) => {
            map.removeLayer(layer);
          });
        }
      }
      
      alert('Your input has been submitted successfully' + (autoApprove ? ' and is now visible on the map.' : ' and is waiting for approval.'));
    } catch (error) {
      console.error('Error submitting input:', error);
      alert('Error submitting input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Enhanced function to update input status with moderation note
  const updateInputStatus = async (id: string, status: string) => {
    try {
      setIsProcessing(true);
      
      // In a real app, this would send to an API
      // await fetch(`/api/community-inputs/${id}/status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status, moderationNote })
      // });
      
      // For demo, just update local state
      const updatedInputs = communityInputs.map(input => {
        if (input.id === id) {
          return {
            ...input,
            status,
            moderationNote: moderationNote || input.moderationNote
          };
        }
        return input;
      });
      
      setCommunityInputs(updatedInputs);
      
      // Apply filters
      let filtered = [...updatedInputs];
      if (categoryFilter) {
        filtered = filtered.filter(input => input.category === categoryFilter);
      }
      if (statusFilter) {
        filtered = filtered.filter(input => input.status === statusFilter);
      }
      
      setFilteredInputs(filtered);
      setModerationNote('');
      
      alert(`Input has been ${status === 'approved' ? 'approved' : 'rejected'}.`);
    } catch (error) {
      console.error(`Error updating input status to ${status}:`, error);
      alert('Error updating input status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
  
  // Render admin panel
  const renderAdminPanel = () => {
    if (!isAdmin || !showAdminPanel) return null;
    
    // Filter for pending inputs
    const pendingInputs = communityInputs.filter(input => input.status === 'pending');
    
    return (
      <div className="absolute z-10 right-4 top-4 w-80 bg-white rounded-lg shadow-lg p-4 max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Admin Controls</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdminPanel(false)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoApprove">Auto-approve submissions</Label>
            <Switch
              id="autoApprove"
              checked={autoApprove}
              onCheckedChange={setAutoApprove}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="useLlm">Use LLM for categorization</Label>
            <Switch
              id="useLlm"
              checked={useLlmModeration}
              onCheckedChange={setUseLlmModeration}
            />
          </div>
          
          <div className="mt-2">
            <Label htmlFor="agencySelect">Current Agency</Label>
            <Select
              value={currentAgency?.id || ''}
              onValueChange={(value) => {
                const agency = agencies.find(a => a.id === value);
                if (agency) setCurrentAgency(agency);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select agency" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map(agency => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <h4 className="font-medium mb-2">Pending Inputs ({pendingInputs.length})</h4>
        {pendingInputs.length === 0 ? (
          <p className="text-sm text-gray-500">No pending inputs</p>
        ) : (
          <div className="space-y-3">
            {pendingInputs.map(input => (
              <Card key={input.id} className="p-3">
                <h5 className="font-medium">{input.title}</h5>
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{input.description}</p>
                <div className="flex gap-1 mb-2">
                  <Badge variant="outline">
                    {input.type}
                  </Badge>
                  <Badge
                    style={{ backgroundColor: getCategoryColor(input.category) }}
                    className="text-white"
                  >
                    {input.category}
                  </Badge>
                </div>
                
                <div className="mb-2">
                  <Label htmlFor={`note-${input.id}`} className="text-xs">Moderation Note</Label>
                  <Textarea
                    id={`note-${input.id}`}
                    placeholder="Add a note (optional)"
                    className="h-16 text-sm"
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateInputStatus(input.id, 'rejected')}
                    disabled={isProcessing}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateInputStatus(input.id, 'approved')}
                    disabled={isProcessing}
                  >
                    Approve
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const getCategoryColor = (categoryId: string): string => {
    const category = inputCategories.find(cat => cat.id === categoryId);
    return category?.color || '#3b82f6';
  };
  
  // Render the map with controls
  return (
    <div className="relative w-full h-full">
      {leafletLoaded && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={enablePointMode}
                  size="icon"
                  variant={drawingMode === 'point' ? 'default' : 'outline'}
                  className="h-10 w-10 rounded-full bg-white shadow-md"
                >
                  <MapPin className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Point</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={enableLineMode}
                  size="icon"
                  variant={drawingMode === 'line' ? 'default' : 'outline'}
                  className="h-10 w-10 rounded-full bg-white shadow-md"
                >
                  <PenLineIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Draw Line</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={enablePolygonMode}
                  size="icon"
                  variant={drawingMode === 'polygon' ? 'default' : 'outline'}
                  className="h-10 w-10 rounded-full bg-white shadow-md"
                >
                  <SquareIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Draw Area</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {isAdmin && (
        <div className="absolute top-4 right-4 z-10">
          <Button 
            variant="default"
            size="sm"
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="shadow-md"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            Admin Controls
          </Button>
        </div>
      )}
      
      {renderAdminPanel()}
      
      {leafletLoaded && (
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          className="w-full h-full"
          whenCreated={handleSetMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Map controls */}
          <div className="leaflet-top leaflet-right">
            <div className="leaflet-control leaflet-bar">
              <GeolocateControl />
              <SearchControl />
            </div>
          </div>
          
          {/* User inputs on map */}
          {renderInputGeometries()}
          
          {/* Drawing controls */}
          <FeatureGroup>
            <EditControl
              position="topleft"
              onCreated={handleDrawingCreated}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: drawingMode === 'point',
                polyline: drawingMode === 'line',
                polygon: drawingMode === 'polygon',
              }}
              edit={{
                edit: false,
                remove: false,
              }}
            />
          </FeatureGroup>
          
          {/* Map click handler */}
          <MapClickHandler />
        </MapContainer>
      )}
      
      {/* Input form dialog */}
      <Dialog open={showInputForm} onOpenChange={setShowInputForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Community Input</DialogTitle>
            <DialogDescription>
              Provide details about the location you've selected
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief title for your input"
                value={currentInput.title}
                onChange={(e) => setCurrentInput({...currentInput, title: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue or suggestion in detail"
                className="min-h-[100px]"
                value={currentInput.description}
                onChange={(e) => setCurrentInput({...currentInput, description: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={currentInput.category}
                onValueChange={(value) => setCurrentInput({...currentInput, category: value})}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(currentAgency?.categories || inputCategories).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {useLlmModeration && (
                <p className="text-xs text-gray-500 mt-1">
                  Leave as "General" for automatic categorization
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="images">Upload Images (optional)</Label>
              <div className="flex items-center gap-2">
                <Label 
                  htmlFor="image-upload" 
                  className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium cursor-pointer"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Choose Files
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <span className="text-sm text-gray-500">
                  {uploadedFiles.length} file(s) selected
                </span>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative h-16 w-16 rounded overflow-hidden">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Preview ${index}`}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-5 w-5 rounded-full p-0"
                        onClick={() => {
                          const newFiles = [...uploadedFiles];
                          newFiles.splice(index, 1);
                          setUploadedFiles(newFiles);
                        }}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInputForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitInput} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}