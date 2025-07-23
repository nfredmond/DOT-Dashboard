'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Eye, 
  EyeOff,
  Settings,
  MessageSquare,
  Shield,
  Bell
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Category {
  id: string;
  key: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  is_active: boolean;
  display_order: number;
}

interface CommunitySettings {
  requires_approval: boolean;
  use_llm_moderation: boolean;
  llm_auto_approve_threshold: number;
  show_pending_to_public: boolean;
  allow_voting: boolean;
  allow_anonymous: boolean;
  notification_email?: string;
  custom_instructions?: string;
}

export default function CommunityInputSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const organizationId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<CommunitySettings>({
    requires_approval: true,
    use_llm_moderation: true,
    llm_auto_approve_threshold: 0.8,
    show_pending_to_public: false,
    allow_voting: true,
    allow_anonymous: false,
  });
  
  // New category form
  const [newCategory, setNewCategory] = useState({
    key: '',
    name: '',
    description: '',
    color: '#3b82f6',
  });
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('community_input_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('display_order');
      
      if (categoriesError) throw categoriesError;
      setCategories((categoriesData || []) as unknown as Category[]);
      
      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('organization_community_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }
      
      if (settingsData) {
        setSettings(settingsData as unknown as CommunitySettings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load community input settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleAddCategory = async () => {
    if (!newCategory.key || !newCategory.name) {
      toast({
        title: 'Error',
        description: 'Please provide both key and name for the category',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if key already exists
    if (categories.some(c => c.key === newCategory.key)) {
      toast({
        title: 'Error',
        description: 'A category with this key already exists',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('community_input_categories')
        .insert({
          organization_id: organizationId,
          key: newCategory.key.toLowerCase().replace(/\s+/g, '_'),
          name: newCategory.name,
          description: newCategory.description,
          color: newCategory.color,
          is_active: true,
          display_order: categories.length,
        })
        .select()
        .single();
      
            if (error) throw error;            if (data) {        setCategories([...categories, data as unknown as Category]);      }
      setNewCategory({
        key: '',
        name: '',
        description: '',
        color: '#3b82f6',
      });
      
      toast({
        title: 'Success',
        description: 'Category added successfully',
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: 'Failed to add category',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('community_input_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCategories(categories.filter(c => c.id !== id));
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };
  
  const handleToggleCategory = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('community_input_categories')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      
      setCategories(categories.map(c => 
        c.id === id ? { ...c, is_active: isActive } : c
      ));
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('organization_community_settings')
        .upsert({
          organization_id: organizationId,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id',
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 space-y-6 max-w-6xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Community Input Settings</h1>
          <p className="text-muted-foreground">
            Configure how community feedback is collected and moderated for your organization
          </p>
        </div>
        
        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList>
            <TabsTrigger value="categories">
              <MessageSquare className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="moderation">
              <Shield className="h-4 w-4 mr-2" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Input Categories</CardTitle>
                <CardDescription>
                  Define the categories users can choose when submitting feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-mono text-sm">{category.key}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full border"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs font-mono">{category.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? 'default' : 'secondary'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleToggleCategory(category.id, !category.is_active)}
                            >
                              {category.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-4">Add New Category</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="new-key">Key</Label>
                      <Input
                        id="new-key"
                        placeholder="safety"
                        value={newCategory.key}
                        onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-name">Name</Label>
                      <Input
                        id="new-name"
                        placeholder="Safety"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="new-description">Description</Label>
                      <Input
                        id="new-description"
                        placeholder="Safety concerns and hazards"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-color">Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          id="new-color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAddCategory} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="moderation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Settings</CardTitle>
                <CardDescription>
                  Configure how community inputs are reviewed and approved
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="requires-approval">Require Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        All submissions must be approved before being visible to the public
                      </p>
                    </div>
                    <Switch
                      id="requires-approval"
                      checked={settings.requires_approval}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, requires_approval: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="llm-moderation">AI Auto-Categorization</Label>
                      <p className="text-sm text-muted-foreground">
                        Use AI to automatically categorize and review submissions
                      </p>
                    </div>
                    <Switch
                      id="llm-moderation"
                      checked={settings.use_llm_moderation}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, use_llm_moderation: checked })
                      }
                    />
                  </div>
                  
                  {settings.use_llm_moderation && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="llm-threshold">Auto-Approval Confidence Threshold</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="llm-threshold"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.llm_auto_approve_threshold}
                          onChange={(e) => 
                            setSettings({ 
                              ...settings, 
                              llm_auto_approve_threshold: parseFloat(e.target.value) 
                            })
                          }
                          className="flex-1"
                        />
                        <span className="w-12 text-center">
                          {Math.round(settings.llm_auto_approve_threshold * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submissions with AI confidence above this threshold will be auto-approved
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-pending">Show Pending to Public</Label>
                      <p className="text-sm text-muted-foreground">
                        Display pending submissions to all users (marked as pending)
                      </p>
                    </div>
                    <Switch
                      id="show-pending"
                      checked={settings.show_pending_to_public}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, show_pending_to_public: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allow-voting">Allow Voting</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable upvoting and downvoting on community submissions
                      </p>
                    </div>
                    <Switch
                      id="allow-voting"
                      checked={settings.allow_voting}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, allow_voting: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allow-anonymous">Allow Anonymous Submissions</Label>
                      <p className="text-sm text-muted-foreground">
                        Let users submit feedback without logging in
                      </p>
                    </div>
                    <Switch
                      id="allow-anonymous"
                      checked={settings.allow_anonymous}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, allow_anonymous: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure email notifications for new submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={settings.notification_email || ''}
                    onChange={(e) => 
                      setSettings({ ...settings, notification_email: e.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address to receive notifications for new community submissions
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Additional configuration options for community input
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-instructions">Custom AI Instructions</Label>
                  <Textarea
                    id="custom-instructions"
                    placeholder="Enter custom instructions for AI categorization..."
                    value={settings.custom_instructions || ''}
                    onChange={(e) => 
                      setSettings({ ...settings, custom_instructions: e.target.value })
                    }
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide specific instructions for how the AI should categorize submissions
                    for your organization
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/organizations/${organizationId}/settings`)}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
} 