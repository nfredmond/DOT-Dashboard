'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  getMCPServers, 
  saveMCPServers, 
  MCPServerConfig,
  MCPCapability
} from '@/lib/env-service';
import { 
  BrainCircuitIcon, 
  PlusCircleIcon, 
  TrashIcon, 
  EditIcon,
  CheckCircleIcon,
  XCircleIcon,
  ServerIcon,
  PlugIcon
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export function MCPConfigManager() {
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentServer, setCurrentServer] = useState<MCPServerConfig | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const availableCapabilities: { value: MCPCapability; label: string }[] = [
    { value: 'file_search', label: 'File Search' },
    { value: 'web_search', label: 'Web Search' },
    { value: 'code_execution', label: 'Code Execution' },
    { value: 'image_generation', label: 'Image Generation' },
    { value: 'data_analysis', label: 'Data Analysis' },
    { value: 'gis_processing', label: 'GIS Processing' },
    { value: 'database_query', label: 'Database Query' },
    { value: 'custom_tool', label: 'Custom Tool' }
  ];

  // Load servers on component mount
  useEffect(() => {
    const loadedServers = getMCPServers();
    setServers(loadedServers);
  }, []);

  // Save servers when they change
  useEffect(() => {
    if (servers.length > 0) {
      saveMCPServers(servers);
    }
  }, [servers]);

  // Test an MCP server connection
  const testConnection = async (server: MCPServerConfig) => {
    setIsTestingConnection(true);
    setTestResults(prev => ({ ...prev, [server.id]: false }));
    
    try {
      // Create a simple request to test the connection
      const testUrl = server.url.endsWith('/') ? server.url : `${server.url}/`;
      
      // Different endpoint based on provider
      let endpoint = '';
      
      switch (server.provider) {
        case 'openai':
          endpoint = 'chat/completions';
          break;
        case 'anthropic':
          endpoint = 'messages';
          break;
        case 'meta':
          endpoint = 'completions';
          break;
        default:
          endpoint = 'health';
      }
      
      const response = await fetch(`${testUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${server.apiKey}`
        },
        body: JSON.stringify({
          // Simple request to test connection
          model: server.provider === 'openai' ? 'gpt-3.5-turbo' : 
                server.provider === 'anthropic' ? 'claude-3-haiku-20240307' : 
                'llama-3',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });
      
      // Check if we got a valid response
      if (response.ok) {
        setTestResults(prev => ({ ...prev, [server.id]: true }));
        toast({
          title: "Connection successful",
          description: `Successfully connected to MCP server '${server.name}'`,
        });
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResults(prev => ({ ...prev, [server.id]: false }));
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to MCP server",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Add a new MCP server
  const addServer = (newServer: Omit<MCPServerConfig, 'id'>) => {
    const serverId = `mcp_${Date.now()}`;
    
    const serverConfig: MCPServerConfig = {
      ...newServer,
      id: serverId,
      isActive: !!newServer.apiKey
    };
    
    setServers([...servers, serverConfig]);
    setIsAddDialogOpen(false);
    
    toast({
      title: "MCP Server Added",
      description: `MCP server '${serverConfig.name}' has been added.`,
    });
  };

  // Update an existing server
  const updateServer = (server: MCPServerConfig) => {
    setServers(
      servers.map(s => s.id === server.id ? server : s)
    );
    
    setIsEditDialogOpen(false);
    setCurrentServer(null);
    
    toast({
      title: "MCP Server Updated",
      description: `MCP server '${server.name}' has been updated.`,
    });
  };

  // Toggle server active state
  const toggleServerActive = (id: string, isActive: boolean) => {
    setServers(
      servers.map(server => 
        server.id === id ? { ...server, isActive } : server
      )
    );
  };

  // Delete a server
  const deleteServer = (id: string) => {
    const serverToDelete = servers.find(s => s.id === id);
    if (!serverToDelete) return;
    
    setServers(servers.filter(s => s.id !== id));
    
    toast({
      title: "MCP Server Deleted",
      description: `MCP server '${serverToDelete.name}' has been deleted.`,
    });
  };

  // Format capabilities for display
  const formatCapabilities = (capabilities: MCPCapability[]) => {
    if (capabilities.length === 0) return "None";
    
    return capabilities.map(cap => {
      const capInfo = availableCapabilities.find(c => c.value === cap);
      return capInfo ? capInfo.label : cap;
    }).join(", ");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BrainCircuitIcon className="h-6 w-6 mr-2" />
          Model Context Protocol Servers
        </CardTitle>
        <CardDescription>
          Configure MCP servers to enhance LLM capabilities with external tools and context
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Capabilities</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <ServerIcon className="h-8 w-8 mb-2" />
                    <p>No MCP servers configured</p>
                    <p className="text-sm">Add a server to enhance LLM capabilities</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              servers.map(server => (
                <TableRow key={server.id}>
                  <TableCell className="font-medium">{server.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {server.provider.charAt(0).toUpperCase() + server.provider.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={formatCapabilities(server.capabilities)}>
                      {formatCapabilities(server.capabilities)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={server.isActive} 
                      onCheckedChange={(checked) => toggleServerActive(server.id, checked)}
                      disabled={!server.apiKey}
                    />
                  </TableCell>
                  <TableCell>
                    {testResults[server.id] === true && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                    {testResults[server.id] === false && (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(server)}
                        disabled={isTestingConnection || !server.apiKey}
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentServer(server);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteServer(server.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="ml-auto"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add MCP Server
        </Button>
      </CardFooter>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Configure a new Model Context Protocol server for enhanced LLM functionality
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            
            // Get capabilities from checkboxes
            const capabilities = availableCapabilities
              .filter(cap => formData.get(`capability-${cap.value}`) === 'on')
              .map(cap => cap.value);
            
            addServer({
              name: formData.get('name') as string,
              url: formData.get('url') as string,
              apiKey: formData.get('apiKey') as string,
              provider: formData.get('provider') as 'openai' | 'anthropic' | 'meta' | 'custom',
              capabilities,
              isActive: false,
              timeout: parseInt(formData.get('timeout') as string) || undefined
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="OpenAI Function Calling, Anthropic Claude, etc."
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="provider">Provider</Label>
                <select 
                  id="provider" 
                  name="provider"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="meta">Meta AI</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="url">Server URL</Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="https://api.openai.com/v1/"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  placeholder="sk-..."
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  name="timeout"
                  type="number"
                  placeholder="30000"
                  defaultValue="30000"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Capabilities</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableCapabilities.map(capability => (
                    <div key={capability.value} className="flex items-center space-x-2">
                      <Checkbox id={`capability-${capability.value}`} name={`capability-${capability.value}`} />
                      <Label htmlFor={`capability-${capability.value}`}>{capability.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">Add Server</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit MCP Server</DialogTitle>
            <DialogDescription>
              Update the configuration for this MCP server
            </DialogDescription>
          </DialogHeader>
          
          {currentServer && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              // Get capabilities from checkboxes
              const capabilities = availableCapabilities
                .filter(cap => formData.get(`edit-capability-${cap.value}`) === 'on')
                .map(cap => cap.value);
              
              updateServer({
                id: currentServer.id,
                name: formData.get('edit-name') as string,
                url: formData.get('edit-url') as string,
                apiKey: formData.get('edit-apiKey') as string,
                provider: formData.get('edit-provider') as 'openai' | 'anthropic' | 'meta' | 'custom',
                capabilities,
                isActive: currentServer.isActive,
                timeout: parseInt(formData.get('edit-timeout') as string) || undefined
              });
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="edit-name"
                    defaultValue={currentServer.name}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-provider">Provider</Label>
                  <select 
                    id="edit-provider" 
                    name="edit-provider"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={currentServer.provider}
                    required
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="meta">Meta AI</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-url">Server URL</Label>
                  <Input
                    id="edit-url"
                    name="edit-url"
                    defaultValue={currentServer.url}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-apiKey">API Key</Label>
                  <Input
                    id="edit-apiKey"
                    name="edit-apiKey"
                    type="password"
                    defaultValue={currentServer.apiKey || ''}
                    placeholder="sk-..."
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-timeout">Timeout (ms)</Label>
                  <Input
                    id="edit-timeout"
                    name="edit-timeout"
                    type="number"
                    defaultValue={currentServer.timeout?.toString() || "30000"}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Capabilities</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableCapabilities.map(capability => (
                      <div key={capability.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`edit-capability-${capability.value}`} 
                          name={`edit-capability-${capability.value}`}
                          defaultChecked={currentServer.capabilities.includes(capability.value)}
                        />
                        <Label htmlFor={`edit-capability-${capability.value}`}>{capability.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit">Update Server</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 