"use client"

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {
  Card,
  CardContent,
  CardDescription,
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
  PenLineIcon,
  SquareIcon,
  ImageIcon,
  XIcon,
  CogIcon,
  FilterIcon,
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import BaseMap from "@/components/maps/BaseMap";
import GeoJSONLayer from "@/components/maps/GeoJSONLayer";
import MarkerLayer, { MarkerData } from "@/components/maps/MarkerLayer";
import { initMapboxToken } from "@/lib/map-utils";

// Initialize Mapbox access token
initMapboxToken();

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

export function CommunityInputMap() {
  // Map state
  const [mapCenter, _setMapCenter] = useState<[number, number]>([
    -118.2437,
    34.0522,
  ]);
  const [zoom, _setZoom] = useState(10);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  
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
  const [isAdmin, _setIsAdmin] = useState(false);
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
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, _setStatusFilter] = useState<string | null>(null);
  
  // Marker and GeoJSON data
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: []
  });
  
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
  
  // Convert community inputs to markers and GeoJSON when filtered inputs change
  useEffect(() => {
    // Create markers for point features
    const newMarkers: MarkerData[] = filteredInputs
      .filter(input => input.type === 'point')
      .map(input => ({
        id: input.id,
        longitude: input.geometry.lng,
        latitude: input.geometry.lat,
        title: input.title,
        description: input.description,
        color: getCategoryColor(input.category),
        type: input.category,
        properties: {
          ...input,
          status: input.status,
          category: input.category,
          username: input.username,
          images: input.images
        }
      }));
    
    setMarkers(newMarkers);
    
    // Create GeoJSON for lines and polygons
    const features: GeoJSON.Feature[] = filteredInputs
      .filter(input => input.type === 'line' || input.type === 'polygon')
      .map(input => {
        const color = getCategoryColor(input.category);
        let geometry: GeoJSON.Geometry;
        
        if (input.type === 'line') {
          geometry = {
            type: 'LineString',
            coordinates: input.geometry.map((point: any) => [point.lng, point.lat])
          };
        } else { // polygon
          geometry = {
            type: 'Polygon',
            coordinates: [[...input.geometry.map((point: any) => [point.lng, point.lat]), input.geometry.map((point: any) => [point.lng, point.lat])[0]]]
          };
        }
        
        return {
          type: 'Feature',
          geometry,
          properties: {
            id: input.id,
            title: input.title,
            description: input.description,
            category: input.category,
            username: input.username,
            status: input.status,
            color,
            images: input.images
          }
        };
      });
    
    setGeoJsonData({
      type: 'FeatureCollection',
      features
    });
  }, [filteredInputs]);
  
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
  const handleMapLoad = (map: mapboxgl.Map) => {
    mapRef.current = map;
    
    // Add a popup for GeoJSON features when clicked
    map.on('click', 'community-lines', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      if (!feature.properties) return;
      
      const props = feature.properties;
      
      // Create popup content
      const popupContent = `
        <div class="p-2">
          <h3 class="font-medium mb-1">${props.title || ''}</h3>
          <p class="text-sm text-gray-600 mb-2">${props.description || ''}</p>
          <div class="flex items-center gap-2 mb-2">
            <span style="background-color: ${props.color || '#3b82f6'}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
              ${inputCategories.find(cat => cat.id === props.category)?.name || 'General'}
            </span>
            <span style="border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
              ${props.status || ''}
            </span>
          </div>
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <span>${props.username || ''}</span>
          </div>
        </div>
      `;
      
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(map);
    });
    
    map.on('click', 'community-polygons', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      if (!feature.properties) return;
      
      const props = feature.properties;
      
      // Create popup content
      const popupContent = `
        <div class="p-2">
          <h3 class="font-medium mb-1">${props.title || ''}</h3>
          <p class="text-sm text-gray-600 mb-2">${props.description || ''}</p>
          <div class="flex items-center gap-2 mb-2">
            <span style="background-color: ${props.color || '#3b82f6'}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
              ${inputCategories.find(cat => cat.id === props.category)?.name || 'General'}
            </span>
            <span style="border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
              ${props.status || ''}
            </span>
          </div>
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <span>${props.username || ''}</span>
          </div>
        </div>
      `;
      
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(map);
    });
    
    // Change cursor when hovering over features
    map.on('mouseenter', 'community-lines', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'community-lines', () => {
      map.getCanvas().style.cursor = '';
    });
    
    map.on('mouseenter', 'community-polygons', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'community-polygons', () => {
      map.getCanvas().style.cursor = '';
    });
  };
  
  // Drawing mode handlers
  const enablePointMode = () => {
    if (!mapRef.current) return;
    
    // Disable drawing controls if active
    if (drawRef.current) {
      mapRef.current.removeControl(drawRef.current);
      drawRef.current = null;
    }
    
    setDrawingMode('point');
    setSelectedGeometry(null);
    
    // Change cursor to indicate point placement mode
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = 'crosshair';
    }
  };
  
  const enableLineMode = () => {
    if (!mapRef.current) return;
    
    // Add drawing control for lines
    setDrawingMode('line');
    setSelectedGeometry(null);
    
    // Initialize draw control for line
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        trash: true
      }
    });
    
    mapRef.current.addControl(draw);
    drawRef.current = draw;
  };
  
  const enablePolygonMode = () => {
    if (!mapRef.current) return;
    
    // Add drawing control for polygons
    setDrawingMode('polygon');
    setSelectedGeometry(null);
    
    // Initialize draw control for polygon
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      }
    });
    
    mapRef.current.addControl(draw);
    drawRef.current = draw;
  };
  
  // Handle map click for point placement
  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (drawingMode === 'point') {
      setSelectedGeometry({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      setCurrentInput(prev => ({ ...prev, type: 'point' }));
      setShowInputForm(true);
      setDrawingMode(null);
      
      // Reset cursor
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = '';
      }
    }
  };
  
  // Handle drawing created event from Draw control
  const handleDrawingCreate = (e: any) => {
    if (!drawingMode || !mapRef.current || !drawRef.current) return;
    
    // Get the created feature
    const data = e.features[0];
    
    if (data.geometry.type === 'LineString') {
      // Format for our application structure
      const points = data.geometry.coordinates.map((coord: [number, number]) => ({ 
        lng: coord[0], 
        lat: coord[1] 
      }));
      
      setSelectedGeometry(points);
      setCurrentInput(prev => ({ ...prev, type: 'line' }));
      setShowInputForm(true);
    } else if (data.geometry.type === 'Polygon') {
      // Format for our application structure (using first ring)
      const points = data.geometry.coordinates[0].map((coord: [number, number]) => ({ 
        lng: coord[0], 
        lat: coord[1] 
      }));
      
      // Remove last coordinate as it's the same as the first for a closed polygon
      points.pop();
      
      setSelectedGeometry(points);
      setCurrentInput(prev => ({ ...prev, type: 'polygon' }));
      setShowInputForm(true);
    }
    
    setDrawingMode(null);
    
    // Remove the draw control after feature creation
    if (mapRef.current && drawRef.current) {
      mapRef.current.removeControl(drawRef.current);
      drawRef.current = null;
    }
  };
  
  // File upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };
  
  const removeFile = (index: number) => {
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
      
      // Clear any drawn features
      if (mapRef.current && drawRef.current) {
        drawRef.current.deleteAll();
        mapRef.current.removeControl(drawRef.current);
        drawRef.current = null;
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
      setModerationNote('');
      
      alert(`Input has been ${status === 'approved' ? 'approved' : 'rejected'}.`);
    } catch (error) {
      console.error(`Error updating input status to ${status}:`, error);
      alert('Error updating input status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Custom popup for marker points
  const customMarkerPopup = (marker: MarkerData) => {
    const properties = marker.properties || {};
    const categoryName = inputCategories.find(cat => cat.id === properties.category)?.name || 'General';
    
    return `
      <div class="p-2">
        <h3 class="font-medium mb-1">${marker.title || ''}</h3>
        <p class="text-sm text-gray-600 mb-2">${marker.description || ''}</p>
        <div class="flex items-center gap-2 mb-2">
          <span style="background-color: ${marker.color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
            ${categoryName}
          </span>
          <span style="border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
            ${properties.status || ''}
          </span>
        </div>
        <div class="flex items-center gap-1 text-xs text-gray-500">
          <span>${properties.username || ''}</span>
        </div>
        ${properties.images && properties.images.length > 0 ? `
          <div class="mt-2">
            <div class="flex flex-wrap gap-1">
              ${properties.images.map((img: string, idx: number) => `
                <div key="${idx}" class="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                  <img src="${img}" alt="User upload" class="w-full h-full object-cover" />
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };
  
  // Get category color
  const getCategoryColor = (categoryId: string): string => {
    if (currentAgency) {
      const category = currentAgency.categories.find(cat => cat.id === categoryId);
      if (category) return category.color;
    }
    
    const category = inputCategories.find(cat => cat.id === categoryId);
    return category ? category.color : '#3b82f6'; // Default blue
  };
  
  // Render admin panel
  const renderAdminPanel = () => {
    if (!isAdmin || !showAdminPanel) return null;
    
    // Filter for pending inputs
    const pendingInputs = communityInputs.filter(input => input.status === 'pending');
    
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CogIcon className="h-5 w-5" />
            Moderation Panel
          </CardTitle>
          <CardDescription>
            Review and manage community inputs
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Agency selection */}
          <div className="mb-4">
            <Label htmlFor="agency">Agency</Label>
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
          
          {/* Settings */}
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-approve" className="mb-1 block">Auto-approve</Label>
                <span className="text-sm text-gray-500">Automatically approve new submissions</span>
              </div>
              <Switch 
                id="auto-approve" 
                checked={autoApprove}
                onCheckedChange={setAutoApprove}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="llm-moderation" className="mb-1 block">AI classification</Label>
                <span className="text-sm text-gray-500">Use AI to classify submissions</span>
              </div>
              <Switch 
                id="llm-moderation" 
                checked={useLlmModeration}
                onCheckedChange={setUseLlmModeration}
              />
            </div>
          </div>
          
          {/* Pending inputs */}
          <div>
            <h3 className="text-md font-medium mb-2">Pending Review ({pendingInputs.length})</h3>
            {pendingInputs.length === 0 ? (
              <p className="text-sm text-gray-500">No pending inputs</p>
            ) : (
              <div className="space-y-3">
                {pendingInputs.map(input => (
                  <div key={input.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{input.title}</h4>
                      <Badge variant="outline">
                        {input.type}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2 text-gray-600">{input.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge style={{ backgroundColor: getCategoryColor(input.category), color: 'white' }}>
                        {currentAgency?.categories.find(cat => cat.id === input.category)?.name || 
                          inputCategories.find(cat => cat.id === input.category)?.name || 'General'}
                      </Badge>
                      <span className="text-xs text-gray-500">{input.username}</span>
                    </div>
                    
                    <div className="mt-3">
                      <Label htmlFor={`moderation-note-${input.id}`} className="text-xs">Moderation note (optional)</Label>
                      <Textarea 
                        id={`moderation-note-${input.id}`}
                        value={moderationNote} 
                        onChange={(e) => setModerationNote(e.target.value)}
                        className="h-20 mt-1"
                        placeholder="Add a note about this input..."
                      />
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => updateInputStatus(input.id, 'approved')}
                        disabled={isProcessing}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateInputStatus(input.id, 'rejected')}
                        disabled={isProcessing}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="relative h-[80vh] w-full">
      {/* Main map container */}
      <BaseMap 
        initialCenter={mapCenter}
        initialZoom={zoom}
        onMapLoad={handleMapLoad}
        className="h-full w-full"
      >
        {/* Marker layer for points */}
        {mapRef.current && (
          <MarkerLayer
            map={mapRef.current}
            markers={markers}
            usePopup={true}
            customPopup={customMarkerPopup}
          />
        )}

        {/* GeoJSON layer for lines */}
        {mapRef.current && geoJsonData.features.filter(f => f.geometry.type === 'LineString').length > 0 && (
          <GeoJSONLayer
            map={mapRef.current}
            sourceId="community-lines-source"
            layerId="community-lines"
            data={geoJsonData}
            layerType="line"
            paint={{
              'line-color': ['get', 'color'],
              'line-width': 4,
              'line-opacity': 0.7
            }}
          />
        )}

        {/* GeoJSON layer for polygons */}
        {mapRef.current && geoJsonData.features.filter(f => f.geometry.type === 'Polygon').length > 0 && (
          <GeoJSONLayer
            map={mapRef.current}
            sourceId="community-polygons-source"
            layerId="community-polygons"
            data={geoJsonData}
            layerType="fill"
            paint={{
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.4,
              'fill-outline-color': ['get', 'color']
            }}
          />
        )}
      </BaseMap>
        
      {/* Drawing tools */}
      <div className="absolute top-4 left-4 bg-white rounded-md shadow-md p-2 z-10">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={drawingMode === 'point' ? "default" : "outline"}
                  size="icon"
                  onClick={enablePointMode}
                >
                  <MapPinIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Point</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={drawingMode === 'line' ? "default" : "outline"}
                  size="icon"
                  onClick={enableLineMode}
                >
                  <PenLineIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Draw Line</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={drawingMode === 'polygon' ? "default" : "outline"}
                  size="icon"
                  onClick={enablePolygonMode}
                >
                  <SquareIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Draw Area</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Category filter */}
      <div className="absolute top-4 right-4 bg-white rounded-md shadow-md p-2 z-10">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-gray-500" />
          <Select
            value={categoryFilter || ''}
            onValueChange={(value) => setCategoryFilter(value || null)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {(currentAgency?.categories || inputCategories).map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Admin panel toggle */}
      {isAdmin && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            variant={showAdminPanel ? "default" : "outline"}
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="flex items-center gap-2"
          >
            <CogIcon className="h-4 w-4" />
            {showAdminPanel ? "Hide Panel" : "Admin Panel"}
          </Button>
        </div>
      )}
      
      {/* Admin panel */}
      {showAdminPanel && (
        <div className="absolute top-20 right-4 z-20">
          {renderAdminPanel()}
        </div>
      )}
      
      {/* Input form dialog */}
      <Dialog open={showInputForm} onOpenChange={setShowInputForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Community Input</DialogTitle>
            <DialogDescription>
              Add details about this location or feature
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={currentInput.title}
                onChange={(e) => setCurrentInput({ ...currentInput, title: e.target.value })}
                placeholder="Enter a title for your input"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentInput.description}
                onChange={(e) => setCurrentInput({ ...currentInput, description: e.target.value })}
                placeholder="Describe the issue or suggestion"
                className="h-24"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={currentInput.category}
                onValueChange={(value) => setCurrentInput({ ...currentInput, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(currentAgency?.categories || inputCategories).map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="images">Attachments (optional)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Label htmlFor="images" className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 border rounded-md px-3 py-2 hover:bg-gray-50">
                  <ImageIcon className="h-4 w-4" />
                  Add Images
                </Label>
                
                <span className="text-sm text-gray-500">
                  {uploadedFiles.length} file(s) selected
                </span>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative bg-gray-100 rounded-md p-1">
                      <div className="w-16 h-16 overflow-hidden rounded">
                        <img 
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-md"
                        onClick={() => removeFile(index)}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowInputForm(false);
                setDrawingMode(null);
                
                // Clear any drawn features
                if (mapRef.current && drawRef.current) {
                  drawRef.current.deleteAll();
                  mapRef.current.removeControl(drawRef.current);
                  drawRef.current = null;
                }
                
                // Reset cursor
                if (mapRef.current) {
                  mapRef.current.getCanvas().style.cursor = '';
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmitInput}
              disabled={isProcessing || !currentInput.title || !currentInput.description}
              className="flex items-center gap-2"
            >
              <SendIcon className="h-4 w-4" />
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}