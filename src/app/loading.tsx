"use client";

import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Add logo */}
        <div className="relative h-20 w-20 mb-4">
          <Image 
            src="/Circle_Green_TranspRoad.png" 
            alt="Planning Manager" 
            width={80} 
            height={80} 
            className="animate-pulse"
          />
        </div>
        
        {/* Animated spinner */}
        <Spinner size="lg" className="mb-4" />
        
        <h1 className="text-2xl font-bold text-primary">Planning Manager</h1>
        <p className="text-muted-foreground animate-pulse">Loading your content...</p>
      </div>
    </div>
  );
} 