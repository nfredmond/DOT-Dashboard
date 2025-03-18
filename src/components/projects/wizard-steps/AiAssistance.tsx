"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types/project';
import { WizardCategory } from '@/contexts/ProjectWizardContext';
import { 
  processUnstructuredText, 
  extractProjectDataFromFile, 
  analyzeProject, 
  suggestImprovements, 
  AIProjectSuggestion,
  AIProjectAnalysis 
} from '@/lib/project-ai-service';
import { 
  Bot, 
  CheckCircle2, 
  FileText, 
  FileUp, 
  LayoutList, 
  Lightbulb, 
  MessageSquareDashed, 
  Sparkles,
  ThumbsUp,
  X
} from 'lucide-react';

interface AiAssistanceProps {
  projectData: Partial<Project>;
  currentStep: WizardCategory;
  onApplySuggestions: (data: Partial<Project>) => void;
}

const AiAssistance: React.FC<AiAssistanceProps> = ({ 
  projectData, 
  currentStep, 
  onApplySuggestions 
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('freeText');
  const [freeText, setFreeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<AIProjectSuggestion | null>(null);
  const [analysis, setAnalysis] = useState<AIProjectAnalysis | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showImprovement, setShowImprovement] = useState(false);
  const [improvements, setImprovements] = useState<{ suggestions: string[], explanation: string } | null>(null);
  
  // Handle text processing
  const handleProcessText = async () => {
    if (!freeText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to process",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await processUnstructuredText(freeText);
      setSuggestions(result);
      setAnalysis(null);
    } catch (error) {
      logger.error("Error processing text:", error);
      toast({
        title: "Error",
        description: "Failed to process text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleProcessFile = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to process",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await extractProjectDataFromFile(selectedFile);
      setSuggestions(result);
      setAnalysis(null);
    } catch (error) {
      logger.error("Error processing file:", error);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle project analysis
  const handleAnalyzeProject = async () => {
    setIsProcessing(true);
    
    try {
      const result = await analyzeProject(projectData);
      setAnalysis(result);
      setSuggestions(null);
    } catch (error) {
      logger.error("Error analyzing project:", error);
      toast({
        title: "Error",
        description: "Failed to analyze project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle getting improvement suggestions for current step
  const handleGetImprovements = async () => {
    setIsProcessing(true);
    setShowImprovement(true);
    
    try {
      const result = await suggestImprovements(projectData, currentStep);
      setImprovements(result);
    } catch (error) {
      logger.error("Error getting improvements:", error);
      toast({
        title: "Error",
        description: "Failed to get improvement suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Apply suggestions to the project data
  const handleApplySuggestions = () => {
    if (suggestions) {
      onApplySuggestions(suggestions.suggestedValues);
      
      toast({
        title: "Success",
        description: "AI suggestions applied successfully",
      });
      
      // Clear suggestions and text
      setSuggestions(null);
      setFreeText('');
      setSelectedFile(null);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Project Assistant
        </CardTitle>
        <CardDescription>
          Get AI assistance with your project data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="freeText" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="freeText">
              <MessageSquareDashed className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="fileUpload">
              <FileUp className="h-4 w-4 mr-2" />
              File
            </TabsTrigger>
            <TabsTrigger value="analyze">
              <Lightbulb className="h-4 w-4 mr-2" />
              Analyze
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="freeText" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="freeText">Describe your project</Label>
              <Textarea
                id="freeText"
                placeholder="Enter project description, goals, location, budget, timeline, or any other details..."
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Paste text from emails, documents, or describe the project in your own words.
import logger from '../../../lib/logger';

              </p>
            </div>
            
            <Button 
              onClick={handleProcessText} 
              className="w-full"
              disabled={isProcessing || !freeText.trim()}
            >
              {isProcessing ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  Processing...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Process Text
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="fileUpload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fileUpload">Upload a file</Label>
              <Input
                id="fileUpload"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
              />
              <p className="text-xs text-muted-foreground">
                Upload project documents, specifications, or data files (PDF, Word, Excel, CSV, Text).
              </p>
            </div>
            
            <Button 
              onClick={handleProcessFile} 
              className="w-full"
              disabled={isProcessing || !selectedFile}
            >
              {isProcessing ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Process File
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="analyze" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleAnalyzeProject}
                  disabled={isProcessing}
                  className="flex-1 mr-2"
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="mr-2" size="sm" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <LayoutList className="mr-2 h-4 w-4" />
                      Analyze Project
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleGetImprovements}
                  disabled={isProcessing}
                  className="flex-1 ml-2"
                >
                  {isProcessing && showImprovement ? (
                    <>
                      <Spinner className="mr-2" size="sm" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Improvement Ideas
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Get AI analysis of your project data and suggestions for improvement.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Show Suggestions */}
        {suggestions && (
          <div className="mt-6 space-y-4">
            <Alert className={suggestions.confidence > 0.7 ? "border-primary" : "border-yellow-500"}>
              <div className="flex justify-between items-start">
                <div>
                  <AlertTitle className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    AI Suggestions
                  </AlertTitle>
                  <AlertDescription>
                    {suggestions.explanation}
                  </AlertDescription>
                </div>
                <Badge variant={suggestions.confidence > 0.7 ? "default" : "outline"}>
                  {Math.round(suggestions.confidence * 100)}% confidence
                </Badge>
              </div>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Suggested Values:</h4>
              <div className="bg-muted rounded-md p-3 text-sm">
                <ul className="space-y-2">
                  {Object.entries(suggestions.suggestedValues).map(([key, value]) => (
                    <li key={key} className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span>
                        {typeof value === 'object' 
                          ? JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
                          : String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSuggestions(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Discard
              </Button>
              <Button 
                size="sm"
                onClick={handleApplySuggestions}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply Suggestions
              </Button>
            </div>
          </div>
        )}
        
        {/* Show Analysis */}
        {analysis && (
          <div className="mt-6 space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                Similar Projects:
              </h4>
              <div className="bg-muted rounded-md p-3 text-sm">
                <ul className="space-y-1">
                  {analysis.similarProjects.map((project, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{project.name}</span>
                      <Badge variant="outline">{Math.round(project.similarity * 100)}% similar</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Potential Risks:</h4>
              <div className="bg-muted rounded-md p-3 text-sm">
                <ul className="list-disc list-inside space-y-1">
                  {analysis.potentialRisks.map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAnalysis(null)}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Thanks
              </Button>
            </div>
          </div>
        )}
        
        {/* Show Improvements */}
        {improvements && (
          <div className="mt-6 space-y-4">
            <Alert>
              <AlertTitle className="flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                Improvement Ideas for {currentStep}
              </AlertTitle>
              <AlertDescription>
                {improvements.explanation}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <div className="bg-muted rounded-md p-3 text-sm">
                <ul className="list-disc list-inside space-y-2">
                  {improvements.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setImprovements(null)}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Thanks
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiAssistance; 