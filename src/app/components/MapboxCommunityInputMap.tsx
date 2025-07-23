'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MapPin,
  Minus,
  Square,
  Upload,
  X,
  Settings,
  Filter,
  Send,
  Loader2,
  Eye,
  EyeOff,
  Check,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Search,
  Navigation,
  ZoomIn,
  ZoomOut,
  Layers,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/organization-context';
import { formatDistanceToNow } from 'date-fns';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/dialog';

// Type definitions
interface CommunityInput {
  id: string;
  type: 'point' | 'line' | 'polygon';
  geometry: any;
  title: string;
  description: string;
  category_key: string;
  category: {
    id: string;
    key: string;
    name: string;
    color: string;
    icon?: string;
  };
  username: string;
  user_email?: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  llm_category?: string;
  llm_confidence?: number;
  moderation_note?: string;
  agency_response?: string;
  upvotes: number;
  downvotes: number;
  view_count: number;
  images: CommunityInputImage[];
  created_at: string;
  updated_at: string;
}

interface CommunityInputImage {
  id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
}

interface InputCategory {
  id: string;
  key: string;
  name: string;
  color: string;
  icon?: string;
  is_active: boolean;
}

interface OrganizationSettings {
  requires_approval: boolean;
  use_llm_moderation: boolean;
  show_pending_to_public: boolean;
  allow_voting: boolean;
}

// The main MapboxCommunityInputMap component content
function MapboxCommunityInputMapContent() {
  const { map, mapInitialized } = useMapbox();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const supabase = createClient();
  const drawRef = useRef<MapboxDraw | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User state
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('viewer');
  
  // Map controls
  const [mapStyle, _setMapStyle] = useState('streets');
  const [_showLabels, _setShowLabels] = useState(true);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Drawing state
  const [drawingMode, setDrawingMode] = useState<'point' | 'line' | 'polygon' | null>(null);
  const [showInputForm, setShowInputForm] = useState(false);
  const [selectedGeometry, setSelectedGeometry] = useState<any>(null);
  
  // Form state
  const [inputTitle, setInputTitle] = useState('');
  const [inputDescription, setInputDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Admin state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [_selectedStatus, _setSelectedStatus] = useState<string | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [selectedInputForModeration, setSelectedInputForModeration] = useState<CommunityInput | null>(null);
  
  // Data state
  const [communityInputs, setCommunityInputs] = useState<CommunityInput[]>([]);
  const [categories, setCategories] = useState<InputCategory[]>([]);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    requires_approval: true,
    use_llm_moderation: true,
    show_pending_to_public: false,
    allow_voting: true
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Batch moderation state
  const [selectedBatchInputs, setSelectedBatchInputs] = useState<string[]>([]);
  
  // Initialize user and fetch data
  useEffect(() => {
    const initializeUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user && organization) {
        // Check user role
        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', organization.id)
          .eq('user_id', user.id)
          .single();
        
        if (membership) {          setUserRole(membership.role as string);        }
      }
    };
    
    initializeUser();
  }, [organization]);

  // Load organization settings and categories
  useEffect(() => {
    if (!organization) return;
    
    const loadOrganizationData = async () => {
      try {
        // Load categories
        const { data: categoriesData } = await supabase
          .from('community_input_categories')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('is_active', true)
          .order('display_order');
        
                if (categoriesData && categoriesData.length > 0) {          setCategories(categoriesData as unknown as InputCategory[]);          if (!selectedCategory && categoriesData[0]) {            setSelectedCategory((categoriesData[0] as unknown as InputCategory).key);          }        }
        
        // Load settings
        const { data: settingsData } = await supabase
          .from('organization_community_settings')
          .select('*')
          .eq('organization_id', organization.id)
          .single();
        
                if (settingsData) {          setOrgSettings(settingsData as unknown as OrganizationSettings);        }
      } catch (error) {
        console.error('Error loading organization data:', error);
      }
    };
    
    loadOrganizationData();
  }, [organization]);

  // Load community inputs
  const loadCommunityInputs = useCallback(async () => {
    if (!organization) return;
    
    setIsLoading(true);
    try {
      let statusToFilter = statusFilter === 'all' ? null : statusFilter;
      
      // For non-admin users, only show approved inputs unless settings allow pending
      if (userRole !== 'admin' && userRole !== 'editor') {
        if (!orgSettings.show_pending_to_public && statusToFilter !== 'approved') {
          statusToFilter = 'approved';
        }
      }
      
      const params = new URLSearchParams({
        organizationId: organization.id,
        ...(statusToFilter && { status: statusToFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter })
      });
      
      const response = await fetch(`/api/community-inputs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCommunityInputs(data.data || []);
      }
    } catch (error) {
      console.error('Error loading community inputs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load community feedback',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [organization, categoryFilter, statusFilter, userRole, orgSettings.show_pending_to_public, toast]);

  useEffect(() => {
    loadCommunityInputs();
  }, [loadCommunityInputs]);

  // Initialize Mapbox Draw
  useEffect(() => {
    if (!map || !mapInitialized || drawRef.current) return;
    
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      defaultMode: 'simple_select',
      styles: [
        // Custom styles for drawing
        {
          'id': 'gl-draw-point',
          'type': 'circle',
          'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
          'paint': {
            'circle-radius': 8,
            'circle-color': '#3b82f6',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2
          }
        },
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
        {
          'id': 'gl-draw-polygon-fill',
          'type': 'fill',
          'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'meta', 'feature']],
          'paint': {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.2
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
        }
      ]
    });
    
    map.addControl(draw, 'top-left');
    drawRef.current = draw;
    
    // Handle draw events
    map.on('draw.create', handleDrawCreate);
    map.on('draw.delete', handleDrawDelete);
    map.on('draw.update', handleDrawUpdate);
    
    return () => {
      map.off('draw.create', handleDrawCreate);
      map.off('draw.delete', handleDrawDelete);
      map.off('draw.update', handleDrawUpdate);
      if (drawRef.current) {
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [map, mapInitialized]);

  // Map event handlers
  const handleDrawCreate = useCallback((e: any) => {
    if (!e.features || e.features.length === 0) return;
    
    const feature = e.features[0];
    setSelectedGeometry(feature.geometry);
    setShowInputForm(true);
  }, []);

  const handleDrawUpdate = useCallback((e: any) => {
    if (!e.features || e.features.length === 0) return;
    
    const feature = e.features[0];
    setSelectedGeometry(feature.geometry);
  }, []);

  const handleDrawDelete = useCallback(() => {
    if (!showInputForm) {
      setSelectedGeometry(null);
    }
  }, [showInputForm]);

  // Drawing controls
  const enableDrawingMode = (mode: 'point' | 'line' | 'polygon') => {
    if (!drawRef.current) return;
    
    setDrawingMode(mode);
    
    if (mode === 'point') {
      drawRef.current.changeMode('draw_point');
    } else if (mode === 'line') {
      drawRef.current.changeMode('draw_line_string');
    } else if (mode === 'polygon') {
      drawRef.current.changeMode('draw_polygon');
    }
  };

  const cancelDrawing = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      drawRef.current.changeMode('simple_select');
    }
    setDrawingMode(null);
    setSelectedGeometry(null);
    setShowInputForm(false);
    resetForm();
  };

  // Form handlers
  const resetForm = () => {
    setInputTitle('');
    setInputDescription('');
    setSelectedCategory(categories[0]?.key || '');
    setUploadedFiles([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitInput = async () => {
    if (!selectedGeometry || !inputTitle || !inputDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all fields and draw a location on the map',
        variant: 'destructive'
      });
      return;
    }
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to submit feedback',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images first
      const imageUrls: string[] = [];
      for (const file of uploadedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('community-input-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('community-input-images')
          .getPublicUrl(fileName);
        
        imageUrls.push(publicUrl);
      }
      
      // Submit the input
      const response = await fetch('/api/community-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedGeometry.type === 'Point' ? 'point' :
                selectedGeometry.type === 'LineString' ? 'line' : 'polygon',
          geometry: selectedGeometry,
          title: inputTitle,
          description: inputDescription,
          category: selectedCategory,
          images: imageUrls
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: orgSettings.requires_approval && !data.data.status.includes('approved')
            ? 'Your feedback has been submitted and is awaiting approval'
            : 'Your feedback has been submitted successfully'
        });
        
        // Reload inputs
        await loadCommunityInputs();
        
        // Reset form
        cancelDrawing();
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting input:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModerateInput = async (input: CommunityInput, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/community-inputs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: input.id,
          status,
          moderationNote
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Feedback ${status === 'approved' ? 'approved' : 'rejected'} successfully`
        });
        
        // Reload inputs
        await loadCommunityInputs();
        
        // Reset moderation state
        setSelectedInputForModeration(null);
        setModerationNote('');
      } else {
        throw new Error(data.error || 'Failed to moderate feedback');
      }
    } catch (error) {
      console.error('Error moderating input:', error);
      toast({
        title: 'Error',
        description: 'Failed to moderate feedback',
        variant: 'destructive'
      });
    }
  };

  const _handleDeleteInput = async (inputId: string) => {
    try {
      const response = await fetch(`/api/community-inputs?id=${inputId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Feedback deleted successfully'
        });
        
        // Reload inputs
        await loadCommunityInputs();
      } else {
        throw new Error(data.error || 'Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting input:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete feedback',
        variant: 'destructive'
      });
    }
  };

  const handleGeolocate = () => {
    if (!map || !navigator.geolocation) {
      toast({
        title: 'Location Unavailable',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive'
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 15,
          duration: 2000
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Location Error',
          description: 'Unable to get your location. Please check browser permissions.',
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const handleZoomIn = () => {
    if (!map) return;
    map.zoomIn();
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.zoomOut();
  };

  const handleLocationSearch = async () => {
    if (!map || !locationSearchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationSearchQuery)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        map.flyTo({
          center: [lng, lat],
          zoom: 14,
          duration: 2000
        });
        
        setLocationSearchQuery('');
        toast({
          title: 'Location Found',
          description: `Navigated to ${feature.place_name}`,
        });
      } else {
        toast({
          title: 'Location Not Found',
          description: 'Unable to find the specified location',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search for location',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Filter inputs for display
  const filteredInputs = communityInputs.filter(input => {
    // Status filter
    if (statusFilter !== 'all' && input.status !== statusFilter) return false;
    
    // Category filter
    if (categoryFilter !== 'all' && input.category_key !== categoryFilter) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        input.title.toLowerCase().includes(query) ||
        input.description.toLowerCase().includes(query) ||
        input.username.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Prepare GeoJSON for map display
  const inputsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: filteredInputs.map(input => ({
      type: 'Feature' as const,
      id: input.id,
      properties: {
        ...input,
        color: input.category?.color || '#3b82f6'
      },
      geometry: input.geometry
    }))
  };

  // Batch moderation
  const handleBatchModeration = async (status: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/community-inputs/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedBatchInputs,
          status
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Selected feedback ${status === 'approved' ? 'approved' : 'rejected'} successfully`
        });
        
        // Reload inputs
        await loadCommunityInputs();
        
        // Reset batch state
        setSelectedBatchInputs([]);
      } else {
        throw new Error(data.error || 'Failed to batch moderate feedback');
      }
    } catch (error) {
      console.error('Error batch moderating inputs:', error);
      toast({
        title: 'Error',
        description: 'Failed to batch moderate feedback',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="relative h-full w-full">
      <MapboxMap        initialViewState={{          longitude: -122.4194,          latitude: 37.7749,          zoom: 11        }}        mapStyle={`mapbox://styles/mapbox/${mapStyle}-v12`}        className="h-full w-full"      >
        {/* Community inputs layer */}
        <MapboxSource
          id="community-inputs"
          source={{
            type: 'geojson',
            data: inputsGeoJSON
          }}
        >
          {/* Points */}
          <MapboxLayer
            id="community-input-points"
            type="circle"
            filter={['==', ['geometry-type'], 'Point']}
            paint={{
              'circle-radius': 8,
              'circle-color': ['get', 'color'],
              'circle-stroke-color': '#fff',
              'circle-stroke-width': 2
            }}
          />
          
          {/* Lines */}
          <MapboxLayer
            id="community-input-lines"
            type="line"
            filter={['==', ['geometry-type'], 'LineString']}
            paint={{
              'line-color': ['get', 'color'],
              'line-width': 3
            }}
          />
          
          {/* Polygons */}
          <MapboxLayer
            id="community-input-polygons"
            type="fill"
            filter={['==', ['geometry-type'], 'Polygon']}
            paint={{
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.3
            }}
          />
          
          <MapboxLayer
            id="community-input-polygon-outlines"
            type="line"
            filter={['==', ['geometry-type'], 'Polygon']}
            paint={{
              'line-color': ['get', 'color'],
              'line-width': 2
            }}
          />
        </MapboxSource>
      </MapboxMap>

      {/* Location Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-96 max-w-[calc(100%-8rem)] z-10">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for a location..."
            value={locationSearchQuery}
            onChange={(e) => setLocationSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
            className="pr-10 bg-white shadow-md"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleLocationSearch}
            disabled={isSearching}
            className="absolute right-0 top-0 h-full"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleGeolocate}
          className="bg-white shadow-md hover:bg-gray-100"
          title="Go to my location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomIn}
          className="bg-white shadow-md hover:bg-gray-100"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomOut}
          className="bg-white shadow-md hover:bg-gray-100"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Drawing Controls */}
      {user && (
        <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-2 z-10">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-700 px-2">Add Feedback:</p>
            <Button
              size="sm"
              variant={drawingMode === 'point' ? 'default' : 'outline'}
              onClick={() => enableDrawingMode('point')}
              disabled={!!drawingMode && drawingMode !== 'point'}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Point
            </Button>
            <Button
              size="sm"
              variant={drawingMode === 'line' ? 'default' : 'outline'}
              onClick={() => enableDrawingMode('line')}
              disabled={!!drawingMode && drawingMode !== 'line'}
            >
              <Minus className="h-4 w-4 mr-2" />
              Line
            </Button>
            <Button
              size="sm"
              variant={drawingMode === 'polygon' ? 'default' : 'outline'}
              onClick={() => enableDrawingMode('polygon')}
              disabled={!!drawingMode && drawingMode !== 'polygon'}
            >
              <Square className="h-4 w-4 mr-2" />
              Area
            </Button>
            {drawingMode && (
              <Button
                size="sm"
                variant="destructive"
                onClick={cancelDrawing}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filters</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category-filter" className="text-sm">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category-filter" className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.key} value={cat.key}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(userRole === 'admin' || userRole === 'editor' || orgSettings.show_pending_to_public) && (
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feedback..."
                className="pl-8 h-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Input List */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg w-96 max-h-[400px] z-10">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Community Feedback</h3>
            <Badge variant="secondary">{filteredInputs.length}</Badge>
          </div>
        </div>
        
        <ScrollArea className="h-[340px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredInputs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No feedback found
            </div>
          ) : (
            <div className="divide-y">
              {filteredInputs.map(input => (
                <div
                  key={input.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (map && input.geometry) {
                      const bounds = getBounds(input.geometry);
                      if (bounds) {
                        map.fitBounds(bounds, { padding: 50 });
                      }
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: input.category?.color || '#3b82f6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{input.title}</h4>
                        {input.status === 'pending' && (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {input.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {input.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(input.created_at), { addSuffix: true })}
                        </span>
                        {orgSettings.allow_voting && (
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            <span className="text-xs">{input.upvotes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {(userRole === 'admin' || userRole === 'editor') && input.status === 'pending' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInputForModeration(input);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Admin Panel Toggle */}
      {(userRole === 'admin' || userRole === 'editor') && (
        <div className="absolute top-20 right-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAdminPanel(!showAdminPanel)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Admin Settings
          </Button>
        </div>
      )}

      {/* Input Form Dialog */}
      <Dialog open={showInputForm} onOpenChange={setShowInputForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Community Feedback</DialogTitle>
            <DialogDescription>
              Share your thoughts about this location
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-title">Title</Label>
              <Input
                id="input-title"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="Brief description of your feedback"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="input-category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="input-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.key} value={cat.key}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="input-description">Description</Label>
              <Textarea
                id="input-description"
                value={inputDescription}
                onChange={(e) => setInputDescription(e.target.value)}
                placeholder="Provide more details about your feedback"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Photos (optional)</Label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadedFiles.length >= 5}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos ({uploadedFiles.length}/5)
                </Button>
                
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDrawing}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitInput}
              disabled={isSubmitting || !inputTitle || !inputDescription}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderation Dialog */}
      <AlertDialog 
        open={!!selectedInputForModeration} 
        onOpenChange={() => setSelectedInputForModeration(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Moderate Community Input</AlertDialogTitle>
            <AlertDialogDescription>
              Review and approve or reject this community feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedInputForModeration && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedInputForModeration.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedInputForModeration.description}
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <span>{selectedInputForModeration.username}</span>
                <Badge variant="outline">
                  {selectedInputForModeration.category?.name}
                </Badge>
                {selectedInputForModeration.llm_category && (
                  <Badge variant="secondary">
                    AI: {selectedInputForModeration.llm_category} 
                    ({Math.round((selectedInputForModeration.llm_confidence || 0) * 100)}%)
                  </Badge>
                )}
              </div>
              
              {selectedInputForModeration.images.length > 0 && (
                <div className="flex gap-2">
                  {selectedInputForModeration.images.map((img, index) => (
                    <img
                      key={img.id}
                      src={img.thumbnail_url || img.url}
                      alt={`Image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ))}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="moderation-note">Moderation Note (optional)</Label>
                <Textarea
                  id="moderation-note"
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="Add a note about this decision..."
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedInputForModeration) {
                  handleModerateInput(selectedInputForModeration, 'rejected');
                }
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <AlertDialogAction onClick={() => {
              if (selectedInputForModeration) {
                handleModerateInput(selectedInputForModeration, 'approved');
              }
            }}>
              <Check className="h-4 w-4 mr-2" />
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Settings Panel */}
      {showAdminPanel && (userRole === 'admin' || userRole === 'editor') && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-4 w-96 max-h-[500px] overflow-y-auto z-20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Admin Settings</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowAdminPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Tabs defaultValue="moderation">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="moderation" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Pending Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {communityInputs.filter(i => i.status === 'pending').length}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Batch Actions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Batch Actions</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBatchModeration('approved')}
                        disabled={selectedBatchInputs.length === 0}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Approve Selected ({selectedBatchInputs.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBatchModeration('rejected')}
                        disabled={selectedBatchInputs.length === 0}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject Selected ({selectedBatchInputs.length})
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Submissions</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {communityInputs
                      .filter(i => i.status === 'pending')
                      .slice(0, 10)
                      .map(input => (
                        <div
                          key={input.id}
                          className="p-2 border rounded-md hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selectedBatchInputs.includes(input.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBatchInputs([...selectedBatchInputs, input.id]);
                                } else {
                                  setSelectedBatchInputs(selectedBatchInputs.filter(id => id !== input.id));
                                }
                              }}
                            />
                            <div className="flex-1 cursor-pointer" onClick={() => setSelectedInputForModeration(input)}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium truncate">
                                  {input.title}
                                </span>
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {input.username} • {formatDistanceToNow(new Date(input.created_at), { addSuffix: true })}
                              </div>
                              {input.llm_category && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  AI: {input.llm_category} ({Math.round((input.llm_confidence || 0) * 100)}%)
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requires-approval">Require Approval</Label>
                      <p className="text-xs text-muted-foreground">
                        Review submissions before they appear
                      </p>
                    </div>
                    <Switch
                      id="requires-approval"
                      checked={orgSettings.requires_approval}
                      disabled
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="llm-moderation">AI Auto-Categorization</Label>
                      <p className="text-xs text-muted-foreground">
                        Use AI to categorize submissions
                      </p>
                    </div>
                    <Switch
                      id="llm-moderation"
                      checked={orgSettings.use_llm_moderation}
                      disabled
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-pending">Show Pending to Public</Label>
                      <p className="text-xs text-muted-foreground">
                        Display pending submissions to everyone
                      </p>
                    </div>
                    <Switch
                      id="show-pending"
                      checked={orgSettings.show_pending_to_public}
                      disabled
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-voting">Allow Voting</Label>
                      <p className="text-xs text-muted-foreground">
                        Let users vote on submissions
                      </p>
                    </div>
                    <Switch
                      id="allow-voting"
                      checked={orgSettings.allow_voting}
                      disabled
                    />
                  </div>
                </div>
                
                <div className="pt-2 text-xs text-muted-foreground">
                  Contact your administrator to change these settings
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to get bounds from geometry
function getBounds(geometry: any): [[number, number], [number, number]] | null {
  if (!geometry) return null;
  
  if (geometry.type === 'Point') {
    const [lng, lat] = geometry.coordinates;
    return [[lng - 0.01, lat - 0.01], [lng + 0.01, lat + 0.01]];
  } else if (geometry.type === 'LineString') {
    const lngs = geometry.coordinates.map((c: number[]) => c[0]);
    const lats = geometry.coordinates.map((c: number[]) => c[1]);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ];
  } else if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates[0];
    const lngs = coords.map((c: number[]) => c[0]);
    const lats = coords.map((c: number[]) => c[1]);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ];
  }
  
  return null;
}

// Export the component wrapped in MapboxProvider
export default function MapboxCommunityInputMap() {
  return (
    <MapboxProvider>
      <MapboxCommunityInputMapContent />
    </MapboxProvider>
  );
} 