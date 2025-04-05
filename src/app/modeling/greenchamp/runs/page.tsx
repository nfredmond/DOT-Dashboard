"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  ArrowLeftIcon, 
  ArrowUpDownIcon, 
  BarChart3Icon, 
  ClockIcon, 
  FileIcon, 
  FilterIcon, 
  MoreHorizontalIcon, 
  PlusIcon, 
  SearchIcon, 
  Trash2Icon, 
  PlayIcon, 
  PauseIcon, 
  EyeIcon,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Mock data for model runs
const mockModelRuns = [
  {
    id: "model1",
    name: "Downtown Transportation Plan 2024",
    status: "completed",
    createdAt: "2024-03-15T10:30:00Z",
    createdBy: "John Smith",
    baseYear: 2023,
    region: "Metro County",
    lastRun: "2024-03-15T14:45:00Z",
    description: "Comprehensive model for downtown transportation planning"
  },
  {
    id: "model2",
    name: "North County Transit Study",
    status: "in_progress",
    createdAt: "2024-03-30T09:15:00Z",
    createdBy: "Emma Johnson",
    baseYear: 2023,
    region: "North County",
    lastRun: "2024-03-30T09:15:00Z",
    description: "Transit analysis for North County corridor improvements"
  },
  {
    id: "model3",
    name: "Regional Bike Network Analysis",
    status: "completed",
    createdAt: "2024-03-10T13:20:00Z",
    createdBy: "Sarah Williams",
    baseYear: 2023,
    region: "Metro County",
    lastRun: "2024-03-10T16:35:00Z",
    description: "Bicycle network planning for the regional transportation plan"
  },
  {
    id: "model4",
    name: "East-West Corridor Study",
    status: "error",
    createdAt: "2024-03-25T11:45:00Z",
    createdBy: "Michael Chen",
    baseYear: 2023,
    region: "Central City",
    lastRun: "2024-03-25T12:30:00Z",
    description: "Analysis of east-west travel patterns and congestion"
  },
  {
    id: "model5",
    name: "Airport Access Improvement",
    status: "draft",
    createdAt: "2024-04-01T14:20:00Z",
    createdBy: "John Smith",
    baseYear: 2023,
    region: "Metro County",
    lastRun: null,
    description: "Transportation access improvements to the regional airport"
  }
];

// Just before the GreenChampRunsPage function, add this interface for the model run type
interface ModelRun {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  createdBy: string;
  baseYear: number;
  region: string;
  lastRun: string | null;
  description: string;
}

export default function GreenChampRunsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedRun, setSelectedRun] = useState<ModelRun | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Filter and sort runs
  const filteredRuns = mockModelRuns
    .filter(run => {
      // Apply status filter
      if (statusFilter !== "all" && run.status !== statusFilter) {
        return false;
      }
      
      // Apply search filter
      const lowerQuery = searchQuery.toLowerCase();
      return run.name.toLowerCase().includes(lowerQuery) || 
             run.description.toLowerCase().includes(lowerQuery) ||
             run.createdBy.toLowerCase().includes(lowerQuery) ||
             run.region.toLowerCase().includes(lowerQuery);
    })
    .sort((a, b) => {
      // Apply sorting
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      
      if (fieldA === null && fieldB === null) return 0;
      if (fieldA === null) return 1;
      if (fieldB === null) return -1;
      
      const comparison = 
        typeof fieldA === 'string' 
          ? fieldA.localeCompare(fieldB) 
          : fieldA - fieldB;
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteRun = () => {
    if (selectedRun) {
      toast({
        title: "Model run deleted",
        description: `'${selectedRun.name}' has been deleted.`,
      });
      setDeleteDialogOpen(false);
    }
  };

  const handleRunModel = (modelId) => {
    toast({
      title: "Model running",
      description: "The model run has been started. You will be notified when it completes.",
    });
  };

  const handleStopModel = (modelId) => {
    toast({
      title: "Model stopped",
      description: "The model run has been stopped.",
      variant: "destructive",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="mr-2"
            onClick={() => router.push("/modeling")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">GreenChAMP Model Runs</h1>
            <p className="text-muted-foreground">
              Manage and view your travel demand model runs
            </p>
          </div>
          <Button onClick={() => router.push("/modeling/greenchamp/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Model
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle>Travel Demand Models</CardTitle>
                <CardDescription>
                  {filteredRuns.length} {filteredRuns.length === 1 ? 'model' : 'models'} found
                </CardDescription>
              </div>
              
              <div className="flex flex-col md:flex-row gap-2 md:w-auto w-full">
                <div className="relative w-full md:w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search models..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      {statusFilter === "all" ? "All Statuses" : 
                       statusFilter === "completed" ? "Completed" : 
                       statusFilter === "in_progress" ? "In Progress" : 
                       statusFilter === "error" ? "Error" : 
                       statusFilter === "draft" ? "Draft" : "Filter"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("in_progress")}>
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("error")}>
                      Error
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                      Draft
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 p-0 hover:bg-transparent"
                        onClick={() => handleSort("name")}
                      >
                        Name
                        <ArrowUpDownIcon className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 p-0 hover:bg-transparent"
                        onClick={() => handleSort("createdAt")}
                      >
                        Created
                        <ArrowUpDownIcon className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Base Year</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 p-0 hover:bg-transparent"
                        onClick={() => handleSort("lastRun")}
                      >
                        Last Run
                        <ArrowUpDownIcon className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No model runs found. Try adjusting your filters or create a new model.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{run.name}</span>
                            <span className="text-xs text-muted-foreground">{run.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(run.createdAt)}</span>
                            <span className="text-xs text-muted-foreground">by {run.createdBy}</span>
                          </div>
                        </TableCell>
                        <TableCell>{run.baseYear}</TableCell>
                        <TableCell>{run.region}</TableCell>
                        <TableCell>
                          {run.lastRun ? (
                            <div className="flex items-center">
                              <ClockIcon className="mr-1 h-3 w-3 text-muted-foreground" />
                              {formatDate(run.lastRun)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never run</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            {run.status === "in_progress" ? (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleStopModel(run.id)}
                                title="Stop Model Run"
                              >
                                <PauseIcon className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRunModel(run.id)}
                                title="Run Model"
                                disabled={run.status === "in_progress"}
                              >
                                <PlayIcon className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Results"
                              disabled={!["completed", "in_progress"].includes(run.status)}
                              onClick={() => router.push(`/modeling/greenchamp/runs/${run.id}`)}
                            >
                              <BarChart3Icon className="h-4 w-4" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => router.push(`/modeling/greenchamp/runs/${run.id}`)}
                                  disabled={!["completed", "in_progress"].includes(run.status)}
                                >
                                  <EyeIcon className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/modeling/greenchamp/runs/${run.id}/edit`)}>
                                  <FileIcon className="mr-2 h-4 w-4" />
                                  Edit Model
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRun(run);
                                  setDeleteDialogOpen(true);
                                }}>
                                  <Trash2Icon className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Model Run</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedRun?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteRun}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
} 