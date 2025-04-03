'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapboxProvider } from '@/contexts/mapbox-context';
import { useMapbox } from '@/contexts/mapbox-context';
import MapboxMap from '@/components/ui/mapbox-map';
import MapboxSource from '@/components/ui/mapbox-source';
import MapboxLayer from '@/components/ui/mapbox-layer';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MapPin,
  Minus,
  Square,
  Upload,
  X,
  Settings,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Type definitions
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

interface Agency {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor: string;
  categories: InputCategory[];
  requiresApproval: boolean;
  useLlmModeration: boolean;
}

// The main MapboxCommunityInputMap component
function MapboxCommunityInputMapContent() {
  // Map state
  const { map, flyTo } = useMapbox();
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
  const [isAdmin, setIsAdmin] = useState(true); // Set to true by default for testing
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Categories for input - in real app, these would be configurable
  const inputCategories: InputCategory[] = [
    { id: 'general', name: 'General', color: '#3b82f6' },
    { id: 'safety', name: 'Safety', color: '#ef4444' },
    { id: 'transportation', name: 'Active Transportation', color: '#22c55e' },
    { id: 'maintenance', name: 'Maintenance', color: '#f59e0b' },
    { id: 'traffic', name: 'Traffic', color: '#8b5cf6' },
  ];

  // Initialize Mapbox Draw when map is available
  useEffect(() => {
    if (map && !drawRef.current) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          point: true,
          line_string: true,
          polygon: true,
          trash: true
        },
        defaultMode: 'simple_select',
        styles: [
          // Points
          {
            'id': 'gl-draw-point',
            'type': 'circle',
            'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
            'paint': {
              'circle-radius': 6,
              'circle-color': '#3b82f6'
            }
          },
          // Lines
          {
            'id': 'gl-draw-line',
            'type': 'line',
            'filter': ['all', ['==', '$type', 'LineString'], ['==', 'meta', 'feature']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#3b82f6',
              'line-width': 3
            }
          },
          // Polygons
          {
            'id': 'gl-draw-polygon-fill',
            'type': 'fill',
            'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'meta', 'feature']],
            'paint': {
              'fill-color': '#3b82f6',
              'fill-opacity': 0.3
            }
          },
          {
            'id': 'gl-draw-polygon-stroke',
            'type': 'line',
            'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'meta', 'feature']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#3b82f6',
              'line-width': 2
            }
          },
          // Vertex points
          {
            'id': 'gl-draw-point-active',
            'type': 'circle',
            'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
            'paint': {
              'circle-radius': 4,
              'circle-color': '#fff',
              'circle-stroke-color': '#3b82f6',
              'circle-stroke-width': 2
            }
          }
        ]
      });
      
      map.addControl(draw);
      drawRef.current = draw;
      
      // Handle create events
      map.on('draw.create', handleDrawCreate);
      map.on('draw.delete', handleDrawDelete);
      
      // Clean up on unmount
      return () => {
        if (map && drawRef.current) {
          map.off('draw.create', handleDrawCreate);
          map.off('draw.delete', handleDrawDelete);
          map.removeControl(drawRef.current);
          drawRef.current = null;
        }
      };
    }
  }, [map]);

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
  
  // Load community inputs
  useEffect(() => {
    // In a real implementation, fetch from API
    const fetchCommunityInputs = async () => {
      try {
        // Mock data for now
        const mockData: CommunityInput[] = [
          {
            id: '1',
            type: 'point',
            geometry: {
              type: 'Point',
              coordinates: [-122.4194, 37.7749]
            },
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
            geometry: {
              type: 'LineString',
              coordinates: [
                [-122.4294, 37.7849],
                [-122.4154, 37.7859]
              ]
            },
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

  // Drawing handlers
  const handleDrawCreate = useCallback((e: any) => {
    if (!e.features || e.features.length === 0) return;
    
    const feature = e.features[0];
    setSelectedGeometry(feature.geometry);
    
    // Set the appropriate type based on geometry
    if (feature.geometry.type === 'Point') {
      setCurrentInput(prev => ({ ...prev, type: 'point' }));
    } else if (feature.geometry.type === 'LineString') {
      setCurrentInput(prev => ({ ...prev, type: 'line' }));
    } else if (feature.geometry.type === 'Polygon') {
      setCurrentInput(prev => ({ ...prev, type: 'polygon' }));
    }
    
    // Show the input form
    setShowInputForm(true);
  }, []);

  const handleDrawDelete = useCallback(() => {
    // Clear selected geometry if form isn't open
    if (!showInputForm) {
      setSelectedGeometry(null);
    }
  }, [showInputForm]);

  const enableDrawingMode = (mode: 'point' | 'line' | 'polygon') => {
    if (!map || !drawRef.current) return;
    
    // Clear existing drawings
    if (!showInputForm && selectedGeometry) {
      drawRef.current.deleteAll();
      setSelectedGeometry(null);
    }
    
    setDrawingMode(mode);
    
    // Activate the appropriate drawing mode
    if (mode === 'point') {
      drawRef.current.changeMode('draw_point');
    } else if (mode === 'line') {
      drawRef.current.changeMode('draw_line_string');
    } else if (mode === 'polygon') {
      drawRef.current.changeMode('draw_polygon');
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

  // Mock LLM service
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

  // Submit the community input
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
      
      // Reset drawing
      if (drawRef.current) {
        drawRef.current.deleteAll();
      }
      
      alert('Your input has been submitted successfully' + (autoApprove ? ' and is now visible on the map.' : ' and is waiting for approval.'));
    } catch (error) {
      console.error('Error submitting input:', error);
      alert('Error submitting input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update input status
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

  // Helper to get color from category
  const getCategoryColor = (categoryId: string): string => {
    // Look up in current agency categories first
    if (currentAgency) {
      const agencyCategory = currentAgency.categories.find(cat => cat.id === categoryId);
      if (agencyCategory) return agencyCategory.color;
    }
    
    // Fall back to default categories
    const category = inputCategories.find(cat => cat.id === categoryId);
    return category ? category.color : '#3b82f6'; // Default blue
  };

  return (
    <div className="relative w-full h-full">
      {/* Map for input */}
      <MapboxMap
        initialViewState={{
          longitude: -122.4194,
          latitude: 37.7749,
          zoom: 12
        }}
        mapStyle={process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12'}
        className="w-full h-full"
      >
        {/* Community input layer */}
        {filteredInputs.length > 0 && (
          <MapboxSource
            id="community-inputs"
            source={{
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: filteredInputs.map(input => ({
                  type: 'Feature',
                  geometry: input.geometry,
                  properties: {
                    id: input.id,
                    title: input.title,
                    description: input.description,
                    category: input.category,
                    status: input.status,
                    username: input.username,
                    timestamp: input.timestamp,
                    type: input.type
                  }
                }))
              }
            }}
          >
            {/* Point layer */}
            <MapboxLayer
              id="community-input-points"
              type="circle"
              filter={['==', ['geometry-type'], 'Point']}
              paint={{
                'circle-radius': 8,
                'circle-color': [
                  'match',
                  ['get', 'category'],
                  'safety', '#ef4444',
                  'transportation', '#22c55e',
                  'maintenance', '#f59e0b',
                  'traffic', '#8b5cf6',
                  '#3b82f6' // default color
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': [
                  'case',
                  ['==', ['get', 'status'], 'pending'],
                  0.5,
                  0.8
                ]
              }}
            />
            
            {/* Line layer */}
            <MapboxLayer
              id="community-input-lines"
              type="line"
              filter={['==', ['geometry-type'], 'LineString']}
              paint={{
                'line-color': [
                  'match',
                  ['get', 'category'],
                  'safety', '#ef4444',
                  'transportation', '#22c55e',
                  'maintenance', '#f59e0b',
                  'traffic', '#8b5cf6',
                  '#3b82f6' // default color
                ],
                'line-width': 4,
                'line-opacity': [
                  'case',
                  ['==', ['get', 'status'], 'pending'],
                  0.5,
                  0.8
                ]
              }}
            />
            
            {/* Polygon layer */}
            <MapboxLayer
              id="community-input-polygons"
              type="fill"
              filter={['==', ['geometry-type'], 'Polygon']}
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'category'],
                  'safety', '#ef4444',
                  'transportation', '#22c55e',
                  'maintenance', '#f59e0b',
                  'traffic', '#8b5cf6',
                  '#3b82f6' // default color
                ],
                'fill-opacity': [
                  'case',
                  ['==', ['get', 'status'], 'pending'],
                  0.2,
                  0.4
                ]
              }}
            />
            
            {/* Polygon outlines */}
            <MapboxLayer
              id="community-input-polygon-outlines"
              type="line"
              filter={['==', ['geometry-type'], 'Polygon']}
              paint={{
                'line-color': [
                  'match',
                  ['get', 'category'],
                  'safety', '#ef4444',
                  'transportation', '#22c55e',
                  'maintenance', '#f59e0b',
                  'traffic', '#8b5cf6',
                  '#3b82f6' // default color
                ],
                'line-width': 2,
                'line-opacity': [
                  'case',
                  ['==', ['get', 'status'], 'pending'],
                  0.5,
                  0.8
                ]
              }}
            />
          </MapboxSource>
        )}
      </MapboxMap>
      
      {/* Drawing tool buttons */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button
          variant={drawingMode === 'point' ? 'default' : 'outline'}
          size="sm"
          className="bg-white text-black hover:bg-blue-100 dark:bg-slate-800 dark:text-white hover:text-black shadow-md"
          onClick={() => enableDrawingMode('point')}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Add Point
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn(drawingMode === 'line' && 'bg-blue-100')}
          onClick={() => enableDrawingMode('line')}
        >
          <Minus className="w-4 h-4 mr-2" />
          Add Line
        </Button>
        <Button
          variant={drawingMode === 'polygon' ? 'default' : 'outline'}
          size="sm"
          className="bg-white text-black hover:bg-blue-100 dark:bg-slate-800 dark:text-white hover:text-black shadow-md"
          onClick={() => enableDrawingMode('polygon')}
        >
          <Square className="w-4 h-4 mr-2" />
          Add Area
        </Button>
      </div>
      
      {/* Filter controls */}
      <div className="absolute top-4 right-4 z-10">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-black hover:bg-gray-100 dark:bg-slate-800 dark:text-white shadow-md"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filter Community Input</DialogTitle>
              <DialogDescription>
                Select filters to view specific community input
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={categoryFilter || ''}
                  onValueChange={(value) => setCategoryFilter(value || null)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {inputCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={statusFilter || ''}
                  onValueChange={(value) => setStatusFilter(value || null)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCategoryFilter(null);
                  setStatusFilter(null);
                }}
              >
                Reset Filters
              </Button>
              <Button type="submit">Apply Filters</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Admin Settings Button */}
      {isAdmin && (
        <div className="absolute top-4 right-20 z-10">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "bg-white text-black hover:bg-gray-100 dark:bg-slate-800 dark:text-white shadow-md",
              showAdminPanel && "bg-blue-100 border-blue-500"
            )}
            onClick={() => setShowAdminPanel(!showAdminPanel)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </div>
      )}
      
      {/* Admin Panel */}
      {isAdmin && showAdminPanel && (
        <div className="absolute top-16 right-4 z-20 w-96 bg-white dark:bg-slate-900 p-4 rounded-md shadow-lg border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-3">Admin Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-approve">Auto-Approve Submissions</Label>
              <Switch
                id="auto-approve"
                checked={autoApprove}
                onCheckedChange={setAutoApprove}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="llm-moderation">Use AI Classification</Label>
              <Switch
                id="llm-moderation"
                checked={useLlmModeration}
                onCheckedChange={setUseLlmModeration}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agency">Agency</Label>
              <Select
                value={currentAgency?.id || ''}
                onValueChange={(value) => {
                  const agency = agencies.find(a => a.id === value);
                  if (agency) setCurrentAgency(agency);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Pending Inputs</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {communityInputs.filter(input => input.status === 'pending').map(input => (
                  <div 
                    key={input.id} 
                    className="border border-gray-200 dark:border-slate-700 rounded-md p-2"
                  >
                    <h5 className="font-medium">{input.title}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {input.description.substring(0, 100)}
                      {input.description.length > 100 && '...'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {input.type}
                      </Badge>
                      <Badge 
                        style={{ 
                          backgroundColor: getCategoryColor(input.category),
                          color: 'white' 
                        }}
                      >
                        {input.category}
                      </Badge>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateInputStatus(input.id, 'rejected')}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => updateInputStatus(input.id, 'approved')}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
                {communityInputs.filter(input => input.status === 'pending').length === 0 && (
                  <p className="text-sm text-gray-500 italic">No pending inputs</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Input Form Dialog */}
      <Dialog open={showInputForm} onOpenChange={setShowInputForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Community Input</DialogTitle>
            <DialogDescription>
              Provide details about your community input
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={currentInput.title || ''}
                onChange={(e) => setCurrentInput({ ...currentInput, title: e.target.value })}
                placeholder="Brief title for your input"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentInput.description || ''}
                onChange={(e) => setCurrentInput({ ...currentInput, description: e.target.value })}
                placeholder="Detailed description of your input"
                rows={4}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={currentInput.category || 'general'}
                onValueChange={(value) => setCurrentInput({ ...currentInput, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(currentAgency?.categories || inputCategories).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="images">Images (Optional)</Label>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="image-upload"
                  className="flex items-center gap-2 border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <Upload size={16} />
                  <span>Upload</span>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                  />
                </Label>
                <span className="text-sm text-gray-500">
                  {uploadedFiles.length} file(s) selected
                </span>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="relative w-16 h-16 group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Uploaded ${idx}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(idx)}
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowInputForm(false);
                if (drawRef.current) {
                  drawRef.current.deleteAll();
                }
                setSelectedGeometry(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmitInput} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Submit Input'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrapper component with MapboxProvider
export function MapboxCommunityInputMap() {
  return (
    <MapboxProvider>
      <MapboxCommunityInputMapContent />
    </MapboxProvider>
  );
}

export default MapboxCommunityInputMap; 