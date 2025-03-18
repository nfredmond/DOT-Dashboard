'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Text, ComposedChart, ReferenceLine
} from 'recharts';
import { BenefitCategory, BenefitCostAnalysisResult, CostCategory } from '@/types/benefit-cost';
import { Card, CardContent } from '@/components/ui/card';

// Color schemes
const BENEFIT_COLORS: Record<string, string> = {
  [BenefitCategory.TRAVEL_TIME_SAVINGS]: '#8884d8',
  [BenefitCategory.RELIABILITY]: '#82ca9d',
  [BenefitCategory.SAFETY]: '#ffc658',
  [BenefitCategory.EMISSIONS]: '#8dd1e1',
  [BenefitCategory.HEALTH]: '#a4de6c',
  [BenefitCategory.PROPERTY_VALUE]: '#d0ed57',
  [BenefitCategory.OTHER]: '#b0b0b0',
};

const COST_COLORS: Record<string, string> = {
  [CostCategory.CAPITAL]: '#ff8042',
  [CostCategory.OPERATIONS]: '#ff6361',
  [CostCategory.MAINTENANCE]: '#bc5090',
  [CostCategory.VEHICLES]: '#ffa600',
  [CostCategory.OTHER]: '#b0b0b0',
};

// Color palette for charts
const COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#ca8a04', // yellow-600
  '#dc2626', // red-600
  '#9333ea', // purple-600
  '#0891b2', // cyan-600
  '#f59e0b', // amber-600
  '#4f46e5', // indigo-600
  '#84cc16', // lime-600
  '#ec4899', // pink-600
];

// Format currency for tooltips
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

// Format percentage for tooltips
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

// Custom tooltips
const BenefitTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-sm">Present Value: ${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
      <p className="text-sm text-gray-600">
        {payload[0].payload.percentage.toFixed(1)}% of total benefits
      </p>
    </div>
  );
};

interface BenefitCostChartsProps {
  analysis: BenefitCostAnalysisResult;
  className?: string;
}

export function BenefitCostSummaryCharts({ analysis, className = '' }: BenefitCostChartsProps) {
  // No data check
  if (!analysis.benefits || analysis.benefits.length === 0) {
    return <div className="text-gray-500 italic">No benefit data available for visualization</div>;
  }
  
  // Prepare data for charts
  const benefitsPieData = analysis.benefits.map(benefit => ({
    name: benefit.category,
    value: benefit.presentValue,
    percentage: (benefit.presentValue / analysis.benefits.reduce((sum, b) => sum + b.presentValue, 0)) * 100
  }));
  
  const costsPieData = analysis.costs.map(cost => ({
    name: cost.category,
    value: cost.presentValue,
    percentage: (cost.presentValue / analysis.costs.reduce((sum, c) => sum + c.presentValue, 0)) * 100
  }));
  
  // Prepare annual data for time series
  const years = Array.from(
    new Set([
      ...analysis.annualBenefits.map(item => item.year),
      ...analysis.annualCosts.map(item => item.year)
    ])
  ).sort();
  
  const timeSeriesData = years.map(year => {
    // Sum benefits for this year
    const yearBenefits = analysis.annualBenefits
      .filter(b => b.year === year)
      .reduce((sum, b) => sum + (b.value || 0), 0);
    
    // Sum costs for this year
    const yearCosts = analysis.annualCosts
      .filter(c => c.year === year)
      .reduce((sum, c) => sum + (c.value || 0), 0);
    
    // Calculate net for this year
    const yearNet = yearBenefits - yearCosts;
    
    return {
      year,
      benefits: yearBenefits,
      costs: -yearCosts, // Negative for visualization
      net: yearNet
    };
  });
  
  // Cumulative data for payback visualization
  let cumulativeSum = 0;
  const cumulativeData = timeSeriesData.map(item => {
    cumulativeSum += item.net;
    return {
      year: item.year,
      cumulative: cumulativeSum
    };
  });
  
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Benefit-Cost Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeSeriesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                  >
                    <Text
                      x={-40}
                      y={20}
                      textAnchor="middle"
                      transform="rotate(-90)"
                    >
                      Present Value ($)
                    </Text>
                  </YAxis>
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar
                    dataKey="benefits"
                    name="Benefits"
                    fill={COLORS[0]}
                  />
                  <Bar
                    dataKey="costs"
                    name="Costs"
                    fill={COLORS[3]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Cash Flow Over Analysis Period</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                  >
                    <Text
                      x={-40}
                      y={20}
                      textAnchor="middle"
                      transform="rotate(-90)"
                    >
                      Cash Flow ($)
                    </Text>
                  </YAxis>
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="benefits"
                    name="Benefits"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="costs"
                    name="Costs"
                    stroke={COLORS[3]}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net Flow"
                    stroke={COLORS[4]}
                    strokeWidth={3}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Benefit Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={benefitsPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {benefitsPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BENEFIT_COLORS[entry.name] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Cost Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costsPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {costsPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COST_COLORS[entry.name] || COLORS[(index + 5) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface SensitivityChartProps {
  analysis: BenefitCostAnalysisResult;
  className?: string;
}

export function SensitivityAnalysisChart({ analysis, className = '' }: SensitivityChartProps) {
  // Check if sensitivity analysis exists
  if (!analysis.sensitivityAnalysis || !analysis.sensitivityAnalysis.results || analysis.sensitivityAnalysis.results.length === 0) {
    return <div className="text-gray-500 italic">No sensitivity analysis data available</div>;
  }
  
  // Sort by impact
  const sortedResults = [...analysis.sensitivityAnalysis.results].sort(
    (a, b) => Math.abs(b.impact) - Math.abs(a.impact)
  );
  
  // Tornado chart data
  const tornadoData = sortedResults.map(result => ({
    parameter: result.parameterName,
    low: Math.abs(result.baseValueResult - result.lowValueResult),
    high: Math.abs(result.highValueResult - result.baseValueResult),
    lowValue: result.lowValueResult,
    highValue: result.highValueResult,
    baseValue: result.baseValueResult
  }));
  
  return (
    <div className={`space-y-8 ${className}`}>
      <div>
        <h3 className="text-lg font-medium mb-2">Sensitivity Analysis (Tornado Diagram)</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={tornadoData}
              margin={{ top: 20, right: 50, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={[
                  Math.min(...sortedResults.map(r => r.lowValueResult)) * 0.9,
                  Math.max(...sortedResults.map(r => r.highValueResult)) * 1.1
                ]} 
              />
              <YAxis type="category" dataKey="parameter" />
              <Tooltip 
                formatter={(value, name, props: any) => {
                  if (typeof props?.payload?.lowValue === 'number' && name === 'Low') {
                    return [`BCR: ${props.payload.lowValue.toFixed(2)}`, 'Low Value'];
                  } else if (typeof props?.payload?.highValue === 'number' && name === 'High') {
                    return [`BCR: ${props.payload.highValue.toFixed(2)}`, 'High Value'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="low" name="Low" fill="#d32f2f" />
              <Bar dataKey="high" name="High" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Custom tooltip for currency values
const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${formatCurrency(Math.abs(entry.value))}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Add MonteCarloChart component to visualize Monte Carlo simulation results
export const MonteCarloChart = ({ results }: { results: any }) => {
  if (!results || !results.results || results.results.length === 0) {
    return <div>No simulation results available</div>;
  }

  // Find BCR results
  const bcrResults = results.results.find((r: any) => r.metric === 'benefitCostRatio');
  const npvResults = results.results.find((r: any) => r.metric === 'netPresentValue');

  if (!bcrResults || !bcrResults.distribution) {
    return <div>Incomplete simulation results</div>;
  }

  // Format data for histogram
  const bcrHistogramData = Object.entries(bcrResults.distribution).map(([value, count]: [string, any]) => ({
    value: parseFloat(value),
    count: count,
  }));

  // Calculate range for BCR values
  const bcrMinValue = Math.floor(Math.min(...bcrHistogramData.map(d => d.value)) * 10) / 10;
  const bcrMaxValue = Math.ceil(Math.max(...bcrHistogramData.map(d => d.value)) * 10) / 10;

  // Format data for cumulative distribution
  const bcrCumulativeData: Array<{value: number, count: number, cumulativeProbability: number}> = [];
  let cumulative = 0;
  for (let i = 0; i < bcrHistogramData.length; i++) {
    cumulative += bcrHistogramData[i].count;
    bcrCumulativeData.push({
      value: bcrHistogramData[i].value,
      count: bcrHistogramData[i].count,
      cumulativeProbability: cumulative / results.iterations,
    });
  }

  const colorPalette = {
    primary: '#2563eb',
    secondary: '#64748b',
    highlight: '#f97316',
    background: '#f1f5f9',
    gridLines: '#e2e8f0',
    tooltipBg: 'rgba(255, 255, 255, 0.9)',
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Benefit-Cost Ratio Distribution</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={bcrCumulativeData}
                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorPalette.gridLines} />
                <XAxis 
                  dataKey="value" 
                  type="number" 
                  domain={[bcrMinValue, bcrMaxValue]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toFixed(1)}
                  label={{ value: 'Benefit-Cost Ratio', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 1]}
                  tickFormatter={formatPercent}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Cumulative Probability', angle: -90, position: 'insideRight' }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'cumulativeProbability') {
                      return [`${(value * 100).toFixed(1)}%`, 'Cumulative Probability'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `BCR: ${parseFloat(label).toFixed(2)}`}
                />
                <Legend />
                
                {/* Histogram bars */}
                <Bar 
                  dataKey="count" 
                  yAxisId="left" 
                  fill={colorPalette.primary} 
                  name="Frequency"
                  barSize={15}
                >
                  {bcrCumulativeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value < 1 ? colorPalette.secondary : colorPalette.primary} 
                    />
                  ))}
                </Bar>
                
                {/* Cumulative probability line */}
                <Line 
                  type="monotone" 
                  dataKey="cumulativeProbability" 
                  yAxisId="right"
                  stroke={colorPalette.highlight} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="Cumulative Probability"
                />
                
                {/* Reference line at BCR = 1 */}
                <ReferenceLine
                  x={1}
                  stroke="red"
                  strokeDasharray="3 3"
                  label={{
                    value: 'BCR = 1',
                    position: 'top',
                    fill: 'red',
                    fontSize: 12
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <p>
              Showing distribution of potential Benefit-Cost Ratio outcomes based on {results.iterations} simulations.
              The cumulative probability line (orange) shows the likelihood of achieving a BCR below a given value.
            </p>
          </div>
        </div>
      </div>

      {npvResults && (
        <div>
          <h3 className="text-lg font-medium mb-3">Net Present Value Distribution</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(npvResults.distribution).map(([value, count]: [string, any]) => ({
                    value: parseFloat(value) / 1000, // Show in thousands
                    count: count,
                  }))}
                  margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorPalette.gridLines} />
                  <XAxis 
                    dataKey="value"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}K`}
                    label={{ value: 'Net Present Value (thousands)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Frequency']}
                    labelFormatter={(label) => `NPV: $${label * 1000}`}
                  />
                  
                  <Bar dataKey="count" fill={colorPalette.primary} name="Frequency">
                    {Object.entries(npvResults.distribution).map(([value, count], index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={parseFloat(value) < 0 ? colorPalette.secondary : colorPalette.primary} 
                      />
                    ))}
                  </Bar>
                  
                  {/* Reference line at NPV = 0 */}
                  <ReferenceLine
                    x={0}
                    stroke="red"
                    strokeDasharray="3 3"
                    label={{
                      value: 'NPV = 0',
                      position: 'top',
                      fill: 'red',
                      fontSize: 12
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <p>
                Showing distribution of potential Net Present Value outcomes based on {results.iterations} simulations.
                Values to the right of the red line indicate positive NPV.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// New component to visualize monetization parameters
interface MonetizationParametersChartProps {
  parameters: any; // Using any to accommodate both old and new parameter formats
  className?: string;
}

export function MonetizationParametersChart({ parameters, className = '' }: MonetizationParametersChartProps) {
  // Check if we have structured parameters
  const hasValueOfTime = parameters.valueOfTime && typeof parameters.valueOfTime === 'object';
  const hasEmissions = parameters.emissions && typeof parameters.emissions === 'object';
  const hasAccidentCosts = parameters.accidentCosts && typeof parameters.accidentCosts === 'object';
  const hasVehicleOperating = parameters.vehicleOperating && typeof parameters.vehicleOperating === 'object';
  const hasHealth = parameters.health && typeof parameters.health === 'object';

  // Prepare data for charts
  const valueOfTimeData = hasValueOfTime ? [
    { name: 'Commuter', value: Number(parameters.valueOfTime.commuter) },
    { name: 'Commercial', value: Number(parameters.valueOfTime.commercial) },
    { name: 'Freight', value: Number(parameters.valueOfTime.freight) }
  ] : [
    { name: 'Value of Time', value: Number(parameters.valueOfTime || parameters.valueOfTime_legacy || 0) }
  ];

  const emissionsData = hasEmissions ? [
    { name: 'CO₂', value: Number(parameters.emissions.co2) },
    { name: 'NOx', value: Number(parameters.emissions.nox) / 100 }, // Scaled for visualization
    { name: 'PM', value: Number(parameters.emissions.pm) / 1000 }  // Scaled for visualization
  ] : [
    { name: 'Emissions', value: Number(parameters.emissionsCostPerTon || 0) }
  ];

  const safetyData = hasAccidentCosts ? [
    { name: 'Fatal', value: Number(parameters.accidentCosts.fatal) / 100000 }, // Scaled for visualization
    { name: 'Injury', value: Number(parameters.accidentCosts.injury) / 1000 }, // Scaled for visualization
    { name: 'PDO', value: Number(parameters.accidentCosts.propertyDamage) }
  ] : [
    { name: 'Fatality', value: Number(parameters.fatalityCost || 0) / 100000 }, // Scaled for visualization
    { name: 'Injury', value: Number(parameters.injuryCost || 0) / 1000 }     // Scaled for visualization
  ];

  const vehicleData = hasVehicleOperating ? [
    { name: 'Fuel', value: Number(parameters.vehicleOperating.fuelCost) },
    { name: 'Maintenance', value: Number(parameters.vehicleOperating.maintenance) * 100 }, // Scaled for visualization
    { name: 'Depreciation', value: Number(parameters.vehicleOperating.depreciation) * 100 } // Scaled for visualization
  ] : [];

  const healthData = hasHealth ? [
    { name: 'Walking', value: Number(parameters.health.walking) * 10 }, // Scaled for visualization
    { name: 'Biking', value: Number(parameters.health.biking) * 10 }   // Scaled for visualization
  ] : [];

  // Tooltip formatters
  const formatValueOfTime = (value: any) => `$${Number(value)}/hour`;

  const formatEmissions = (value: any, name: any) => {
    const numValue = Number(value);
    if (name === 'CO₂') return `$${numValue}/metric ton`;
    if (name === 'NOx') return `$${numValue * 100}/ton`;
    if (name === 'PM') return `$${numValue * 1000}/ton`;
    return `$${numValue}/ton`;
  };

  const formatSafety = (value: any, name: any) => {
    const numValue = Number(value);
    if (name === 'Fatal') return `$${numValue * 100000}/accident`;
    if (name === 'Injury') return `$${numValue * 1000}/accident`;
    if (name === 'PDO') return `$${numValue}/accident`;
    if (name === 'Fatality') return `$${numValue * 100000}/accident`;
    return `$${numValue * 1000}/accident`;
  };

  const formatVehicle = (value: any, name: any) => {
    const numValue = Number(value);
    if (name === 'Fuel') return `$${numValue}/gallon`;
    if (name === 'Maintenance') return `$${numValue / 100}/mile`;
    return `$${numValue / 100}/mile`;
  };

  const formatHealth = (value: any) => `$${Number(value) / 10}/mile`;

  return (
    <div className={`space-y-8 ${className}`}>
      <h3 className="text-xl font-semibold">Monetization Parameters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Value of Time Chart */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-lg font-medium mb-4">Value of Time ($/hour)</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueOfTimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={formatValueOfTime} />
                  <Bar dataKey="value" fill={COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Emissions Chart */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-lg font-medium mb-4">Emissions Cost</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={formatEmissions} />
                  <Bar dataKey="value" fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Safety Costs Chart */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-lg font-medium mb-4">Safety Costs</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safetyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={formatSafety} />
                  <Bar dataKey="value" fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Operating Costs (if available) */}
        {hasVehicleOperating && (
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-lg font-medium mb-4">Vehicle Operating Costs</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicleData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={formatVehicle} />
                    <Bar dataKey="value" fill={COLORS[3]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Benefits (if available) */}
        {hasHealth && (
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-lg font-medium mb-4">Health Benefits</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={formatHealth} />
                    <Bar dataKey="value" fill={COLORS[4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 