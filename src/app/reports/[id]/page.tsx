"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { getReportById, updateReportStatus, Report, deleteReport } from "@/lib/report-service";

// Icons
import { 
  ArrowLeftIcon, 
  DownloadIcon, 
  FileTextIcon, 
  PencilIcon, 
  Trash2Icon, 
  EyeIcon,
  ShareIcon,
  ArchiveIcon,
  ClockIcon,
  TagIcon,
  FileIcon
} from "lucide-react";

// Report preview component
export default function ReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
  // Fetch report data
  useEffect(() => {
    async function loadReport() {
      try {
        const reportData = await getReportById(params.id);
        setReport(reportData);
      } catch (error) {
        console.error("Error loading report:", error);
        toast({
          title: "Error loading report",
          description: "The requested report could not be found or loaded.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadReport();
  }, [params.id]);
  
  // Handle report status update
  const handleStatusUpdate = async (status: 'draft' | 'published' | 'archived') => {
    if (!report) return;
    
    try {
      await updateReportStatus(report.id, status);
      
      // Update local state
      setReport(prev => prev ? { ...prev, status } : null);
      
      toast({
        title: "Report status updated",
        description: `Report has been marked as ${status}.`,
      });
    } catch (error) {
      console.error("Error updating report status:", error);
      toast({
        title: "Error updating status",
        description: "There was a problem updating the report status.",
        variant: "destructive",
      });
    }
  };
  
  // Handle report deletion
  const handleDelete = async () => {
    if (!report) return;
    
    try {
      setDeleting(true);
      await deleteReport(report.id);
      
      toast({
        title: "Report deleted",
        description: "The report has been permanently deleted.",
      });
      
      router.push("/reports");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error deleting report",
        description: "There was a problem deleting the report.",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };
  
  // Get status badge classes
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-500";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-500";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-500";
      default:
        return "";
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  // Report not found
  if (!report) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push("/reports")}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Report Not Found</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <FileTextIcon className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Report Not Found</h2>
              <p className="text-muted-foreground">
                The requested report could not be found or has been deleted.
              </p>
              <Button onClick={() => router.push("/reports")}>
                Return to Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Get icon for report type
  const getReportTypeIcon = () => {
    switch (report.type) {
      case 'project-summary':
        return <FileTextIcon className="h-5 w-5" />;
      case 'financial-analysis':
        return <FileIcon className="h-5 w-5" />;
      case 'progress-report':
        return <ClockIcon className="h-5 w-5" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.push("/reports")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={report.fileUrl} download target="_blank" rel="noopener noreferrer">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
          
          {report.status === 'draft' && (
            <Button onClick={() => handleStatusUpdate('published')}>
              <EyeIcon className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          
          {report.status === 'published' && (
            <Button variant="outline" onClick={() => handleStatusUpdate('archived')}>
              <ArchiveIcon className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <Trash2Icon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                Preview of the generated report content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/11] overflow-hidden rounded-lg border bg-background">
                {report.thumbnail ? (
                  <img 
                    src={report.thumbnail}
                    alt="Report preview" 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <FileTextIcon className="h-16 w-16 mb-4" />
                    <p>Preview not available</p>
                  </div>
                )}
              </div>
              
              <Tabs defaultValue="projects" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="elements">Elements</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="projects" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Included Projects</h3>
                    <div className="grid gap-2">
                      {report.projectIds.map((projectId) => (
                        <div key={projectId} className="p-3 bg-muted rounded-md">
                          <div className="font-medium">Project {projectId}</div>
                          <div className="text-sm text-muted-foreground">
                            Project details would be displayed here
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="elements" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Report Elements</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {report.elements.map((element) => (
                        <div key={element} className="p-3 bg-muted rounded-md">
                          <div className="font-medium capitalize">{element}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="settings" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Report Settings</h3>
                    <div className="grid gap-2">
                      <div className="p-3 bg-muted rounded-md">
                        <div className="font-medium">Format</div>
                        <div className="text-sm text-muted-foreground uppercase">
                          {report.format}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge className={getStatusBadge(report.status)} variant="outline">
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-1 mr-4">
                  <TagIcon className="h-4 w-4" />
                  <span className="capitalize">{report.type.replace("-", " ")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileIcon className="h-4 w-4" />
                  <span className="uppercase">{report.format}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Created on:</span>{" "}
                {formatDate(report.createdAt)}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Last updated:</span>{" "}
                {formatDate(report.updatedAt)}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Created by:</span>{" "}
                {report.createdBy}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground">
                {report.description || "No description provided"}
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="w-full">
                  <ShareIcon className="mr-2 h-3.5 w-3.5" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <PencilIcon className="mr-2 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 