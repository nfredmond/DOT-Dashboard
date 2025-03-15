"use client"

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, EnvironmentalStatus, EnvironmentalDocumentType, EnvironmentalDocumentation } from '@/types/project';
import { useProjectWizard } from '@/contexts/ProjectWizardContext';
import { CalendarIcon, FileText, FileUp, ListTodo } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface EnvironmentalStepProps {
  projectData: Partial<Project>;
  onSave: (data: Partial<Project>) => void;
  errors: string[];
}

// Define a type that ensures consultingAgencies is always an array
interface EnvDocWithRequiredArrays extends Omit<EnvironmentalDocumentation, 'consultingAgencies'> {
  consultingAgencies: string[];
}

interface EnvironmentalFormData {
  environmentalDocumentation: EnvDocWithRequiredArrays;
  nepaStatus: EnvironmentalStatus;
  ceqaStatus: EnvironmentalStatus;
  environmentalDocumentType: EnvironmentalDocumentType;
  environmentalClearanceDate: string;
}

const EnvironmentalStep: React.FC<EnvironmentalStepProps> = ({ projectData, onSave, errors }) => {
  const { config } = useProjectWizard();
  
  const [formData, setFormData] = useState<EnvironmentalFormData>({
    environmentalDocumentation: {
      nepaDocumentNumber: projectData.environmentalDocumentation?.nepaDocumentNumber || '',
      ceqaDocumentNumber: projectData.environmentalDocumentation?.ceqaDocumentNumber || '',
      leadAgency: projectData.environmentalDocumentation?.leadAgency || '',
      consultingAgencies: projectData.environmentalDocumentation?.consultingAgencies || [],
      documentationComments: projectData.environmentalDocumentation?.documentationComments || '',
    },
    nepaStatus: projectData.nepaStatus || 'Not Started',
    ceqaStatus: projectData.ceqaStatus || 'Not Started',
    environmentalDocumentType: projectData.environmentalDocumentType || 'Not Required',
    environmentalClearanceDate: projectData.environmentalClearanceDate || '',
  });
  
  const [consultingAgency, setConsultingAgency] = useState('');
  
  useEffect(() => {
    // Save form data whenever it changes
    onSave(formData);
  }, [formData, onSave]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (environmentalDocumentation.X)
      const [parent, child] = name.split('.');
      if (parent === 'environmentalDocumentation') {
        setFormData(prev => ({
          ...prev,
          environmentalDocumentation: {
            ...prev.environmentalDocumentation,
            [child]: value,
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ 
        ...prev, 
        environmentalClearanceDate: date.toISOString().split('T')[0]
      }));
    }
  };
  
  const addConsultingAgency = () => {
    if (consultingAgency.trim() && !formData.environmentalDocumentation.consultingAgencies.includes(consultingAgency.trim())) {
      setFormData(prev => ({
        ...prev,
        environmentalDocumentation: {
          ...prev.environmentalDocumentation,
          consultingAgencies: [...prev.environmentalDocumentation.consultingAgencies, consultingAgency.trim()]
        }
      }));
      setConsultingAgency('');
    }
  };
  
  const removeConsultingAgency = (agency: string) => {
    setFormData(prev => ({
      ...prev,
      environmentalDocumentation: {
        ...prev.environmentalDocumentation,
        consultingAgencies: prev.environmentalDocumentation.consultingAgencies.filter(a => a !== agency)
      }
    }));
  };
  
  // Determine if NEPA is required
  const isNepaRequired = formData.nepaStatus !== 'Exempt' && formData.nepaStatus !== 'Not Required';
  
  // Determine if CEQA is required
  const isCeqaRequired = formData.ceqaStatus !== 'Exempt' && formData.ceqaStatus !== 'Not Required';
  
  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={['nepa', 'ceqa', 'document']} className="space-y-4">
        <AccordionItem value="nepa" className="border rounded-lg">
          <AccordionTrigger className="px-4">NEPA Documentation</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nepaStatus">NEPA Status</Label>
                <Select
                  value={formData.nepaStatus}
                  onValueChange={(value) => handleSelectChange('nepaStatus', value as EnvironmentalStatus)}
                >
                  <SelectTrigger id="nepaStatus">
                    <SelectValue placeholder="Select NEPA status" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.environmentalStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {isNepaRequired && (
                <div className="space-y-2">
                  <Label htmlFor="environmentalDocumentation.nepaDocumentNumber">NEPA Document Number</Label>
                  <Input
                    id="environmentalDocumentation.nepaDocumentNumber"
                    name="environmentalDocumentation.nepaDocumentNumber"
                    value={formData.environmentalDocumentation.nepaDocumentNumber}
                    onChange={handleChange}
                    placeholder="e.g., FHWA-CA-EIS-2023-01-D"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="ceqa" className="border rounded-lg">
          <AccordionTrigger className="px-4">CEQA Documentation</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ceqaStatus">CEQA Status</Label>
                <Select
                  value={formData.ceqaStatus}
                  onValueChange={(value) => handleSelectChange('ceqaStatus', value as EnvironmentalStatus)}
                >
                  <SelectTrigger id="ceqaStatus">
                    <SelectValue placeholder="Select CEQA status" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.environmentalStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {isCeqaRequired && (
                <div className="space-y-2">
                  <Label htmlFor="environmentalDocumentation.ceqaDocumentNumber">CEQA Document Number</Label>
                  <Input
                    id="environmentalDocumentation.ceqaDocumentNumber"
                    name="environmentalDocumentation.ceqaDocumentNumber"
                    value={formData.environmentalDocumentation.ceqaDocumentNumber}
                    onChange={handleChange}
                    placeholder="e.g., SCH# 2023010123"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="document" className="border rounded-lg">
          <AccordionTrigger className="px-4">Document Information</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="environmentalDocumentType">Document Type</Label>
                <Select
                  value={formData.environmentalDocumentType}
                  onValueChange={(value) => handleSelectChange('environmentalDocumentType', value as EnvironmentalDocumentType)}
                >
                  <SelectTrigger id="environmentalDocumentType">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.environmentalDocumentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="environmentalClearanceDate">Environmental Clearance Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.environmentalClearanceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.environmentalClearanceDate 
                        ? format(new Date(formData.environmentalClearanceDate), "PPP") 
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.environmentalClearanceDate ? new Date(formData.environmentalClearanceDate) : undefined}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="environmentalDocumentation.leadAgency">Lead Agency</Label>
                <Input
                  id="environmentalDocumentation.leadAgency"
                  name="environmentalDocumentation.leadAgency"
                  value={formData.environmentalDocumentation.leadAgency}
                  onChange={handleChange}
                  placeholder="Agency responsible for environmental documentation"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="consultingAgency">Consulting Agencies</Label>
                <div className="flex gap-2">
                  <Input
                    id="consultingAgency"
                    value={consultingAgency}
                    onChange={(e) => setConsultingAgency(e.target.value)}
                    placeholder="Add consulting agency"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addConsultingAgency();
                      }
                    }}
                  />
                  <Button type="button" onClick={addConsultingAgency} variant="secondary">
                    Add
                  </Button>
                </div>
                
                {formData.environmentalDocumentation.consultingAgencies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.environmentalDocumentation.consultingAgencies.map((agency, index) => (
                      <div key={index} className="bg-muted rounded-full px-3 py-1 text-sm flex items-center gap-1">
                        {agency}
                        <button
                          type="button"
                          onClick={() => removeConsultingAgency(agency)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="environmentalDocumentation.documentationComments">Comments</Label>
                <Textarea
                  id="environmentalDocumentation.documentationComments"
                  name="environmentalDocumentation.documentationComments"
                  value={formData.environmentalDocumentation.documentationComments}
                  onChange={handleChange}
                  placeholder="Additional information about environmental documentation"
                  rows={3}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Document Attachments</CardTitle>
          <CardDescription>
            Upload environmental clearance documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted border border-dashed border-muted-foreground/50 rounded-md p-8 text-center">
              <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm text-muted-foreground mb-3">
                Drag and drop or click to upload NEPA documents
              </div>
              <Button type="button" variant="secondary" size="sm">
                Select Files
              </Button>
            </div>
            
            <div className="bg-muted border border-dashed border-muted-foreground/50 rounded-md p-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm text-muted-foreground mb-3">
                Drag and drop or click to upload CEQA documents
              </div>
              <Button type="button" variant="secondary" size="sm">
                Select Files
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-4 text-center">
            Supported file types: PDF, DOC, DOCX, XLS, XLSX (max 10MB each)
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <ListTodo className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">Environmental Documentation Checklist</h4>
              <ul className="mt-2 text-sm space-y-1.5 text-amber-700 dark:text-amber-300/80">
                <li className="flex items-start">
                  <span className="rounded-full h-1.5 w-1.5 bg-amber-600 dark:bg-amber-400 mt-1.5 mr-2" />
                  <span>Ensure all required environmental documents are uploaded</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-1.5 w-1.5 bg-amber-600 dark:bg-amber-400 mt-1.5 mr-2" />
                  <span>Verify NEPA/CEQA document numbers are correctly formatted</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-1.5 w-1.5 bg-amber-600 dark:bg-amber-400 mt-1.5 mr-2" />
                  <span>Double-check that lead agency information is accurate</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentalStep; 