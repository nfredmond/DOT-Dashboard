import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PolicyPackagesEditorProps {
  packages: any[];
  _onChange?: (packages: any[]) => void;
}

export default function PolicyPackagesEditor({
  packages = [],
  _onChange
}: PolicyPackagesEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Packages</CardTitle>
      </CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <p className="text-muted-foreground">No policy packages configured yet.</p>
        ) : (
          <div className="space-y-4">
            {/* Rendering of policy packages would go here */}
            <p>Policy packages would be displayed here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 