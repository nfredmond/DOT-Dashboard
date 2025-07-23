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
import { Label } from "@/components/ui/label";
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
import { Slider } from "@/components/ui/slider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  ArrowLeftIcon, 
  Download, 
  PlusIcon, 
  SearchIcon, 
  MoreHorizontalIcon,
  EditIcon,
  Trash2Icon,
  TrendingUp,
  Users
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { TrendNavigatorEngine, TrendDefinition } from "@/lib/trend-navigator/engine";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SaveIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const engine = new TrendNavigatorEngine();

// Updated Trend Categories to align with TrendLab+ insights
const trendCategories = [
  { id: "economic", name: "Economic Consequences" },
  { id: "gov_biz_response", name: "Government and Business Response" },
  { id: "traveler_behavior", name: "Traveler and Consumer Behavior" },
  { id: "tech_advancements", name: "Technological Advancements" },
  { id: "other", name: "Other Factors" },
];

// Define available icons (example)
const availableIcons = [
  { id: "TrendingUp", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "Users", icon: <Users className="h-4 w-4" /> },
  { id: "Car", name: "Car / Vehicle" },
  { id: "Laptop", name: "Laptop / Work" },
  { id: "Briefcase", name: "Briefcase / Business" },
  { id: "ShoppingCart", name: "Shopping Cart / Retail" },
  { id: "Cpu", name: "CPU / Technology" },
  { id: "Train", name: "Train / Transit" },
  { id: "Bike", name: "Bike / Active Transport" },
  { id: "DollarSign", name: "Dollar Sign / Economy" },
  { id: "Home", name: "Home / Housing" },
  { id: "Cloud", name: "Cloud / Emissions" },
  { id: "ClipboardList", name: "Clipboard / Policy" },
  { id: "Truck", name: "Truck / Freight" },
  // Add more as needed
];

export default function TrendLibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [trendValues, setTrendValues] = useState<Record<string, number>>({});
  
  const [trendDefinitions, setTrendDefinitions] = useState<TrendDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingTrend, setIsSubmittingTrend] = useState(false);
  const [editingTrend, setEditingTrend] = useState<TrendDefinition | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<TrendDefinition | null>(null);

  // State for the "Create New Trend" form
  const [newTrendName, setNewTrendName] = useState("");
  const [newTrendCategory, setNewTrendCategory] = useState(trendCategories[0]?.id || "");
  const [newTrendDescription, setNewTrendDescription] = useState("");
  const [newTrendImpacts, setNewTrendImpacts] = useState(""); // Comma-separated string
  const [newTrendDefaultValue, setNewTrendDefaultValue] = useState<number | string>(0);
  const [newTrendMinValue, setNewTrendMinValue] = useState<number | string>(0);
  const [newTrendMaxValue, setNewTrendMaxValue] = useState<number | string>(100);
  const [newTrendUnit, setNewTrendUnit] = useState("%");
  const [newTrendIconName, setNewTrendIconName] = useState(availableIcons[0]?.id || "");
  const [newTrendDetailsText, setNewTrendDetailsText] = useState("");
  const [newTrendIsPublic, setNewTrendIsPublic] = useState(true);
  // const [newTrendOrganizationId, setNewTrendOrganizationId] = useState(""); // If using org-specific trends

  // New state for multi-year and input types
  const [newTrendPredictionYears, setNewTrendPredictionYears] = useState("2025, 2030, 2035, 2040"); // Comma-separated string for input
  const [newTrendInputType, setNewTrendInputType] = useState<'slider' | 'select'>('slider');
  const [newTrendOptions, setNewTrendOptions] = useState<{ label: string; values: Record<number, number>; description?: string }[]>([]);

  const resetCreateTrendForm = () => {
    setNewTrendName("");
    setNewTrendCategory(trendCategories[0]?.id || "");
    setNewTrendDescription("");
    setNewTrendImpacts("");
    setNewTrendDefaultValue(0);
    setNewTrendMinValue(0);
    setNewTrendMaxValue(100);
    setNewTrendUnit("%");
    setNewTrendIconName(availableIcons[0]?.id || "");
    setNewTrendDetailsText("");
    setNewTrendIsPublic(true);

    // Reset new fields
    setNewTrendPredictionYears("2025, 2030, 2035, 2040");
    setNewTrendInputType('slider');
    setNewTrendOptions([]);
  };

  useEffect(() => {
    async function fetchDefinitions() {
      setIsLoading(true);
      try {
        const fetchedDefinitions = await engine.getTrendDefinitions();
        setTrendDefinitions(fetchedDefinitions);
        
        const initialValues: Record<string, number> = {};
        fetchedDefinitions.forEach(trend => {
          initialValues[trend.id] = trend.defaultValue;
        });
        setTrendValues(initialValues);

      } catch (error) {
        console.error("Error fetching trend definitions:", error);
        toast({
          title: "Error loading trends",
          description: "Could not load trend definitions. Please try again.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
    fetchDefinitions();
  }, []);

  // Filter trends based on search and category
  const filteredTrends = trendDefinitions.filter(trend => {
    const matchesSearch = 
      searchQuery === "" || 
      trend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.impacts.some(impact => impact.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || trend.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleTrendValueChange = (trendId: string, value: number[]) => {
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
  const _handleExportToBenefitCost = (trendId) => {
    // Find the trend to export
    const trend = trendDefinitions.find(t => t.id === trendId);
    if (!trend) return;
    
    const _exportData = {
      trendName: trend.name,
      currentValue: trendValues[trend.id] || trend.defaultValue,
      unit: trend.unit,
      description: trend.description,
      details: trend.detailsText,
      impacts: trend.impacts,
      category: trend.category
    };
    
    // In a real implementation, this would call an API to integrate with benefit-cost
    toast({
      title: "Benefit-Cost Integration",
      description: `Trend "${trend.name}" exported to Benefit-Cost Analysis. You can now incorporate this trend in your project evaluations.`,
    });
  };

  const handleSaveTrendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTrend(true);

    const definitionData = {
      name: newTrendName,
      category: newTrendCategory,
      description: newTrendDescription,
      impacts: newTrendImpacts.split(',').map(s => s.trim()).filter(s => s.length > 0),
      defaultValue: Number(newTrendDefaultValue),
      minValue: Number(newTrendMinValue),
      maxValue: Number(newTrendMaxValue),
      unit: newTrendUnit,
      iconName: newTrendIconName,
      detailsText: newTrendDetailsText,
      isPublic: newTrendIsPublic,
      predictionYears: newTrendPredictionYears.split(',').map(s => parseInt(s.trim(), 10)).filter(y => !isNaN(y)),
      inputType: newTrendInputType,
      options: newTrendInputType === 'select' ? newTrendOptions : undefined,
    } as Omit<TrendDefinition, 'id' | 'createdAt' | 'updatedAt'>;
    // The type assertion helps if isPublic was handled conditionally before,
    // now it's directly part of the object being built for save/update.

    try {
      if (editingTrend) {
        // Update existing trend
        const updatedDefinition = await engine.updateTrendDefinition(editingTrend.id, definitionData);
        setTrendDefinitions(prev => prev.map(t => t.id === editingTrend.id ? updatedDefinition : t));
        toast({
          title: "Trend Definition Updated",
          description: `"${updatedDefinition.name}" has been updated.`,
        });
        setEditingTrend(null); // Clear editing state
      } else {
        // Create new trend
        const savedDefinition = await engine.saveTrendDefinition(definitionData);
        setTrendDefinitions(prev => [...prev, savedDefinition]);
        toast({
          title: "Trend Definition Created",
          description: `"${savedDefinition.name}" has been added to the library.`,
        });
      }
      resetCreateTrendForm();
      setActiveTab("browse");
    } catch (error) {
      console.error("Error saving trend definition:", error);
      toast({
        title: editingTrend ? "Error Updating Trend" : "Error Creating Trend",
        description: (error as Error).message || "Could not save the trend definition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTrend(false);
    }
  };

  const handleEditTrend = (trend: TrendDefinition) => {
    setEditingTrend(trend);
    setNewTrendName(trend.name);
    setNewTrendCategory(trend.category);
    setNewTrendDescription(trend.description || "");
    setNewTrendImpacts(trend.impacts.join(", "));
    setNewTrendDefaultValue(trend.defaultValue);
    setNewTrendMinValue(trend.minValue);
    setNewTrendMaxValue(trend.maxValue);
    setNewTrendUnit(trend.unit);
    setNewTrendIconName(trend.iconName || availableIcons[0]?.id || "");
    setNewTrendDetailsText(trend.detailsText || "");
    setNewTrendIsPublic(trend.isPublic !== undefined ? trend.isPublic : true);
    // Populate other fields if they exist (e.g., organizationId)
    
    // Populate new fields
    setNewTrendPredictionYears(trend.predictionYears?.join(", ") || "2025, 2030, 2035, 2040");
    setNewTrendInputType(trend.inputType || 'slider');
    setNewTrendOptions(trend.options || []);

    setActiveTab("create"); // Switch to the form tab
  };

  const handleDeleteTrend = async () => {
    if (!showDeleteConfirm) return;
    const trendToDelete = showDeleteConfirm;
    setShowDeleteConfirm(null); // Close dialog immediately

    try {
      await engine.deleteTrendDefinition(trendToDelete.id);
      setTrendDefinitions(prev => prev.filter(t => t.id !== trendToDelete.id));
      toast({
        title: "Trend Definition Deleted",
        description: `"${trendToDelete.name}" has been removed from the library.`,
      });
    } catch (error) {
      console.error("Error deleting trend definition:", error);
      toast({
        title: "Error Deleting Trend",
        description: (error as Error).message || "Could not delete the trend definition. Please try again.",
        variant: "destructive",
      });
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
        
        <Tabs value={activeTab} onValueChange={(tab) => { 
          setActiveTab(tab);
          if (tab === "browse") setEditingTrend(null); // Clear editing state if switching back to browse
         }} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Trends</TabsTrigger>
            <TabsTrigger value="create">{editingTrend ? "Edit Trend" : "Create New Trend"}</TabsTrigger>
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
                      {category.name}
                    </Button>
                  ))}
                </div>
                
                <div className="border rounded-md">
                  <Accordion type="single" collapsible className="w-full">
                    {isLoading ? (
                      <div className="p-6 text-center text-muted-foreground">
                        Loading trend library...
                      </div>
                    ) : filteredTrends.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        No trends match your search criteria. Try adjusting your filters.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                        {filteredTrends.map((trend) => (
                          <Card key={trend.id} className="flex flex-col">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="flex items-center text-lg">
                                    {/* Optional: Icon can go here trend.iconName */}
                                    {trend.name}
                                  </CardTitle>
                                  <Badge variant="outline" className="w-fit text-xs">{trendCategories.find(tc=>tc.id === trend.category)?.name || trend.category}</Badge>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontalIcon className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditTrend(trend)}>
                                      <EditIcon className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowDeleteConfirm(trend)} className="text-red-600">
                                      <Trash2Icon className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <p className="text-sm text-muted-foreground mb-3">
                                {trend.description}
                              </p>
                              <Accordion type="single" collapsible className="w-full text-sm">
                                <AccordionItem value="details">
                                  <AccordionTrigger className="text-xs py-2">View Details & Assumptions</AccordionTrigger>
                                  <AccordionContent className="pt-2 text-xs">
                                    {trend.detailsText}
                                    <p className="mt-2"><strong>Impacts:</strong> {trend.impacts.join(", ")}</p>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </CardContent>
                            <CardFooter className="flex-col items-start pt-4 border-t">
                              <div className="w-full flex items-center justify-between mb-2">
                                <Label htmlFor={`slider-${trend.id}`} className="text-sm">
                                  Set Value ({trend.unit})
                                </Label>
                                <span className="text-sm font-semibold">
                                  {trendValues[trend.id] !== undefined ? trendValues[trend.id] : trend.defaultValue}{trend.unit}
                                </span>
                              </div>
                              <Slider
                                id={`slider-${trend.id}`}
                                min={trend.minValue}
                                max={trend.maxValue}
                                step={1}
                                value={[trendValues[trend.id] !== undefined ? trendValues[trend.id] : trend.defaultValue]}
                                onValueChange={(value) => handleTrendValueChange(trend.id, value)}
                                className="w-full"
                              />
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{editingTrend ? "Edit Trend Definition" : "Create New Trend Definition"}</CardTitle>
                <CardDescription>
                  {editingTrend ? "Modify the details of this existing trend." : "Define a new trend that can be used in scenario planning."}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveTrendSubmit}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newTrendName">Trend Name</Label>
                      <Input id="newTrendName" placeholder="e.g., Urban Delivery Drone Adoption" required value={newTrendName} onChange={(e) => setNewTrendName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTrendCategory">Category</Label>
                      <Select value={newTrendCategory} onValueChange={setNewTrendCategory} required>
                        <SelectTrigger id="newTrendCategory"><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {trendCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newTrendDescription">Short Description</Label>
                    <Textarea id="newTrendDescription" placeholder="Briefly describe the trend and its main effect." value={newTrendDescription} onChange={(e) => setNewTrendDescription(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newTrendMinValue">Min Value</Label>
                      <Input id="newTrendMinValue" type="number" placeholder="e.g., 0" required value={newTrendMinValue} onChange={(e) => setNewTrendMinValue(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTrendDefaultValue">Default Value</Label>
                      <Input id="newTrendDefaultValue" type="number" placeholder="e.g., 10" required value={newTrendDefaultValue} onChange={(e) => setNewTrendDefaultValue(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTrendMaxValue">Max Value</Label>
                      <Input id="newTrendMaxValue" type="number" placeholder="e.g., 100" required value={newTrendMaxValue} onChange={(e) => setNewTrendMaxValue(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="newTrendUnit">Unit</Label>
                        <Input id="newTrendUnit" placeholder="e.g., %, vehicles, trips/day" required value={newTrendUnit} onChange={(e) => setNewTrendUnit(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="newTrendIconName">Icon</Label>
                        <Select value={newTrendIconName} onValueChange={setNewTrendIconName}>
                            <SelectTrigger id="newTrendIconName"><SelectValue placeholder="Select an icon" /></SelectTrigger>
                            <SelectContent>
                            {availableIcons.map(icon => (
                                <SelectItem key={icon.id} value={icon.id}>{icon.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                     </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newTrendImpacts">Potential Impacts (comma-separated)</Label>
                    <Input id="newTrendImpacts" placeholder="e.g., VMT Reduction, Mode Shift, Roadway Capacity" value={newTrendImpacts} onChange={(e) => setNewTrendImpacts(e.target.value)} />
                    <p className="text-xs text-muted-foreground">List key areas or metrics this trend is expected to influence.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newTrendDetailsText">Detailed Explanation / Assumptions</Label>
                    <Textarea id="newTrendDetailsText" placeholder="Provide more context, data sources, or assumptions behind this trend." rows={4} value={newTrendDetailsText} onChange={(e) => setNewTrendDetailsText(e.target.value)} />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="newTrendIsPublic" checked={newTrendIsPublic} onCheckedChange={setNewTrendIsPublic} />
                    <Label htmlFor="newTrendIsPublic">Make this trend definition publicly available?</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newTrendPredictionYears">Prediction Years (comma-separated)</Label>
                      <Input id="newTrendPredictionYears" placeholder="e.g., 2025, 2030, 2035" value={newTrendPredictionYears} onChange={(e) => setNewTrendPredictionYears(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTrendInputType">Input Type</Label>
                      <Select value={newTrendInputType} onValueChange={(value: 'slider' | 'select') => setNewTrendInputType(value)} required>
                        <SelectTrigger id="newTrendInputType"><SelectValue placeholder="Select input type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slider">Slider (Numeric Range)</SelectItem>
                          <SelectItem value="select">Selectable Options</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Conditional section for inputType 'select' options - Placeholder for now */}
                  {newTrendInputType === 'select' && (
                    <div className="p-4 border rounded-md bg-slate-50 space-y-4">
                      <h4 className="text-md font-semibold mb-2">Configure Selectable Options</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Define the choices users can select for this trend. Each option will have specific values for the prediction years (e.g., {newTrendPredictionYears || "2025, 2030"}).
                      </p>

                      {newTrendOptions.map((option, optionIndex) => (
                        <div key={optionIndex} className="p-3 border rounded bg-white space-y-3">
                          <div className="flex justify-between items-center">
                            <Label htmlFor={`optionLabel-${optionIndex}`} className="text-sm font-medium">Option {optionIndex + 1}</Label>
                            <Button variant="ghost" size="sm" onClick={() => {
                              const updatedOptions = [...newTrendOptions];
                              updatedOptions.splice(optionIndex, 1);
                              setNewTrendOptions(updatedOptions);
                            }}>
                              <Trash2Icon className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`optionLabel-${optionIndex}`}>Option Label</Label>
                            <Input 
                              id={`optionLabel-${optionIndex}`} 
                              placeholder="e.g., High Growth Scenario" 
                              value={option.label}
                              onChange={(e) => {
                                const updatedOptions = [...newTrendOptions];
                                updatedOptions[optionIndex].label = e.target.value;
                                setNewTrendOptions(updatedOptions);
                              }}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`optionDescription-${optionIndex}`}>Option Description (Optional)</Label>
                            <Textarea 
                              id={`optionDescription-${optionIndex}`} 
                              placeholder="Describe this specific scenario option"
                              value={option.description || ''}
                              onChange={(e) => {
                                const updatedOptions = [...newTrendOptions];
                                updatedOptions[optionIndex].description = e.target.value;
                                setNewTrendOptions(updatedOptions);
                              }}
                              rows={2}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm">Values for Prediction Years:</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(newTrendPredictionYears.split(',').map(s => parseInt(s.trim(), 10)).filter(y => !isNaN(y))).map(year => (
                                <div key={year} className="space-y-1">
                                  <Label htmlFor={`optionValue-${optionIndex}-${year}`} className="text-xs">{year}</Label>
                                  <Input 
                                    id={`optionValue-${optionIndex}-${year}`} 
                                    type="number" 
                                    placeholder={`Value for ${year}`}
                                    value={option.values[year] !== undefined ? option.values[year] : ''}
                                    onChange={(e) => {
                                      const updatedOptions = [...newTrendOptions];
                                      updatedOptions[optionIndex].values[year] = parseFloat(e.target.value);
                                      setNewTrendOptions(updatedOptions);
                                    }}
                                    required
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const currentYears = newTrendPredictionYears.split(',').map(s => parseInt(s.trim(), 10)).filter(y => !isNaN(y));
                          const defaultValuesForYears: Record<number, number> = {};
                          currentYears.forEach(year => defaultValuesForYears[year] = 0); // Default new option values to 0

                          setNewTrendOptions([...newTrendOptions, { label: "", values: defaultValuesForYears, description: ""}]);
                        }}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" /> Add New Option
                      </Button>
                    </div>
                  )}

                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => { setActiveTab("browse"); setEditingTrend(null); resetCreateTrendForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingTrend}>
                    {isSubmittingTrend ? (
                        <><span className="mr-2 animate-spin">⟳</span>Saving...</>
                    ) : (
                        <><SaveIcon className="mr-2 h-4 w-4" />{editingTrend ? "Update Trend" : "Create Trend Definition"}</>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the trend definition "{showDeleteConfirm?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTrend} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </ProtectedRoute>
  );
} 