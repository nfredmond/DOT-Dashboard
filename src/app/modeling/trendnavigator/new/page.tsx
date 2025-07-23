"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { TrendNavigatorEngine, TrendScenario, TrendDefinition } from "@/lib/trend-navigator/engine";

const engine = new TrendNavigatorEngine();

export default function NewTrendNavigatorScenarioPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);

  const [scenarioName, setScenarioName] = useState("");
  const [description, setDescription] = useState("");
  const [horizonYear, setHorizonYear] = useState("2035");
  const [baseModelId, setBaseModelId] = useState("latest");
  const [scenarioType, setScenarioType] = useState("trend");
  
  const [availableTrends, setAvailableTrends] = useState<TrendDefinition[]>([]);
  const [scenarioTrendValues, setScenarioTrendValues] = useState<Record<string, Record<number, number>>>({});

  useEffect(() => {
    async function fetchAndInitializeTrends() {
      setIsLoadingTrends(true);
      try {
        const fetchedDefinitions = await engine.getTrendDefinitions();
        setAvailableTrends(fetchedDefinitions);
        
        const initialValues: Record<string, Record<number, number>> = {};
        fetchedDefinitions.forEach(trend => {
          initialValues[trend.id] = {};
          const yearsToInitialize = trend.predictionYears && trend.predictionYears.length > 0 
                                    ? trend.predictionYears 
                                    : [parseInt(horizonYear, 10)];
          
          if (trend.inputType === 'select' && trend.options && trend.options.length > 0) {
            const firstOptionValues = trend.options[0].values;
            yearsToInitialize.forEach(year => {
              initialValues[trend.id][year] = firstOptionValues[year] !== undefined 
                                              ? firstOptionValues[year] 
                                              : trend.defaultValue;
            });
          } else {
            yearsToInitialize.forEach(year => {
              initialValues[trend.id][year] = trend.defaultValue;
            });
          }
        });
        setScenarioTrendValues(initialValues);
      } catch (error) {
        console.error("Error fetching trend definitions for new scenario:", error);
        toast({
          title: "Error loading trend configurations",
          description: "Could not load available trends. Please try again.",
          variant: "destructive",
        });
      }
      setIsLoadingTrends(false);
    }
    fetchAndInitializeTrends();
  }, [horizonYear]);

  const handleScenarioTrendSliderChange = (trendId: string, year: number, newValue: number) => {
    setScenarioTrendValues(prev => ({
      ...prev,
      [trendId]: {
        ...(prev[trendId] || {}),
        [year]: newValue,
      },
    }));
  };

  const handleScenarioTrendSelectChange = (trendId: string, selectedOptionValue: string) => {
    const trend = availableTrends.find(t => t.id === trendId);
    if (!trend || !trend.options) return;

    const selectedOption = trend.options.find(opt => opt.label === selectedOptionValue);
    if (!selectedOption) return;

    setScenarioTrendValues(prev => ({
      ...prev,
      [trendId]: { ...(selectedOption.values) },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const scenarioData: TrendScenario = {
      name: scenarioName,
      description: description,
      horizonYear: parseInt(horizonYear, 10),
      baseModelId: baseModelId,
      scenarioType: scenarioType,
      trendValues: scenarioTrendValues,
    };

    try {
      setIsSubmitting(true);
      
      const savedScenario = await engine.saveScenario(scenarioData);
      
      toast({
        title: "Scenario created successfully",
        description: `Scenario "${savedScenario.name}" has been created. ID: ${savedScenario.id}`,
      });
      
      router.push("/modeling/trendnavigator/scenarios");
    } catch (error) {
      console.error("Error creating scenario:", error);
      toast({
        title: "Error",
        description: "There was an error creating your scenario. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="mr-2"
            onClick={() => router.push("/modeling")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">New Future Scenario</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Information</CardTitle>
              <CardDescription>
                Define the basic details for your future scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scenarioName">Scenario Name</Label>
                  <Input 
                    id="scenarioName" 
                    placeholder="e.g., High Telecommuting 2035" 
                    required
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseModel">Base Travel Model</Label>
                  <Select value={baseModelId} onValueChange={setBaseModelId}>
                    <SelectTrigger id="baseModel">
                      <SelectValue placeholder="Select base model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest Regional Model (2023)</SelectItem>
                      <SelectItem value="downtown">Downtown Transportation Study</SelectItem>
                      <SelectItem value="county">County Mobility Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the purpose and assumptions of this scenario" 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horizonYear">Horizon Year</Label>
                  <Select value={horizonYear} onValueChange={setHorizonYear}>
                    <SelectTrigger id="horizonYear">
                      <SelectValue placeholder="Select horizon year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025 (Near-term)</SelectItem>
                      <SelectItem value="2035">2035 (Mid-term)</SelectItem>
                      <SelectItem value="2050">2050 (Long-term)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scenarioType">Scenario Type</Label>
                  <Select value={scenarioType} onValueChange={setScenarioType}>
                    <SelectTrigger id="scenarioType">
                      <SelectValue placeholder="Select scenario type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trend">Technology Trend</SelectItem>
                      <SelectItem value="policy">Policy Package</SelectItem>
                      <SelectItem value="land-use">Land Use Change</SelectItem>
                      <SelectItem value="combined">Combined Scenario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Trend Configuration</CardTitle>
              <CardDescription>
                Configure the values for relevant trends in this scenario. These will modify the base model assumptions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {isLoadingTrends ? (
                <p>Loading trend configurations...</p>
              ) : availableTrends.length === 0 ? (
                <p>No trend definitions available. Please add some in the Trend Library.</p>
              ) : (
                availableTrends.map((trend) => (
                  <div key={trend.id} className="space-y-3 pt-4 pb-4 border-b last:border-b-0">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{trend.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {trend.description}
                    </p>
                    
                    {trend.inputType === 'select' ? (
                      <div className="space-y-2">
                        <Label htmlFor={`trend-select-${trend.id}`}>Select {trend.name} Scenario</Label>
                        <Select 
                          onValueChange={(value) => handleScenarioTrendSelectChange(trend.id, value)}
                          value={trend.options?.find(opt => 
                            JSON.stringify(opt.values) === JSON.stringify(scenarioTrendValues[trend.id]))?.label || (trend.options && trend.options.length > 0 ? trend.options[0].label : '')
                          }
                        >
                          <SelectTrigger id={`trend-select-${trend.id}`}>
                            <SelectValue placeholder={`Choose a ${trend.name} option`} />
                          </SelectTrigger>
                          <SelectContent>
                            {trend.options?.map(option => (
                              <SelectItem key={option.label} value={option.label}>
                                {option.label} {option.description ? `(${option.description})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {scenarioTrendValues[trend.id] && (
                           <div className="mt-2 p-2 border rounded-md bg-slate-50 text-xs">
                            <p className="font-medium mb-1">Applied values for this option:</p>
                            {trend.predictionYears?.map(year => (
                                <p key={year}>{year}: {scenarioTrendValues[trend.id][year]} {trend.unit}</p>
                            ))}
                           </div>
                        )}
                      </div>
                    ) : (
                      // Slider input type (per prediction year)
                      (trend.predictionYears && trend.predictionYears.length > 0 
                        ? trend.predictionYears 
                        : [parseInt(horizonYear, 10)]
                      ).map(year => (
                        <div key={year} className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`trend-slider-${trend.id}-${year}`}>{trend.name} ({year}) - {trend.unit}</Label>
                            <span className="text-sm font-medium w-20 text-right">
                              {(scenarioTrendValues[trend.id] && scenarioTrendValues[trend.id][year] !== undefined) 
                                ? scenarioTrendValues[trend.id][year] 
                                : trend.defaultValue}
                              {trend.unit === '%' ? '%' : ''}
                            </span>
                          </div>
                          <Slider 
                            id={`trend-slider-${trend.id}-${year}`}
                            defaultValue={[trend.defaultValue]}
                            value={[(scenarioTrendValues[trend.id] && scenarioTrendValues[trend.id][year] !== undefined) 
                                     ? scenarioTrendValues[trend.id][year] 
                                     : trend.defaultValue]}
                            onValueChange={(value) => handleScenarioTrendSliderChange(trend.id, year, value[0])}
                            max={trend.maxValue} 
                            min={trend.minValue}
                            step={1}
                          />
                        </div>
                      ))
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          
          <CardFooter className="flex justify-end">
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 animate-spin">⟳</span>
                  Creating...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Create Scenario
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </div>
    </ProtectedRoute>
  );
} 