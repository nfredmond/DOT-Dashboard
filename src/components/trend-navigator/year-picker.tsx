import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface YearPickerProps {
  baseYear: number;
  horizonYears: number[];
  onBaseYearChange?: (year: number) => void;
  onHorizonYearsChange?: (years: number[]) => void;
  readOnly?: boolean;
}

export default function YearPicker({
  baseYear,
  horizonYears,
  onBaseYearChange,
  onHorizonYearsChange,
  readOnly = false
}: YearPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="baseYear">Base Year</Label>
        <Input
          id="baseYear"
          type="number"
          value={baseYear}
          onChange={(e) => onBaseYearChange?.(parseInt(e.target.value))}
          disabled={readOnly}
          className="mt-1"
        />
      </div>
      
      <div>
        <Label>Horizon Years</Label>
        <div className="flex flex-wrap gap-2 mt-1">
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
                className="w-24"
              />
              {!readOnly && horizonYears.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!onHorizonYearsChange) return;
                    onHorizonYearsChange(horizonYears.filter((_, i) => i !== index));
                  }}
                >
                  &times;
                </Button>
              )}
            </div>
          ))}
          
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!onHorizonYearsChange) return;
                onHorizonYearsChange([...horizonYears, baseYear + 20]);
              }}
            >
              Add Year
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 