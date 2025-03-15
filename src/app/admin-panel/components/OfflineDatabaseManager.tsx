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
import { Slider } from '@/components/ui/slider';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  DatabaseIcon,
  RefreshCwIcon,
  XCircleIcon,
  CheckCircleIcon,
  TrashIcon,
  PlusCircleIcon
} from 'lucide-react';
import { 
  loadOfflineDatabaseConfig, 
  saveOfflineDatabaseConfig,
  OfflineDatabaseConfig,
  setEnvVariable
} from '@/lib/env-service';
import { syncOfflineData } from '@/lib/supabase-service';

export function OfflineDatabaseManager() {
  const [config, setConfig] = useState<OfflineDatabaseConfig | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncResults, setSyncResults] = useState<{ synced: number; errors: number } | null>(null);
  const [availableTables, setAvailableTables] = useState<string[]>([
    'projects',
    'users',
    'comments',
    'spatial_features',
    'settings',
    'organizations',
    'notifications'
  ]);
  const [newTable, setNewTable] = useState('');
  const [storageUsed, setStorageUsed] = useState<number | null>(null);

  // Load configuration
  useEffect(() => {
    const loadedConfig = loadOfflineDatabaseConfig();
    setConfig(loadedConfig);
  }, []);

  // Calculate storage used
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    async function calculateStorageUsage() {
      try {
        // Estimate localStorage usage
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            total += (key.length + (value?.length || 0)) * 2; // Approximate UTF-16 encoding
          }
        }
        
        // Convert bytes to MB
        setStorageUsed(total / (1024 * 1024));
      } catch (error) {
        console.error('Error calculating storage usage:', error);
      }
    }
    
    calculateStorageUsage();
  }, []);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config) return;
    
    // Update the configuration
    saveOfflineDatabaseConfig(config);
    
    // Update environment variables
    setEnvVariable('OFFLINE_DATABASE_ENABLED', config.enabled ? 'true' : 'false');
    setEnvVariable('OFFLINE_DATABASE_SYNC_ON_CONNECT', config.syncOnConnect ? 'true' : 'false');
  };

  // Toggle offline mode
  const toggleOfflineMode = (enabled: boolean) => {
    if (!config) return;
    
    setConfig({
      ...config,
      enabled
    });
  };

  // Toggle auto sync
  const toggleAutoSync = (syncOnConnect: boolean) => {
    if (!config) return;
    
    setConfig({
      ...config,
      syncOnConnect
    });
  };

  // Update max storage size
  const updateStorageSize = (maxStorageSize: number[]) => {
    if (!config) return;
    
    setConfig({
      ...config,
      maxStorageSize: maxStorageSize[0]
    });
  };

  // Update sync interval
  const updateSyncInterval = (syncInterval: number[]) => {
    if (!config) return;
    
    setConfig({
      ...config,
      syncInterval: syncInterval[0]
    });
  };

  // Add a new table
  const addTable = () => {
    if (!config || !newTable) return;
    
    // Check if table already exists
    if (config.tables.includes(newTable)) {
      return;
    }
    
    setConfig({
      ...config,
      tables: [...config.tables, newTable]
    });
    
    setNewTable('');
  };

  // Remove a table
  const removeTable = (table: string) => {
    if (!config) return;
    
    setConfig({
      ...config,
      tables: config.tables.filter(t => t !== table)
    });
  };

  // Manually trigger a sync
  const triggerSync = async () => {
    setSyncStatus('syncing');
    
    try {
      const result = await syncOfflineData();
      
      if (result.success) {
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
      
      setSyncResults({
        synced: result.synced,
        errors: result.errors
      });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } catch (error) {
      setSyncStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    }
  };

  if (!config) {
    return <div>Loading configuration...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DatabaseIcon className="h-6 w-6 mr-2" />
          Offline Database
        </CardTitle>
        <CardDescription>
          Configure offline database settings and synchronization options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Main Settings */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Enable Offline Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    When enabled, the application will store data locally and work without an internet connection
                  </p>
                </div>
                <Switch 
                  checked={config.enabled} 
                  onCheckedChange={toggleOfflineMode}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Auto-Sync on Reconnect</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically synchronize offline changes when internet connection is restored
                  </p>
                </div>
                <Switch 
                  checked={config.syncOnConnect} 
                  onCheckedChange={toggleAutoSync}
                  disabled={!config.enabled}
                />
              </div>
            </div>
            
            {/* Storage Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Storage Settings</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="storage-size">Maximum Storage Size: {config.maxStorageSize} MB</Label>
                  {storageUsed !== null && (
                    <Badge variant="outline" className={storageUsed > config.maxStorageSize * 0.8 ? "bg-amber-100 dark:bg-amber-900" : ""}>
                      {storageUsed.toFixed(2)} MB used
                    </Badge>
                  )}
                </div>
                <Slider 
                  id="storage-size"
                  value={[config.maxStorageSize]}
                  min={10}
                  max={200}
                  step={10}
                  onValueChange={updateStorageSize}
                  disabled={!config.enabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sync-interval">Sync Interval: {config.syncInterval} minutes</Label>
                <Slider 
                  id="sync-interval"
                  value={[config.syncInterval]}
                  min={5}
                  max={120}
                  step={5}
                  onValueChange={updateSyncInterval}
                  disabled={!config.enabled}
                />
              </div>
            </div>
            
            {/* Table Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tables to Sync</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select which database tables should be available offline
              </p>
              
              <div className="flex space-x-2">
                <Input 
                  placeholder="Table name" 
                  value={newTable}
                  onChange={(e) => setNewTable(e.target.value)}
                  disabled={!config.enabled}
                  list="available-tables"
                />
                <datalist id="available-tables">
                  {availableTables
                    .filter(table => !config.tables.includes(table))
                    .map(table => (
                      <option key={table} value={table} />
                    ))
                  }
                </datalist>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addTable}
                  disabled={!config.enabled || !newTable}
                >
                  <PlusCircleIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Name</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {config.tables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center">
                          No tables configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      config.tables.map(table => (
                        <TableRow key={table}>
                          <TableCell>{table}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTable(table)}
                              disabled={!config.enabled}
                            >
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Database Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Database Actions</h3>
              
              <div className="flex space-x-4">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex items-center"
                  onClick={triggerSync}
                  disabled={!config.enabled || syncStatus === 'syncing'}
                >
                  {syncStatus === 'syncing' ? (
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : syncStatus === 'success' ? (
                    <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                  ) : syncStatus === 'error' ? (
                    <XCircleIcon className="h-4 w-4 mr-2 text-red-500" />
                  ) : (
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                  )}
                  Sync Now
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!config.enabled}>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Clear Offline Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all offline data 
                        and cannot be recovered.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          // Clear IndexedDB databases
                          if (window.indexedDB) {
                            window.indexedDB.deleteDatabase('planning_manager_offline_db');
                          }
                          
                          // Reset storage usage
                          setStorageUsed(0);
                        }}
                      >
                        Clear Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              {syncResults && (
                <div className="text-sm">
                  Last sync: {syncResults.synced} record(s) synchronized, {syncResults.errors} error(s)
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <Button type="submit">Save Configuration</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 