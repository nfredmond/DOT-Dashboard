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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ReportType, ReportElement, ReportFormat, generateReport } from "@/lib/report-service";

// Icons
import { 
  ArrowLeftIcon, 
  FileTextIcon, 
  LineChartIcon, 
  ClipboardCheckIcon, 
  CalculatorIcon,
  LeafIcon,
  UsersIcon,
  Loader2Icon,
  FileIcon
} from "lucide-react";

// Project selection mock data
interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

// Mock projects - in a real app, fetch from API
const mockProjects: Project[] = [
  { id: "project-1", name: "Highway 101 Expansion", description: "Expansion of Highway 101 corridor", status: "In Progress" },
  { id: "project-2", name: "Downtown Transit Hub", description: "Central transit hub renovation", status: "Planning" },
  { id: "project-3", name: "Bike Lane Network", description: "City-wide bike lane expansion", status: "In Progress" },
  { id: "project-4", name: "Bridge Retrofit", description: "Seismic retrofit of Main St bridge", status: "Completed" },
  { id: "project-5", name: "Smart Traffic Signals", description: "AI-powered traffic signal optimization", status: "Planning" },
  { id: "project-6", name: "Pedestrian Safety Improvements", description: "Crosswalk and sidewalk enhancements", status: "In Progress" },
];

// Report types with icons and descriptions
const reportTypes = [
  { 
    id: 'project-summary' as ReportType,
    name: 'Project Summary', 
    icon: <FileTextIcon className="h-5 w-5" />,
    description: 'Overview of project details, status, and key metrics'
  },
  { 
    id: 'financial-analysis' as ReportType,
    name: 'Financial Analysis', 
    icon: <LineChartIcon className="h-5 w-5" />,
    description: 'Detailed financial breakdown including budget, expenditures, and funding'
  },
  { 
    id: 'progress-report' as ReportType,
    name: 'Progress Report', 
    icon: <ClipboardCheckIcon className="h-5 w-5" />,
    description: 'Status updates, milestones achieved, and timeline tracking'
  },
  { 
    id: 'benefit-cost-analysis' as ReportType,
    name: 'Benefit-Cost Analysis', 
    icon: <CalculatorIcon className="h-5 w-5" />,
    description: 'Comprehensive analysis of project benefits relative to costs'
  },
  { 
    id: 'environmental-impact' as ReportType,
    name: 'Environmental Impact', 
    icon: <LeafIcon className="h-5 w-5" />,
    description: 'Assessment of environmental effects and mitigation measures'
  },
  { 
    id: 'community-feedback' as ReportType,
    name: 'Community Feedback', 
    icon: <UsersIcon className="h-5 w-5" />,
    description: 'Summary of public input, concerns, and engagement activities'
  },
  { 
    id: 'custom' as ReportType,
    name: 'Custom Report', 
    icon: <FileIcon className="h-5 w-5" />,
    description: 'Build a custom report with selected elements and data'
  },
];

// Report elements with labels
const reportElements = [
  { id: 'summary' as ReportElement, label: 'Executive Summary' },
  { id: 'details' as ReportElement, label: 'Project Details' },
  { id: 'budget' as ReportElement, label: 'Budget & Financials' },
  { id: 'timeline' as ReportElement, label: 'Timeline & Schedule' },
  { id: 'maps' as ReportElement, label: 'Maps & Spatial Data' },
  { id: 'charts' as ReportElement, label: 'Charts & Visualizations' },
  { id: 'contacts' as ReportElement, label: 'Contacts & Stakeholders' },
  { id: 'recommendations' as ReportElement, label: 'Recommendations' },
  { id: 'risks' as ReportElement, label: 'Risks & Mitigations' },
];

// Form schema
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().optional(),
  type: z.enum([
    'project-summary', 
    'financial-analysis', 
    'progress-report', 
    'benefit-cost-analysis', 
    'environmental-impact',
    'community-feedback',
    'custom'
  ] as const),
  projectIds: z.array(z.string()).min(1, {
    message: "Select at least one project.",
  }),
  elements: z.array(z.string()).min(1, {
    message: "Select at least one report element.",
  }),
  includeExecutiveSummary: z.boolean().default(true),
  includeDataVisualization: z.boolean().default(true),
  includeAIInsights: z.boolean().default(false),
  format: z.enum(['pdf', 'excel', 'csv', 'json'] as const),
});

export default function GenerateReport() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Setup form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "project-summary",
      projectIds: [],
      elements: ["summary", "details"],
      includeExecutiveSummary: true,
      includeDataVisualization: true,
      includeAIInsights: false,
      format: "pdf",
    },
  });
  
  // Watch for changes in the report type
  const reportType = form.watch("type");
  
  // Update elements based on report type
  useEffect(() => {
    if (reportType === 'financial-analysis') {
      form.setValue('elements', ['summary', 'budget', 'charts']);
    } else if (reportType === 'progress-report') {
      form.setValue('elements', ['summary', 'timeline', 'details']);
    } else if (reportType === 'benefit-cost-analysis') {
      form.setValue('elements', ['summary', 'details', 'charts', 'recommendations']);
    } else if (reportType === 'environmental-impact') {
      form.setValue('elements', ['summary', 'details', 'maps', 'recommendations']);
    } else if (reportType === 'community-feedback') {
      form.setValue('elements', ['summary', 'charts', 'recommendations']);
    }
  }, [reportType, form]);
  
  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsGenerating(true);
      
      // Type assertion for proper typing
      const _report = await generateReport({
        ...values,
        elements: values.elements as ReportElement[],
        format: values.format as ReportFormat,
        createdBy: "current-user-id", // In real app, get from auth context
      });
      
      // Show success message
      toast({
        title: "Report generated successfully",
        description: "Your report is now available in the reports library.",
      });
      
      // Redirect to reports page
      router.push("/reports");
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error generating report",
        description: "There was a problem generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }
  
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
          <h1 className="text-3xl font-bold tracking-tight">Generate Report</h1>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>
                Define the basic information for your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter report title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a brief description of this report" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Report Type</CardTitle>
              <CardDescription>
                Select the type of report you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reportTypes.map((type) => (
                        <div 
                          key={type.id}
                          className={`border rounded-lg p-4 cursor-pointer flex flex-col gap-2 ${
                            field.value === type.id 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => field.onChange(type.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${
                              field.value === type.id 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            }`}>
                              {type.icon}
                            </div>
                            <div className="font-medium">{type.name}</div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {type.description}
                          </p>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Select Projects</CardTitle>
              <CardDescription>
                Choose the projects to include in this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="projectIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-2">
                      {mockProjects.map((project) => (
                        <div 
                          key={project.id}
                          className="flex items-start space-x-2 border rounded-md p-3"
                        >
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={field.value.includes(project.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, project.id])
                                : field.onChange(
                                    field.value.filter((value) => value !== project.id)
                                  );
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`project-${project.id}`}
                              className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {project.name}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {project.description} • {project.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Report Contents</CardTitle>
              <CardDescription>
                Select which elements to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="elements"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {reportElements.map((element) => (
                        <div key={element.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`element-${element.id}`}
                            checked={field.value.includes(element.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, element.id])
                                : field.onChange(
                                    field.value.filter((value) => value !== element.id)
                                  );
                            }}
                          />
                          <label
                            htmlFor={`element-${element.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {element.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Additional Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="includeExecutiveSummary"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium">
                          Include Executive Summary
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeDataVisualization"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium">
                          Include Data Visualizations
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeAIInsights"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium">
                          Add AI-Generated Insights
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Export Format</CardTitle>
              <CardDescription>
                Choose the file format for your report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="csv">CSV (Comma-Separated Values)</SelectItem>
                        <SelectItem value="json">JSON (for API/system use)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => router.push("/reports")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
} 