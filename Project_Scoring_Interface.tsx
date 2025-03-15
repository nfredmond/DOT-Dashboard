"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChartContainer } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts"
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  ArrowUpDown,
  BarChart3,
  Check,
  ChevronDown,
  Download,
  Filter,
  HelpCircle,
  Info,
  Lightbulb,
  PieChart,
  Plus,
  RadarIcon,
  RefreshCw,
  Save,
  Search,
  Settings,
  Share2,
  Sliders,
  SortAsc,
} from "lucide-react"

export default function ProjectScoringInterface() {
  const [selectedProjects, setSelectedProjects] = useState([1, 2])
  const [chartType, setChartType] = useState("bar")
  
  const projects = [
    {
      id: 1,
      title: "Downtown Transit Corridor Expansion",
      description: "Expanding bus lanes and adding dedicated bike paths along Main Street corridor",
      status: "In Progress",
      category: "Transit",
      location: "Central District",
      cost: 1250000,
      scores: {
        safety: 85,
        equity: 78,
        climate: 92,
        congestion: 65,
        costEffectiveness: 70,
        multimodal: 88
      }
    },
    {
      id: 2,
      title: "Highway 101 Safety Improvements",
      description: "Adding safety barriers and improved signage along Highway 101",
      status: "Planning",
      category: "Highway",
      location: "North County",
      cost: 3500000,
      scores: {
        safety: 95,
        equity: 62,
        climate: 45,
        congestion: 80,
        costEffectiveness: 75,
        multimodal: 40
      }
    },
    {
      id: 3,
      title: "Westside Pedestrian Bridge",
      description: "Construction of pedestrian bridge connecting West Park to downtown area",
      status: "Approved",
      category: "Pedestrian",
      location: "West District",
      cost: 950000,
      scores: {
        safety: 88,
        equity: 90,
        climate: 75,
        congestion: 50,
        costEffectiveness: 65,
        multimodal: 70
      }
    },
    {
      id: 4,
      title: "Rural Transit Connection Program",
      description: "Expanding transit services to underserved rural communities",
      status: "In Progress",
      category: "Transit",
      location: "Eastern Region",
      cost: 750000,
      scores: {
        safety: 70,
        equity: 95,
        climate: 85,
        congestion: 60,
        costEffectiveness: 80,
        multimodal: 75
      }
    },
  ]
  
  const criteria = [
    { id: "safety", name: "Safety", weight: 20, description: "Reduces accidents and improves safety for all road users" },
    { id: "equity", name: "Equity", weight: 15, description: "Provides benefits to disadvantaged communities" },
    { id: "climate", name: "Climate", weight: 15, description: "Reduces greenhouse gas emissions and supports climate goals" },
    { id: "congestion", name: "Congestion Relief", weight: 20, description: "Reduces traffic congestion and improves travel times" },
    { id: "costEffectiveness", name: "Cost Effectiveness", weight: 15, description: "Provides good value for the investment" },
    { id: "multimodal", name: "Multimodal", weight: 15, description: "Supports multiple transportation modes" }
  ]
  
  const statusColors = {
    "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-400",
    "Planning": "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-400",
    "Approved": "bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-400",
    "Completed": "bg-purple-100 text-purple-800 dark:bg-purple-400/20 dark:text-purple-400",
  }
  
  const categoryColors = {
    "Transit": "bg-indigo-100 text-indigo-800 dark:bg-indigo-400/20 dark:text-indigo-400",
    "Highway": "bg-sky-100 text-sky-800 dark:bg-sky-400/20 dark:text-sky-400",
    "Pedestrian": "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-400",
    "Bicycle": "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-400",
  }
  
  const criteriaColors = {
    "safety": "#ef4444",
    "equity": "#8b5cf6",
    "climate": "#10b981",
    "congestion": "#f59e0b",
    "costEffectiveness": "#3b82f6",
    "multimodal": "#ec4899"
  }
  
  // Calculate weighted scores
  const projectsWithTotalScores = projects.map(project => {
    let totalScore = 0;
    Object.entries(project.scores).forEach(([criteriaId, score]) => {
      const criteriaItem = criteria.find(c => c.id === criteriaId);
      if (criteriaItem) {
        totalScore += (score * criteriaItem.weight) / 100;
      }
    });
    return {
      ...project,
      totalScore: Math.round(totalScore)
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
  
  // Prepare comparison data for charts
  const selectedProjectsData = selectedProjects.map(id => {
    const project = projects.find(p => p.id === id);
    if (!project) return null;
    
    return {
      id: project.id,
      name: project.title,
      ...project.scores
    };
  }).filter(Boolean);
  
  // Prepare radar chart data
  const radarData = criteria.map(criterion => {
    const dataPoint = {
      criterion: criterion.name,
    };
    
    selectedProjectsData.forEach(project => {
      if (project) {
        dataPoint[project.name] = project[criterion.id];
      }
    });
    
    return dataPoint;
  });

  const toggleProjectSelection = (projectId) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    } else {
      setSelectedProjects([...selectedProjects, projectId]);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Scoring & Prioritization</h1>
          <p className="text-muted-foreground">Evaluate and compare transportation projects based on multiple criteria</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Scoring Settings
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Analysis
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {Object.keys(categoryColors).length} categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(projectsWithTotalScores.reduce((sum, p) => sum + p.totalScore, 0) / projects.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on weighted criteria
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Scoring Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Safety</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average score: 84.5/100
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle>Project Scoring Table</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search projects..." className="pl-8 h-9 w-[200px]" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Select defaultValue="score">
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Total Score</SelectItem>
                  <SelectItem value="safety">Safety Score</SelectItem>
                  <SelectItem value="equity">Equity Score</SelectItem>
                  <SelectItem value="cost">Project Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Safety</TableHead>
                <TableHead className="text-center">Equity</TableHead>
                <TableHead className="text-center">Climate</TableHead>
                <TableHead className="text-center">Congestion</TableHead>
                <TableHead className="text-center">Cost Eff.</TableHead>
                <TableHead className="text-center">Multimodal</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center">
                    Total Score
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsWithTotalScores.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => toggleProjectSelection(project.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{project.title}</div>
                    <div className="text-sm text-muted-foreground">{project.location}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={categoryColors[project.category]}>
                      {project.category}
                    </Badge>
                  </TableCell>
                  {criteria.map(criterion => (
                    <TableCell key={criterion.id} className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{project.scores[criterion.id]}</span>
                        <Progress 
                          value={project.scores[criterion.id]} 
                          className="h-1 w-12" 
                          style={{ 
                            backgroundColor: `${criteriaColors[criterion.id]}20`,
                            ['--progress-background' as any]: criteriaColors[criterion.id]
                          }} 
                        />
                      </div>
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center justify-center font-bold">
                      <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center">
                        {project.totalScore}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle>Project Comparison</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant={chartType === "bar" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartType("bar")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Bar
                </Button>
                <Button 
                  variant={chartType === "radar" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartType("radar")}
                >
                  <RadarIcon className="h-4 w-4 mr-2" />
                  Radar
                </Button>
              </div>
            </div>
            <CardDescription>
              Compare selected projects across all scoring criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <HelpCircle className="h-12 w-12 mb-2 opacity-20" />
                <p>Select projects from the table above to compare</p>
              </div>
            ) : chartType === "bar" ? (
              <ChartContainer config={{}}>
                <BarChart
                  data={selectedProjectsData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {criteria.map((criterion) => (
                    <Bar 
                      key={criterion.id}
                      dataKey={criterion.id} 
                      name={criterion.name}
                      fill={criteriaColors[criterion.id]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={{}}>
                <RadarChart 
                  outerRadius={150} 
                  width={500} 
                  height={350} 
                  data={radarData}
                  cy={175}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="criterion" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {selectedProjectsData.map((project, index) => (
                    project && (
                      <Radar 
                        key={project.id}
                        name={project.name}
                        dataKey={project.name}
                        stroke={Object.values(criteriaColors)[index % Object.values(criteriaColors).length]}
                        fill={Object.values(criteriaColors)[index % Object.values(criteriaColors).length]}
                        fillOpacity={0.2}
                      />
                    )
                  ))}
                  <Legend />
                </RadarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Scoring Criteria</CardTitle>
            <CardDescription>
              Weights and descriptions for each scoring criterion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: criteriaColors[criterion.id] }}
                      ></div>
                      <span className="font-medium">{criterion.name}</span>
                    </div>
                    <Badge variant="outline">{criterion.weight}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">
                    {criterion.description}
                  </p>
                </div>
              ))}
              
              <Separator className="my-4" />
              
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">AI Insights</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Projects with high safety and equity scores tend to receive funding more frequently in this region. Consider prioritizing these criteria.
                </p>
                <Button variant="link" className="text-xs p-0 h-auto mt-2">
                  View detailed analysis
                </Button>
              </div>
              
              <Button className="w-full" variant="outline">
                <Sliders className="h-4 w-4 mr-2" />
                Adjust Criteria Weights
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}