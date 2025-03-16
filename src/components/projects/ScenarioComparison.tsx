'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { GeneratedScenario } from '@/lib/analysis/scenario-service';
import { Project } from '@/types/project';
import { 
  BarChart4, 
  Check, 
  Clock, 
  DollarSign, 
  Lightbulb, 
  RefreshCw, 
  ThumbsDown, 
  ThumbsUp 
} from 'lucide-react';
import Loading from '@/components/ui/loading';

interface ScenarioComparisonProps {
  project: Project;
  scenarios: GeneratedScenario[];
  className?: string;
}

interface ComparisonResult {
  comparison: string;
  recommendation: string;
  scores: Record<string, { scenario1: number; scenario2: number }>;
  id?: string;
}

export function ScenarioComparison({ project, scenarios, className }: ScenarioComparisonProps) {
  const { toast } = useToast();
  const [scenario1Id, setScenario1Id] = useState<string>('');
  const [scenario2Id, setScenario2Id] = useState<string>('');
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  
  const scenario1 = scenarios.find(s => s.id === scenario1Id);
  const scenario2 = scenarios.find(s => s.id === scenario2Id);
  
  const handleCompare = async () => {
    if (!scenario1Id || !scenario2Id) {
      toast({
        title: 'Select scenarios',
        description: 'Please select two scenarios to compare',
        variant: 'destructive'
      });
      return;
    }
    
    if (scenario1Id === scenario2Id) {
      toast({
        title: 'Invalid selection',
        description: 'Please select two different scenarios to compare',
        variant: 'destructive'
      });
      return;
    }
    
    setComparing(true);
    
    try {
      const response = await fetch(`/api/projects/${project.id}/scenarios`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario1Id,
          scenario2Id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to compare scenarios');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error comparing scenarios:', error);
      toast({
        title: 'Comparison failed',
        description: error instanceof Error ? error.message : 'Failed to compare scenarios',
        variant: 'destructive'
      });
    } finally {
      setComparing(false);
    }
  };
  
  const renderScenarioCard = (scenario: GeneratedScenario | undefined, position: 'left' | 'right') => {
    if (!scenario) {
      return (
        <Card className="h-full flex flex-col justify-center items-center bg-muted/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="mb-2">No scenario selected</div>
            <Select
              value={position === 'left' ? scenario1Id : scenario2Id}
              onValueChange={position === 'left' ? setScenario1Id : setScenario2Id}
            >
              <SelectTrigger className="w-[240px] mx-auto">
                <SelectValue placeholder="Select a scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map(s => (
                  <SelectItem key={s.id} value={s.id || ''}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {scenario.name}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => position === 'left' ? setScenario1Id('') : setScenario2Id('')}
            >
              ×
            </Button>
          </CardTitle>
          <CardDescription>
            {scenario.timeline} • ${scenario.cost.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm mb-4 line-clamp-3">{scenario.description}</p>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </h4>
            <p className="text-sm mt-1">{scenario.timeline}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Cost
            </h4>
            <p className="text-sm mt-1">${scenario.cost.toLocaleString()}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center">
              <ThumbsUp className="h-4 w-4 mr-2" />
              Benefits
            </h4>
            <ul className="text-sm mt-1 list-disc pl-5 line-clamp-2">
              {scenario.benefits.slice(0, 2).map((benefit, i) => (
                <li key={i}>{benefit}</li>
              ))}
              {scenario.benefits.length > 2 && (
                <li className="text-muted-foreground">+{scenario.benefits.length - 2} more</li>
              )}
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center">
              <ThumbsDown className="h-4 w-4 mr-2" />
              Drawbacks
            </h4>
            <ul className="text-sm mt-1 list-disc pl-5 line-clamp-2">
              {scenario.drawbacks.slice(0, 2).map((drawback, i) => (
                <li key={i}>{drawback}</li>
              ))}
              {scenario.drawbacks.length > 2 && (
                <li className="text-muted-foreground">+{scenario.drawbacks.length - 2} more</li>
              )}
            </ul>
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
        </CardContent>
      </Card>
    );
  };
  
  const renderScores = () => {
    if (!result?.scores || Object.keys(result.scores).length === 0) {
      return null;
    }
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Comparison Scores</h3>
        <div className="grid gap-3">
          {Object.entries(result.scores).map(([category, scores]) => (
            <div key={category} className="bg-muted rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium capitalize">{category}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{scores.scenario1}/10</span>
                  <span className="text-sm text-muted-foreground">vs</span>
                  <span className="text-sm font-medium">{scores.scenario2}/10</span>
                </div>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div 
                    className="bg-primary h-full"
                    style={{ 
                      width: `${(scores.scenario1 / 10) * 50}%`, 
                      marginLeft: '50%',
                      transform: 'translateX(-100%)'
                    }}
                  />
                  <div 
                    className="bg-secondary h-full"
                    style={{ width: `${(scores.scenario2 / 10) * 50}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex justify-center">
                  <div className="w-px h-full bg-background/50" />
                </div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Scenario 1</span>
                <span>Scenario 2</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Compare Scenarios</CardTitle>
          <CardDescription>
            Select two scenarios to compare their benefits and drawbacks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderScenarioCard(scenario1, 'left')}
            {renderScenarioCard(scenario2, 'right')}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleCompare} 
            disabled={comparing || !scenario1Id || !scenario2Id || scenario1Id === scenario2Id}
            className="w-full"
          >
            {comparing ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Comparing...</>
            ) : (
              'Compare Scenarios'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {comparing && (
        <div className="flex justify-center my-8">
          <Loading size="lg" />
        </div>
      )}
      
      {result && !comparing && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Analysis</h3>
                <div className="bg-muted rounded-md p-4">
                  <p className="whitespace-pre-line">{result.comparison}</p>
                </div>
              </div>
              
              {result.recommendation && (
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                    Recommendation
                  </h3>
                  <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                    <p>{result.recommendation}</p>
                  </div>
                </div>
              )}
              
              {renderScores()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 