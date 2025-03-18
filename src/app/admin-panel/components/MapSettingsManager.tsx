"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Save,
  Map,
  Layers,
  Globe,
  Users,
  Settings,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvailableMapTypes, getDefaultMapType } from "@/lib/map-service";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { 
  getMapProviders, 
  getMaps, 
  MapProviderConfig, 
  MapDefinition, 
  UserOrAgency, 
  MapLayer, 
  saveMapProviders, 
  saveMaps,
  updateDefaultBaseMap
} from "@/lib/map-config-service";

// Types
interface MapProviderGroup {
  provider: string;
  maps: { value: string; label: string; }[];
}

export function MapSettingsManager() {
  // State for maps - load from service
  const [maps, setMaps] = useState<MapDefinition[]>(getMaps());

  // State for map providers - load from service
  const [mapProviders, setMapProviders] = useState<MapProviderConfig[]>(getMapProviders());

  // State for users and agencies (mock data)
  const [userAgencies] = useState<UserOrAgency[]>([
    { id: "all", name: "All Users", type: "user" },
    { id: "user1", name: "John Smith", type: "user" },
    { id: "user2", name: "Emily Johnson", type: "user" },
    { id: "agency1", name: "Caltrans District 4", type: "agency" },
    { id: "agency2", name: "Sacramento Area Council of Governments", type: "agency" },
    { id: "agency3", name: "California Department of Transportation", type: "agency" },
  ]);

  // Dialog states
  const [isNewMapDialogOpen, setIsNewMapDialogOpen] = useState(false);
  const [isNewLayerDialogOpen, setIsNewLayerDialogOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MapDefinition | null>(null);
  
  // Dialog states for providers
  const [isEditProviderDialogOpen, setIsEditProviderDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<MapProviderConfig | null>(null);
  
  // Form states
  const [newMapForm, setNewMapForm] = useState({
    name: "",
    description: "",
    baseMap: "cartoPositron",
    assignedTo: ["all"],
    baseMapProvider: "default",
  });
  
  const [newLayerForm, setNewLayerForm] = useState({
    name: "",
    description: "",
    type: "kmz" as 'kmz' | 'custom' | 'external',
    file: null as File | null,
    url: "",
  });

  // Get available base maps
  const availableMapTypes = getAvailableMapTypes();

  // Get base maps organized by provider
  const getBaseMapsGroupedByProvider = () => {
    const result: MapProviderGroup[] = [];
    
    // Add maps from enabled providers
    if (mapProviders.find(p => p.provider === 'mapbox' && p.isEnabled)) {
      result.push({ 
        provider: 'Mapbox',
        maps: [
          { value: 'mapboxStreets', label: 'Mapbox Streets' },
          { value: 'mapboxSatellite', label: 'Mapbox Satellite' },
          { value: 'mapboxLight', label: 'Mapbox Light' }
        ]
      });
    }
    
    if (mapProviders.find(p => p.provider === 'maptiler' && p.isEnabled)) {
      result.push({ 
        provider: 'MapTiler',
        maps: [
          { value: 'maptilerStreets', label: 'MapTiler Streets' },
          { value: 'maptilerSatellite', label: 'MapTiler Satellite' },
          { value: 'maptilerOutdoors', label: 'MapTiler Outdoors' }
        ]
      });
    }

    if (mapProviders.find(p => p.provider === 'carto' && p.isEnabled)) {
      result.push({ 
        provider: 'CARTO',
        maps: [
          { value: 'cartoPositron', label: 'CARTO Positron' },
          { value: 'cartoDarkMatter', label: 'CARTO Dark Matter' },
          { value: 'cartoVoyager', label: 'CARTO Voyager' }
        ]
      });
    }
    
    if (mapProviders.find(p => p.provider === 'osm' && p.isEnabled)) {
      result.push({ 
        provider: 'OpenStreetMap',
        maps: [
          { value: 'osm', label: 'OpenStreetMap' }
        ]
      });
    }
    
    // Add custom provider if enabled
    const customProvider = mapProviders.find(p => p.provider === 'custom' && p.isEnabled);
    if (customProvider) {
      result.push({ 
        provider: customProvider.name,
        maps: [
          { value: 'custom', label: customProvider.name }
        ]
      });
    }
    
    return result;
  };

  // Functions to manage providers
  const handleUpdateProvider = (updatedProvider: MapProviderConfig) => {
    let updatedProviders: MapProviderConfig[];
    
    // If this provider is being set as default, clear default flag on all others
    if (updatedProvider.isDefault) {
      updatedProviders = mapProviders.map(p => ({
        ...p,
        isDefault: p.id === updatedProvider.id
      }));
    } else {
      // Update just this provider
      updatedProviders = mapProviders.map(p => 
        p.id === updatedProvider.id ? updatedProvider : p
      );
    }
    
    setMapProviders(updatedProviders);
    saveMapProviders(updatedProviders); // Save to service
  };

  // Handler to save environment variables when API keys change
  const handleSaveApiKey = (providerId: string, apiKey: string) => {
    const updatedProviders = mapProviders.map(p => 
      p.id === providerId ? { ...p, apiKey } : p
    );
    
    setMapProviders(updatedProviders);
    saveMapProviders(updatedProviders); // Save to service
    
    // Mock saving to environment variables
    console.log(`Saved API key for provider ${providerId}`);
  };

  // Handler to create a new map
  const handleCreateMap = () => {
    const newMap: MapDefinition = {
      id: Date.now().toString(),
      name: newMapForm.name,
      description: newMapForm.description,
      baseMap: newMapForm.baseMap,
      baseMapProvider: newMapForm.baseMapProvider,
      isDefault: false,
      assignedTo: newMapForm.assignedTo.map(id => 
        userAgencies.find(ua => ua.id === id) || { id, name: id, type: 'user' as const }
      ),
      layers: []
    };
    
    const updatedMaps = [...maps, newMap];
    setMaps(updatedMaps);
    saveMaps(updatedMaps); // Save to service
    
    setNewMapForm({
      name: "",
      description: "",
      baseMap: "cartoPositron",
      baseMapProvider: "default",
      assignedTo: ["all"],
    });
    setIsNewMapDialogOpen(false);
  };

  // Handler to add a new layer to a map
  const handleAddLayer = () => {
    if (!selectedMap) return;
    
    const newLayer: MapLayer = {
      id: Date.now().toString(),
      name: newLayerForm.name,
      description: newLayerForm.description,
      type: newLayerForm.type,
      visible: true,
      url: newLayerForm.type === 'external' ? newLayerForm.url : undefined,
      fileInfo: newLayerForm.type === 'kmz' && newLayerForm.file ? {
        name: newLayerForm.file.name,
        size: newLayerForm.file.size,
        uploadDate: new Date().toISOString().split('T')[0]
      } : undefined
    };
    
    const updatedMaps = maps.map(map => 
      map.id === selectedMap.id 
        ? { ...map, layers: [...map.layers, newLayer] } 
        : map
    );
    
    setMaps(updatedMaps);
    saveMaps(updatedMaps); // Save to service
    
    setNewLayerForm({
      name: "",
      description: "",
      type: "kmz" as 'kmz' | 'custom' | 'external',
      file: null,
      url: "",
    });
    setIsNewLayerDialogOpen(false);
  };

  // Handler to remove a layer
  const handleRemoveLayer = (mapId: string, layerId: string) => {
    const updatedMaps = maps.map(map => 
      map.id === mapId 
        ? { ...map, layers: map.layers.filter(layer => layer.id !== layerId) } 
        : map
    );
    
    setMaps(updatedMaps);
    saveMaps(updatedMaps); // Save to service
  };

  // Handler to toggle layer visibility
  const handleToggleLayerVisibility = (mapId: string, layerId: string) => {
    const updatedMaps = maps.map(map => 
      map.id === mapId 
        ? { 
            ...map, 
            layers: map.layers.map(layer => 
              layer.id === layerId 
                ? { ...layer, visible: !layer.visible }
                : layer
            ) 
          } 
        : map
    );
    
    setMaps(updatedMaps);
    saveMaps(updatedMaps); // Save to service
  };

  // Handler to set a map as default
  const handleSetDefaultMap = (mapId: string) => {
    const updatedMaps = maps.map(map => ({
      ...map,
      isDefault: map.id === mapId
    }));
    
    setMaps(updatedMaps);
    saveMaps(updatedMaps); // Save to service
  };

  // Handler to remove a map
  const handleRemoveMap = (mapId: string) => {
    // Don't remove the default map
    if (maps.find(map => map.id === mapId)?.isDefault) {
      alert("Cannot remove the default map. Please set another map as default first.");
      return;
    }
    
    const updatedMaps = maps.filter(map => map.id !== mapId);
    setMaps(updatedMaps);
    saveMaps(updatedMaps); // Save to service
  };

  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Add a new state and handler for global base map settings
  const [globalBaseMapSettings, setGlobalBaseMapSettings] = useState({
    baseMap: getDefaultMapType(),
    updateAllMaps: false
  });

  // Handler to update global base map
  const handleUpdateGlobalBaseMap = () => {
    const updatedMaps = updateDefaultBaseMap(
      globalBaseMapSettings.baseMap, 
      globalBaseMapSettings.updateAllMaps
    );
    setMaps(updatedMaps);
  };

  return (
    <div className="space-y-6">
      {/* Map Provider Configuration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Map Provider Configuration</CardTitle>
            <CardDescription>
              Configure global map providers and API keys
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={provider.isEnabled}
                      onCheckedChange={(checked) => {
                        setMapProviders(mapProviders.map(p => 
                          p.id === provider.id ? { ...p, isEnabled: checked } : p
                        ));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {provider.provider !== 'osm' && provider.provider !== 'carto' ? (
                      <div className="flex items-center gap-2">
                        <Input 
                          type="password" 
                          value={provider.apiKey || ''} 
                          className="w-32 text-xs"
                          onChange={(e) => {
                            setMapProviders(mapProviders.map(p => 
                              p.id === provider.id ? { ...p, apiKey: e.target.value } : p
                            ));
                          }}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSaveApiKey(provider.id, provider.apiKey || '')}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not required</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <RadioGroup 
                      value={provider.isDefault ? provider.id : ''} 
                      onValueChange={(value) => {
                        if (value === provider.id) {
                          setMapProviders(mapProviders.map(p => ({
                            ...p,
                            isDefault: p.id === provider.id
                          })));
                        }
                      }}
                    >
                      <RadioGroupItem value={provider.id} id={`radio-${provider.id}`} />
                    </RadioGroup>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setIsEditProviderDialogOpen(true);
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Global Base Map Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Global Base Map Settings</CardTitle>
            <CardDescription>
              Set the default base map for all users
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="globalBaseMap">Default Base Map</Label>
              <Select
                value={globalBaseMapSettings.baseMap}
                onValueChange={(value) => setGlobalBaseMapSettings({
                  ...globalBaseMapSettings,
                  baseMap: value
                })}
              >
                <SelectTrigger id="globalBaseMap">
                  <SelectValue placeholder="Select a base map" />
                </SelectTrigger>
                <SelectContent>
                  {getBaseMapsGroupedByProvider().map((group) => (
                    <div key={group.provider}>
                      <div className="text-xs font-bold px-2 py-1.5 text-muted-foreground">
                        {group.provider}
                      </div>
                      {group.maps.map((map) => (
                        <SelectItem key={map.value} value={map.value}>
                          {map.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="updateAllMaps" 
                checked={globalBaseMapSettings.updateAllMaps}
                onCheckedChange={(checked) => 
                  setGlobalBaseMapSettings({
                    ...globalBaseMapSettings,
                    updateAllMaps: checked as boolean
                  })
                }
              />
              <Label htmlFor="updateAllMaps">
                Update all existing maps (not just the default map)
              </Label>
            </div>
            
            <Button 
              onClick={handleUpdateGlobalBaseMap}
              className="w-full md:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Apply Base Map Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Map Configurations</CardTitle>
            <CardDescription>
              Create and manage map configurations for different users and agencies
            </CardDescription>
          </div>
          <Dialog open={isNewMapDialogOpen} onOpenChange={setIsNewMapDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Create Map</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Map</DialogTitle>
                <DialogDescription>
                  Set up a new map configuration that can be assigned to specific users or agencies.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Map Name</Label>
                  <Input
                    id="name"
                    value={newMapForm.name}
                    onChange={(e) => setNewMapForm({ ...newMapForm, name: e.target.value })}
                    placeholder="Transportation Planning Map"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newMapForm.description}
                    onChange={(e) => setNewMapForm({ ...newMapForm, description: e.target.value })}
                    placeholder="Describe the purpose of this map"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="baseMapProvider">Base Map Provider</Label>
                  <Select
                    value={newMapForm.baseMapProvider || 'default'}
                    onValueChange={(value) => {
                      // When provider changes, set a default map for that provider
                      const _provider = mapProviders.find(p => p.provider === value);
                      let defaultMapForProvider = 'osm'; // fallback
                      
                      if (value === 'mapbox') defaultMapForProvider = 'mapboxStreets';
                      else if (value === 'maptiler') defaultMapForProvider = 'maptilerStreets';
                      else if (value === 'carto') defaultMapForProvider = 'cartoPositron';
                      else if (value === 'custom') defaultMapForProvider = 'custom';
                      
                      setNewMapForm({ 
                        ...newMapForm, 
                        baseMapProvider: value,
                        baseMap: defaultMapForProvider
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a map provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Provider</SelectItem>
                      {mapProviders.filter(p => p.isEnabled).map(provider => (
                        <SelectItem key={provider.id} value={provider.provider}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 mt-2">
                  <Label htmlFor="baseMap">Base Map Style</Label>
                  <Select
                    value={newMapForm.baseMap}
                    onValueChange={(value) => setNewMapForm({ ...newMapForm, baseMap: value })}
                  >
                    <SelectTrigger id="baseMap">
                      <SelectValue placeholder="Select a base map" />
                    </SelectTrigger>
                    <SelectContent>
                      {newMapForm.baseMapProvider === 'default' ? (
                        // Show all available maps
                        availableMapTypes.map((mapType) => (
                          <SelectItem key={mapType.value} value={mapType.value}>
                            {mapType.label}
                          </SelectItem>
                        ))
                      ) : (
                        // Show maps for selected provider
                        getBaseMapsGroupedByProvider()
                          .filter(group => 
                            group.provider === mapProviders.find(p => p.provider === newMapForm.baseMapProvider)?.name
                          )
                          .flatMap(group => group.maps)
                          .map(mapType => (
                            <SelectItem key={mapType.value} value={mapType.value}>
                              {mapType.label}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Assign To</Label>
                  <ScrollArea className="h-[200px] border rounded-md p-4">
                    {userAgencies.map((ua) => (
                      <div key={ua.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={`user-${ua.id}`}
                          checked={newMapForm.assignedTo.includes(ua.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewMapForm({
                                ...newMapForm,
                                assignedTo: [...newMapForm.assignedTo, ua.id]
                              });
                            } else {
                              setNewMapForm({
                                ...newMapForm,
                                assignedTo: newMapForm.assignedTo.filter(id => id !== ua.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`user-${ua.id}`} className="flex items-center gap-2">
                          {ua.type === 'agency' ? 
                            <Globe className="h-4 w-4" /> : 
                            <Users className="h-4 w-4" />
                          }
                          {ua.name}
                          <Badge variant="outline" className="ml-2">
                            {ua.type === 'agency' ? 'Agency' : 'User'}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewMapDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMap}>Create Map</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Map Name</TableHead>
                <TableHead>Base Map</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Layers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maps.map((map) => (
                <TableRow key={map.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{map.name}</span>
                      <span className="text-xs text-muted-foreground">{map.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {availableMapTypes.find(m => m.value === map.baseMap)?.label || map.baseMap}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {map.assignedTo.slice(0, 2).map((ua) => (
                        <Badge key={ua.id} variant="secondary" className="mr-1">
                          {ua.name}
                        </Badge>
                      ))}
                      {map.assignedTo.length > 2 && (
                        <Badge variant="secondary">+{map.assignedTo.length - 2} more</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{map.layers.length}</TableCell>
                  <TableCell>
                    {map.isDefault ? (
                      <Badge className="bg-green-500">Default</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedMap(map);
                          setIsNewLayerDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Add Layer</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSetDefaultMap(map.id)}
                        disabled={map.isDefault}
                      >
                        <Map className="h-4 w-4" />
                        <span className="sr-only">Set as Default</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleRemoveMap(map.id)}
                        disabled={map.isDefault}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Layers Management Section */}
      <Tabs defaultValue={maps[0]?.id}>
        <Card>
          <CardHeader>
            <CardTitle>Layer Management</CardTitle>
            <CardDescription>
              Manage map layers for each map configuration
            </CardDescription>
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {maps.map((map) => (
                <TabsTrigger key={map.id} value={map.id}>
                  {map.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </CardHeader>
          <CardContent>
            {maps.map((map) => (
              <TabsContent key={map.id} value={map.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Layers for {map.name}</h3>
                  <Button 
                    className="flex items-center gap-2"
                    onClick={() => {
                      setSelectedMap(map);
                      setIsNewLayerDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Layer</span>
                  </Button>
                </div>

                {map.layers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-md">
                    <Layers className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No layers added yet</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => {
                        setSelectedMap(map);
                        setIsNewLayerDialogOpen(true);
                      }}
                    >
                      Add your first layer
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visible</TableHead>
                        <TableHead>Layer Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {map.layers.map((layer) => (
                        <TableRow key={layer.id}>
                          <TableCell>
                            <Switch
                              checked={layer.visible}
                              onCheckedChange={() => handleToggleLayerVisibility(map.id, layer.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{layer.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {layer.description}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                layer.type === 'kmz' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                  : layer.type === 'external'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              }
                            >
                              {layer.type === 'kmz' ? 'KMZ File' : 
                               layer.type === 'external' ? 'External URL' : 
                               'Custom Layer'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {layer.type === 'kmz' && layer.fileInfo ? (
                              <div className="flex flex-col text-xs">
                                <span className="font-medium">{layer.fileInfo.name}</span>
                                <span>{formatFileSize(layer.fileInfo.size)}</span>
                                <span>Uploaded: {layer.fileInfo.uploadDate}</span>
                              </div>
                            ) : layer.type === 'external' && layer.url ? (
                              <div className="flex flex-col text-xs">
                                <span className="font-medium truncate max-w-[200px]">{layer.url}</span>
                              </div>
                            ) : (
                              <span className="text-xs">System defined layer</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleRemoveLayer(map.id, layer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </CardContent>
        </Card>
      </Tabs>

      {/* New Layer Dialog */}
      <Dialog open={isNewLayerDialogOpen} onOpenChange={setIsNewLayerDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Layer</DialogTitle>
            <DialogDescription>
              {selectedMap ? `Add a new layer to ${selectedMap.name}` : 'Add a new map layer'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="layerName">Layer Name</Label>
              <Input
                id="layerName"
                value={newLayerForm.name}
                onChange={(e) => setNewLayerForm({ ...newLayerForm, name: e.target.value })}
                placeholder="Highway Network"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="layerDescription">Description</Label>
              <Textarea
                id="layerDescription"
                value={newLayerForm.description}
                onChange={(e) => setNewLayerForm({ ...newLayerForm, description: e.target.value })}
                placeholder="Describe what this layer shows"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="layerType">Layer Type</Label>
              <Select
                value={newLayerForm.type}
                onValueChange={(value: 'kmz' | 'custom' | 'external') => setNewLayerForm({ ...newLayerForm, type: value })}
              >
                <SelectTrigger id="layerType">
                  <SelectValue placeholder="Select layer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kmz">KMZ File Upload</SelectItem>
                  <SelectItem value="external">External URL</SelectItem>
                  <SelectItem value="custom">Custom Layer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newLayerForm.type === 'kmz' && (
              <div className="grid gap-2">
                <Label htmlFor="kmzFile">KMZ File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="kmzFile"
                    type="file"
                    accept=".kmz,.kml"
                    className="flex-1"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewLayerForm({ ...newLayerForm, file: e.target.files[0] });
                      }
                    }}
                  />
                </div>
                {newLayerForm.file && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {newLayerForm.file.name} ({formatFileSize(newLayerForm.file.size)})
                  </p>
                )}
              </div>
            )}

            {newLayerForm.type === 'external' && (
              <div className="grid gap-2">
                <Label htmlFor="layerUrl">URL</Label>
                <Input
                  id="layerUrl"
                  value={newLayerForm.url}
                  onChange={(e) => setNewLayerForm({ ...newLayerForm, url: e.target.value })}
                  placeholder="https://example.com/geojson-data.json"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a URL to a GeoJSON, KML, or other supported geo data format
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewLayerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLayer}>Add Layer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map Provider Configuration Dialog */}
      <Dialog open={isEditProviderDialogOpen} onOpenChange={setIsEditProviderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Map Provider</DialogTitle>
            <DialogDescription>
              {selectedProvider ? `Configure settings for ${selectedProvider.name}` : 'Configure map provider settings'}
            </DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="providerName">Provider Name</Label>
                <Input
                  id="providerName"
                  value={selectedProvider.name}
                  onChange={(e) => setSelectedProvider({ ...selectedProvider, name: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="providerStatus">Status</Label>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="providerStatus"
                    checked={selectedProvider.isEnabled}
                    onCheckedChange={(checked) => {
                      setSelectedProvider({ ...selectedProvider, isEnabled: checked });
                    }}
                  />
                  <span>{selectedProvider.isEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              
              {selectedProvider.provider !== 'osm' && selectedProvider.provider !== 'carto' && (
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={selectedProvider.apiKey || ''}
                    onChange={(e) => setSelectedProvider({ ...selectedProvider, apiKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be saved as an environment variable
                  </p>
                </div>
              )}
              
              {selectedProvider.provider === 'custom' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="customUrl">Tile URL Template</Label>
                    <Input
                      id="customUrl"
                      value={selectedProvider.customUrl || ''}
                      onChange={(e) => setSelectedProvider({ ...selectedProvider, customUrl: e.target.value })}
                      placeholder="https://{s}.tile.example.com/{z}/{x}/{y}.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {`{z}`}, {`{x}`}, {`{y}`} for coordinates and {`{s}`} for subdomains
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="customAttribution">Attribution</Label>
                    <Input
                      id="customAttribution"
                      value={selectedProvider.customAttribution || ''}
                      onChange={(e) => setSelectedProvider({ ...selectedProvider, customAttribution: e.target.value })}
                      placeholder="© Map Provider"
                    />
                  </div>
                </>
              )}
              
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="isDefault"
                    checked={selectedProvider.isDefault}
                    onCheckedChange={(checked) => {
                      setSelectedProvider({ ...selectedProvider, isDefault: !!checked });
                    }}
                  />
                  <Label htmlFor="isDefault">Set as default provider</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProviderDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedProvider) {
                  handleUpdateProvider(selectedProvider);
                  setIsEditProviderDialogOpen(false);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 