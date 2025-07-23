"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Clock, Target, MapPin, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";

interface AnalyticsData {
  communityInputs: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    byCategory: { name: string; count: number; color: string }[];
    timeline: { date: string; count: number }[];
    heatmap: { lat: number; lng: number; intensity: number }[];
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    byStatus: { status: string; count: number }[];
    funding: { allocated: number; spent: number; remaining: number };
    timeline: { month: string; created: number; completed: number }[];
  };
  performance: {
    avgApprovalTime: number;
    userEngagement: number;
    projectCompletionRate: number;
    communityParticipation: number;
    trends: { metric: string; current: number; previous: number; change: number }[];
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const supabase = createClient();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch community inputs data
      const { data: inputs } = await supabase
        .from('community_inputs')
        .select('*, category:community_input_categories(*)')
        .gte('created_at', dateRange?.from?.toISOString() || subDays(new Date(), 30).toISOString())
        .lte('created_at', dateRange?.to?.toISOString() || new Date().toISOString());
      
      // Fetch projects data
      const { data: projects } = await supabase
        .from('projects')
        .select('*');
      
      // Process the data
      const processedData = processAnalyticsData(inputs || [], projects || []);
      setAnalytics(processedData);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, supabase]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  
  const processAnalyticsData = (inputs: any[], projects: any[]): AnalyticsData => {
    // Process community inputs
    const inputsByStatus = inputs.reduce((acc, input) => {
      acc[input.status] = (acc[input.status] || 0) + 1;
      return acc;
    }, {});
    
    const inputsByCategory = inputs.reduce((acc, input) => {
      const category = input.category?.name || 'Uncategorized';
      const existing = acc.find((c: any) => c.name === category);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ 
          name: category, 
          count: 1, 
          color: input.category?.color || '#gray' 
        });
      }
      return acc;
    }, []);
    
    // Create timeline data
    const timeline = generateTimeline(inputs, 'created_at');
    
    // Process projects
    const projectsByStatus = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});
    
    const totalFunding = projects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);
    const spentFunding = projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    
    return {
      communityInputs: {
        total: inputs.length,
        approved: inputsByStatus.approved || 0,
        pending: inputsByStatus.pending || 0,
        rejected: inputsByStatus.rejected || 0,
        byCategory: inputsByCategory,
        timeline,
        heatmap: generateHeatmapData(inputs)
      },
      projects: {
        total: projects.length,
        active: projectsByStatus.active || 0,
        completed: projectsByStatus.completed || 0,
        byStatus: Object.entries(projectsByStatus).map(([status, count]) => ({
          status,
          count: count as number
        })),
        funding: {
          allocated: totalFunding,
          spent: spentFunding,
          remaining: totalFunding - spentFunding
        },
        timeline: generateProjectTimeline(projects)
      },
      performance: {
        avgApprovalTime: calculateAvgApprovalTime(inputs),
        userEngagement: calculateEngagement(inputs),
        projectCompletionRate: (projectsByStatus.completed || 0) / projects.length * 100,
        communityParticipation: inputs.length / 30, // Per day average
        trends: calculateTrends(inputs, projects)
      }
    };
  };
  
  const generateTimeline = (data: any[], dateField: string) => {
    const grouped = data.reduce((acc, item) => {
      const date = format(new Date(item[dateField]), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count: count as number
    })).sort((a, b) => a.date.localeCompare(b.date));
  };
  
  const generateProjectTimeline = (projects: any[]) => {
    // Mock implementation - would need actual timeline data
    return [
      { month: 'Jan', created: 5, completed: 3 },
      { month: 'Feb', created: 8, completed: 5 },
      { month: 'Mar', created: 12, completed: 7 },
      { month: 'Apr', created: 10, completed: 9 },
    ];
  };
  
  const generateHeatmapData = (inputs: any[]) => {
    // Mock heatmap data - would use actual geometry data
    return inputs.slice(0, 20).map((input, i) => ({
      lat: 34.0522 + (Math.random() - 0.5) * 0.1,
      lng: -118.2437 + (Math.random() - 0.5) * 0.1,
      intensity: Math.random()
    }));
  };
  
  const calculateAvgApprovalTime = (inputs: any[]) => {
    const approved = inputs.filter(i => i.status === 'approved' && i.moderated_at);
    if (approved.length === 0) return 0;
    
    const totalTime = approved.reduce((sum, input) => {
      const created = new Date(input.created_at).getTime();
      const moderated = new Date(input.moderated_at).getTime();
      return sum + (moderated - created);
    }, 0);
    
    return totalTime / approved.length / (1000 * 60 * 60); // Hours
  };
  
  const calculateEngagement = (inputs: any[]) => {
    const uniqueUsers = new Set(inputs.map(i => i.user_id)).size;
    return (uniqueUsers / inputs.length) * 100;
  };
  
  const calculateTrends = (inputs: any[], projects: any[]) => {
    // Mock trend data - would calculate actual trends
    return [
      { metric: 'Community Inputs', current: inputs.length, previous: inputs.length * 0.8, change: 25 },
      { metric: 'Active Projects', current: projects.filter(p => p.status === 'active').length, previous: 12, change: -8 },
      { metric: 'User Engagement', current: 78, previous: 65, change: 20 },
      { metric: 'Completion Rate', current: 85, previous: 82, change: 3.6 }
    ];
  };
  
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  if (!analytics) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-6">
          <p>No analytics data available</p>
        </div>
      </ProtectedRoute>
    );
  }
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your transportation planning activities
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Button onClick={loadAnalytics}>Refresh</Button>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inputs</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.communityInputs.total}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.communityInputs.pending} pending approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.projects.active}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.projects.total} total projects
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funding Allocated</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(analytics.projects.funding.allocated / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                ${(analytics.projects.funding.spent / 1000000).toFixed(1)}M spent
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.performance.projectCompletionRate.toFixed(1)}%
              </div>
              <Progress value={analytics.performance.projectCompletionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="community">Community Feedback</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Analysis</CardTitle>
                  <CardDescription>Key metrics performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.performance.trends.map((trend, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{trend.metric}</p>
                          <p className="text-sm text-muted-foreground">
                            Current: {trend.current} | Previous: {trend.previous}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {trend.change > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={trend.change > 0 ? 'text-green-500' : 'text-red-500'}>
                            {Math.abs(trend.change).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Input Categories Distribution</CardTitle>
                  <CardDescription>Community feedback by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.communityInputs.byCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.communityInputs.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="community" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Community Input Timeline</CardTitle>
                  <CardDescription>Daily submissions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.communityInputs.timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Approval Status</CardTitle>
                  <CardDescription>Current status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Approved</span>
                        <span>{analytics.communityInputs.approved}</span>
                      </div>
                      <Progress 
                        value={(analytics.communityInputs.approved / analytics.communityInputs.total) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Pending</span>
                        <span>{analytics.communityInputs.pending}</span>
                      </div>
                      <Progress 
                        value={(analytics.communityInputs.pending / analytics.communityInputs.total) * 100} 
                        className="h-2 [&>div]:bg-yellow-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Rejected</span>
                        <span>{analytics.communityInputs.rejected}</span>
                      </div>
                      <Progress 
                        value={(analytics.communityInputs.rejected / analytics.communityInputs.total) * 100} 
                        className="h-2 [&>div]:bg-red-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Average approval time: {analytics.performance.avgApprovalTime.toFixed(1)} hours
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>Created vs Completed projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.projects.timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="created" fill="#8884d8" />
                      <Bar dataKey="completed" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Funding Analysis</CardTitle>
                  <CardDescription>Budget allocation and utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Total Allocated</span>
                        <span className="text-lg font-bold">
                          ${(analytics.projects.funding.allocated / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Spent</span>
                        <span>${(analytics.projects.funding.spent / 1000000).toFixed(2)}M</span>
                      </div>
                      <Progress 
                        value={(analytics.projects.funding.spent / analytics.projects.funding.allocated) * 100} 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Remaining</span>
                        <span>${(analytics.projects.funding.remaining / 1000000).toFixed(2)}M</span>
                      </div>
                      <Progress 
                        value={(analytics.projects.funding.remaining / analytics.projects.funding.allocated) * 100} 
                        className="[&>div]:bg-green-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">User Engagement</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics.performance.userEngagement.toFixed(1)}%
                    </div>
                    <Progress value={analytics.performance.userEngagement} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Daily Participation</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics.performance.communityParticipation.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">inputs per day</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Project Success</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics.performance.projectCompletionRate.toFixed(1)}%
                    </div>
                    <Progress value={analytics.performance.projectCompletionRate} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Response Time</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics.performance.avgApprovalTime.toFixed(1)}h
                    </div>
                    <p className="text-xs text-muted-foreground">average approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
} 