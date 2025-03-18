import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, ComposedChart, Line
} from 'recharts';

// Define the color palette
const colorPalette = {
  benefit: '#3b82f6', // Blue
  cost: '#ef4444',    // Red
  netBenefit: '#10b981', // Green
  breakeven: '#f59e0b',  // Amber
  tooltip: 'rgba(255, 255, 255, 0.9)',
  grid: '#e5e7eb'
};

interface TimelineChartProps {
  data: any;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  if (!data || !data.netBenefitsTimeline || data.netBenefitsTimeline.length === 0) {
    return <div>No timeline data available</div>;
  }

  // Format currency for the tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare the data for the chart
  const chartData = data.netBenefitsTimeline.map((item: any) => ({
    year: item.year,
    benefit: item.benefitValue,
    cost: item.costValue,
    netBenefit: item.netBenefit,
    cumulativeNPV: item.cumulativeNetBenefits
  }));

  // Create a component that can display multiple charts
  return (
    <div className="space-y-8">
      {/* Cash Flow Chart (Benefits and Costs by Year) */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorPalette.grid} />
            <XAxis 
              dataKey="year"
              label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Annual Value ($)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip 
              formatter={(value: any) => formatCurrency(value)}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{ backgroundColor: colorPalette.tooltip }}
            />
            <Legend />
            <Bar 
              dataKey="benefit" 
              name="Annual Benefits" 
              fill={colorPalette.benefit} 
              yAxisId="left"
              barSize={20}
            />
            <Bar 
              dataKey="cost" 
              name="Annual Costs" 
              fill={colorPalette.cost} 
              yAxisId="left"
              barSize={20}
            />
            <Line
              dataKey="netBenefit"
              name="Net Benefit"
              stroke={colorPalette.netBenefit}
              strokeWidth={2}
              dot={false}
              yAxisId="left"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative NPV Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorPalette.grid} />
            <XAxis 
              dataKey="year"
              label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: 'Cumulative NPV ($)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip 
              formatter={(value: any) => formatCurrency(value)}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{ backgroundColor: colorPalette.tooltip }}
            />
            <ReferenceLine 
              y={0} 
              stroke="#000" 
              strokeDasharray="3 3"
              label={{ 
                value: 'Break-even', 
                position: 'right',
                fill: colorPalette.breakeven,
                fontSize: 12
              }}
            />
            {data.paybackYear && (
              <ReferenceLine 
                x={Math.ceil(data.paybackYear)} 
                stroke={colorPalette.breakeven} 
                strokeDasharray="3 3"
                label={{ 
                  value: `Payback at ${data.paybackYear.toFixed(1)} years`, 
                  position: 'top',
                  fill: colorPalette.breakeven,
                  fontSize: 12
                }}
              />
            )}
            <Area 
              type="monotone" 
              dataKey="cumulativeNPV" 
              name="Cumulative NPV" 
              fill={colorPalette.netBenefit} 
              stroke={colorPalette.netBenefit}
              fillOpacity={0.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stacked Benefits/Costs by Category */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.netBenefitsTimeline.slice(0, 10)} // First 10 years
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorPalette.grid} />
            <XAxis 
              dataKey="year"
              label={{ value: 'Year (first 10 years)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              tickFormatter={(value) => `$${value / 1000}k`}
              label={{ value: 'Value ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: any) => formatCurrency(value)}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{ backgroundColor: colorPalette.tooltip }}
            />
            <Legend />
            {/* Show categories with most prominent ones first */}
            {data.benefitCategories.slice(0, 5).map((category: string, index: number) => (
              <Bar 
                key={`benefit-${index}`}
                dataKey={(entry) => {
                  const yearData = data.yearlyBenefits.find((d: any) => d.year === entry.year);
                  return yearData?.[category] || 0;
                }}
                name={`${category} Benefits`}
                stackId="benefits"
                fill={`hsl(${210 + (index * 15)}, 80%, 60%)`}
              />
            ))}
            {data.costCategories.slice(0, 5).map((category: string, index: number) => (
              <Bar 
                key={`cost-${index}`}
                dataKey={(entry) => {
                  const yearData = data.yearlyCosts.find((d: any) => d.year === entry.year);
                  return -(yearData?.[category] || 0); // Negate to show below x-axis
                }}
                name={`${category} Costs`}
                stackId="costs"
                fill={`hsl(${0 + (index * 15)}, 80%, 60%)`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 