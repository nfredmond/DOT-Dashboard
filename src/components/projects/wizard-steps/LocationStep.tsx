"use client"

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Project } from '@/types/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Move, Search } from 'lucide-react';

interface LocationStepProps {
  projectData: Partial<Project>;
  onSave: (data: Partial<Project>) => void;
  errors: string[];
}

const LocationStep: React.FC<LocationStepProps> = ({ projectData, onSave, errors }) => {
  const [formData, setFormData] = useState({
    location: projectData.location || '',
    coordinates: projectData.coordinates || {
      latitude: 0,
      longitude: 0,
    },
    boundingBox: projectData.boundingBox || {
      northEast: { latitude: 0, longitude: 0 },
      southWest: { latitude: 0, longitude: 0 },
    },
    mapType: projectData.mapType || 'default',
  });
  
  useEffect(() => {
    // Save form data whenever it changes
    onSave(formData);
  }, [formData, onSave]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (name === 'latitude' || name === 'longitude') {
      setFormData(prev => ({
        ...prev,
        coordinates: {
          ...prev.coordinates,
          [name]: isNaN(numValue) ? 0 : numValue
        }
      }));
    }
  };
  
  const handleSearchLocation = () => {
    // In a real app, this would use a geocoding service
    // For now, we'll just set some mock coordinates
    setFormData(prev => ({
      ...prev,
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437
      }
    }));
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="location">Location Name/Description</Label>
        <div className="flex gap-2">
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Downtown Corridor, North County, etc."
            className={errors.includes('Location is required') ? 'border-destructive' : ''}
          />
          <Button type="button" variant="outline" onClick={handleSearchLocation}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="0.000001"
            value={formData.coordinates.latitude}
            onChange={handleCoordinateChange}
            placeholder="e.g., 34.0522"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="0.000001"
            value={formData.coordinates.longitude}
            onChange={handleCoordinateChange}
            placeholder="e.g., -118.2437"
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Interactive Map</CardTitle>
          <CardDescription>
            Click on the map to set location or adjust coordinates manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* In a real implementation, this would be replaced with a proper map component */}
          <div className="bg-muted border border-dashed border-muted-foreground/50 rounded-md h-64 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Map view would be displayed here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.coordinates.latitude}, {formData.coordinates.longitude}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center gap-2 mt-3">
            <Button type="button" variant="outline" size="sm">
              <Move className="h-4 w-4 mr-2" />
              Center Map
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <Label htmlFor="mapType">Map Type</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={formData.mapType === 'default' ? 'default' : 'outline'}
            className="justify-start"
            onClick={() => setFormData(prev => ({ ...prev, mapType: 'default' }))}
          >
            Standard
          </Button>
          <Button
            type="button"
            variant={formData.mapType === 'satellite' ? 'default' : 'outline'}
            className="justify-start"
            onClick={() => setFormData(prev => ({ ...prev, mapType: 'satellite' }))}
          >
            Satellite
          </Button>
          <Button
            type="button"
            variant={formData.mapType === 'terrain' ? 'default' : 'outline'}
            className="justify-start"
            onClick={() => setFormData(prev => ({ ...prev, mapType: 'terrain' }))}
          >
            Terrain
          </Button>
        </div>
      </div>
      
      <Alert className="bg-blue-500/10 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
        <AlertDescription>
          For more advanced mapping options, you can edit the project after creation in the dedicated mapping section.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default LocationStep; 