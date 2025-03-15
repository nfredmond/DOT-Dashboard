"use client"

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  LayersIcon,
  ZoomInIcon,
  ZoomOutIcon,
  HomeIcon,
  PlusIcon,
  MapPinIcon,
  SendIcon,
  ImageIcon,
  FileIcon,
  CheckIcon,
  AlertCircleIcon,
  InfoIcon,
  XIcon,
} from "lucide-react";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export function CommunityMapping() {
  const [mapType, setMapType] = useState("standard");
  const [feedbackType, setFeedbackType] = useState("issue");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [attachments, setAttachments] = useState<Array<{name: string, size: string, type: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock projects for the map
  const projects = [
    {
      id: 1,
      name: "Highway 101 Expansion",
      lat: 34.42083,
      lng: -119.698189,
      type: "highway",
      feedbackCount: 24,
    },
    {
      id: 2,
      name: "Downtown Transit Center",
      lat: 38.581572,
      lng: -121.4944,
      type: "transit",
      feedbackCount: 42,
    },
    {
      id: 3,
      name: "Bike Lane Network",
      lat: 37.774929,
      lng: -122.419418,
      type: "active",
      feedbackCount: 68,
    },
    {
      id: 4,
      name: "Bridge Retrofit Project",
      lat: 37.82604,
      lng: -122.4225,
      type: "bridge",
      feedbackCount: 15,
    },
    {
      id: 5,
      name: "Light Rail Extension",
      lat: 37.33606,
      lng: -121.89053,
      type: "transit",
      feedbackCount: 37,
    },
  ];

  // Mock community feedback points
  const communityFeedback = [
    {
      id: 1,
      lat: 34.42583,
      lng: -119.708189,
      type: "issue",
      title: "Traffic congestion concern",
      description: "Heavy traffic during rush hours",
      author: "John Smith",
      date: "2023-07-15",
    },
    {
      id: 2,
      lat: 38.585572,
      lng: -121.4844,
      type: "suggestion",
      title: "Add bike parking",
      description: "Need secure bike parking near the transit center",
      author: "Emily Johnson",
      date: "2023-07-20",
    },
    {
      id: 3,
      lat: 37.778929,
      lng: -122.423418,
      type: "support",
      title: "Great bike lane design",
      description: "The protected bike lanes make cycling much safer",
      author: "Michael Chen",
      date: "2023-07-18",
    },
  ];

  const handleAddFeedback = () => {
    setShowFeedbackForm(true);
    // In a real app, this would activate a map click handler to select a location
    setSelectedLocation({
      lat: 37.7749,
      lng: -122.4194,
      address: "San Francisco, CA",
    });
  };

  const handleCancelFeedback = () => {
    setShowFeedbackForm(false);
    setSelectedLocation(null);
    setAttachments([]);
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowFeedbackForm(false);
      setShowSuccessMessage(true);
      setSelectedLocation(null);
      setAttachments([]);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments = Array.from(e.target.files).map((file: File) => ({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB",
        type: file.type,
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case "issue":
        return "bg-red-500";
      case "suggestion":
        return "bg-blue-500";
      case "support":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getProjectTypeColor = (type) => {
    switch (type) {
      case "highway":
        return "bg-orange-500";
      case "transit":
        return "bg-indigo-500";
      case "active":
        return "bg-green-500";
      case "bridge":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card
        className="lg:col-span-3 h-[calc(100vh-240px)] min-h-[500px] relative"
      >
        <CardHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Community Feedback Map
            </CardTitle>
            <div className="flex space-x-2">
              <Select
                defaultValue="all"
                onValueChange={(value) => console.log(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter feedback" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Feedback
                  </SelectItem>
                  <SelectItem value="issue">
                    Issues
                  </SelectItem>
                  <SelectItem value="suggestion">
                    Suggestions
                  </SelectItem>
                  <SelectItem value="support">
                    Support
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="default"
                onClick={handleAddFeedback}
                disabled={showFeedbackForm}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Feedback
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 relative h-full">
          {/* Map placeholder - in a real app, this would be a Leaflet map */}
          <div
            className="w-full h-full bg-gray-200 dark:bg-gray-700 relative"
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <p
                className="text-gray-500 dark:text-gray-400 text-lg"
              >
                Interactive map would be rendered here using Leaflet.js
              </p>

              {/* Sample project markers */}
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    top: `${30 + Math.random() * 40}%`,
                    left: `${30 + Math.random() * 40}%`,
                  }}
                  id={`16p0ed_${index}`}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`
 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer
 ${getProjectTypeColor(project.type)}
 `}
                        ></div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {project.name}
                          </p>
                          <p className="text-xs">
                            {project.feedbackCount} comments
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}

              {/* Community feedback markers */}
              {communityFeedback.map((feedback, index) => (
                <div
                  key={feedback.id}
                  className="absolute w-5 h-5 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                  }}
                  id={`m0dn6c_${index}`}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`
 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer border-2 border-white
 ${getFeedbackTypeColor(feedback.type)}
 `}
                        ></div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge
                              className={`${getFeedbackTypeColor(
                                feedback.type
                              )}`}
                            >
                              {feedback.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {feedback.date}
                            </span>
                          </div>
                          <p className="font-medium">{feedback.title}</p>
                          <p className="text-xs">{feedback.description}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          </div>

          {/* Map controls */}
          <div
            className="absolute top-4 right-4 flex flex-col space-y-2"
          >
            <Button variant="secondary" size="icon">
              <ZoomInIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon">
              <ZoomOutIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon">
              <HomeIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon">
              <LayersIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Success message */}
          {showSuccessMessage && (
            <div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 p-4 rounded-md flex items-center shadow-lg"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Your feedback has been submitted successfully. Thank you for your
              contribution!
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {showFeedbackForm ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                Add Map Feedback
              </CardTitle>
              <CardDescription>
                Share your feedback about a specific location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmitFeedback}
                className="space-y-4"
              >
                {selectedLocation && (
                  <div className="p-3 bg-secondary/50 rounded-md">
                    <div className="flex items-center mb-2">
                      <MapPinIcon
                        className="h-4 w-4 text-muted-foreground mr-2"
                      />

                      <p className="text-sm font-medium">
                        Selected Location
                      </p>
                    </div>
                    <p className="text-sm">
                      {selectedLocation.address}
                    </p>
                    <p
                      className="text-xs text-muted-foreground mt-1"
                    >
                      Lat: {selectedLocation.lat.toFixed(6)}, Lng:{" "}
                      {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Feedback Type
                  </label>
                  <Select
                    defaultValue="issue"
                    onValueChange={setFeedbackType}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select feedback type"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issue">
                        Issue or Concern
                      </SelectItem>
                      <SelectItem value="suggestion">
                        Suggestion or Idea
                      </SelectItem>
                      <SelectItem value="support">
                        Support or Praise
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    placeholder="Brief title for your feedback"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    placeholder="Provide details about your feedback..."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Attachments (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        document.getElementById("file-upload")!.click()
                      }
                    >
                      <FileIcon className="mr-2 h-4 w-4" />
                      Add Files
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        document.getElementById("image-upload")!.click()
                      }
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Add Images
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      multiple
                    />

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      multiple
                    />
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-secondary/50 rounded-md"
                          id={`906r5k_${index}`}
                        >
                          <div
                            className="flex items-center"
                            id={`53w9bo_${index}`}
                          >
                            <FileIcon
                              className="h-4 w-4 mr-2 text-muted-foreground"
                              id={`y52c2r_${index}`}
                            />

                            <div id={`vjlxsm_${index}`}>
                              <p
                                className="text-sm font-medium"
                                id={`n9659c_${index}`}
                              >
                                {file.name}
                              </p>
                              <p
                                className="text-xs text-muted-foreground"
                                id={`e88k6e_${index}`}
                              >
                                {file.size}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            id={`d5voen_${index}`}
                          >
                            <XIcon className="h-4 w-4" id={`d93ph3_${index}`} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleCancelFeedback}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Map Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Projects
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full bg-orange-500 mr-2"
                    ></div>
                    <span className="text-sm">
                      Highway Projects
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full bg-indigo-500 mr-2"
                    ></div>
                    <span className="text-sm">
                      Transit Projects
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full bg-green-500 mr-2"
                    ></div>
                    <span className="text-sm">
                      Active Transportation
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full bg-blue-500 mr-2"
                    ></div>
                    <span className="text-sm">
                      Bridge Projects
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">
                  Community Feedback
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full bg-red-500 border-2 border-white mr-2 flex items-center justify-center"
                    >
                      <AlertCircleIcon
                        className="h-2 w-2 text-white"
                      />
                    </div>
                    <span className="text-sm">
                      Issues & Concerns
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white mr-2 flex items-center justify-center"
                    >
                      <InfoIcon className="h-2 w-2 text-white" />
                    </div>
                    <span className="text-sm">
                      Suggestions & Ideas
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full bg-green-500 border-2 border-white mr-2 flex items-center justify-center"
                    >
                      <CheckIcon className="h-2 w-2 text-white" />
                    </div>
                    <span className="text-sm">
                      Support & Praise
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleAddFeedback}
              >
                <MapPinIcon className="mr-2 h-4 w-4" />
                Add Your Feedback
              </Button>
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent Map Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {communityFeedback.map((feedback, index) => (
              <div
                key={feedback.id}
                className="p-3 bg-secondary/50 rounded-md"
                id={`sawvoa_${index}`}
              >
                <div className="flex items-center mb-1" id={`gpv1n5_${index}`}>
                  <div
                    className={`w-4 h-4 rounded-full ${getFeedbackTypeColor(
                      feedback.type,
                    )} mr-2 flex items-center justify-center`}
                    id={`pvrzt8_${index}`}
                  >
                    {feedback.type === "issue" ? (
                      <AlertCircleIcon
                        className="h-2 w-2 text-white"
                        id={`2hxx8u_${index}`}
                      />
                    ) : feedback.type === "suggestion" ? (
                      <InfoIcon
                        className="h-2 w-2 text-white"
                        id={`0z0lx6_${index}`}
                      />
                    ) : (
                      <CheckIcon
                        className="h-2 w-2 text-white"
                        id={`v0eoue_${index}`}
                      />
                    )}
                  </div>
                  <span className="font-medium text-sm" id={`v3rl77_${index}`}>
                    {feedback.title}
                  </span>
                </div>
                <p className="text-xs ml-6 mb-1" id={`cn06d1_${index}`}>
                  {feedback.description}
                </p>
                <p
                  className="text-xs text-muted-foreground ml-6"
                  id={`ohahfw_${index}`}
                >
                  By {feedback.author} on{" "}
                  {new Date(feedback.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Feedback
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
