import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TimelineEditorProps {
  baseYear: number;
  horizonYears: number[];
  onHorizonYearsChange?: (years: number[]) => void;
  error?: string;
  readOnly?: boolean;
}

export default function TimelineEditor({
  baseYear,
  horizonYears,
  onHorizonYearsChange,
  error,
  readOnly = false
}: TimelineEditorProps) {
  const handleAddYear = () => {
    if (!onHorizonYearsChange) return;
    const lastYear = horizonYears[horizonYears.length - 1] || baseYear;
    onHorizonYearsChange([...horizonYears, lastYear + 10]);
  };

  const handleRemoveYear = (index: number) => {
    if (!onHorizonYearsChange) return;
    onHorizonYearsChange(horizonYears.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Base Year: {baseYear}</Label>
        </div>
        <div className="space-y-2">
          <Label>Horizon Years</Label>
          {horizonYears.map((year, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="number"
                value={year}
                onChange={(e) => {
                  if (!onHorizonYearsChange) return;
                  const newYears = [...horizonYears];
                  newYears[index] = parseInt(e.target.value);
                  onHorizonYearsChange(newYears);
                }}
                disabled={readOnly}
                className="w-32"
              />
              {!readOnly && horizonYears.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveYear(index)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddYear}
              className="mt-2"
            >
              Add Horizon Year
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 