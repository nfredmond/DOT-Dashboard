"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import Image from 'next/image';

export default function RootPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Simply redirect to homepage which has its own auth logic
    router.push('/homepage');
  }, [router]);
  
  // Show loading screen while redirecting
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Add your logo here */}
        <div className="relative h-20 w-20 mb-4">
          <Image 
            src="/Circle_Green_TranspRoad.png" 
            alt="RTPA Planning Manager" 
            width={80} 
            height={80} 
            className="animate-pulse"
          />
        </div>
        
        {/* Animated spinner */}
        <Spinner size="lg" className="mb-4" />
        
        <h1 className="text-2xl font-bold text-primary">RTPA Planning Manager</h1>
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
