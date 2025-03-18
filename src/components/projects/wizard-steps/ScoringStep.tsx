"use client"

import { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Project, ProjectScores } from '@/types/project';
import { useProjectWizard } from '@/contexts/ProjectWizardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Info, Lightbulb, RefreshCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScoringStepProps {
  projectData: Partial<Project>;
  onSave: (data: Partial<Project>) => void;
  errors: string[];
}

const ScoringStep: React.FC<ScoringStepProps> = ({ projectData, onSave, _errors }) => {
  const { config } = useProjectWizard();
  
  // Initialize scores from project data or default to 0
  const [scores, setScores] = useState<ProjectScores>(
    projectData.scores || {
      safety: 0,
      equity: 0,
      climate: 0,
      congestion: 0,
      costEffectiveness: 0,
      multimodal: 0,
    }
  );
  
  // Calculate weighted score
  const calculateWeightedScore = (): number => {
    let totalScore = 0;
    let totalWeight = 0;
    
    config.scoringCriteria.forEach(criteria => {
      if (criteria.enabled) {
        const score = scores[criteria.id as keyof ProjectScores] || 0;
        totalScore += score * criteria.weight;
        totalWeight += criteria.weight;
      }
    });
    
    // Normalize to 0-100 scale
    return totalWeight > 0 ? Math.round(totalScore / totalWeight * 100) : 0;
  };
  
  const weightedScore = calculateWeightedScore();
  
  // Determine score category based on weighted score
  const getScoreCategory = (score: number): { label: string; color: string } => {
    if (score >= 85) return { label: 'Excellent', color: 'bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-400' };
    if (score >= 70) return { label: 'Good', color: 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-400' };
    if (score >= 50) return { label: 'Average', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-400' };
    if (score >= 30) return { label: 'Below Average', color: 'bg-orange-100 text-orange-800 dark:bg-orange-400/20 dark:text-orange-400' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-400' };
  };
  
  const scoreCategory = getScoreCategory(weightedScore);
  
  // Prepare data for chart
  const chartData = config.scoringCriteria
    .filter(criteria => criteria.enabled)
    .map(criteria => ({
      name: criteria.name,
      score: scores[criteria.id as keyof ProjectScores] || 0,
      weight: criteria.weight,
    }));
  
  // Color map for criteria
  const criteriaColors: Record<string, string> = {
    safety: "#ef4444",
    equity: "#8b5cf6",
    climate: "#10b981",
    congestion: "#f59e0b",
    costEffectiveness: "#3b82f6",
    multimodal: "#ec4899"
  };
  
  useEffect(() => {
    // Save scores whenever they change
    onSave({ scores });
  }, [scores, onSave]);
  
  const handleScoreChange = (criteriaId: string, value: number[]) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: value[0]
    }));
  };
  
  // Auto-generate scores based on project data (simplified version)
  const autoGenerateScores = () => {
    // In a real app, this would use more sophisticated logic based on project details
    // This is just a simple random generator for demonstration
    const newScores = { ...scores };
    
    config.scoringCriteria.forEach(criteria => {
      if (criteria.enabled) {
        // Generate a random score between 50 and 90
        newScores[criteria.id as keyof ProjectScores] = Math.floor(Math.random() * 40) + 50;
      }
    });
    
    setScores(newScores);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Project Scoring</CardTitle>
            <CardDescription>
              Score the project across multiple criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {config.scoringCriteria
                .filter(criteria => criteria.enabled)
                .map((criteria) => (
                <div key={criteria.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`score-${criteria.id}`}>
                      {criteria.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Weight: {criteria.weight}%)
                      </span>
                    </Label>
                    <span className="font-bold">{scores[criteria.id as keyof ProjectScores] || 0}</span>
                  </div>
                  
                  <Slider 
                    id={`score-${criteria.id}`}
                    min={0} 
                    max={100} 
                    step={1}
                    value={[scores[criteria.id as keyof ProjectScores] || 0]}
                    onValueChange={(value) => handleScoreChange(criteria.id, value)}
                    className={`${criteriaColors[criteria.id] ? `[--range-color:${criteriaColors[criteria.id]}]` : ""}`}
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    {criteria.description}
                  </p>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={autoGenerateScores}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Auto-Generate Scores
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Score</CardTitle>
            <CardDescription>
              Weighted average of all criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative w-36 h-36 flex items-center justify-center mb-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="10" 
                  className="text-muted opacity-20" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="10" 
                  strokeDasharray={`${weightedScore * 2.83} 283`} 
                  strokeDashoffset="0" 
                  className="text-primary" 
                  transform="rotate(-90 50 50)" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{weightedScore}</span>
                <span className="text-sm text-muted-foreground">out of 100</span>
              </div>
            </div>
            
            <div className={`text-sm font-medium px-2 py-1 rounded-full ${scoreCategory.color}`}>
              {scoreCategory.label}
            </div>
          </CardContent>
          <CardFooter className="border-t p-4 text-sm">
            <div className="space-y-2 w-full">
              <h4 className="font-medium flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                Scoring Insights
              </h4>
              <p className="text-muted-foreground">
                {weightedScore >= 70 
                  ? "This project scores well and should be prioritized." 
                  : "Consider improvements to increase this project's score."}
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="chart" className="flex-1">
                <BarChart3 className="h-4 w-4 mr-2" />
                Chart View
              </TabsTrigger>
              <TabsTrigger value="table" className="flex-1">
                <BarChart3 className="h-4 w-4 mr-2" rotate={90} />
                Table View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" name="Score" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="table">
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Criteria</th>
                      <th className="p-2 text-left font-medium">Weight</th>
                      <th className="p-2 text-left font-medium">Score</th>
                      <th className="p-2 text-left font-medium">Weighted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.weight}%</td>
                        <td className="p-2">{item.score}</td>
                        <td className="p-2 font-medium">
                          {Math.round(item.score * (item.weight / 100))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Alert>
        <Info className="h-4 w-4 mr-2" />
        <AlertDescription>
          Project scores help prioritize investments and ensure alignment with regional goals and objectives.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ScoringStep; 