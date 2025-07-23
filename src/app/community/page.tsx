"use client"

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectsProvider } from "@/contexts/ProjectsContext";
import dynamic from "next/dynamic";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Dynamically import the Mapbox community input map
const MapboxCommunityInputMap = dynamic(
  () => import('@/app/components/MapboxCommunityInputMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded-md">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <div className="mt-2 text-sm text-gray-600">Loading map...</div>
        </div>
      </div>
    )
  }
);

export default function Community() {
  const [activeTab, setActiveTab] = useState("mapping");

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  return (
    <ProtectedRoute>
      <ProjectsProvider>
        <div className="container max-w-screen-2xl mx-auto p-4 space-y-4">
          <h1 className="text-3xl font-bold">Community Feedback</h1>
          <p className="text-muted-foreground pb-4">
            Share your ideas and concerns about transportation projects in your community
          </p>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="mapping">Mapping</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="mapping" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Community Input Map</CardTitle>
                  <CardDescription>
                    Click on the map to add feedback with points, lines, or polygons. You can upload photos and categorize your input.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full h-[700px] rounded-md overflow-hidden">
                    <MapboxCommunityInputMap />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Community Feedback List</CardTitle>
                  <CardDescription>
                    View and filter community feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Community feedback list view is coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Statistics</CardTitle>
                  <CardDescription>
                    View analytics and trends from community input
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Statistics and analytics dashboard coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Submit General Feedback</CardTitle>
                  <CardDescription>
                    For location-specific feedback, please use the Mapping tab
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    We recommend using the mapping tab to submit location-based feedback.
                    For general feedback without a specific location, a form will be available here soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ProjectsProvider>
    </ProtectedRoute>
  );
}