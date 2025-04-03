"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Map, MessageSquare, Settings, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MapSettingsPage() {
  // Map configuration
  const [mapboxToken, setMapboxToken] = useState(process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "");
  const [defaultMapStyle, setDefaultMapStyle] = useState("streets-v12");
  const [initialCenter, setInitialCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [initialZoom, setInitialZoom] = useState(12);
  
  // Community input settings
  const [moderationEnabled, setModerationEnabled] = useState(true);
  const [aiModerationEnabled, setAiModerationEnabled] = useState(true);
  const [allowAnonymousSubmissions, setAllowAnonymousSubmissions] = useState(false);
  const [notifyOnNewSubmission, setNotifyOnNewSubmission] = useState(true);
  const [maxImagesPerSubmission, setMaxImagesPerSubmission] = useState(3);
  
  // Input categories
  const [categories, setCategories] = useState([
    { id: 'general', name: 'General', color: '#3b82f6' },
    { id: 'safety', name: 'Safety', color: '#ef4444' },
    { id: 'transportation', name: 'Active Transportation', color: '#22c55e' },
    { id: 'maintenance', name: 'Maintenance', color: '#f59e0b' },
    { id: 'traffic', name: 'Traffic', color: '#8b5cf6' },
  ]);
  
  // New category form
  const [newCategory, setNewCategory] = useState({ id: '', name: '', color: '#6366f1' });
  
  // Admin users with map moderation privileges
  const [moderators, setModerators] = useState([
    { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
    { id: '2', name: 'Moderator User', email: 'moderator@example.com', role: 'Moderator' },
  ]);
  
  // New moderator form
  const [newModerator, setNewModerator] = useState({ email: '', role: 'Moderator' });
  
  // Handle save settings
  const handleSaveSettings = () => {
    // In a real implementation, this would save to an API
    console.log('Saving map settings:', {
      mapboxToken,
      defaultMapStyle,
      initialCenter,
      initialZoom,
      moderationEnabled,
      aiModerationEnabled,
      allowAnonymousSubmissions,
      notifyOnNewSubmission,
      maxImagesPerSubmission,
      categories,
      moderators,
    });
    
    toast.success('Map settings saved successfully');
  };
  
  // Handle adding a new category
  const handleAddCategory = () => {
    if (!newCategory.id || !newCategory.name) {
      toast.error('Please provide both ID and name for the category');
      return;
    }
    
    // Check if ID already exists
    if (categories.some(c => c.id === newCategory.id)) {
      toast.error('A category with this ID already exists');
      return;
    }
    
    setCategories([...categories, newCategory]);
    setNewCategory({ id: '', name: '', color: '#6366f1' });
    toast.success('Category added successfully');
  };
  
  // Handle deleting a category
  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
    toast.success('Category deleted successfully');
  };
  
  // Handle adding a new moderator
  const handleAddModerator = () => {
    if (!newModerator.email) {
      toast.error('Please provide an email for the moderator');
      return;
    }
    
    // Check if email already exists
    if (moderators.some(m => m.email === newModerator.email)) {
      toast.error('A moderator with this email already exists');
      return;
    }
    
    const newId = (moderators.length + 1).toString();
    setModerators([...moderators, { 
      id: newId, 
      name: newModerator.email.split('@')[0], 
      email: newModerator.email, 
      role: newModerator.role 
    }]);
    
    setNewModerator({ email: '', role: 'Moderator' });
    toast.success('Moderator added successfully');
  };
  
  // Handle deleting a moderator
  const handleDeleteModerator = (id: string) => {
    setModerators(moderators.filter(m => m.id !== id));
    toast.success('Moderator removed successfully');
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Map Settings</h1>
        <p className="text-muted-foreground">
          Configure map settings, API keys, and community input options
        </p>
      </div>
      
      <Tabs defaultValue="mapbox">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mapbox">
            <Map className="h-4 w-4 mr-2" />
            Mapbox Settings
          </TabsTrigger>
          <TabsTrigger value="community">
            <MessageSquare className="h-4 w-4 mr-2" />
            Community Input
          </TabsTrigger>
          <TabsTrigger value="moderation">
            <Settings className="h-4 w-4 mr-2" />
            Moderation
          </TabsTrigger>
        </TabsList>
        
        {/* Mapbox Settings Tab */}
        <TabsContent value="mapbox" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapbox Configuration</CardTitle>
              <CardDescription>
                Configure your Mapbox API keys and default map settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mapbox-token">Mapbox Access Token</Label>
                <Input
                  id="mapbox-token"
                  type="text"
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  placeholder="pk.eyJ1Ijoi..."
                />
                <p className="text-xs text-muted-foreground">
                  Your public Mapbox token. Get one at{" "}
                  <a
                    href="https://account.mapbox.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    account.mapbox.com
                  </a>
                </p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default-style">Default Map Style</Label>
                    <Select
                      value={defaultMapStyle}
                      onValueChange={setDefaultMapStyle}
                    >
                      <SelectTrigger id="default-style">
                        <SelectValue placeholder="Select map style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="streets-v12">Streets</SelectItem>
                        <SelectItem value="outdoors-v12">Outdoors</SelectItem>
                        <SelectItem value="light-v11">Light</SelectItem>
                        <SelectItem value="dark-v11">Dark</SelectItem>
                        <SelectItem value="satellite-v9">Satellite</SelectItem>
                        <SelectItem value="satellite-streets-v12">Satellite Streets</SelectItem>
                        <SelectItem value="navigation-day-v1">Navigation Day</SelectItem>
                        <SelectItem value="navigation-night-v1">Navigation Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="initial-zoom">Default Zoom Level</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        id="initial-zoom"
                        min={1}
                        max={18}
                        step={1}
                        value={[initialZoom]}
                        onValueChange={(value) => setInitialZoom(value[0])}
                      />
                      <span className="w-12 text-center">{initialZoom}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="initial-lat">Default Latitude</Label>
                    <Input
                      id="initial-lat"
                      type="number"
                      value={initialCenter.lat}
                      onChange={(e) => setInitialCenter({ ...initialCenter, lat: parseFloat(e.target.value) })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="initial-lng">Default Longitude</Label>
                    <Input
                      id="initial-lng"
                      type="number"
                      value={initialCenter.lng}
                      onChange={(e) => setInitialCenter({ ...initialCenter, lng: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Community Input Tab */}
        <TabsContent value="community" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Input Settings</CardTitle>
              <CardDescription>
                Configure settings for community feedback and input
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">General Settings</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="moderation">Enable Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Require approval before inputs are visible
                      </p>
                    </div>
                    <Switch
                      id="moderation"
                      checked={moderationEnabled}
                      onCheckedChange={setModerationEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ai-moderation">AI Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Use AI to classify and categorize inputs
                      </p>
                    </div>
                    <Switch
                      id="ai-moderation"
                      checked={aiModerationEnabled}
                      onCheckedChange={setAiModerationEnabled}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="anonymous">Allow Anonymous Submissions</Label>
                      <p className="text-sm text-muted-foreground">
                        Let users submit feedback without logging in
                      </p>
                    </div>
                    <Switch
                      id="anonymous"
                      checked={allowAnonymousSubmissions}
                      onCheckedChange={setAllowAnonymousSubmissions}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Notify On New Submission</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications for new inputs
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notifyOnNewSubmission}
                      onCheckedChange={setNotifyOnNewSubmission}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-images">Maximum Images Per Submission</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      id="max-images"
                      min={0}
                      max={10}
                      step={1}
                      value={[maxImagesPerSubmission]}
                      onValueChange={(value) => setMaxImagesPerSubmission(value[0])}
                    />
                    <span className="w-12 text-center">{maxImagesPerSubmission}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set to 0 to disable image uploads
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {/* Categories */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Input Categories</h3>
                
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div 
                      key={category.id} 
                      className="flex items-center justify-between p-2 border rounded-md hover:bg-secondary/20"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                        <span className="text-xs text-muted-foreground">({category.id})</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 pt-2 border-t">
                  <div>
                    <Label htmlFor="new-category-id">ID</Label>
                    <Input
                      id="new-category-id"
                      value={newCategory.id}
                      onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value })}
                      placeholder="traffic"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-category-name">Name</Label>
                    <Input
                      id="new-category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Traffic Issues"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-category-color">Color</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        id="new-category-color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      className="w-full" 
                      onClick={handleAddCategory}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Settings</CardTitle>
              <CardDescription>
                Manage moderators and moderation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Moderators */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Map Moderators</h3>
                
                <div className="space-y-2">
                  {moderators.map((moderator) => (
                    <div 
                      key={moderator.id} 
                      className="flex items-center justify-between p-2 border rounded-md hover:bg-secondary/20"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{moderator.name}</span>
                          <Badge variant={moderator.role === 'Admin' ? 'default' : 'outline'}>
                            {moderator.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{moderator.email}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteModerator(moderator.id)}
                        disabled={moderator.role === 'Admin' && moderators.filter(m => m.role === 'Admin').length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2 border-t">
                  <div className="sm:col-span-2">
                    <Label htmlFor="new-moderator-email">Email</Label>
                    <Input
                      id="new-moderator-email"
                      type="email"
                      value={newModerator.email}
                      onChange={(e) => setNewModerator({ ...newModerator, email: e.target.value })}
                      placeholder="moderator@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-moderator-role">Role</Label>
                    <Select
                      value={newModerator.role}
                      onValueChange={(value) => setNewModerator({ ...newModerator, role: value })}
                    >
                      <SelectTrigger id="new-moderator-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={handleAddModerator}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Moderator
                </Button>
              </div>
              
              <Separator />
              
              {/* Moderation Rules */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Moderation Rules</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="keyword-filtering">Keyword Filtering</Label>
                      <Switch
                        id="keyword-filtering"
                        defaultChecked={true}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Filter submissions containing inappropriate language
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-approve-verified">Auto-approve Verified Users</Label>
                      <Switch
                        id="auto-approve-verified"
                        defaultChecked={true}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve submissions from verified users
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="image-moderation">Image Content Moderation</Label>
                      <Switch
                        id="image-moderation"
                        defaultChecked={true}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use AI to detect inappropriate image content
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="spam-detection">Spam Detection</Label>
                      <Switch
                        id="spam-detection"
                        defaultChecked={true}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Detect and filter out spam submissions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSaveSettings}>
          <Check className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
} 