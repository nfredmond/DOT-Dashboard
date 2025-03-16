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
import {
  getMCPServerForCapability,
  setPreferMCPOverAgentsSdk,
  preferMCPOverAgentsSdk,
  isAgentsSdkEnabled
} from "@/lib/mcp-agents-utils";

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

  // State for Agent integration settings
  const [preferMCP, setPreferMCP] = useState(preferMCPOverAgentsSdk);
  
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

  // Check if any capability is available across active servers
  const hasCapability = (capability: MCPCapability): boolean => {
    return servers.some(server => 
      server.isActive && server.capabilities.includes(capability)
    );
  };

  // Count active servers
  const activeServerCount = (): number => {
    return servers.filter(server => server.isActive).length;
  };

  // Check if there's any active server
  const hasAnyActiveServer = (): boolean => {
    return servers.some(server => server.isActive);
  };

  // Check if OpenAI API key is configured
  const hasOpenAIKey = (): boolean => {
    return !!servers.find(server => 
      server.provider === 'openai' && 
      server.isActive && 
      !!server.apiKey
    );
  };

  // Update the preference when changed
  const handlePreferMCPChange = (value: boolean) => {
    setPreferMCP(value);
    setPreferMCPOverAgentsSdk(value);
    
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferMCPOverAgentsSdk', value ? 'true' : 'false');
    }
  };

  // Helper functions for checking capabilities
  const checkCapability = (capability: string): boolean => {
    return getMCPServerForCapability(capability as any) !== null;
  };
  
  const getActiveServerCount = () => {
    return getMCPServers().filter(server => server.isActive).length;
  };
  
  const checkAnyActiveServer = () => {
    return getActiveServerCount() > 0;
  };
  
  const checkOpenAIKey = () => {
    return isAgentsSdkEnabled();
  };
  
  // Initialize preferences from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferMCPOverAgentsSdk');
      if (saved) {
        const value = saved === 'true';
        setPreferMCP(value);
        setPreferMCPOverAgentsSdk(value);
      }
    }
  }, []);

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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlugIcon className="h-5 w-5 text-blue-500" />
            Agent Integration
          </CardTitle>
          <CardDescription>
            Configure how MCP servers interact with agent functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="rounded-md border p-4">
              <h3 className="text-sm font-medium mb-2">Agent Capabilities</h3>
              <p className="text-sm text-muted-foreground mb-4">
                MCP servers can be used alongside or in place of the OpenAI Agents SDK for the following capabilities:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Analysis Agent</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Transportation planning analysis</p>
                  </div>
                  <Badge variant={checkCapability('data_analysis') ? 'outline' : 'secondary'} className="justify-self-end">
                    {checkCapability('data_analysis') ? 
                      <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1" /> : 
                      <XCircleIcon className="h-3 w-3 text-gray-400 mr-1" />}
                    {checkCapability('data_analysis') ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Computer Agent</span>
                    <p className="text-xs text-muted-foreground mt-0.5">File system operations</p>
                  </div>
                  <Badge variant={checkCapability('file_search') ? 'outline' : 'secondary'} className="justify-self-end">
                    {checkCapability('file_search') ? 
                      <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1" /> : 
                      <XCircleIcon className="h-3 w-3 text-gray-400 mr-1" />}
                    {checkCapability('file_search') ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Browser Agent</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Web search and browsing</p>
                  </div>
                  <Badge variant={checkCapability('web_search') ? 'outline' : 'secondary'} className="justify-self-end">
                    {checkCapability('web_search') ? 
                      <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1" /> : 
                      <XCircleIcon className="h-3 w-3 text-gray-400 mr-1" />}
                    {checkCapability('web_search') ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border p-4">
              <h3 className="text-sm font-medium mb-2">Agent Priority</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose whether to prefer MCP servers over OpenAI Agents SDK when both are available:
              </p>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mcp-priority">
                    Prefer MCP Servers
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, MCP servers will be used before OpenAI Agents SDK
                  </p>
                </div>
                <Switch 
                  id="mcp-priority" 
                  checked={preferMCP}
                  onCheckedChange={handlePreferMCPChange}
                  disabled={!checkAnyActiveServer() || !checkOpenAIKey()}
                />
              </div>
            </div>
            
            <div className="rounded-md border p-4 bg-muted/30">
              <h3 className="text-sm font-medium mb-2">Capabilities Status</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Current status of agent capabilities integration:
              </p>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm font-medium">MCP Enabled:</div>
                  <div className="flex items-center">
                    {preferMCP ? 
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" /> : 
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />}
                    {preferMCP ? 'Yes' : 'No'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm font-medium">Active MCP Servers:</div>
                  <div>{getActiveServerCount()}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm font-medium">OpenAI Agents SDK:</div>
                  <div className="flex items-center">
                    {checkOpenAIKey() ? 
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" /> : 
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />}
                    {checkOpenAIKey() ? 'Available' : 'Unavailable'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Card>
  );
} 