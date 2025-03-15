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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BrainIcon,
  FileTextIcon,
  MessageSquareIcon,
  ClipboardIcon,
  CheckIcon,
  RefreshCwIcon,
  DownloadIcon,
  PencilIcon,
  ZapIcon,
  AlertCircleIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "lucide-react";

export default function LlmAssistant() {
  const [activeTab, setActiveTab] = useState("grant-support");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate API call to LLM
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
    }, 2000);
  };

  const handleReset = () => {
    setShowResult(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          LLM Assistant
        </h1>
        <p className="text-muted-foreground">
          AI-powered tools to enhance transportation planning and project
          management
        </p>
      </div>

      <Tabs
        defaultValue="grant-support"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="grant-support">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Grant Support
          </TabsTrigger>
          <TabsTrigger value="project-recommendations">
            <ZapIcon className="h-4 w-4 mr-2" />
            Project Recommendations
          </TabsTrigger>
          <TabsTrigger value="report-generation">
            <ClipboardIcon className="h-4 w-4 mr-2" />
            Report Generation
          </TabsTrigger>
          <TabsTrigger value="community-responses">
            <MessageSquareIcon className="h-4 w-4 mr-2" />
            Community Responses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grant-support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileTextIcon className="h-5 w-5 mr-2" />
                Grant Application Evaluation
              </CardTitle>
              <CardDescription>
                Analyze project descriptions against grant criteria for better
                alignment and higher success rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select Grant Program
                </label>
                <Select defaultValue="active-transportation">
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select grant program"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active-transportation">
                      Active Transportation Program (ATP)
                    </SelectItem>
                    <SelectItem value="cmaq">
                      Congestion Mitigation and Air Quality (CMAQ)
                    </SelectItem>
                    <SelectItem value="hsip">
                      Highway Safety Improvement Program (HSIP)
                    </SelectItem>
                    <SelectItem value="tircp">
                      Transit and Intercity Rail Capital Program (TIRCP)
                    </SelectItem>
                    <SelectItem value="infra">
                      Infrastructure For Rebuilding America (INFRA)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Project Description
                </label>
                <Textarea
                  placeholder="Enter your project description here..."
                  className="min-h-[150px]"
                  defaultValue={
                    showResult
                      ? "The Downtown Transit Center project will create a new multi-modal transit hub in downtown Sacramento, featuring improved accessibility for persons with disabilities, bicycle storage facilities, electric vehicle charging stations, and real-time transit information displays. The project aims to increase transit ridership by 15% within the first year of operation while reducing greenhouse gas emissions through improved transit connections and reduced private vehicle usage."
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Analysis Focus
                </label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                  >
                    Eligibility
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                  >
                    Scoring Potential
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                  >
                    Language Improvement
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                  >
                    Missing Elements
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                  >
                    Alignment with Criteria
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isGenerating || !showResult}
              >
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || showResult}
              >
                {isGenerating ? (
                  <>
                    <RefreshCwIcon
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BrainIcon className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {showResult && (
            <Card
              className="border-green-200 dark:border-green-900"
            >
              <CardHeader
                className="bg-green-50 dark:bg-green-900/20"
              >
                <CardTitle
                  className="text-green-700 dark:text-green-400 flex items-center"
                >
                  <CheckIcon className="mr-2 h-5 w-5" />
                  Grant Analysis Results
                </CardTitle>
                <CardDescription>
                  Analysis for Active Transportation Program (ATP) application
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Overall Assessment
                  </h3>
                  <div
                    className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md"
                  >
                    <p
                      className="text-green-700 dark:text-green-400 font-medium"
                    >
                      Your project has strong alignment with ATP goals (85%
                      match). With some minor improvements, this could be a
                      competitive application.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckIcon
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                      />
                      <span>
                        Strong focus on accessibility improvements for persons
                        with disabilities
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                      />
                      <span>
                        Inclusion of bicycle storage facilities supports active
                        transportation
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                      />
                      <span>
                        Clear metrics for success (15% ridership increase)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                      />
                      <span>
                        Environmental benefits through GHG reduction
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Improvement Opportunities
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <AlertCircleIcon
                        className="h-5 w-5 text-amber-500 mr-2 mt-0.5"
                      />
                      <div>
                        <p className="font-medium">
                          Add specific equity considerations
                        </p>
                        <p
                          className="text-sm text-muted-foreground"
                        >
                          ATP prioritizes projects that benefit disadvantaged
                          communities. Include demographic data and specific
                          benefits to underserved populations.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <AlertCircleIcon
                        className="h-5 w-5 text-amber-500 mr-2 mt-0.5"
                      />
                      <div>
                        <p className="font-medium">
                          Strengthen safety elements
                        </p>
                        <p
                          className="text-sm text-muted-foreground"
                        >
                          Mention specific safety improvements like improved
                          lighting, security cameras, or pedestrian crossing
                          enhancements.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <AlertCircleIcon
                        className="h-5 w-5 text-amber-500 mr-2 mt-0.5"
                      />
                      <div>
                        <p className="font-medium">
                          Include community engagement details
                        </p>
                        <p
                          className="text-sm text-muted-foreground"
                        >
                          ATP values community input. Describe any outreach
                          efforts or community support for the project.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Suggested Language Improvements
                  </h3>
                  <div
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md"
                  >
                    <p className="text-sm italic">
                      "The Downtown Transit Center project will create a new
                      multi-modal transit hub in downtown Sacramento,{" "}
                      <span
                        className="bg-yellow-100 dark:bg-yellow-900/30 px-1"
                      >
                        serving historically underserved communities and
                        improving transportation equity
                      </span>
                      . The center will feature improved accessibility for
                      persons with disabilities,{" "}
                      <span
                        className="bg-yellow-100 dark:bg-yellow-900/30 px-1"
                      >
                        enhanced safety measures including well-lit pathways and
                        24/7 security monitoring
                      </span>
                      , bicycle storage facilities, electric vehicle charging
                      stations, and real-time transit information displays.{" "}
                      <span
                        className="bg-yellow-100 dark:bg-yellow-900/30 px-1"
                      >
                        Developed with extensive input from local community
                        groups and neighborhood associations
                      </span>
                      , the project aims to increase transit ridership by 15%
                      within the first year of operation while reducing
                      greenhouse gas emissions through improved transit
                      connections and reduced private vehicle usage."
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <ThumbsUpIcon className="mr-2 h-4 w-4" />
                    Helpful
                  </Button>
                  <Button variant="outline" size="sm">
                    <ThumbsDownIcon className="mr-2 h-4 w-4" />
                    Not Helpful
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <PencilIcon className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <ClipboardIcon className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent
          value="project-recommendations"
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ZapIcon className="h-5 w-5 mr-2" />
                Project Improvement Recommendations
              </CardTitle>
              <CardDescription>
                Get AI-powered suggestions to enhance your transportation
                projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Select a project to receive intelligent recommendations based on
                successful similar projects and best practices.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Project
                  </label>
                  <Select defaultValue="highway-101">
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="highway-101">
                        Highway 101 Expansion
                      </SelectItem>
                      <SelectItem value="downtown-transit">
                        Downtown Transit Center
                      </SelectItem>
                      <SelectItem value="bike-network">
                        Bike Lane Network Expansion
                      </SelectItem>
                      <SelectItem value="bridge-retrofit">
                        Bridge Retrofit Project
                      </SelectItem>
                      <SelectItem value="light-rail">
                        Light Rail Extension
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Optimization Focus
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="cursor-pointer"
                    >
                      Safety
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary"
                    >
                      Cost Reduction
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer"
                    >
                      Environmental Impact
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary"
                    >
                      Accessibility
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary"
                    >
                      Community Benefits
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <BrainIcon className="mr-2 h-4 w-4" />
                Generate Recommendations
              </Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Similar Successful Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="space-y-2 p-3 bg-secondary/50 rounded-md"
                >
                  <div className="flex justify-between">
                    <h3 className="font-medium">
                      I-405 Improvement Project
                    </h3>
                    <Badge>95% Match</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Orange County, CA - Completed in 2022 with excellent safety
                    outcomes and under budget
                  </p>
                </div>

                <div
                  className="space-y-2 p-3 bg-secondary/50 rounded-md"
                >
                  <div className="flex justify-between">
                    <h3 className="font-medium">
                      I-5 North Coast Corridor
                    </h3>
                    <Badge>82% Match</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    San Diego, CA - Innovative environmental mitigation
                    strategies and community integration
                  </p>
                </div>

                <div
                  className="space-y-2 p-3 bg-secondary/50 rounded-md"
                >
                  <div className="flex justify-between">
                    <h3 className="font-medium">
                      US-101 Managed Lanes
                    </h3>
                    <Badge>78% Match</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    San Mateo, CA - Effective congestion management with express
                    lanes
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Best Practices & Innovations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-medium flex items-center">
                    <CheckIcon
                      className="h-4 w-4 text-green-500 mr-2"
                    />
                    Wildlife Crossing Structures
                  </h3>
                  <p className="text-sm text-muted-foreground pl-6">
                    Incorporate dedicated wildlife crossings to reduce animal
                    collisions and maintain habitat connectivity
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium flex items-center">
                    <CheckIcon
                      className="h-4 w-4 text-green-500 mr-2"
                    />
                    Smart Traffic Management Systems
                  </h3>
                  <p className="text-sm text-muted-foreground pl-6">
                    Implement AI-powered traffic flow optimization with
                    real-time adjustments
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium flex items-center">
                    <CheckIcon
                      className="h-4 w-4 text-green-500 mr-2"
                    />
                    Recycled Construction Materials
                  </h3>
                  <p className="text-sm text-muted-foreground pl-6">
                    Use recycled concrete aggregate and reclaimed asphalt
                    pavement to reduce environmental impact
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium flex items-center">
                    <CheckIcon
                      className="h-4 w-4 text-green-500 mr-2"
                    />
                    Community Art Integration
                  </h3>
                  <p className="text-sm text-muted-foreground pl-6">
                    Partner with local artists to incorporate public art into
                    infrastructure, enhancing community acceptance
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="report-generation"
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardIcon className="h-5 w-5 mr-2" />
                Automated Report Generation
              </CardTitle>
              <CardDescription>
                Create comprehensive reports with AI assistance
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
                    <SelectItem value="custom">
                      Custom Selection
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Report Elements
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label
                      htmlFor="exec-summary"
                      className="text-sm"
                    >
                      Executive Summary
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label
                      htmlFor="project-details"
                      className="text-sm"
                    >
                      Project Details
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label htmlFor="maps" className="text-sm">
                      Maps & Visuals
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label htmlFor="budget" className="text-sm">
                      Budget Analysis
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label htmlFor="timeline" className="text-sm">
                      Timeline
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label
                      htmlFor="recommendations"
                      className="text-sm"
                    >
                      Recommendations
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Output Format
                </label>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    PDF
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    Word
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Markdown
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Recently Generated Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                >
                  <div className="flex items-center">
                    <FileTextIcon
                      className="h-5 w-5 mr-3 text-blue-500"
                    />
                    <div>
                      <h3 className="font-medium">
                        Q2 2023 Transportation Plan Update
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Generated July 15, 2023
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                >
                  <div className="flex items-center">
                    <FileTextIcon
                      className="h-5 w-5 mr-3 text-green-500"
                    />
                    <div>
                      <h3 className="font-medium">
                        Active Transportation Grant Application
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Generated July 10, 2023
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                >
                  <div className="flex items-center">
                    <FileTextIcon
                      className="h-5 w-5 mr-3 text-purple-500"
                    />
                    <div>
                      <h3 className="font-medium">
                        Highway 101 Project Status Report
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Generated July 5, 2023
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="community-responses"
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquareIcon className="h-5 w-5 mr-2" />
                Community Feedback Response Assistant
              </CardTitle>
              <CardDescription>
                Generate consistent, thoughtful responses to community input
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Community Comment
                </label>
                <Textarea
                  placeholder="Paste community comment here..."
                  className="min-h-[100px]"
                  defaultValue="I'm concerned about the proposed bike lane on Main Street. While I support more bike infrastructure, removing parking spaces will hurt local businesses. Has the agency considered alternatives that preserve parking while still improving bike safety?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Related Project
                </label>
                <Select defaultValue="bike-network">
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select related project"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike-network">
                      Bike Lane Network Expansion
                    </SelectItem>
                    <SelectItem value="downtown-transit">
                      Downtown Transit Center
                    </SelectItem>
                    <SelectItem value="highway-101">
                      Highway 101 Expansion
                    </SelectItem>
                    <SelectItem value="none">
                      No Specific Project
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Response Tone
                </label>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    Formal
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    Conversational
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Technical
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Include in Response
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label
                      htmlFor="acknowledge"
                      className="text-sm"
                    >
                      Acknowledge Concerns
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label
                      htmlFor="project-context"
                      className="text-sm"
                    >
                      Project Context
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label htmlFor="data-stats" className="text-sm">
                      Data & Statistics
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      defaultChecked
                    />

                    <label htmlFor="next-steps" className="text-sm">
                      Next Steps
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <MessageSquareIcon className="mr-2 h-4 w-4" />
                Draft Response
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Generated Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="p-4 bg-secondary/50 rounded-md space-y-4"
              >
                <p>
                  Thank you for sharing your concerns about the proposed bike
                  lane on Main Street. We appreciate your support for bike
                  infrastructure while also highlighting the importance of
                  parking for local businesses.
                </p>
                <p>
                  We have studied several alternatives that aim to balance the
                  needs of all street users. Our traffic studies indicate that
                  the current proposal would remove 12 parking spaces, but our
                  business impact analysis suggests that nearby side streets and
                  the municipal lot have sufficient capacity to absorb this
                  change, especially during peak hours.
                </p>
                <p>
                  However, we're actively exploring a modified design that would
                  preserve 8 of these spaces by narrowing the bike lane at
                  certain points and implementing a shared-lane configuration in
                  the most constrained areas. This approach has been successful
                  in similar corridors in neighboring communities.
                </p>
                <p>
                  We'll be presenting these alternatives at the upcoming
                  community workshop on August 15th at the Community Center.
                  We'd welcome your participation and further input as we refine
                  the design to best serve all community members.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <ThumbsUpIcon className="mr-2 h-4 w-4" />
                  Helpful
                </Button>
                <Button variant="outline" size="sm">
                  <ThumbsDownIcon className="mr-2 h-4 w-4" />
                  Not Helpful
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <ClipboardIcon className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
