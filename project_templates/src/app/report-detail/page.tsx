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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileTextIcon,
  DownloadIcon,
  PrinterIcon,
  ShareIcon,
  PencilIcon,
  CheckIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

export default function ReportDetail() {
  const [activeTab, setActiveTab] = useState("preview");

  // Mock report data
  const report = {
    id: 1,
    title: "Q2 2023 Transportation Plan Update",
    type: "Transportation Plan",
    status: "Published",
    date: "2023-07-15",
    author: {
      name: "Alex Johnson",
      email: "alex.johnson@caltrans.gov",
      avatar: "https://github.com/yusufhilmi.png",
    },
    projects: 24,
    description:
      "Quarterly update on transportation planning activities and project status for the Santa Barbara County region.",
    sections: [
      {
        title: "Executive Summary",
        content:
          "This quarterly report provides an update on the transportation planning activities and project status for the Santa Barbara County region during Q2 2023. The report highlights progress on key projects, funding allocations, and upcoming milestones. Overall, 24 active projects are currently in various stages of implementation, with 5 new projects initiated this quarter and 3 projects completed.",
      },
      {
        title: "Project Status Overview",
        content:
          "Of the 24 active projects, 12 are highway projects, 7 are transit projects, and 5 are active transportation projects. The Highway 101 Expansion project remains the largest ongoing initiative, with significant progress made on the environmental review phase. The Downtown Transit Center project has moved into the planning phase, with community engagement activities scheduled for Q3. The Bike Lane Network Expansion project has been approved and is now entering the implementation phase.",
      },
      {
        title: "Funding Allocation",
        content:
          "Total funding allocated across all projects amounts to $245.8M, representing an 18% increase from the previous year. The majority of funding (65%) is directed toward highway projects, followed by transit projects (25%) and active transportation projects (10%). New grant applications have been submitted for an additional $32.5M in potential funding for upcoming projects.",
      },
      {
        title: "Community Engagement",
        content:
          "Public outreach activities during Q2 included 3 community workshops, 2 online surveys, and 1 public hearing. Total participation reached approximately 450 community members. Key feedback themes included strong support for expanded bike infrastructure, concerns about construction impacts on local businesses, and requests for improved transit frequency in underserved areas.",
      },
      {
        title: "Next Steps and Recommendations",
        content:
          "Priorities for Q3 include finalizing the environmental documentation for the Highway 101 Expansion, launching the design phase for the Downtown Transit Center, and beginning construction on the first segment of the Bike Lane Network Expansion. Additionally, new grant applications will be prepared for the upcoming federal infrastructure funding cycle, with a focus on projects that address equity, sustainability, and safety concerns.",
      },
    ],

    relatedProjects: [
      {
        id: 1,
        name: "Highway 101 Expansion",
        category: "Highway",
        status: "In Progress",
      },
      {
        id: 2,
        name: "Downtown Transit Center",
        category: "Transit",
        status: "Planning",
      },
      {
        id: 3,
        name: "Bike Lane Network Expansion",
        category: "Active Transportation",
        status: "Approved",
      },
    ],

    attachments: [
      {
        name: "Project Status Table.xlsx",
        size: "245 KB",
        type: "spreadsheet",
      },
      {
        name: "Funding Allocation Chart.pdf",
        size: "1.2 MB",
        type: "pdf",
      },
      {
        name: "Community Feedback Summary.docx",
        size: "380 KB",
        type: "document",
      },
      {
        name: "Project Map.geojson",
        size: "2.5 MB",
        type: "geojson",
      },
    ],

    comments: [
      {
        id: 1,
        author: {
          name: "Maria Rodriguez",
          avatar: "https://github.com/furkanksl.png",
        },
        date: "2023-07-16",
        content:
          "Great report! The executive summary provides a clear overview of our current status. I suggest adding more details about the funding sources in the next update.",
      },
      {
        id: 2,
        author: {
          name: "David Chen",
          avatar: "https://github.com/polymet-ai.png",
        },
        date: "2023-07-17",
        content:
          "The community engagement section could benefit from more specific data on demographic participation. Otherwise, this is a comprehensive update.",
      },
    ],
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Under Review":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

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

  const getAttachmentIcon = (type) => {
    switch (type) {
      case "pdf":
        return <FileTextIcon className="h-4 w-4 text-red-500" />;
      case "document":
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      case "spreadsheet":
        return <FileTextIcon className="h-4 w-4 text-green-500" />;
      case "geojson":
        return <FileTextIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <FileTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Reports
          </Button>
          <div className="flex items-center">
            <FileTextIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h1 className="text-2xl font-bold tracking-tight">
              {report.title}
            </h1>
          </div>
        </div>
        <Badge className={getStatusColor(report.status)}>
          {report.status}
        </Badge>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-3/4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>
                    {report.description}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm">
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="preview"
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview">
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="attachments">
                    Attachments
                  </TabsTrigger>
                  <TabsTrigger value="comments">
                    Comments
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="pt-4">
                  <div
                    className="prose dark:prose-invert max-w-none"
                  >
                    {report.sections.map((section, index) => (
                      <div key={index} className="mb-6" id={`xv4qg1_${index}`}>
                        <h2
                          className="text-xl font-semibold mb-2"
                          id={`xukqqo_${index}`}
                        >
                          {section.title}
                        </h2>
                        <p id={`ropbnv_${index}`}>{section.content}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="attachments" className="pt-4">
                  <div className="space-y-4">
                    {report.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                        id={`tpwxn5_${index}`}
                      >
                        <div
                          className="flex items-center"
                          id={`g5gsb9_${index}`}
                        >
                          {getAttachmentIcon(attachment.type)}
                          <div className="ml-3" id={`1s5rbi_${index}`}>
                            <h3 className="font-medium" id={`tqjzso_${index}`}>
                              {attachment.name}
                            </h3>
                            <p
                              className="text-xs text-muted-foreground"
                              id={`0sl85s_${index}`}
                            >
                              {attachment.size}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          id={`rrt0gk_${index}`}
                        >
                          <DownloadIcon
                            className="h-4 w-4"
                            id={`928nrx_${index}`}
                          />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="comments" className="pt-4">
                  <div className="space-y-4">
                    {report.comments.map((comment, index) => (
                      <div
                        key={comment.id}
                        className="p-4 bg-secondary/50 rounded-md"
                        id={`zs8dow_${index}`}
                      >
                        <div
                          className="flex items-center mb-2"
                          id={`ra7hjr_${index}`}
                        >
                          <Avatar
                            className="h-8 w-8 mr-2"
                            id={`xadv2r_${index}`}
                          >
                            <AvatarImage
                              src={comment.author.avatar}
                              alt={comment.author.name}
                              id={`k0y9rf_${index}`}
                            />

                            <AvatarFallback id={`gqd5b5_${index}`}>
                              {comment.author.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div id={`4brigq_${index}`}>
                            <p className="font-medium" id={`go33sc_${index}`}>
                              {comment.author.name}
                            </p>
                            <p
                              className="text-xs text-muted-foreground"
                              id={`vwjm62_${index}`}
                            >
                              {new Date(comment.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm" id={`w8fmj0_${index}`}>
                          {comment.content}
                        </p>
                      </div>
                    ))}
                    <div className="pt-4">
                      <textarea
                        className="w-full p-3 border rounded-md"
                        placeholder="Add a comment..."
                        rows={3}
                      ></textarea>
                      <div className="flex justify-end mt-2">
                        <Button>Add Comment</Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Projects</CardTitle>
              <CardDescription>
                Projects included in this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.relatedProjects.map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                    id={`dsm74o_${index}`}
                  >
                    <div className="flex items-center" id={`i5vwdg_${index}`}>
                      <Badge
                        className={getCategoryColor(project.category)}
                        variant="secondary"
                        id={`y1hojr_${index}`}
                      >
                        {project.category}
                      </Badge>
                      <h3 className="font-medium ml-3" id={`7pzdl8_${index}`}>
                        {project.name}
                      </h3>
                    </div>
                    <div className="flex items-center" id={`tkmclr_${index}`}>
                      <Badge
                        variant="outline"
                        className="mr-2"
                        id={`j1z2sa_${index}`}
                      >
                        {project.status}
                      </Badge>
                      <Button variant="ghost" size="sm" id={`bk45ur_${index}`}>
                        View
                        <ChevronRightIcon
                          className="h-4 w-4 ml-1"
                          id={`r74suc_${index}`}
                        />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-1/4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <CalendarIcon
                  className="h-4 w-4 text-muted-foreground mr-2"
                />
                <div>
                  <p className="text-sm font-medium">
                    Date
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(report.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <UsersIcon
                  className="h-4 w-4 text-muted-foreground mr-2"
                />
                <div>
                  <p className="text-sm font-medium">
                    Author
                  </p>
                  <div className="flex items-center mt-1">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage
                        src={report.author.avatar}
                        alt={report.author.name}
                      />

                      <AvatarFallback>
                        {report.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm">
                      {report.author.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <FileTextIcon
                  className="h-4 w-4 text-muted-foreground mr-2"
                />
                <div>
                  <p className="text-sm font-medium">
                    Type
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {report.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPinIcon
                  className="h-4 w-4 text-muted-foreground mr-2"
                />
                <div>
                  <p className="text-sm font-medium">
                    Region
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Santa Barbara County
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <ClockIcon
                  className="h-4 w-4 text-muted-foreground mr-2"
                />
                <div>
                  <p className="text-sm font-medium">
                    Last Updated
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(report.date).toLocaleDateString()} at{" "}
                    {new Date(report.date).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit Report
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
              >
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print Report
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
              >
                <ShareIcon className="mr-2 h-4 w-4" />
                Share Report
              </Button>
              {report.status !== "Published" && (
                <Button className="w-full justify-start">
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Publish Report
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Current Version
                  </p>
                  <p className="text-xs text-muted-foreground">
                    July 15, 2023 at 2:45 PM
                  </p>
                </div>
                <Badge>v1.2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Previous Version
                  </p>
                  <p className="text-xs text-muted-foreground">
                    July 14, 2023 at 10:30 AM
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Initial Draft
                  </p>
                  <p className="text-xs text-muted-foreground">
                    July 10, 2023 at 9:15 AM
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
