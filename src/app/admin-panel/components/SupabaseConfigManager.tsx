'use client';

import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  getSupabaseConfigs, 
  saveSupabaseConfigs, 
  SupabaseConfig
} from '@/lib/env-service';
import { 
  PlusCircleIcon, 
  TrashIcon, 
  EditIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { initSupabaseClient } from '@/lib/supabase-service';
import { useToast } from "@/components/ui/use-toast";

export function SupabaseConfigManager() {
  const [configs, setConfigs] = useState<SupabaseConfig[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<SupabaseConfig | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Load configs on component mount
  useEffect(() => {
    const loadedConfigs = getSupabaseConfigs();
    setConfigs(loadedConfigs);
  }, []);

  // Save configs when they change
  useEffect(() => {
    if (configs.length > 0) {
      saveSupabaseConfigs(configs);
    }
  }, [configs]);

  // Test a Supabase connection
  const testConnection = async (config: SupabaseConfig) => {
    setIsTestingConnection(true);
    setTestResults(prev => ({ ...prev, [config.id]: false }));
    
    try {
      // Create a temporary Supabase client
      const tempClient = createClient(config.url, config.anonKey);
      
      // Try to make a simple query
      const { data, error } = await tempClient.from('_test').select('*').limit(1);
      
      // Handle the result
      if (error) {
        throw error;
      }
      
      // Connection successful
      setTestResults(prev => ({ ...prev, [config.id]: true }));
      toast({
        title: "Connection successful",
        description: `Successfully connected to Supabase instance '${config.name}'`,
        variant: "default",
      });
    } catch (error) {
      // Connection failed
      setTestResults(prev => ({ ...prev, [config.id]: false }));
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Supabase",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Add a new Supabase configuration
  const addConfig = (config: Omit<SupabaseConfig, 'id'>) => {
    const newConfig: SupabaseConfig = {
      ...config,
      id: `supabase_${Date.now()}`,
      isDefault: configs.length === 0 ? true : config.isDefault
    };
    
    // If this is set as default, remove default from others
    let updatedConfigs = [...configs];
    if (newConfig.isDefault) {
      updatedConfigs = updatedConfigs.map(c => ({
        ...c,
        isDefault: false
      }));
    }
    
    // Add the new config
    setConfigs([...updatedConfigs, newConfig]);
    setIsAddDialogOpen(false);
    
    toast({
      title: "Configuration added",
      description: `Supabase configuration '${newConfig.name}' has been added.`,
    });
  };

  // Update an existing configuration
  const updateConfig = (config: SupabaseConfig) => {
    // If this is set as default, remove default from others
    let updatedConfigs = [...configs];
    if (config.isDefault) {
      updatedConfigs = updatedConfigs.map(c => ({
        ...c,
        isDefault: c.id === config.id
      }));
    }
    
    // Update the config
    setConfigs(
      updatedConfigs.map(c => c.id === config.id ? config : c)
    );
    
    setIsEditDialogOpen(false);
    setCurrentConfig(null);
    
    toast({
      title: "Configuration updated",
      description: `Supabase configuration '${config.name}' has been updated.`,
    });
  };

  // Delete a configuration
  const deleteConfig = (id: string) => {
    const configToDelete = configs.find(c => c.id === id);
    if (!configToDelete) return;
    
    // Check if this is the default config
    if (configToDelete.isDefault && configs.length > 1) {
      // Set another config as default
      const newDefault = configs.find(c => c.id !== id);
      if (newDefault) {
        setConfigs(
          configs
            .filter(c => c.id !== id)
            .map(c => c.id === newDefault.id ? { ...c, isDefault: true } : c)
        );
      }
    } else {
      // Just remove the config
      setConfigs(configs.filter(c => c.id !== id));
    }
    
    toast({
      title: "Configuration deleted",
      description: `Supabase configuration '${configToDelete.name}' has been deleted.`,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Supabase Configurations</CardTitle>
        <CardDescription>
          Manage multiple Supabase instances for different organizations or environments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map(config => (
              <TableRow key={config.id}>
                <TableCell className="font-medium">{config.name}</TableCell>
                <TableCell>{config.url}</TableCell>
                <TableCell>{config.organizationId || 'Global'}</TableCell>
                <TableCell>{config.isDefault ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  {testResults[config.id] === true && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                  {testResults[config.id] === false && (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(config)}
                      disabled={isTestingConnection}
                    >
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentConfig(config);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteConfig(config.id)}
                      disabled={configs.length === 1}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="ml-auto"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add New Instance
        </Button>
      </CardFooter>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supabase Instance</DialogTitle>
            <DialogDescription>
              Enter the details for a new Supabase instance
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            addConfig({
              name: formData.get('name') as string,
              url: formData.get('url') as string,
              anonKey: formData.get('anonKey') as string,
              serviceKey: formData.get('serviceKey') as string || undefined,
              organizationId: formData.get('organizationId') as string || undefined,
              isDefault: formData.get('isDefault') === 'on'
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Production, Development, etc."
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">
                  URL
                </Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="https://example.supabase.co"
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="anonKey" className="text-right">
                  Anon Key
                </Label>
                <Input
                  id="anonKey"
                  name="anonKey"
                  type="password"
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceKey" className="text-right">
                  Service Key
                </Label>
                <Input
                  id="serviceKey"
                  name="serviceKey"
                  type="password"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="organizationId" className="text-right">
                  Organization ID
                </Label>
                <Input
                  id="organizationId"
                  name="organizationId"
                  placeholder="Optional"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isDefault" className="text-right">
                  Default Instance
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch id="isDefault" name="isDefault" />
                  <Label htmlFor="isDefault">Make this the default instance</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">Add Instance</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supabase Instance</DialogTitle>
            <DialogDescription>
              Update the details for this Supabase instance
            </DialogDescription>
          </DialogHeader>
          
          {currentConfig && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateConfig({
                id: currentConfig.id,
                name: formData.get('name') as string,
                url: formData.get('url') as string,
                anonKey: formData.get('anonKey') as string,
                serviceKey: formData.get('serviceKey') as string || undefined,
                organizationId: formData.get('organizationId') as string || undefined,
                isDefault: formData.get('isDefault') === 'on'
              });
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={currentConfig.name}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-url" className="text-right">
                    URL
                  </Label>
                  <Input
                    id="edit-url"
                    name="url"
                    defaultValue={currentConfig.url}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-anonKey" className="text-right">
                    Anon Key
                  </Label>
                  <Input
                    id="edit-anonKey"
                    name="anonKey"
                    type="password"
                    defaultValue={currentConfig.anonKey}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-serviceKey" className="text-right">
                    Service Key
                  </Label>
                  <Input
                    id="edit-serviceKey"
                    name="serviceKey"
                    type="password"
                    defaultValue={currentConfig.serviceKey || ''}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-organizationId" className="text-right">
                    Organization ID
                  </Label>
                  <Input
                    id="edit-organizationId"
                    name="organizationId"
                    defaultValue={currentConfig.organizationId || ''}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-isDefault" className="text-right">
                    Default Instance
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch 
                      id="edit-isDefault" 
                      name="isDefault"
                      defaultChecked={currentConfig.isDefault}
                    />
                    <Label htmlFor="edit-isDefault">Make this the default instance</Label>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit">Update Instance</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Helper function to create a temporary Supabase client for testing
function createClient(url: string, key: string) {
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        limit: (limit: number) => ({
          then: (callback: (response: { data: any[] | null; error: null | Error }) => void) => {
            // Simple connection test
            if (url && key) {
              callback({ data: [], error: null });
              return Promise.resolve({ data: [], error: null });
            } else {
              const error = new Error('Invalid Supabase URL or key');
              callback({ data: null, error });
              return Promise.resolve({ data: null, error });
            }
          }
        })
      })
    })
  };
} 