"use client"

import React, { useState, useEffect, useRef } from "react";
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
  PlusIcon,
  MapPinIcon,
  SendIcon,
  FileIcon,
  CheckIcon,
  TextIcon,
  XIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Map as LeafletMap } from 'leaflet';
import { ErrorBoundary } from "react-error-boundary";
import LeafletErrorBoundary from "@/components/LeafletErrorBoundary";
import '@/lib/leaflet-preload'; // Preload Leaflet synchronously
import { useLeaflet } from "@/hooks/useLeaflet";
import CustomMarkerClusterGroup from '@/app/components/MarkerClusterGroup';

// Type for Leaflet
type L = typeof import('leaflet');

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

// Import EditControl with proper typing
const EditControl = dynamic(
  () => import('../project-mapping/components/EditControl').then((mod) => mod.EditControl),
  { ssr: false }
);

export function CommunityMapping() {
  const [mapType, setMapType] = useState("cartoPositron");
  const [feedbackType, setFeedbackType] = useState("issue");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Define mapCenter as a tuple to match the required type
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]);
  const [zoom, setZoom] = useState(10);
  const mapRef = useRef<LeafletMap | null>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [markerMode, setMarkerMode] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  
  // Use our custom hook for Leaflet initialization
  const { map, leafletLoaded, leafletInstance } = useLeaflet();

  // Type definition for selected location
  interface Location {
    lat: number;
    lng: number;
    address: string;
  }

  // Type definition for attachment
  interface Attachment {
    name: string;
    size: string;
    type: string;
  }

  // Mock data for transportation projects
  const projects = [
    {
      id: 1,
      name: "Highway 101 Expansion",
      lat: 37.7749,
      lng: -122.4194,
      type: "highway",
      feedbackCount: 24
    },
    {
      id: 2,
      name: "Downtown Transit Center",
      lat: 37.7869,
      lng: -122.4000,
      type: "transit",
      feedbackCount: 42
    },
    {
      id: 3,
      name: "Bike Lane Network",
      lat: 37.7699,
      lng: -122.4103,
      type: "bike",
      feedbackCount: 36
    }
  ];

  // Mock data for community feedback
  const communityFeedback = [
    {
      id: 1,
      title: "Need more crosswalks",
      description: "This intersection is dangerous for pedestrians.",
      lat: 37.7729,
      lng: -122.4224,
      type: "issue",
      date: "2023-03-01",
      author: "Sarah J."
    },
    {
      id: 2,
      title: "Love the new bike lanes",
      description: "The protected bike lanes make commuting much safer.",
      lat: 37.7699,
      lng: -122.4143,
      type: "support",
      date: "2023-03-05",
      author: "Mike T."
    },
    {
      id: 3,
      title: "Add more bus stops",
      description: "We need more frequent stops in residential areas.",
      lat: 37.7819,
      lng: -122.4100,
      type: "suggestion",
      date: "2023-03-10",
      author: "Alex P."
    }
  ];

  // Handlers for map interactions
  const handleSetMap = (map: LeafletMap) => {
    mapRef.current = map;
    
    // Set up event handlers on the map
    if (map) {
      map.on('click', (e: any) => {
        if (markerMode) {
          setSelectedLocation({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            address: "Selected location"
          });
          setShowFeedbackForm(true);
          setMarkerMode(false);
        }
      });
    }
  };

  // Map tiles definition
  const mapTiles = {
    cartoPositron: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
    },
    cartoDarkMatter: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
    },
    osm: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  };

  // Handler for map controls
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

  const toggleDrawingMode = () => {
    setDrawingMode(!drawingMode);
    setMarkerMode(false);
    setAnnotationMode(false);
  };

  const toggleAnnotationMode = () => {
    setAnnotationMode(!annotationMode);
    setDrawingMode(false);
    setMarkerMode(false);
  };

  const handleAddFeedback = () => {
    setMarkerMode(true);
    setDrawingMode(false);
    setAnnotationMode(false);
  };

  const handleDrawingCreated = (e: any) => {
    console.log("Drawing created:", e);
    // Here you would normally save the drawing to your state or backend
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: file.type.split('/')[0]
      }));
      
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reset form
    setShowFeedbackForm(false);
    setSelectedLocation(null);
    setFeedbackTitle("");
    setFeedbackDescription("");
    setAttachments([]);
    setIsSubmitting(false);
    
    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Color helpers
  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case "highway": return "bg-orange-600";
      case "transit": return "bg-blue-600";
      case "bike": return "bg-green-600";
      default: return "bg-gray-600";
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case "issue": return "bg-red-600";
      case "suggestion": return "bg-blue-600";
      case "support": return "bg-green-600";
      default: return "bg-gray-600";
    }
  };

  // Component for project markers
  const ProjectMarkers = () => {
    // Safety check to avoid rendering before dependencies are loaded
    if (!map || !leafletLoaded || !leafletInstance) return null;
    
    try {
      return (
        <FeatureGroup>
          {projects.map(project => (
            <Marker 
              key={project.id}
              position={[project.lat, project.lng] as [number, number]}
              icon={leafletInstance.divIcon({
                html: `<div class="project-marker ${project.type}"><i class="lucide-map-pin"></i></div>`,
                className: `project-icon-${project.type}`,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{project.name}</h3>
                  <div className="mt-1">
                    <Badge 
                      className={`${getProjectTypeColor(project.type)} text-white`}
                    >
                      {project.type}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Feedback count: {project.feedbackCount}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </FeatureGroup>
      );
    } catch (error) {
      console.error("Error rendering project markers:", error);
      return null;
    }
  };

  // Component for community feedback markers
  const FeedbackMarkers = () => {
    // Safety check to avoid rendering before dependencies are loaded
    if (!map || !leafletLoaded || !leafletInstance) return null;
    
    try {
      return (
        <FeatureGroup>
          {communityFeedback.map(feedback => (
            <Marker 
              key={feedback.id}
              position={[feedback.lat, feedback.lng] as [number, number]}
              icon={leafletInstance.divIcon({
                html: `<div class="feedback-marker ${feedback.type}"></div>`,
                className: `feedback-icon-${feedback.type}`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{feedback.title}</h3>
                  <div className="mt-1">
                    <Badge 
                      className={`${getFeedbackTypeColor(feedback.type)} text-white`}
                    >
                      {feedback.type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm">{feedback.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>By: {feedback.author} on {feedback.date}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </FeatureGroup>
      );
    } catch (error) {
      console.error("Error rendering feedback markers:", error);
      return null;
    }
  };

  // Update the SafeMapRenderer component to use the fallback component
  const SafeMapRenderer = () => {
    if (!map || !leafletLoaded || !leafletInstance || typeof window === 'undefined' || !window.L) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4 mx-auto"></div>
            <p>Loading map components...</p>
          </div>
        </div>
      );
    }

    return (
      <LeafletErrorBoundary>
        <MapContainer
          key="community-map-container"
          center={mapCenter}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          whenCreated={handleSetMap}
        >
          {/* Base tile layer - always render this first */}
          <TileLayer
            url={mapTiles[mapType as keyof typeof mapTiles].url}
            attribution={mapTiles[mapType as keyof typeof mapTiles].attribution}
          />
          
          {/* Conditional rendering of components that need Leaflet context */}
          <>
            {/* Transportation projects overlay */}
            <ProjectMarkers />
            
            {/* Community feedback overlay */}
            <FeedbackMarkers />
            
            {/* Only render EditControl when drawing mode is active */}
            {drawingMode && (
              <FeatureGroup>
                <EditControl
                  position="topleft"
                  onCreated={handleDrawingCreated}
                  draw={{
                    rectangle: true,
                    polyline: true,
                    polygon: true,
                    circle: true,
                    marker: false,
                    circlemarker: false
                  }}
                />
              </FeatureGroup>
            )}
            
            {/* If a location has been selected for feedback, show a temporary marker */}
            {selectedLocation && leafletInstance && (
              <Marker 
                position={[selectedLocation.lat, selectedLocation.lng] as [number, number]}
                icon={leafletInstance.divIcon({
                  html: `<div class="new-feedback-marker ${feedbackType}"></div>`,
                  className: `new-feedback-icon-${feedbackType}`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              />
            )}
          </>
        </MapContainer>
      </LeafletErrorBoundary>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card
        className="lg:col-span-3 h-[calc(100vh-240px)] min-h-[500px] relative"
      >
        <CardHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Community Feedback Map
            </CardTitle>
            <div className="flex space-x-2">
              <Select
                defaultValue="all"
                onValueChange={(value) => console.log(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter feedback" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Feedback
                  </SelectItem>
                  <SelectItem value="issue">
                    Issues
                  </SelectItem>
                  <SelectItem value="suggestion">
                    Suggestions
                  </SelectItem>
                  <SelectItem value="support">
                    Support
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="default"
                onClick={handleAddFeedback}
                disabled={showFeedbackForm || markerMode}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Feedback
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 relative h-full">
          {/* Using our SafeMapRenderer */}
          <SafeMapRenderer />

          {/* Map controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
            <Button variant="secondary" size="icon" onClick={handleZoomIn}>
              <ZoomInIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={handleZoomOut}>
              <ZoomOutIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={handleResetView}>
              <HomeIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant={drawingMode ? "default" : "secondary"}
              size="icon"
              onClick={toggleDrawingMode}
              title="Draw on map"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant={annotationMode ? "default" : "secondary"}
              size="icon"
              onClick={toggleAnnotationMode}
              title="Add text annotation"
            >
              <TextIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Success message */}
          {showSuccessMessage && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
              <div className="bg-green-500 text-white px-4 py-2 rounded shadow-lg flex items-center">
                <CheckIcon className="h-5 w-5 mr-2" />
                <span>Feedback submitted successfully!</span>
              </div>
            </div>
          )}

          {/* Feedback form */}
          {showFeedbackForm && selectedLocation && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
              <Card className="w-full max-w-lg">
                <CardHeader>
                  <CardTitle>Submit Feedback</CardTitle>
                  <CardDescription>
                    Share your thoughts about this location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Location
                    </label>
                    <div className="p-2 bg-gray-100 rounded text-sm">
                      {selectedLocation.address} ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Feedback Type
                    </label>
                    <Select
                      value={feedbackType}
                      onValueChange={setFeedbackType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issue">Issue/Concern</SelectItem>
                        <SelectItem value="suggestion">Suggestion</SelectItem>
                        <SelectItem value="support">Support/Praise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <Input
                      placeholder="Brief summary of your feedback"
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      placeholder="Provide details about your feedback"
                      className="min-h-[100px]"
                      value={feedbackDescription}
                      onChange={(e) => setFeedbackDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Attachments
                    </label>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto py-1"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <FileIcon className="h-4 w-4 mr-1" />
                        Add File
                      </Button>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        multiple
                      />
                      <span className="text-sm text-gray-500">
                        {attachments.length} file(s) attached
                      </span>
                    </div>
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-100 rounded text-sm"
                          >
                            <div className="flex items-center">
                              <FileIcon className="h-4 w-4 mr-2 text-gray-500" />
                              <span>{file.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">{file.size}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setAttachments(attachments.filter((_, i) => i !== index));
                                }}
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFeedbackForm(false);
                      setSelectedLocation(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackTitle || !feedbackDescription || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <SendIcon className="h-4 w-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Community Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {communityFeedback.slice(0, 3).map((feedback) => (
              <div
                key={feedback.id}
                className="p-3 border rounded-lg space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{feedback.title}</h4>
                    <p className="text-xs text-gray-500">
                      {feedback.author} - {feedback.date}
                    </p>
                  </div>
                  <Badge className={`${getFeedbackTypeColor(feedback.type)} text-white`}>
                    {feedback.type}
                  </Badge>
                </div>
                <p className="text-sm">{feedback.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}