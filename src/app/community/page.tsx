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
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
  const [activeTab, setActiveTab] = useState("community-map");

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
              <TabsTrigger value="community-map">Map View</TabsTrigger>
              <TabsTrigger value="community-list">List View</TabsTrigger>
              <TabsTrigger value="community-form">Submit Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="community-map" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Community Input Map</CardTitle>
                  <CardDescription>
                    View community feedback on the map. Click on the map to add your own feedback.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full h-[700px] rounded-md overflow-hidden">
                    <MapboxCommunityInputMap />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="community-list" className="space-y-4">
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

            <TabsContent value="community-form" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Feedback</CardTitle>
                  <CardDescription>
                    Share your ideas and concerns about transportation in your community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    We recommend using the map view to submit location-based feedback.
                    For general feedback, a form will be available here soon.
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