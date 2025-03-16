'use client';

import { useState, useCallback } from 'react';
import { 
  generateScenarios, 
  ScenarioGenerationType, 
  type ScenarioOptions, 
  type GeneratedScenario, 
  type ScenarioGenerationResult 
} from '@/lib/analysis/scenario-service';
import { Project } from '@/types/project';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  Clock, 
  DollarSign, 
  ThumbsUp, 
  ThumbsDown, 
  BarChart4, 
  Lightbulb, 
  Save, 
  RefreshCw 
} from 'lucide-react';
import Loading from '@/components/ui/loading';

interface ScenarioGeneratorProps {
  project: Project;
  onSaveScenario?: (scenario: GeneratedScenario) => Promise<void>;
  className?: string;
}

export function ScenarioGenerator({ project, onSaveScenario, className }: ScenarioGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarioType, setScenarioType] = useState<ScenarioGenerationType>(ScenarioGenerationType.COMPREHENSIVE);
  const [scenarioCount, setScenarioCount] = useState(3);
  const [detailLevel, setDetailLevel] = useState<'brief' | 'standard' | 'comprehensive'>('standard');
  const [constraintBudget, setConstraintBudget] = useState<number | undefined>(project.budget);
  const [constraintTimeline, setConstraintTimeline] = useState<string | undefined>(
    project.startDate && project.endDate ? `${project.startDate} to ${project.endDate}` : undefined
  );
  const [preferredOutcomes, setPreferredOutcomes] = useState<string[]>([]);
  const [newOutcome, setNewOutcome] = useState('');
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [generatedScenarios, setGeneratedScenarios] = useState<ScenarioGenerationResult | null>(null);
  const [refiningScenario, setRefiningScenario] = useState<GeneratedScenario | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [savingScenarioId, setSavingScenarioId] = useState<string | null>(null);

  const handleAddOutcome = useCallback(() => {
    if (newOutcome.trim()) {
      setPreferredOutcomes([...preferredOutcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  }, [newOutcome, preferredOutcomes]);

  const handleRemoveOutcome = useCallback((index: number) => {
    setPreferredOutcomes(preferredOutcomes.filter((_, i) => i !== index));
  }, [preferredOutcomes]);

  const handleGenerateScenarios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options: ScenarioOptions = {
        count: scenarioCount,
        detailLevel,
        includeAnalysis,
        constraintBudget,
        constraintTimeline,
        preferredOutcomes: preferredOutcomes.length > 0 ? preferredOutcomes : undefined
      };
      
      const result = await generateScenarios(project, scenarioType, options);
      setGeneratedScenarios(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred generating scenarios');
      console.error('Error generating scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScenario = async (scenario: GeneratedScenario) => {
    if (!onSaveScenario) return;
    
    try {
      setSavingScenarioId(scenario.id || scenario.name);
      await onSaveScenario(scenario);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred saving the scenario');
    } finally {
      setSavingScenarioId(null);
    }
  };

  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Project Scenarios</CardTitle>
          <CardDescription>
            Create alternative scenarios for your project using AI
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scenario-type">Scenario Type</Label>
              <Select
                value={scenarioType}
                onValueChange={(value) => setScenarioType(value as ScenarioGenerationType)}
              >
                <SelectTrigger id="scenario-type">
                  <SelectValue placeholder="Select scenario type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ScenarioGenerationType.COMPREHENSIVE}>Comprehensive Alternatives</SelectItem>
                  <SelectItem value={ScenarioGenerationType.COST_ALTERNATIVES}>Cost Alternatives</SelectItem>
                  <SelectItem value={ScenarioGenerationType.TIMELINE_ALTERNATIVES}>Timeline Alternatives</SelectItem>
                  <SelectItem value={ScenarioGenerationType.DESIGN_ALTERNATIVES}>Design Alternatives</SelectItem>
                  <SelectItem value={ScenarioGenerationType.FUNDING_ALTERNATIVES}>Funding Alternatives</SelectItem>
                  <SelectItem value={ScenarioGenerationType.PHASING_ALTERNATIVES}>Phasing Alternatives</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Number of Scenarios ({scenarioCount})</Label>
              <Slider
                value={[scenarioCount]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => setScenarioCount(value[0])}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="detail-level">Detail Level</Label>
              <Select
                value={detailLevel}
                onValueChange={(value) => setDetailLevel(value as 'brief' | 'standard' | 'comprehensive')}
              >
                <SelectTrigger id="detail-level">
                  <SelectValue placeholder="Select detail level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-analysis"
                checked={includeAnalysis}
                onCheckedChange={(checked) => setIncludeAnalysis(checked === true)}
              />
              <Label htmlFor="include-analysis">Include Analysis</Label>
            </div>
            
            <div>
              <Label htmlFor="constraint-budget">Budget Constraint (Optional)</Label>
              <div className="flex items-center mt-1">
                <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="constraint-budget"
                  type="number"
                  value={constraintBudget || ''}
                  onChange={(e) => setConstraintBudget(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Maximum budget"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="constraint-timeline">Timeline Constraint (Optional)</Label>
              <div className="flex items-center mt-1">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="constraint-timeline"
                  value={constraintTimeline || ''}
                  onChange={(e) => setConstraintTimeline(e.target.value || undefined)}
                  placeholder="e.g., Jan 2024 to Dec 2025"
                />
              </div>
            </div>
            
            <div>
              <Label>Preferred Outcomes (Optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferredOutcomes.map((outcome, index) => (
                  <Badge key={index} variant="secondary" className="text-sm p-1.5">
                    {outcome}
                    <button 
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemoveOutcome(index)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex mt-2">
                <Input
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  placeholder="Add preferred outcome"
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddOutcome} 
                  className="ml-2"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleGenerateScenarios} 
            disabled={loading}
            className="w-full"
          >
            {loading ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Scenarios'}
          </Button>
        </CardFooter>
      </Card>
      
      {error && (
        <div className="bg-destructive/15 text-destructive rounded-md p-4 mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center my-12">
          <Loading size="lg" />
        </div>
      )}
      
      {generatedScenarios && !loading && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Scenarios</CardTitle>
              {generatedScenarios.summary && (
                <CardDescription>{generatedScenarios.summary}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {generatedScenarios.scenarios.map((scenario, index) => (
                  <AccordionItem key={index} value={`scenario-${index}`}>
                    <AccordionTrigger className="text-left">
                      {scenario.name} 
                      <div className="ml-auto flex items-center text-sm gap-2">
                        <span className="inline-flex items-center text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5 mr-1" />
                          ${scenario.cost.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center text-muted-foreground">
                          <BarChart4 className="h-3.5 w-3.5 mr-1" />
                          {(scenario.feasibility * 100).toFixed(0)}%
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Timeline
                            </h4>
                            <p className="text-sm mt-1">{scenario.timeline}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Cost Estimate
                            </h4>
                            <p className="text-sm mt-1">${scenario.cost.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium flex items-center">
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Benefits
                            </h4>
                            <ul className="text-sm mt-1 list-disc pl-5">
                              {scenario.benefits.map((benefit, i) => (
                                <li key={i}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium flex items-center">
                              <ThumbsDown className="h-4 w-4 mr-2" />
                              Drawbacks
                            </h4>
                            <ul className="text-sm mt-1 list-disc pl-5">
                              {scenario.drawbacks.map((drawback, i) => (
                                <li key={i}>{drawback}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium flex items-center">
                            <BarChart4 className="h-4 w-4 mr-2" />
                            Feasibility
                          </h4>
                          <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${scenario.feasibility * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-right mt-1">
                            {(scenario.feasibility * 100).toFixed(0)}%
                          </p>
                        </div>
                        
                        {scenario.impact && (
                          <div>
                            <h4 className="text-sm font-medium">Impact Assessment</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                              {Object.entries(scenario.impact).map(([key, value]) => (
                                <div key={key} className="bg-muted rounded-md p-2 text-center">
                                  <div className="text-xs text-muted-foreground capitalize">
                                    {key}
                                  </div>
                                  <div className="font-medium mt-1">{value}/10</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {scenario.analysis && (
                          <div>
                            <h4 className="text-sm font-medium flex items-center">
                              <Lightbulb className="h-4 w-4 mr-2" />
                              Analysis
                            </h4>
                            <p className="text-sm mt-1">{scenario.analysis}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRefiningScenario(scenario);
                              setFeedbackText('');
                            }}
                          >
                            Refine Scenario
                          </Button>
                          
                          {onSaveScenario && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSaveScenario(scenario)}
                              disabled={savingScenarioId === (scenario.id || scenario.name)}
                            >
                              {savingScenarioId === (scenario.id || scenario.name) ? (
                                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                              ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save Scenario</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              {generatedScenarios.recommendation && (
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                    Recommendation
                  </h4>
                  <p className="text-sm">{generatedScenarios.recommendation}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {refiningScenario && (
            <Card>
              <CardHeader>
                <CardTitle>Refine Scenario</CardTitle>
                <CardDescription>
                  Provide feedback to refine &quot;{refiningScenario.name}&quot;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter your feedback or constraints to improve this scenario..."
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setRefiningScenario(null)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!feedbackText.trim() || loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      // This would need to be implemented in the scenario service
                      // const refinedScenario = await refineScenario(project, refiningScenario, feedbackText);
                      
                      // For now, we'll just simulate this
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      const refinedScenario = {
                        ...refiningScenario,
                        name: `Refined: ${refiningScenario.name}`,
                        description: `${refiningScenario.description} (Refined based on feedback)`
                      };
                      
                      // Update the list with the refined scenario
                      if (generatedScenarios) {
                        const updatedScenarios = [...generatedScenarios.scenarios];
                        const index = updatedScenarios.findIndex(s => 
                          (s.id && s.id === refiningScenario.id) || s.name === refiningScenario.name
                        );
                        
                        if (index !== -1) {
                          updatedScenarios[index] = refinedScenario;
                          setGeneratedScenarios({
                            ...generatedScenarios,
                            scenarios: updatedScenarios
                          });
                        }
                      }
                      
                      setRefiningScenario(null);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'An error occurred refining the scenario');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Refining...</> : 'Refine Scenario'}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 