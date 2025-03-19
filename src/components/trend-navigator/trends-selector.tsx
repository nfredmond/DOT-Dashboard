import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendsSelectorProps {
  availableTrends: any[];
  _selectedTrends?: string[];
  _onSelectTrend?: (trendKey: string) => void;
  _readOnly?: boolean;
}

export default function TrendsSelector({
  availableTrends = [],
  _selectedTrends = [],
  _onSelectTrend,
  _readOnly = false
}: TrendsSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {availableTrends.length === 0 ? (
          <p className="text-muted-foreground">No trends available.</p>
        ) : (
          <div>
            {/* Trends selector content would go here */}
            <p>Trends selector placeholder</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 