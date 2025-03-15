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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileTextIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  ArrowUpDownIcon,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Mock data for reports
  const reports = [
    {
      id: 1,
      title: "Q2 2023 Transportation Plan Update",
      type: "Transportation Plan",
      status: "Published",
      date: "2023-07-15",
      author: "Alex Johnson",
      projects: 24,
    },
    {
      id: 2,
      title: "Active Transportation Grant Application",
      type: "Grant Application",
      status: "Draft",
      date: "2023-07-10",
      author: "Maria Rodriguez",
      projects: 3,
    },
    {
      id: 3,
      title: "Highway 101 Project Status Report",
      type: "Project Status",
      status: "Published",
      date: "2023-07-05",
      author: "David Chen",
      projects: 1,
    },
    {
      id: 4,
      title: "Bike Lane Network Environmental Assessment",
      type: "Environmental",
      status: "Under Review",
      date: "2023-06-28",
      author: "Sarah Wilson",
      projects: 5,
    },
    {
      id: 5,
      title: "Downtown Transit Center Public Feedback Summary",
      type: "Public Outreach",
      status: "Published",
      date: "2023-06-22",
      author: "James Taylor",
      projects: 1,
    },
    {
      id: 6,
      title: "Annual Transportation Improvement Program",
      type: "Transportation Plan",
      status: "Published",
      date: "2023-06-15",
      author: "Alex Johnson",
      projects: 18,
    },
    {
      id: 7,
      title: "Bridge Retrofit Project Funding Request",
      type: "Grant Application",
      status: "Draft",
      date: "2023-06-10",
      author: "Maria Rodriguez",
      projects: 5,
    },
  ];

  // Filter reports based on active tab
  const filteredReports = reports.filter((report) => {
    if (activeTab === "all") return true;
    if (activeTab === "published") return report.status === "Published";
    if (activeTab === "drafts") return report.status === "Draft";
    if (activeTab === "review") return report.status === "Under Review";
    return true;
  });

  // Filter reports based on search query
  const searchedReports = filteredReports.filter((report) => {
    if (!searchQuery) return true;
    return (
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Sort reports based on sort criteria
  const sortedReports = [...searchedReports].sort((a, b) => {
    if (sortBy === "date") {
      return sortOrder === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === "title") {
      return sortOrder === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortBy === "type") {
      return sortOrder === "asc"
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    }
    return 0;
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-500";
      case "Draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-500";
      case "Under Review":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-500";
      default:
        return "";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Transportation Plan":
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      case "Grant Application":
        return <FileTextIcon className="h-4 w-4 text-green-500" />;
      case "Project Status":
        return <FileTextIcon className="h-4 w-4 text-purple-500" />;
      case "Environmental":
        return <FileTextIcon className="h-4 w-4 text-teal-500" />;
      case "Public Outreach":
        return <FileTextIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <FileTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Browse and manage your transportation planning reports
          </p>
        </div>

        <div
          className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between"
        >
          <Tabs
            defaultValue="all"
            onValueChange={setActiveTab}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All Reports
              </TabsTrigger>
              <TabsTrigger value="published">
                Published
              </TabsTrigger>
              <TabsTrigger value="drafts">
                Drafts
              </TabsTrigger>
              <TabsTrigger value="review">
                Under Review
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="w-full sm:w-auto">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Report
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <CardTitle>Report Library</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <SearchIcon
                    className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                  />

                  <Input
                    placeholder="Search reports..."
                    className="pl-8 w-full sm:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Types
                    </SelectItem>
                    <SelectItem value="plan">
                      Transportation Plan
                    </SelectItem>
                    <SelectItem value="grant">
                      Grant Application
                    </SelectItem>
                    <SelectItem value="status">
                      Project Status
                    </SelectItem>
                    <SelectItem value="environmental">
                      Environmental
                    </SelectItem>
                    <SelectItem value="outreach">
                      Public Outreach
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <FilterIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => {
                        setSortBy("title");
                        toggleSortOrder();
                      }}
                    >
                      Report Title
                      {sortBy === "title" && (
                        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => {
                        setSortBy("type");
                        toggleSortOrder();
                      }}
                    >
                      Type
                      {sortBy === "type" && (
                        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => {
                        setSortBy("date");
                        toggleSortOrder();
                      }}
                    >
                      Date
                      {sortBy === "date" && (
                        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReports.map((report, index) => (
                  <TableRow key={report.id} id={`do8kpr_${index}`}>
                    <TableCell className="font-medium" id={`n6ifi3_${index}`}>
                      <div className="flex items-center" id={`acx1m4_${index}`}>
                        {getTypeIcon(report.type)}
                        <span className="ml-2" id={`1cs80o_${index}`}>
                          {report.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell id={`0z8pkq_${index}`}>{report.type}</TableCell>
                    <TableCell id={`5n9h59_${index}`}>
                      <Badge
                        className={getStatusColor(report.status)}
                        id={`5t96vo_${index}`}
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell id={`frxq9a_${index}`}>
                      <div className="flex items-center" id={`8ow9nb_${index}`}>
                        <CalendarIcon
                          className="mr-2 h-4 w-4 text-muted-foreground"
                          id={`seluod_${index}`}
                        />

                        {new Date(report.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell id={`ncupyo_${index}`}>{report.author}</TableCell>
                    <TableCell className="text-right" id={`uuvfqh_${index}`}>
                      <Button variant="ghost" size="sm" id={`ldl7ic_${index}`}>
                        View
                      </Button>
                      <Button variant="ghost" size="sm" id={`2h9oju_${index}`}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {sortedReports.length} of {reports.length} reports
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Recently generated or modified reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )
                  .slice(0, 5)
                  .map((report, index) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                      id={`krsfnz_${index}`}
                    >
                      <div className="flex items-center" id={`an4882_${index}`}>
                        {getTypeIcon(report.type)}
                        <div className="ml-3" id={`aajvyk_${index}`}>
                          <h3 className="font-medium" id={`c68wnx_${index}`}>
                            {report.title}
                          </h3>
                          <p
                            className="text-xs text-muted-foreground"
                            id={`21ljzt_${index}`}
                          >
                            {new Date(report.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" id={`7yjniz_${index}`}>
                        <DownloadIcon
                          className="h-4 w-4"
                          id={`5qsg3f_${index}`}
                        />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>
                Create a new report using AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Report Type
                </label>
                <Select defaultValue="transportation-plan">
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transportation-plan">
                      Transportation Plan Summary
                    </SelectItem>
                    <SelectItem value="grant-application">
                      Grant Application
                    </SelectItem>
                    <SelectItem value="project-status">
                      Project Status Report
                    </SelectItem>
                    <SelectItem value="environmental">
                      Environmental Impact Assessment
                    </SelectItem>
                    <SelectItem value="public-outreach">
                      Public Outreach Summary
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Include Projects
                </label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select projects to include"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Active Projects
                    </SelectItem>
                    <SelectItem value="highway">
                      Highway Projects Only
                    </SelectItem>
                    <SelectItem value="transit">
                      Transit Projects Only
                    </SelectItem>
                    <SelectItem value="active">
                      Active Transportation Only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Target Audience
                </label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select target audience"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Stakeholders
                    </SelectItem>
                    <SelectItem value="technical">
                      Technical Stakeholders
                    </SelectItem>
                    <SelectItem value="public">
                      General Public
                    </SelectItem>
                    <SelectItem value="decision-makers">
                      Decision Makers
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
