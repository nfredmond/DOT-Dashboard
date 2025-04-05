import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

// Add Mapbox imports
import { MapboxProvider } from '@/contexts/mapbox-context';
import MapboxMap from '@/components/ui/mapbox-map';
import { MapboxSource } from '@/components/ui/mapbox-source';
import { MapboxLayer } from '@/components/ui/mapbox-layer';

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
  const [_isTimelineLoading, setIsTimelineLoading] = useState(false);
  
  // State for time-based scenarios
  const [timeScenarios, setTimeScenarios] = useState<TimeScenario[]>([]);
  const [activeTimeScenario, setActiveTimeScenario] = useState<string | null>(null);
  const [_isCreatingTimeScenario, setIsCreatingTimeScenario] = useState(false);
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
  const [_isAddingRisk, setIsAddingRisk] = useState(false);
  const [newRiskFactor, setNewRiskFactor] = useState<Omit<RiskFactor, 'id'>>({
    name: '',
    category: 'cost',
    probability: 0.3,
    impact: 3,
    description: ''
  });

  // Function to create a time scenario
  const _handleCreateTimeScenario = () => {
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
  const _formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Add function to toggle comparison mode
  const _toggleComparisonMode = () => {
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

  // Toggle a scenario in comparison mode
  const _toggleScenarioInComparison = async (scenarioId: string) => {
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

  // Add new risk factor
  const _handleAddRiskFactor = () => {
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

  // Delete risk factor
  const _handleDeleteRiskFactor = (id: string) => {
    setRiskFactors(prev => prev.filter(risk => risk.id !== id));
  };

  // Calculate risk score (probability * impact)
  const _calculateRiskScore = (risk: RiskFactor) => {
    return risk.probability * risk.impact;
  };

  // Get color based on risk level
  const _getRiskColor = (risk: string | number) => {
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

  // Calculate overall risk rating
  const _calculateOverallRisk = () => {
    if (riskFactors.length === 0) return "Low";
    
    const avgRiskScore = riskFactors.reduce((sum, risk) => 
      sum + (risk.probability * risk.impact), 0) / (riskFactors.length * 25) * 10;
    
    if (avgRiskScore < 3) return "Low";
    if (avgRiskScore < 6) return "Medium";
    return "High";
  };

  // Calculate risk-adjusted metrics
  const _calculateRiskAdjustedMetrics = () => {
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
    <div className="space-y-4">
      {!selectedAnalysis ? (
        <Alert>
          <AlertTitle>No Analysis Selected</AlertTitle>
          <AlertDescription>
            Please select a benefit-cost analysis to visualize its timeline.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Timeline Visualization</CardTitle>
              <CardDescription>
                Visualize how benefits and costs accumulate over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Content */}
            </CardContent>
          </Card>
          
          {/* Add Spatial Benefit Distribution Card */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Benefit Distribution</CardTitle>
              <CardDescription>
                Spatial distribution of project benefits across the region
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] relative rounded-md overflow-hidden">
              <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-black/80 p-2 rounded shadow-md text-xs space-y-1">
                <div className="font-medium">Benefit Intensity</div>
                <div className="flex items-center">
                  <div className="w-full h-2 bg-gradient-to-r from-blue-200 via-blue-500 to-blue-800 rounded-full"></div>
                </div>
                <div className="flex justify-between">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
              <MapboxProvider>
                <MapboxMap 
                  initialViewState={{
                    longitude: -122.4194,
                    latitude: 37.7749,
                    zoom: 10
                  }}
                  mapStyle="mapbox://styles/mapbox/light-v11"
                  className="w-full h-full"
                >
                  <MapboxSource
                    id="benefit-distribution"
                    source={{
                      type: 'geojson',
                      data: {
                        type: 'FeatureCollection',
                        features: Array.from({ length: 20 }).map((_, i) => {
                          // Create random polygons for demo visualization
                          const centerLon = -122.4194 + (Math.random() * 0.1 - 0.05);
                          const centerLat = 37.7749 + (Math.random() * 0.1 - 0.05);
                          const size = 0.01 + Math.random() * 0.01;
                          
                          return {
                            type: 'Feature',
                            properties: {
                              benefitValue: Math.random(),
                              benefitCategory: ["Travel Time Savings", "Vehicle Operating Costs", "Emissions", "Safety"][Math.floor(Math.random() * 4)],
                              zoneName: `Zone ${i + 1}`
                            },
                            geometry: {
                              type: 'Polygon',
                              coordinates: [[
                                [centerLon - size, centerLat - size],
                                [centerLon + size, centerLat - size],
                                [centerLon + size, centerLat + size],
                                [centerLon - size, centerLat + size],
                                [centerLon - size, centerLat - size]
                              ]]
                            }
                          };
                        })
                      }
                    }}
                  />
                  <MapboxLayer
                    id="benefit-fill"
                    type="fill"
                    source="benefit-distribution"
                    paint={{
                      'fill-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'benefitValue'],
                        0, '#bfdbfe',
                        0.5, '#3b82f6',
                        1, '#1e40af'
                      ],
                      'fill-opacity': 0.7
                    }}
                  />
                  <MapboxLayer
                    id="benefit-line"
                    type="line"
                    source="benefit-distribution"
                    paint={{
                      'line-color': '#1e293b',
                      'line-width': 1,
                      'line-opacity': 0.5
                    }}
                  />
                  <MapboxLayer
                    id="benefit-labels"
                    type="symbol"
                    source="benefit-distribution"
                    layout={{
                      'text-field': ['get', 'zoneName'],
                      'text-size': 10,
                      'text-allow-overlap': false
                    }}
                    paint={{
                      'text-color': '#1e293b',
                      'text-halo-color': '#ffffff',
                      'text-halo-width': 1
                    }}
                  />
                </MapboxMap>
              </MapboxProvider>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 