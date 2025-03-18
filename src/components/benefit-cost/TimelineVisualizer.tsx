import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { CalendarDays, Clock, Check, Plus as PlusIcon, ArrowLeftRight, AlertTriangle, HelpCircle, BarChart3, Trash2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TimelineChart } from "./TimelineChart";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Line, 
  ReferenceLine, 
  Bar,
  BarChart
} from "@/components/ui/chart";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface TimeScenario {
  id: string;
  name: string;
  description: string;
  implementationDelay: number;
  constructionDuration: number;
  discountRateAdjustment: number;
}

interface RiskFactor {
  id: string;
  name: string;
  category: 'cost' | 'benefit' | 'timing';
  probability: number; // 0-1
  impact: number; // 1-5
  description: string;
}

interface TimelineVisualizerProps {
  selectedAnalysis: any;
}

export function TimelineVisualizer({ selectedAnalysis }: TimelineVisualizerProps) {
  const { toast } = useToast();
  const [timelineData, setTimelineData] = useState<any>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  
  // State for time-based scenarios
  const [timeScenarios, setTimeScenarios] = useState<TimeScenario[]>([]);
  const [activeTimeScenario, setActiveTimeScenario] = useState<string | null>(null);
  const [isCreatingTimeScenario, setIsCreatingTimeScenario] = useState(false);
  const [newTimeScenario, setNewTimeScenario] = useState<Omit<TimeScenario, 'id'>>({
    name: "",
    description: "",
    implementationDelay: 0,
    constructionDuration: 2,
    discountRateAdjustment: 0
  });

  // Add state for comparison mode
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [comparisonScenarios, setComparisonScenarios] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<Record<string, any>>({});

  // Add risk analysis state and types
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([
    {
      id: 'risk-1',
      name: 'Construction Delays',
      category: 'timing',
      probability: 0.4,
      impact: 4,
      description: 'Potential delays in construction due to permitting or contractor issues'
    },
    {
      id: 'risk-2',
      name: 'Cost Overruns',
      category: 'cost',
      probability: 0.35,
      impact: 3,
      description: 'Potential for construction costs to exceed original estimates'
    },
    {
      id: 'risk-3',
      name: 'Lower Ridership',
      category: 'benefit',
      probability: 0.3,
      impact: 4,
      description: 'Risk of lower than projected ridership or usage'
    },
    {
      id: 'risk-4',
      name: 'Technology Changes',
      category: 'benefit',
      probability: 0.25,
      impact: 2,
      description: 'Changes in technology that may affect long-term benefits'
    },
    {
      id: 'risk-5',
      name: 'Regulatory Changes',
      category: 'timing',
      probability: 0.2,
      impact: 3,
      description: 'Potential changes in regulations that could delay implementation'
    }
  ]);
  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [newRiskFactor, setNewRiskFactor] = useState<Omit<RiskFactor, 'id'>>({
    name: '',
    category: 'cost',
    probability: 0.3,
    impact: 3,
    description: ''
  });

  // Function to create a time scenario
  const handleCreateTimeScenario = () => {
    if (!newTimeScenario.name) {
      toast({
        title: "Name Required",
        description: "Please provide a name for the scenario",
        variant: "destructive"
      });
      return;
    }

    const id = Math.random().toString(36).substring(2, 11);
    const scenario: TimeScenario = {
      id,
      ...newTimeScenario
    };
    
    setTimeScenarios(prev => [...prev, scenario]);
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

  // Generate timeline data for the selected analysis
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
      let paybackYear: number | null = null;
      
      // Generate yearly data for benefits and costs by category
      const yearlyBenefits: any[] = [];
      const yearlyCosts: any[] = [];
      
      // Get unique benefit and cost categories
      const benefitCategories = Array.from(new Set(selectedAnalysis.benefits.map((b: any) => b.category)));
      const costCategories = Array.from(new Set(selectedAnalysis.costs.map((c: any) => c.category)));
      
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

  // Format currency for display
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Add function to toggle comparison mode
  const toggleComparisonMode = () => {
    if (isComparisonMode) {
      // Exit comparison mode
      setIsComparisonMode(false);
      setComparisonScenarios([]);
      setComparisonData({});
    } else {
      // Enter comparison mode, add current scenario as first comparison
      setIsComparisonMode(true);
      const baseScenarioId = activeTimeScenario || 'base';
      setComparisonScenarios([baseScenarioId]);
      
      // Generate base data if not already done
      if (baseScenarioId === 'base' && !timelineData) {
        handleGenerateTimeline();
      }
      
      // Add current timeline data to comparison
      if (timelineData) {
        setComparisonData({
          [baseScenarioId]: {
            ...timelineData,
            name: activeTimeScenario 
              ? timeScenarios.find(s => s.id === activeTimeScenario)?.name || 'Scenario'
              : 'Base Case'
          }
        });
      }
    }
  };

  // Add function to toggle a scenario in comparison
  const toggleScenarioInComparison = async (scenarioId: string) => {
    // If already in comparison, remove it
    if (comparisonScenarios.includes(scenarioId)) {
      setComparisonScenarios(prev => prev.filter(id => id !== scenarioId));
      setComparisonData(prev => {
        const newData = {...prev};
        delete newData[scenarioId];
        return newData;
      });
      return;
    }
    
    // Otherwise add it to comparison
    setComparisonScenarios(prev => [...prev, scenarioId]);
    
    // Generate data for this scenario if not already generated
    if (!comparisonData[scenarioId]) {
      // Save current timeline data
      const currentData = timelineData;
      const currentScenario = activeTimeScenario;
      
      // Generate data for the new scenario
      await handleGenerateTimeline(scenarioId);
      
      // After generating, save it to comparison data
      if (timelineData) {
        setComparisonData(prev => ({
          ...prev,
          [scenarioId]: {
            ...timelineData,
            name: scenarioId === 'base' 
              ? 'Base Case'
              : timeScenarios.find(s => s.id === scenarioId)?.name || 'Scenario'
          }
        }));
      }
      
      // Restore previous data if not in comparison mode
      if (currentScenario !== scenarioId) {
        setTimelineData(currentData);
        setActiveTimeScenario(currentScenario);
      }
    }
  };

  // Add function to add a new risk factor
  const handleAddRiskFactor = () => {
    if (!newRiskFactor.name) {
      toast({
        title: "Name Required",
        description: "Please provide a name for the risk factor",
        variant: "destructive"
      });
      return;
    }

    const id = `risk-${Math.random().toString(36).substring(2, 11)}`;
    const riskFactor: RiskFactor = {
      id,
      ...newRiskFactor
    };
    
    setRiskFactors(prev => [...prev, riskFactor]);
    setNewRiskFactor({
      name: '',
      category: 'cost',
      probability: 0.3,
      impact: 3,
      description: ''
    });
    setIsAddingRisk(false);
  };

  // Add function to delete a risk factor
  const handleDeleteRiskFactor = (id: string) => {
    setRiskFactors(prev => prev.filter(risk => risk.id !== id));
  };

  // Add function to calculate risk score
  const calculateRiskScore = (risk: RiskFactor) => {
    return risk.probability * risk.impact;
  };

  // Add function to get risk color based on score
  const getRiskColor = (risk: string | number) => {
    // If risk is a string (like "Low", "Medium", "High")
    if (typeof risk === 'string') {
      switch (risk) {
        case 'Low': return 'bg-green-100 border-green-300 text-green-800';
        case 'Medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        case 'High': return 'bg-red-100 border-red-300 text-red-800';
        default: return 'bg-gray-100 border-gray-300 text-gray-800';
      }
    }
    
    // If risk is a number
    if (risk < 3) return 'bg-green-100 border-green-300 text-green-800';
    if (risk < 6) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-red-100 border-red-300 text-red-800';
  };

  // Add function to calculate overall risk rating for the project
  const calculateOverallRisk = () => {
    if (riskFactors.length === 0) return "Low";
    
    const avgRiskScore = riskFactors.reduce((sum, risk) => 
      sum + (risk.probability * risk.impact), 0) / (riskFactors.length * 25) * 10;
    
    if (avgRiskScore < 3) return "Low";
    if (avgRiskScore < 6) return "Medium";
    return "High";
  };

  // Add function to calculate risk-adjusted metrics
  const calculateRiskAdjustedMetrics = () => {
    if (!timelineData || !timelineData.netBenefitsTimeline || timelineData.netBenefitsTimeline.length === 0) return null;
    
    // Calculate risk factors by category
    const timingRisks = riskFactors.filter(r => r.category === 'timing');
    const costRisks = riskFactors.filter(r => r.category === 'cost');
    const benefitRisks = riskFactors.filter(r => r.category === 'benefit');
    
    // Calculate risk adjustment factors
    const timingRiskFactor = timingRisks.reduce((sum, risk) => sum + (risk.probability * risk.impact / 5), 0);
    const costRiskFactor = costRisks.reduce((sum, risk) => sum + (risk.probability * risk.impact / 5), 0);
    const benefitRiskFactor = benefitRisks.reduce((sum, risk) => sum + (risk.probability * risk.impact / 5), 0);
    
    // Apply risk adjustments
    const adjustedPaybackYear = timelineData.paybackYear ? 
      timelineData.paybackYear * (1 + timingRiskFactor * 0.2) : null;
    
    // Adjust NPV by applying risk factors to costs and benefits
    const lastPoint = timelineData.netBenefitsTimeline[timelineData.netBenefitsTimeline.length - 1];
    const finalNPV = lastPoint?.cumulativeNetBenefits || 0;
    
    // Pessimistic NPV has increased costs and decreased benefits
    const pessimisticNPV = finalNPV * (1 - (costRiskFactor * 0.3 + benefitRiskFactor * 0.4));
    
    return {
      riskAdjustedPayback: adjustedPaybackYear,
      pessimisticNPV,
      riskAdjustedNPV: finalNPV * (1 - (costRiskFactor * 0.15 + benefitRiskFactor * 0.2)),
      npvRiskExposure: finalNPV - pessimisticNPV,
      timingRiskFactor,
      costRiskFactor,
      benefitRiskFactor
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Project Timeline Analysis</CardTitle>
            <CardDescription>
              Visualize how benefits and costs accrue over the {selectedAnalysis.analysisHorizon}-year project lifecycle
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {timelineData && (
              <Button 
                variant={isComparisonMode ? "default" : "outline"} 
                size="sm"
                onClick={toggleComparisonMode}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                {isComparisonMode ? "Exit Comparison" : "Compare Scenarios"}
              </Button>
            )}
            {timelineData && !isComparisonMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Timing Scenarios
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Timing Scenarios</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className={cn(activeTimeScenario === null && "bg-accent")} 
                    onClick={() => {
                      setActiveTimeScenario(null);
                      handleGenerateTimeline();
                    }}
                  >
                    <Check className={cn("h-4 w-4 mr-2", activeTimeScenario === null ? "opacity-100" : "opacity-0")} />
                    Base Case
                  </DropdownMenuItem>
                  
                  {timeScenarios.map(scenario => (
                    <DropdownMenuItem 
                      key={scenario.id}
                      className={cn(activeTimeScenario === scenario.id && "bg-accent")}
                      onClick={() => handleGenerateTimeline(scenario.id)}
                    >
                      <Check className={cn("h-4 w-4 mr-2", activeTimeScenario === scenario.id ? "opacity-100" : "opacity-0")} />
                      {scenario.name}
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsCreatingTimeScenario(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create New Scenario
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isComparisonMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add to Comparison
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Select Scenarios</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className={cn(comparisonScenarios.includes('base') && "bg-accent")}
                    onClick={() => toggleScenarioInComparison('base')}
                  >
                    <Check className={cn("h-4 w-4 mr-2", comparisonScenarios.includes('base') ? "opacity-100" : "opacity-0")} />
                    Base Case
                  </DropdownMenuItem>
                  
                  {timeScenarios.map(scenario => (
                    <DropdownMenuItem 
                      key={scenario.id}
                      className={cn(comparisonScenarios.includes(scenario.id) && "bg-accent")}
                      onClick={() => toggleScenarioInComparison(scenario.id)}
                    >
                      <Check className={cn("h-4 w-4 mr-2", comparisonScenarios.includes(scenario.id) ? "opacity-100" : "opacity-0")} />
                      {scenario.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isTimelineLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Spinner />
              <p className="text-sm text-muted-foreground">Generating timeline visualization...</p>
            </div>
          </div>
        ) : isComparisonMode && Object.keys(comparisonData).length > 0 ? (
          <div className="space-y-6">
            <Tabs defaultValue="chart">
              <TabsList>
                <TabsTrigger value="chart">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Comparison Chart
                </TabsTrigger>
                <TabsTrigger value="metrics">Metrics Comparison</TabsTrigger>
                <TabsTrigger value="risks">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Risk Analysis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="space-y-6">
                <div className="h-80">
                  {/* NPV Comparison Chart */}
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="year" 
                        label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                        allowDuplicatedCategory={false}
                      />
                      <YAxis 
                        label={{ value: 'Cumulative NPV ($)', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(value) => `$${Math.abs(value) > 999 ? (value/1000).toFixed(0) + 'k' : value}`}
                      />
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(value)}
                        labelFormatter={(label) => `Year ${label}`}
                      />
                      <Legend />
                      
                      {Object.entries(comparisonData).map(([scenarioId, data], index) => {
                        const scenario = scenarioId === 'base' 
                          ? { name: 'Base Case', implementationDelay: 0, constructionDuration: 2 }
                          : timeScenarios.find(s => s.id === scenarioId);
                        
                        const color = [
                          '#3b82f6', // blue
                          '#10b981', // green
                          '#f59e0b', // amber
                          '#ec4899', // pink
                          '#8b5cf6'  // purple
                        ][index % 5];
                        
                        return (
                          <Line
                            key={scenarioId}
                            type="monotone"
                            dataKey="cumulativeNetBenefits"
                            name={data.name}
                            stroke={color}
                            data={data.netBenefitsTimeline}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                        );
                      })}
                      
                      <ReferenceLine 
                        y={0} 
                        stroke="#000" 
                        strokeDasharray="3 3"
                        label={{ value: 'Break-even', position: 'right' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-80">
                  {/* Annual Benefits Comparison */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                      data={Array.from({ length: 10 }, (_, i) => ({ year: i + 1 }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="year" 
                        label={{ value: 'First 10 Years', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        label={{ value: 'Annual Benefits ($)', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(value) => `$${Math.abs(value) > 999 ? (value/1000).toFixed(0) + 'k' : value}`}
                      />
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(value)}
                        labelFormatter={(label) => `Year ${label}`}
                      />
                      <Legend />
                      
                      {Object.entries(comparisonData).map(([scenarioId, data], index) => {
                        const color = [
                          '#3b82f6', // blue
                          '#10b981', // green
                          '#f59e0b', // amber
                          '#ec4899', // pink
                          '#8b5cf6'  // purple
                        ][index % 5];
                        
                        return (
                          <Bar
                            key={scenarioId}
                            dataKey={(entry) => {
                              const yearData = data.netBenefitsTimeline.find((d: any) => d.year === entry.year);
                              return yearData?.benefitValue || 0;
                            }}
                            name={`${data.name} Benefits`}
                            fill={color}
                            barSize={20}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="metrics">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {Object.values(comparisonData).map((data: any) => (
                        <TableHead key={data.name}>{data.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Implementation Delay</TableCell>
                      {Object.values(comparisonData).map((data: any) => (
                        <TableCell key={`${data.name}-delay`}>
                          {data.implementationDelay} years
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Construction Duration</TableCell>
                      {Object.values(comparisonData).map((data: any) => (
                        <TableCell key={`${data.name}-construction`}>
                          {data.constructionDuration} years
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Discount Rate</TableCell>
                      {Object.values(comparisonData).map((data: any) => (
                        <TableCell key={`${data.name}-rate`}>
                          {(data.discountRate * 100).toFixed(1)}%
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Payback Period</TableCell>
                      {Object.values(comparisonData).map((data: any) => (
                        <TableCell key={`${data.name}-payback`} className={cn(
                          data.paybackYear && data.paybackYear > 20 ? "text-red-500" : 
                          data.paybackYear && data.paybackYear > 10 ? "text-amber-500" : 
                          "text-green-500"
                        )}>
                          {data.paybackYear ? `${data.paybackYear.toFixed(1)} years` : 'N/A'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">NPV at Year 10</TableCell>
                      {Object.values(comparisonData).map((data: any) => {
                        const npvAt10 = data.netBenefitsTimeline[9]?.cumulativeNetBenefits || 0;
                        return (
                          <TableCell 
                            key={`${data.name}-npv10`}
                            className={cn(
                              npvAt10 < 0 ? "text-red-500" : "text-green-500"
                            )}
                          >
                            {formatCurrency(npvAt10)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">NPV at Year 20</TableCell>
                      {Object.values(comparisonData).map((data: any) => {
                        const npvAt20 = data.netBenefitsTimeline[19]?.cumulativeNetBenefits || 0;
                        return (
                          <TableCell 
                            key={`${data.name}-npv20`}
                            className={cn(
                              npvAt20 < 0 ? "text-red-500" : "text-green-500"
                            )}
                          >
                            {formatCurrency(npvAt20)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Final NPV</TableCell>
                      {Object.values(comparisonData).map((data: any) => {
                        const finalNpv = data.netBenefitsTimeline[data.netBenefitsTimeline.length - 1]?.cumulativeNetBenefits || 0;
                        return (
                          <TableCell 
                            key={`${data.name}-finalNpv`}
                            className={cn(
                              finalNpv < 0 ? "text-red-500" : "text-green-500"
                            )}
                          >
                            {formatCurrency(finalNpv)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Comparative Analysis</h4>
                  <ul className="space-y-2 text-sm">
                    {Object.keys(comparisonData).length >= 2 && (
                      <>
                        {(() => {
                          // Find best payback period
                          const paybackPeriods = Object.values(comparisonData)
                            .map((data: any) => ({ name: data.name, payback: data.paybackYear }))
                            .filter((item) => item.payback !== null);
                          
                          if (paybackPeriods.length >= 2) {
                            paybackPeriods.sort((a, b) => a.payback - b.payback);
                            const best = paybackPeriods[0];
                            const diff = paybackPeriods[1].payback - best.payback;
                            
                            if (diff > 1) {
                              return (
                                <li>• The {best.name} scenario has the fastest payback, {diff.toFixed(1)} years sooner than the next best option.</li>
                              );
                            }
                          }
                          
                          return null;
                        })()}
                        
                        {(() => {
                          // Compare final NPVs
                          const finalNpvs = Object.values(comparisonData)
                            .map((data: any) => ({
                              name: data.name,
                              npv: data.netBenefitsTimeline[data.netBenefitsTimeline.length - 1]?.cumulativeNetBenefits || 0
                            }));
                          
                          finalNpvs.sort((a, b) => b.npv - a.npv);
                          const best = finalNpvs[0];
                          const worst = finalNpvs[finalNpvs.length - 1];
                          const percentDiff = ((best.npv - worst.npv) / Math.abs(worst.npv)) * 100;
                          
                          if (percentDiff > 20) {
                            return (
                              <li>• The {best.name} scenario yields {percentDiff.toFixed(0)}% higher NPV than the {worst.name} scenario.</li>
                            );
                          }
                          
                          return null;
                        })()}
                        
                        <li>• {
                          Object.values(comparisonData).every((data: any) => 
                            data.paybackYear && data.paybackYear <= selectedAnalysis.analysisHorizon
                          )
                          ? "All scenarios achieve payback within the analysis horizon."
                          : "Not all scenarios achieve payback within the analysis horizon."
                        }</li>
                        
                        <li>• {
                          (() => {
                            const delayedScenarios = Object.values(comparisonData)
                              .filter((data: any) => data.implementationDelay > 0);
                            
                            if (delayedScenarios.length > 0) {
                              const largestDelay = Math.max(...delayedScenarios.map((d: any) => d.implementationDelay));
                              return `Implementation delays of ${largestDelay} years can increase payback period by approximately ${(largestDelay * 1.5).toFixed(1)} years.`;
                            }
                            
                            return "Starting implementation promptly provides the most favorable economic outcomes.";
                          })()
                        }</li>
                      </>
                    )}
                    
                    {Object.keys(comparisonData).length < 2 && (
                      <li>• Add more scenarios to the comparison to see insights.</li>
                    )}
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="risks">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Risk Analysis</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAddingRisk(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Risk Factor
                    </Button>
                  </div>
                  
                  {/* Risk Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Overall Risk Rating</h4>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80 text-xs">
                                  Overall risk rating is calculated by averaging the risk scores (probability × impact) of all identified risk factors.
                                </p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "text-lg font-bold px-2 py-1 rounded border",
                            getRiskColor(calculateOverallRisk())
                          )}>
                            {calculateOverallRisk()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Risk-Adjusted Payback</h4>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80 text-xs">
                                  Risk-adjusted payback period accounts for potential implementation delays and cost overruns.
                                </p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-lg font-bold">
                            {calculateRiskAdjustedMetrics()?.riskAdjustedPayback 
                              ? `${calculateRiskAdjustedMetrics()?.riskAdjustedPayback.toFixed(1)} years` 
                              : 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Base: {timelineData?.paybackYear 
                              ? `${timelineData.paybackYear.toFixed(1)} years` 
                              : 'N/A'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">NPV Risk Exposure</h4>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80 text-xs">
                                  NPV Risk Exposure represents the potential reduction in NPV if risks materialize.
                                </p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-lg font-bold">
                            {formatCurrency(calculateRiskAdjustedMetrics()?.npvRiskExposure || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {calculateRiskAdjustedMetrics()?.npvRiskExposure && timelineData?.netBenefitsTimeline ? 
                              `${(calculateRiskAdjustedMetrics()!.npvRiskExposure / timelineData.netBenefitsTimeline[timelineData.netBenefitsTimeline.length - 1].cumulativeNetBenefits * 100).toFixed(1)}% of NPV` 
                              : ''}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Risk Factors Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Risk Factors</CardTitle>
                      <CardDescription>
                        Identified risk factors that may impact the project timeline and financial outcomes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-6">
                        <Tabs defaultValue="table">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="table">Risk Table</TabsTrigger>
                            <TabsTrigger value="chart">Risk Chart</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="table">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Risk Factor</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Probability</TableHead>
                                  <TableHead>Impact</TableHead>
                                  <TableHead>Risk Score</TableHead>
                                  <TableHead className="w-10"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {riskFactors.map(risk => {
                                  const riskScore = risk.probability * risk.impact;
                                  return (
                                    <TableRow key={risk.id}>
                                      <TableCell className="font-medium">
                                        <TooltipProvider>
                                          <UITooltip>
                                            <TooltipTrigger className="cursor-help underline-offset-4 hover:underline">
                                              {risk.name}
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="w-80 text-xs">{risk.description}</p>
                                            </TooltipContent>
                                          </UITooltip>
                                        </TooltipProvider>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                          {risk.category}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{(risk.probability * 100).toFixed(0)}%</TableCell>
                                      <TableCell>{risk.impact}/5</TableCell>
                                      <TableCell>
                                        <div className={cn(
                                          "px-2 py-1 text-xs rounded border inline-block",
                                          getRiskColor(riskScore)
                                        )}>
                                          {riskScore.toFixed(1)}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleDeleteRiskFactor(risk.id)}
                                        >
                                          <Trash2Icon className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                {riskFactors.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                      No risk factors identified yet. Add risk factors to see analysis.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TabsContent>
                          
                          <TabsContent value="chart">
                            <div className="h-64">
                              {riskFactors.length > 0 ? (
                                <div className="h-64 p-4">
                                  <div className="space-y-4">
                                    {riskFactors.map((risk, index) => (
                                      <div key={index} className="relative">
                                        <div className="flex justify-between mb-1">
                                          <span>{risk.name}</span>
                                          <span className="font-medium">{risk.probability * risk.impact}</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div 
                                            className={cn(
                                              "h-full", 
                                              risk.category === 'timing' ? 'bg-blue-500' : 
                                              risk.category === 'cost' ? 'bg-red-500' : 'bg-green-500'
                                            )}
                                            style={{ width: `${(risk.probability * risk.impact / 25) * 100}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-muted-foreground">{risk.category}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex h-64 items-center justify-center text-muted-foreground">
                                  No risk factors added yet
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Risk Impact Visualization */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Risk Impact Visualization</CardTitle>
                      <CardDescription>
                        How risks could affect your project's financials
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                            data={timelineData?.netBenefitsTimeline || []}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                              dataKey="year"
                              label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                            />
                            <YAxis
                              label={{ value: 'Cumulative NPV ($)', angle: -90, position: 'insideLeft' }}
                              tickFormatter={(value) => `$${Math.abs(value) > 999 ? (value/1000).toFixed(0) + 'k' : value}`}
                            />
                            <Tooltip
                              formatter={(value: any) => formatCurrency(value)}
                              labelFormatter={(label) => `Year ${label}`}
                            />
                            <Legend />
                            
                            {/* Base Case */}
                            <Line
                              type="monotone"
                              dataKey="cumulativeNetBenefits"
                              name="Base Case NPV"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={false}
                            />
                            
                            {/* Risk-Adjusted Case */}
                            <Line
                              type="monotone"
                              name="Risk-Adjusted NPV"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                              dataKey={(entry) => {
                                // Scale down NPV based on time progression and risk factors
                                const metrics = calculateRiskAdjustedMetrics();
                                if (!metrics) return entry.cumulativeNetBenefits;
                                
                                const timeFactor = entry.year / timelineData?.analysisHorizon;
                                const riskAdjustment = 1 - ((metrics.costRiskFactor * 0.15 + metrics.benefitRiskFactor * 0.2) * timeFactor);
                                return entry.cumulativeNetBenefits * riskAdjustment;
                              }}
                            />
                            
                            {/* Pessimistic Case */}
                            <Line
                              type="monotone"
                              name="Pessimistic NPV"
                              stroke="#ef4444"
                              strokeWidth={2}
                              strokeDasharray="3 3"
                              dot={false}
                              dataKey={(entry) => {
                                // Scale down NPV based on time progression and risk factors
                                const metrics = calculateRiskAdjustedMetrics();
                                if (!metrics) return entry.cumulativeNetBenefits;
                                
                                const timeFactor = entry.year / timelineData?.analysisHorizon;
                                const riskAdjustment = 1 - ((metrics.costRiskFactor * 0.3 + metrics.benefitRiskFactor * 0.4) * timeFactor);
                                return entry.cumulativeNetBenefits * riskAdjustment;
                              }}
                            />
                            
                            <ReferenceLine
                              y={0}
                              stroke="#000"
                              strokeDasharray="3 3"
                              label={{ value: 'Break-even', position: 'right' }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="w-full space-y-2">
                        <h4 className="font-semibold text-sm">Risk Analysis Insights</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• {calculateRiskAdjustedMetrics()?.riskAdjustedPayback && timelineData?.paybackYear ? 
                            `Risks could extend the payback period by ${(calculateRiskAdjustedMetrics()?.riskAdjustedPayback! - timelineData.paybackYear).toFixed(1)} years.` : 
                            'Add risk factors to see their impact on payback period.'}</li>
                          <li>• {riskFactors.length > 0 ? 
                            `The most significant risk category is ${
                              ['timing', 'cost', 'benefit'].sort((a, b) => {
                                const metrics = calculateRiskAdjustedMetrics();
                                if (!metrics) return 0;
                                const aFactor = a === 'timing' ? metrics.timingRiskFactor : 
                                                a === 'cost' ? metrics.costRiskFactor :
                                                metrics.benefitRiskFactor;
                                const bFactor = b === 'timing' ? metrics.timingRiskFactor : 
                                                b === 'cost' ? metrics.costRiskFactor :
                                                metrics.benefitRiskFactor;
                                return bFactor - aFactor;
                              })[0]
                            } factors.` : 
                            'No risks have been identified yet.'}</li>
                          <li>• {calculateRiskAdjustedMetrics()?.pessimisticNPV && calculateRiskAdjustedMetrics()?.pessimisticNPV < 0 ? 
                            'In the pessimistic scenario, the project would not achieve a positive NPV.' : 
                            'The project maintains a positive NPV even under pessimistic risk scenarios.'}</li>
                        </ul>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
) : timelineData ? (
  <>
    {timelineData.timeScenarioId && (
      <Alert className="mb-4">
        <Clock className="h-4 w-4" />
        <AlertTitle>Timing Scenario: {timelineData.timeScenarioName}</AlertTitle>
        <AlertDescription>
          Implementation Delay: {timelineData.implementationDelay} years | 
          Construction Duration: {timelineData.constructionDuration} years | 
          Discount Rate: {(timelineData.discountRate * 100).toFixed(1)}%
        </AlertDescription>
      </Alert>
    )}
    <TimelineChart data={timelineData} />
  </>
) : (
  <div className="flex flex-col items-center justify-center h-64 space-y-4">
    <CalendarDays className="h-12 w-12 text-muted-foreground" />
    <p className="text-muted-foreground">Click "Generate Timeline" to visualize project cash flows over time</p>
    <Button onClick={() => handleGenerateTimeline()}>
      Generate Timeline
    </Button>
  </div>
)}
</CardContent>
{timelineData && (
  <CardFooter className="border-t pt-6 flex flex-col items-start space-y-4">
    <div className="grid grid-cols-2 gap-4 w-full">
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Timeline Insights</h4>
        <ul className="text-sm space-y-1">
          <li>• Project breaks even after {timelineData.paybackYear ? 
            timelineData.paybackYear.toFixed(1) : 'N/A'} years</li>
          <li>• Highest annual benefit occurs in year {
            timelineData.netBenefitsTimeline.reduce(
              (maxYear: number, current: any, index: number) => 
                current.benefitValue > timelineData.netBenefitsTimeline[maxYear]?.benefitValue 
                  ? index : maxYear, 0) + 1
          }</li>
          <li>• Net benefits become positive in year {
            timelineData.netBenefitsTimeline.findIndex(
              (item: any) => item.netBenefit > 0) + 1 || 'N/A'
          }</li>
          {timelineData.implementationDelay > 0 && (
            <li>• Implementation delay of {timelineData.implementationDelay} years 
              {timelineData.implementationDelay > 2 ? ' significantly ' : ' '}
              impacts project viability</li>
          )}
        </ul>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Recommendations</h4>
        <ul className="text-sm space-y-1">
          <li>• Consider phasing capital costs to improve early cash flow</li>
          <li>• Monitor actual benefits during years 1-5 closely</li>
          <li>• {timelineData.paybackYear && timelineData.paybackYear > 10 ? 
            'Long payback period suggests risk in financing structure' : 
            'Project has favorable payback period within typical financing terms'}</li>
          {timelineData.implementationDelay > 0 && (
            <li>• Reducing implementation delay by {Math.min(timelineData.implementationDelay, 2)} years 
              could significantly improve project economics</li>
          )}
        </ul>
      </div>
    </div>
  </CardFooter>
)}

{/* Dialog for creating a new time scenario */}
<Dialog open={isCreatingTimeScenario} onOpenChange={setIsCreatingTimeScenario}>
  <DialogContent className="sm:max-w-[525px]">
    <DialogHeader>
      <DialogTitle>Create Timing Scenario</DialogTitle>
      <DialogDescription>
        Analyze how changes in project timing impact financial outcomes
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input
          id="name"
          value={newTimeScenario.name}
          onChange={(e) => setNewTimeScenario({...newTimeScenario, name: e.target.value})}
          className="col-span-3"
          placeholder="e.g., Delayed Start"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Description
        </Label>
        <Input
          id="description"
          value={newTimeScenario.description}
          onChange={(e) => setNewTimeScenario({...newTimeScenario, description: e.target.value})}
          className="col-span-3"
          placeholder="Brief description of this scenario"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="delay" className="text-right">
          Delay (years)
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Slider
            id="delay"
            min={0}
            max={5}
            step={1}
            value={[newTimeScenario.implementationDelay]}
            onValueChange={(value) => setNewTimeScenario({...newTimeScenario, implementationDelay: value[0]})}
            className="flex-1"
          />
          <span className="w-12 text-center">{newTimeScenario.implementationDelay}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="duration" className="text-right">
          Construction (years)
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Slider
            id="duration"
            min={1}
            max={5}
            step={1}
            value={[newTimeScenario.constructionDuration]}
            onValueChange={(value) => setNewTimeScenario({...newTimeScenario, constructionDuration: value[0]})}
            className="flex-1"
          />
          <span className="w-12 text-center">{newTimeScenario.constructionDuration}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="discount" className="text-right">
          Rate Adjustment
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Slider
            id="discount"
            min={-0.02}
            max={0.05}
            step={0.005}
            value={[newTimeScenario.discountRateAdjustment]}
            onValueChange={(value) => setNewTimeScenario({...newTimeScenario, discountRateAdjustment: value[0]})}
            className="flex-1"
          />
          <span className="w-12 text-center">{(newTimeScenario.discountRateAdjustment * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setIsCreatingTimeScenario(false)}>
        Cancel
      </Button>
      <Button type="button" onClick={handleCreateTimeScenario}>
        Create Scenario
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Dialog for adding a new risk factor */}
<Dialog open={isAddingRisk} onOpenChange={setIsAddingRisk}>
  <DialogContent className="sm:max-w-[525px]">
    <DialogHeader>
      <DialogTitle>Add Risk Factor</DialogTitle>
      <DialogDescription>
        Add a new risk factor that could impact timeline or financial outcomes
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="risk-name" className="text-right">
          Name
        </Label>
        <Input
          id="risk-name"
          value={newRiskFactor.name}
          onChange={(e) => setNewRiskFactor({...newRiskFactor, name: e.target.value})}
          className="col-span-3"
          placeholder="e.g., Construction Delays"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="risk-category" className="text-right">
          Category
        </Label>
        <select
          id="risk-category"
          value={newRiskFactor.category}
          onChange={(e) => setNewRiskFactor({
            ...newRiskFactor, 
            category: e.target.value as 'cost' | 'benefit' | 'timing'
          })}
          className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="cost">Cost</option>
          <option value="benefit">Benefit</option>
          <option value="timing">Timing</option>
        </select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="risk-probability" className="text-right">
          Probability
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Slider
            id="risk-probability"
            min={0}
            max={1}
            step={0.05}
            value={[newRiskFactor.probability]}
            onValueChange={(value) => setNewRiskFactor({...newRiskFactor, probability: value[0]})}
            className="flex-1"
          />
          <span className="w-16 text-center">{(newRiskFactor.probability * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="risk-impact" className="text-right">
          Impact (1-5)
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Slider
            id="risk-impact"
            min={1}
            max={5}
            step={1}
            value={[newRiskFactor.impact]}
            onValueChange={(value) => setNewRiskFactor({...newRiskFactor, impact: value[0]})}
            className="flex-1"
          />
          <span className="w-16 text-center">{newRiskFactor.impact}/5</span>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="risk-description" className="text-right">
          Description
        </Label>
        <textarea
          id="risk-description"
          value={newRiskFactor.description}
          onChange={(e) => setNewRiskFactor({...newRiskFactor, description: e.target.value})}
          className="col-span-3 min-h-[80px] flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe the risk and its potential impact..."
        />
      </div>
    </div>
    <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setIsAddingRisk(false)}>
        Cancel
      </Button>
      <Button type="button" onClick={handleAddRiskFactor}>
        Add Risk Factor
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
</Card>
);
} 