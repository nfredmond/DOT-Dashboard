"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

interface MCPServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: MCPServerConfig) => void
}

interface MCPServerConfig {
  name: string
  provider: string
  transportType: string
  serverUrl: string
  apiKey: string
  timeout: number
  protocolVersion: string
  capabilities: {
    fileSearch: boolean
    webSearch: boolean
    codeExecution: boolean
    imageGeneration: boolean
    dataAnalysis: boolean
    gisProcessing: boolean
    databaseQuery: boolean
    customTool: boolean
    resources: boolean
    progress: boolean
  }
  authentication: {
    type: string
    validateConnection: boolean
  }
  errorHandling: {
    logLevel: string
    retryAttempts: number
  }
}

export function MCPServerDialog({ open, onOpenChange, onSubmit }: MCPServerDialogProps) {
  const [config, setConfig] = useState<MCPServerConfig>({
    name: "",
    provider: "OpenAI",
    transportType: "http-sse",
    serverUrl: "",
    apiKey: "",
    timeout: 30000,
    protocolVersion: "1.0",
    capabilities: {
      fileSearch: false,
      webSearch: false,
      codeExecution: false,
      imageGeneration: false,
      dataAnalysis: false,
      gisProcessing: false,
      databaseQuery: false,
      customTool: false,
      resources: true,
      progress: true
    },
    authentication: {
      type: "api-key",
      validateConnection: true
    },
    errorHandling: {
      logLevel: "error",
      retryAttempts: 3
    }
  })

  const handleCapabilityChange = (capability: keyof MCPServerConfig["capabilities"], checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: checked
      }
    }))
  }

  const handleSubmit = () => {
    onSubmit(config)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add MCP Server</DialogTitle>
          <DialogDescription>
            Configure a new Model Context Protocol server for enhanced LLM functionality
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-name">Name</Label>
              <Input 
                id="server-name" 
                placeholder="My MCP Server"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select 
                value={config.provider} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, provider: value }))}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OpenAI">OpenAI</SelectItem>
                  <SelectItem value="Anthropic">Anthropic</SelectItem>
                  <SelectItem value="Google">Google AI</SelectItem>
                  <SelectItem value="Cohere">Cohere</SelectItem>
                  <SelectItem value="Custom">Custom Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="transport-type">Transport Layer</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Select how the client will communicate with the server.
                        Stdio is best for local processes, HTTP with SSE is ideal for remote servers.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select 
                value={config.transportType} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, transportType: value }))}
              >
                <SelectTrigger id="transport-type">
                  <SelectValue placeholder="Select transport type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stdio">Stdio (Local Process)</SelectItem>
                  <SelectItem value="http-sse">HTTP with SSE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="server-url">Server URL</Label>
              <Input 
                id="server-url" 
                placeholder="https://example.com/mcp"
                value={config.serverUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input 
                id="api-key" 
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input 
                id="timeout" 
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              />
            </div>
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Core Capabilities</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="resources"
                      checked={config.capabilities.resources}
                      onCheckedChange={(checked) => handleCapabilityChange('resources', checked as boolean)}
                    />
                    <Label htmlFor="resources" className="text-sm font-normal">Resource Management</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="progress"
                      checked={config.capabilities.progress}
                      onCheckedChange={(checked) => handleCapabilityChange('progress', checked as boolean)}
                    />
                    <Label htmlFor="progress" className="text-sm font-normal">Progress Reporting</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="file-search"
                      checked={config.capabilities.fileSearch}
                      onCheckedChange={(checked) => handleCapabilityChange('fileSearch', checked as boolean)}
                    />
                    <Label htmlFor="file-search" className="text-sm font-normal">File Search</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="web-search"
                      checked={config.capabilities.webSearch}
                      onCheckedChange={(checked) => handleCapabilityChange('webSearch', checked as boolean)}
                    />
                    <Label htmlFor="web-search" className="text-sm font-normal">Web Search</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Extended Capabilities</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="code-execution"
                      checked={config.capabilities.codeExecution}
                      onCheckedChange={(checked) => handleCapabilityChange('codeExecution', checked as boolean)}
                    />
                    <Label htmlFor="code-execution" className="text-sm font-normal">Code Execution</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="image-generation"
                      checked={config.capabilities.imageGeneration}
                      onCheckedChange={(checked) => handleCapabilityChange('imageGeneration', checked as boolean)}
                    />
                    <Label htmlFor="image-generation" className="text-sm font-normal">Image Generation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="data-analysis"
                      checked={config.capabilities.dataAnalysis}
                      onCheckedChange={(checked) => handleCapabilityChange('dataAnalysis', checked as boolean)}
                    />
                    <Label htmlFor="data-analysis" className="text-sm font-normal">Data Analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="database-query"
                      checked={config.capabilities.databaseQuery}
                      onCheckedChange={(checked) => handleCapabilityChange('databaseQuery', checked as boolean)}
                    />
                    <Label htmlFor="database-query" className="text-sm font-normal">Database Query</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-base font-medium">Specialized Capabilities</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="gis-processing"
                    checked={config.capabilities.gisProcessing}
                    onCheckedChange={(checked) => handleCapabilityChange('gisProcessing', checked as boolean)}
                  />
                  <Label htmlFor="gis-processing" className="text-sm font-normal">GIS Processing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="custom-tool"
                    checked={config.capabilities.customTool}
                    onCheckedChange={(checked) => handleCapabilityChange('customTool', checked as boolean)}
                  />
                  <Label htmlFor="custom-tool" className="text-sm font-normal">Custom Tool</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="protocol-version">Protocol Version</Label>
              <Select 
                value={config.protocolVersion} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, protocolVersion: value }))}
              >
                <SelectTrigger id="protocol-version">
                  <SelectValue placeholder="Select protocol version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0">1.0</SelectItem>
                  <SelectItem value="1.1">1.1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Authentication</Label>
              <Select 
                value={config.authentication.type} 
                onValueChange={(value) => setConfig(prev => ({ 
                  ...prev, 
                  authentication: { ...prev.authentication, type: value } 
                }))}
              >
                <SelectTrigger id="auth-type">
                  <SelectValue placeholder="Select authentication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="validate-connection"
                checked={config.authentication.validateConnection}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  authentication: { ...prev.authentication, validateConnection: checked as boolean } 
                }))}
              />
              <Label htmlFor="validate-connection">Validate connection on setup</Label>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-base font-medium">Error Handling</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="log-level">Log Level</Label>
                  <Select 
                    value={config.errorHandling.logLevel} 
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      errorHandling: { ...prev.errorHandling, logLevel: value } 
                    }))}
                  >
                    <SelectTrigger id="log-level">
                      <SelectValue placeholder="Select log level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Retry Attempts</Label>
                  <Input 
                    id="retry-attempts" 
                    type="number"
                    value={config.errorHandling.retryAttempts}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      errorHandling: { ...prev.errorHandling, retryAttempts: parseInt(e.target.value) } 
                    }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 