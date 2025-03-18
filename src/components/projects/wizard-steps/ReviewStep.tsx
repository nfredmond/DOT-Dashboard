"use client"

import { useEffect } from 'react';
import { Project, ProjectScores } from '@/types/project';
import { useProjectWizard } from '@/contexts/ProjectWizardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  AlertTriangle, 
  CalendarCheck, 
  Check, 
  FileText, 
  Info, 
  MapPin, 
  BadgeDollarSign,
  BarChart3,
  Clock,
  Building,
  FileWarning,
  Tag
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface ReviewStepProps {
  projectData: Partial<Project>;
  onSave: (data: Partial<Project>) => void;
  errors: string[];
}

const ReviewStep: React.FC<ReviewStepProps> = ({ projectData, onSave, errors }) => {
  const { config } = useProjectWizard();
  
  useEffect(() => {
    // Set project ready for submission
    onSave({ isReviewCompleted: true });
  }, [onSave]);
  
  // Function to check if a section has any data
  const hasSectionData = (section: string): boolean => {
    switch(section) {
      case 'basic':
        return !!(projectData.name || projectData.description || projectData.category || projectData.status || (projectData.tags && projectData.tags.length > 0));
      case 'location':
        return !!(projectData.location || (projectData.coordinates && (projectData.coordinates.latitude !== 0 || projectData.coordinates.longitude !== 0)));
      case 'environmental':
        return !!(projectData.nepaStatus || projectData.ceqaStatus || projectData.environmentalDocumentType || projectData.environmentalClearanceDate || 
          (projectData.environmentalDocumentation && (
            projectData.environmentalDocumentation.nepaDocumentNumber ||
            projectData.environmentalDocumentation.ceqaDocumentNumber ||
            projectData.environmentalDocumentation.leadAgency
          )));
      case 'funding':
        return !!(projectData.estimatedCost || projectData.allocatedBudget ||
          (projectData.fundingSources && projectData.fundingSources.length > 0));
      case 'scoring':
        return !!(projectData.scores && Object.values(projectData.scores).some(score => score > 0));
      default:
        return false;
    }
  };
  
  // Function to calculate completeness percentage of a section
  const getSectionCompleteness = (section: string): number => {
    let fields: string[] = [];
    let filledFields = 0;
    
    switch(section) {
      case 'basic':
        fields = ['name', 'description', 'category', 'status', 'priority', 'startDate', 'endDate'];
        filledFields = fields.filter(field => !!projectData[field as keyof Project]).length;
        return Math.round((filledFields / fields.length) * 100);
        
      case 'location':
        fields = ['location', 'coordinates', 'mapType'];
        filledFields = fields.filter(field => {
          if (field === 'coordinates') {
            return projectData.coordinates && (projectData.coordinates.latitude !== 0 || projectData.coordinates.longitude !== 0);
          }
          return !!projectData[field as keyof Project];
        }).length;
        return Math.round((filledFields / fields.length) * 100);
        
      case 'environmental':
        fields = ['nepaStatus', 'ceqaStatus', 'environmentalDocumentType', 'environmentalClearanceDate', 'environmentalDocumentation'];
        filledFields = fields.filter(field => {
          if (field === 'environmentalDocumentation') {
            return projectData.environmentalDocumentation && Object.values(projectData.environmentalDocumentation).some(value => !!value);
          }
          return !!projectData[field as keyof Project];
        }).length;
        return Math.round((filledFields / fields.length) * 100);
        
      case 'funding':
        fields = ['estimatedCost', 'allocatedBudget', 'fundingSources'];
        filledFields = fields.filter(field => {
          if (field === 'fundingSources') {
            return projectData.fundingSources && projectData.fundingSources.length > 0;
          }
          return projectData[field as keyof Project] !== undefined && projectData[field as keyof Project] !== null;
        }).length;
        return Math.round((filledFields / fields.length) * 100);
        
      case 'scoring':
        if (!projectData.scores) return 0;
        const scoringFields = Object.keys(projectData.scores);
        const filledScores = scoringFields.filter(field => (projectData.scores as ProjectScores)[field as keyof ProjectScores] > 0);
        return scoringFields.length ? Math.round((filledScores.length / scoringFields.length) * 100) : 0;
        
      default:
        return 0;
    }
  };
  
  // Calculate overall project completeness
  const calculateOverallCompleteness = (): number => {
    const sections = ['basic', 'location', 'environmental', 'funding', 'scoring'];
    const completeness = sections.map(section => getSectionCompleteness(section));
    return Math.round(completeness.reduce((sum, value) => sum + value, 0) / sections.length);
  };
  
  const overallCompleteness = calculateOverallCompleteness();
  
  // Format date function
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };
  
  // Status color map
  const statusColors: Record<string, string> = {
    'Planned': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-500',
    'Approved': 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-500',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-500',
    'On Hold': 'bg-orange-100 text-orange-800 dark:bg-orange-400/20 dark:text-orange-500',
    'Delayed': 'bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-500',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-500',
    'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-400/20 dark:text-gray-500',
  };
  
  // Priority color map
  const priorityColors: Record<string, string> = {
    'Low': 'bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-500',
    'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-500',
    'High': 'bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-500',
    'Critical': 'bg-purple-100 text-purple-800 dark:bg-purple-400/20 dark:text-purple-500',
  };
  
  // Color map for scoring criteria
  const criteriaColors: Record<string, string> = {
    safety: "#ef4444",
    equity: "#8b5cf6",
    climate: "#10b981",
    congestion: "#f59e0b",
    costEffectiveness: "#3b82f6",
    multimodal: "#ec4899"
  };
  
  // Calculate the score category
  const getScoreCategory = (score: number): { label: string; color: string } => {
    if (score >= 85) return { label: 'Excellent', color: 'bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-400' };
    if (score >= 70) return { label: 'Good', color: 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-400' };
    if (score >= 50) return { label: 'Average', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-400' };
    if (score >= 30) return { label: 'Below Average', color: 'bg-orange-100 text-orange-800 dark:bg-orange-400/20 dark:text-orange-400' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-400' };
  };
  
  // Calculate weighted score
  const calculateWeightedScore = (): number => {
    if (!projectData.scores) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    config.scoringCriteria.forEach(criteria => {
      if (criteria.enabled) {
        const score = projectData.scores?.[criteria.id as keyof ProjectScores] || 0;
        totalScore += score * criteria.weight;
        totalWeight += criteria.weight;
      }
    });
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight * 100) : 0;
  };
  
  const weightedScore = calculateWeightedScore();
  const scoreCategory = getScoreCategory(weightedScore);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Project Review</CardTitle>
              <CardDescription>
                Review all project details before submission
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Completeness</div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-20 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${overallCompleteness}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{overallCompleteness}%</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['basic']} className="space-y-4">
            <AccordionItem value="basic" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1 text-left">Basic Information</div>
                  <Badge className={getSectionCompleteness('basic') === 100 
                    ? "bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-400" 
                    : "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-400"}
                  >
                    {getSectionCompleteness('basic')}% Complete
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                {hasSectionData('basic') ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Project Name</div>
                        <div className="font-medium">{projectData.name || 'Not provided'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Description</div>
                        <div>{projectData.description || 'Not provided'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Category</div>
                        <div>{projectData.category || 'Not specified'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1.5">
                          {projectData.tags && projectData.tags.length > 0 ? (
                            projectData.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">No tags</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        {projectData.status ? (
                          <Badge className={statusColors[projectData.status] || ''}>
                            {projectData.status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Priority</div>
                        {projectData.priority ? (
                          <Badge className={priorityColors[projectData.priority] || ''}>
                            {projectData.priority}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Dates</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">Start: {formatDate(projectData.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">End: {formatDate(projectData.endDate)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Lead Agency</div>
                        <div className="flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{projectData.leadAgency || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <FileWarning className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No basic information provided</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="location" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div className="flex-1 text-left">Location</div>
                  <Badge className={getSectionCompleteness('location') === 100 
                    ? "bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-400" 
                    : "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-400"}
                  >
                    {getSectionCompleteness('location')}% Complete
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                {hasSectionData('location') ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Location Description</div>
                        <div className="font-medium">{projectData.location || 'Not provided'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Map Type</div>
                        <div className="capitalize">{projectData.mapType || 'Default'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Coordinates</div>
                        {projectData.coordinates && (projectData.coordinates.latitude !== 0 || projectData.coordinates.longitude !== 0) ? (
                          <div className="font-mono text-sm">
                            Lat: {projectData.coordinates.latitude}, Long: {projectData.coordinates.longitude}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No location information provided</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="environmental" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1 text-left">Environmental Documentation</div>
                  <Badge className={getSectionCompleteness('environmental') === 100 
                    ? "bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-400" 
                    : "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-400"}
                  >
                    {getSectionCompleteness('environmental')}% Complete
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                {hasSectionData('environmental') ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">NEPA Status</div>
                        <Badge variant="outline">
                          {projectData.nepaStatus || 'Not Started'}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">CEQA Status</div>
                        <Badge variant="outline">
                          {projectData.ceqaStatus || 'Not Started'}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Document Type</div>
                        <div>{projectData.environmentalDocumentType || 'Not Required'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Clearance Date</div>
                        <div>{formatDate(projectData.environmentalClearanceDate)}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Lead Agency</div>
                        <div>
                          {projectData.environmentalDocumentation?.leadAgency || 'Not specified'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Document Numbers</div>
                        <div className="space-y-1">
                          <div className="text-sm">
                            NEPA: {projectData.environmentalDocumentation?.nepaDocumentNumber || 'Not provided'}
                          </div>
                          <div className="text-sm">
                            CEQA: {projectData.environmentalDocumentation?.ceqaDocumentNumber || 'Not provided'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No environmental documentation provided</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="funding" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                <div className="flex items-center gap-3">
                  <BadgeDollarSign className="h-5 w-5 text-primary" />
                  <div className="flex-1 text-left">Funding & Budget</div>
                  <Badge className={getSectionCompleteness('funding') === 100 
                    ? "bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-400" 
                    : "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-400"}
                  >
                    {getSectionCompleteness('funding')}% Complete
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                {hasSectionData('funding') ? (
                  <div className="mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Estimated Cost</div>
                          <div className="font-medium">{formatCurrency(projectData.estimatedCost || 0)}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Allocated Budget</div>
                          <div>{formatCurrency(projectData.allocatedBudget || 0)}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">PS&E Budget</div>
                          <div>{formatCurrency(projectData.pseBudget || 0)}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">CE Budget</div>
                          <div>{formatCurrency(projectData.ceBudget || 0)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Funding Sources</div>
                      {projectData.fundingSources && projectData.fundingSources.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-muted/50 border-b text-sm">
                                <th className="p-2 text-left font-medium">Source</th>
                                <th className="p-2 text-left font-medium">Amount</th>
                                <th className="p-2 text-left font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectData.fundingSources.map((source, index) => (
                                <tr key={source.id} className={index !== projectData.fundingSources!.length - 1 ? "border-b" : ""}>
                                  <td className="p-2">
                                    <div className="font-medium">{source.name}</div>
                                    {source.description && (
                                      <div className="text-xs text-muted-foreground">{source.description}</div>
                                    )}
                                  </td>
                                  <td className="p-2">{formatCurrency(source.amount)}</td>
                                  <td className="p-2">
                                    <Badge variant={source.secured ? "default" : "outline"}>
                                      {source.secured ? "Secured" : "Potential"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-2 text-center text-muted-foreground bg-muted/30 rounded-md">
                          No funding sources added
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <BadgeDollarSign className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No funding information provided</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="scoring" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div className="flex-1 text-left">Project Scoring</div>
                  <Badge className={getSectionCompleteness('scoring') === 100 
                    ? "bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-400" 
                    : "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-400"}
                  >
                    {getSectionCompleteness('scoring')}% Complete
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                {hasSectionData('scoring') ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div className="md:col-span-2">
                      <div className="text-sm text-muted-foreground mb-3">Scoring Breakdown</div>
                      <div className="space-y-3">
                        {projectData.scores && config.scoringCriteria
                          .filter(criteria => criteria.enabled)
                          .map(criteria => (
                            <div key={criteria.id} className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{criteria.name}</div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                  <span>Weight: {criteria.weight}%</span>
                                  <span>{projectData.scores?.[criteria.id as keyof ProjectScores] || 0}/100</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ 
                                      width: `${projectData.scores?.[criteria.id as keyof ProjectScores] || 0}%`,
                                      backgroundColor: criteriaColors[criteria.id] || '' 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    
                    <div className="md:col-span-1">
                      <div className="text-sm text-muted-foreground mb-3">Overall Score</div>
                      <div className="flex flex-col items-center p-4 border rounded-md">
                        <div className="text-4xl font-bold text-primary mb-1">{weightedScore}</div>
                        <div className={`text-sm px-2 py-0.5 rounded-full mb-2 ${scoreCategory.color}`}>
                          {scoreCategory.label}
                        </div>
                        <div className="text-xs text-center text-muted-foreground">
                          Weighted score across all criteria
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No scoring information provided</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="border-t flex-col items-start pt-6">
          {errors.length > 0 ? (
            <Alert variant="destructive" className="mb-4 w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertTitle>Required Information Missing</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 w-full">
              <Check className="h-4 w-4 mr-2" />
              <AlertTitle>Ready for Submission</AlertTitle>
              <AlertDescription>
                All required information has been provided. You can now submit this project.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="w-full flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <div className="text-sm text-muted-foreground mt-4 sm:mt-0">
              {errors.length === 0 ? (
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-1.5" />
                  After submission, you can still edit this project if needed
                </div>
              ) : (
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-1.5" />
                  Please complete all required fields before submission
                </div>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReviewStep; 