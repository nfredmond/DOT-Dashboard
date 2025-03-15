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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  ChevronDown,
  CircleOff,
  Download,
  Filter,
  Layers,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react"

// Define Project type
interface ProjectType {
  id: number;
  title: string;
  description: string;
  status: string;
  progress: number;
  category: string;
  location: string;
  coordinates: [number, number];
  type: string;
  budget: string;
  manager: string;
  startDate: string;
  endDate: string;
}

export default function GISMappingInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  
  const projects: ProjectType[] = [
    {
      id: 1,
      title: "Downtown Transit Corridor Expansion",
      description: "Expanding bus lanes and adding dedicated bike paths along Main Street corridor",
      status: "In Progress",
      progress: 65,
      category: "Transit",
      location: "Central District",
      coordinates: [37.7749, -122.4194],
      type: "line",
      budget: "$1.25M",
      manager: "Sarah Johnson",
      startDate: "Mar 2023",
      endDate: "Oct 2024"
    },
    {
      id: 2,
      title: "Highway 101 Safety Improvements",
      description: "Adding safety barriers and improved signage along Highway 101",
      status: "Planning",
      progress: 25,
      category: "Highway",
      location: "North County",
      coordinates: [37.7833, -122.4167],
      type: "line",
      budget: "$3.5M",
      manager: "Michael Chen",
      startDate: "Jan 2024",
      endDate: "Dec 2025"
    },
    {
      id: 3,
      title: "Westside Pedestrian Bridge",
      description: "Construction of pedestrian bridge connecting West Park to downtown area",
      status: "Approved",
      progress: 10,
      category: "Pedestrian",
      location: "West District",
      coordinates: [37.7694, -122.4862],
      type: "point",
      budget: "$950K",
      manager: "Jessica Martinez",
      startDate: "Apr 2024",
      endDate: "Mar 2025"
    },
    {
      id: 4,
      title: "Rural Transit Connection Program",
      description: "Expanding transit services to underserved rural communities",
      status: "In Progress",
      progress: 45,
      category: "Transit",
      location: "Eastern Region",
      coordinates: [37.8044, -122.2712],
      type: "polygon",
      budget: "$750K",
      manager: "David Wilson",
      startDate: "Nov 2022",
      endDate: "Nov 2023"
    },
  ]
  
  const mapLayers = [
    { id: "base", name: "Base Map", active: true, type: "base" },
    { id: "transit", name: "Transit Routes", active: true, type: "overlay" },
    { id: "bike", name: "Bike Lanes", active: true, type: "overlay" },
    { id: "traffic", name: "Traffic Data", active: false, type: "overlay" },
    { id: "demographics", name: "Demographics", active: false, type: "overlay" },
    { id: "zoning", name: "Zoning", active: false, type: "overlay" }
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
  
  const typeIcons = {
    "point": <MapPin className="h-4 w-4" />,
    "line": <div className="w-4 h-0.5 bg-current"></div>,
    "polygon": <div className="w-3 h-3 border-2 border-current"></div>
  }

  return (
    <div className="flex h-[700px] w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} h-full flex flex-col border-r transition-all duration-300 overflow-hidden`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Projects</h2>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." className="pl-8" />
          </div>
        </div>
        
        <Tabs defaultValue="all" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
          <div className="px-4 pt-2">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="transit">Transit</TabsTrigger>
              <TabsTrigger value="highway">Highway</TabsTrigger>
              <TabsTrigger value="pedestrian">Pedestrian</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="all" className="m-0 space-y-2">
              {projects.map(project => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer hover:bg-accent transition-colors ${selectedProject?.id === project.id ? 'border-primary' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColors[project.status]}>
                            {project.status}
                          </Badge>
                          <Badge variant="outline" className={categoryColors[project.category]}>
                            {project.category}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-1">{project.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{project.location}</p>
                      </div>
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
                        {typeIcons[project.type]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="transit" className="m-0 space-y-2">
              {projects.filter(p => p.category === "Transit").map(project => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer hover:bg-accent transition-colors ${selectedProject?.id === project.id ? 'border-primary' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColors[project.status]}>
                            {project.status}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-1">{project.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{project.location}</p>
                      </div>
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
                        {typeIcons[project.type]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="highway" className="m-0 space-y-2">
              {projects.filter(p => p.category === "Highway").map(project => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer hover:bg-accent transition-colors ${selectedProject?.id === project.id ? 'border-primary' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColors[project.status]}>
                            {project.status}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-1">{project.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{project.location}</p>
                      </div>
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
                        {typeIcons[project.type]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="pedestrian" className="m-0 space-y-2">
              {projects.filter(p => p.category === "Pedestrian").map(project => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer hover:bg-accent transition-colors ${selectedProject?.id === project.id ? 'border-primary' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColors[project.status]}>
                            {project.status}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-1">{project.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{project.location}</p>
                      </div>
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
                        {typeIcons[project.type]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </div>
          
          <div className="p-4 border-t">
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add New Project
            </Button>
          </div>
        </Tabs>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 relative">
        {/* Map Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          {!sidebarOpen && (
            <Button variant="outline" size="icon" className="bg-background" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center bg-background border rounded-md">
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Layers className="h-4 w-4 mr-2" />
                  Layers
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {mapLayers.map(layer => (
                  <DropdownMenuItem key={layer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`layer-${layer.id}`} defaultChecked={layer.active} />
                      <label htmlFor={`layer-${layer.id}`} className="text-sm cursor-pointer">
                        {layer.name}
                      </label>
                    </div>
                    {layer.type === "overlay" && (
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Settings className="h-3 w-3" />
                      </Button>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Button variant="outline" size="icon" className="bg-background">
            <Download className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Map Placeholder */}
        <div className="h-full w-full bg-[#E8ECEF] dark:bg-[#1A1A1A] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Map would render here with Leaflet.js or MapLibre GL</p>
            <p className="text-sm">Displaying {projects.length} transportation projects</p>
          </div>
        </div>
        
        {/* Project Detail Panel */}
        {selectedProject && (
          <div className="absolute top-4 right-4 bottom-4 w-80 bg-background border rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Project Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedProject.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={statusColors[selectedProject.status]}>
                      {selectedProject.status}
                    </Badge>
                    <Badge variant="outline" className={categoryColors[selectedProject.category]}>
                      {selectedProject.category}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{selectedProject.location}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">{selectedProject.budget}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Timeline:</span>
                    <span className="font-medium">{selectedProject.startDate} - {selectedProject.endDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Manager:</span>
                    <span className="font-medium">{selectedProject.manager}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-medium">{selectedProject.coordinates.join(', ')}</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{selectedProject.progress}%</span>
                  </div>
                  <Progress value={selectedProject.progress} className="h-2" />
                </div>
                
                <Card className="bg-muted/50">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm">Project Area</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="h-32 bg-[#E8ECEF] dark:bg-[#1A1A1A] rounded flex items-center justify-center">
                      <div className="text-xs text-muted-foreground">
                        Project area map preview
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="p-4 border-t flex items-center justify-between">
              <Button variant="outline" size="sm">
                <CircleOff className="h-4 w-4 mr-2" />
                Hide on Map
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit Project</DropdownMenuItem>
                  <DropdownMenuItem>View Timeline</DropdownMenuItem>
                  <DropdownMenuItem>Export Details</DropdownMenuItem>
                  <DropdownMenuItem>Generate Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        
        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-background border rounded-md p-3 shadow-sm">
          <h4 className="text-xs font-medium mb-2">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
              <span className="text-xs">Transit Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-sky-500"></div>
              <span className="text-xs">Highway Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs">Pedestrian Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500"></div>
              <span className="text-xs">Bicycle Projects</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}