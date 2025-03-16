'use client';

import React, { useState } from 'react';
import { useModel } from '@/lib/models/model-context';
import { ModelBadge } from '@/components/model-selector/ModelBadge';
import { createCustomModel, AIModel, ModelProvider } from '@/lib/models/model-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Plus, Settings, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ModelSettingsPage() {
  const {
    selectedModel,
    availableModels,
    standardModels,
    customModels,
    setSelectedModel,
    addCustomModel,
    removeCustomModel,
  } = useModel();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelProvider, setModelProvider] = useState<ModelProvider>('custom');
  const [modelContextWindow, setModelContextWindow] = useState(4000);
  const [hasThinking, setHasThinking] = useState(false);
  const [hasVision, setHasVision] = useState(false);
  const [hasResearch, setHasResearch] = useState(false);
  const [hasCodegen, setHasCodegen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle model selection
  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
  };

  // Reset the add model form
  const resetAddModelForm = () => {
    setModelName('');
    setModelProvider('custom');
    setModelContextWindow(4000);
    setHasThinking(false);
    setHasVision(false);
    setHasResearch(false);
    setHasCodegen(false);
    setError(null);
  };

  // Handle adding a custom model
  const handleAddCustomModel = () => {
    // Validate form
    if (!modelName.trim()) {
      setError('Model name is required');
      return;
    }

    // Create custom model
    const customModel = createCustomModel(
      `custom-${Date.now()}`,
      modelName.trim(),
      modelProvider,
      modelContextWindow,
      {
        thinking: hasThinking,
        streaming: true,
        vision: hasVision,
        functionCalling: true,
        longContext: modelContextWindow > 8000,
        codeGeneration: hasCodegen,
        research: hasResearch,
      }
    );

    // Add the model
    addCustomModel(customModel);
    setShowAddDialog(false);
    resetAddModelForm();
  };

  // Handle removing a custom model
  const handleRemoveCustomModel = (modelId: string) => {
    removeCustomModel(modelId);
  };

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Model Settings</h1>
          <p className="text-muted-foreground">
            Configure AI models and set your default model
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Model</DialogTitle>
              <DialogDescription>
                Configure a custom model to use with the system
              </DialogDescription>
            </DialogHeader>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="col-span-3"
                  placeholder="My Custom Model"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="provider" className="text-right">
                  Provider
                </Label>
                <Select 
                  value={modelProvider} 
                  onValueChange={(value) => setModelProvider(value as ModelProvider)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="meta">Meta</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                    <SelectItem value="xai">xAI</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contextWindow" className="text-right">
                  Context Window
                </Label>
                <Input
                  id="contextWindow"
                  type="number"
                  min="1000"
                  max="1000000"
                  value={modelContextWindow}
                  onChange={(e) => setModelContextWindow(parseInt(e.target.value) || 4000)}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Capabilities</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="thinking" 
                      checked={hasThinking} 
                      onCheckedChange={(checked) => setHasThinking(checked === true)}
                    />
                    <Label htmlFor="thinking">Thinking capabilities</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="vision" 
                      checked={hasVision} 
                      onCheckedChange={(checked) => setHasVision(checked === true)}
                    />
                    <Label htmlFor="vision">Vision capabilities</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="research" 
                      checked={hasResearch} 
                      onCheckedChange={(checked) => setHasResearch(checked === true)}
                    />
                    <Label htmlFor="research">Research capabilities</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="codegen" 
                      checked={hasCodegen} 
                      onCheckedChange={(checked) => setHasCodegen(checked === true)}
                    />
                    <Label htmlFor="codegen">Code generation capabilities</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetAddModelForm();
                setShowAddDialog(false);
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomModel}>
                Add Model
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>AI Models</CardTitle>
          <CardDescription>
            Configure which models to use for different tasks
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="standard">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standard">Standard Models</TabsTrigger>
              <TabsTrigger value="custom">Custom Models</TabsTrigger>
            </TabsList>
            
            <TabsContent value="standard" className="mt-4">
              <Table>
                <TableCaption>List of available standard models</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead>Capabilities</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standardModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <ModelBadge model={model} />
                          <span>{model.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {model.provider.charAt(0).toUpperCase() + model.provider.slice(1)}
                      </TableCell>
                      <TableCell>{(model.contextWindow / 1000).toFixed(0)}k</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ModelBadge model={model} showCapabilities={true} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={selectedModel.id === model.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSelectModel(model)}
                        >
                          {selectedModel.id === model.id ? "Selected" : "Select"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="custom" className="mt-4">
              {customModels.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    You haven't added any custom models yet.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Model
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableCaption>Your custom models</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Model</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Capabilities</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customModels.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <ModelBadge model={model} />
                            <span>{model.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {model.provider.charAt(0).toUpperCase() + model.provider.slice(1)}
                        </TableCell>
                        <TableCell>{(model.contextWindow / 1000).toFixed(0)}k</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ModelBadge model={model} showCapabilities={true} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant={selectedModel.id === model.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSelectModel(model)}
                            >
                              {selectedModel.id === model.id ? "Selected" : "Select"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemoveCustomModel(model.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Current model: <strong>{selectedModel.name}</strong>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Advanced Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 