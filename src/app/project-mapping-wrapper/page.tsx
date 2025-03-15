"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import of the ProjectMapping page to avoid SSR issues with Leaflet
const DynamicProjectMapping = dynamic(
  () => import('../project-mapping/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg font-medium">Loading map components...</p>
          <p className="mt-2 text-sm text-muted-foreground">This may take a moment</p>
        </div>
      </div>
    )
  }
);

export default function ProjectMappingWrapper() {
  return (
    <Suspense fallback={
      <div className="h-full w-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg font-medium">Loading map</p>
        </div>
      </div>
    }>
      <DynamicProjectMapping />
    </Suspense>
  );
} 