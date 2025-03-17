"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, DollarSign, Clock, BarChart3, TrendingUp, PieChart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BenefitCostHelp() {
  return (
    <div className="space-y-6 w-full pb-10">
      <div className="flex items-center gap-2">
        <Link href="/help" passHref>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Benefit-Cost Analysis
        </h1>
      </div>
      <p className="text-muted-foreground">
        Learn how to use the Benefit-Cost Analysis module to evaluate the economic efficiency of transportation projects
      </p>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parameters">Monetization Parameters</TabsTrigger>
          <TabsTrigger value="analysis">Creating Analysis</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Features</TabsTrigger>
          <TabsTrigger value="integration">Model Integration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-blue-500" />
                What is Benefit-Cost Analysis?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Benefit-Cost Analysis (BCA) is a systematic approach to evaluating the economic efficiency of transportation projects by comparing the monetized benefits with the costs over the project's lifecycle.
              </p>
              <p>
                The Planning Manager's BCA module helps you:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Calculate key economic metrics including Net Present Value (NPV), Benefit-Cost Ratio (BCR), Internal Rate of Return (IRR), and Payback Period</li>
                <li>Monetize benefits across multiple categories including travel time savings, safety improvements, emissions reductions, and health benefits</li>
                <li>Track project costs including capital, maintenance, and operations costs</li>
                <li>Perform sensitivity analysis and Monte Carlo simulations to account for uncertainty</li>
                <li>Compare multiple project alternatives side-by-side</li>
                <li>Integrate with travel demand models for data-driven analysis</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                Key Metrics Explained
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Net Present Value (NPV)</h3>
                  <p className="text-sm">The difference between the present value of benefits and costs. A positive NPV indicates an economically viable project.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Benefit-Cost Ratio (BCR)</h3>
                  <p className="text-sm">The ratio of present value benefits to present value costs. A BCR greater than 1.0 indicates benefits exceed costs.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Internal Rate of Return (IRR)</h3>
                  <p className="text-sm">The discount rate at which NPV equals zero. Higher IRR values indicate better returns on investment.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Payback Period</h3>
                  <p className="text-sm">The time required for cumulative benefits to equal costs. Shorter payback periods indicate faster returns.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                Structured Monetization Parameters
              </CardTitle>
              <CardDescription>
                The system uses categorized parameters to ensure consistent valuation across analyses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Planning Manager now supports a structured format for monetization parameters, organized by benefit category:
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="value-of-time">
                  <AccordionTrigger className="font-semibold">Value of Time</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Configure different values for various traveler types:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Commuter Value of Time:</strong> Value per hour for commuters ($/hour)</li>
                      <li><strong>Commercial Value of Time:</strong> Value per hour for business travelers ($/hour)</li>
                      <li><strong>Freight Value of Time:</strong> Value per hour for freight transportation ($/hour)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      These values are used to monetize travel time savings for different user groups.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="emissions">
                  <AccordionTrigger className="font-semibold">Emissions Costs</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Set monetary values for different emission types:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>CO2:</strong> Cost per metric ton of carbon dioxide ($/ton)</li>
                      <li><strong>NOx:</strong> Cost per ton of nitrogen oxides ($/ton)</li>
                      <li><strong>PM:</strong> Cost per ton of particulate matter ($/ton)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      These values are used to monetize emissions reductions resulting from the project.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="safety">
                  <AccordionTrigger className="font-semibold">Safety/Accident Costs</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Define costs for different accident severities:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Fatal:</strong> Cost per fatal accident ($/accident)</li>
                      <li><strong>Injury:</strong> Cost per injury accident ($/accident)</li>
                      <li><strong>Property Damage:</strong> Cost per property damage only accident ($/accident)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      These values are used to monetize safety improvements and crash reductions.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vehicle">
                  <AccordionTrigger className="font-semibold">Vehicle Operating Costs</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Set costs related to vehicle operation:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Fuel Cost:</strong> Cost per gallon of fuel ($/gallon)</li>
                      <li><strong>Maintenance:</strong> Vehicle maintenance cost per mile ($/mile)</li>
                      <li><strong>Depreciation:</strong> Vehicle depreciation cost per mile ($/mile)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      These values are used to monetize changes in vehicle operating costs.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="health">
                  <AccordionTrigger className="font-semibold">Health Benefits</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Define health benefit values for active transportation:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Walking:</strong> Health benefit per mile walked ($/mile)</li>
                      <li><strong>Biking:</strong> Health benefit per mile biked ($/mile)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      These values are used to monetize health benefits from increased active transportation.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <h3 className="font-semibold text-blue-700 mb-2">Backward Compatibility</h3>
                <p className="text-sm">
                  The system maintains backward compatibility with legacy parameters. Any existing analyses will continue to work, and the system will automatically map legacy parameters to the new structured format when appropriate.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-purple-500" />
                Creating a Benefit-Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal pl-5 space-y-4">
                <li>
                  <strong>Navigate to the project page</strong>
                  <p className="text-sm">Open the project you want to analyze and click on the "Benefit-Cost" tab.</p>
                </li>
                <li>
                  <strong>Create a new analysis</strong>
                  <p className="text-sm">Click the "New Analysis" button and fill in the basic information:</p>
                  <ul className="list-disc pl-5 text-sm mt-1">
                    <li>Analysis Name (e.g., "Main Street Improvement BCA")</li>
                    <li>Description (optional)</li>
                    <li>Base Year (the year costs and benefits begin)</li>
                    <li>Analysis Horizon (how many years to analyze, typically 20-30 years)</li>
                    <li>Discount Rate (typically 3% or 7% based on agency guidelines)</li>
                  </ul>
                </li>
                <li>
                  <strong>Configure monetization parameters</strong>
                  <p className="text-sm">Set the values for each parameter category as described in the "Parameters" tab.</p>
                </li>
                <li>
                  <strong>Add benefits</strong>
                  <p className="text-sm">Click "Add Benefit" and for each benefit:</p>
                  <ul className="list-disc pl-5 text-sm mt-1">
                    <li>Select a benefit category (Travel Time Savings, Safety, etc.)</li>
                    <li>Enter the annual value or specific yearly values</li>
                    <li>Set growth rate if applicable</li>
                    <li>Add notes explaining your assumptions</li>
                  </ul>
                </li>
                <li>
                  <strong>Add costs</strong>
                  <p className="text-sm">Click "Add Cost" and for each cost:</p>
                  <ul className="list-disc pl-5 text-sm mt-1">
                    <li>Select a cost category (Capital, Maintenance, Operations, etc.)</li>
                    <li>Enter costs by year or as annual values</li>
                    <li>Add notes explaining your assumptions</li>
                  </ul>
                </li>
                <li>
                  <strong>Save the analysis</strong>
                  <p className="text-sm">Click "Save" to calculate and store your analysis.</p>
                </li>
                <li>
                  <strong>View results</strong>
                  <p className="text-sm">The system will display key metrics, charts, and timelines showing your analysis results.</p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-amber-500" />
                Advanced Analysis Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Sensitivity Analysis</h3>
                <p className="mb-2">Sensitivity analysis helps you understand how changes in key parameters affect your results:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>From the analysis detail page, click the "Sensitivity" tab</li>
                  <li>Select parameters to test (discount rate, benefit values, etc.)</li>
                  <li>Specify low, base, and high values for each parameter</li>
                  <li>Click "Run Sensitivity Analysis"</li>
                  <li>View tornado charts showing how each parameter affects the results</li>
                  <li>Review switching-point analysis that shows when BCR crosses the 1.0 threshold</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Monte Carlo Risk Analysis</h3>
                <p className="mb-2">Monte Carlo simulation uses probability distributions to model uncertainty:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>From the analysis detail page, click the "Risk" tab</li>
                  <li>Configure parameters and their distributions:
                    <ul className="list-disc pl-5 text-sm mt-1">
                      <li>Normal distribution (mean and standard deviation)</li>
                      <li>Uniform distribution (min and max)</li>
                      <li>Triangular distribution (min, most likely, max)</li>
                    </ul>
                  </li>
                  <li>Set the number of iterations (default is 1000)</li>
                  <li>Click "Run Simulation"</li>
                  <li>View results including:
                    <ul className="list-disc pl-5 text-sm mt-1">
                      <li>Probability distributions for key metrics</li>
                      <li>Confidence intervals</li>
                      <li>Probability of positive NPV</li>
                      <li>Probability of BCR {'>'}= 1</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Comparing Multiple Analyses</h3>
                <p className="mb-2">Compare different project alternatives or scenarios:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>On the project's benefit-cost page, select multiple analyses using checkboxes</li>
                  <li>Click "Compare Selected"</li>
                  <li>View side-by-side comparison of key metrics</li>
                  <li>Compare timelines and benefit/cost breakdowns</li>
                  <li>Export comparison to PDF or Excel</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-indigo-500" />
                Integrating with Models
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Planning Manager can integrate travel demand model outputs from CAMP and TrendNavigator directly into your benefit-cost analysis:
              </p>

              <div className="border rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">CAMP Integration</h3>
                <p className="text-sm mb-2">
                  Connect your benefit-cost analysis with CAMP travel demand model outputs:
                </p>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>From the analysis detail page, click "Import Data"</li>
                  <li>Select "CAMP Integration"</li>
                  <li>Choose the CAMP model run to use</li>
                  <li>Configure integration options:
                    <ul className="list-disc pl-5 text-xs mt-1">
                      <li>Travel time data mapping</li>
                      <li>Emissions data mapping</li>
                      <li>Safety data mapping</li>
                      <li>Vehicle operating cost data mapping</li>
                    </ul>
                  </li>
                  <li>Click "Import" to incorporate model data into your analysis</li>
                </ol>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">TrendNavigator Integration</h3>
                <p className="text-sm mb-2">
                  Use TrendNavigator scenario outputs in your benefit-cost analysis:
                </p>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>From the analysis detail page, click "Import Data"</li>
                  <li>Select "TrendNavigator Integration"</li>
                  <li>Choose the scenario to use</li>
                  <li>Map TrendNavigator metrics to benefit categories</li>
                  <li>Click "Import" to update your analysis with scenario data</li>
                </ol>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                <h3 className="font-semibold text-yellow-700 mb-2">Important Notes</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Ensure your monetization parameters are consistent with the units used in your model outputs</li>
                  <li>Verify the analysis horizon matches or exceeds the timeframe of your model results</li>
                  <li>Document assumptions about how model data is translated into monetary benefits</li>
                  <li>Consider performing sensitivity analysis on key model outputs</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-between">
        <Link href="/help" passHref>
          <Button variant="outline">Back to Help Center</Button>
        </Link>
        <Link href="/help/user-manual" passHref>
          <Button>View Full User Manual</Button>
        </Link>
      </div>
    </div>
  );
} 