"use client"

import { ProjectWizardProvider } from '@/contexts/ProjectWizardContext';
import { ProjectWizardWrapper } from '@/components/projects/ProjectWizardWrapper';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { memo } from 'react';

const MemoizedProjectWizardWrapper = memo(ProjectWizardWrapper);

export default function NewProjectPage() {
  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-muted-foreground">
            Use this wizard to create a new transportation project with all necessary details.
          </p>
        </div>
        
        <ProjectWizardProvider>
          <MemoizedProjectWizardWrapper />
        </ProjectWizardProvider>
      </div>
    </ProtectedRoute>
  );
} 