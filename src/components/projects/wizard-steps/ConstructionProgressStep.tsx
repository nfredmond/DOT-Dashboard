import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckSquare
} from 'lucide-react';
import { ConstructionProgress, ConstructionSegment } from '@/types/project';

interface ConstructionProgressStepProps {
  projectData: any;
  onSave: (data: any) => void;
  errors?: Record<string, string>;
}

const ConstructionProgressStep: React.FC<ConstructionProgressStepProps> = ({ 
  projectData, 
  onSave, 
  errors 
}) => {
  // Initialize with existing progress data or create default
  const [progress, setProgress] = useState<ConstructionProgress>(
    projectData.constructionProgress || {
      overallCompletion: 0,
      currentPhase: 'Not Started',
      lastUpdated: new Date().toISOString(),
      segments: []
    }
  );
  
  const [isAddingSegment, setIsAddingSegment] = useState(false);
  const [isEditingSegment, setIsEditingSegment] = useState(false);
  const [currentSegment, setCurrentSegment] = useState<ConstructionSegment | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number | null>(null);
  const [issues, setIssues] = useState<string[]>([]); // For adding issues to segments
  const [newIssue, setNewIssue] = useState('');
  
  // Default empty segment
  const emptySegment: ConstructionSegment = {
    id: `segment-${Date.now()}`,
    name: '',
    description: '',
    completion: 0,
    startDate: '',
    endDate: '',
    contractor: '',
    issues: []
  };
  
  useEffect(() => {
    // Save construction progress data whenever it changes
    onSave({ constructionProgress: progress });
  }, [progress, onSave]);
  
  // Recalculate overall completion whenever segments change
  useEffect(() => {
    if (progress.segments && progress.segments.length > 0) {
      const total = progress.segments.reduce((sum, segment) => sum + segment.completion, 0);
      const average = total / progress.segments.length;
      
      setProgress(prev => ({
        ...prev,
        overallCompletion: Math.round(average),
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [progress.segments]);
  
  const handleAddSegment = () => {
    setCurrentSegment({ ...emptySegment, id: `segment-${Date.now()}` });
    setIsAddingSegment(true);
    setIssues([]);
  };
  
  const handleEditSegment = (index: number) => {
    const segment = { ...progress.segments![index] };
    setCurrentSegment(segment);
    setCurrentSegmentIndex(index);
    setIssues(segment.issues || []);
    setIsEditingSegment(true);
  };
  
  const handleDeleteSegment = (index: number) => {
    const updatedSegments = [...(progress.segments || [])];
    updatedSegments.splice(index, 1);
    
    setProgress({
      ...progress,
      segments: updatedSegments,
      lastUpdated: new Date().toISOString()
    });
  };
  
  const handleSegmentChange = (field: string, value: any) => {
    if (currentSegment) {
      setCurrentSegment({
        ...currentSegment,
        [field]: value
      });
    }
  };
  
  const handleSaveSegment = () => {
    if (!currentSegment) return;
    
    // Validation
    if (!currentSegment.name) {
      // Show error or handle validation
      return;
    }
    
    currentSegment.issues = [...issues];
    
    const updatedSegments = [...(progress.segments || [])];
    
    if (isEditingSegment && currentSegmentIndex !== null) {
      // Update existing segment
      updatedSegments[currentSegmentIndex] = currentSegment;
    } else {
      // Add new segment
      updatedSegments.push(currentSegment);
    }
    
    setProgress({
      ...progress,
      segments: updatedSegments,
      lastUpdated: new Date().toISOString()
    });
    
    closeSegmentModal();
  };
  
  const closeSegmentModal = () => {
    setIsAddingSegment(false);
    setIsEditingSegment(false);
    setCurrentSegment(null);
    setCurrentSegmentIndex(null);
    setIssues([]);
  };
  
  const handleAddIssue = () => {
    if (newIssue.trim()) {
      setIssues([...issues, newIssue.trim()]);
      setNewIssue('');
    }
  };
  
  const handleRemoveIssue = (index: number) => {
    const updatedIssues = [...issues];
    updatedIssues.splice(index, 1);
    setIssues(updatedIssues);
  };
  
  const handleOverallCompletionChange = (value: number[]) => {
    setProgress({
      ...progress,
      overallCompletion: value[0],
      lastUpdated: new Date().toISOString()
    });
  };
  
  const handleCurrentPhaseChange = (value: string) => {
    setProgress({
      ...progress,
      currentPhase: value,
      lastUpdated: new Date().toISOString()
    });
  };
  
  const handleStatusFieldChange = (field: string, value: string) => {
    setProgress({
      ...progress,
      [field]: value,
      lastUpdated: new Date().toISOString()
    });
  };
  
  // Construction phases
  const constructionPhases = [
    'Not Started',
    'Mobilization', 
    'Site Preparation',
    'Foundation', 
    'Structural',
    'Building Enclosure',
    'Interiors',
    'Systems Installation',
    'Testing',
    'Commissioning',
    'Substantial Completion',
    'Final Completion'
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Construction Progress</CardTitle>
          <CardDescription>
            Track construction progress, phases, and issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <span className="text-lg font-medium">{progress.overallCompletion}%</span>
            </div>
            <Progress value={progress.overallCompletion} className="h-3" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="currentPhase">Current Phase</Label>
                <Select 
                  value={progress.currentPhase} 
                  onValueChange={handleCurrentPhaseChange}
                >
                  <SelectTrigger id="currentPhase">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {constructionPhases.map(phase => (
                      <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Construction Start</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={progress.startDate || ''}
                  onChange={(e) => handleStatusFieldChange('startDate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimatedCompletionDate">Estimated Completion</Label>
                <Input
                  id="estimatedCompletionDate"
                  type="date"
                  value={progress.estimatedCompletionDate || ''}
                  onChange={(e) => handleStatusFieldChange('estimatedCompletionDate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inspectionStatus">Inspection Status</Label>
                <Select 
                  value={progress.inspectionStatus || 'Not Started'} 
                  onValueChange={(value) => handleStatusFieldChange('inspectionStatus', value)}
                >
                  <SelectTrigger id="inspectionStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Passed">Passed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="contractorNotes">Contractor Notes</Label>
                <Textarea
                  id="contractorNotes"
                  value={progress.contractorNotes || ''}
                  onChange={(e) => handleStatusFieldChange('contractorNotes', e.target.value)}
                  placeholder="Enter contractor notes or comments about overall progress"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="delayReason">Delay Reason (if any)</Label>
                <Textarea
                  id="delayReason"
                  value={progress.delayReason || ''}
                  onChange={(e) => handleStatusFieldChange('delayReason', e.target.value)}
                  placeholder="Explain any delays or issues affecting the schedule"
                  rows={2}
                />
              </div>
            </div>
          </div>
          
          {/* Construction Segments */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Construction Segments/Phases</h3>
              <Button onClick={handleAddSegment} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Segment
              </Button>
            </div>
            
            {progress.segments && progress.segments.length > 0 ? (
              <div className="space-y-4">
                {progress.segments.map((segment, index) => (
                  <Card key={segment.id} className="overflow-hidden">
                    <div className="relative">
                      <Progress value={segment.completion} className="h-1 absolute top-0 left-0 right-0" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{segment.name}</CardTitle>
                          <CardDescription>{segment.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-medium">{segment.completion}%</span>
                          {segment.issues && segment.issues.length > 0 && (
                            <div className="flex items-center text-amber-500 text-sm">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span>{segment.issues.length} {segment.issues.length === 1 ? 'issue' : 'issues'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="block text-muted-foreground">Start Date</span>
                          <span>{segment.startDate ? new Date(segment.startDate).toLocaleDateString() : 'Not set'}</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground">End Date</span>
                          <span>{segment.endDate ? new Date(segment.endDate).toLocaleDateString() : 'Not set'}</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground">Contractor</span>
                          <span>{segment.contractor || 'Not assigned'}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSegment(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSegment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                No construction segments have been added yet. Add segments to track specific parts of the project.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Segment Modal */}
      <Dialog 
        open={isAddingSegment || isEditingSegment} 
        onOpenChange={isOpen => {
          if (!isOpen) closeSegmentModal();
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingSegment ? 'Edit Construction Segment' : 'Add Construction Segment'}
            </DialogTitle>
            <DialogDescription>
              {isEditingSegment 
                ? 'Update construction segment details and progress' 
                : 'Enter details for the new construction segment'}
            </DialogDescription>
          </DialogHeader>
          
          {currentSegment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Segment Name</Label>
                  <Input
                    id="name"
                    value={currentSegment.name}
                    onChange={(e) => handleSegmentChange('name', e.target.value)}
                    placeholder="e.g., Foundation Phase, East Wing, Bridge Deck"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentSegment.description || ''}
                    onChange={(e) => handleSegmentChange('description', e.target.value)}
                    placeholder="Describe this segment or phase"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="completion">Completion Percentage ({currentSegment.completion}%)</Label>
                  <Slider
                    id="completion"
                    value={[currentSegment.completion]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => handleSegmentChange('completion', value[0])}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={currentSegment.startDate || ''}
                      onChange={(e) => handleSegmentChange('startDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={currentSegment.endDate || ''}
                      onChange={(e) => handleSegmentChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contractor">Contractor</Label>
                  <Input
                    id="contractor"
                    value={currentSegment.contractor || ''}
                    onChange={(e) => handleSegmentChange('contractor', e.target.value)}
                    placeholder="Contractor responsible for this segment"
                  />
                </div>
                
                <div className="space-y-4">
                  <Label>Issues/Concerns</Label>
                  
                  <div className="flex space-x-2">
                    <Input
                      value={newIssue}
                      onChange={(e) => setNewIssue(e.target.value)}
                      placeholder="Add issue or concern"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddIssue();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddIssue}>
                      Add
                    </Button>
                  </div>
                  
                  {issues.length > 0 ? (
                    <ul className="space-y-2 mt-2">
                      {issues.map((issue, i) => (
                        <li 
                          key={i} 
                          className="flex justify-between items-center p-2 bg-muted rounded-md"
                        >
                          <span>{issue}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveIssue(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No issues added. Add issues to track problems or concerns.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeSegmentModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveSegment}>
              {isEditingSegment ? 'Update Segment' : 'Add Segment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConstructionProgressStep;