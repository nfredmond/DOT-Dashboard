"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, User, MapPin } from "lucide-react";
import { getMapProviders, getMaps, MapDefinition } from "@/lib/map-config-service";
import { MapboxStyleOption, getMapboxStyles } from "@/lib/map-service";

// Mock user data - in a real app, fetch from your user database
const MOCK_USERS = [
  { id: "user1", name: "John Smith", email: "john.smith@example.com" },
  { id: "user2", name: "Emily Johnson", email: "emily.johnson@example.com" },
  { id: "user3", name: "Michael Brown", email: "michael.brown@example.com" },
  { id: "user4", name: "Sarah Davis", email: "sarah.davis@example.com" },
  { id: "user5", name: "David Wilson", email: "david.wilson@example.com" },
];

// User map preference interface
interface UserMapPreference {
  userId: string;
  userName: string;
  defaultMapId: string;
  defaultCenter: [number, number];
  defaultZoom: number;
  enable3D: boolean;
  customMapStyle?: string;
  allowedLayers: string[];
}

export function UserMapPreferences() {
  // Get map providers and maps from the service
  const [mapProviders] = useState(getMapProviders());
  const [maps] = useState<MapDefinition[]>(getMaps());
  
  // State for user preferences
  const [userPreferences, setUserPreferences] = useState<UserMapPreference[]>([]);
  const [_selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const [formState, setFormState] = useState<UserMapPreference>({
    userId: "",
    userName: "",
    defaultMapId: "",
    defaultCenter: [-122.4194, 37.7749],
    defaultZoom: 12,
    enable3D: false,
    allowedLayers: [],
  });
  
  // Get available map styles based on providers
  const getAvailableMapStyles = (): MapboxStyleOption[] => {
    // Get API keys from enabled providers
    const apiKeys: Record<string, string> = {};
    mapProviders
      .filter(p => p.isEnabled)
      .forEach(p => {
        if (p.apiKey) apiKeys[p.provider] = p.apiKey;
      });
    
    return getMapboxStyles(apiKeys);
  };
  
  // Load mock user preferences
  useEffect(() => {
    // In a real app, fetch from your database
    const mockPreferences: UserMapPreference[] = [
      {
        userId: "user1",
        userName: "John Smith",
        defaultMapId: maps[0]?.id || "",
        defaultCenter: [-122.4194, 37.7749],
        defaultZoom: 12,
        enable3D: true,
        customMapStyle: "mapboxStreets",
        allowedLayers: ["highway_network", "transit_routes"],
      },
      {
        userId: "user2",
        userName: "Emily Johnson",
        defaultMapId: maps[1]?.id || "",
        defaultCenter: [-118.2437, 34.0522],
        defaultZoom: 10,
        enable3D: false,
        allowedLayers: ["bicycle_network"],
      },
    ];
    
    setUserPreferences(mockPreferences);
  }, [maps]);
  
  // Save user preference
  const saveUserPreference = (preference: UserMapPreference) => {
    // Check if this user already has preferences
    const existingIndex = userPreferences.findIndex(p => p.userId === preference.userId);
    
    if (existingIndex >= 0) {
      // Update existing preference
      const updatedPreferences = [...userPreferences];
      updatedPreferences[existingIndex] = preference;
      setUserPreferences(updatedPreferences);
    } else {
      // Add new preference
      setUserPreferences([...userPreferences, preference]);
    }
    
    // In a real app, save to database
    console.log("Saved user preference:", preference);
    
    // Close dialog if open
    setIsAddDialogOpen(false);
  };
  
  // Handle adding a new user preference
  const handleAddUserPreference = () => {
    if (!formState.userId) return;
    
    // Find user name from ID
    const user = MOCK_USERS.find(u => u.id === formState.userId);
    if (user) {
      const newPreference: UserMapPreference = {
        ...formState,
        userName: user.name,
      };
      
      saveUserPreference(newPreference);
      
      // Reset form
      setFormState({
        userId: "",
        userName: "",
        defaultMapId: "",
        defaultCenter: [-122.4194, 37.7749],
        defaultZoom: 12,
        enable3D: false,
        allowedLayers: [],
      });
    }
  };
  
  // Get user preference by ID
  const getUserPreference = (userId: string): UserMapPreference | undefined => {
    return userPreferences.find(p => p.userId === userId);
  };
  
  // Get map name by ID
  const getMapNameById = (mapId: string): string => {
    const map = maps.find(m => m.id === mapId);
    return map ? map.name : "Unknown Map";
  };
  
  // Get style name by ID
  const getStyleNameById = (styleId: string | undefined): string => {
    if (!styleId) return "Default";
    
    const style = getAvailableMapStyles().find(s => s.id === styleId);
    return style ? style.label : styleId;
  };
  
  const getStyleLabel = (styleId: string) => {
    const style = getAvailableMapStyles().find(s => s.id === styleId);
    return style ? style.label : styleId;
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>User Map Preferences</CardTitle>
          <CardDescription>
            Customize map settings for individual users
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add User Preference</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add User Map Preference</DialogTitle>
              <DialogDescription>
                Set custom map settings for a specific user
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">User</Label>
                <Select
                  value={formState.userId}
                  onValueChange={(value) => 
                    setFormState({ ...formState, userId: value })
                  }
                >
                  <SelectTrigger id="userId">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_USERS.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="defaultMapId">Default Map Configuration</Label>
                <Select
                  value={formState.defaultMapId}
                  onValueChange={(value) => 
                    setFormState({ ...formState, defaultMapId: value })
                  }
                >
                  <SelectTrigger id="defaultMapId">
                    <SelectValue placeholder="Select map configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    {maps.map(map => (
                      <SelectItem key={map.id} value={map.id}>
                        {map.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="customMapStyle">Custom Map Style</Label>
                <Select
                  value={formState.customMapStyle || ""}
                  onValueChange={(value) => 
                    setFormState({ ...formState, customMapStyle: value || undefined })
                  }
                >
                  <SelectTrigger id="customMapStyle">
                    <SelectValue placeholder="Use map configuration default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Use map configuration default</SelectItem>
                    {getAvailableMapStyles().map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="defaultZoom">Default Zoom</Label>
                  <Input
                    id="defaultZoom"
                    type="number"
                    min={0}
                    max={20}
                    value={formState.defaultZoom}
                    onChange={(e) => 
                      setFormState({ ...formState, defaultZoom: parseInt(e.target.value) || 12 })
                    }
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="enable3D">Enable 3D</Label>
                  <div className="flex items-center h-10">
                    <Switch
                      id="enable3D"
                      checked={formState.enable3D}
                      onCheckedChange={(checked) => 
                        setFormState({ ...formState, enable3D: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Default Center</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Longitude"
                    type="number"
                    step="0.0001"
                    value={formState.defaultCenter[0]}
                    onChange={(e) => 
                      setFormState({ 
                        ...formState, 
                        defaultCenter: [parseFloat(e.target.value) || 0, formState.defaultCenter[1]] 
                      })
                    }
                  />
                  <Input
                    placeholder="Latitude"
                    type="number"
                    step="0.0001"
                    value={formState.defaultCenter[1]}
                    onChange={(e) => 
                      setFormState({ 
                        ...formState, 
                        defaultCenter: [formState.defaultCenter[0], parseFloat(e.target.value) || 0] 
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUserPreference}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Map Configuration</TableHead>
              <TableHead>Map Style</TableHead>
              <TableHead>Default Center</TableHead>
              <TableHead>3D</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userPreferences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No user preferences found. Click "Add User Preference" to create one.
                </TableCell>
              </TableRow>
            ) : (
              userPreferences.map((preference) => (
                <TableRow key={preference.userId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {preference.userName}
                    </div>
                  </TableCell>
                  <TableCell>{getMapNameById(preference.defaultMapId)}</TableCell>
                  <TableCell>
                    {preference.customMapStyle ? (
                      <Badge variant="secondary">
                        {getStyleNameById(preference.customMapStyle)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Default</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">
                        {preference.defaultCenter[1].toFixed(4)}, {preference.defaultCenter[0].toFixed(4)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {preference.enable3D ? (
                      <Badge className="bg-green-500 hover:bg-green-600">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(preference.userId);
                          setFormState(preference);
                          setIsAddDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 