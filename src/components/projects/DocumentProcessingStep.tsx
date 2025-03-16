import React, { useState, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { 
  AlertCircle,
  Check,
  Clock,
  FileText,
  Loader2,
  Upload,
  UploadCloud,
  X,
  FileSearch,
  RefreshCcw,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DocumentProcessingStepProps {
  projectData: any;
  onSave: (data: any) => void;
  errors?: Record<string, string>;
}

interface FileWithPreview extends File {
  preview?: string;
  processing?: boolean;
  processed?: boolean;
  documentType?: string;
  status?: 'pending' | 'processing' | 'success' | 'error';
  extractedData?: Record<string, any>;
  error?: string;
}

const DocumentProcessingStep: React.FC<DocumentProcessingStepProps> = ({ 
  projectData, 
  onSave, 
  errors 
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFilesToProcess, setTotalFilesToProcess] = useState(0);
  const [processingType, setProcessingType] = useState<string>('automatic');
  const [processingPrompt, setProcessingPrompt] = useState<string>('');
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const documentTypes = [
    { value: 'invoice', label: 'Invoice' },
    { value: 'contract', label: 'Contract Document' },
    { value: 'change_order', label: 'Change Order' },
    { value: 'progress_report', label: 'Progress Report' },
    { value: 'permit', label: 'Permit' },
    { value: 'environmental', label: 'Environmental Document' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'caltrans', label: 'Caltrans Form' },
    { value: 'funding', label: 'Funding Document' },
    { value: 'specification', label: 'Specification' },
    { value: 'other', label: 'Other' }
  ];
  
  // Handle file drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  // Handle file selection via input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  // Process the selected files
  const handleFiles = (files: FileList) => {
    const newFiles: FileWithPreview[] = Array.from(files).map(file => ({
      ...file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      documentType: 'unknown'
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };
  
  // Trigger file input click
  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Remove a file from the list
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(files => {
      const newFiles = [...files];
      
      // Release the object URL to avoid memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  // Update a file's document type
  const handleUpdateDocumentType = (index: number, type: string) => {
    setUploadedFiles(files => {
      const newFiles = [...files];
      newFiles[index] = { ...newFiles[index], documentType: type };
      return newFiles;
    });
  };
  
  // Start processing the uploaded files
  const handleProcessFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to process",
        description: "Please upload at least one file before processing.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessingFiles(true);
    setProcessedCount(0);
    setTotalFilesToProcess(uploadedFiles.length);
    
    // Mark all files as processing
    setUploadedFiles(files => 
      files.map(file => ({ ...file, status: 'processing' }))
    );
    
    // In a real implementation, we would send these files to an API endpoint
    // that would process them with an LLM. For this demo, we'll simulate the processing.
    
    const processedData: Record<string, any> = {};
    
    // Process each file with simulated delay
    for (let i = 0; i < uploadedFiles.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
      
      // Update the file status
      setUploadedFiles(files => {
        const newFiles = [...files];
        
        // Simulate extraction based on document type
        let extractedData: Record<string, any> = {};
        
        switch (newFiles[i].documentType || 'unknown') {
          case 'invoice':
            extractedData = {
              invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
              vendor: 'ABC Construction Co.',
              amount: Math.floor(1000 + Math.random() * 50000),
              date: new Date().toISOString().split('T')[0],
              category: 'construction'
            };
            break;
          case 'contract':
            extractedData = {
              contractNumber: `CT-${Math.floor(10000 + Math.random() * 90000)}`,
              contractor: 'XYZ Builders Inc.',
              amount: Math.floor(50000 + Math.random() * 500000),
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };
            break;
          case 'progress_report':
            extractedData = {
              reportDate: new Date().toISOString().split('T')[0],
              completionPercentage: Math.floor(Math.random() * 100),
              currentPhase: 'Construction',
              contractor: 'XYZ Builders Inc.',
              issues: []
            };
            break;
          case 'funding':
            extractedData = {
              grantNumber: `GRT-${Math.floor(10000 + Math.random() * 90000)}`,
              agency: 'Department of Transportation',
              amount: Math.floor(100000 + Math.random() * 1000000),
              program: 'Highway Improvement Program'
            };
            break;
          default:
            extractedData = {
              type: newFiles[i].documentType || 'unknown',
              date: new Date().toISOString().split('T')[0],
              relevantText: 'Simulated extracted content...'
            };
        }
        
        // Randomly determine success or error
        const isSuccess = Math.random() > 0.2; // 80% success rate
        
        newFiles[i] = { 
          ...newFiles[i], 
          status: isSuccess ? 'success' : 'error',
          processed: true,
          extractedData: isSuccess ? extractedData : undefined,
          error: isSuccess ? undefined : 'Failed to extract data from document'
        };
        
        if (isSuccess) {
          processedData[newFiles[i].name] = extractedData;
        }
        
        return newFiles;
      });
      
      setProcessedCount(prev => prev + 1);
    }
    
    setExtractedData(processedData);
    setProcessingFiles(false);
    
    toast({
      title: "Processing complete",
      description: `Processed ${uploadedFiles.length} files with ${Object.keys(processedData).length} successful extractions.`,
      variant: "default"
    });
    
    // Save the extracted data
    onSave({ 
      processedDocuments: {
        extractedData: processedData,
        processedAt: new Date().toISOString()
      }
    });
  };
  
  const showDataPreviewDialog = (data: Record<string, any>) => {
    setPreviewData(data);
    setShowDataPreview(true);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Document Processing</CardTitle>
          <CardDescription>
            Upload and process project documents with AI for automatic data extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upload">Upload Documents</TabsTrigger>
              <TabsTrigger value="review">Review & Process</TabsTrigger>
              <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div 
                className={`border-2 ${dragActive ? 'border-primary' : 'border-dashed'} rounded-lg p-6 transition-all`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">Drag and drop your files here</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supported file types: PDF, Word, Excel, Images
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileInputChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <Button type="button" onClick={onButtonClick}>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Files
                    </Button>
                  </div>
                </div>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between border rounded-md p-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="review" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Review Documents</h3>
                  <div className="flex space-x-2">
                    <Select
                      value={processingType}
                      onValueChange={setProcessingType}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Processing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="guided">Guided (with prompt)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleProcessFiles} 
                      disabled={processingFiles || uploadedFiles.length === 0}
                    >
                      {processingFiles ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing {processedCount}/{totalFilesToProcess}
                        </>
                      ) : (
                        <>
                          <FileSearch className="h-4 w-4 mr-2" />
                          Process Documents
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {processingType === 'guided' && (
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Custom Processing Instructions</Label>
                    <Textarea
                      id="prompt"
                      value={processingPrompt}
                      onChange={(e) => setProcessingPrompt(e.target.value)}
                      placeholder="Provide specific instructions for the AI to extract particular information from the documents..."
                      rows={3}
                    />
                  </div>
                )}
                
                {uploadedFiles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadedFiles.map((file, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="truncate max-w-[200px]">{file.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={file.documentType || 'unknown'}
                              onValueChange={(value) => handleUpdateDocumentType(index, value)}
                              disabled={file.status === 'processing'}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unknown">Unknown</SelectItem>
                                {documentTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(file.status || 'pending')}
                              <span className="capitalize">
                                {file.status === 'processing' ? 'Processing...' : file.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {file.status === 'success' && file.extractedData && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => showDataPreviewDialog(file.extractedData!)}
                              >
                                View Data
                              </Button>
                            )}
                            {file.status === 'error' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Mark for reprocessing
                                  setUploadedFiles(files => {
                                    const newFiles = [...files];
                                    newFiles[index] = { ...newFiles[index], status: 'pending' };
                                    return newFiles;
                                  });
                                }}
                              >
                                <RefreshCcw className="h-4 w-4 mr-1" />
                                Retry
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No files have been uploaded yet.
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="extracted" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Extracted Data</h3>
                
                {Object.keys(extractedData).length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(extractedData).map(([fileName, data], index) => {
                        // Determine card icon based on data content
                        let icon = <FileText className="h-5 w-5 text-blue-500" />;
                        let title = 'Document';
                        
                        if ('invoiceNumber' in data) {
                          icon = <DollarSign className="h-5 w-5 text-green-500" />;
                          title = 'Invoice';
                        } else if ('contractNumber' in data) {
                          icon = <FileText className="h-5 w-5 text-orange-500" />;
                          title = 'Contract';
                        } else if ('completionPercentage' in data) {
                          icon = <RefreshCcw className="h-5 w-5 text-purple-500" />;
                          title = 'Progress Report';
                        } else if ('grantNumber' in data) {
                          icon = <DollarSign className="h-5 w-5 text-emerald-500" />;
                          title = 'Grant';
                        }
                        
                        return (
                          <Card key={index} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2">
                                  {icon}
                                  <CardTitle className="text-base">{title}</CardTitle>
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {fileName}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="text-sm space-y-1">
                                {Object.entries(data).slice(0, 3).map(([key, value], i) => (
                                  <div key={i} className="flex justify-between">
                                    <span className="text-muted-foreground capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>
                                    <span className="font-medium truncate max-w-[150px]">
                                      {typeof value === 'string' || typeof value === 'number' 
                                        ? String(value) 
                                        : JSON.stringify(value)}
                                    </span>
                                  </div>
                                ))}
                                {Object.keys(data).length > 3 && (
                                  <div className="text-xs text-muted-foreground text-center mt-2">
                                    ...and {Object.keys(data).length - 3} more fields
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => showDataPreviewDialog(data)}
                              >
                                View Details
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // In a real application, this would create corresponding 
                          // entities (invoices, contracts, etc.) from the extracted data
                          toast({
                            title: "Data Saved",
                            description: "Extracted data has been applied to the project.",
                            variant: "default"
                          });
                        }}
                      >
                        Apply All Extracted Data
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No data has been extracted yet. Process some documents to see extracted information here.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Data Preview Dialog */}
      <Dialog 
        open={showDataPreview} 
        onOpenChange={setShowDataPreview}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Extracted Data</DialogTitle>
            <DialogDescription>
              Data extracted from the document by AI processing
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Table>
              <TableBody>
                {Object.entries(previewData).map(([key, value], index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </TableCell>
                    <TableCell>
                      {typeof value === 'string' || typeof value === 'number' 
                        ? String(value) 
                        : JSON.stringify(value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDataPreview(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                // In a real app, we would create the entity (invoice, contract, etc.)
                toast({
                  title: "Data Applied",
                  description: "Extracted data has been applied to the project.",
                  variant: "default"
                });
                setShowDataPreview(false);
              }}
            >
              Apply Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentProcessingStep; 