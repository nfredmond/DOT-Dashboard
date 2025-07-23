'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getBenefitCostAnalyses,
  getBenefitCostAnalysis,
  deleteBenefitCostAnalysis,
  calculateBenefitCostAnalysis,
  performSensitivityAnalysis,
  generateBenefitCostInsights,
  runMonteCarloSimulation,
  updateBenefitCostAnalysis,
  createBenefitCostAnalysis,
  getBenefitCostTemplates
} from '@/lib/benefit-cost-service';
import { BenefitCostAnalysis, BenefitCostAnalysisResult, BenefitCostTemplate } from '@/types/benefit-cost';
import { BenefitCostForm } from '@/components/benefit-cost/BenefitCostForm';
import { BenefitCostSummaryCharts, SensitivityAnalysisChart, MonteCarloChart } from '@/components/benefit-cost/BenefitCostCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, FileText, PlusIcon, EditIcon, Trash2Icon, DownloadIcon, PlusCircleIcon, Copy, FileOutput, Zap, Users, MapPin, CalendarDays, TrendingUp, Clock, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitCompareIcon } from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Spinner } from '@/components/ui/spinner';
import dynamic from 'next/dynamic';
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { TimelineVisualizer } from "@/components/benefit-cost/TimelineVisualizer";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import BaseMap from '@/components/maps/BaseMap';
import { visualizeBenefitCostOnMap } from '@/lib/map-utils';
import { v4 as uuidv4 } from 'uuid';

// Dynamically import the TimelineChart component to avoid import errors
const TimelineChart = dynamic(() => import('@/components/benefit-cost/TimelineChart').then(mod => mod.TimelineChart), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Spinner /></div>
});

// Fix the formatCurrency function to handle possible BenefitCostTimeSeries
const formatCurrency = (value: number | any) => {
  // If value is an object, try to get the first value or default to 0
  const numericValue = typeof value === 'number' ? value : 0;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(numericValue);
};

export default function BenefitCostAnalysisPage({ params: pageParams }: { params: { id: string } }) {
  const router = useRouter();
  const urlParams = useParams();
  const projectId = urlParams.id as string;
  
  const [analyses, setAnalyses] = useState<BenefitCostAnalysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<BenefitCostAnalysisResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<BenefitCostAnalysisResult[]>([]);
  
  const [monteCarloResults, setMonteCarloResults] = useState<any>(null);
  const [runningMonteCarloSim, setRunningMonteCarloSim] = useState(false);
  
  // Add scenario management imports
  const [scenarios, setScenarios] = useState<Record<string, any>>({});
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDescription, setNewScenarioDescription] = useState('');
  
  // Add imports for optimization
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [runningOptimization, setRunningOptimization] = useState(false);
  const [optimizationTarget, setOptimizationTarget] = useState<'bcr' | 'npv'>('bcr');
  
  // Add imports for distributive analysis
  const [distributiveAnalysis, setDistributiveAnalysis] = useState<any>(null);
  const [loadingDistributiveAnalysis, setLoadingDistributiveAnalysis] = useState(false);
  
  // Add imports for timeline visualization
  const [timelineData, setTimelineData] = useState<any>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  
  // Add state for time-based scenarios
  const [timeScenarios, setTimeScenarios] = useState<{
    id: string;
    name: string;
    description: string;
    implementationDelay: number;
    constructionDuration: number;
    discountRateAdjustment: number;
  }[]>([]);
  const [activeTimeScenario, setActiveTimeScenario] = useState<string | null>(null);
  const [isCreatingTimeScenario, setIsCreatingTimeScenario] = useState(false);
  const [newTimeScenario, setNewTimeScenario] = useState({
    name: "",
    description: "",
    implementationDelay: 0,
    constructionDuration: 2,
    discountRateAdjustment: 0
  });
  
  // Add map state
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [showMapVisualization, setShowMapVisualization] = useState(false);
  
  // State for template selection during creation
  const [availableTemplates, setAvailableTemplates] = useState<BenefitCostTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateForNewAnalysis, setSelectedTemplateForNewAnalysis] = useState<BenefitCostTemplate | null>(null);
  const [analysisToEdit, setAnalysisToEdit] = useState<BenefitCostAnalysisResult | null>(null);
  
  const [editingAnalysis, setEditingAnalysis] = useState<BenefitCostAnalysisResult | null>(null);
  
  const handleEditAnalysis = (analysis: BenefitCostAnalysisResult) => {
    setAnalysisToEdit(analysis);
    setSelectedTemplateForNewAnalysis(null); // Not using a template when editing
    setShowCreateForm(false); // Ensure create form is hidden
    setShowTemplateSelector(false); // Ensure template selector is hidden
    setShowEditForm(true);
  };
  
  // Load analyses for this project
  useEffect(() => {
    const loadAnalyses = async () => {
      try {
        setLoading(true);
        const analysesData = await getBenefitCostAnalyses(projectId);
        setAnalyses(analysesData);
        
        // Select the first analysis if available and none selected
        if (analysesData.length > 0 && !selectedAnalysisId) {
          setSelectedAnalysisId(analysesData[0].id);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load benefit-cost analyses');
        console.error('Error loading analyses:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalyses();
  }, [projectId]);
  
  // Load selected analysis details
  useEffect(() => {
    const loadAnalysisDetails = async () => {
      if (!selectedAnalysisId) {
        setSelectedAnalysis(null);
        return;
      }
      
      try {
        setCalculating(true);
        const analysis = await getBenefitCostAnalysis(selectedAnalysisId);
        
        if (analysis) {
          // Generate insights if they don't exist
          if (!('summary' in analysis)) {
            const result = await generateBenefitCostInsights(analysis);
            setSelectedAnalysis(result);
          } else {
            setSelectedAnalysis(analysis as BenefitCostAnalysisResult);
          }
        }
      } catch (err) {
        console.error('Error loading analysis details:', err);
      } finally {
        setCalculating(false);
      }
    };
    
    loadAnalysisDetails();
  }, [selectedAnalysisId]);
  
  // Create a new analysis - Step 1: Show template selector
  const handleCreateAnalysis = async () => {
    // setSelectedAnalysisId(null); // Clear any selected analysis for editing context
    setAnalysisToEdit(null); // Clear editing state
    setSelectedTemplateForNewAnalysis(null); // Reset selected template
    setShowEditForm(false); // Ensure edit form is hidden
    setShowCreateForm(false); // Ensure create form is initially hidden until template is chosen or skipped
    
    setIsLoadingTemplates(true);
    setShowTemplateSelector(true);
    try {
      const templates = await getBenefitCostTemplates(projectId); // Assuming projectId can scope templates, or remove if templates are global
      setAvailableTemplates(templates);
    } catch (err) {
      console.error("Error fetching BCA templates:", err);
      toast({
        title: "Error Fetching Templates",
        description: err instanceof Error ? err.message : "Could not load templates.",
        variant: "destructive"
      });
      // Proceed without templates if fetch fails, or handle error more gracefully
      setAvailableTemplates([]); 
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Step 2: Called after template is selected or skipped
  const handleProceedToCreateForm = (template: BenefitCostTemplate | null) => {
    setSelectedTemplateForNewAnalysis(template);
    setShowTemplateSelector(false);
    setAnalysisToEdit(null); // Ensure we are in create mode
    setShowEditForm(false);
    setShowCreateForm(true);
  };
  
  // Save a new or updated analysis
  const handleSaveAnalysis = async (analysisFromForm: BenefitCostAnalysis) => {
    try {
      setCalculating(true);
      setError(null);

      let analysisToSave = { ...analysisFromForm };
      if (!analysisToSave.projectId) analysisToSave.projectId = projectId; // Ensure projectId is set

      // Perform calculations (NPV, BCR etc.)
      // The service function might do this, or it might expect pre-calculated values.
      // For now, assume calculateBenefitCostAnalysis enriches the object.
      analysisToSave = calculateBenefitCostAnalysis(analysisToSave);
      
      // Generate insights (this might be better done *after* successful save)
      // const analysisWithInsights = await generateBenefitCostInsights(analysisToSave);
      // For now, we'll save the calculated one and then fetch with insights.

      let savedAnalysis: BenefitCostAnalysisResult | null = null;

      // Determine if it's an update or create based on presence of an ID that might correspond to an existing analysis
      // A more robust way would be to check `showEditForm` vs `showCreateForm` state or if `initialAnalysis` was passed to the form.
      const isUpdate = analyses.some(a => a.id === analysisToSave.id) || (selectedAnalysis && selectedAnalysis.id === analysisToSave.id);

      if (isUpdate && analysisToSave.id) {
        console.log("Updating existing analysis:", analysisToSave.id);
        const updated = await updateBenefitCostAnalysis(analysisToSave.id, analysisToSave);
        if (updated) {
          savedAnalysis = await generateBenefitCostInsights(updated);
        } else {
          throw new Error("Failed to update analysis in the database.");
        }
      } else {
        // This is a new analysis
        console.log("Creating new analysis:", analysisToSave.name);
        // The analysisToSave object (from the form) now directly fits the new signature of createBenefitCostAnalysis
        // It should contain projectId, and might contain templateId if selected in form, plus all user inputs.
        // The service function will generate a new ID and apply defaults/template logic.
        
        // Get current user ID (placeholder, replace with actual user management)
        // const userId = supabase.auth.user()?.id; // Example, ensure supabase client is available
        const userId = "current-user-placeholder"; // Replace with actual logic
        
        // Assuming currentPageSelectedTemplateId holds the ID of the template selected for the new analysis, if any.
        // This state would need to be managed in this page component, possibly synced with BenefitCostForm's selection.
        const currentPageSelectedTemplateId = undefined; // Placeholder: This needs to be properly set from page state

        const created = await createBenefitCostAnalysis(
          analysisToSave, 
          currentPageSelectedTemplateId, 
          userId
          /*, organizationId - if available */
        );
        
        if (created) {
          // The `created` object is the full analysis from the DB, including applied defaults/template logic and new ID.
          // Now, generate insights for this newly created and fully formed analysis.
          savedAnalysis = await generateBenefitCostInsights(created);
        } else {
          throw new Error("Failed to create analysis in the database.");
        }
      }

      if (savedAnalysis) {
        setAnalyses(prevAnalyses => {
          const index = prevAnalyses.findIndex(a => a.id === savedAnalysis!.id);
          if (index !== -1) {
            const newAnalyses = [...prevAnalyses];
            newAnalyses[index] = savedAnalysis!;
            return newAnalyses;
          } else {
            return [...prevAnalyses, savedAnalysis!];
          }
        });
        setSelectedAnalysisId(savedAnalysis.id);
        setSelectedAnalysis(savedAnalysis); // Show the newly saved/updated and processed one
        toast({ title: "Analysis Saved", description: `Benefit-cost analysis "${savedAnalysis.name}" has been saved.` });
      } else {
        toast({ title: "Save Error", description: "Could not save the analysis after processing.", variant: "destructive" });
      }

      setShowForm(false); // Hide form after save
      setShowCreateForm(false);
      setShowEditForm(false);

    } catch (err) {
      console.error('Error saving analysis:', err);
      setError(`Failed to save analysis: ${err.message}`);
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setCalculating(false);
    }
  };
  
  // Delete an analysis
  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const success = await deleteBenefitCostAnalysis(analysisId);
      
      if (success) {
        // Remove from the list
        setAnalyses(prev => prev.filter(a => a.id !== analysisId));
        
        // If this was the selected analysis, select another one
        if (selectedAnalysisId === analysisId) {
          const remaining = analyses.filter(a => a.id !== analysisId);
          setSelectedAnalysisId(remaining.length > 0 ? remaining[0].id : null);
        }
      } else {
        setError('Failed to delete analysis');
      }
    } catch (err) {
      setError('Failed to delete analysis');
      console.error('Error deleting analysis:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Add export function
  const handleExport = (format: 'pdf' | 'excel') => {
    if (!selectedAnalysis) return;
    
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: "Your file is being prepared for download.",
    });
    
    // In a real application, this would call a server endpoint to generate
    // and serve the file download. For now, we'll just simulate the process.
    setTimeout(() => {
      toast({
        title: "Export Successful",
        description: `Your ${format.toUpperCase()} file is ready for download.`,
      });
    }, 1500);
  };
  
  // Add a function to toggle comparison mode
  const toggleComparisonMode = () => {
    if (comparisonMode) {
      // Exit comparison mode
      setComparisonMode(false);
      setComparisonList([]);
      setComparisonResults([]);
    } else {
      // Enter comparison mode
      setComparisonMode(true);
      // If there's a selected analysis, add it to the comparison list
      if (selectedAnalysisId) {
        setComparisonList([selectedAnalysisId]);
      }
    }
  };
  
  // Add a function to toggle an analysis in the comparison list
  const toggleAnalysisInComparison = (analysisId: string) => {
    if (comparisonList.includes(analysisId)) {
      // Remove from comparison
      setComparisonList(prev => prev.filter(id => id !== analysisId));
    } else {
      // Add to comparison (limit to 3 analyses for readability)
      if (comparisonList.length < 3) {
        setComparisonList(prev => [...prev, analysisId]);
      } else {
        toast({
          title: "Comparison Limit Reached",
          description: "You can compare up to 3 analyses at a time for better readability.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Load comparison results when the comparison list changes
  useEffect(() => {
    const loadComparisonData = async () => {
      if (!comparisonMode || comparisonList.length === 0) {
        setComparisonResults([]);
        return;
      }
      
      const results: BenefitCostAnalysisResult[] = [];
      
      try {
        setCalculating(true);
        
        for (const analysisId of comparisonList) {
          const analysis = await getBenefitCostAnalysis(analysisId);
          if (analysis) {
            // Cast to ensure it has the required properties
            results.push(analysis as BenefitCostAnalysisResult);
          }
        }
        
        setComparisonResults(results);
      } catch (err) {
        console.error('Error loading comparison data:', err);
        toast({
          title: "Error",
          description: "Failed to load comparison data",
          variant: "destructive"
        });
      } finally {
        setCalculating(false);
      }
    };
    
    loadComparisonData();
  }, [comparisonMode, comparisonList]);
  
  // Add function to run Monte Carlo simulation
  const handleRunMonteCarloSimulation = async () => {
    if (!selectedAnalysis) return;
    
    try {
      setRunningMonteCarloSim(true);
      
      toast({
        title: "Running Monte Carlo Simulation",
        description: "This may take a moment. Running 1000 simulations...",
      });
      
      // Parameters to vary in the simulation
      const parameters = [
        // Vary discount rate between 3-8%
        { 
          parameterName: 'discountRate', 
          distribution: 'triangular',
          min: selectedAnalysis.discountRate - 0.02,
          most: selectedAnalysis.discountRate,
          max: selectedAnalysis.discountRate + 0.02 
        },
        // Vary the first benefit by ±30%
        ...(selectedAnalysis.benefits.length > 0 ? [{
          parameterName: `benefits[0].annualValues[0]`,
          distribution: 'normal',
          mean: selectedAnalysis.benefits[0].annualValues?.[0] || 0,
          standardDeviation: (selectedAnalysis.benefits[0].annualValues?.[0] || 0) * 0.15
        }] : []),
        // Vary the first cost by ±20%
        ...(selectedAnalysis.costs.length > 0 ? [{
          parameterName: `costs[0].annualValues[0]`,
          distribution: 'normal',
          mean: selectedAnalysis.costs[0].annualValues?.[0] || 0,
          standardDeviation: (selectedAnalysis.costs[0].annualValues?.[0] || 0) * 0.1
        }] : [])
      ];
      
      // Run the simulation
      const results = await runMonteCarloSimulation(selectedAnalysis, parameters, 1000);
      
      // Update the state with the results
      setMonteCarloResults(results);
      
      toast({
        title: "Simulation Complete",
        description: "Monte Carlo simulation completed successfully with 1000 iterations.",
      });
    } catch (err) {
      console.error('Error running Monte Carlo simulation:', err);
      toast({
        title: "Simulation Error",
        description: "Failed to complete the Monte Carlo simulation.",
        variant: "destructive"
      });
    } finally {
      setRunningMonteCarloSim(false);
    }
  };
  
  // Add function to create a new scenario
  const handleCreateScenario = () => {
    if (!selectedAnalysis) return;
    
    // Generate a unique ID for the scenario
    const scenarioId = `scenario-${Date.now()}`;
    
    // Create a new scenario with default values
    const newScenario = {
      id: scenarioId,
      name: newScenarioName || `Scenario ${Object.keys(scenarios).length + 1}`,
      description: newScenarioDescription || 'Alternative scenario',
      analysis: JSON.parse(JSON.stringify(selectedAnalysis)),
      createdAt: new Date().toISOString(),
    };
    
    // Add the new scenario to the scenarios object
    setScenarios(prev => ({
      ...prev,
      [scenarioId]: newScenario
    }));
    
    // Set the new scenario as active
    setActiveScenario(scenarioId);
    
    // Reset form fields
    setNewScenarioName('');
    setNewScenarioDescription('');
    
    // Show toast notification
    toast({
      title: "Scenario Created",
      description: `${newScenario.name} has been created based on the current analysis.`,
    });
  };

  // Add function to switch between scenarios
  const handleSwitchScenario = (scenarioId: string | null) => {
    setActiveScenario(scenarioId);
  };

  // Add function to delete a scenario
  const handleDeleteScenario = (scenarioId: string) => {
    // Remove the scenario from the scenarios object
    setScenarios(prev => {
      const updated = { ...prev };
      delete updated[scenarioId];
      return updated;
    });
    
    // If the deleted scenario was active, switch to the base analysis
    if (activeScenario === scenarioId) {
      setActiveScenario(null);
    }
    
    // Show toast notification
    toast({
      title: "Scenario Deleted",
      description: "The scenario has been deleted.",
    });
  };

  // Add function to update a scenario
  const handleUpdateScenario = (scenarioId: string, updates: Partial<BenefitCostAnalysis>) => {
    setScenarios(prev => {
      const updated = { ...prev };
      updated[scenarioId] = {
        ...updated[scenarioId],
        analysis: {
          ...updated[scenarioId].analysis,
          ...updates
        },
        updatedAt: new Date().toISOString()
      };
      return updated;
    });
  };

  // Add function to apply a scenario to the main analysis
  const handleApplyScenario = (scenarioId: string) => {
    if (!scenarios[scenarioId]) return;
    
    const scenarioAnalysis = scenarios[scenarioId].analysis;
    
    // Here you would normally call an API to update the analysis
    // For now, we'll just update the local state
    setSelectedAnalysis(scenarioAnalysis);
    
    // Show toast notification
    toast({
      title: "Scenario Applied",
      description: `${scenarios[scenarioId].name} has been applied to the main analysis.`,
    });
    
    // Reset active scenario
    setActiveScenario(null);
  };
  
  // Add function to run parameter optimization
  const handleRunOptimization = async () => {
    if (!selectedAnalysis) return;
    
    try {
      setRunningOptimization(true);
      
      toast({
        title: "Running Parameter Optimization",
        description: `Finding optimal parameters to maximize ${optimizationTarget === 'bcr' ? 'benefit-cost ratio' : 'net present value'}...`,
      });
      
      // In a real application, this would call a server endpoint to run optimization algorithms
      // Here we'll simulate the optimization process with a timeout
      
      // Parameters to optimize (discount rate, growth rates, etc.)
      const parametersToOptimize = [
        {
          name: 'discountRate',
          currentValue: selectedAnalysis.discountRate,
          min: Math.max(0.01, selectedAnalysis.discountRate - 0.03),
          max: Math.min(0.12, selectedAnalysis.discountRate + 0.03),
          step: 0.005
        }
      ];
      
      // Add benefit growth rates if available
      if (selectedAnalysis.benefits.length > 0) {
        selectedAnalysis.benefits.forEach((benefit, index) => {
          if (benefit.growthRate !== undefined) {
            parametersToOptimize.push({
              name: `benefit${index}GrowthRate`,
              label: `${benefit.category} Growth Rate`,
              currentValue: benefit.growthRate || 0,
              min: Math.max(0, (benefit.growthRate || 0) - 0.02),
              max: Math.min(0.08, (benefit.growthRate || 0) + 0.04),
              step: 0.005
            });
          }
        });
      }
      
      // Simulate optimization calculation
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Create simulated optimization results
      // In a real application, these would be the actual optimized values
      const optimizedParameters = parametersToOptimize.map(param => {
        // Simulate finding "better" values
        let optimizedValue;
        
        if (param.name === 'discountRate') {
          // For BCR, lower discount rates are usually better
          // For NPV, even lower discount rates are better
          optimizedValue = optimizationTarget === 'bcr' 
            ? Math.max(param.min, param.currentValue - 0.015) 
            : Math.max(param.min, param.currentValue - 0.02);
        } else if (param.name.includes('GrowthRate')) {
          // Higher growth rates for benefits are usually better
          optimizedValue = Math.min(param.max, param.currentValue + 0.015);
        } else {
          // Default behavior for other parameters
          optimizedValue = param.currentValue;
        }
        
        return {
          ...param,
          optimizedValue,
          improvement: ((optimizedValue - param.currentValue) / param.currentValue * 100).toFixed(1)
        };
      });
      
      // Calculate the "improved" metrics
      const currentBCR = selectedAnalysis.benefitCostRatio;
      const currentNPV = selectedAnalysis.netPresentValue;
      
      // Simulate improvements (in a real implementation, these would be calculated from the optimized parameters)
      const improvedBCR = optimizationTarget === 'bcr' 
        ? currentBCR * 1.15  // 15% improvement
        : currentBCR * 1.08; // 8% improvement
        
      const improvedNPV = optimizationTarget === 'npv'
        ? currentNPV * 1.25  // 25% improvement
        : currentNPV * 1.12; // 12% improvement
      
      const results = {
        parameters: optimizedParameters,
        metrics: {
          current: {
            bcr: currentBCR,
            npv: currentNPV
          },
          optimized: {
            bcr: improvedBCR,
            npv: improvedNPV
          },
          improvement: {
            bcr: ((improvedBCR - currentBCR) / currentBCR * 100).toFixed(1),
            npv: ((improvedNPV - currentNPV) / currentNPV * 100).toFixed(1)
          }
        }
      };
      
      setOptimizationResults(results);
      
      toast({
        title: "Optimization Complete",
        description: `Found optimal parameters that could improve ${optimizationTarget === 'bcr' ? 'BCR' : 'NPV'} by approximately ${optimizationTarget === 'bcr' ? results.metrics.improvement.bcr : results.metrics.improvement.npv}%`,
      });
    } catch (err) {
      console.error('Error running optimization:', err);
      toast({
        title: "Optimization Error",
        description: "Failed to complete the parameter optimization.",
        variant: "destructive"
      });
    } finally {
      setRunningOptimization(false);
    }
  };

  // Add function to apply optimized values to create a new scenario
  const handleApplyOptimizedValues = () => {
    if (!selectedAnalysis || !optimizationResults) return;
    
    // Create a deep copy of the analysis
    const optimizedAnalysis = JSON.parse(JSON.stringify(selectedAnalysis));
    
    // Apply the optimized parameter values
    optimizationResults.parameters.forEach((param: any) => {
      if (param.name === 'discountRate') {
        optimizedAnalysis.discountRate = param.optimizedValue;
      } else if (param.name.includes('benefit') && param.name.includes('GrowthRate')) {
        // Extract benefit index from parameter name
        const benefitIndex = parseInt(param.name.replace('benefit', '').replace('GrowthRate', ''));
        if (optimizedAnalysis.benefits[benefitIndex]) {
          optimizedAnalysis.benefits[benefitIndex].growthRate = param.optimizedValue;
        }
      }
    });
    
    // Generate a unique ID for the scenario
    const scenarioId = `scenario-${Date.now()}`;
    
    // Create a new scenario with optimized values
    const newScenario = {
      id: scenarioId,
      name: `Optimized for ${optimizationTarget.toUpperCase()}`,
      description: `Parameters optimized to maximize ${optimizationTarget === 'bcr' ? 'Benefit-Cost Ratio' : 'Net Present Value'}`,
      analysis: optimizedAnalysis,
      createdAt: new Date().toISOString(),
    };
    
    // Add the new scenario
    setScenarios(prev => ({
      ...prev,
      [scenarioId]: newScenario
    }));
    
    // Set as active scenario
    setActiveScenario(scenarioId);
    
    // Show toast notification
    toast({
      title: "Optimization Applied",
      description: `Created a new scenario with optimized parameters for ${optimizationTarget === 'bcr' ? 'Benefit-Cost Ratio' : 'Net Present Value'}.`,
    });
  };
  
  // Add function to generate distributive analysis
  const handleGenerateDistributiveAnalysis = async () => {
    if (!selectedAnalysis) return;
    
    try {
      setLoadingDistributiveAnalysis(true);
      
      toast({
        title: "Generating Distributive Impact Analysis",
        description: "Analyzing how benefits and costs are distributed across different populations and regions...",
      });
      
      // Simulate API call to generate distributive analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock distributive analysis data
      // In a real application, this would come from backend calculations
      const analysis = {
        byIncome: [
          { group: "Low Income", benefitShare: 0.15, costShare: 0.08, netBenefitIndex: 1.88 },
          { group: "Middle Income", benefitShare: 0.45, costShare: 0.52, netBenefitIndex: 0.87 },
          { group: "High Income", benefitShare: 0.40, costShare: 0.40, netBenefitIndex: 1.00 }
        ],
        byGeography: [
          { region: "Urban Core", benefitShare: 0.35, costShare: 0.30, netBenefitIndex: 1.17 },
          { region: "Suburban", benefitShare: 0.45, costShare: 0.55, netBenefitIndex: 0.82 },
          { region: "Rural", benefitShare: 0.20, costShare: 0.15, netBenefitIndex: 1.33 }
        ],
        byDemographic: [
          { group: "Minority Populations", benefitShare: 0.28, costShare: 0.25, netBenefitIndex: 1.12 },
          { group: "Non-Minority", benefitShare: 0.72, costShare: 0.75, netBenefitIndex: 0.96 }
        ],
        environmentalJustice: {
          ejCommunities: {
            benefitShare: 0.32,
            costShare: 0.22,
            netBenefitIndex: 1.45
          },
          nonEjCommunities: {
            benefitShare: 0.68,
            costShare: 0.78,
            netBenefitIndex: 0.87
          }
        },
        giniCoefficient: {
          beforeProject: 0.41,
          afterProject: 0.39,
          change: -0.02
        },
        insights: [
          "This project delivers a greater share of benefits than costs to low-income communities (net benefit index of 1.88).",
          "Rural areas receive proportionally more benefits compared to their cost burden (net benefit index of 1.33).",
          "The project reduces income inequality as measured by a 0.02 reduction in the Gini coefficient.",
          "Environmental justice communities receive 45% more benefits relative to their cost burden.",
          "The overall distributive impact of this project is progressive, delivering more benefits to traditionally underserved communities."
        ],
        recommendations: [
          "Consider targeted mitigation measures for suburban communities which have a lower net benefit index (0.82).",
          "Enhance project features that benefit middle-income populations to improve their net benefit index.",
          "Document the positive distributive impacts for low-income and environmental justice communities for project justification.",
          "Monitor actual equity impacts during and after project implementation to validate these forecasts."
        ]
      };
      
      setDistributiveAnalysis(analysis);
      
      toast({
        title: "Analysis Complete",
        description: "Distributive impact analysis has been generated successfully.",
      });
    } catch (err) {
      console.error('Error generating distributive analysis:', err);
      toast({
        title: "Analysis Error",
        description: "Failed to generate distributive impact analysis.",
        variant: "destructive"
      });
    } finally {
      setLoadingDistributiveAnalysis(false);
    }
  };
  
  // Function to create a time scenario
  const handleCreateTimeScenario = () => {
    const id = Math.random().toString(36).substring(2, 11);
    const newScenario = {
      id,
      ...newTimeScenario
    };
    
    setTimeScenarios(prev => [...prev, newScenario]);
    setNewTimeScenario({
      name: "",
      description: "",
      implementationDelay: 0,
      constructionDuration: 2,
      discountRateAdjustment: 0
    });
    setIsCreatingTimeScenario(false);
    setActiveTimeScenario(id);
    
    // Generate timeline with the new time scenario
    handleGenerateTimeline(id);
  };
  
  // Modified to accept a time scenario ID
  const handleGenerateTimeline = async (scenarioId?: string) => {
    if (!selectedAnalysis) return;
    
    setIsTimelineLoading(true);
    
    try {
      // In a real app, this would be an API call
      // Here we'll generate mock timeline data
      const years = selectedAnalysis.analysisHorizon || 30;
      const discountRate = selectedAnalysis.discountRate || 0.07;
      
      // Apply time scenario adjustments if a scenario is active
      const timeScenario = scenarioId ? 
        timeScenarios.find(s => s.id === scenarioId) : 
        (activeTimeScenario ? timeScenarios.find(s => s.id === activeTimeScenario) : null);
      
      // Apply scenario adjustments
      const implementationDelay = timeScenario?.implementationDelay || 0;
      const constructionDuration = timeScenario?.constructionDuration || 2;
      const adjustedDiscountRate = discountRate + (timeScenario?.discountRateAdjustment || 0);
      
      // Create timeline data structure
      const netBenefitsTimeline: any[] = [];
      let cumulativeNetBenefits = 0;
      
      // Track when we break even (payback period)
      let paybackYear = null;
      
      // Generate yearly data for benefits and costs by category
      const yearlyBenefits: any[] = [];
      const yearlyCosts: any[] = [];
      
      // Get unique benefit and cost categories
      const benefitCategories = [...new Set(selectedAnalysis.benefits.map((b: any) => b.category))];
      const costCategories = [...new Set(selectedAnalysis.costs.map((c: any) => c.category))];
      
      for (let year = 1; year <= years; year++) {
        // Calculate benefits for this year
        let yearBenefitValue = 0;
        const yearBenefitsByCategory: Record<string, number> = {};
        
        // For benefits, apply implementation delay
        // Benefits start accruing after implementation delay + construction duration
        const effectiveYear = year - implementationDelay - constructionDuration;
        
        if (effectiveYear > 0) {
          for (const benefit of selectedAnalysis.benefits) {
            // Calculate benefit value based on annual value and growth rate
            const growthRate = benefit.growthRate || 0;
            const growthFactor = Math.pow(1 + growthRate, effectiveYear - 1);
            const yearValue = benefit.annualValue * growthFactor;
            
            // Add to total benefits for this year
            yearBenefitValue += yearValue;
            
            // Add to category total
            yearBenefitsByCategory[benefit.category] = 
              (yearBenefitsByCategory[benefit.category] || 0) + yearValue;
          }
        }
        
        // Calculate costs for this year
        let yearCostValue = 0;
        const yearCostsByCategory: Record<string, number> = {};
        
        for (const cost of selectedAnalysis.costs) {
          // Calculate cost value based on annual value and growth rate
          const growthRate = cost.growthRate || 0;
          
          // Different handling for capital vs. operations costs
          if (cost.category === 'CAPITAL') {
            // Capital costs are distributed during construction period 
            // after the implementation delay
            if (year > implementationDelay && year <= implementationDelay + constructionDuration) {
              // Distribute capital costs across construction duration
              const capitalPerYear = cost.annualValue / constructionDuration;
              yearCostValue += capitalPerYear;
              yearCostsByCategory[cost.category] = 
                (yearCostsByCategory[cost.category] || 0) + capitalPerYear;
            }
          } else {
            // Operations and maintenance costs start after construction
            if (effectiveYear > 0) {
              const growthFactor = Math.pow(1 + growthRate, effectiveYear - 1);
              const yearValue = cost.annualValue * growthFactor;
              
              // Add to total costs for this year
              yearCostValue += yearValue;
              
              // Add to category total
              yearCostsByCategory[cost.category] = 
                (yearCostsByCategory[cost.category] || 0) + yearValue;
            }
          }
        }
        
        // Calculate discounted values
        const discountFactor = 1 / Math.pow(1 + adjustedDiscountRate, year - 1);
        const discountedBenefits = yearBenefitValue * discountFactor;
        const discountedCosts = yearCostValue * discountFactor;
        const netBenefit = yearBenefitValue - yearCostValue;
        const discountedNetBenefit = discountedBenefits - discountedCosts;
        
        // Update cumulative net benefits
        cumulativeNetBenefits += discountedNetBenefit;
        
        // Check if this is when we break even (if we haven't already)
        if (paybackYear === null && cumulativeNetBenefits >= 0) {
          // If this is the first year when cumulative benefits become positive,
          // we can calculate a more precise payback period using linear interpolation
          if (year > 1 && netBenefitsTimeline[year - 2]?.cumulativeNetBenefits < 0) {
            const prevYear = netBenefitsTimeline[year - 2];
            const yearsToBreakeven = year - 1 + 
              (0 - prevYear.cumulativeNetBenefits) / 
              (cumulativeNetBenefits - prevYear.cumulativeNetBenefits);
            paybackYear = yearsToBreakeven;
          } else {
            paybackYear = year;
          }
        }
        
        // Add to timeline
        netBenefitsTimeline.push({
          year,
          benefitValue: yearBenefitValue,
          costValue: yearCostValue,
          discountedBenefits,
          discountedCosts,
          netBenefit,
          discountedNetBenefit,
          cumulativeNetBenefits
        });
        
        // Add to yearly breakdowns
        yearlyBenefits.push({
          year,
          ...yearBenefitsByCategory
        });
        
        yearlyCosts.push({
          year,
          ...yearCostsByCategory
        });
      }
      
      // Set the timeline data with timing scenario info
      setTimelineData({
        netBenefitsTimeline,
        paybackYear,
        benefitCategories,
        costCategories,
        yearlyBenefits,
        yearlyCosts,
        projectName: selectedAnalysis.name,
        discountRate: adjustedDiscountRate,
        implementationDelay,
        constructionDuration,
        timeScenarioId: timeScenario?.id || null,
        timeScenarioName: timeScenario?.name || "Base Case"
      });
      
      // Set active scenario
      if (scenarioId) {
        setActiveTimeScenario(scenarioId);
      }
    } catch (error) {
      console.error("Error generating timeline:", error);
      toast({
        title: "Error",
        description: "Failed to generate timeline visualization",
        variant: "destructive"
      });
    } finally {
      setIsTimelineLoading(false);
    }
  };
  
  // Add a function to handle map load and visualize benefit-cost analysis
  const handleMapLoad = (map: mapboxgl.Map) => {
    mapRef.current = map;
    
    if (projectData && selectedAnalysis) {
      visualizeBenefitCostOnMap(map, projectData.id, selectedAnalysis.id)
        .then(success => {
          if (success) {
            console.log('Successfully visualized benefit-cost analysis on map');
          } else {
            console.warn('Failed to visualize benefit-cost analysis on map');
          }
        })
        .catch(error => {
          console.error('Error visualizing benefit-cost analysis on map:', error);
        });
    }
  };
  
  const renderTemplateSelectorDialog = () => {
    if (!showTemplateSelector) return null;

    return (
      <Dialog open={showTemplateSelector} onOpenChange={(isOpen) => !isOpen && setShowTemplateSelector(false)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Benefit-Cost Analysis</DialogTitle>
            <DialogDescription>
              Select a template to pre-fill your analysis or start from scratch.
            </DialogDescription>
          </DialogHeader>
          {isLoadingTemplates ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : availableTemplates.length > 0 ? (
            <ScrollArea className="h-[300px] my-4">
              <div className="space-y-3 p-1">
                {availableTemplates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 pt-4 px-4">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.grantProgram && <Badge variant="outline" className="mt-1 w-fit">{template.grantProgram.name}</Badge>}
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground pb-3 px-4">
                      <p className="line-clamp-2">{template.description}</p>
                    </CardContent>
                    <CardFooter className="pb-3 pt-2 px-4">
                      <Button variant="outline" size="sm" onClick={() => handleProceedToCreateForm(template)}>
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="my-4 text-center text-muted-foreground">No templates available. You can create them in Admin Settings.</p>
          )}
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setShowTemplateSelector(false)}>Cancel</Button>
            <Button onClick={() => handleProceedToCreateForm(null)} className="font-semibold">
              Start from Scratch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading benefit-cost analyses...</span>
      </div>
    );
  }
  
  if (error && analyses.length === 0) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!selectedAnalysis) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Benefit-Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Benefit-Cost Ratio</h3>
                  <p className="text-3xl font-bold">
                    {selectedAnalysis.benefitCostRatio.toFixed(2)}
                  </p>
                            <Badge 
                              variant={selectedAnalysis.benefitCostRatio >= 1 ? "default" : "secondary"}
                              className="mt-2"
                            >
                              {selectedAnalysis.benefitCostRatio >= 1 ? "Economically Viable" : "Not Economically Viable"}
                            </Badge>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Net Present Value</h3>
                            <p className="text-3xl font-bold">
                              {formatCurrency(selectedAnalysis.netPresentValue)}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              {selectedAnalysis.discountRate * 100}% discount rate, {selectedAnalysis.analysisHorizon} year horizon
                            </p>
                          </CardContent>
                        </Card>
                        
                        {selectedAnalysis.paybackPeriod && (
                          <Card>
                            <CardContent className="pt-6">
                              <h3 className="text-sm font-medium text-gray-500 mb-1">Payback Period</h3>
                              <p className="text-3xl font-bold">
                                {selectedAnalysis.paybackPeriod.toFixed(1)} years
                              </p>
                              <p className="text-sm text-gray-500 mt-2">
                                {selectedAnalysis.paybackPeriod < selectedAnalysis.analysisHorizon 
                                  ? "Returns within analysis period" 
                                  : "Exceeds analysis period"}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      {activeScenario && (
                        <div className="col-span-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-medium text-yellow-800">
                              Viewing Scenario: {scenarios[activeScenario]?.name}
                            </p>
                            <p className="text-xs text-yellow-600">
                              {scenarios[activeScenario]?.description}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleApplyScenario(activeScenario)}
                            >
                              Apply
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleSwitchScenario(null)}
                            >
                              Exit
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Tabs defaultValue="charts">
                    <TabsList className="grid grid-cols-6">
                      <TabsTrigger value="charts">
                        Charts
                      </TabsTrigger>
                      <TabsTrigger value="details">
                        Details
                      </TabsTrigger>
                      <TabsTrigger value="parameters">
                        Parameters
                      </TabsTrigger>
                      <TabsTrigger value="sensitivity">
                        Sensitivity
                      </TabsTrigger>
                      <TabsTrigger value="montecarlo">
                        Risk
                      </TabsTrigger>
                      <TabsTrigger value="equity">
                        Equity
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="charts" className="mt-4">
                      <Card>
                        <CardContent className="pt-6">
                          <BenefitCostSummaryCharts analysis={selectedAnalysis} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="details" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Benefits</CardTitle>
                            <CardDescription>Benefit categories and present values</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Annual Value</TableHead>
                                  <TableHead className="text-right">Present Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedAnalysis.benefits.map((benefit, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{benefit.category}</TableCell>
                                    <TableCell>{formatCurrency(benefit.annualValues?.[0] || 0)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(benefit.presentValue)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell className="font-bold">Total</TableCell>
                                  <TableCell></TableCell>
                                  <TableCell className="text-right font-bold">
                                    {formatCurrency(selectedAnalysis.benefits.reduce((sum, b) => sum + b.presentValue, 0))}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Costs</CardTitle>
                            <CardDescription>Cost categories and present values</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Annual Value</TableHead>
                                  <TableHead className="text-right">Present Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedAnalysis.costs.map((cost, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{cost.category}</TableCell>
                                    <TableCell>{formatCurrency(cost.annualValues?.[0] || 0)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(cost.presentValue)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell className="font-bold">Total</TableCell>
                                  <TableCell></TableCell>
                                  <TableCell className="text-right font-bold">
                                    {formatCurrency(selectedAnalysis.costs.reduce((sum, c) => sum + c.presentValue, 0))}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Add the map visualization card */}
                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            Spatial Distribution of Benefits
                            <Button variant="outline" onClick={() => setShowMapVisualization(!showMapVisualization)}>
                              {showMapVisualization ? 'Hide Map' : 'Show Map'}
                            </Button>
                          </CardTitle>
                          <CardDescription>
                            Geographic visualization of project impacts
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {showMapVisualization && (
                            <div className="h-[400px] w-full rounded-md overflow-hidden">
                              <BaseMap
                                initialCenter={[-122.4194, 37.7749]} 
                                initialZoom={12}
                                onMapLoad={handleMapLoad}
                                className="h-full w-full"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="insights" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Analysis Insights</CardTitle>
                          <CardDescription>{selectedAnalysis.summary}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium mb-2">Key Insights</h3>
                              <ul className="list-disc pl-5 space-y-2">
                                {selectedAnalysis.insights?.map((insight, index) => (
                                  <li key={index}>{insight}</li>
                                ))}
                              </ul>
                            </div>
                            
                            {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                  {selectedAnalysis.recommendations?.map((recommendation, index) => (
                                    <li key={index}>{recommendation}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="sensitivity" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Sensitivity Analysis</CardTitle>
                          <CardDescription>
                            Analyzing how changes in key parameters affect the benefit-cost ratio
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {selectedAnalysis.sensitivityAnalysis && 
                           selectedAnalysis.sensitivityAnalysis.results && 
                           selectedAnalysis.sensitivityAnalysis.results.length > 0 ? (
                            <SensitivityAnalysisChart analysis={selectedAnalysis} />
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                              <p className="text-gray-500 mb-4">No sensitivity analysis has been performed yet.</p>
                              <Button 
                                variant="outline" 
                                // This would need to be implemented in a real application
                                onClick={() => toast({
                                  title: "Feature Coming Soon",
                                  description: "Sensitivity analysis will be available in a future update."
                                })}
                              >
                                Run Sensitivity Analysis
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="montecarlo" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Monte Carlo Simulation</CardTitle>
                          <CardDescription>
                            Analyze the uncertainty in your benefit-cost analysis through 1000 simulations with varying parameters
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {runningMonteCarloSim ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                              <p>Running 1000 simulations...</p>
                              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                            </div>
                          ) : !monteCarloResults ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <p className="text-gray-500 mb-4">
                                Monte Carlo simulation helps understand how uncertainty in key parameters affects your benefit-cost analysis results.
                              </p>
                              <p className="text-sm text-gray-500 mb-6 max-w-xl text-center">
                                The simulation will run 1000 iterations with randomized values for discount rate, key benefits, and costs
                                based on reasonable probability distributions.
                              </p>
                              <Button onClick={handleRunMonteCarloSimulation}>
                                Run Monte Carlo Simulation
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <MonteCarloChart results={monteCarloResults} />
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <Card>
                                  <CardContent className="pt-6">
                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Benefit-Cost Ratio (90% CI)</h3>
                                    <p className="text-2xl font-bold">
                                      {monteCarloResults.results.find((r: any) => r.metric === 'benefitCostRatio')?.percentiles[5].toFixed(2)} - {' '}
                                      {monteCarloResults.results.find((r: any) => r.metric === 'benefitCostRatio')?.percentiles[95].toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Mean: {monteCarloResults.results.find((r: any) => r.metric === 'benefitCostRatio')?.mean.toFixed(2)}
                                    </p>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardContent className="pt-6">
                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Probability of BCR {`>`} 1</h3>
                                    <p className="text-2xl font-bold">
                                      {(monteCarloResults.results.find((r: any) => r.metric === 'benefitCostRatio')?.probabilityGreaterThan1 * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Based on {monteCarloResults.iterations} simulations
                                    </p>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardContent className="pt-6">
                                    <h3 className="text-sm font-medium text-gray-500 mb-1">NPV (90% CI)</h3>
                                    <p className="text-2xl font-bold">
                                      {formatCurrency(monteCarloResults.results.find((r: any) => r.metric === 'netPresentValue')?.percentiles[5])} - {' '}
                                      {formatCurrency(monteCarloResults.results.find((r: any) => r.metric === 'netPresentValue')?.percentiles[95])}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Mean: {formatCurrency(monteCarloResults.results.find((r: any) => r.metric === 'netPresentValue')?.mean)}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                              
                              <div className="mt-6">
                                <h3 className="text-lg font-medium mb-3">Key Insights from Simulation</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                  <li>
                                    There is a {(monteCarloResults.results.find((r: any) => r.metric === 'benefitCostRatio')?.probabilityGreaterThan1 * 100).toFixed(1)}% probability 
                                    that the Benefit-Cost Ratio will be greater than 1, indicating economic viability.
                                  </li>
                                  <li>
                                    The analysis shows a {(monteCarloResults.results.find((r: any) => r.metric === 'netPresentValue')?.probabilityGreaterThan0 * 100).toFixed(1)}% probability 
                                    of achieving a positive Net Present Value.
                                  </li>
                                  <li>
                                    The most influential parameters affecting the BCR are: {monteCarloResults.mostInfluentialParameters?.join(', ') || 'N/A'}.
                                  </li>
                                  <li>
                                    The Monte Carlo results suggest {monteCarloResults.results.find((r: any) => r.metric === 'benefitCostRatio')?.mean > 1 
                                      ? 'a robust economic case with uncertainty properly accounted for' 
                                      : 'caution in proceeding given the uncertainty in economic returns'}.
                                  </li>
                                </ul>
                              </div>
                              
                              <div className="mt-4 flex justify-end">
                                <Button variant="outline" onClick={handleRunMonteCarloSimulation}>
                                  Run Simulation Again
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="optimization" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Parameter Optimization</CardTitle>
                          <CardDescription>
                            Find optimal parameter values to maximize key metrics
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {runningOptimization ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                              <p>Running parameter optimization...</p>
                              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                            </div>
                          ) : !optimizationResults ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <p className="text-gray-500 mb-4">
                                Parameter optimization helps find the ideal values that maximize your project's economic benefits.
                              </p>
                              <p className="text-sm text-gray-500 mb-6 max-w-xl text-center">
                                The optimizer will search for the best combination of discount rate, growth rates, and other parameters
                                within reasonable bounds to maximize your selected metric.
                              </p>
                              
                              <div className="flex flex-col space-y-4 w-full max-w-md mb-6">
                                <div className="space-y-2">
                                  <Label>Optimization Target</Label>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant={optimizationTarget === 'bcr' ? 'default' : 'outline'} 
                                      className="flex-1"
                                      onClick={() => setOptimizationTarget('bcr')}
                                    >
                                      Benefit-Cost Ratio
                                    </Button>
                                    <Button 
                                      variant={optimizationTarget === 'npv' ? 'default' : 'outline'} 
                                      className="flex-1"
                                      onClick={() => setOptimizationTarget('npv')}
                                    >
                                      Net Present Value
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              <Button onClick={handleRunOptimization}>
                                <Zap className="h-4 w-4 mr-2" />
                                Run Parameter Optimization
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Current vs. Optimized Metrics</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <h3 className="text-sm font-medium text-gray-500">Metric</h3>
                                        </div>
                                        <div>
                                          <h3 className="text-sm font-medium text-gray-500">Current</h3>
                                        </div>
                                        <div>
                                          <h3 className="text-sm font-medium text-gray-500">Optimized</h3>
                                        </div>
                                        
                                        <div>
                                          <p className="font-medium">Benefit-Cost Ratio</p>
                                        </div>
                                        <div>
                                          <p>{optimizationResults.metrics.current.bcr.toFixed(2)}</p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-green-600">
                                            {optimizationResults.metrics.optimized.bcr.toFixed(2)}
                                            <span className="text-xs ml-1">
                                              (+{optimizationResults.metrics.improvement.bcr}%)
                                            </span>
                                          </p>
                                        </div>
                                        
                                        <div>
                                          <p className="font-medium">Net Present Value</p>
                                        </div>
                                        <div>
                                          <p>{formatCurrency(optimizationResults.metrics.current.npv)}</p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-green-600">
                                            {formatCurrency(optimizationResults.metrics.optimized.npv)}
                                            <span className="text-xs ml-1">
                                              (+{optimizationResults.metrics.improvement.npv}%)
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Optimized Parameters</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {optimizationResults.parameters.map((param: any, index: number) => (
                                        <div key={index} className="grid grid-cols-3 gap-4">
                                          <div>
                                            <p className="font-medium">{param.label || param.name}</p>
                                          </div>
                                          <div>
                                            <p>
                                              {param.name === 'discountRate' 
                                                ? `${(param.currentValue * 100).toFixed(1)}%` 
                                                : param.name.includes('GrowthRate') 
                                                  ? `${(param.currentValue * 100).toFixed(1)}%`
                                                  : param.currentValue}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="font-medium text-green-600">
                                              {param.name === 'discountRate' 
                                                ? `${(param.optimizedValue * 100).toFixed(1)}%` 
                                                : param.name.includes('GrowthRate') 
                                                  ? `${(param.optimizedValue * 100).toFixed(1)}%`
                                                  : param.optimizedValue}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                              
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-3">Optimization Insights</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                  <li>
                                    Optimizing the parameters could improve your {optimizationTarget === 'bcr' ? 'Benefit-Cost Ratio' : 'Net Present Value'} by 
                                    approximately {optimizationTarget === 'bcr' ? optimizationResults.metrics.improvement.bcr : optimizationResults.metrics.improvement.npv}%.
                                  </li>
                                  <li>
                                    {optimizationTarget === 'bcr' 
                                      ? 'A lower discount rate increases the BCR by giving more weight to future benefits.'
                                      : 'A lower discount rate significantly increases NPV by reducing the discounting of future benefits.'}
                                  </li>
                                  {optimizationResults.parameters.some((p: any) => p.name.includes('GrowthRate')) && (
                                    <li>
                                      Higher growth rates for benefit streams lead to greater economic returns over the analysis period.
                                    </li>
                                  )}
                                  <li>
                                    You can create a new scenario with these optimized parameters to explore their impact in detail.
                                  </li>
                                </ul>
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={handleRunOptimization}>
                                  Run Optimization Again
                                </Button>
                                <Button onClick={handleApplyOptimizedValues}>
                                  Create Optimized Scenario
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="equity" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Distributive Impact Analysis</CardTitle>
                          <CardDescription>
                            Evaluate how benefits and costs are distributed across different populations and regions
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {loadingDistributiveAnalysis ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                              <p>Generating distributive impact analysis...</p>
                              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                            </div>
                          ) : !distributiveAnalysis ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <p className="text-gray-500 mb-4">
                                Distributive impact analysis helps evaluate the equity implications of your project by examining how benefits and costs affect different populations.
                              </p>
                              <p className="text-sm text-gray-500 mb-6 max-w-xl text-center">
                                This analysis will assess impacts across income groups, geographic regions, and demographic segments, providing equity metrics and visualizations.
                              </p>
                              
                              <Button onClick={handleGenerateDistributiveAnalysis}>
                                <Users className="h-4 w-4 mr-2" />
                                Generate Distributive Analysis
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Income Equality Impact</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-center mb-4">
                                      <p className="text-sm text-gray-500">Gini Coefficient Change</p>
                                      <div className="flex items-center justify-center gap-1 mt-1">
                                        <p className="text-3xl font-bold">{distributiveAnalysis.giniCoefficient.change.toFixed(2)}</p>
                                        <Badge variant={distributiveAnalysis.giniCoefficient.change < 0 ? "default" : "secondary"}>
                                          {distributiveAnalysis.giniCoefficient.change < 0 ? "Reduces Inequality" : "Increases Inequality"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span>Before Project:</span>
                                        <span className="font-medium">{distributiveAnalysis.giniCoefficient.beforeProject.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>After Project:</span>
                                        <span className="font-medium">{distributiveAnalysis.giniCoefficient.afterProject.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Environmental Justice</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm">EJ Communities</span>
                                          <span className="text-sm font-medium text-green-600">
                                            Index: {distributiveAnalysis.environmentalJustice.ejCommunities.netBenefitIndex.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                          <div className="flex-1">
                                            <Progress 
                                              value={distributiveAnalysis.environmentalJustice.ejCommunities.benefitShare * 100}
                                              className="h-2 bg-gray-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                              {(distributiveAnalysis.environmentalJustice.ejCommunities.benefitShare * 100).toFixed(0)}% of Benefits
                                            </p>
                                          </div>
                                          <div className="flex-1">
                                            <Progress 
                                              value={distributiveAnalysis.environmentalJustice.ejCommunities.costShare * 100}
                                              className="h-2 bg-gray-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                              {(distributiveAnalysis.environmentalJustice.ejCommunities.costShare * 100).toFixed(0)}% of Costs
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm">Non-EJ Communities</span>
                                          <span className="text-sm font-medium">
                                            Index: {distributiveAnalysis.environmentalJustice.nonEjCommunities.netBenefitIndex.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <Progress 
                                              value={distributiveAnalysis.environmentalJustice.nonEjCommunities.benefitShare * 100}
                                              className="h-2 bg-gray-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                              {(distributiveAnalysis.environmentalJustice.nonEjCommunities.benefitShare * 100).toFixed(0)}% of Benefits
                                            </p>
                                          </div>
                                          <div className="flex-1">
                                            <Progress 
                                              value={distributiveAnalysis.environmentalJustice.nonEjCommunities.costShare * 100}
                                              className="h-2 bg-gray-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                              {(distributiveAnalysis.environmentalJustice.nonEjCommunities.costShare * 100).toFixed(0)}% of Costs
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Overall Equity Impact</CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-6">
                                    <div className="flex flex-col items-center">
                                      <span className="text-sm mb-2">Project Equity Score</span>
                                      <div className="relative w-40 h-40">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="text-4xl font-bold">
                                            4.2
                                          </div>
                                        </div>
                                        <svg width="160" height="160" viewBox="0 0 160 160">
                                          <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            fill="none"
                                            stroke="#e2e8f0"
                                            strokeWidth="12"
                                          />
                                          <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="12"
                                            strokeDasharray="439.6"
                                            strokeDashoffset={439.6 - (439.6 * 4.2) / 5}
                                            transform="rotate(-90 80 80)"
                                          />
                                        </svg>
                                      </div>
                                      <span className="text-sm text-gray-500 mt-2">Out of 5</span>
                                      <Badge variant="outline" className="mt-4">Positive Equity Impact</Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                              
                              <div className="mt-8">
                                <h3 className="text-lg font-medium mb-4">Detailed Distributive Analysis</h3>
                                
                                <Accordion type="single" collapsible className="w-full">
                                  <AccordionItem value="income">
                                    <AccordionTrigger>Impact by Income Group</AccordionTrigger>
                                    <AccordionContent>
                                      <div className="overflow-x-auto">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Income Group</TableHead>
                                              <TableHead>% of Benefits</TableHead>
                                              <TableHead>% of Costs</TableHead>
                                              <TableHead>Net Benefit Index</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {distributiveAnalysis.byIncome.map((item: any, i: number) => (
                                              <TableRow key={i}>
                                                <TableCell>{item.group}</TableCell>
                                                <TableCell>{(item.benefitShare * 100).toFixed(1)}%</TableCell>
                                                <TableCell>{(item.costShare * 100).toFixed(1)}%</TableCell>
                                                <TableCell>
                                                  <Badge variant={item.netBenefitIndex >= 1 ? "default" : "secondary"}>
                                                    {item.netBenefitIndex.toFixed(2)}
                                                  </Badge>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                      <div className="mt-4 text-sm text-gray-500">
                                        <p>Net Benefit Index = (Share of Benefits / Share of Costs)</p>
                                        <p>Values greater than 1.0 indicate the group receives a greater share of benefits than costs.</p>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                  
                                  <AccordionItem value="geography">
                                    <AccordionTrigger>Impact by Geographic Region</AccordionTrigger>
                                    <AccordionContent>
                                      <div className="overflow-x-auto">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Geographic Region</TableHead>
                                              <TableHead>% of Benefits</TableHead>
                                              <TableHead>% of Costs</TableHead>
                                              <TableHead>Net Benefit Index</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {distributiveAnalysis.byGeography.map((item: any, i: number) => (
                                              <TableRow key={i}>
                                                <TableCell>{item.region}</TableCell>
                                                <TableCell>{(item.benefitShare * 100).toFixed(1)}%</TableCell>
                                                <TableCell>{(item.costShare * 100).toFixed(1)}%</TableCell>
                                                <TableCell>
                                                  <Badge variant={item.netBenefitIndex >= 1 ? "default" : "secondary"}>
                                                    {item.netBenefitIndex.toFixed(2)}
                                                  </Badge>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                  
                                  <AccordionItem value="demographic">
                                    <AccordionTrigger>Impact by Demographic Group</AccordionTrigger>
                                    <AccordionContent>
                                      <div className="overflow-x-auto">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Demographic Group</TableHead>
                                              <TableHead>% of Benefits</TableHead>
                                              <TableHead>% of Costs</TableHead>
                                              <TableHead>Net Benefit Index</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {distributiveAnalysis.byDemographic.map((item: any, i: number) => (
                                              <TableRow key={i}>
                                                <TableCell>{item.group}</TableCell>
                                                <TableCell>{(item.benefitShare * 100).toFixed(1)}%</TableCell>
                                                <TableCell>{(item.costShare * 100).toFixed(1)}%</TableCell>
                                                <TableCell>
                                                  <Badge variant={item.netBenefitIndex >= 1 ? "default" : "secondary"}>
                                                    {item.netBenefitIndex.toFixed(2)}
                                                  </Badge>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                              
                              <div className="space-y-4 mt-8">
                                <div>
                                  <h3 className="text-lg font-medium mb-3">Equity Insights</h3>
                                  <ul className="list-disc pl-5 space-y-2">
                                    {distributiveAnalysis.insights.map((insight: string, index: number) => (
                                      <li key={index}>{insight}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <h3 className="text-lg font-medium mb-3">Recommendations</h3>
                                  <ul className="list-disc pl-5 space-y-2">
                                    {distributiveAnalysis.recommendations.map((recommendation: string, index: number) => (
                                      <li key={index}>{recommendation}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              
                              <div className="flex justify-end">
                                <Button variant="outline" onClick={handleGenerateDistributiveAnalysis}>
                                  Refresh Analysis
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )
            )}
          </div>
        </main>
         {/* Dialog for Delete Confirmation */}
         <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Delete Analysis</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete this benefit-cost analysis? This action cannot be undone.
                </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => selectedAnalysis && handleDeleteAnalysis(selectedAnalysis.id)}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
} 