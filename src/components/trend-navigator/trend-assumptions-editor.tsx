import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendAssumptionsEditorProps {
  assumptions?: any[];
  onChange?: (assumptions: any[]) => void;
  baseYear?: number;
  horizonYears?: number[];
}

export default function TrendAssumptionsEditor({
  assumptions = [],
  onChange,
  baseYear,
  horizonYears
}: TrendAssumptionsEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Assumptions</CardTitle>
      </CardHeader>
      <CardContent>
        {assumptions.length === 0 ? (
          <p className="text-muted-foreground">No assumptions configured yet.</p>
        ) : (
          <div className="space-y-4">
            {/* Rendering of assumptions would go here */}
            <p>Assumptions would be displayed here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 