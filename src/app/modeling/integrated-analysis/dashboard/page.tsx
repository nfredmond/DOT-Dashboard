"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import IntegratedAnalysisDashboard from '@/components/modeling/IntegratedAnalysisDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function IntegratedAnalysisDashboardPage() {
  const searchParams = useSearchParams();
  
  const projectId = searchParams?.get('projectId') || null;
  const scenarioId = searchParams?.get('scenarioId') || null;
  const analysisId = searchParams?.get('analysisId') || null;

  if (!projectId) {
    return (
      <ProtectedRoute>
        <div className="container py-6">
          <div className="rounded-lg border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
            <p className="text-muted-foreground">
              Please select a project from the integrated analysis configuration page.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container py-6">
        <IntegratedAnalysisDashboard 
          projectId={projectId}
          scenarioId={scenarioId || undefined}
          analysisId={analysisId || undefined}
        />
      </div>
    </ProtectedRoute>
  );
} 