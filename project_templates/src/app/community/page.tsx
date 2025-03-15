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
  UsersIcon,
  MessageSquareIcon,
  FileTextIcon,
  MapPinIcon,
  CalendarIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  SearchIcon,
  FilterIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
} from "lucide-react";
import { CommunityFeedback } from "(components)/community-feedback";
import { CommunityMapping } from "(components)/community-mapping";

export default function Community() {
  const [activeTab, setActiveTab] = useState("projects");
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
    deadline: string;
    participants: number;
    estimatedTime: string;
    status: string;
  }

  // Mock data for projects open for feedback
  const projects: Project[] = [
    {
      id: 1,
      title: "Highway 101 Expansion",
      description:
        "Widening of Highway 101 between Santa Barbara and Ventura to reduce congestion",
      category: "Highway",
      location: "Santa Barbara County",
      feedbackDeadline: "2023-08-15",
      feedbackCount: 24,
      status: "Open for Feedback",
    },
    {
      id: 2,
      title: "Downtown Transit Center",
      description:
        "Construction of a new transit hub in downtown Sacramento with improved accessibility",
      category: "Transit",
      location: "Sacramento",
      feedbackDeadline: "2023-08-30",
      feedbackCount: 42,
      status: "Open for Feedback",
    },
    {
      id: 3,
      title: "Bike Lane Network Expansion",
      description:
        "Adding 15 miles of protected bike lanes throughout San Francisco",
      category: "Active Transportation",
      location: "San Francisco",
      feedbackDeadline: "2023-09-10",
      feedbackCount: 68,
      status: "Open for Feedback",
    },
  ];

  // Mock data for surveys
  const surveys: Survey[] = [
    {
      id: 1,
      title: "Transportation Needs Assessment",
      description:
        "Help us understand your transportation needs and priorities for future planning",
      deadline: "2023-08-20",
      participants: 156,
      estimatedTime: "10 minutes",
      status: "Active",
    },
    {
      id: 2,
      title: "Transit Service Satisfaction",
      description:
        "Share your feedback on current transit services and suggest improvements",
      deadline: "2023-09-05",
      participants: 89,
      estimatedTime: "5 minutes",
      status: "Active",
    },
    {
      id: 3,
      title: "Bicycle Infrastructure Preferences",
      description:
        "Help shape the future of bicycle infrastructure in your community",
      deadline: "2023-08-25",
      participants: 112,
      estimatedTime: "8 minutes",
      status: "Active",
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
        avatar: "https://github.com/yusufhilmi.png",
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
        avatar: "https://github.com/furkanksl.png",
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
        avatar: "https://github.com/polymet-ai.png",
      },
      date: "2023-07-26",
      content:
        "I support the bike lane expansion, but please ensure there are physical barriers between bike lanes and car traffic for safety.",
      likes: 36,
      replies: 8,
    },
  ];

  const getCategoryColor = (category) => {
    switch (category) {
      case "Highway":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Transit":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "Active Transportation":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case "Workshop":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Public Hearing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Webinar":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
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
          defaultValue="projects"
          onValueChange={setActiveTab}
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects">
              Projects
            </TabsTrigger>
            <TabsTrigger value="surveys">
              Surveys
            </TabsTrigger>
            <TabsTrigger value="events">
              Events
            </TabsTrigger>
            <TabsTrigger value="mapping">
              Mapping
            </TabsTrigger>
          </TabsList>
        </Tabs>

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

      <TabsContent value="projects" className="mt-0 space-y-6">
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects.map((project, index) => (
            <Card key={project.id} id={`7aojrm_${index}`}>
              <CardHeader id={`pf61wj_${index}`}>
                <div
                  className="flex justify-between items-start"
                  id={`5lgtte_${index}`}
                >
                  <Badge
                    className={getCategoryColor(project.category)}
                    id={`q8hyu0_${index}`}
                  >
                    {project.category}
                  </Badge>
                  <Badge variant="outline" id={`umc2d9_${index}`}>
                    {project.status}
                  </Badge>
                </div>
                <CardTitle className="mt-2" id={`zwwym3_${index}`}>
                  {project.title}
                </CardTitle>
                <CardDescription id={`yfkt39_${index}`}>
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" id={`bz5434_${index}`}>
                <div className="flex items-center" id={`jdqvy4_${index}`}>
                  <MapPinIcon
                    className="h-4 w-4 text-muted-foreground mr-2"
                    id={`fvn64e_${index}`}
                  />

                  <span className="text-sm" id={`38m51n_${index}`}>
                    {project.location}
                  </span>
                </div>
                <div className="flex items-center" id={`jrsgmm_${index}`}>
                  <CalendarIcon
                    className="h-4 w-4 text-muted-foreground mr-2"
                    id={`6gxqfk_${index}`}
                  />

                  <span className="text-sm" id={`4bqlsm_${index}`}>
                    Feedback deadline:{" "}
                    {new Date(project.feedbackDeadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center" id={`7mtai8_${index}`}>
                  <MessageSquareIcon
                    className="h-4 w-4 text-muted-foreground mr-2"
                    id={`2s9qyi_${index}`}
                  />

                  <span className="text-sm" id={`qvt46z_${index}`}>
                    {project.feedbackCount} comments
                  </span>
                </div>
              </CardContent>
              <CardFooter id={`622oo6_${index}`}>
                <Button className="w-full" id={`k7pixn_${index}`}>
                  Provide Feedback
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
                    <Badge variant="outline" id={`k1g7gz_${index}`}>
                      {feedback.project}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3" id={`hie6fa_${index}`}>
                    {feedback.content}
                  </p>
                  <div
                    className="flex items-center text-sm text-muted-foreground"
                    id={`5h91w7_${index}`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      id={`dtecwm_${index}`}
                    >
                      <ThumbsUpIcon
                        className="h-4 w-4 mr-1"
                        id={`ryrbwr_${index}`}
                      />

                      {feedback.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      id={`m9awbz_${index}`}
                    >
                      <MessageSquareIcon
                        className="h-4 w-4 mr-1"
                        id={`ixbk2v_${index}`}
                      />

                      {feedback.replies}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 ml-auto"
                      id={`dwonk6_${index}`}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-center">
                <Button variant="outline">
                  View All Feedback
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3"
                    >
                      <FileTextIcon
                        className="h-5 w-5 text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        Open Projects
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Available for feedback
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    12
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3"
                    >
                      <MessageSquareIcon
                        className="h-5 w-5 text-green-600 dark:text-green-400"
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        Comments
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This month
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    248
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full mr-3"
                    >
                      <UsersIcon
                        className="h-5 w-5 text-purple-600 dark:text-purple-400"
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        Active Users
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Community members
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    1,245
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...projects, ...surveys]
                  .sort(
                    (a, b) => {
                      const dateA = 'feedbackDeadline' in a ? a.feedbackDeadline : a.deadline;
                      const dateB = 'feedbackDeadline' in b ? b.feedbackDeadline : b.deadline;
                      return new Date(dateA).getTime() - new Date(dateB).getTime();
                    }
                  )
                  .slice(0, 3)
                  .map((item, index) => {
                    const isProject = 'feedbackDeadline' in item;
                    const deadline = isProject ? item.feedbackDeadline : item.deadline;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start space-x-4 p-3 rounded-lg bg-muted/50"
                        id={`ixvnqw_${index}`}
                      >
                        <div className="flex-1 space-y-1" id={`ixvnqw_${index}`}>
                          <h4 className="font-medium text-sm" id={`ixvnqw_${index}`}>
                            {item.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2" id={`ixvnqw_${index}`}>
                            {item.description}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground" id={`ixvnqw_${index}`}>
                            <CalendarIcon className="h-3 w-3 mr-1" id={`ixvnqw_${index}`} />
                            <span id={`ixvnqw_${index}`}>
                              Deadline:{" "}
                              {new Date(deadline).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          id={`ixvnqw_${index}`}
                        >
                          Participate
                        </Button>
                      </div>
                    );
                  })}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Deadlines
                </Button>
              </CardFooter>
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
        </div>

        <CommunityFeedback />
      </TabsContent>

      <TabsContent value="surveys" className="mt-0 space-y-6">
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {surveys.map((survey, index) => (
            <Card key={survey.id} id={`5lktmb_${index}`}>
              <CardHeader id={`1rotbo_${index}`}>
                <div
                  className="flex justify-between items-start"
                  id={`q3er2r_${index}`}
                >
                  <Badge variant="secondary" id={`7v3eb4_${index}`}>
                    Survey
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    id={`z72ae6_${index}`}
                  >
                    {survey.status}
                  </Badge>
                </div>
                <CardTitle className="mt-2" id={`e31z3x_${index}`}>
                  {survey.title}
                </CardTitle>
                <CardDescription id={`hpqrl2_${index}`}>
                  {survey.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" id={`9fak0x_${index}`}>
                <div className="flex items-center" id={`xtn3tm_${index}`}>
                  <CalendarIcon
                    className="h-4 w-4 text-muted-foreground mr-2"
                    id={`oeij68_${index}`}
                  />

                  <span className="text-sm" id={`odh0ew_${index}`}>
                    Deadline: {new Date(survey.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center" id={`lx5ig5_${index}`}>
                  <ClockIcon
                    className="h-4 w-4 text-muted-foreground mr-2"
                    id={`yc14oz_${index}`}
                  />

                  <span className="text-sm" id={`1wqkjw_${index}`}>
                    Estimated time: {survey.estimatedTime}
                  </span>
                </div>
                <div className="flex items-center" id={`whkd0e_${index}`}>
                  <UsersIcon
                    className="h-4 w-4 text-muted-foreground mr-2"
                    id={`tu4zy4_${index}`}
                  />

                  <span className="text-sm" id={`s1pb3o_${index}`}>
                    {survey.participants} participants so far
                  </span>
                </div>
                <div id={`g869ku_${index}`}>
                  <div
                    className="flex justify-between text-sm mb-1"
                    id={`xq94do_${index}`}
                  >
                    <span id={`qjiibr_${index}`}>Completion</span>
                    <span id={`v7uovm_${index}`}>45%</span>
                  </div>
                  <Progress value={45} className="h-2" id={`0toa1y_${index}`} />
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

      <TabsContent value="events" className="mt-0 space-y-6">
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
              <CardContent className="space-y-4" id={`mb0j57_${index}`}>
                <div className="flex items-center" id={`rn33xe_${index}`}>
                  <CalendarIcon
                    className="h-4 w-4 text-muted-foreground mr-2"
                    id={`d7olbq_${index}`}
                  />

                  <span className="text-sm" id={`g2stms_${index}`}>
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center" id={`y2rprz_${index}`}>
                  <ClockIcon
                    className="h-4 w-4 text-muted-foreground mr-2"
                    id={`o7sjk4_${index}`}
                  />

                  <span className="text-sm" id={`d8tszr_${index}`}>
                    {event.time}
                  </span>
                </div>
                <div className="flex items-center" id={`jntqce_${index}`}>
                  <MapPinIcon
                    className="h-4 w-4 text-muted-foreground mr-2"
                    id={`10i0pv_${index}`}
                  />

                  <span className="text-sm" id={`o9leze_${index}`}>
                    {event.location}
                  </span>
                </div>
              </CardContent>
              <CardFooter
                className="flex justify-between"
                id={`h4qz31_${index}`}
              >
                <Button variant="outline" id={`vucrwh_${index}`}>
                  Learn More
                </Button>
                <Button id={`lsve2i_${index}`}>Register</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="mapping" className="mt-0">
        <CommunityMapping />
      </TabsContent>
    </div>
  );
}
