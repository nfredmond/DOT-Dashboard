"use client";

import React from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

type ChartData = {
  name: string;
  [key: string]: any;
};

interface BarChartProps {
  data: ChartData[];
}

// Export as component
export const BarChart = ({ data }: BarChartProps) => {
  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <RechartsBarChart data={data}>
          <Tooltip />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
          />
          <Bar
            dataKey="active"
            fill="hsl(var(--chart-1, 222.2 47.4% 55.2%))"
            radius={4}
            animationDuration={1200}
            animationBegin={200}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="completed"
            fill="hsl(var(--chart-2, 143.8 61.2% 60.6%))"
            radius={4}
            animationDuration={1200}
            animationBegin={400}
            animationEasing="ease-out"
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface LineChartProps {
  data: ChartData[];
}

// Export as component
export const LineChart = ({ data }: LineChartProps) => {
  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <RechartsLineChart data={data}>
          <Tooltip />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--chart-1, 222.2 47.4% 55.2%))"
            strokeWidth={2}
            dot={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Named exports for individual components AND a default export for the module
const Charts = {
  BarChart,
  LineChart
};

export default Charts; 