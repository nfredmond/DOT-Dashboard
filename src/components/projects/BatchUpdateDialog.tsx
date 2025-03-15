"use client"

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle,
  Bot,
  FileUp,
  Plus,
  ArrowRight,
  BrainCircuit,
  RefreshCw,
  CheckCircle2,
  CornerDownRight,
  Upload,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Project } from "@/types/project";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BatchUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  selectedProjects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
}

export function BatchUpdateDialog({
  open,
  onClose,
  selectedProjects,
  onUpdateProjects,
}: BatchUpdateDialogProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [updateInstruction, setUpdateInstruction] = useState("");
  const [tab, setTab] = useState<string>("instruction");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [results, setResults] = useState<{ 
    projectId: string, 
    projectName: string, 
    updates: { field: string, before: string, after: string }[] 
  }[]>([]);
  const [processStep, setProcessStep] = useState<"input" | "processing" | "results">("input");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFileContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Process the batch update
  const handleProcessUpdate = async () => {
    if (tab === "instruction" && !updateInstruction.trim()) {
      toast({
        title: "Instructions Required",
        description: "Please provide instructions for the batch update.",
        variant: "destructive",
      });
      return;
    }

    if (tab === "file" && !uploadedFile) {
      toast({
        title: "File Required",
        description: "Please upload a file with update data.",
        variant: "destructive",
      });
      return;
    }

    setProcessStep("processing");
    setUpdating(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock results
      const mockResults = selectedProjects.map(project => ({
        projectId: project.id,
        projectName: project.name,
        updates: [
          {
            field: "Environmental Status",
            before: project.nepaStatus,
            after: project.nepaStatus === "Not Started" ? "In Progress" : project.nepaStatus
          },
          {
            field: "Priority",
            before: project.priority,
            after: project.priority === "Medium" ? "High" : project.priority
          },
          {
            field: "Funding Estimate",
            before: `$${project.estimatedCost.toLocaleString()}`,
            after: `$${(project.estimatedCost * 1.05).toLocaleString()}`
          }
        ]
      }));
      
      // Mock AI analysis
      const mockAnalysis = `
### Batch Update Analysis

Based on the ${tab === "instruction" ? "instructions" : "uploaded data"} provided, I've analyzed the selected ${selectedProjects.length} projects and prepared updates.

**Key Changes:**
- Updated environmental documentation status for projects in early phases
- Adjusted priority based on funding availability and deadlines
- Updated cost estimates with 5% inflation adjustment
- Added climate resilience tags to relevant projects

**Recommendations:**
- Review manually the updated funding estimates
- Consider conducting a more detailed environmental analysis for highway projects
- Schedule follow-up meetings with stakeholders for high priority projects
      `;
      
      setResults(mockResults);
      setAiAnalysis(mockAnalysis);
      setProcessStep("results");
      
      // For a real implementation, you would call your API here
      // const response = await fetch('/api/projects/batch-update', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     projectIds: selectedProjects.map(p => p.id),
      //     instruction: updateInstruction,
      //     fileContent: fileContent
      //   })
      // });
      // const data = await response.json();
      // setResults(data.results);
      // setAiAnalysis(data.analysis);

    } catch (error) {
      console.error('Error during batch update:', error);
      toast({
        title: "Update Failed",
        description: "There was an error processing the batch update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Apply updates to projects
  const handleApplyUpdates = () => {
    try {
      // In a real implementation, you would apply the actual updates returned from the API
      // For this mock, we'll just simulate applying the changes
      
      // Deep clone the selected projects to avoid mutating the original array
      const updatedProjects = JSON.parse(JSON.stringify(selectedProjects)) as Project[];
      
      // Apply the mock changes
      updatedProjects.forEach(project => {
        // Apply some mock changes based on results
        project.nepaStatus = project.nepaStatus === "Not Started" ? "In Progress" : project.nepaStatus;
        project.priority = project.priority === "Medium" ? "High" : project.priority;
        project.estimatedCost = Math.round(project.estimatedCost * 1.05);
        
        // Add a tag for climate resilience if it doesn't exist
        if (!project.tags.includes("Climate Resilience")) {
          project.tags.push("Climate Resilience");
        }
      });
      
      // Call the parent component's update function
      onUpdateProjects(updatedProjects);
      
      toast({
        title: "Updates Applied",
        description: `Successfully updated ${updatedProjects.length} projects.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error applying updates:', error);
      toast({
        title: "Update Failed",
        description: "There was an error applying the updates. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset the dialog state
  const handleReset = () => {
    setProcessStep("input");
    setResults([]);
    setAiAnalysis("");
    setUpdateInstruction("");
    setUploadedFile(null);
    setFileContent("");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Update Projects</DialogTitle>
          <DialogDescription>
            Update multiple projects at once using AI assistance or data files.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="px-2 py-1">
              {selectedProjects.length} Projects Selected
            </Badge>
            {processStep !== "input" && (
              <Badge variant="outline" className={processStep === "processing" ? "bg-blue-100" : "bg-green-100"}>
                {processStep === "processing" ? "Processing" : "Results Ready"}
              </Badge>
            )}
          </div>

          {processStep === "input" && (
            <Tabs defaultValue="instruction" value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instruction">AI Instruction</TabsTrigger>
                <TabsTrigger value="file">Upload Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="instruction" className="space-y-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Describe what updates you want to apply to the selected projects
                  </p>
                  <Textarea
                    placeholder="E.g., Update environmental documentation status for all Highway projects to 'In Progress' and increase their priority to 'High'"
                    className="h-[120px]"
                    value={updateInstruction}
                    onChange={(e) => setUpdateInstruction(e.target.value)}
                  />
                </div>
                
                <Alert className="bg-muted/50">
                  <Bot className="h-4 w-4" />
                  <AlertTitle>AI Assistant</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Your instructions will be processed by our AI to update the selected projects. You can:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Update environmental documentation status</li>
                      <li>Adjust project priorities and timelines</li>
                      <li>Add tags and categories</li>
                      <li>Update funding estimates</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {!uploadedFile ? (
                    <div>
                      <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a CSV, Excel or JSON file with project updates
                      </p>
                      <label htmlFor="file-upload">
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv,.xlsx,.json"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Select File
                        </Button>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setUploadedFile(null);
                          setFileContent("");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                
                <Alert className="bg-muted/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>File Format</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Your file should contain columns for:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Project ID or Name</li>
                      <li>Fields to update (e.g., status, priority, etc.)</li>
                      <li>New values for those fields</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          )}

          {processStep === "processing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" />
              <div className="mt-6 text-center">
                <p className="font-medium mb-1">Processing Batch Update</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing {selectedProjects.length} projects and preparing updates...
                </p>
              </div>
            </div>
          )}

          {processStep === "results" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">AI Analysis</CardTitle>
                  <CardDescription>Recommendations based on the update request</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="font-sans whitespace-pre-wrap p-4 bg-muted/40 rounded-md text-sm">
                      {aiAnalysis}
                    </pre>
                  </div>
                </CardContent>
              </Card>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Update Preview</h4>
                <div className="space-y-4">
                  {results.map((result) => (
                    <Card key={result.projectId}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base font-medium">{result.projectName}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {result.updates.map((update, idx) => (
                            <div key={idx} className="flex items-start">
                              <div className="w-1/3 text-sm font-medium">{update.field}</div>
                              <div className="flex items-center flex-1">
                                <div className="text-sm text-muted-foreground">{update.before}</div>
                                <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                                <div className="text-sm font-medium">{update.after}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center space-x-2">
          {processStep === "input" && (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleProcessUpdate} disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Process Update
              </Button>
            </>
          )}
          
          {processStep === "processing" && (
            <Button variant="ghost" onClick={onClose} disabled={updating}>
              Cancel
            </Button>
          )}
          
          {processStep === "results" && (
            <>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </div>
              <Button onClick={handleApplyUpdates}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Apply Updates
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 