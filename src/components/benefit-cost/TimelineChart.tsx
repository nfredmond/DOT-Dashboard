import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ReferenceLine
} from "@/components/ui/chart";

interface TimelineChartProps {
  data: any[];
  valueKey: string;
  labelKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  formatValue?: (value: number) => string;
}

export function TimelineChart({
  data,
  valueKey,
  labelKey,
  xAxisLabel = 'Year',
  yAxisLabel = 'Value',
  title,
  formatValue = (value) => `$${value.toLocaleString()}`
}: TimelineChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-60 flex items-center justify-center text-muted-foreground">No data available</div>;
  }

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey={labelKey} 
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => `$${Math.abs(value) > 999 ? (value/1000).toFixed(0) + 'k' : value}`}
          />
          <Tooltip 
            formatter={(value: any) => formatValue(value)}
            labelFormatter={(label) => `${xAxisLabel} ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={valueKey}
            name={title || valueKey}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
          <ReferenceLine
            y={0}
            stroke="#000"
            strokeDasharray="3 3"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
} 