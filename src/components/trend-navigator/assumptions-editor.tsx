import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AssumptionsEditorProps {
  assumptions: any;
  _onUpdate: (assumptions: any) => void;
  _readOnly?: boolean;
}

export default function AssumptionsEditor({
  assumptions = [],
  _onUpdate,
  _readOnly = false
}: AssumptionsEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Assumptions</CardTitle>
      </CardHeader>
      <CardContent>
        {assumptions.length === 0 ? (
          <p className="text-muted-foreground">No assumptions defined yet.</p>
        ) : (
          <div>
            {/* Assumptions editor content would go here */}
            <p>Assumptions content placeholder</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 