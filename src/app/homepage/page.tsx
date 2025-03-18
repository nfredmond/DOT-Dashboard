"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectCard } from "@/app/(components)/project-card";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MapPinIcon,
  ClockIcon,
  DollarSignIcon,
  AlertCircleIcon,
} from "lucide-react";

// Import individual chart components directly with named imports
const BarChartComponent = dynamic(() => import('@/components/DynamicCharts').then(mod => mod.BarChart), { 
  ssr: false,
  loading: () => <div style={{ width: '100%', height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading bar chart...</div>
});

const LineChartComponent = dynamic(() => import('@/components/DynamicCharts').then(mod => mod.LineChart), { 
  ssr: false,
  loading: () => <div style={{ width: '100%', height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading line chart...</div>
});

// Data that doesn't depend on client-side components
const projectStatusData = [
  { name: "Jan", active: 40, completed: 24 },
  { name: "Feb", active: 30, completed: 13 },
  { name: "Mar", active: 20, completed: 18 },
  { name: "Apr", active: 27, completed: 10 },
  { name: "May", active: 18, completed: 15 },
  { name: "Jun", active: 23, completed: 12 },
  { name: "Jul", active: 34, completed: 17 },
];

const fundingData = [
  { name: "Jan", amount: 1200000 },
  { name: "Feb", amount: 1800000 },
  { name: "Mar", amount: 1400000 },
  { name: "Apr", amount: 2200000 },
  { name: "May", amount: 1600000 },
  { name: "Jun", amount: 2400000 },
  { name: "Jul", amount: 2000000 },
];

export default function Homepage() {
  const router = useRouter();
  const [_isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const recentProjects = [
    {
      id: 1,
      title: "Highway 101 Expansion",
      description:
        "Widening of Highway 101 between Santa Barbara and Ventura to reduce congestion",
      status: "In Progress",
      score: 85,
      category: "Highway",
      budget: "$24.5M",
      location: "Santa Barbara County",
      lastUpdated: "2023-07-15",
    },
    {
      id: 2,
      title: "Downtown Transit Center",
      description:
        "Construction of a new transit hub in downtown Sacramento with improved accessibility",
      status: "Planning",
      score: 78,
      category: "Transit",
      budget: "$12.8M",
      location: "Sacramento",
      lastUpdated: "2023-07-10",
    },
    {
      id: 3,
      title: "Bike Lane Network Expansion",
      description:
        "Adding 15 miles of protected bike lanes throughout San Francisco",
      status: "Approved",
      score: 92,
      category: "Active Transportation",
      budget: "$5.3M",
      location: "San Francisco",
      lastUpdated: "2023-07-05",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Overview of your transportation projects and planning activities
            </p>
          </div>
          
          <button 
            onClick={() => router.push('/admin-panel')} 
            className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-md flex items-center border-l-4 border-amber-500 shadow-md transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Admin Panel</span>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500 mr-1">12%</span>
                from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500 mr-1">4%</span>
                from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$245.8M</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500 mr-1">18%</span>
                from last year
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
                <span className="text-red-500 mr-1">3</span>
                from last week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
              <CardDescription>Monthly active vs. completed projects</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartComponent data={projectStatusData} />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Funding Allocation</CardTitle>
              <CardDescription>Monthly funding trends in millions</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChartComponent data={fundingData} />
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold tracking-tight">Recent Projects</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
} 