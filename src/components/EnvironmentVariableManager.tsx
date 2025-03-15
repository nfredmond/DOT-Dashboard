"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Save, Info, PlusCircle, Trash2, BrainIcon, MapIcon, DatabaseIcon, GlobeIcon, KeyIcon } from "lucide-react"
import { EnvVariable, loadEnvVariables, saveEnvVariables } from "@/lib/env-service"

export function EnvironmentVariableManager() {
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([])
  const [newVariable, setNewVariable] = useState<Partial<EnvVariable>>({ 
    key: "", 
    value: "", 
    description: "", 
    category: "other",
    isSecret: false 
  })
  const [isAdding, setIsAdding] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [status, setStatus] = useState<{ type: "success" | "error" | "info" | null; message: string }>({
    type: null,
    message: ""
  })

  // Load environment variables from service
  useEffect(() => {
    setEnvVariables(loadEnvVariables())
  }, [])

  // Save environment variables using service
  const handleSaveEnvironmentVariables = () => {
    try {
      const success = saveEnvVariables(envVariables)
      
      if (success) {
        setStatus({
          type: "success",
          message: "Environment variables saved successfully!"
        })
      } else {
        setStatus({
          type: "error",
          message: "Failed to save environment variables. Please try again."
        })
      }
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus({ type: null, message: "" })
      }, 3000)
    } catch (error) {
      setStatus({
        type: "error",
        message: "Failed to save environment variables."
      })
    }
  }

  // Handle input change for existing variables
  const handleInputChange = (id: string, field: keyof EnvVariable, value: string) => {
    setEnvVariables(prevVariables =>
      prevVariables.map(variable =>
        variable.id === id ? { ...variable, [field]: value } : variable
      )
    )
  }

  // Handle input change for new variable
  const handleNewVariableChange = (field: keyof EnvVariable, value: any) => {
    setNewVariable(prev => ({ ...prev, [field]: value }))
  }

  // Add new variable
  const addNewVariable = () => {
    if (!newVariable.key || !newVariable.category) {
      setStatus({
        type: "error",
        message: "Variable key and category are required."
      })
      return
    }

    const newId = Math.random().toString(36).substring(2, 9)
    
    setEnvVariables(prev => [
      ...prev,
      {
        id: newId,
        key: newVariable.key as string,
        value: newVariable.value as string || "",
        description: newVariable.description as string || "",
        category: newVariable.category as "map" | "api" | "auth" | "other" | "llm" | "census" | "traffic" | "planning",
        isSecret: newVariable.isSecret as boolean || false
      }
    ])
    
    // Reset form
    setNewVariable({ key: "", value: "", description: "", category: "other", isSecret: false })
    setIsAdding(false)
  }

  // Delete variable
  const deleteVariable = (id: string) => {
    setEnvVariables(prev => prev.filter(variable => variable.id !== id))
  }

  // Category options
  const categoryOptions = [
    { value: "all", label: "All Categories", icon: DatabaseIcon },
    { value: "map", label: "Map Services", icon: MapIcon },
    { value: "llm", label: "LLM Providers", icon: BrainIcon },
    { value: "census", label: "Census API", icon: DatabaseIcon },
    { value: "traffic", label: "Traffic Data", icon: GlobeIcon },
    { value: "planning", label: "Planning & GIS", icon: MapIcon },
    { value: "api", label: "API Configuration", icon: KeyIcon },
    { value: "auth", label: "Authentication", icon: KeyIcon },
    { value: "other", label: "Other", icon: DatabaseIcon }
  ]

  // Get icon component for category
  const getCategoryIcon = (category: string) => {
    const found = categoryOptions.find(opt => opt.value === category);
    return found?.icon || DatabaseIcon;
  }

  // Filter variables by category
  const filteredVariables = selectedCategory === "all" 
    ? envVariables 
    : envVariables.filter(variable => variable.category === selectedCategory)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Environment Variables</h3>
          <p className="text-sm text-muted-foreground">
            Manage application environment variables and API keys
          </p>
        </div>
        <div className="flex space-x-2">
          <select 
            className="px-4 py-2 rounded-md border border-input bg-background"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <Button 
            onClick={() => setIsAdding(true)} 
            disabled={isAdding}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Variable
          </Button>
        </div>
      </div>

      {status.type && (
        <Alert variant={status.type === "error" ? "destructive" : "default"}>
          {status.type === "error" && <AlertCircle className="h-4 w-4" />}
          {status.type === "success" && <Info className="h-4 w-4" />}
          <AlertTitle>
            {status.type === "error" ? "Error" : "Success"}
          </AlertTitle>
          <AlertDescription>
            {status.message}
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>About Environment Variables</AlertTitle>
        <AlertDescription>
          <p>Environment variables stored here are saved to your browser's localStorage. 
            In a production environment, these would be securely stored on a server.</p>
          <p className="mt-2">Variables with names starting with <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_</code> will be 
            available to client-side code. Other variables are only accessible on the server.</p>
        </AlertDescription>
      </Alert>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Environment Variable</CardTitle>
            <CardDescription>
              Enter the details for the new environment variable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-key">Variable Key</Label>
                  <Input
                    id="new-key"
                    placeholder="NEXT_PUBLIC_EXAMPLE_KEY"
                    value={newVariable.key}
                    onChange={e => handleNewVariableChange("key", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-value">Value</Label>
                  <Input
                    id="new-value"
                    placeholder="your-value-here"
                    type={newVariable.isSecret ? "password" : "text"}
                    value={newVariable.value}
                    onChange={e => handleNewVariableChange("value", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category">Category</Label>
                  <select
                    id="new-category"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                    value={newVariable.category}
                    onChange={e => handleNewVariableChange("category", e.target.value)}
                  >
                    {categoryOptions.filter(option => option.value !== 'all').map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newVariable.isSecret as boolean}
                      onChange={e => handleNewVariableChange("isSecret", e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>Is Secret</span>
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-description">Description</Label>
                <Input
                  id="new-description"
                  placeholder="Describe what this variable is used for"
                  value={newVariable.description}
                  onChange={e => handleNewVariableChange("description", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button onClick={addNewVariable}>
              Add Variable
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="space-y-4">
        {filteredVariables.map(variable => (
          <Card key={variable.id}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <Label htmlFor={`key-${variable.id}`}>Variable Key</Label>
                  <Input
                    id={`key-${variable.id}`}
                    value={variable.key}
                    onChange={e => handleInputChange(variable.id, "key", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor={`value-${variable.id}`}>Value</Label>
                  <Input
                    id={`value-${variable.id}`}
                    type={variable.isSecret ? "password" : "text"}
                    value={variable.value}
                    onChange={e => handleInputChange(variable.id, "value", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor={`category-${variable.id}`}>Category</Label>
                  <select
                    id={`category-${variable.id}`}
                    className="w-full px-3 py-2 mt-1 rounded-md border border-input bg-background"
                    value={variable.category}
                    onChange={e => handleInputChange(variable.id, "category", e.target.value as any)}
                  >
                    {categoryOptions.filter(option => option.value !== 'all').map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="flex items-center space-x-2 mt-7">
                    <input
                      type="checkbox"
                      checked={variable.isSecret}
                      onChange={e => handleInputChange(variable.id, "isSecret", e.target.checked.toString())}
                      className="rounded border-gray-300"
                    />
                    <span>Is Secret</span>
                  </Label>
                </div>
                <div className="col-span-1 flex items-end justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteVariable(variable.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                <div className="col-span-12">
                  <Label htmlFor={`description-${variable.id}`}>Description</Label>
                  <Input
                    id={`description-${variable.id}`}
                    value={variable.description}
                    onChange={e => handleInputChange(variable.id, "description", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveEnvironmentVariables}>
          <Save className="mr-2 h-4 w-4" />
          Save Environment Variables
        </Button>
      </div>
    </div>
  )
} 