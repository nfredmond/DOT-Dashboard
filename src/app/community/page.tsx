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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquareIcon,
  MapPinIcon,
  CalendarIcon,
  ThumbsUpIcon,
  SearchIcon,
  FilterIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import dynamic from "next/dynamic";

// Dynamic import of the CommunityInputMap component
const CommunityInputMap = dynamic(
  () => import('@/app/(components)/community-input-map').then(mod => mod.CommunityInputMap),
  { ssr: false }
);

export default function Community() {
  const [_activeTab, setActiveTab] = useState("mapping");
  const [searchQuery, setSearchQuery] = useState("");

  // Define types for projects and surveys
  interface Project {
    id: number;
    title: string;
    description: string;
    category: string;
    location: string;
    feedbackDeadline: string;
    feedbackCount: number;
    status: string;
  }

  interface Survey {
    id: number;
    title: string;
    description: string;
    questions: number;
    estimatedTime: string;
    deadline: string;
    responsesCount: number;
    status: string;
  }

  // Mock data for projects
  const projects = [
    {
      id: 1,
      title: "Highway 101 Expansion",
      description: "Extension of Highway 101 with additional lanes and improved interchanges to reduce congestion.",
      category: "Highway",
      location: "Santa Barbara County",
      feedbackDeadline: "2023-08-15",
      feedbackCount: 42,
      status: "Open for Feedback",
    },
    {
      id: 2,
      title: "Downtown Transit Center",
      description: "New central transit hub with improved connections between bus and light rail services.",
      category: "Transit",
      location: "Sacramento",
      feedbackDeadline: "2023-08-30",
      feedbackCount: 28,
      status: "Open for Feedback",
    },
    {
      id: 3,
      title: "Bike Lane Network Expansion",
      description: "Expansion of protected bike lanes connecting residential areas to downtown and major employment centers.",
      category: "Active Transportation",
      location: "San Francisco",
      feedbackDeadline: "2023-09-05",
      feedbackCount: 65,
      status: "Open for Feedback",
    },
    {
      id: 4,
      title: "Bridge Retrofit Project",
      description: "Seismic retrofitting of three bridges to improve safety and structural integrity.",
      category: "Bridge",
      location: "Oakland",
      feedbackDeadline: "2023-08-20",
      feedbackCount: 17,
      status: "Open for Feedback",
    },
    {
      id: 5,
      title: "Light Rail Extension",
      description: "Extension of the light rail system to serve new residential developments and improve regional connectivity.",
      category: "Transit",
      location: "San Jose",
      feedbackDeadline: "2023-09-10",
      feedbackCount: 31,
      status: "Open for Feedback",
    },
  ];

  // Mock data for surveys
  const surveys = [
    {
      id: 1,
      title: "Transportation Needs Assessment",
      description: "Help us understand your daily transportation needs and challenges.",
      questions: 12,
      estimatedTime: "5-7 minutes",
      deadline: "2023-08-25",
      responsesCount: 324,
      status: "Open",
    },
    {
      id: 2,
      title: "Transit Service Satisfaction",
      description: "Rate your experience with regional transit services and suggest improvements.",
      questions: 15,
      estimatedTime: "8-10 minutes",
      deadline: "2023-09-01",
      responsesCount: 187,
      status: "Open",
    },
    {
      id: 3,
      title: "Active Transportation Priorities",
      description: "Help us prioritize bike and pedestrian infrastructure improvements.",
      questions: 10,
      estimatedTime: "4-6 minutes",
      deadline: "2023-08-20",
      responsesCount: 256,
      status: "Open",
    },
  ];

  // Mock data for upcoming events
  const events = [
    {
      id: 1,
      title: "Highway 101 Expansion Public Workshop",
      date: "2023-08-10",
      time: "6:00 PM - 8:00 PM",
      location: "Santa Barbara Community Center",
      type: "Workshop",
      registrations: 45,
    },
    {
      id: 2,
      title: "Downtown Transit Center Design Review",
      date: "2023-08-17",
      time: "5:30 PM - 7:30 PM",
      location: "Sacramento City Hall",
      type: "Public Hearing",
      registrations: 32,
    },
    {
      id: 3,
      title: "Bike Lane Network Virtual Information Session",
      date: "2023-08-22",
      time: "12:00 PM - 1:00 PM",
      location: "Online (Zoom)",
      type: "Webinar",
      registrations: 78,
    },
  ];

  // Mock data for recent feedback
  const recentFeedback = [
    {
      id: 1,
      project: "Highway 101 Expansion",
      author: {
        name: "John Smith",
        avatar: "https://github.com/shadcn.png",
      },
      date: "2023-07-28",
      content:
        "I'm concerned about the environmental impact of widening the highway. Has there been a thorough environmental assessment?",
      likes: 12,
      replies: 2,
    },
    {
      id: 2,
      project: "Downtown Transit Center",
      author: {
        name: "Emily Johnson",
        avatar: "https://github.com/shadcn.png",
      },
      date: "2023-07-27",
      content:
        "The proposed location is perfect! It will greatly improve accessibility for those of us who rely on public transit.",
      likes: 24,
      replies: 5,
    },
    {
      id: 3,
      project: "Bike Lane Network Expansion",
      author: {
        name: "Michael Chen",
        avatar: "https://github.com/shadcn.png",
      },
      date: "2023-07-26",
      content:
        "I support the bike lane expansion, but please ensure there are physical barriers between bike lanes and car traffic for safety.",
      likes: 36,
      replies: 8,
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Highway":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Transit":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Active Transportation":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Bridge":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "Workshop":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Public Hearing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Webinar":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Community
          </h1>
          <p className="text-muted-foreground">
            Engage with transportation projects, provide feedback, and participate
            in planning activities
          </p>
        </div>

        <div
          className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between"
        >
          <Tabs
            defaultValue="mapping"
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between w-full">
              <TabsList className="grid w-full md:w-auto grid-cols-4">
                <TabsTrigger value="mapping">
                  Mapping
                </TabsTrigger>
                <TabsTrigger value="projects">
                  Projects
                </TabsTrigger>
                <TabsTrigger value="surveys">
                  Surveys
                </TabsTrigger>
                <TabsTrigger value="events">
                  Events
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <SearchIcon
                    className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                  />

                  <Input
                    placeholder="Search..."
                    className="pl-8 w-full sm:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <FilterIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="projects" className="mt-4 space-y-6">
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {projects.map((project, index) => (
                  <Card key={project.id} id={`k9ohiz_${index}`}>
                    <CardHeader className="pb-3" id={`6gvwva_${index}`}>
                      <div
                        className="flex justify-between items-start"
                        id={`ojydhk_${index}`}
                      >
                        <Badge
                          className={getCategoryColor(project.category)}
                          id={`3qybni_${index}`}
                        >
                          {project.category}
                        </Badge>
                        <Badge
                          variant={
                            project.status === "Open for Feedback"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            project.status === "Open for Feedback"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : ""
                          }
                          id={`qk3d39_${index}`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2" id={`pzkkgw_${index}`}>
                        {project.title}
                      </CardTitle>
                      <CardDescription id={`e7rjz2_${index}`}>
                        {project.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent id={`z6aequ_${index}`}>
                      <p
                        className="text-sm text-muted-foreground mb-4"
                        id={`aeh33d_${index}`}
                      >
                        {project.description}
                      </p>
                      <div
                        className="flex items-center justify-between text-sm"
                        id={`hf1s43_${index}`}
                      >
                        <div
                          className="flex items-center"
                          id={`nj1lyn_${index}`}
                        >
                          <MessageSquareIcon
                            className="h-4 w-4 text-muted-foreground mr-1"
                            id={`ujxe4y_${index}`}
                          />
                          <span id={`9r8r9n_${index}`}>
                            {project.feedbackCount} comments
                          </span>
                        </div>
                        <div id={`8jvgta_${index}`}>
                          <span
                            className="text-muted-foreground"
                            id={`v6g5ub_${index}`}
                          >
                            Deadline:{" "}
                          </span>
                          <span
                            className={`font-medium ${
                              new Date(project.feedbackDeadline) < new Date()
                                ? "text-red-500"
                                : ""
                            }`}
                            id={`2xsvlq_${index}`}
                          >
                            {new Date(
                              project.feedbackDeadline
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter id={`lpgcib_${index}`}>
                      <Button className="w-full" id={`oqctjj_${index}`}>
                        View Details
                        <ChevronRightIcon
                          className="ml-2 h-4 w-4"
                          id={`bskokm_${index}`}
                        />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Community Feedback</CardTitle>
                    <CardDescription>
                      Latest comments on transportation projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {recentFeedback.map((feedback, index) => (
                      <div
                        key={feedback.id}
                        className="p-4 bg-secondary/50 rounded-md"
                        id={`9of8d5_${index}`}
                      >
                        <div
                          className="flex justify-between items-start mb-2"
                          id={`lzuxpu_${index}`}
                        >
                          <div className="flex items-center" id={`9qx3gz_${index}`}>
                            <Avatar className="h-8 w-8 mr-2" id={`nj9szb_${index}`}>
                              <AvatarImage
                                src={feedback.author.avatar}
                                alt={feedback.author.name}
                                id={`b2ijut_${index}`}
                              />

                              <AvatarFallback id={`rgfhne_${index}`}>
                                {feedback.author.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div id={`kvnuj3_${index}`}>
                              <p className="font-medium" id={`81vuvz_${index}`}>
                                {feedback.author.name}
                              </p>
                              <p
                                className="text-xs text-muted-foreground"
                                id={`8t7gzi_${index}`}
                              >
                                {new Date(feedback.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" id={`xb3ydl_${index}`}>
                            {feedback.project}
                          </Badge>
                        </div>
                        <p
                          className="text-sm text-muted-foreground mb-3"
                          id={`yxpv8r_${index}`}
                        >
                          {feedback.content}
                        </p>
                        <div
                          className="flex items-center justify-between"
                          id={`kk9t48_${index}`}
                        >
                          <div
                            className="flex items-center space-x-2"
                            id={`8gnlfu_${index}`}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              id={`wn9mgc_${index}`}
                            >
                              <ThumbsUpIcon
                                className="h-4 w-4 mr-1"
                                id={`kh3qkv_${index}`}
                              />
                              {feedback.likes}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              id={`k1a89v_${index}`}
                            >
                              <MessageSquareIcon
                                className="h-4 w-4 mr-1"
                                id={`i7qnro_${index}`}
                              />
                              {feedback.replies}
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            id={`j7e4x3_${index}`}
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View All Feedback
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Community Participation</CardTitle>
                    <CardDescription>
                      Current engagement metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Feedback Responses</span>
                        <span className="font-medium">183/250 target</span>
                      </div>
                      <Progress value={73} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Survey Completions</span>
                        <span className="font-medium">767/1000 target</span>
                      </div>
                      <Progress value={76} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Workshop Attendance</span>
                        <span className="font-medium">155/300 target</span>
                      </div>
                      <Progress value={52} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Map Comments</span>
                        <span className="font-medium">92/150 target</span>
                      </div>
                      <Progress value={61} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Get Involved</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Submit Feedback
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <MessageSquareIcon className="mr-2 h-4 w-4" />
                      Join Discussion
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Attend an Event
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <MapPinIcon className="mr-2 h-4 w-4" />
                      Add Map Feedback
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="surveys" className="mt-4 space-y-6">
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {surveys.map((survey, index) => (
                  <Card key={survey.id} id={`5lktmb_${index}`}>
                    <CardHeader id={`qf4wt2_${index}`}>
                      <div
                        className="flex justify-between items-start"
                        id={`4wyzqf_${index}`}
                      >
                        <Badge id={`cqcnla_${index}`}>
                          {survey.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="font-normal"
                          id={`qvzzct_${index}`}
                        >
                          {survey.responsesCount} responses
                        </Badge>
                      </div>
                      <CardTitle className="mt-2" id={`w3o9ln_${index}`}>
                        {survey.title}
                      </CardTitle>
                      <CardDescription id={`82g28q_${index}`}>
                        {survey.questions} questions · {survey.estimatedTime}
                      </CardDescription>
                    </CardHeader>
                    <CardContent id={`hgvfrl_${index}`}>
                      <p
                        className="text-sm text-muted-foreground mb-4"
                        id={`8z4ixl_${index}`}
                      >
                        {survey.description}
                      </p>
                      <div
                        className="flex items-center text-sm"
                        id={`afo3pd_${index}`}
                      >
                        <ClockIcon
                          className="h-4 w-4 text-muted-foreground mr-1"
                          id={`p9q05g_${index}`}
                        />
                        <span id={`7rvhcn_${index}`}>
                          <span
                            className="text-muted-foreground"
                            id={`i0qebk_${index}`}
                          >
                            Deadline:{" "}
                          </span>
                          <span
                            className={`font-medium ${
                              new Date(survey.deadline) < new Date()
                                ? "text-red-500"
                                : ""
                            }`}
                            id={`7ybf1u_${index}`}
                          >
                            {new Date(survey.deadline).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter id={`4qp7pn_${index}`}>
                      <Button className="w-full" id={`lo6ryz_${index}`}>
                        Take Survey
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-4 space-y-6">
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {events.map((event, index) => (
                  <Card key={event.id} id={`eute7c_${index}`}>
                    <CardHeader id={`x43wb0_${index}`}>
                      <div
                        className="flex justify-between items-start"
                        id={`7hiji1_${index}`}
                      >
                        <Badge
                          className={getEventTypeColor(event.type)}
                          id={`vunzyn_${index}`}
                        >
                          {event.type}
                        </Badge>
                        <Badge variant="outline" id={`x0myih_${index}`}>
                          {event.registrations} registered
                        </Badge>
                      </div>
                      <CardTitle className="mt-2" id={`p5mfiq_${index}`}>
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent id={`uq9n9z_${index}`}>
                      <div
                        className="space-y-2 text-sm"
                        id={`2fzwai_${index}`}
                      >
                        <div
                          className="flex items-start"
                          id={`k9c1vn_${index}`}
                        >
                          <CalendarIcon
                            className="h-4 w-4 text-muted-foreground mr-2 mt-0.5"
                            id={`4iw0tj_${index}`}
                          />
                          <div id={`dxh2kn_${index}`}>
                            <p className="font-medium" id={`99r2ug_${index}`}>
                              {new Date(event.date).toLocaleDateString(
                                undefined,
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                            <p
                              className="text-muted-foreground"
                              id={`2cgsrw_${index}`}
                            >
                              {event.time}
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-start"
                          id={`8uv1gd_${index}`}
                        >
                          <MapPinIcon
                            className="h-4 w-4 text-muted-foreground mr-2 mt-0.5"
                            id={`l4qcw2_${index}`}
                          />
                          <span id={`z8eipr_${index}`}>
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter
                      className="flex gap-2"
                      id={`38y456_${index}`}
                    >
                      <Button
                        className="flex-1"
                        id={`g5g53w_${index}`}
                      >
                        Register
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        id={`wj7ppu_${index}`}
                      >
                        Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mapping" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Community Input Map</CardTitle>
                  <CardDescription>
                    Provide location-based feedback on transportation projects and issues in your community
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                  <div className="h-[700px] w-full">
                    {typeof window !== 'undefined' && <CommunityInputMap />}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}