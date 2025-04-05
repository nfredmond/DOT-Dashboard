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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  ArrowLeftIcon, 
  Battery, 
  Building, 
  Car, 
  Cpu, 
  Download, 
  Globe, 
  Info, 
  Laptop, 
  PlusIcon, 
  SearchIcon, 
  ShoppingBag, 
  Smartphone, 
  Train, 
  Truck, 
  Users, 
  Zap,
  BarChart3Icon
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Mock trends data
const mockTrends = [
  {
    id: "trend1",
    name: "Telecommuting",
    category: "work",
    description: "Increased remote work and telecommuting patterns",
    impacts: ["Travel demand", "Peak spreading", "Trip distribution"],
    defaultValue: 35,
    min: 10,
    max: 70,
    unit: "%",
    icon: <Laptop className="h-5 w-5" />,
    details: "Represents the percentage of office workers telecommuting at least 3 days per week. Higher telecommuting rates reduce commute trips, particularly during peak periods, but may increase non-work trips during the day."
  },
  {
    id: "trend2",
    name: "E-commerce",
    category: "shopping",
    description: "Growth in online shopping and home delivery",
    impacts: ["Shopping trips", "Freight delivery", "Commercial space"],
    defaultValue: 45,
    min: 25,
    max: 75,
    unit: "%",
    icon: <ShoppingBag className="h-5 w-5" />,
    details: "Represents the percentage of retail transactions occurring online. Higher e-commerce rates reduce shopping trips but increase delivery vehicle trips, particularly in residential areas."
  },
  {
    id: "trend3",
    name: "Autonomous Vehicles",
    category: "technology",
    description: "Adoption of autonomous vehicle technology",
    impacts: ["Travel cost", "Vehicle ownership", "Road capacity"],
    defaultValue: 25,
    min: 5,
    max: 85,
    unit: "%",
    icon: <Cpu className="h-5 w-5" />,
    details: "Represents the percentage of vehicle fleet that is autonomous (L4/L5). Higher AV adoption may increase roadway capacity and reduce overall fleet size if sharing is prevalent."
  },
  {
    id: "trend4",
    name: "Micromobility",
    category: "mobility",
    description: "Usage of scooters, e-bikes, and other small vehicles",
    impacts: ["First/last mile", "Transit access", "Short trips"],
    defaultValue: 15,
    min: 5,
    max: 35,
    unit: "%",
    icon: <Zap className="h-5 w-5" />,
    details: "Represents the percentage of short trips (under 3 miles) taken using micromobility options. Higher micromobility usage improves transit access and reduces short-distance car trips."
  },
  {
    id: "trend5",
    name: "Electrification",
    category: "technology",
    description: "Transition to electric vehicles for personal and commercial use",
    impacts: ["Emissions", "Energy consumption", "Vehicle range"],
    defaultValue: 30,
    min: 10,
    max: 90,
    unit: "%",
    icon: <Battery className="h-5 w-5" />,
    details: "Represents the percentage of the vehicle fleet that is electric. Higher electrification rates reduce emissions and alter refueling patterns, but don't significantly change travel demand."
  },
  {
    id: "trend6",
    name: "Urbanization",
    category: "demographics",
    description: "Population shift toward urban centers",
    impacts: ["Housing location", "Trip lengths", "Transit demand"],
    defaultValue: 55,
    min: 40,
    max: 75,
    unit: "%",
    icon: <Building className="h-5 w-5" />,
    details: "Represents the percentage of regional population living in urban areas. Higher urbanization rates increase density, reduce trip lengths, and improve transit viability."
  },
  {
    id: "trend7",
    name: "Mobility as a Service",
    category: "mobility",
    description: "Shift from vehicle ownership to subscription-based mobility services",
    impacts: ["Vehicle ownership", "Modal choice", "Travel cost"],
    defaultValue: 20,
    min: 5,
    max: 60,
    unit: "%",
    icon: <Smartphone className="h-5 w-5" />,
    details: "Represents the percentage of travelers primarily using MaaS instead of personal vehicles. Higher MaaS adoption reduces parking demand and may increase vehicle utilization rates."
  },
  {
    id: "trend8",
    name: "Aging Population",
    category: "demographics",
    description: "Increasing proportion of seniors in the population",
    impacts: ["Travel patterns", "Modal preferences", "Trip purposes"],
    defaultValue: 22,
    min: 15,
    max: 40,
    unit: "%",
    icon: <Users className="h-5 w-5" />,
    details: "Represents the percentage of population over 65 years old. An aging population changes travel patterns, with fewer work trips but more medical and leisure trips."
  },
  {
    id: "trend9",
    name: "Transit Investment",
    category: "policy",
    description: "Increased funding and expansion of public transit networks",
    impacts: ["Transit ridership", "Mode share", "Transit access"],
    defaultValue: 40,
    min: 20,
    max: 100,
    unit: "%",
    icon: <Train className="h-5 w-5" />,
    details: "Represents investment in transit compared to baseline funding. Higher investment improves service frequency, coverage, and quality, increasing transit mode share."
  },
  {
    id: "trend10",
    name: "Freight Demand",
    category: "logistics",
    description: "Changes in freight and goods movement patterns",
    impacts: ["Truck traffic", "Logistics centers", "Last-mile delivery"],
    defaultValue: 140,
    min: 80,
    max: 200,
    unit: "%",
    icon: <Truck className="h-5 w-5" />,
    details: "Represents freight demand as a percentage of base year. Increasing freight demand impacts roadway congestion, particularly in logistics corridors and urban delivery areas."
  }
];

// Categories for filtering
const trendCategories = [
  { id: "work", name: "Work & Employment", icon: <Laptop className="h-4 w-4" /> },
  { id: "shopping", name: "Retail & Shopping", icon: <ShoppingBag className="h-4 w-4" /> },
  { id: "technology", name: "Technology Adoption", icon: <Cpu className="h-4 w-4" /> },
  { id: "mobility", name: "Mobility Patterns", icon: <Car className="h-4 w-4" /> },
  { id: "demographics", name: "Demographics", icon: <Users className="h-4 w-4" /> },
  { id: "policy", name: "Policy Measures", icon: <Globe className="h-4 w-4" /> },
  { id: "logistics", name: "Freight & Logistics", icon: <Truck className="h-4 w-4" /> }
];

export default function TrendLibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [trendValues, setTrendValues] = useState({});

  // Initialize trend values with defaults
  useEffect(() => {
    const initialValues = {};
    mockTrends.forEach(trend => {
      initialValues[trend.id] = trend.defaultValue;
    });
    setTrendValues(initialValues);
  }, []);

  // Filter trends based on search and category
  const filteredTrends = mockTrends.filter(trend => {
    const matchesSearch = 
      searchQuery === "" || 
      trend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.impacts.some(impact => impact.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || trend.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleTrendValueChange = (trendId, value) => {
    setTrendValues(prev => ({
      ...prev,
      [trendId]: value[0]
    }));
  };

  const handleExportTrends = () => {
    toast({
      title: "Trends exported",
      description: "Trend parameters have been exported to CSV.",
    });
  };

  const handleImportTrends = () => {
    toast({
      title: "Import trends",
      description: "Please select a CSV file to import trend parameters.",
    });
  };

  // Add benefit-cost integration function:
  // Integrate with Benefit-Cost Analysis
  const handleExportToBenefitCost = (trendId) => {
    // Find the trend to export
    const trend = mockTrends.find(t => t.id === trendId);
    if (!trend) return;
    
    // Build trend impact data to send to benefit-cost
    const trendValue = trendValues[trendId] || trend.defaultValue;
    const trendImpact = {
      trendId: trend.id,
      trendName: trend.name,
      trendCategory: trend.category,
      value: trendValue,
      unit: trend.unit,
      impacts: trend.impacts,
      details: trend.details
    };
    
    // In a real implementation, this would call an API to integrate with benefit-cost
    toast({
      title: "Benefit-Cost Integration",
      description: `Trend "${trend.name}" exported to Benefit-Cost Analysis. You can now incorporate this trend in your project evaluations.`,
    });
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
            <h1 className="text-3xl font-bold tracking-tight">Trend Library</h1>
            <p className="text-muted-foreground">
              Explore and configure future trends for scenario planning
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImportTrends}>
              <Download className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExportTrends}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setActiveTab("create")}>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Trend
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Trends</TabsTrigger>
            <TabsTrigger value="create">Create New Trend</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle>Future Trends Library</CardTitle>
                    <CardDescription>
                      {filteredTrends.length} trends available for scenario planning
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-2 md:w-auto w-full">
                    <div className="relative w-full md:w-64">
                      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search trends..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={categoryFilter === "all" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCategoryFilter("all")}
                  >
                    All Categories
                  </Button>
                  
                  {trendCategories.map(category => (
                    <Button 
                      key={category.id}
                      variant={categoryFilter === category.id ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setCategoryFilter(category.id)}
                      className="flex items-center gap-1"
                    >
                      {category.icon}
                      {category.name}
                    </Button>
                  ))}
                </div>
                
                <div className="border rounded-md">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredTrends.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        No trends match your search criteria. Try adjusting your filters.
                      </div>
                    ) : (
                      filteredTrends.map((trend) => (
                        <AccordionItem value={trend.id} key={trend.id}>
                          <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/40">
                            <div className="flex items-center gap-3 w-full">
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                {trend.icon}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium">{trend.name}</div>
                                <div className="text-xs text-muted-foreground">{trend.description}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{trend.unit}</Badge>
                                <Badge>{trendValues[trend.id] || trend.defaultValue}</Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="px-4 pb-4 pt-0 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="col-span-2">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-sm font-medium">
                                        {trend.name} ({trend.unit})
                                      </label>
                                      <span className="text-sm">
                                        {trendValues[trend.id] || trend.defaultValue}
                                      </span>
                                    </div>
                                    <Slider 
                                      defaultValue={[trend.defaultValue]} 
                                      value={[trendValues[trend.id] || trend.defaultValue]}
                                      min={trend.min} 
                                      max={trend.max} 
                                      step={1}
                                      onValueChange={(value) => handleTrendValueChange(trend.id, value)}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>Min: {trend.min}{trend.unit}</span>
                                      <span>Default: {trend.defaultValue}{trend.unit}</span>
                                      <span>Max: {trend.max}{trend.unit}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-sm font-medium mb-1">Impacts</div>
                                  <div className="flex flex-wrap gap-1">
                                    {trend.impacts.map((impact, idx) => (
                                      <Badge variant="secondary" key={idx}>{impact}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="rounded-md bg-muted p-3 flex items-start gap-2">
                                <Info className="h-4 w-4 text-primary mt-0.5" />
                                <p className="text-sm">{trend.details}</p>
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleExportToBenefitCost(trend.id)}
                                >
                                  <BarChart3Icon className="mr-2 h-4 w-4" />
                                  Export to Benefit-Cost
                                </Button>
                                <Button size="sm">
                                  Add to Scenario
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    )}
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Trend</CardTitle>
                <CardDescription>
                  Define a new trend for scenario planning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Trend Name</label>
                      <Input placeholder="e.g., Shared Autonomous Vehicles" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {trendCategories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input placeholder="Brief description of the trend" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Detailed Information</label>
                      <textarea 
                        className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Provide detailed information about what this trend represents and how it impacts transportation"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Value Range</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Minimum</label>
                          <Input type="number" placeholder="0" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Default</label>
                          <Input type="number" placeholder="50" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Maximum</label>
                          <Input type="number" placeholder="100" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unit</label>
                      <Input placeholder="e.g., %, years, miles" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Impact Areas</label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="travel-demand" className="rounded" />
                          <label htmlFor="travel-demand" className="text-sm">Travel Demand</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="mode-choice" className="rounded" />
                          <label htmlFor="mode-choice" className="text-sm">Mode Choice</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="trip-distribution" className="rounded" />
                          <label htmlFor="trip-distribution" className="text-sm">Trip Distribution</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="vehicle-occupancy" className="rounded" />
                          <label htmlFor="vehicle-occupancy" className="text-sm">Vehicle Occupancy</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="emissions" className="rounded" />
                          <label htmlFor="emissions" className="text-sm">Emissions</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="custom-impact" className="rounded" />
                          <label htmlFor="custom-impact" className="text-sm">
                            <Input placeholder="Custom impact..." className="h-7 py-1" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab("browse")}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Trend created",
                    description: "Your new trend has been added to the library.",
                  });
                  setActiveTab("browse");
                }}>
                  Create Trend
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
} 